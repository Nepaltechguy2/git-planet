const MongoClient = require('mongodb').MongoClient;
const config = require('./config.js');


function initializeDB(callback) {
    MongoClient.connect(config.database.url, {
        useUnifiedTopology: true
    }, function (err, client) {
        console.log("Connected successfully to server");
        const db = client.db(config.database.name);
        callback(db);
        // client.close();
    });
}

module.exports = initializeDB;
