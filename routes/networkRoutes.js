const express = require("express");

const { OpenAI } = require("openai");

// OpenAI setup (use your own API key via env or config)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const router = express.Router();

// Assumes you're using Express and MongoDB
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
                availability:1
            })
            .toArray();
    } catch (err) {
        console.error("Error fetching alumni:", err);
        return [];
    }
}

async function matchAlumni(userCollection, currentUserProfile) {
    const alumni = await userCollection.find({ user_type: "alumni" }).toArray();

    // Prepare a function to score similarity
    function scoreMatch(alumniProfile) {
        let score = 0;

        // Skills
        const sharedSkills = alumniProfile.skills?.filter(skill =>
            currentUserProfile.skills?.includes(skill)
        ) || [];
        score += sharedSkills.length * 2;

        // Interests
        const sharedInterests = alumniProfile.interests?.filter(interest =>
            currentUserProfile.interests?.includes(interest)
        ) || [];
        score += sharedInterests.length * 2;

        // Education program/institution match
        if (alumniProfile.education && currentUserProfile.education) {
            for (let edu of currentUserProfile.education) {
                if (alumniProfile.education.some(aEdu =>
                    aEdu.program === edu.program || aEdu.institution === edu.institution
                )) {
                    score += 3;
                }
            }
        }

        // Work similarity (role/company)
        if (alumniProfile.work && currentUserProfile.work) {
            for (let work of currentUserProfile.work) {
                if (alumniProfile.work.some(aWork =>
                    aWork.role === work.role || aWork.company === work.company
                )) {
                    score += 3;
                }
            }
        }

        return score;
    }

    // AI Comparison for bio similarity
    async function compareBiosWithAI(bio1, bio2) {
        const prompt = `
Compare the following two bios and return a score between 0 and 10 based on how similar they are in goals, tone, and values. Respond with only the number.

Bio A: ${bio1}

Bio B: ${bio2}
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0
        });

        const scoreText = completion.choices[0].message.content.trim();
        const aiScore = parseFloat(scoreText);

        return isNaN(aiScore) ? 0 : aiScore;
    }

    // Score and sort alumni
    const matches = [];

    for (const alumniProfile of alumni) {
        let baseScore = scoreMatch(alumniProfile);
        let aiScore = 0;

        try {
            aiScore = await compareBiosWithAI(currentUserProfile.bio || "", alumniProfile.bio || "");
        } catch (e) {
            console.warn("AI comparison failed:", e.message);
        }

        matches.push({
            profile: alumniProfile,
            score: baseScore + aiScore
        });
    }

    // Sort best matches first
    matches.sort((a, b) => b.score - a.score);

    return matches.map(m => m.profile); // Return only profiles
}

async function searchProfiles(userCollection, query) {
    if (!query || query.trim() === "") return [];

    const regex = new RegExp(query, "i"); // case-insensitive

    return await userCollection.find({
        $or: [
            { name: regex },
            { lastname: regex },
            { username: regex },
            { bio: regex },
            { skills: regex },
            { interests: regex },
            { "education.program": regex },
            { "education.institution": regex },
            { "work.role": regex },
            { "work.company": regex },
            { "media.name": regex }
        ]
    }).project({
        name: 1,
        lastname: 1,
        username: 1,
        points:1,
        image: 1,
        bio: 1,
        skills: 1,
        user_type: 1,
        interests: 1,
        education: 1,
        work: 1,
        availability:1
    }).toArray();
}

async function rankUsersByPoints(userCollection, limit = 10) {
    try {
        const rankedUsers = await userCollection.find(
            { points: { $exists: true } } // Only users with a points field
        )
            .sort({ points: -1 }) // Descending order
            .limit(limit)
            .project({
                name: 1,
                lastname: 1,
                username: 1,
                image: 1,
                points: 1,
                user_type: 1,
                availability:1
            })
            .toArray();

        return rankedUsers;
    } catch (err) {
        console.error("Error ranking users:", err);
        return [];
    }
}


const networkRoutes = (userCollection) => {
    router.get("/", async (req, res) => {
        if(req.session.authenticated){
        res.render("home", { css: [null] , alumni: await getAlumniList(userCollection)});
        }else{
            res.redirect("/login");
        }
    });

    router.get("/network", (req, res) => {
        res.render("network");
    });

    router.get("/match-alumni", async (req, res) => {
        const currentUserProfile = req.session.userProfile;
        if(req.session.authenticated){
            const matchedAlumni = await matchAlumni(userCollection, currentUserProfile);
            res.render("home", { alumni:matchedAlumni });
        }else{
            res.redirect("/login");
        }

    });

    router.get("/search", async (req, res) => {
        const query = req.query.query;

        if(req.session.authenticated){
            const matchedAlumni = await searchProfiles(userCollection, query);
            console.log(JSON.stringify(matchedAlumni));
            res.render("home", { alumni:matchedAlumni.filter((e)=>e.user_type.toLowerCase()==="alumni") });
        }else{
            res.redirect("/login");
        }

    });

    return router;
};



module.exports = {networkRoutes};
