var db = require('../../config/mongodb').client;

var ObjectId = require('mongodb').ObjectId;

var resumes     = db.collection('resumes');
var bulletlists = db.collection('bulletlists');

exports.collection = bulletlists;

/**
 * @param params (optional) object conntaining the list's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return bulletlist object
 */
exports.getNewList = function (params) {

    params = typeof params !== 'undefined' && params !== null ? params : {};

    return {
        name          : params.name ? params.name.toString() : "New bullet list",
        items         : Array.isArray(params.items) ? params.items : [],
        order         : params.order ? parseInt(params.order) : 0,
        ordered_items : params.ordered_items ? Boolean(params.ordered_items) : false,
    };
};

/**
 * @param resume resume object
 * @param callback function to be called after the list is created
 */
exports.createEmpty = function (resume, callback) {

    var list = exports.getNewList();

    bulletlists.insertOne(list, function (err, result) {

        var section = {
            _id: result.insertedId,
            type: "bulletlist"
        };

        resumes.updateOne({_id: resume._id}, {'$push': {sections: section}}, function (upErr, upResult) {

            if (upErr) throw upErr;

            callback(err, result);
        });
        
    });

};

/**
 * @param resume resume object
 * @param list bulletlist object
 */
exports.deleteById = function (resume, list, callback) {

    resumes.updateOne(
        {_id: resume._id},
        { '$pull': { 'sections': {_id: list._id} } },
        function (err, result) {
            if (err) throw err;                
            bulletlists.deleteOne({_id: list._id}, callback);
    });
};

/**
 * @param a bulletlist object from request
 * @return true if valid, else false
 */
var validate = function (params) {

    if (!params) return false;

    if (!params.name) return false;

    if (!Array.isArray(params.items)) return false;

    if (params.ordered_items === undefined) return false;

    // _TODO: order must be unique ? order property in sections
    
    return true;
};

/**
 * Update an existing bulletlist
 * _TODO: consider insert a new one if the requested bulletlist is not found
 */
exports.updateById = function (list, params, callback) {

    if (!validate(params)) {
        callback('validation_error');
        return;
    }

    var newList = exports.getNewList(params);

    bulletlists.updateOne({_id: list._id}, newList, callback);
};
