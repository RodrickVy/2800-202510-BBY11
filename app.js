require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 4000;
const { loadPage, getCareerIcon } = require('./util.js');
const app = express();
app.locals.getCareerIcon = getCareerIcon;

const fs = require("fs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
app.set("view engine", "ejs");
const { authRoutes } = require("./routes/authRoutes.js");
const { careerRoutes } = require("./routes/careerRoutes.js");
const { profileRoutes } = require("./routes/profileRoutes.js");
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
app.use("/", authRoutes(userCollection));
app.use("/", careerRoutes(userCollection));
app.use("/", profileRoutes());


// Intro page
app.get("/", async (req, res) => {
  res.render("home")
});

// Home page
app.get("/home", async (req, res) => {
  res.send(await loadPage("./app/home/home.html"));
});

// Serve the create profile page
app.get("/createprofile", async (req, res) => {
  res.send(await loadPage("./app/profile/createprofile.html"));
});

// Handle form submission
app.post('/createprofile', (req, res) => {
  // Handle form data (save it, validate, etc.)
  res.redirect('/createprofile2'); // This performs the actual redirect
});

// Serve the next page after form is submitted
app.get("/createprofile2", async (req, res) => {
  res.send(await loadPage("./app/profile/createprofile2.html"));
});

// Account page
app.get("/account", async (req, res) => {
  res.send(await loadPage("./app/account/account.html"));
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
