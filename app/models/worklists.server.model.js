var db = require('../../config/mongodb').client;

var ObjectId = require('mongodb').ObjectId;

var resumes   = db.collection('resumes');
var worklists = db.collection('worklists');

exports.collection = worklists;

/**
 * @param params (optional) object conntaining the list's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return worklist object
 */
exports.getNewList = function (params) {

    params = typeof params !== 'undefined' && params !== null ? params : {};

    var items = [];
    if (Array.isArray(params.items)) {
        for (var i in params.items) {
            var item = params.items[i]
            items.push({
                title       : String(item.title),
                institution : String(item.title),
                startDate   : (item.startDate instanceof Date) ? item.startDate : new Date(item.startDate),
                endDate     : (item.endDate instanceof Date)   ? item.endDate   : new Date(item.endDate),
                tillNow     : Boolean(item.tillNow),
                desc        : String(item.title)
            });
        }
    }

    return {
        name  : params.name ? params.name.toString()  : "New worklist",
        items : items,
        order : params.order ? parseInt(params.order) : 0
    };
};

/**
 * @param resume resume object
 * @param callback function to be called after the list is created
 */
exports.createEmpty = function (resume, callback) {

    var list = exports.getNewList();

    worklists.insertOne(list, function (err, result) {

        var section = {
            _id: result.insertedId,
            type: "worklist"
        };

        resumes.updateOne({_id: resume._id}, {'$push': {sections: section}}, function (upErr, upResult) {

            if (upErr) throw upErr;

            callback(err, result);
        });
        
    });

};

/**
 * @param resume resume object
 * @param list worklist object
 */
exports.deleteById = function (resume, list, callback) {

    resumes.updateOne(
        {_id: resume._id},
        { '$pull': { 'sections': {_id: list._id} } },
        function (err, result) {
            if (err) throw err;                
            worklists.deleteOne({_id: list._id}, callback);
    });
};

/**
 * @param date string represents date in json or Date object
 * @return boolean
 */
var isDate = function (date) {
    return date instanceof Date || !isNaN(new Date(date));
};

/**
 * @param a worklist object from request
 * @return true if valid, else false
 */
var validate = function (params) {

    if (!params) return false;

    if (!params.name) return false;

    if (!Array.isArray(params.items)) return false;

    // validate items
    for (var i in params.items) {
        var item = params.items[i];
        if (item.title === undefined) return false;
        if (item.institution === undefined) return false;
        if (!isDate(item.startDate)) return false;
        if (!isDate(item.endDate)) return false;
        if (item.tillNow === undefined) return false;
        if (item.desc === undefined) return false;
    }

    if (parseInt(params.order) < 0) return false;
    
    return true;
};

/**
 * Update an existing worklist
 */
exports.updateById = function (list, params, callback) {

    if (!validate(params)) {
        callback('validation_error');
        return;
    }

    var newList = exports.getNewList(params);

    worklists.updateOne({_id: list._id}, newList, callback);
};
