module.exports = (config, db) => {
    return {
        search: (req, res, next) => {
            db.collection("groups")
                .find({})
                .toArray((err, result) => {
                    if (err) return next(new Error("ERROR_INTERNAL_DATABASE"));
                    res.json({
                        success: true,
                        data: result
                    });
                });
        }
    };
};
