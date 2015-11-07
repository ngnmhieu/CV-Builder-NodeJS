var helpers = require('../helpers'),
    should = require('should'),
    request = require('supertest');

var app, db, resumes;

describe('Basicinfo REST API', function () {

    before(function (done) {
        app = require('../../../app');
        app.init(function () {
            db = require('../../../config/mongodb').client;
            resumes = require('../../models/resumes.server.model');
            done();
        });
    });

    after(function (done) {
        app.httpServer.close(); 
        done();
    });

    afterEach(function () {
        db.collection('resumes').drop();
    });

    var getBasicinfoURI = function (resume_id) {
        return '/resumes/' + resume_id + '/basicinfo';
    };

    describe('Happy paths', function () {
        it('[GET] should return basicinfo for /resumes/:resume_id/basicinfo', function (done) {
            resumes.createEmpty(function (err, result) {
                request(app.express)
                .get(getBasicinfoURI(result.insertedId))
                .expect(200)
                .end(function (err, result) {
                   should.exists(result.body);
                   done(err);
                });
            });
        });

        it('[PUT] should update basicinfo for /resumes/:resume_id/basicinfo', function (done) {
            resumes.collection.insertOne({
                name       : "Unnamed CV",
                created_at : new Date(),
                updated_at : new Date(),
                sections   : [],
                basicinfo  : {
                    name: 'A Person',
                    email: 'abc@example.com',
                    website: 'hieu.co',
                    phone: '123456789',
                    address1: 'Hbf',
                    address2: 'Hamburg',
                    address3: 'Germany',
                }
            }, function (err, result) {

                var resumeId = result.insertedId;

                request(app.express)
                .put(getBasicinfoURI(resumeId))
                .set('Content-Type', 'application/json')
                .send({
                    name: 'A new name',
                    email: 'xyz@example.com',
                    website: 'nguyen.hieu.co',
                    phone: '987654321',
                    address1: 'Altona',
                    address2: 'Hanoi',
                    address3: 'Vietnam',
                })
                .expect(200)
                .end(function (err, result) {
                    resumes.collection.findOne({_id: resumeId}, function (err, result) {
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

    describe('Sad paths', function () {

        it('[PUT] should return HTTP 422 with missing parameters /resumes/:resume_id/basicinfo', function (done) {
            resumes.createEmpty(function (err, result) {
                request(app.express).put(getBasicinfoURI(result.insertedId))
                .set('Content-Type', 'application/json')
                .send({
                    name: 'A new name',
                })
                .expect(422)
                .end(done);
            });
        });

        // it('[PUT] should return HTTP 422 with invalid parameters /resumes/:resume_id/basicinfo', function (done) {
        // });

        it('[PUT] should not update bullet list with malformed request entity', function(done) {
            resumes.createEmpty(function (err, result) {
                request(app.express).put(getBasicinfoURI(result.insertedId))
                .set('Content-Type', 'application/json')
                .send('invalid data')
                .expect(400)
                .end(done);
            });
        });

    });
});
