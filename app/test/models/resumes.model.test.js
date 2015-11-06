var helpers = require('../helpers'),
    mongo = require('../../../config/mongodb'),
    should = require('should');

var db, resumes;

before(function (done) {
    mongo.init(function (err, client) {
        db = client;
        resumes = require('../../models/resumes.server.model');
        done();
    });
});

describe('Resume Model', function (done) {

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

    it('has default name and no section', function (done) {

        resumes.createEmpty(function (err, result) {

            should.not.exists(err);

            db.collection('resumes').findOne({ _id: result.insertedId }, function (err, result) {
                result.name.should.equal("Unnamed CV");
                result.sections.should.be.empty();
                done();
            });
        });

    });

});

