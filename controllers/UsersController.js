import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const usrQueue = new Queue('email sending');

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const userEmail = await (await dbClient.usersCollection()).findOne({ email });

    // checking if the user email already exists in the database
    if (userEmail) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    // inserting the user into mongodb & returning the insertId
    const addedUser = await (await dbClient.usersCollection()).insertOne({
      email, password: sha1(password),
    });
    const addedUserId = `${addedUser.insertedId}`;
    usrQueue.add({ addedUserId });
    res.status(201).json({ email, id: addedUserId });
  }

  // retrieve a user based on a token
  static async getMe(req, res) {
    const { user } = req;
    res.status(200).json({ email: user.email, id: user._id.toString() });
  }
}
