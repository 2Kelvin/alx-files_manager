import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // creating a redis client
    this.client = createClient();
    this.redisAlive = true;

    this.client.on('error', (err) => {
      this.redisAlive = false;
      console.log(err);
    });
    this.client.on('connect', () => {
      this.redisAlive = true;
    });
  }

  // check if redis connected successfully
  isAlive() {
    return this.redisAlive;
  }

  // get the redis value for the passed in key
  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  // set a redis key with an expiration time
  async set(key, value, expirationTime) {
    promisify(this.client.set).bind(this.client)(key, value, 'EX', expirationTime);
  }

  // deletes a redis key
  async del(key) {
    promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
