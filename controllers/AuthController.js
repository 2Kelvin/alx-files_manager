import { v4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  // login user with a token
  static async getConnect(req, res) {
    const { user } = req;
    const token = v4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    res.status(200).json({ token });
  }

  // logout user after token expires
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    await redisClient.del(`auth_${token}`);
    res.status(204).send();
  }
}
