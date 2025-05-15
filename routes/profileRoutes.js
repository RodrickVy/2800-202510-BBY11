const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');
const { ObjectId } = require('mongodb');

const upload = multer({
  dest: path.join(__dirname, '../userProfiles')
});

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
    router.get("/createprofile", async (req, res) => {
        res.render("createProfile")
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