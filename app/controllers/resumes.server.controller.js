var resumes = require('../models/resumes.server.model');
var ObjectId = require('mongodb').ObjectId;

/**
 * GET /resumes/:id
 */
exports.read = function (req, res) {
    res.json(req.resumeObj);
};

/**
 * POST /resumes/
 */
exports.create = function (req, res) {

    resumes.createEmpty(function (err, result) {
        if (err) throw err;

        res.location('/resumes/' + result.insertedId);

        res.sendStatus(201);
    });
};

exports.sections = function (req, res) {

    var resume = req.resumeObj;

    if (!Array.isArray(resume.sections)) {
        resume.sections = [];
    }

    res.json(resume.sections);
};

/**
 * DELETE /resumes/:id
 */
exports.remove = function (req, res) {

    resumes.collection.deleteOne({_id: req.resumeObj._id}, function (err, result) {
        if (err) throw err;
        res.sendStatus(200);
    });
};

exports.byId = function (req, res, next, id) {

    if (!ObjectId.isValid(id)) {
        res.sendStatus(404);
        return;
    }

    resumes.collection.findOne({_id: ObjectId(id)}, function (err, result) {
    
        if (err) throw err;   

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.resumeObj = result;

        next();
    });
};
