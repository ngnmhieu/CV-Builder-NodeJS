var resumes   = require('../models/resumes.server.model'),
    ObjectId  = require('mongodb').ObjectId;

/**
 * returns basic information section in a resume
 * @param req
 * @param res
 */
exports.read = function (req, res) {
    res.json(req.resumeObj.basicinfo);
};

/**
 * updates basic information section in a resume
 * @param req
 * @param res
 */
exports.update = function (req, res) {

    resumes.updateBasicInfo(req.resumeObj, req.body, function (err, result) {
        if (err) {
            switch(err) {
                case 'validation_error': 
                    res.sendStatus(400); return;
                default:
                    throw err;
            }
        }

        res.sendStatus(200);
    });
};
