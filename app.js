const express = require("express");
const port = process.env.PORT || 4000;
const app = express();
const {loadPage} = require("./util.js")
const fs = require("fs");

// Redirects to notfound if a person tries to access HTML files directly.
app.use((req, res, next) => {
    const pattern = /^\/app\/[^\/]+\/[^\/]+\.html$/;

    if (pattern.test(req.path)) {
        res.redirect('/notFound')

    }else{
        next();
    }


});

app.use("/scripts", express.static("./public/scripts"));
app.use("/css", express.static("./public/css"));
app.use("/assets", express.static("./public/assets"));
app.use("/components", express.static("./public/components"));
app.use("/app", express.static("./app"));




// Intro page
app.get("/", async (req, res) => {
    res.send(await loadPage("./app/home/intro.html"))
})

// Home page
app.get("/home", async (req, res) => {
    res.send(await loadPage("./app/home/home.html"))
})

// Profile page
app.get("/createprofile", async (req, res) => {
    res.send(await loadPage("./app/profile/createprofile.html"))
})

//  Sends 404 page if route is unknown
app.use((req,res) => {

    const html =  fs.readFileSync("./public/components/404.html", 'utf8');
    res.status(404).send(html)
})


// RUN SERVER
app.listen(port, function () {
    console.log("BCIT Connect Is Live On " + port + "!");
});