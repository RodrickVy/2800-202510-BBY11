// MongoDB connection setup for the app
require("dotenv").config();

const MongoClient = require("mongodb").MongoClient;
const atlasURI = process.env.MONGODB_HOST;

const database = new MongoClient(atlasURI, {});
// Export a connected MongoClient instance
module.exports = { database };

