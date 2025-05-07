const express = require("express");
const port = process.env.PORT || 3000;
const app = express();

app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

// RUN SERVER
app.listen(port, function () {
    console.log("BCIT Connect Is Live On " + port + "!");
});