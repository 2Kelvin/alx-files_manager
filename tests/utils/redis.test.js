/* eslint-disable no-undef */
/* eslint-disable jest/valid-expect */
/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/prefer-expect-assertions */
import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('test Redis', () => {
  before((done) => {
    this.timeout(10000);
    setTimeout(done, 4000);
  });

  it('redis alive', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('redis set key', async () => {
    await redisClient.set('myKey', 7, 10);
    expect(await redisClient.get('myKey')).to.equal('7');
  });

  it('redis get', async () => {
    await redisClient.set('hiKey', 9, 1);
    setTimeout(async () => {
      expect(await redisClient.get('hiKey')).to.not.equal('9');
    }, 2000);
  });

  it('redis delete', async () => {
    await redisClient.set('thaKey', 3, 10);
    await redisClient.del('thaKey');
    setTimeout(async () => {
      console.log('del: thaKey ->', await redisClient.get('thaKey'));
      expect(await redisClient.get('thaKey')).to.be.null;
    }, 2000);
  });
});
