const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');
const { ObjectId } = require('mongodb');
const {
    getAllUsers,
    addPoints,
    getMeetingProfiles,
    loadMeetings,
    createNotification,
    getAlumniList
} = require('../public/scripts/profile/utils');

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

const upload = multer({storage: storage});

const bcrypt = require("bcrypt");
const Joi = require("joi");
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
    function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    } else {
        res.redirect("/login");
    }
}

const profileRoutes = (userCollection,meetingsCollection,notificationsCollection) => {

    router.get("/account", async (req, res) => {
        if (req.session.authenticated) {

            const result = await userCollection
                .find({username: req.session.username})
                .project({
                    username: 1,
                    name: 1,
                    lastname: 1,
                    password: 1,
                    user_type: 1,
                    education: 1,
                    points: 1,
                    work: 1,
                    skills: 1,
                    interests: 1,
                    bio: 1,
                    image: 1,
                    media: 1,
                    availability:1
                })
                .toArray();


            if (result.length !== 1) {
                return res.redirect("/login?error=invalid");
            }


            req.session.userProfile = {
                ...result[0]
            };
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
                {_id: new ObjectId(req.session.user_id)},
                {$set: updates}
            );
            await addPoints(req.session.username, 150,userCollection,notificationsCollection);
            res.redirect("/account");
        } catch (error) {
            console.error("Profile submission failed:", error);
            res.status(500).send("An error occurred while submitting the profile.");
        }
    });


