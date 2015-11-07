var helpers = require('../helpers'),
    mongo = require('../../../config/mongodb'),
    should = require('should');

var db, resumes;

before(function (done) {
    mongo.init(function (err) {
        db      = mongo.client;
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
                should.exists(result.basicinfo);
                done();
            });
        });

    });

    it('has default basicinfo', function (done) {
        
        resumes.createEmpty(function (err, result) {

            db.collection('resumes').findOne({ _id: result.insertedId }, function (err, result) {
                should.exists(result.basicinfo);
                result.basicinfo.name.should.be.a.String;
                result.basicinfo.email.should.be.a.String;
                result.basicinfo.website.should.be.a.String;
                result.basicinfo.phone.should.be.a.String;
                result.basicinfo.address1.should.be.a.String;
                result.basicinfo.address2.should.be.a.String;
                result.basicinfo.address3.should.be.a.String;
                done();
            });
        });

    });

    it('can update basicinfo', function (done) {

        resumes.createEmpty(function (err, result) {

            var resumeId = result.insertedId;

            db.collection('resumes').findOne({ _id: resumeId }, function (err, result) {

                resumes.updateBasicInfo(result, {
                    name: 'A new name',
                    email: 'xyz@example.com',
                    website: 'nguyen.hieu.co',
                    phone: '987654321',
                    address1: 'Altona',
                    address2: 'Hanoi',
                    address3: 'Vietnam',
                }, function (err, result) {
                    
                    db.collection('resumes').findOne({ _id: resumeId }, function (err, result) {

                        result.basicinfo.name.should.equal('A new name');
                        result.basicinfo.email.should.equal('xyz@example.com');
                        result.basicinfo.website.should.equal('nguyen.hieu.co');
                        result.basicinfo.phone.should.equal('987654321');
                        result.basicinfo.address1.should.equal('Altona');
                        result.basicinfo.address2.should.equal('Hanoi');
                        result.basicinfo.address3.should.equal('Vietnam');

                        done(err);
                    });
                });

            });
        });
        
    });

});

