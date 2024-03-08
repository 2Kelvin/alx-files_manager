import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    const userEmail = await (await dbClient.usersCollection()).findOne({ email });

    // checking if the user email already exists in the database
    if (userEmail) {
      res.status(400).json({ error: 'Already exists' });
      return;
    }

    // inserting the user into mongodb & returning the insertId
    const addedUser = await (await dbClient.usersCollection()).insertOne({
      email, password: sha1(password),
    });
    const addedUserId = `${addedUser.insertedId}`;
    res.status(201).json({ email, id: addedUserId });
  }
}
