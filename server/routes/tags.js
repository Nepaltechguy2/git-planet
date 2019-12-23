let tagManifest = {
    "success": true,
    "data": {
        "1": {"TagName": "Examples", "IsTagUserAddable": "0", "IsDisplayTag": "1"},
        "2": {"TagName": "Music", "IsTagUserAddable": "1", "IsDisplayTag": "1"},
        "3": {"TagName": "Art", "IsTagUserAddable": "1", "IsDisplayTag": "1"},
        "4": {"TagName": "Math", "IsTagUserAddable": "1", "IsDisplayTag": "1"},
        "5": {"TagName": "Interactive", "IsTagUserAddable": "1", "IsDisplayTag": "1"},
        "6": {"TagName": "Design", "IsTagUserAddable": "1", "IsDisplayTag": "1"},
        "7": {"TagName": "Game", "IsTagUserAddable": "1", "IsDisplayTag": "1"},
        "8": {"TagName": "Media", "IsTagUserAddable": "1", "IsDisplayTag": "0"},
        "9": {"TagName": "Sensors", "IsTagUserAddable": "1", "IsDisplayTag": "0"},
        "10": {"TagName": "Effects", "IsTagUserAddable": "1", "IsDisplayTag": "0"}
    }
};

module.exports = (config, db)=> {
    return {
        list: (req, res, next)=>{
            // TODO actually list tags :)
            res.json(tagManifest);
        }
    }
}
