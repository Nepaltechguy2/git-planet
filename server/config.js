const path = require('path');
module.exports = {
    "port": 2020,
    "bodyLimit": "100kb",
    "corsHeaders": [
        "Link"
    ],
    "database": {
        "url": "mongodb://localhost:27017",
        "name": "planet",
        "secret": "W2LgrFtl2+PyN4SVfWdsIlUz5e1fM0saCenvu5JiJZyk4EDgw3EIL86u4OqExXDhbQcTGRpa5vlGbvWnuqtbVLnCMGczycwkjjEd"
    },
    "convert": {
        "lilypond": "C:\\Program Files (x86)\\LilyPond\\usr\\bin\\lilypond-windows.exe",
        "cli_options": "",
        "outputDir": path.join(__dirname, '../tmp/')
    }
};
