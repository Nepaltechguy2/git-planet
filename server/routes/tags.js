module.exports = (config, db) => {
    let tags = db.collection("tags");
    return {
        list: (req, res, next) => {
            tags.find({})
                .sort([["TagName", 1]])
                .limit(50)
                .toArray((err, result) => {
                    if (err) {
                        return next(new Error("ERROR_INTERNAL_DATABASE"));
                    }
                    res.json({ success: true, data: result });
                });
        }
    };
};
