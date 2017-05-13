const resumes       = require('../models/resumes.server.model');
const ObjectId      = require('mongodb').ObjectId;
const debug         = require('debug')('cvbuilder.controller.resume');
const config        = require('../../config/config');
const renderService = require('../services/render.service');

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
    resumes.createEmpty(req.userObj).then(function(result) {
        if (req.is('json')) {
            res.location('/users/' + req.userObj._id + '/resumes/' + result._id).sendStatus(201);
        } else {
            res.redirect('/resumes/' + result._id);
        }
    }, function(err) {
        throw err;
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

/**
 * PUT /users/:user_id/resumes/:resume_id
 */
exports.update = function(req, res) {
    resumes.updateById(req.resumeObj._id, req.body).then(function(resume) {
        res.status(200).json(resume);
    }, (err) => {
        debug('Resume update errors: %o', err);
        res.sendStatus(400);
    });
};

/**
 * Set the resume object
 */
exports.byId = function(req, res, next, id) {

    if (!ObjectId.isValid(id)) {
        return res.sendStatus(404);
    }

    resumes.findByUserAndId(req.userObj, ObjectId(id)).then(function(result) {
        if (result == null) {
            res.sendStatus(404); // TOOD: redirect if html
        } else {
            req.resumeObj = result;
            next();
        }
    }, (err) => {
        debug('Cannot get resume: %o', err);
        res.sendStatus(400);
    });
};

/**
 * Render the pdf file from the template 
 */
exports.renderPdf = function(req, res) {
    var resume = req.resumeObj;
    var filename = resume.name.replace(' ', '-');
    res.set('Content-Disposition', `inline; filename=${filename}.pdf"`);
    res.set('Content-Type', "application/pdf");

    renderService.renderPdf(resume, (output) => {
      output.pipe(res);
    })
};

exports.renderHtml = function(req, res) {
    var resume = req.resumeObj;

    res.set('Content-Type', "text/html");

    renderService.renderHtml(resume, (output) => {
      output.pipe(res);
    })
};
