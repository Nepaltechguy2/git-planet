const crypto = require("crypto");
const config = require("../../config");

hashUsername = username =>
    crypto
        .createHmac("sha256", config.database.secret)
        .update(username)
        .digest("hex");

cleanUserObject = user => {
    delete user.password;
    return user;
};

module.exports = {
    hashUsername,
    cleanUserObject
};
