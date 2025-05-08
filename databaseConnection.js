require("dotenv").config();

const MongoClient = require("mongodb").MongoClient;
const atlasURI = process.env.MONGODB_HOST;

const database = new MongoClient(atlasURI, {});
module.exports = { database };
