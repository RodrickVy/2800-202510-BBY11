const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { getUserCollection } = require('../../databaseConnection');
const { loadPage } = require('../../util');

// Login routes
router.get('/login', async (req, res) => {
  const error = req.query.error;
  const success = req.query.success;
  res.send(await loadPage('./app/auth/login.html', { error, success }));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Validation
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });
  
  const validationResult = schema.validate({ email, password });
  if (validationResult.error) {
    return res.redirect('/login?error=Invalid input');
  }

  // Check user exists
  const user = await getUserCollection.findOne({ email });
  if (!user) {
    return res.redirect('/login?error=User not found');
  }

  // Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.redirect('/login?error=Invalid credentials');
  }

  // Create session
  req.session.authenticated = true;
  req.session.user = {
    id: user._id,
    email: user.email,
    name: user.name
  };

  res.redirect('/');
});

// Signup routes
router.get('/signup', async (req, res) => {
  const error = req.query.error;
  res.send(await loadPage('./app/auth/signup.html', { error }));
});

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });

  const validationResult = schema.validate({ name, email, password });
  if (validationResult.error) {
    return res.redirect('/signup?error=Invalid input');
  }

  // Check if user exists
  const existingUser = await getUserCollection.findOne({ email });
  if (existingUser) {
    return res.redirect('/signup?error=Email already in use');
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 12);
  await getUserCollection.insertOne({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date()
  });

  res.redirect('/login?success=Account created. Please login.');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;