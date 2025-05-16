const express = require("express");

const router = express.Router();


const networkRoutes = () => {
    router.get("/network", (req, res) => {
        res.render("network");
    });

    return router;
};

module.exports = {networkRoutes};
