require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 4300;
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
const {networkRoutes} = require("./routes/networkRoutes.js");


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
app.use("/", profileRoutes(userCollection));
app.use("/", networkRoutes(userCollection));



//  Sends 404 page if route is unknown
app.use((req, res) => {

  res.render('404')
});

// RUN SERVER
app.listen(port, function () {
  console.log("BCIT Connect Is Live On " + port + "!");
});
