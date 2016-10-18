var db = require('../../config/mongodb').client,
    _  = require('lodash'),
    ObjectId = require('mongodb').ObjectId;

var resumes     = db.collection('resumes');
var bulletlists = db.collection('bulletlists');

exports.collection = bulletlists;

/**
 * @param params (optional) object conntaining the list's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return bulletlist object
 */
var getNewList = function (params) {

    params = typeof params !== 'undefined' && params !== null ? params : {};
    
    var items = Array.isArray(params.items) ? params.items : [];

    items = items.map(function(item) {

        var order = parseInt(item.order);

        return {
            content: item.content || '',
            order: isNaN(item.order) ? -1 : item.order
        };
    });

    var order = parseInt(params.order);

    return {
        _id           : params._id,
        type          : "bulletlist",
        name          : params.name ? params.name.toString() : "New bullet list",
        items         : items,
        order         : isNaN(params.order) ? -1 : params.order,
        orderedItems  : params.orderedItems ? Boolean(params.orderedItems) : false,
    };
};

exports.getNewList = getNewList;

/**
 * @param resume resume object
 * @param callback function to be called after the list is created
 */
exports.createEmpty = function (resume, callback) {

    var list = getNewList();

    bulletlists.insertOne(list, function (err, result) {

        var section = {
            _id: result.insertedId,
            type: "bulletlist"
        };

        resumes.updateOne({_id: resume._id}, {'$push': {sections: section}}, function (upErr, upResult) {

            if (upErr) throw upErr;

            callback(err, _.extend(list, {_id: result.insertedId}));
        });
        
    });

};

/**
 * @param resume resume object
 * @param list bulletlist object
 */
exports.deleteById = function (resume, list, callback) {

    resumes.updateOne( {_id: resume._id}, { '$pull': { 'sections': {_id: list._id} } },
        function (err, result) {
            if (err) throw err;                
            bulletlists.deleteOne({_id: list._id}, function(err, result) {
                callback(err, result);
            });
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

    // validate items
    for (var i in params.items) {

        var item = params.items[i];

        if (typeof item.content !== 'string')
            return false;

        if (isNaN(parseInt(item.order)))
            return false;
    }

    if (params.orderedItems === undefined) return false;

    if (isNaN(parseInt(params.order))) return false;
    
    return true;
};

/**
 * Update an existing bulletlist
 */
exports.updateById = function (list, params, callback) {

    if (!validate(params)) {
        callback('validation_error');
        return;
    }

    var newList = exports.getNewList(params);
    delete newList._id;

    bulletlists.updateOne({_id: list._id}, newList, function(err, result) {
        callback(err, _.extend(newList, {_id: list._id}));
    });
};

/**
 * Return the bullet list with the id
 */
exports.findById = function(id, callback) {
    bulletlists.findOne({_id: id}, function(err, result) {
        callback(err, getNewList(result));
    });
};

var getNewItem = function (params) {

    params = typeof params !== 'undefined' && params !== null ? params : {};

    var order = parseInt(params.order);

    return {
        content : params.content || '',
        order   : Number.isInteger(order) ? order : -1
    };
};
