var mongodb = require('../../config/mongodb').client;
var resumes = mongodb.collection('resumes');

exports.collection = resumes;

exports.createEmpty = function (callback) {

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
        }
    };   

    resumes.insertOne(resume, callback);
};

var validateBasicInfo = function (params) {
    return true;
};

exports.updateBasicInfo = function (resume, basicinfo, callback) {

    if (!validateBasicInfo(basicinfo)) {
        callback('validation_error');
        return;
    }

    resumes.updateOne({ _id: resume._id }, { basicinfo: basicinfo }, callback);
};
