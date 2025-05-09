require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_HOST);
let userCollection;

async function connect() {
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db(process.env.MONGODB_DATABASE);
  userCollection = db.collection("users");
}

function getUserCollection() {
  if (!userCollection) {
    throw new Error("userCollection not initialized yet. Call connect() first.");
  }
  return userCollection;
}

module.exports = { connect, getUserCollection };
