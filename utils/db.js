import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    // connecting to mongoDB either thro env variable string if there else locally
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.mongoAlive = false;

    // creating a mongodb client
    this.mongoDbClient = new MongoClient(`mongodb://${host}:${port}`);

    // connecting to mongodb
    this.mongoDbClient.connect()
      .then(() => { this.mongoAlive = true; }) // on connection success
      .catch((err) => {
        // on connection error
        this.mongoAlive = false;
        console.log(err);
      });
  }

  // checking if mongodb client was created successfully
  isAlive() {
    return this.mongoAlive;
  }

  // property users collection
  async usersCollection() {
    return this.mongoDbClient.db(this.database).collection('users');
  }

  // count the number of documents in users collection
  async nbUsers() {
    await this.mongoDbClient.connect();
    // accessing the users collection
    const usersCollection = this.mongoDbClient.db(this.database).collection('users');
    const usersDocsCount = await usersCollection.countDocuments();
    return usersDocsCount;
  }

  // property files collection
  async filesCollection() {
    return this.mongoDbClient.db(this.database).collection('users');
  }

  // count the number of documents in files collection
  async nbFiles() {
    await this.mongoDbClient.connect();
    // accessing files collection
    const filesCollection = this.mongoDbClient.db(this.database).collection('files');
    const filesDocsCount = await filesCollection.countDocuments();
    return filesDocsCount;
  }
}

const dbClient = new DBClient();
export default dbClient;
