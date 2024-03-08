import sha1 from 'sha1';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from './db';
import redisClient from './redis';

export async function getAuthorizedUser(req) {
  const authHeader = req.headers.authorization || null;
  if (!authHeader) {
    return null;
  }
  const authSplitted = authHeader.split(' ');
  if (authSplitted.length !== 2 || authSplitted[0] !== 'Basic') {
    return null;
  }
  const tken = Buffer.from(authSplitted[1], 'base64').toString();
  const colIdx = tken.indexOf(':');
  const email = tken.substring(0, colIdx);
  const pswd = tken.substring(colIdx + 1);
  const usr = await (await dbClient.usersCollection().findOne({ email }));

  if (!usr || sha1(pswd) !== usr.password) {
    return null;
  }
  return usr;
}

export async function getXTokenUser(req) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return null;
  }
  const usrId = await redisClient.get(`auth_${xToken}`);
  if (!usrId) {
    return null;
  }
  const usr = await (await dbClient.usersCollection()).findOne({
    _id: new mongoDBCore.BSON.ObjectId(usrId),
  });
  return usr || null;
}

export default {
  getAuthorizedUser: async (req) => getAuthorizedUser(req),
  getXTokenUser: async (req) => getXTokenUser(req),
};
