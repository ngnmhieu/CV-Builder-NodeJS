var textareas = require('../models/textareas.server.model'),
    resumes = require('../models/resumes.server.model'),
    debug = require('debug')('cvbuilder.controller.textarea'),
    ObjectId = require('mongodb').ObjectId;

exports.read = function(req, res) {
    res.json(req.textarea);
};

exports.create = function(req, res) {

    var resume = req.resumeObj;

    textareas.createEmpty(resume, function(err, textarea) {
        if (err) throw err;
        res.status(201).location('/users/' + req.userObj._id + '/resumes/' + resume._id + '/textareas/' + textarea._id);
        res.json(textarea);
    });
};

exports.byId = function(req, res, next, id) {

    if (!ObjectId.isValid(id)) {
        res.sendStatus(404);
        return;
    }

    var textareaId = ObjectId(id);

    var resume = req.resumeObj;

    if (!resumes.isSectionOf(resume, textareaId)) {
        res.sendStatus(404);
        return;
    }

    textareas.collection.findOne({
        _id: textareaId
    }, function(err, result) {

        if (err) throw err;

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.textarea = result;

        next();
    });
};

/**
 * PUT /resumes/:resume_id/textareas/:textarea_id
 */
exports.update = function(req, res) {

    textareas.updateById(req.textarea, req.body).then(function(textarea) {
      res.status(200).json(textarea);
    }, (err) => {
      debug('Failed updating textarea: %o', err)
      res.sendStatus(400);
    });
}

/**
 * DELETE /resumes/:resume_id/textareas/:textarea_id
 */
exports.remove = function(req, res) {

    textareas.deleteById(req.resumeObj, req.textarea, function(err) {
        if (err) throw err;
        res.sendStatus(200);
    });
};
