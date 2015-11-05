var mongo = require('../../config/mongodb'),
    should = require('should');

// mongodb client
var db;

var runModelTest = function (done) {

    var resumes = require('../models/resumes.server.model');

    afterEach(function () {
        db.collection('resumes').drop();
    });
    
    it('should create an empty resume', function (done) {
        resumes.createEmpty(function (err, result) {
            should.not.exists(err);
            result.insertedCount.should.be.exactly(1);
            done();
        });
    });

    it('the resume has default name and no section', function () {
        
        resumes.createEmpty(function (err, result) {

            should.not.exists(err);

            db.collection('resumes').findOne({ _id: result.insertedId })
            .then(function (err, result) {
                result.name.should.equals("Unnamed CV");
                result.sections.should.be.empty();
                done();
            });
        });

    });

};

it('Connecting to database...', function (done) {
    mongo.init(function (err, client) {
        db = client;
        describe('Resume Model', runModelTest);
        done();
    });
});
