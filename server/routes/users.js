const UserHandler = require("./libs/UserHandler");
const jwt = require("jwt-simple");
const bcrypt = require("bcrypt");
module.exports = (config, db, passport) => {
    return {
        create: (req, res, next) => {
            if (!req.body.username || !req.body.password)
                return next(new Error("ERROR_INVALID_PARAMETERS"));
            let group = req.body.group || "anonymous";
            db.collection("users").findOne({
                    username: UserHandler.hashUsername(req.body.username)
                },
                (err, user) => {
                    if (err) {
                        return next(new Error("ERROR_INVALID_PARAMETERS"));
                    }
                    if (user) {
                        return next(new Error("ERROR_USERNAME_TAKEN"));
                    }
                    bcrypt.hash(req.body.password, 10, (err, hash) => {
                        if (err) {
                            console.error(err);
                            return next(new Error("ERROR_INTERNAL_DATABASE"));
                        }
                        db.collection("users").insertOne({
                                username: UserHandler.hashUsername(
                                    req.body.username
                                ),
                                password: hash,
                                createdDate: new Date(),
                                lastLoggedInDate: new Date(),
                                groupID: group
                            },
                            (err, doc) => {
                                if (err) {
                                    console.error(err);
                                    return next(
                                        new Error("ERROR_INTERNAL_DATABASE")
                                    );
                                }
                                let cookie = jwt.encode(
                                    JSON.stringify({
                                        username: UserHandler.hashUsername(
                                            req.body.username
                                        )
                                    }),
                                    config.database.secret
                                );
                                res.cookie("token", cookie);
                                res.json({
                                    success: true,
                                    token: cookie
                                });
                            }
                        );
                    });
                }
            );
        },

        login: (req, res, next) => {
            if (!req.body.username || !req.body.password)
                return next(new Error("ERROR_INVALID_PARAMETERS"));
            db.collection("users").findOne({
                    username: UserHandler.hashUsername(req.body.username)
                },
                (err, user) => {
                    if (err) {
                        console.error(err);
                        return next(new Error("ERROR_INTERNAL_DATABASE"));
                    }
                    bcrypt.compare(
                        req.body.password,
                        user.password,
                        (err, result) => {
                            if (err) {
                                console.error(err);
                                return next(
                                    new Error("ERROR_INTERNAL_DATABASE")
                                );
                            }
                            if (result) {
                                let cookie = jwt.encode(
                                    JSON.stringify({
                                        username: user.username
                                    }),
                                    config.database.secret
                                );
                                res.cookie("token", cookie);
                                delete user.password;
                                res.json({
                                    success: true,
                                    data: user,
                                    token: cookie
                                });
                            } else {
                                return next(
                                    new Error("ERROR_INCORRECT_PASSWORD")
                                );
                            }
                        }
                    );
                }
            );
        },

        info: (req, res, next) => {
            passport.authenticate("jwt", function(err, user, info) {
                console.log(user);
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.json({
                        success: false
                    });
                }
                req.logIn(user, function(err) {
                    if (err) {
                        return next(err);
                    }
                    return res.json({
                        success: true,
                        data: UserHandler.cleanUserObject(user)
                    });
                });
            })(req, res, next);
        }
    };
};
