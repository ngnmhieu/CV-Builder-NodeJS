var db       = require('../../config/mongodb').client;
var ObjectId = require('mongodb').ObjectId;
var debug    = require('debug')('cvbuilder.model.worklist');
var Joi      = require('Joi');
var _        = require('lodash');

var resumes   = db.collection('resumes');
var worklists = db.collection('worklists');

exports.collection = worklists;

const WORKLIST_SCHEMA = Joi.object().keys({
    name: Joi.string().allow(''),
    items: Joi.array().items(Joi.object().keys({
        title       : Joi.string().allow(''),
        institution : Joi.string().allow(''), 
        startDate   : [Joi.string().isoDate(), Joi.date()],
        endDate     : [Joi.string().isoDate(), Joi.date()],
        tillNow     : Joi.boolean(),
        desc        : Joi.string().allow(''),
        order       : Joi.number()
    }))
});

/**
 * @param params (optional) object conntaining the list's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return worklist object
 */
var getNewList = function (params) {

    params = typeof params !== 'undefined' && params !== null ? params : {};

    var items = [];
    if (Array.isArray(params.items)) {
        for (var i in params.items) {
            var item = params.items[i];
            items.push({
                title       : String(item.title),
                institution : String(item.institution),
                startDate   : (item.startDate instanceof Date) ? item.startDate : new Date(item.startDate),
                endDate     : (item.endDate instanceof Date)   ? item.endDate   : new Date(item.endDate),
                tillNow     : Boolean(item.tillNow),
                desc        : String(item.desc),
                order       : isNaN(parseInt(item.order)) ? (i + 1) : parseInt(item.order)
            });
        }
    }

    return {
        _id   : params._id,
        type  : "worklist",
        name  : params.name ? String(params.name)  : "New worklist",
        items : items
    };
};

exports.getNewList = getNewList;

/**
 * @param resume resume object
 * @param callback function to be called after the list is created
 */
exports.createEmpty = function (resume, callback) {

    var list = getNewList();

    worklists.insertOne(list, function (err, result) {

        var section = {
            _id: result.insertedId,
            type: "worklist"
        };

        resumes.updateOne({_id: resume._id}, {'$push': {sections: section}}, function (upErr, upResult) {
            if (err || upErr)
                callback(null);
            else
                callback(_.extend(list, {_id: result.insertedId}));
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
 * @return errors
 */
var validate = function (params) {
    var result = Joi.validate(params, WORKLIST_SCHEMA);
    return result.error;
};

/**
 * Update an existing worklist
 * @param {ObjectId} id - worklist id
 * @param {Object} params - request's parameters
 * @return {Promise}
 */
exports.updateById = function (id, params) {
    return new Promise((resolve, reject) => {
        worklists.findOne({_id: id}).then((worklist) => {

            var errors = validate(params);
            debug(errors)
            if (errors)
                return reject(errors);

            var changes = {};

            if (params.name)
                changes.name = params.name;

            if (params.items) {
                changes.items = params.items.sort((itemA, itemB) => { // sort by the order field
                    return itemA.order - itemB.order;
                }).map((item, idx) => { // normalize the ordering
                    item.order = idx + 1;
                    return item;
                })
            }

            var newList = _.extend(worklist, changes);
            delete newList._id;

            worklists.updateOne({_id: id}, newList).then(() => {
                resolve(_.extend(newList, {_id: id}));
            }, reject);
        }, reject);
    });
};

/**
 * Return the worklist with the id
 */
exports.findById = function(id, callback) {
    if (typeof callback == 'function') {
        worklists.findOne({_id: id}, function(err, result) {
            callback(err, getNewList(result));
        });
    } else {
        return new Promise((resolve, reject) => {
            worklists.findOne({_id: id}, function(err, result) {
                if (err) reject(err);
                else resolve(getNewList(result));
            });
        });
    }
};

