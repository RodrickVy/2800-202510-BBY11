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

const upload = multer({storage: storage});

// destructing, only using the ObjectId from mongoDB
const {ObjectId} = require('mongodb');
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
async function getAlumniList(userCollection) {
    try {
        return await userCollection
            .find({user_type: "alumni"})
            .project({
                username: 1,
                name: 1,
                points:1,
                lastname: 1,
                password: 1,
                interests: 1,
                user_type: 1,
                education: 1,
                work: 1,
                skills: 1,
                bio: 1,
                image: 1,
                media: 1,
                availability:1,
                meetings:1
            })
            .toArray();
    } catch (err) {
        console.error("Error fetching alumni:", err);
        return [];
    }
}

async function getAllUsers(userCollection) {
    try {
        return await userCollection
            .find()
            .project({
                username: 1,
                name: 1,
                points:1,
                lastname: 1,
                password: 1,
                interests: 1,
                user_type: 1,
                education: 1,
                work: 1,
                skills: 1,
                bio: 1,
                image: 1,
                media: 1,
                availability:1,
                meetings:1
            })
            .toArray();
    } catch (err) {
        console.error("Error fetching alumni:", err);
        return [];
    }
}
async function addPoints(username, points,userCollection) {
    try {
        const updateResult = await userCollection.updateOne(
            { username: username },
            { $inc: { points: parseInt(points) } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).send('User not found');
        }
        console.log("points added "+ updateResult)

    } catch (err) {
        console.error('Error updating points:', err);

    }
}
const profileRoutes = (userCollection,meetingsCollection) => {

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
            console.log("Bio" + req.body.bio);
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
            await addPoints(req.session.username, 150,userCollection);
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
        console.log("Some data" + req.session.userProfile)

        res.render("createProfile", {userData: req.session.userProfile});
    });

    router.get('/set-availability', (req, res) => {

        res.render('setAvailability',{userData: req.session.userProfile});
    });

    router.post('/saveAvailability', async (req, res) => {
        const availability = req.body.availability;
        const username = req.session.username;


        console.log(availability)
        console.log("data out")
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
            await addPoints(req.session.username, 150,userCollection);
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



            await meetingsCollection.insertOne(meeting);
            await addPoints(req.session.username, 100,userCollection);
            res.redirect(`/connect/meetings`);
        } catch (err) {
            console.error('Error scheduling meeting:', err);
            res.status(500).send('An error occurred while scheduling the meeting.');
        }
    });

    router.get('/connect/meetings', async (req, res) => {
        const username = req.session?.username;
        const userId = req.session?.userProfile?._id;

        if (!username || !userId) return res.redirect('/login');

        const alumni = await getAlumniList(userCollection);
        const allUsers = await getAllUsers(userCollection);
        const outgoing = await meetingsCollection.find({ client: username }).project({
            client:1,
            targetId:1,
            accepted:1,
            day:1,
            startTime:1,
            duration:1,
            notes:1,

            location:1,
            meetingType:1,
            createdAt:1
        })
            .toArray();
        const incoming = await meetingsCollection.find({ targetId: new ObjectId(userId) }).project({
            client:1,
            targetId:1,
            accepted:1,
            day:1,
            startTime:1,
            duration:1,
            notes:1,
            createdAt:1
        }).toArray();


        const incomingMeetingsRequest = incoming.filter((e)=>e.accepted ===false).map(function (e) {
            const targetProfile = alumni.find((a) => {

                return  a._id.equals( e.targetId );
            })
            const clientProfile = allUsers.find(function (a) {
                console.log(a.username +"==="+ e.client);
                return a.username === e.client;
            });
            return {
                ...e,
                targetProfile:targetProfile,
                clientProfile:clientProfile,
                otherParty:clientProfile
            };

        });
        const scheduledMeetings = [...incoming,...outgoing].filter((meeting)=>meeting.accepted ===true).map(function (meeting) {
            let profile = {};

            if(userId === meeting.targetId ){
                profile = allUsers.find(function (user) {
                    return user.username === meeting.client;
                });
            }else{
               profile = alumni.find((user) => {

                    return  user._id.equals( meeting.targetId );
                })
            }


            return {
                ...meeting,
                otherParty:profile
            };

        });
        const outgoingMeetingRequest = outgoing.filter((e)=>e.accepted ===false).map(function (e) {
            const targetProfile = alumni.find((a) => {

                    return  a._id.equals( e.targetId );
                })
            const clientProfile = allUsers.find(function (a) {
                console.log(a.username +"==="+ e.client);
                return a.username === e.client;
            });
            return {
                ...e,
                targetProfile:targetProfile,
                clientProfile:clientProfile,
                otherParty:targetProfile
            };

        })
        res.render('meetings', {
                outgoing: outgoingMeetingRequest,
                incoming: incomingMeetingsRequest,
                alumni: await getAlumniList(userCollection),
                scheduled: scheduledMeetings,
            }
        );
    });


    router.get('/connect/meetings/accept', async (req, res) => {
        const { client, target, startTime } = req.query;

        await meetingsCollection.updateOne(
            { client, targetId: new ObjectId(target), startTime },
            { $set: { accepted: true } }
        );
        await addPoints(req.session.username, 300,userCollection);
        res.redirect('/connect/meetings');
    });


    router.get('/connect/meetings/reject', async (req, res) => {
        const { client, target, startTime } = req.query;

        await meetingsCollection.updateOne(
            { client, targetId: new ObjectId(target), startTime },
            { $set: { accepted: false } }
        );

        res.redirect('/connect/meetings');
    });
    router.get("/connect/:username", async (req, res) => {
        const username = req.params.username
        console.log(username)
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

    const { ObjectId } = require('mongodb');

    router.get('/connect/meetings/cancel', async (req, res) => {
        const { client, target, startTime } = req.query;

        if (!client || !target || !startTime) {
            return res.status(400).send('Missing required query parameters.');
        }

        try {
            const result = await meetingsCollection.deleteOne({
                client,
                targetId: new ObjectId(target),
                startTime
            });

            if (result.deletedCount === 0) {
                return res.status(404).send('Meeting not found or already deleted.');
            }


            await addPoints(req.session.username, -100,userCollection);
            res.redirect('/connect/meetings');
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
            console.log( data)
            res.json( data.features);
        } catch (err) {
            console.error('Nominatim error:', err);
            res.status(500).json({ error: 'Failed to fetch suggestions',message:err});
        }
    });




    return router;
}

module.exports = {profileRoutes};