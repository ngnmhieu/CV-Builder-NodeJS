var db = require('../../config/mongodb').client,
    _  = require('lodash'),
    Joi = require('joi'),
    ObjectId = require('mongodb').ObjectId,
    resumes     = db.collection('resumes'),
    bulletlists = db.collection('bulletlists');

/**
 * Schema of a bulletlist object
 */
const BULLETLIST_SCHEMA = Joi.object().keys({
    name: Joi.string().allow(''),
    items: Joi.array().items(Joi.object().keys({
        content: Joi.string().allow(''),
        order: Joi.number()
    })),
    order: Joi.number(),
    numbered: Joi.boolean().required()
});

/**
 * @param a bulletlist object
 * @return errors validation fails
 */
var validateBulletlist = function(params) {
    var result = Joi.validate(params, BULLETLIST_SCHEMA);
    if(result.error)
    return result.error;
};

/**
 * @param params (optional) object conntaining the list's attributes.
 *               If a value for a particular attribute is not provided,
 *               a default value is used instead.
 * @return bulletlist object
 */
var getNewList = function (params = {}) {

    var items = Array.isArray(params.items) ? params.items : [];

    items = items.map((item) => {
        return {
            content: item.content || '',
            order: isNaN(parseInt(item.order)) ? -1 : parseInt(item.order)
        };
    });

    return {
        _id      : params._id,
        type     : "bulletlist",
        name     : _.toString(params.name),
        items    : items,
        order    : isNaN(parseInt(params.order)) ? -1 : parseInt(params.order),
        numbered : params.numbered ? Boolean(params.numbered) : false,
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
 * Update an existing bulletlist
 * @return Promise
 */
exports.updateById = function (list, params) {

    return new Promise(function(resolve, reject) {

        var errors = validateBulletlist(params);
        if (errors) {
            return reject(errors);
        }

        var newList = getNewList(params);
        delete newList._id;

        bulletlists.updateOne({_id: list._id}, newList, function(err, result) {
            resolve(_.extend(newList, {_id: list._id}));
        });
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

exports.collection = bulletlists;
