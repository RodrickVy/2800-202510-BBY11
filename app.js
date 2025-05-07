require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 4000;
const app = express();
const { loadPage } = require("./util.js");
const fs = require("fs");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const expireTime = 1 * 60 * 60 * 1000; // 1 hour

// Redirects to notfound if a person tries to access HTML files directly.
app.use((req, res, next) => {
  const pattern = /^\/app\/[^\/]+\/[^\/]+\.html$/;

  if (pattern.test(req.path)) {
    res.redirect("/notFound");
  } else {
    next();
  }
});

// could use simpler method of serving static files, might need to change later
// app.use("/scripts", express.static("./public/scripts"));
// app.use("/css", express.static("./public/css"));
// app.use("/assets", express.static("./public/assets"));
// app.use("/components", express.static("./public/components"));
// app.use("/app", express.static("./app"));

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

var { database } = include("databaseConnection");

const userCollection = database.db(mongodb_database).collection("users");

// MongoDB connection
var mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_HOST,
  crypto: {
    secret: process.env.MONGODB_SESSION_SECRET,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  })
);

//middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));

// Intro page
app.get("/", async (req, res) => {
  res.send(await loadPage("./app/home/intro.html"));
});

//  Sends 404 page if route is unknown
app.use((req, res) => {
  const html = fs.readFileSync("./public/components/404.html", "utf8");
  res.status(404).send(html);
});

// RUN SERVER
app.listen(port, function () {
  console.log("BCIT Connect Is Live On " + port + "!");
});
