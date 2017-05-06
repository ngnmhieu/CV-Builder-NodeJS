var bulletlists = require('../models/bulletlists.server.model'),
    resumes     = require('../models/resumes.server.model'),
    ObjectId    = require('mongodb').ObjectId,
    debug       = require('debug')('cvbuilder.controller.bulletlist');

/**
 * POST /resumes/:resume_id/bulletlists
 */
exports.create = function (req, res) {

    var resume = req.resumeObj;

    bulletlists.createEmpty(resume, function (err, list) {

        if (err) throw err;

        res.status(201)
        .location(`/users/${req.userObj._id}/resumes/${resume._id}/bulletlists/${list._id}`);

        res.json(list);
    });
};

/**
 * DELETE /resumes/:resume_id/bulletlists/:bulletlist_id
 */
exports.remove = function (req, res) {

    bulletlists.deleteById(req.resumeObj, req.bulletList, function (err) {
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

    if (!ObjectId.isValid(id)) {
        res.sendStatus(404);
        return;
    }

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
    bulletlists.updateById(req.bulletList, req.body).then((list) => {
        res.json(list);
    }, (errors) => {
        debug('Update errors: %o', errors);
        return res.sendStatus(400);
    });
};
