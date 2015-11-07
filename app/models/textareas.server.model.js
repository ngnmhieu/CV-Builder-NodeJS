var db = require('../../config/mongodb').client;

var resumes   = db.collection('resumes'),
    textareas = db.collection('textareas');

exports.collection = textareas;

/**
 * @param resume resume object
 * @param callback function to be called after the list is created
 */
exports.createEmpty = function (resume, callback) {

    var textarea = {
        name    : 'New Textarea',
        content : '',
        order   : 1
    };

    textareas.insertOne(textarea, function (err, result) {

        var section = {
            _id: result.insertedId,
            type: "textarea"
        };

        resumes.updateOne({_id: resume._id}, {'$push': {sections: section}}, function (upErr, upResult) {

            if (upErr) throw upErr;

            callback(err, result);
        });
        
    });

};

/**
 * @param resume resume object
 * @param textarea object
 */
exports.deleteById = function (resume, textarea, callback) {

    resumes.updateOne(
        {_id: resume._id},
        { '$pull': { 'sections': {_id: textarea._id} } },
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

    if (parseInt(params.order) < 0) return false;

    return true;
};

/**
 * @param params (optional) object conntaining the textarea's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return textarea object
 */
exports.getNewTextarea = function (params) {
    
    params = typeof params !== 'undefined' && params !== null ? params : {};

    return {
        name    : params.name ? params.name.toString() : "New Textarea",
        content : params.content ? params.content.toString() : "",
        order   : parseInt(params.order) > 0 ? parseInt(params.order) : 0
    };
};

/**
 * Update an existing textarea
 */
exports.updateById = function (textarea, params, callback) {

    if (!validate(params)) {
        callback('validation_error');
        return;
    }

    var newTextarea = exports.getNewTextarea(params);

    textareas.updateOne({_id: textarea._id}, newTextarea, callback);
};
