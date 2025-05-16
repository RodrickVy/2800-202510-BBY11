const express = require('express');
const fs = require('fs');
const path = require('path');

const {OpenAI} = require("openai");

// OpenAI setup (use your own API key via env or config)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const router = express.Router();
const careersPath = path.join(__dirname, '../app/career_planner/careers.json');
const rawData = fs.readFileSync(careersPath, 'utf8');
const careers = JSON.parse(rawData);

const careerQuiz = {
    title: "BCIT Connect – Career Path Quiz",
    description: "Discover which tech career suits you best!",
    questions: [
        {
            id: 1,
            question: "How would your classmates or teammates describe you?",
            options: [
                "Someone who genuinely cares about others and always offers support",
                "A driven, ambitious person bursting with creative energy",
                "A design-savvy thinker with a great eye for layout and visuals",
                "A strategic planner who takes the lead and organizes the group",
                "A hands-on builder who loves solving tough problems",
                "A people-focused teammate who makes everything more intuitive",
                "A logical thinker who enjoys working with numbers and efficiency"
            ]
        },
        {
            id: 2,
            question: "If you had to take one BCIT elective today, which would you choose?",
            options: [
                "Introduction to Human Psychology",
                "Discrete Mathematics",
                "Digital Marketing Essentials",
                "Graphic Design Fundamentals",
                "Agile Project Management",
                "Advanced Web Development"
            ]
        },
        {
            id: 3,
            question: "Which type of task sounds most enjoyable to you?",
            options: [
                "Analyzing data patterns using Excel or SQL",
                "Collaborating with peers to map out a product roadmap",
                "Interviewing users to better understand their needs",
                "Building an interactive app from scratch using JavaScript",
                "Designing a sleek and engaging user interface",
                "Writing compelling copy and messages for a product launch"
            ]
        },
        {
            id: 4,
            question: "You and your team are launching a student startup. What role would you naturally take?",
            options: [
                "Project coordinator ensuring deadlines and communication",
                "Visual designer crafting the logo and brand theme",
                "Analyst identifying where to grow and improve",
                "Campaign manager running digital ads and outreach",
                "Backend developer setting up the servers and logic",
                "UX researcher making sure the app meets user needs"
            ]
        },
        {
            id: 5,
            question: "What’s your ideal workday in the tech industry?",
            options: [
                "A few hours of focused creative time in Figma or Photoshop",
                "Diving deep into spreadsheets, performance logs, or scripts",
                "Coordinating the project pipeline and updating team boards",
                "Collaborating with devs to brainstorm interface ideas",
                "Fixing bugs and shipping features after stand-up",
                "Presenting progress to stakeholders and collecting feedback",
                "Reviewing KPIs and strategizing improvements"
            ]
        },
        {
            id: 6,
            question: "Which type of challenge are you most excited to solve?",
            options: [
                "Optimizing the checkout flow on an eCommerce app",
                "Redesigning a mobile app to make it more accessible",
                "Boosting campaign effectiveness through better messaging",
                "Forecasting user growth with data modeling",
                "Incorporating feedback into a better product design",
                "Creating a structured dev workflow for the team",
                "Debugging a persistent backend error"
            ]
        },
        {
            id: 7,
            question: "What aspect of your future tech career excites you most?",
            options: [
                "Playing a key role in a successful launch or product",
                "Knowing your work improves real users’ lives",
                "Seeing your designs or campaigns reach a wide audience",
                "Having the freedom to be both creative and technical",
                "Building functional tools or systems from scratch",
                "Making strategic decisions that impact outcomes",
                "Continuously learning new tools, languages, and trends"
            ]
        },
        {
            id: 8,
            question: "When you set up a new phone, what do you do first?",
            options: [
                "Customize the home screen and widgets",
                "Rearrange icons and shortcuts for convenience",
                "Install your must-have apps first",
                "Restore all saved data and configs",
                "Send your new number to friends",
                "Read the manual to understand all features",
                "Set a custom wallpaper and theme"
            ]
        },
        {
            id: 9,
            question: "You’re about to launch a new student app. What’s your top priority?",
            options: [
                "Making sure it’s been tested with real users",
                "Ensuring the UI is intuitive and accessible",
                "Staying on budget and delivering on time",
                "Eliminating bugs and ensuring stability",
                "Creating a strong marketing campaign",
                "Designing a stunning and on-brand interface",
                "Solving a real, meaningful student problem"
            ]
        }
    ]
};

const careerRoutes = (userCollection) => {
    router.get("/career_quiz", (req, res) => {
        res.render("careerQuiz", {error: null, title: " Career Quiz", ...careerQuiz});
    });

// POST route to handle form submission
    router.post("/submitCareerQuiz", async (req, res) => {
        const quizAnswers = req.body.quizAnswers;
        console.log(quizAnswers)

        const result = await userCollection
            .find({ username: req.session.username })
            .project({
                username: 1,
                password: 1,
                user_type: 1,
                education: 1,
                work: 1,
                skills: 1,
                description: 1,
                image: 1,
                media: 1
            })
            .toArray();


        if (result.length !== 1) {
            return res.redirect("/login?error=invalid");
        }

        const userProfile = {
            ...result[0]
        };

        console.log(userProfile);

        const prompt = `
                You are a career advisor. Based on the answers given to these questions (Q&A), as-well as the profile recommend 3 tech career paths that would match.
                Your entire response should be in this format for each career:
                
                Name Of Career: official career name  
                Description of career: 1 paragraph description  
                Skills for career: at least 10 skills comma seperated  
                Average pay for career: in dollars yearly salary  
                Similar roles: a list of at least 5  comma seperated
                Why this career suits me: 1 paragraph  
                average start salary: a range e.g 68k-80k
                average median salary:a range e.g 68k-80k
                
                Q&A: 
                ${quizAnswers}
                
                Profile: 
                ${JSON.stringify(userProfile, null, 2)}
                
                Return only careers that strongly align based on the user's answers and background.`;

        try {

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: prompt}],
                temperature: 0.7,
            });
            console.log(completion)
            const gptResponse = completion.choices[0].message.content;

            res.render("careerQuizResults", {
                title: "Career Suggestions",
                results: gptResponse,
            });

        } catch (err) {
            console.error("Error calling OpenAI:", err);
            res.render("careerQuizError", {
                error: "We couldn't process your results due to an internal error.",
            });
        }
    });

    router.get('/careers', (req, res) => {
        try {

            res.render('careers', {careers});
        } catch (err) {
            console.error("Failed to load career data:", err);
            res.status(500).render('error', {
                message: "Failed to load career data",
                error: err
            });
        }
    });

    return router;
};

module.exports = {careerRoutes};



