const express = require("express");

const router = express.Router();

// Assumes you're using Express and MongoDB
async function getAlumniList(userCollection) {
    try {
        const alumni = await userCollection.find({ user_type: "alumni" }).toArray();
        return alumni;
    } catch (err) {
        console.error("Failed to fetch alumni:", err);
        return [];
    }
}

const networkRoutes = (userCollection) => {
    router.get("/", async (req, res) => {
        res.render("home", { css: [null] , alumni:getAlumniList(userCollection)});
    });

    router.get("/network", (req, res) => {
        res.render("network");
    });



    return router;
};



module.exports = {networkRoutes};
