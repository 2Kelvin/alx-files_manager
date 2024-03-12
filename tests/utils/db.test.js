/* eslint-disable no-undef */
/* eslint-disable jest/valid-expect */
/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/prefer-expect-assertions */
import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('testing dbClient', () => {
  before((done) => {
    this.timeout(10000);
    Promise.all([dbClient.usersCollection(), dbClient.filesCollection()])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([usersCollection.deleteMany({}), filesCollection.deleteMany({})])
          .then(() => done())
          .catch((deleteErr) => done(deleteErr));
      }).catch((connectErr) => done(connectErr));
  });

  it('method isAlive', () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('nbUsers test', async () => {
    expect(await dbClient.nbUsers()).to.equal(0);
  });

  it('method nbFiles', async () => {
    expect(await dbClient.nbFiles()).to.equal(0);
  });
});
