const express = require("express");
const JwtStrategy = require("passport-jwt").Strategy;
const project = require("./project.js");
const convert = require("./convert.js");
const tags = require("./tags.js");
const user = require("./users.js");
const groups = require("./groups.js");
const quote = require("./quotes");
const Git = require("nodegit");
const UserHandler = require("./libs/UserHandler.js");

module.exports = ({ config, db, passport }) => {
    const JwtOpts = {
        jwtFromRequest: req =>
            req && req.header
                ? req.header("Authorization").replace("Bearer ", "")
                : null,
        secretOrKey: config.database.secret
    };
    passport.use(
        new JwtStrategy(JwtOpts, (jwt_payload, done) => {
            db.collection("users").findOne(
                {
                    username: jwt_payload.username
                },
                (err, user) => {
                    return done(err ? err : null, user ? user : null);
                    // If error, callback err. If user, callback user.
                }
            );
        })
    );
    let router = express.Router();

    router.use(passport.initialize());
    router.use(passport.session());

    router.post("/api/project", project(config, db, passport).create);
    router.get("/api/project/search", project(config, db).search);
    router.get(
        "/api/project/:projectID",
        project(config, db).getProjectDetails
    );
    router.get(
        "/api/project/:projectID/download",
        project(config, db).downloadProject
    );
    router.post("/api/project/isPublished", project(config, db).isPublished);
    router.post("/api/project/:projectID/report", project(config, db).report);
    router.post(
        "/api/project/:projectID/like/:amount",
        project(config, db).like
    );

    router.get("/api/groups", groups(config, db).search);

    router.post("/api/convert/:from/:to", convert(config, db).convert);

    router.get("/api/tags", tags(config, db).list);

    passport.serializeUser((user, done) => done(null, user));

    passport.deserializeUser((usr, done) => {
        db.collection("users").findOne(
            {
                _id: usr._id
            },
            (err, result) => {
                done(UserHandler.cleanUserObject(result));
            }
        );
    });

    router.get("/api/user/info", user(config, db, passport).info);
    router.post("/api/user/create", user(config, db).create); // creates and logs in
    router.post("/api/user/login", user(config, db).login);

    router.get("/api/quote", quote(config, db).rand);

    return router;
};
