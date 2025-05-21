const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const router = express.Router();
const expireTime = 1 * 60 * 60 * 1000; // 1 hour

const authRoutes = (userCollection) => {
    router.get("/signup", (req, res) => {
        res.render("signup", {error: null});
    });

    router.post("/submitUser", async (req, res) => {
        const {name, username, password} = req.body;

        const schema = Joi.object({
            name: Joi.string().min(1).required(),
            username: Joi.string().email().required(),
            password: Joi.string().max(20).required(),
        });

        const validationResult = schema.validate({name, username, password});
        if (validationResult.error) {
            console.log(validationResult.error);
            return res.render("signup", {
                error: `invalid input: ${validationResult.error.message}`,
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await userCollection.insertOne({
            name: name,
            username: username,
            password: hashedPassword,
            lastname: "",
            user_type: "",
            points:0,
            education: [{credentials: "Degree", institution: "BCIT", endyear: "2027", program: " Computer Science"}],
            work: [{role: "Student Developer", company: "BCIT", years: "2024-2025", description: " Worked as a IT department head for a while."}],
            skills: ["Development","AGILE","Windows","Figma"],
            bio: "",
            interests: ["Programing","Music", "Engineering"],
            image: "",
            media: [{name: "", url: ""}],
            notifications: [{objectID: null, text: "", date: null, read: false}],
            availability: {
                monday:    [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }],
                tuesday:   [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }],
                wednesday: [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }],
                thursday:  [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }],
                friday:    [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }],
                saturday:  [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }],
                sunday:    [{ start: '06:00', end: '09:00' }, { start: '17:00', end: '21:00' }]
            }
        });
        console.log("Inserted user");

        const result = await userCollection
            .find({ username:  username })
            .project({
                username: 1,
                name:1,
                lastname:1,
                password: 1,
                user_type: 1,
                education: 1,
                points:1,
                interests:1,
                work: 1,
                skills: 1,
                bio: 1,
                image: 1,
                media: 1,
                availability:1
            })
            .toArray();
        if (result.length !== 1) {
            return res.redirect("/login?error=invalid");
        }

        const userProfile = {
            ...result[0]
        };
        req.session.authenticated = true;
        req.session.username = username;
        req.session.name = name;
        req.session.cookie.maxAge = expireTime;
        req.session.userProfile = userProfile;
        req.session.user_id = result[0]._id;


        res.redirect("create-profile")
    });


    router.get("/login", (req, res) => {
        const error = req.query.error;
        res.render("login", {error});
    });

    router.post("/loggingin", async (req, res) => {
        const {username, password} = req.body;

        const schema = Joi.string().email().required();
        const validationResult = schema.validate(username);
        if (validationResult.error) {
            return res.redirect("/login?error=invalid");
        }

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
            return res.redirect("/login?error=invalid");
        }

        const validPassword = await bcrypt.compare(password, result[0].password);
        if (!validPassword) {
            return res.redirect("/login?error=invalid");
        }



        if (result.length !== 1) {
            return res.redirect("/login?error=invalid");
        }

        const userProfile = {
            ...result[0]
        };
        req.session.authenticated = true;
        req.session.username = username;
        req.session.userProfile = userProfile;
        req.session.name = result[0].name;
        req.session.cookie.maxAge = expireTime;
        req.session.user_id = result[0]._id;

        res.redirect("/account");
    });


    router.get("/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error:", err);
                return res.redirect("/login?error=logout-failed");
            }
            res.clearCookie("connect.sid"); // Optional, good practice
            res.redirect("/login");
        });
    });

    return router;
};

module.exports = {authRoutes};
