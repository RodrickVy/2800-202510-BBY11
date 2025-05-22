const express = require("express");
const { getAlumniList, getTopUsersByPoints, matchAlumni, searchProfiles, rankUsersByPoints } = require("../public/scripts/network/network");

const { OpenAI } = require("openai");

// OpenAI setup (use your own API key via env or config)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const router = express.Router();

const networkRoutes = (userCollection) => {
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

    router.get("/leaderboard", async (req, res) => {
        const currentUserProfile = req.session.userProfile;
        if(req.session.authenticated){
            const matchedAlumni = await getTopUsersByPoints(10,userCollection);
            res.render("home", { alumni:matchedAlumni });
        }else{
            res.redirect("/login");
        }

    });

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
