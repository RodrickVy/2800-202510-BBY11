require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 4000;
const app = express();
const { loadPage } = require("./util.js");
const fs = require("fs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
app.set("view engine", "ejs");
const signupRoutes = require("./routes/signupRoutes");

// Redirects to notfound if a person tries to access HTML files directly.
app.use((req, res, next) => {
  const pattern = /^\/app\/[^\/]+\/[^\/]+\.html$/;

  if (pattern.test(req.path)) {
    res.redirect("/notFound");
  } else {
    next();
  }
});

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

//middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  })
);

// signup and create user
// mount to the home page
app.use("/", signupRoutes(userCollection));

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
