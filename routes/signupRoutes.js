const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const router = express.Router();
const expireTime = 1 * 60 * 60 * 1000; // 1 hour

module.exports = function (userCollection) {
  router.get("/signup", (req, res) => {
    res.render("signup", { error: null });
  });

  router.post("/submitUser", async (req, res) => {
    const { name, username, password } = req.body;

    const schema = Joi.object({
      name: Joi.string().min(1).required(),
      username: Joi.string().email().required(),
      password: Joi.string().max(20).required(),
    });

    const validationResult = schema.validate({ name, username, password });
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
    });
    console.log("Inserted user");

    req.session.authenticated = true;
    req.session.username = username;
    req.session.name = name;
    req.session.cookie.maxAge = expireTime;

    res.redirect("/");
  });

  return router;
};