// GET /notifications
    router.get('/notifications', async (req, res) => {
        const userId = req.session?.userProfile?._id;

        if (!userId) {
            return res.redirect('/login');
        }

        try {

            const notifications = await notificationsCollection
                .find({ targetId: new ObjectId(userId) })
                .sort({ dateSent: -1 }) // most recent first
                .toArray();

            res.render('notifications', { notifications });
        } catch (err) {
            console.error('Error loading notifications:', err);
            res.status(500).send('Unable to load notifications.');
        }
    });

    module.exports = router;


    router.get("/create-profile", isAuthenticated, async (req, res) => {
        res.render("createProfile", {userData: req.session.userProfile});
    });

    router.get('/set-availability', (req, res) => {

        res.render('setAvailability',{userData: req.session.userProfile});
    });

    router.post('/saveAvailability', async (req, res) => {
        const availability = req.body.availability;
        const username = req.session.username;

        if (!req.session.authenticated) {
             res.redirect("/login")
            return;
        }

        try {


            const result = await userCollection.updateOne(
                { username: username },
                { $set: { availability: JSON.parse(availability) } }
            );

            if (result.modifiedCount === 0) {
                res.render('error', {
                    error: "sorry something went wrong",
                    redirectLink: "/account",
                    redirectLinkCTA: "Try Again",
                    currentPage: 'account'
                });
                return;
            }
            await addPoints(req.session.username, 150,userCollection,notificationsCollection);
            res.redirect("/account");
        } catch (err) {
            console.error('Error saving availability:', err);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });

    router.post('/schedule-meeting', async (req, res) => {
        const { targetUserId, day, startTime, duration, notes,location, meetingType } = req.body;
        const client = req.session?.username;

        if (!targetUserId || !day || !startTime || !duration || !notes || !client || !location|| !meetingType) {
             res.status(400).render('error', {
                 error: "The meeting request provided is missing some details, check if targetUserId, day, startTime, duration, notes,location, meetingType  are all included.",
                 redirectLink: "/home",
                 redirectLinkCTA: "Go home",
                 currentPage: 'home'
             });
             return;
        }

        try {
            const meeting = {
                client, // the one who booked the meeting
                targetId: new ObjectId(targetUserId), // the profile owner
                accepted: false, // default status
                day,
                startTime,
                duration: parseInt(duration),
                notes,
                createdAt: new Date(),
                location:location,meetingType:meetingType
            };



            const meetingProfiles = await getMeetingProfiles(meeting,userCollection);
            let profileToNotify = {};


            await createNotification({
                notificationsCollection,
                title: '@' + req.session.userProfile.name +' wants to connect!',
                message: '@' + req.session.userProfile.name  + " would like to connect on "+ meeting.day + " at "+ meeting.startTime,
                directTo: '/connect/meetings',
                targetId: meetingProfiles.targetProfile._id
            });
            await addPoints(req.session.username, 300,userCollection,notificationsCollection);


            await meetingsCollection.insertOne(meeting);


            res.redirect(`/connect/meetings`);
        } catch (err) {
            console.error('Error scheduling meeting:', err);
            res.status(500).send('An error occurred while scheduling the meeting.');
        }
    });

    router.get('/connect/meetings', async (req, res) => {

        const meetingData = await loadMeetings(meetingsCollection, userCollection,req,res);
        res.redirect("/connect/meetings/outgoing");
    });


    router.get('/connect/meetings/incoming', async (req, res) => {

        const meetingData = await loadMeetings(meetingsCollection, userCollection,req,res);
        res.render('incomingMeetings', {
                meetings:meetingData.incoming,
                alumni:meetingData.alumni,

            }
        );
    });
    router.get('/connect/meetings/outgoing', async (req, res) => {

        const meetingData = await loadMeetings(meetingsCollection, userCollection,req,res);
        res.render('outgoingMeetings', {
                meetings:meetingData.outgoing,
                alumni:meetingData.alumni,

            }
        );
    });
    router.get('/connect/meetings/scheduled', async (req, res) => {

        const meetingData = await loadMeetings(meetingsCollection, userCollection,req,res);
        res.render('scheduledMeetings', {
                meetings:meetingData.scheduled,
                alumni:meetingData.alumni,

            }
        );
    });

    router.get('/connect/meetings/accept', async (req, res) => {
        const { client, target, startTime } = req.query;

        await meetingsCollection.updateOne(
            { client, targetId: new ObjectId(target), startTime },
            { $set: { accepted: true } }
        );
        const meeting = (await meetingsCollection.find(
            { client, targetId: new ObjectId(target), startTime }
        ).project({
            client: 1,
            targetId: 1,
            accepted: 1,
            day: 1,
            startTime: 1,
            duration: 1,
            notes: 1,
            location: 1,
            meetingType: 1,
            createdAt: 1
        }).toArray())[0];

        if (!meeting) {
            return res.status(404).send('Meeting not found');
        }

        const meetingProfiles = await getMeetingProfiles(meeting, userCollection);
        let profileToNotify = {};
        if (meetingProfiles.targetProfile.username === req.session.username) {
            profileToNotify = meetingProfiles.clientProfile;
        } else {
            profileToNotify = meetingProfiles.targetProfile;
        }

        await createNotification({
            notificationsCollection,
            title: 'Your meeting with @' + req.session.userProfile.name + ' has been accepted.',
            message: '@' + req.session.username + " accepted your meeting for " + meeting.day + " at " + meeting.startTime,
            directTo: '/connect/meetings',
            targetId: profileToNotify._id
        });
        await addPoints(req.session.username, 300, userCollection, notificationsCollection);

        res.redirect("/connect/meetings/scheduled");
    });

    router.get('/connect/meetings/reject', async (req, res) => {
        const { client, target, startTime } = req.query;

        await meetingsCollection.updateOne(
            { client, targetId: new ObjectId(target), startTime },
            { $set: { accepted: false } }
        );

        const meeting = ( await meetingsCollection.find(
            { client, targetId: new ObjectId(target), startTime }
        ).project({
            client:1,
            targetId:1,
            accepted:1,
            day:1,
            startTime:1,
            duration:1,
            notes:1,
            createdAt:1
        }).toArray())[0];


        const meetingProfiles = await getMeetingProfiles(meeting,userCollection);
        let profileToNotify = {};
        if(meetingProfiles.targetProfile.username === req.session.username){
            profileToNotify = meetingProfiles.clientProfile;
        }else{
            profileToNotify = meetingProfiles.targetProfile;
        }

        await createNotification({
            notificationsCollection,
            title: 'Your meeting with @' + req.session.userProfile.name  +' has been not been able to accept your meeting.',
            message: '@' + req.session.username + " has been not been able to accept your meeting for"+ meeting.day + " at "+ meeting.startTime,
            directTo: '/connect/meetings',
            targetId: profileToNotify._id
        });
        await addPoints(req.session.username, -50,userCollection,notificationsCollection);

        res.redirect("/connect/meetings/outgoing");
    });

    router.get("/connect/:username", async (req, res) => {
        const username = req.params.username
        const result = await userCollection
            .find({ username: username })
            .project({
                username: 1,
                name:1,
                lastname:1,
                password: 1,
                points:1,
                interests:1,
                user_type: 1,
                education: 1,
                work: 1,
                skills: 1,
                bio: 1,
                image: 1,
                media: 1,
                availability:1
            })
            .toArray();


        if (result.length !== 1) {
            return res.redirect("/login");
        }






        const userProfile = {
            ...result[0]
        };


        res.render("publicProfile", {userData: userProfile});
    });

    router.get('/connect/meetings/cancel', async (req, res) => {
        const { client, target, startTime } = req.query;

        if (!client || !target || !startTime) {
            return res.status(400).send('Missing required query parameters.');
        }

        try {

            const meeting = ( await meetingsCollection.find(
                { client, targetId: new ObjectId(target), startTime }
            ).project({
                client:1,
                targetId:1,
                accepted:1,
                day:1,
                startTime:1,
                duration:1,
                notes:1,
                createdAt:1
            }).toArray())[0];


            const meetingProfiles = await getMeetingProfiles(meeting,userCollection);
            let profileToNotify = {};
            if(meetingProfiles.targetProfile.username === req.session.username){
                profileToNotify = meetingProfiles.clientProfile;
            }else{
                profileToNotify = meetingProfiles.targetProfile;
            }

            await createNotification({
                notificationsCollection,
                title: 'Your meeting with @' + req.session.userProfile.name +' has canceled your meeting',
                message: '@' + req.session.username + " has canceled your meeting for"+ meeting.day + " at "+ meeting.startTime,
                directTo: '/connect/meetings',
                targetId: profileToNotify._id
            });
            await addPoints(req.session.username, -150,userCollection,notificationsCollection);
            const result = await meetingsCollection.deleteOne({
                client,
                targetId: new ObjectId(target),
                startTime
            });

            if (result.deletedCount === 0) {
                return res.status(404).send('Meeting not found or already deleted.');
            }


            await addPoints(req.session.username, -100,userCollection,notificationsCollection);
            res.redirect("/connect/meetings/outgoing");
        } catch (err) {
            console.error('Error cancelling meeting:', err);
            res.status(500).send('Internal server error.');
        }
    });

    router.get('/location-suggest', async (req, res) => {
        const q = req.query.q;
        if (!q) return res.status(400).json({ error: 'Missing query' });

        try {
            const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();
            res.json(data.features);
        } catch (err) {
            console.error('Nominatim error:', err);
            res.status(500).json({ error: 'Failed to fetch suggestions',message:err});
        }
    });

    const { ObjectId } = require('mongodb');

    router.get('/notification/read', async (req, res) => {
        const { targetId, dateSent, directTo } = req.query;
        if (!targetId || !dateSent || !directTo) {
            return res.status(400).send('Missing required query parameters.');
        }

        try {


            const result = await notificationsCollection.updateOne(
                {
                    targetId: new ObjectId(targetId),
                    dateSent: new Date(dateSent),
                    directTo: directTo
                },
                {
                    $set: { readStatus: true }
                }
            );



            res.redirect(directTo); // Redirect to where the notification was pointing
        } catch (err) {
            console.error('Error deleting notification:', err);
            res.status(500).send('Server error while deleting notification.');
        }
    });


    return router;
}

module.exports = {profileRoutes};