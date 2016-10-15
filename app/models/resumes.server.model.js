var mongodb = require('../../config/mongodb').client;
var resumes = mongodb.collection('resumes');

exports.collection = resumes;

/**
 * Create an empty resume
 * @param {Object} User that owns the new resume
 */
exports.createEmpty = function (user, callback) {

    var resume = {
        name       : "Unnamed CV",
        created_at : new Date(),
        updated_at : new Date(),
        sections   : [],
        basicinfo  : {
            name: '',
            email: '',
            website: '',
            phone: '',
            address1: '',
            address2: '',
            address3: '',
        },
        user_id: user._id
    };   

    resumes.insertOne(resume, callback);
};

/**
 * @param params parameters for basicinfo
 * @return boolean true if the parameters are valid, else false
 */
var validateBasicInfo = function (params) {

    if (params.name === undefined || params.name === null)
        return false;
    if (params.email === undefined || params.email === null)
        return false;
    if (params.website === undefined || params.website === null)
        return false;
    if (params.phone === undefined || params.phone === null)
        return false;
    if (params.address1 === undefined || params.address1 === null)
        return false;
    if (params.address2 === undefined || params.address2 === null)
        return false;
    if (params.address3 === undefined || params.address3 === null)
        return false;

    return true;
};

var newBasicInfo = function (params) {
    return {
        name     : String(params.name),
        email    : String(params.email),
        website  : String(params.website),
        phone    : String(params.phone),
        address1 : String(params.address1),
        address2 : String(params.address2),
        address3 : String(params.address3),
    };
};

/**
 * Update an existing basicinfo
 * @param resume resume object
 * @param params parameters from the request
 * @param callback
 */
exports.updateBasicInfo = function (resume, params, callback) {

    if (!validateBasicInfo(params)) {
        callback('validation_error');
        return;
    }

    var basicinfo = newBasicInfo(params);

    resumes.updateOne({ _id: resume._id }, { basicinfo: basicinfo }, callback);
};

/**
 * Find all resumes belonging to the given user
 * @param {Object} user
 * @return {Array} resumes found
 */
exports.findByUser = function (user, callback) {
    resumes.find({user: user}, function (err, result) {
        callback(result || []);
    });
};
