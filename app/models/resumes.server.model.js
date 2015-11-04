var mongodb = require('../../config/mongodb').client;
var resumes = mongodb.collection('resumes');

exports.collection = resumes;

exports.createEmpty = function (callback) {

    var resume = {
        name       : "Unnamed CV",
        created_at : new Date(),
        updated_at : new Date(),
        sections   : []
    };   

    resumes.insertOne(resume, callback);
};
