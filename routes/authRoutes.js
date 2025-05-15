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
            education: [{credentials: "", institution: "", endyear: "", program: ""}],
            work: [{role: "", company: "", years: "", description: ""}],
            skills: [],
            bio: "",
            interests: [],
            image: "",
            media: [{name: "", url: ""}]
        });
        console.log("Inserted user");

        const result = await userCollection
            .find({username: username})
            .project({username: 1, password: 1})
            .toArray();


        req.session.authenticated = true;
        req.session.username = username;
        req.session.name = name;
        req.session.cookie.maxAge = expireTime;
        req.session.user_id = result[0]._id;


        res.render("createProfile", {css: [null]});
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
            .find({username: username})
            .project({username: 1, password: 1})
            .toArray();

        if (result.length !== 1) {
            return res.redirect("/login?error=invalid");
        }

        const validPassword = await bcrypt.compare(password, result[0].password);
        if (!validPassword) {
            return res.redirect("/login?error=invalid");
        }

        req.session.authenticated = true;
        req.session.username = username;
        req.session.name = result[0].name;
        req.session.cookie.maxAge = expireTime;
        req.session.user_id = result[0]._id;

        res.render("account");
    });

    return router;
};

module.exports = {authRoutes};
