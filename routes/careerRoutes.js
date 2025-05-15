const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/careers', (req, res) => {
    try {
        const careersPath = path.join(__dirname, '../app/career_planner/careers.json');
        const rawData = fs.readFileSync(careersPath, 'utf8');
        const careers = JSON.parse(rawData);
        res.render('careers', { careers });
    } catch (err) {
        console.error("Failed to load career data:", err);
        res.status(500).render('error', {
            message: "Failed to load career data",
            error: err
        });
    }
});

module.exports = router;
