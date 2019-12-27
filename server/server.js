const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const initializeDb = require("./db.js");
const middleware = require("./middleware.js");
const router = require("./routes/index.js");
const config = require("./config.js");
const ERRORMESSAGES = require("./errormessages.json");

let app = express();
app.server = http.createServer(app);

app.use(morgan("dev"));

app.use(
    cors({
        exposedHeaders: config.corsHeaders
    })
);

app.use(bodyParser.urlencoded({ extended: true }));

// connect to db
initializeDb(db => {
    app.use(cookieParser());

    app.use(middleware({ config, db }));
    app.use(router({ config, db,  passport }));

    app.server.listen(config.port, () => {
        console.log(`Started on port ${app.server.address().port}`);
    });
    app.use((err, req, res, next) => {
        console.log(err.message);
        res.json({
            success: false,
            error: ERRORMESSAGES[err.message],
            errorCode: err.message
        });
    });

    app.all("*", (req, res) =>
        res.send("Musicblocks Planet - https://musicblocks.sugarlabs.org")
    );
});
