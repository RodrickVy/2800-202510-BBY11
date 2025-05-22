const { ObjectId } = require('mongodb');

async function getAllUsers(userCollection) {
    try {
        return await userCollection
            .find()
            .project({
                username: 1,
                name: 1,
                points: 1,
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
                availability: 1,
                meetings: 1
            })
            .toArray();
    } catch (err) {
        console.error("Error fetching users:", err);
        return [];
    }
}

async function addPoints(username, points, userCollection, notificationsCollection) {
    try {
        const updateResult = await userCollection.updateOne(
            { username: username },
            { $inc: { points: parseInt(points) } }
        );

        const result = await userCollection
            .find({ username: username })
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
                availability: 1
            })
            .toArray();

        const userData = {
            ...result[0]
        };

        await createNotification({
            notificationsCollection,
            title: 'Keep Leveling Up!',
            message: `You have ${points} points added! Check your profile.`,
            directTo: '/account',
            targetId: userData._id
        });
    } catch (err) {
        console.error('Error updating points:', err);
    }
}

async function getMeetingProfiles(meeting, usersCollection) {
    if (!meeting || !usersCollection || !meeting.targetId || !meeting.client) {
        throw new Error('Missing required data for fetching meeting profiles.');
    }

    const [targetProfile, clientProfile] = await Promise.all([
        usersCollection.findOne({ _id: new ObjectId(meeting.targetId) }),
        usersCollection.findOne({ username: meeting.client })
    ]);

    return {
        targetProfile,
        clientProfile
    };
}

async function loadMeetings(meetingsCollection, userCollection, req, res) {
    const username = req.session?.username;
    const userId = req.session?.userProfile?._id;

    if (!username || !userId) return res.redirect('/login');

    const alumni = await getAlumniList(userCollection);
    const allUsers = await getAllUsers(userCollection);
    const outgoing = await meetingsCollection.find({ client: username }).project({
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
    }).toArray();

    const incoming = await meetingsCollection.find({ targetId: new ObjectId(userId) }).project({
        client: 1,
        targetId: 1,
        accepted: 1,
        day: 1,
        startTime: 1,
        duration: 1,
        notes: 1,
        createdAt: 1
    }).toArray();

    const incomingMeetingsRequest = incoming.filter((e) => e.accepted === false).map(function (e) {
        const targetProfile = alumni.find((a) => a._id.equals(e.targetId));
        const clientProfile = allUsers.find((a) => a.username === e.client);
        return {
            ...e,
            targetProfile: targetProfile,
            clientProfile: clientProfile,
            otherParty: clientProfile
        };
    });

    const scheduledMeetings = [...incoming, ...outgoing].filter((meeting) => meeting.accepted === true).map(function (meeting) {
        let profile = {};
        if (userId === meeting.targetId) {
            profile = allUsers.find((user) => user.username === meeting.client);
        } else {
            profile = alumni.find((user) => user._id.equals(meeting.targetId));
        }
        return {
            ...meeting,
            otherParty: profile
        };
    });

    const outgoingMeetingRequest = outgoing.filter((e) => e.accepted === false).map(function (e) {
        const targetProfile = alumni.find((a) => a._id.equals(e.targetId));
        const clientProfile = allUsers.find((a) => a.username === e.client);
        return {
            ...e,
            targetProfile: targetProfile,
            clientProfile: clientProfile,
            otherParty: targetProfile
        };
    });

    return {
        outgoing: outgoingMeetingRequest,
        incoming: incomingMeetingsRequest,
        alumni: await getAlumniList(userCollection),
        scheduled: scheduledMeetings,
    };
}

async function createNotification({ notificationsCollection, title, message, directTo, targetId }) {
    try {
        await notificationsCollection.insertOne({
            title,
            message,
            directTo,
            targetId: new ObjectId(targetId),
            dateSent: new Date(),
            read: false
        });
    } catch (err) {
        console.error('Error creating notification:', err);
    }
}

async function getAlumniList(userCollection) {
    try {
        return await userCollection
            .find({ user_type: "alumni" })
            .project({
                username: 1,
                name: 1,
                points: 1,
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
                availability: 1,
                meetings: 1
            })
            .toArray();
    } catch (err) {
        console.error("Error fetching alumni:", err);
        return [];
    }
}

module.exports = {
    getAllUsers,
    addPoints,
    getMeetingProfiles,
    loadMeetings,
    createNotification,
    getAlumniList
}; 