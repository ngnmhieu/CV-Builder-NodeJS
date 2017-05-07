var db = require('../../config/mongodb').client,
    ObjectId = require('mongodb').ObjectId,
    debug = require('debug')('cvbuilder.model.textarea'),
    _ = require('lodash');

var resumes   = db.collection('resumes'),
    textareas = db.collection('textareas');

exports.collection = textareas;

/**
 * @param resume resume object
 * @param callback function to be called after the list is created
 */
exports.createEmpty = function (resume, callback) {

    var textarea = {
        name    : 'A new Textarea',
        content : ''
    };

    textareas.insertOne(textarea, function (err, result) {

        var section = {
            _id: result.insertedId,
            type: "textarea"
        };

        resumes.updateOne({_id: resume._id}, {'$push': {sections: section}}, function (upErr, upResult) {

            if (upErr) throw upErr;

            callback(err, _.extend(textarea, {_id: result.insertedId}));
        });
        
    });

};

/**
 * @param resume resume object
 * @param textarea object
 */
exports.deleteById = function (resume, textarea, callback) {

    resumes.updateOne( {_id: resume._id}, { '$pull': { 'sections': {_id: textarea._id } } },
        function (err, result) {
            if (err) throw err;                
            textareas.deleteOne({_id: textarea._id}, callback);
    });
}


/**
 * @param a textarea object from request
 * @return true if valid, else false
 */
var validate = function (params) {

    if (params.name === undefined || params.name === null)
        return false;

    if (params.content === undefined || params.content === null)
        return false;

    return true;
};

/**
 * @param params (optional) object conntaining the textarea's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return textarea object
 */
var getNewTextarea = function (params) {
    
    params = typeof params !== 'undefined' && params !== null ? params : {};

    return {
        _id     : params._id,
        type    : "textarea",
        name    : params.name ? params.name.toString() : "New Textarea",
        content : params.content ? params.content.toString() : ""
    };
};

exports.getNewTextarea = getNewTextarea;

/**
 * Update an existing textarea
 */
exports.updateById = function (textarea, params, callback) {

    return new Promise((resolve, reject) => {
        if (!validate(params)) {
            return reject('validation_error');
        }

        var newTextarea = exports.getNewTextarea(params);
        delete newTextarea._id;

        textareas.updateOne({_id: textarea._id}, newTextarea).then(function(result) {
            resolve(_.extend(newTextarea, {_id: textarea._id}));
        }, reject);
    });
};

/**
 * Return the textarea with the id
 */
exports.findById = function(id, callback) {

    if (typeof callback == 'function') {
        textareas.findOne({_id: id}, function(err, result) {
            callback(err, getNewTextarea(result));
        });
    } else {
        return new Promise((resolve, reject) => {
            textareas.findOne({_id: id}, function(err, result) {
                if (err) reject(err);
                else resolve(getNewTextarea(result));
            });
        });
    }
};

