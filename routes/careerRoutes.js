const express = require("express");
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const { careerQuiz, generateCareerPrompt } = require("../public/scripts/career/careerQuiz");

// OpenAI setup (use your own API key via env or config)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();
const careersPath = path.join(__dirname, "../app/data/careers.json");
const rawData = fs.readFileSync(careersPath, "utf8");
const careers = JSON.parse(rawData);



const careerRoutes = (userCollection) => {
  router.get("/career_quiz", (req, res) => {
    res.render("careerQuiz", {
      error: null,
      title: " Career Quiz",
      ...careerQuiz,
    });
  });

  // POST route to handle form submission
  router.post("/submitCareerQuiz", async (req, res) => {
    const quizAnswers = req.body.quizAnswers;
    console.log(quizAnswers);

    const result = await userCollection
      .find({ username: req.session.username })
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
        availability: 1,
      })
      .toArray();

    if (result.length !== 1) {
      return res.redirect("/login?error=invalid");
    }

    const userProfile = {
      ...result[0],
    };

    try {
      const prompt = generateCareerPrompt(quizAnswers, userProfile);
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      console.log(JSON.stringify(completion.choices[0].message));
      const gptResponse = completion.choices[0].message.content;
      console.log(gptResponse);
      res.render("careerQuizResults", {
        title: "Career Suggestions",
        careers: JSON.parse(gptResponse),
      });
    } catch (err) {
      res.render("error", {
        error: "something went wrong while generating your report",
        redirectLink: "/career_quiz",
        redirectLinkCTA: "Try Quiz Again",
        currentPage: "careers",
      });
    }
  });

  router.get("/careers", (req, res) => {
    try {
      const careersPath = path.join(__dirname, "../app/data/careers.json");
      const rawData = fs.readFileSync(careersPath, "utf8");
      const careers = JSON.parse(rawData);

      // Map to only send necessary data to the listing page
      const careerList = careers.map((career) => ({
        title: career.title,
        summary: career.summary,
        slug: career.slug,
      }));
      res.render("careers", {
        title: "Career Paths",
        careers: careerList,
      });
    } catch (err) {
      console.error("Failed to load career data:", err);
      res.status(500).render("error", {
        error: "Failed to load career data",
        redirectLink: "/",
        redirectLinkCTA: "Report & go Home",
        currentPage: "careers",
      });
    }
  });

  router.get("/careers/:slug", async (req, res) => {
    try {
      const careersPath = path.join(__dirname, "../app/data/careers.json");
      const rawData = fs.readFileSync(careersPath, "utf8");
      const careers = JSON.parse(rawData);

      const career = careers.find((c) => c.slug === req.params.slug);

      if (!career) {
        return res.status(404).render("404");
      }

      // query alumnni with at least one skill matching the career
      const matchedAlumni = await userCollection
        .find({
          user_type: "alumni",
          skills: { $in: career.skills },
        })
        .toArray();

      //Score & sort by number of overlapping skills
      const scored = matchedAlumni
        .map((al) => {
          const overlap = al.skills.filter((s) => career.skills.includes(s));
          return { ...al, score: overlap.length };
        })
        .sort((a, b) => b.score - a.score);

      res.render("careerDetails", {
        title: career.title,
        career,
        alumni: scored,
      });
    } catch (err) {
      console.error("Failed to load career data:", err);
      res.status(500).render("error", {
        error: "Failed to load career data",
        redirectLink: "/",
        redirectLinkCTA: "Report & go Home",
        currentPage: "careers",
      });
    }
  });

  return router;
};

module.exports = { careerRoutes };
