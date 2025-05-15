const express = require('express');
const router = express.Router();
const multer = require("multer");

const upload = multer({dest: '/userProfiles'});
// destructing, only using the ObjectId from mongoDB
const {ObjectId} = require('mongodb');

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
            // image: req.file.path,
        }

        await userCollection.updateOne(
            {_id: new ObjectId(req.session.user_id)},
            {$set: updates}
        )

        res.send("submitted profile, req.body: " + req.body.firstname + "user id: " + req.session.user_id + 
            "option is : " + req.body.user_type + "bio is: " + req.body.bio);
    })
    router.get("/create-profile", async (req, res) => {
        res.render("createProfile", {css: [null]})
    });

    router.get("/create-profile_2", async (req, res) => {
        res.render("createProfile2")
    });

    router.get("/account", async (req, res) => {
        res.render("createProfile2")
    });

    return router;
}

module.exports = { profileRoutes };