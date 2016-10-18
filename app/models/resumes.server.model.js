var mongodb = require('../../config/mongodb').client;
var resumes = mongodb.collection('resumes');
var _ = require('lodash');
var SECTION_TYPES = {
    bulletlist: require('./bulletlists.server.model'),
    worklist: require('./worklists.server.model'),
    textarea: require('./textareas.server.model')
};

exports.collection = resumes;

var LANGS = ['en', 'de'];

/**
 * Initialize a new Resume with the provided attributes
 */
var getNewResume = function(options) {

    var attr = options || {};

    var lang = String(attr.lang).toLowerCase();

    return {
        _id: attr._id || null,
        name: attr.name ? String(attr.name) : "Unnamed CV",
        createdAt: attr.createdAt || new Date(),
        updatedAt: attr.updatedAt || new Date(),
        sections: attr.sections || [],
        lang: lang && LANGS.indexOf(lang) != -1 ? attr.lang : 'en',
        basicinfo: getNewBasicInfo(attr.basicinfo),
        user_id: attr.user_id || null
    };
};

/**
 * Create an empty resume
 * @param {Object} User that owns the new resume
 * TODO: return real resume object
 */
exports.createEmpty = function(user, callback) {

    var resume = getNewResume({user_id: user._id});
    console.log(resume);
    delete resume._id;

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
    // todo date of birth

    return true;
};

var getNewBasicInfo = function(params) {
    return {
        name     : params.name     ? String(params.name) : '',
        email    : params.email    ? String(params.email) : '',
        website  : params.website  ? String(params.website) : '',
        phone    : params.phone    ? String(params.phone) : '',
        fax      : params.fax      ? String(params.fax) : '',
        dob      : params.dob      ? params.dob : new Date(),
        address1 : params.address1 ? String(params.address1) : '',
        address2 : params.address2 ? String(params.address2) : '',
        address3 : params.address3 ? String(params.address3) : '',
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

    var basicinfo = getNewBasicInfo(params);

    resumes.updateOne({ _id: resume._id }, { '$set': {basicinfo: basicinfo } }, callback);
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
            return getNewResume(r);
        });
        callback(resumes);
    });
};

/**
 * @param {Object} User
 * @param {ObjectID} id Resume's ID
 */
exports.findByUserAndId = function(user, id, done) {

    resumes.findOne({
        _id: id,
        user_id: user._id
    }, function(err, result) {

        if (typeof result == 'undefined' || result == null) {

            done(err, null);

        } else if (!Array.isArray(result.sections) || result.sections.length == 0) { 

            done(err, getNewResume(result));

        } else {

            var sections = [];

            // execute this after fetching all sections
            var sectionFetched = _.after(result.sections.length, function() {
                result.sections = sections;
                done(err, getNewResume(result));
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

/**
 * @param Section object or Section ID
 * @return {Boolean} if section belongs to resume
 */
exports.isSectionOf = function (resume, section) {

    if (typeof resume == 'undefined' || resume == null || typeof section == 'undefined' || section == null) 
        return false;

    var sectionId = section._id || section;

    return resume.sections.some(function(sec) {
        return sec._id.equals(sectionId);
    });
};
