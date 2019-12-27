const temp = require("temp"),
    fs = require("fs"),
    path = require("path"),
    exec = require("child_process").exec;

temp.track(true);

module.exports = (config, db) => {
    return {
        convert: async (req, res, next) => {
            if (!req.body.data || !req.params.from || !req.params.to) {
                return next(new Error("ERROR_INVALID_PARAMETERS"));
            }
            let cliOpts = "";
            switch (req.params.from.toUpperCase()) {
                case "LY":
                    cliOpts += config.convert.lilypond + " ";
                    break;
                default:
                    return next(new Error("ERROR_NOT_IMPLEMENTED_YET"));
            }
            let fileEnding, contentType;
            switch (req.params.to.toUpperCase()) {
                case "PDF":
                    cliOpts += "--pdf --output " + config.convert.outputDir;
                    fileEnding = ".pdf";
                    contentType = "application/pdf";
                    break;
                default:
                    return next(new Error("ERROR_NOT_IMPLEMENTED_YET"));
            }
            temp.open("musicblocks-tmp-", function(err, info) {
                if (!err) {
                    fs.writeSync(info.fd, new Buffer(req.body.data, "base64"));
                    fs.close(info.fd, function(err) {
                        exec(
                            `"${config.convert.lilypond}" --pdf --output=${config.convert.outputDir} ${info.path}`,
                            function(err, stdout) {
                                console.log(info.path);
                                temp.cleanupSync();
                                let newFileName =
                                    path.basename(info.path).split(".")[0] +
                                    fileEnding;
                                let newFileDir = path.join(
                                    config.convert.outputDir,
                                    newFileName
                                );
                                let b64PDF = fs.readFileSync(
                                    newFileDir,
                                    "base64"
                                );
                                res.json({
                                    success: true,
                                    data: {
                                        contenttype: contentType,
                                        blog: b64PDF
                                    }
                                });
                            }
                        );
                    });
                }
            });
        }
    };
};
