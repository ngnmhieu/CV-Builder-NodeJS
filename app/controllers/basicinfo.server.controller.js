var resumes   = require('../models/resumes.server.model'),
    debug     = require('debug')('cvbuilder.controller.basicinfo'),
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
    resumes.updateBasicInfo(req.resumeObj, req.body).then((basicinfo) => {
        res.status(200).json(basicinfo);
    }, (err) => {
        debug('Failed to update basicinfo: %o', err);
        res.sendStatus(400);
    });
};
