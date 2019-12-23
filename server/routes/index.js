const express = require('express');
const project = require('./project.js');
const tags = require('./tags.js');

module.exports = ({config, db}) => {
    let router = express.Router();

    router.post("/api/project", project(config, db).create);
    router.get("/api/project/search", project(config, db).search);
    router.get("/api/project/:projectID", project(config, db).getProjectDetails);
    router.get("/api/project/:projectID/download", project(config, db).downloadProject);
    router.post("/api/project/isPublished", project(config, db).isPublished);
    router.post("/api/project/:projectID/report", project(config, db).report);
    router.post("/api/project/:projectID/like/:amount", project(config, db).like);
    router.post("/api/project/:projectID/convert/:from/:to", project(config, db).convert);

    router.get("/api/tags", tags(config, db).list);

    return router;
};
