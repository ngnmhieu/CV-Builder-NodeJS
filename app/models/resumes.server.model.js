let mongodb         = require('../../config/mongodb').client,
    resumes         = mongodb.collection('resumes'),
    Joi             = require('joi'),
    debug           = require('debug')('cvbuilder.model.resume'),
    ObjectId        = require('mongodb').ObjectId,
    templateService = require('../services/template.service'),
    _               = require('lodash');

const SECTION_TYPES = {
    bulletlist: {
        name: 'bulletlist',
        model: require('./bulletlists.server.model'),
    },
    worklist: {
        name: 'worklist',
        model: require('./worklists.server.model'),
    },
    textarea: {
        name: 'textarea',
        model: require('./textareas.server.model')
    }
};

const LANGS = ['en', 'de'];

const BASICINFO_SCHEMA = Joi.object().keys({
    name     : Joi.string().allow(''),
    email    : Joi.string().allow(''),
    website  : Joi.string().allow(''),
    phone    : Joi.string().allow(''),
    fax      : Joi.string().allow(''),
    address1 : Joi.string().allow(''),
    address2 : Joi.string().allow(''),
    address3 : Joi.string().allow('')
});

const RESUME_SCHEMA = Joi.object().keys({
    name        : Joi.string().required(),
    template_id : Joi.string().required(),
    sections    : Joi.array().items(Joi.object().keys({
        _id     : Joi.string().hex().length(24).required(),
        order   : Joi.number().required()
    })),
    basicinfo : BASICINFO_SCHEMA
});

/**
 * Validates the DTO from request
 */
let validateResume = function(params) {
    let result = Joi.validate(params, RESUME_SCHEMA);
    return result.error;
};

let validateBasicInfo = function(params) {
    let result = Joi.validate(params, BASICINFO_SCHEMA);
    return result.error;
};

/**
 * @return {object} database representation of a resume
 */
let getDBResume = function(options) {

    let attr = options || {};

    let lang = String(attr.lang).toLowerCase();

    return {
        _id         : attr._id || null,
        name        : attr.name ? String(attr.name) : "Unnamed CV",
        createdAt   : attr.createdAt || new Date(),
        updatedAt   : attr.updatedAt || new Date(),
        sections    : attr.sections || [],
        lang        : lang && LANGS.indexOf(lang) != -1 ? attr.lang : 'en',
            basicinfo   : getDBBasicInfo(attr.basicinfo),
        template_id : attr.template_id ? attr.template_id : "classic",
        user_id     : attr.user_id || null
    };
};

/**
 * Create an empty resume
 * @param {Object} User that owns the new resume
 * @return Promise
 */
exports.createEmpty = function(user, callback) {

    let resume = getDBResume({
        user_id: user._id
    });

    delete resume._id;

    return new Promise(function(resolve, reject) {
        resumes.insertOne(resume).then(function(result) {
            resolve(_.extend(resume, { _id: result.insertedId }));
        }, reject);
    });
};

/**
 * Update a resume with new data in params
 * @param {ObjectId} id - resume's id
 * @param {Object} params - changes to resume
 * @return {Promise}
 */
exports.updateById = function(id, params) {
    return new Promise((resolve, reject) => {

        let errors = validateResume(params);
        if (errors)
            return reject(errors);

        resumes.findOne({
            _id: id
        }).then((resume) => {

            let changes = {};

            if (params.name) {
                changes.name = params.name;
            }

            if (params.template_id) {
                changes.template_id = params.template_id;
            }

            if (params.sections) {
                let sectionLookup = _.keyBy(params.sections, '_id');
                changes.sections = resume.sections.map((section) => {
                    let sectionId = section._id.toHexString();
                    if (_.has(sectionLookup, sectionId)) {
                        section.order = sectionLookup[sectionId].order;
                    }
                    return section;
                }).sort((secA, secB) => {
                    return secA.order - secB.order; 
                }).map((section, idx) => {
                    section.order = idx + 1; // normalize the order
                    return section;
                });
            }

            let newResume = _.extend(resume, changes);
            delete newResume._id;

            resumes.updateOne({
                _id: id
            }, newResume, function(err, result) {
                if (err) reject(err);
                else exports.findById(id).then(resolve, reject);
            });

        }, reject);
    });
};

