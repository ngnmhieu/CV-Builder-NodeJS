var resumes = require('../models/resumes.server.model');

/**
 * Homepage
 */
exports.index = function(req, res) {

    if (req.userObj != null) {
        return res.redirect('/resumes');
    }

    res.render('index', {
        title: 'CV-Builder',
        user: req.userObj
    });
};

exports.resumes = function(req, res) {

    if (req.userObj == null) {
        return res.redirect('/');
    }

    resumes.findByUser(req.userObj, function(result) {
        res.render('resumes', {
            title: 'CV-Builder',
            user: req.userObj,
            resumes: result
        })
    });

};
