require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 4000;
const app = express();
const { loadPage } = require("./util.js");
const fs = require("fs");

const Joi = require("joi");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const session = require("express-session");
const MongoStore = require("connect-mongo");
const expireTime = 1 * 60 * 60 * 1000; // 1 hour
app.set("view engine", "ejs");

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

app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// submit user
app.post("/submitUser", async (req, res) => {
  const { name, username, password } = req.body;

  // Validate name, username, and password
  const schema = Joi.object({
    name: Joi.string().min(1).required(), // Ensure name is not empty
    username: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ name, username, password });
  if (validationResult.error != null) {
    console.log(validationResult.error);

    // change this part, this must take place in signup.ejs
    return res.render("signup", {
      error: `invalid input: ${validationResult.error.message}`,
    });
  }

  // Hash the password and insert the user into the database
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    name: name,
    username: username,
    password: hashedPassword,
  });
  console.log("Inserted user");

  req.session.authenticated = true;
  req.session.username = username;
  req.session.name = name; // Use the user's name for the session
  req.session.cookie.maxAge = expireTime;

  // redirect to the main page instead of the following line
  res.redirect("/");
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
