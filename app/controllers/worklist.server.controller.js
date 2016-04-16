var worklists = require('../models/worklists.server.model'),
    resumes = require('../models/resumes.server.model'),
    ObjectId = require('mongodb').ObjectId;

/**
 * POST /resumes/:resume_id/worklists
 */
exports.create = function(req, res) {

    var resume = req.resumeObj;

    worklists.createEmpty(resume, function(err, result) {

        if (err) throw err;

        res.location('/users/' + req.userObj._id + '/resumes/' + resume._id + '/worklists/' + result.insertedId);

        res.sendStatus(201);
    });
};

/**
 * DELETE /resumes/:resume_id/worklists/:worklist_id
 */
exports.remove = function(req, res) {

    worklists.deleteById(req.resume, req.workList, function(err) {
        if (err) throw err;
        res.sendStatus(200);
    });
};

/**
 * GET /resumes/:resume_id/worklists/:worklist_id
 */
exports.read = function(req, res) {
    res.json(req.workList);
};

/**
 * Middleware method
 * Fetch the requested worklist,
 * the worklist must belongs to the requested resume
 */
exports.byId = function(req, res, next, id) {

    if (!ObjectId.isValid(id)) {
        res.sendStatus(404);
        return;
    }

    var listId = ObjectId(id);

    var resume = req.resumeObj;

    var belongsToResume = resume.sections.some(function(section) {
        return section._id.equals(listId);
    });

    if (!belongsToResume) {
        res.sendStatus(404);
        return;
    }

    worklists.collection.findOne({
        _id: listId
    }, function(err, result) {

        if (err) throw err;

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.workList = result;

        next();
    });

};

/**
 * PUT /resumes/:resume_id/worklists/:worklist_id
 */
exports.update = function(req, res) {

    worklists.updateById(req.workList, req.body, function(err, result) {
        if (err) {
            switch (err) {
                case 'validation_error':
                    res.sendStatus(422);
                    return;
                default:
                    throw err;
            }
        }

        res.sendStatus(200);
    });
}
