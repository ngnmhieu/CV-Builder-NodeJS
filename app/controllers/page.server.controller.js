var resumes = require('../models/resumes.server.model'),
    _       = require('lodash');

/**
 * Returns common variables for template
 */
var getTemplateVars = function (req) {
    return {
        title: 'CV-Builder',
        user: req.userObj
    };
};

/**
 * Homepage
 */
exports.index = function(req, res) {

    if (req.userObj != null) {
        return res.redirect('/resumes');
    }

    res.render('index', getTemplateVars(req));
};

/**
 * Resumes listing page
 */
exports.resumes = function(req, res) {

    resumes.findByUser(req.userObj, function(result) {

        var templateVars = getTemplateVars(req);

        res.render('resume/listing', _.extend(getTemplateVars(req), {
            resumes: result
        }));
    });

};

/**
 * Edit resume page
 */
exports.editResume = function(req, res) {

    if (!req.resumeObj) {
        return res.redirect('/resumes');
    }
    
    res.render('resume/edit', _.extend(getTemplateVars(req), {
        resume: req.resumeObj
    }));
};
