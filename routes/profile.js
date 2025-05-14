const express = require('express');
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: '/userProfiles' });
// destructing, only using the ObjectId from mongoDB
const {ObjectId} = require('mongodb');

const createProfileFunction = (userCollection) => {
    router.post('/setProfile',  upload.single('profileImage'), async (req, res) => {
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
}