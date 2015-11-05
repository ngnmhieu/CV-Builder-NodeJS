var should = require('should'),
    request = require('supertest');

var app, db;

before(function (done) {
   app = require('../../app');
   app.init(function () {
       db = require('../../config/mongodb').client;
       done();
   });
});

describe('Resume REST API', function () {

    afterEach(function () {
        db.collection('resumes').drop();
    });
    
    describe('Good path', function () {

        it('should get a resume for GET /resumes/:resume_id', function (done) {

            db.collection('resumes').insertOne({
                name       : "My CV",
                created_at : new Date(),
                updated_at : new Date(),
                sections   : []
            }, function (err, result) {
                request(app.express).get('/resumes/' + result.insertedId)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, result) {
                    var resume = result.body;
                    resume.name.should.equal("My CV");
                    resume.sections.should.be.empty();
                    done();
                });
            });
        });

        it('should create an empty resume for POST /resumes', function (done) {
            request(app.express).post('/resumes')
            .expect('Location', /\/resumes\/([0-9a-f]{12})/)
            .expect(201)
            .end(done);
        });

        it('should delete a resume for DELETE /resumes/:resume_id', function (done) {
            db.collection('resumes').insertOne({
                name       : "Unnamed CV",
                created_at : new Date(),
                updated_at : new Date(),
                sections   : []
            }, function (err, result) {
                request(app.express).delete('/resumes/' + result.insertedId)
                .expect(200)
                .end(done);
            });
        });

    });
});
