var resumes   = require('../models/resumes.server.model'),
    ObjectId  = require('mongodb').ObjectId;

exports.read = function (req, res) {
    res.json(req.resumeObj.basicinfo);
};

exports.update = function (req, res) {

    resumes.updateBasicInfo(req.resumeObj, req.body, function (err, result) {
        if (err) {
            switch(err) {
                case 'validation_error': 
                    res.sendStatus(422); return;
                default:
                    throw err;
            }
        }

        res.sendStatus(200);
    });
};
