var mongodb = require('../../config/mongodb').client;
var resumes = mongodb.collection('resumes');
var _ = require('lodash');
var SECTION_TYPES = {
    bulletlist: require('./bulletlists.server.model'),
    worklist: require('./worklists.server.model'),
    textarea: require('./textareas.server.model')
};

exports.collection = resumes;

/**
 * Create an empty resume
 * @param {Object} User that owns the new resume
 * TODO: return real resume object
 */
exports.createEmpty = function(user, callback) {

    var resume = {
        name: "Unnamed CV",
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [],
        lang: 'en',
        basicinfo: {
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
var validateBasicInfo = function(params) {

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

var newBasicInfo = function(params) {
    return {
        name: String(params.name),
        email: String(params.email),
        website: String(params.website),
        phone: String(params.phone),
        address1: String(params.address1),
        address2: String(params.address2),
        address3: String(params.address3),
    };
};

/**
 * Update an existing basicinfo
 * @param resume resume object
 * @param params parameters from the request
 * @param callback
 */
exports.updateBasicInfo = function(resume, params, callback) {

    if (!validateBasicInfo(params)) {
        callback('validation_error');
        return;
    }

    var basicinfo = newBasicInfo(params);

    resumes.updateOne({
        _id: resume._id
    }, {
        basicinfo: basicinfo
    }, callback);
};

/**
 * Initialize a new Resume with the provided attributes
 */
var Resume = function(options) {

    var attr = options || {};

    return {
        _id: attr._id || null,
        name: attr.name || "Unnamed CV",
        createdAt: attr.createdAt || new Date(),
        updatedAt: attr.updatedAt || new Date(),
        sections: attr.sections || [],
        lang: attr.lang || 'en',
        basicinfo: attr.basicinfo || {
            name: '',
            email: '',
            website: '',
            phone: '',
            address1: '',
            address2: '',
            address3: '',
        },
        user_id: attr.user_id || null
    };
};

/**
 * Find all resumes belonging to the given user
 * @param {Object} user
 * @return {Array} resumes found
 */
exports.findByUser = function(user, callback) {
    resumes.find({
        user_id: user._id
    }).toArray(function(err, result) {
        var resumes = (result || []).map(function(r) {
            return new Resume(r);
        });
        callback(resumes);
    });
};

/**
 * @param {ObjectID} id Resume's ID
 */
exports.findById = function(id, done) {

    resumes.findOne({
        _id: id
    }, function(err, result) {

        if (typeof result == 'undefined' || result == null) {

            done(err, null);

        } else if (!Array.isArray(result.sections) || result.sections.length == 0) { 

            done(err, new Resume(result));

        } else {

            var sections = [];

            // execute this after fetching all sections
            var sectionFetched = _.after(result.sections.length, function() {
                result.sections = sections;
                done(err, new Resume(result));
            });

            // fetch the sections
            for (var i in result.sections) {
                var sec = result.sections[i];
                if (sec.type in SECTION_TYPES) {
                    SECTION_TYPES[sec.type].findById(sec._id, function(err, result) {
                        if(result != null) {
                            sections.push(result);
                        }
                        sectionFetched();
                    });
                } else {
                    sectionFetched();
                }
            }
        }

    });
};
