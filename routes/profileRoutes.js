const express = require('express');
const router = express.Router();
const multer = require("multer");

const upload = multer({dest: '/userProfiles'});
// destructing, only using the ObjectId from mongoDB
const {ObjectId} = require('mongodb');

const profileRoutes = () => {
    router.post('/submitProfile', upload.single('profileImage'), async (req, res) => {
        const updates = {
            user_type: req.body.user_type,
            education: JSON.parse(req.body.education),
            work: JSON.parse(req.body.education),
            skills: JSON.parse(req.body.skills),
            description: req.body.description,
            image: req.file.path,
            media: JSON.parse(req.body.media)
        }

        await userCollection.updateOne(
            {_id: new ObjectId(req.session.user_id)},
            {$set: updates}
        )
    })
    router.get("/create-profile", async (req, res) => {
        res.render("createProfile")
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