let getDBBasicInfo = function(options) {

    let attr = options || {};

    return {
        name     : _.toString(attr.name),
        email    : _.toString(attr.email),
        website  : _.toString(attr.website),
        phone    : _.toString(attr.phone),
        fax      : _.toString(attr.fax),
        address1 : _.toString(attr.address1),
        address2 : _.toString(attr.address2),
        address3 : _.toString(attr.address3)
    };
};

/**
 * Update an existing basicinfo
 * @param resume resume object
 * @param params parameters from the request
 * @param callback
 */
exports.updateBasicInfo = function(resume, params, callback) {

    return new Promise((resolve, reject) => {

        let errors = validateBasicInfo(params);
        if (errors)
            return reject(errors);

        let basicinfo = getDBBasicInfo(params);

        resumes.updateOne({ _id: resume._id }, { '$set': { basicinfo: basicinfo } })
        .then((result) => {
            resolve(basicinfo);
        }, reject);
    });
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
        let resumePromises = (result || []).map(function(r) {
            return getResumeDto(r, false);
        });
        Promise.all(resumePromises).then((resumes) => {
            callback(resumes);
        });
    });
};

/**
 * Return a resume by id
 * @param {ObjectId}
 * @return {Promise}
 */
exports.findById = function(id) {
    return new Promise((resolve, reject) => {
        resumes.findOne({
            _id: id
        }, (err, result) => {
            if (err) reject(err);
            else getResumeDto(result).then(resolve, reject);
        });
    });
};

/**
 * @param result - result from DB query
 * @param {boolean} fetchSections - should sections be queried
 *
 * @return {Promise}
 */
let getResumeDto = function(result, fetchSections = true) {

    return new Promise((resolve, reject) => {

        if (typeof result == 'undefined' || result == null) {
            return resolve(null);
        }

        let template = templateService.findTemplate(result.template_id) || templateService.getDefaultTemplate();

        let resume = {
            _id       : result._id,
            name      : _.toString(result.name),
            lang      : _.toString(result.lang),
            createdAt : result.createdAt,
            updatedAt : result.updatedAt,
            sections  : result.sections,
            template  : {
                id  : template.id,
                name: template.name
            },
            basicinfo : {
                name     : _.toString(result.basicinfo.name),
                email    : _.toString(result.basicinfo.email),
                website  : _.toString(result.basicinfo.website),
                phone    : _.toString(result.basicinfo.phone),
                fax      : _.toString(result.basicinfo.fax),
                address1 : _.toString(result.basicinfo.address1),
                address2 : _.toString(result.basicinfo.address2),
                address3 : _.toString(result.basicinfo.address3)
            },
        };

        // fetch the sections
        if (fetchSections) {
            let sectionPromises = result.sections.map((section) => {
                return SECTION_TYPES[section.type].model.findById(section._id);
            });

            Promise.all(sectionPromises).then((sections) => {
                resume.sections = sections;
                resolve(resume);
            }, reject);
        } else {
            resolve(resume);
        }
    });
};

/**
 * @param {Object} User
 * @param {ObjectId} id Resume's ID
 * @param {Promise}
 */
exports.findByUserAndId = function(user, id) {
    return new Promise((resolve, reject) => {
        resumes.findOne({
            _id: id,
            user_id: user._id
        }).then(function(result) {
            getResumeDto(result).then(resolve, reject);
        }, reject);
    });
};

/**
 * @param Section object or Section ID
 * @return {Boolean} if section belongs to resume
 */
exports.isSectionOf = function(resume, section) {

    if (typeof resume == 'undefined' || resume == null || typeof section == 'undefined' || section == null)
        return false;

    let sectionId = section._id || section;

    return resume.sections.some(function(sec) {
        return sec._id.equals(sectionId);
    });
};

/**
 * Add a new section to the resume
 *
 * @param {ObjectId} id - id of the section
 * @param {string} type - section type
 * @param {Resume} resume - resume object
 *
 * @return {Promise}
 */
let addSection = function(id, type, resume) {

    let section = {
        _id: id,
        type: type,
        order: resume.sections.length + 1
    };

    return resumes.updateOne({_id: resume._id}, {'$push': {sections: section}});
};

exports.addBulletlist = function(id, resume) {
    return addSection(id, SECTION_TYPES.bulletlist.name, resume);
};

exports.addWorklist = function() {
    return addSection(id, SECTION_TYPES.worklist.name, resume);
};

exports.addTextarea = function() {
    return addSection(id, SECTION_TYPES.textarea.name, resume);
};

exports.collection = resumes;
