const express = require("express");
const { getAlumniList, getTopUsersByPoints, matchAlumni, searchProfiles, rankUsersByPoints } = require("../public/scripts/network/network");

const { OpenAI } = require("openai");

// OpenAI setup (use your own API key via env or config)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const router = express.Router();

// Networking and leaderboard routes for alumni and users
const networkRoutes = (userCollection) => {
  // Home page: show alumni list if authenticated
  router.get("/", async (req, res) => {
    if (req.session.authenticated) {
      res.render("home", {
        css: [null],
        alumni: await getAlumniList(userCollection),
      });
    } else {
      res.redirect("/login");
    }
  });

  // Network landing page
  router.get("/network", (req, res) => {
    res.render("network");
  });

  // Match alumni to current user
  router.get("/match-alumni", async (req, res) => {
    const currentUserProfile = req.session.userProfile;
    if (req.session.authenticated) {
      const matchedAlumni = await matchAlumni(userCollection, currentUserProfile);
      res.render("home", { alumni: matchedAlumni });
    } else {
      res.redirect("/login");
    }

  });

  // Leaderboard of top users by points
  router.get("/leaderboard", async (req, res) => {
    const currentUserProfile = req.session.userProfile;
    if (req.session.authenticated) {
      const userType = currentUserProfile.user_type
        ;
      const matchedAlumni = await getTopUsersByPoints(10, userCollection);
      res.render("home", { alumni: matchedAlumni, userType: userType });
    } else {
      res.redirect("/login");
    }

  });

  // Search alumni profiles
  router.get("/search", async (req, res) => {
    const query = req.query.query;

    if (req.session.authenticated) {
      const matchedAlumni = await searchProfiles(userCollection, query);
      console.log(JSON.stringify(matchedAlumni));
      res.render("home", {
        alumni: matchedAlumni.filter(
          (e) => e.user_type.toLowerCase() === "alumni"
        ),
      });
    } else {
      res.redirect("/login");
    }
  });

  return router;
};

module.exports = { networkRoutes };
