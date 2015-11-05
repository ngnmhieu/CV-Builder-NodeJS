var bulletlists = require('../models/bulletlists.server.model'),
    resumes     = require('../models/resumes.server.model'),
    ObjectId    = require('mongodb').ObjectId;

/**
 * POST /resumes/:resume_id/bulletlists
 */
exports.create = function (req, res) {

    var resume = req.resumeObj;
    if (resume === null) {
        res.sendStatus(404);
        return;
    }

    bulletlists.createEmpty(resume, function (err, result) {

        if (err) throw err;

        res.location('/resumes/' + resume._id + '/bulletlists/' + result.insertedId);

        res.sendStatus(201);
    });
};

/**
 * DELETE /resumes/:resume_id/bulletlists/:bulletlist_id
 */
exports.remove = function (req, res) {

    bulletlists.deleteById(req.resume, req.bulletList, function (err) {
        if (err) throw err;
        res.sendStatus(200);
    });
};

/**
 * GET /resumes/:resume_id/bulletlists/:bulletlist_id
 */
exports.read = function (req, res) {
    res.json(req.bulletList);
};

/**
 * Middleware method
 * Fetch the requested bulletlist,
 * the bulletlist must belongs to the requested resume
 */
exports.byId = function (req, res, next, id) {

    var listId = ObjectId(id);

    var resume = req.resumeObj;

    var belongsToResume = resume.sections.some(function (section) {
        return section._id.equals(listId);
    });

    if (!belongsToResume) {
        res.sendStatus(404);
        return;
    }

    bulletlists.collection.findOne({_id: listId}, function (err, result) {

        if (err) throw err;   

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.bulletList = result;

        next();
    });
        
};

/**
 * PUT /resumes/:resume_id/bulletlists/:bulletlist_id
 */
exports.update = function (req, res) {

    var list = bulletlists.getNewList(req.body);

    bulletlists.collection.updateOne({_id: req.bulletList._id}, list, function (err, result) {
        if (err) throw err;

        res.sendStatus(200);
    });
}
