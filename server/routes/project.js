let UserHandler = require('./libs/UserHandler');
module.exports = (config, db, passport) => {
    let projects = db.collection("projects");
    let blacklistedProperties = ["likedUsers", "ProjectReportedCount"];

    function cleanResults(result) {
        let rslt = [];
        result.forEach(project => {
            blacklistedProperties.forEach(prop => {
                delete project[prop];
            });
            let date = new Date(project.ProjectCreatedDate);
            rslt.push([project.ProjectID, date.toUTCString()]);
        });
        return rslt;
    }

    function unsuccessful(errorMessage, next) {
        next(new Error(errorMessage));
    }

    function createProject(req, res, next, user) {
        if (
            !req.body.ProjectID ||
            !req.body.ProjectName ||
            !req.body.ProjectDescription ||
            !req.body.ProjectSearchKeywords ||
            !req.body.ProjectData ||
            !req.body.ProjectIsMusicBlocks ||
            !req.body.ProjectTags
        ) {
            console.log(
                !req.body.ProjectID,
                !req.body.ProjectName,
                !req.body.ProjectDescription,
                !req.body.ProjectSearchKeywords,
                !req.body.ProjectData,
                !req.body.ProjectIsMusicBlocks,
                !req.body.ProjectTags
            );
            return unsuccessful("ERROR_INVALID_PARAMETERS", next);
        }
        try {
            let tags = JSON.parse(req.body.ProjectTags);
            tags = tags.map(tag => parseInt(tag));
            let date = new Date();
            let projectImage = req.body.ProjectImage;
            if (req.body.ProjectImage === "null") {
                projectImage = "";
            }
            projects
                .updateOne({ProjectID: parseInt(req.body.ProjectID)}, {
                    $set: {
                        ProjectID: parseInt(req.body.ProjectID),
                        ProjectName: req.body.ProjectName,
                        ProjectDescription: req.body.ProjectDescription,
                        ProjectSearchKeywords: req.body.ProjectSearchKeywords,
                        ProjectData: req.body.ProjectData,
                        ProjectImage: projectImage,
                        ProjectIsMusicBlocks: req.body.ProjectIsMusicBlocks,
                        ProjectCreatorName:
                            (user ? user.username : "") ||
                            req.body.ProjectCreatorName ||
                            "anonymous",
                        ProjectTags: tags,
                        ProjectLikes: 0,
                        ProjectDownloads: 0,
                        ProjectLastUpdated: date.toUTCString(),
                        ProjectCreatedDate: date.toUTCString(),
                        ProjectReportedCount: 0,
                        likedUsers: []
                    }
                }, { upsert: true }, (err, result)=>{
                    if(err) {
                        console.error(err);
                        return unsuccessful("ERROR_INVALID_PARAMETERS", next);
                    } else {
                        res.json({
                            success: true
                        });
                    }
                })
        } catch (e) {
            console.error(e);
            return unsuccessful("ERROR_INVALID_PARAMETERS", next);
        }
    }

    return {
        create: async (req, res, next) => {
            passport.authenticate("jwt", function (err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    createProject(req, res, next, user);
                }
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    createProject(req, res, next, user);
                });
            })(req, res, next);
        },
        getProjectDetails: async (req, res, next) => {
            let ProjectID;
            try {
                ProjectID = parseInt(req.params.projectID);
            } catch (e) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            projects.find({ProjectID: ProjectID}).toArray((err, result) => {
                if (err) {
                    console.error(err);
                    return unsuccessful("ERROR_INTERNAL_DATABASE", next);
                }
                if (result.length < 1) {
                    return unsuccessful("ERROR_PROJECT_NOT_FOUND", next);
                }
                res.json({
                    success: true,
                    data: result[0]
                });
            });
        },
        search: async (req, res, next) => {
            // check params.
            if (!req.query.query && !req.query.tags && !req.query.tag) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            // establish sort order
            let sortKeyOrder;
            if (!req.query.sort) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            } else {
                let sortKey = {
                    RECENT: ["ProjectLastUpdated", -1],
                    LIKED: ["ProjectLikes", -1],
                    DOWNLOADED: ["ProjectDownloads", -1],
                    ALPHABETICAL: ["ProjectName", 1],
                    RELEVANCE: {score: {$meta: "textScore"}}
                };
                sortKeyOrder = [sortKey[req.query.sort.toUpperCase()]];
            }
            // where do we start?
            let start, end;
            try {
                start = parseInt(req.query.start) || 0;
                end = parseInt(req.query.end) || 25;
            } catch (e) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            if (end - start >= 100) {
                // 0 -> 100 is 101 objects
                return unsuccessful("ERROR_TOO_MANY", next);
            }

            // do different things depending search type.
            if (req.query.tag) {
                let tag, query;
                if (req.query.tag.toUpperCase() !== "ALL_PROJECTS") {
                    tag = parseInt(req.query.tag);
                    if (isNaN(tag)) {
                        return unsuccessful("ERROR_INVALID_PARAMETERS", next);
                    }
                    query = {
                        ProjectTags: {
                            $all: [tag]
                        }
                    };
                } else {
                    query = {};
                }

                projects
                    .find(query)
                    .sort(sortKeyOrder)
                    .skip(start)
                    .limit(end - start)
                    .toArray((err, result) => {
                        if (err) {
                            console.error(err);
                            next(err);
                            return;
                        }
                        res.json({success: true, data: cleanResults(result)});
                    });
            } else if (req.query.tags) {
                let tags, query;
                try {
                    tags = JSON.parse(req.query.tags);
                    tags = tags.map(num => parseInt(num));
                    query = {
                        ProjectTags: {
                            $all: tags
                        }
                    };
                } catch (e) {
                    if (req.query.tags.toUpperCase() === "ALL_PROJECTS") {
                        query = {};
                    } else {
                        return unsuccessful("ERROR_INVALID_PARAMETERS", next);
                    }
                }
                projects
                    .find(query)
                    .sort(sortKeyOrder)
                    .skip(start)
                    .limit(end - start)
                    .toArray((err, result) => {
                        if (err) {
                            console.error(err);
                            next(err);
                            return;
                        }
                        res.json({success: true, data: cleanResults(result)});
                    });
            } else {
                // if any word appears in the name, description, or keywords, then show it.
                // rank via sort param

                // if user format then grab that too.
                let dbQuery = {$text: {$search: req.query.query}};
                if (req.query.query.toLowerCase().substring(0, 5) === "user:") {
                    dbQuery = {
                        ProjectCreatorName: UserHandler.hashUsername(req.query.query.substring(5))
                    }
                }
                projects
                    .find(
                        dbQuery,
                        {score: {$meta: "textScore"}}
                    )
                    .sort(sortKeyOrder)
                    .skip(start)
                    .limit(end - start)
                    .toArray((err, result) => {
                        if (err) {
                            console.error(err);
                            next(err);
                            return;
                        }
                        res.json({success: true, data: cleanResults(result)});
                    });
            }
        },
        downloadProject: async (req, res, next) => {
            let ProjectID;
            try {
                ProjectID = parseInt(req.params.projectID);
            } catch (e) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            projects
                .updateOne(
                    {ProjectID: ProjectID},
                    {
                        $inc: {
                            ProjectDownloads: 1
                        }
                    }
                )
                .then(() => {
                    projects
                        .find({ProjectID: ProjectID})
                        .toArray((err, result) => {
                            if (err) {
                                console.error(err);
                                return unsuccessful(
                                    "ERROR_INTERNAL_DATABASE",
                                    next
                                );
                            }
                            if (result.length < 1) {
                                return unsuccessful(
                                    "ERROR_PROJECT_NOT_FOUND",
                                    next
                                );
                            }
                            res.json({
                                success: true,
                                data: result[0].ProjectData
                            });
                        });
                });
        },
        isPublished: async (req, res, next) => {
            let projectIDs;
            try {
                console.log(req.body.projects);
                projectIDs = JSON.parse(req.body.projects);
                projectIDs = projectIDs.map(id => parseInt(id));
            } catch (e) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            if (projectIDs.length > 100) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            projects
                .find({
                    ProjectID: {
                        $in: projectIDs
                    }
                })
                .toArray((err, result) => {
                    if (err) {
                        return unsuccessful("ERROR_INVALID_PARAMETERS", next);
                    }
                    let rslt = {};
                    result.forEach(project => {
                        rslt[project.ProjectID] = true;
                        return rslt;
                    });
                    res.json({
                        success: true,
                        data: rslt
                    });
                });
        },
        report: async (req, res, next) => {
            let projectID, reason, userid;
            try {
                projectID = parseInt(req.params.projectID);
            } catch (e) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            reason = req.body.reason;
            // TODO replace this with the implemented userid
            userid = req.body.userid;
            if (!reason || reason.length === 0 || !userid || !projectID) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            projects
                .updateOne(
                    {
                        ProjectID: projectID
                    },
                    {
                        $inc: {
                            ProjectReportedCount: 1
                        }
                    }
                )
                .then(updateResult => {
                    const {matchedCount, modifiedCount} = updateResult;
                    if (modifiedCount && matchedCount) {
                        db.collection("reports")
                            .insertOne({
                                user: userid,
                                reason: reason,
                                projectID: projectID
                            })
                            .then(() => {
                                res.json({
                                    success: true
                                });
                            });
                    } else {
                        next(new Error("ERROR_INVALID_PARAMETERS"));
                    }
                });
        },
        like: async (req, res, next) => {
            // TODO replace with userid
            let userid = parseInt(req.user.username),
                projectID = parseInt(req.params.projectID),
                amount = parseInt(req.params.amount);
            if (/*!userid || */ !projectID) {
                return unsuccessful("ERROR_INVALID_PARAMETERS", next);
            }
            if (amount) {
                // like
                // union with array. set array length to numLikes.
                projects
                    .findOneAndUpdate(
                        {
                            ProjectID: projectID
                        },
                        {
                            $addToSet: {
                                likedUsers: userid
                            }
                        }
                    )
                    .then(result => {
                        if (!result.value.likedUsers.includes(userid)) {
                            // increase num likes by one
                            projects
                                .updateOne(
                                    {
                                        ProjectID: projectID
                                    },
                                    {
                                        $inc: {
                                            ProjectLikes: 1
                                        }
                                    }
                                )
                                .then(() => {
                                    res.json({success: true});
                                });
                        } else {
                            res.json({success: true});
                        }
                    });
            } else {
                projects
                    .findOneAndUpdate(
                        {
                            ProjectID: projectID
                        },
                        {
                            $pull: {
                                likedUsers: userid
                            }
                        }
                    )
                    .then(result => {
                        if (result.value.likedUsers.includes(userid)) {
                            // increase num likes by one
                            projects
                                .updateOne(
                                    {
                                        ProjectID: projectID
                                    },
                                    {
                                        $inc: {
                                            ProjectLikes: -1
                                        }
                                    }
                                )
                                .then(() => {
                                    res.json({success: true});
                                });
                        } else {
                            res.json({success: true});
                        }
                    });
            }
        }
    };
};
