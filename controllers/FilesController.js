import mongoDBCore from 'mongodb/lib/core';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { v4 } from 'uuid';
import {
  mkdir,
  realpath,
  stat,
  writeFile,
  existsSync,
} from 'fs';
import Queue from 'bull/lib/queue';
import { contentType } from 'mime-types';
import dbClient from '../utils/db';
import { getXTokenUser } from '../utils/auth';

const thaFileTypes = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const asyncMkdir = promisify(mkdir);
const asyncWriteFile = promisify(writeFile);
const asyncStat = promisify(stat);
const asyncRealPath = promisify(realpath);
const idNull = Buffer.alloc(24, '0').toString('utf-8');
const fileQueue = new Queue('thumbnail generation');

function idvalid(id) {
  const s = 24;
  let x = 0;
  const rg = [
    [48, 57],
    [97, 102],
    [65, 70],
  ];
  if (typeof id !== 'string' || id.length !== s) {
    return false;
  }
  while (x < s) {
    const ch = id[x];
    const pg = ch.charCodeAt(0);
    if (!rg.some((r) => pg >= r[0] && pg <= r[1])) {
      return false;
    }
    x += 1;
  }
  return true;
}

export default class FilesController {
  // postUpload method
  static async postUpload(req, res) {
    const { user } = req;
    const name = req.body.name || null;
    const type = req.body.type || null;
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.idPublic || false;
    const b64Data = req.body.data || '';

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }

    if (!type || !Object.values(thaFileTypes).includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }

    if (!req.body.data && type !== thaFileTypes.folder) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    if ((parentId !== 0) && (parentId !== '0')) {
      const file = await (await dbClient.filesCollection()).findOne(
        { _id: new mongoDBCore.BSON.ObjectId(idvalid(parentId) ? parentId : idNull) },
      );
      if (!file) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== thaFileTypes.folder) {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }
    const usrId = user._id.toString();
    const baseDir = `${process.env.FOLDER_PATH || ''}`
      .trim().length > 0 ? process.env.FOLDER_PATH.trim()
      : join(tmpdir(), 'files_manager');
    const fileNew = {
      usrId: new mongoDBCore.BSON.ObjectId(usrId),
      name,
      type,
      isPublic,
      parentId: (parentId === 0) || (parentId === '0') ? 0
        : new mongoDBCore.BSON.ObjectId(parentId),
    };
    await asyncMkdir(baseDir, { recursive: true });
    if (type !== thaFileTypes.folder) {
      const pathLocal = join(baseDir, v4());
      await asyncWriteFile(pathLocal, Buffer.from(b64Data, 'base64'));
      fileNew.localPath = pathLocal;
    }
    const insertionInf = await (await dbClient.filesCollection())
      .insertOne(fileNew);
    const fileId = insertionInf.insertedId.toString();
    if (type === thaFileTypes.image) {
      const jobName = `Image thumbnail [${usrId}-${fileId}]`;
      fileQueue.add({ usrId, fileId, name: jobName });
    }
    res.status(201).json({
      id: fileId,
      usrId,
      name,
      type,
      isPublic,
      parentId: (parentId === 0) || (parentId === '0') ? 0 : parentId,
    });
  }

  // getShow method
  static async getShow(req, res) {
    const { user } = req;
    const id = req.params ? req.params.id : idNull;
    const usrId = user._id.toString();
    const file = await (await dbClient.filesCollection()).findOne({
      _id: new mongoDBCore.BSON.ObjectId(idvalid(id) ? id : idNull),
      userId: new mongoDBCore.BSON.ObjectId(idvalid(usrId) ? usrId : idNull),
    });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({
      id,
      userId: usrId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
    });
  }

  // getIndex method
  static async getIndex(req, res) {
    const { user } = req;
    const parentId = req.query.parentId || '0';
    const page = /\d+/.test((req.query.page || '').toString())
      ? Number.parseInt(req.query.page, 10) : 0;
    const filterFiles = {
      userId: user._id,
      parentId: parentId === '0' ? parentId
        : new mongoDBCore.BSON.ObjectId(idvalid(parentId) ? parentId : idNull),
    };
    const files = await (await (await dbClient.filesCollection()).aggregate([
      { $match: filterFiles },
      { $sort: { _id: 1 } },
      { $skip: page * 20 },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: {
            $cond: { if: { $eq: ['$parentId', '0'] }, then: 0, else: '$parentId' },
          },
        },
      },
    ])).toArray();
    res.status(200).json(files);
  }

  // putPublish method
  static async putPublish(req, res) {
    const { user } = req;
    const { id } = req.params;
    const userId = user._id.toString();
    const filterFile = {
      _id: new mongoDBCore.BSON.ObjectId(idvalid(id) ? id : idNull),
      userId: new mongoDBCore.BSON.ObjectId(idvalid(userId) ? userId : idNull),
    };
    const file = await (await dbClient.filesCollection()).findOne(filterFile);
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await (await dbClient.filesCollection()).updateOne(
      filterFile, { $set: { isPublic: true } },
    );
    res.status(200).json({
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
    });
  }

  // putUnPublish method
  static async putUnPublish(req, res) {
    const { user } = req;
    const { id } = req.params;
    const userId = user._id.toString();
    const filterFile = {
      _id: new mongoDBCore.BSON.ObjectId(idvalid(id) ? id : idNull),
      userId: new mongoDBCore.BSON.ObjectId(idvalid(userId) ? userId : idNull),
    };
    const file = await (await dbClient.filesCollection()).findOne(filterFile);
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await (await dbClient.filesCollection()).updateOne(
      filterFile, { $set: { isPublic: false } },
    );
    res.status(200).json({
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
    });
  }

  // getFile method
  static async getFile(req, res) {
    const user = await getXTokenUser(req);
    const { id } = req.params;
    const size = req.query.size || null;
    const userId = user ? user._id.toString() : '';
    const filterFile = {
      _id: new mongoDBCore.BSON.ObjectId(idvalid(id) ? id : idNull),
    };
    const file = await (await dbClient.filesCollection()).findOne(filterFile);
    if (!file || (!file.isPublic && (file.userId.toString() !== userId))) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (file.type === thaFileTypes.folder) {
      res.status(400).json({ error: 'A folder doesn\'t have content' });
      return;
    }
    let filePath = file.localPath;
    if (size) {
      filePath = `${file.localPath}_${size}`;
    }
    if (existsSync(filePath)) {
      const fileDetails = await asyncStat(filePath);
      if (!fileDetails.isFile()) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
    } else {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const filePathAbs = await asyncRealPath(filePath);
    res.setHeader(
      'Content-Type', contentType(file.name) || 'text-plain; charset=utf-8',
    );
    res.status(200).sendFile(filePathAbs);
  }
}
