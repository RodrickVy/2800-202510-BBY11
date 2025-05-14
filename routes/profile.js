const express = require('express');
const router = express.Router();

// destructing, only using the ObjectId from mongoDB
const {ObjectId} = require('mongodb');

const createProfileFunction = (userCollection) => { 
    router.post('/createProfile', async (req, res) => {
        const updates = {user_type: req.body.user_type,
            education: [{credential: req.body.credential, institution: req.body.institution, end_date: req.body.end_date, program: req.body.program}],
            work: [{role: req.body.role, company: req.body.company, years: req.body.years, description: req.body.description}],
            skills: req.body.skills,
            description: req.body.description,
            image: req.body.image,
            media: [{name: req.body.name, url: req.body.url}]
        }

        await userCollection.updateOne(
            {_id : new ObjectId(req.session.user_id)},
            {$set: updates}
        )
    })
}