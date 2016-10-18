var resumes = require('../models/resumes.server.model');
var ObjectId = require('mongodb').ObjectId;

/**
 * GET /users/:user_id/resumes/:id
 * returns a resume
 * @param req
 * @param res
 */
exports.read = function(req, res) {
    var resume = req.resumeObj;
    delete resume.user_id;
    res.json(resume);
};

/**
 * POST /users/:user_id/resumes/
 * creates an empty resume
 * @param req
 * @param res
 */
exports.create = function(req, res) {

    resumes.createEmpty(req.userObj, function(err, result) {

        if (err) throw err;

        if (req.is('json')) {
            res.location('/users/' + req.userObj._id + '/resumes/' + result.insertedId).sendStatus(201);
        } else {
            res.redirect('/resumes/' + result.insertedId);
        }
    });
};

/**
 * GET /users/:user_id/resumes/:id/sections
 * returns the section collection contained in this resume
 * @param req
 * @param res
 */
exports.sections = function(req, res) {

    var resume = req.resumeObj;

    if (!Array.isArray(resume.sections)) {
        resume.sections = [];
    }

    res.json(resume.sections);
};

/**
 * DELETE /users/:user_id/resumes/:id
 * deletes a resume
 * @param req
 * @param res
 */
exports.remove = function(req, res) {

    resumes.collection.deleteOne({
        _id: req.resumeObj._id
    }, function(err, result) {
        if (err) throw err;
        res.sendStatus(200);
    });
};

exports.byId = function(req, res, next, id) {

    if (!ObjectId.isValid(id)) {
        res.sendStatus(404);
        return;
    }

    resumes.findById(ObjectId(id), function(err, result) {

        if (err) throw err;

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.resumeObj = result;

        next();
    });

};
