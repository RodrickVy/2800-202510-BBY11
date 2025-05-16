const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');
const { ObjectId } = require('mongodb');

const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/userProfiles");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // get .jpg, .png, etc.
    cb(null, uniqueSuffix + ext); // final file name: 169000-somerandom.jpg
  },
});

const upload = multer({ storage: storage });

// destructing, only using the ObjectId from mongoDB
const {ObjectId} = require('mongodb');

function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    } else {
        res.redirect("/login");
    }
}

const profileRoutes = (userCollection) => {
    router.post('/submitProfile', upload.single('profileImage'), async (req, res) => {
        const updates = {
            name: req.body.firstname,
            lastname: req.body.lastname,
            user_type: req.body.user_type,
            bio: req.body.bio,
            education: [{credentials: req.body.credentials, institution: req.body.institution, endyear: req.body.endyear, program: req.body.program}],
            work: [{role: req.body.role, company: req.body.company, years: req.body.years, description: req.body.description}],
            skills: req.body.skills.split(",").map(skill => skill.trim()),
            interests:[req.body.interests.split(",").map(interest => interest.trim())],
            media: [{name: req.body.socialName, url: req.body.socialURL}],
            image: req.file.path.replace(/^public[\/\\]/, '').replace(/\\/g, "/")
        }

        await userCollection.updateOne(
            {_id: new ObjectId(req.session.user_id)},
            {$set: updates}
        )
        res.render("account");
    })
    router.get("/create-profile", isAuthenticated, async (req, res) => {
        res.render("createProfile", {css: [null]})
    });

    router.get("/createprofile2", async (req, res) => {
        res.render("createProfile2")
    });

    router.get("/account", async (req, res) => {
        res.render("account")
    });

    return router;
}

module.exports = { profileRoutes };