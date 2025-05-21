const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');


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
const bcrypt = require("bcrypt");

function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    } else {
        res.redirect("/login");
    }
}

const profileRoutes = (userCollection) => {

    router.get("/account", async (req, res) => {
        if(req.session.authenticated) {

            const result = await userCollection
                .find({ username: req.session.username })
                .project({
                    username: 1,
                    name:1,
                    lastname:1,
                    password: 1,
                    user_type: 1,
                    education: 1,
                    points:1,
                    work: 1,
                    skills: 1,
                    interests:1,
                    bio: 1,
                    image: 1,
                    media: 1
                })
                .toArray();


            if (result.length !== 1) {
                return res.redirect("/login?error=invalid");
            }



            req.session.userProfile  = {
                ...result[0]
            };
            console.log(req.session.userProfile)
            const unreadCount = 3; // Replace this with DB query if needed

            res.render("account", {
            userData: req.session.userProfile,
            unreadCount: unreadCount
            });
        }else{
            res.redirect("/login");
        }

    });

    router.post('/submitProfile', upload.single('profileImage'), async (req, res) => {
        try {
            const defaultImagePath = "userProfiles/default.png"; // this should exist in your /public/userProfiles folder
            console.log("Bio"+req.body.bio);
            const updates = {
                name: req.body.firstname,
                lastname: req.body.lastname,
                user_type: req.body.user_type,
                bio: req.body.bio,
                education: JSON.parse(req.body.education),
                work: JSON.parse(req.body.workExp),
                skills: req.body.skills.split(",").map(skill => skill.trim()),
                interests: req.body.interests.split(",").map(interest => interest.trim()),
                media: JSON.parse(req.body.media),
                image: req.file
                    ? req.file.path.replace(/^public[\/\\]/, '').replace(/\\/g, "/")
                    : defaultImagePath
            };

            await userCollection.updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: updates }
            );

            res.redirect("/account");
        } catch (error) {
            console.error("Profile submission failed:", error);
            res.status(500).send("An error occurred while submitting the profile.");
        }
    });

    router.get("/notifications", async (req, res) => {
        const notifications = [
        {
        title: "New Message",
        message: "You received a new message from Alex.",
        date: "2025-05-19 12:45 PM",
        read: false
        },
        {
        title: "Event Reminder",
        message: "Don't forget your meeting at 3 PM.",
        date: "2025-05-18 10:00 AM",
        read: true
        }
    ];

        res.render("notifications", {
        notifications,
        currentPage: "notifications"  // 👈 Add this!
    });
    });



    router.get("/create-profile", isAuthenticated, async (req, res) => {
       console.log("Some data" +req.session.userProfile)

        res.render("createProfile", {userData:  req.session.userProfile});
    });



    return router;
}

module.exports = { profileRoutes };