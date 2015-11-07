var helpers = require('../helpers'),
    should = require('should'),
    request = require('supertest');

var app, db, resumes;

describe('Resume REST API', function () {

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
    
    describe('Good paths', function () {

        it('[GET] should get a resume for /resumes/:resume_id', function (done) {

            resumes.createEmpty(function (err, result) {
                request(app.express).get('/resumes/' + result.insertedId)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, result) {
                    var resume = result.body;
                    resume.name.should.equal("Unnamed CV");
                    resume.sections.should.be.empty();
                    should.exists(resume.basicinfo);
                    done(err);
                });
            });
        });

        it('[POST] should create an empty resume for /resumes', function (done) {
            request(app.express).post('/resumes')
            .expect('Location', /\/resumes\/([0-9a-f]{24})/)
            .expect(201)
            .end(function (err, result) {
                if (err) 
                    done(err);
                else 
                    request(app.express).get(result.headers.location).expect(200).end(done);
            });
        });

        it('[DELETE] should delete a resume for /resumes/:resume_id', function (done) {
            resumes.createEmpty(function (err, result) {
                request(app.express).delete('/resumes/' + result.insertedId)
                .expect(200)
                .end(done);
            });
        });

        it('[GET] should return the sections of the resume for /resumes/:resume_id/sections', function (done) {

            db.collection('resumes').insertOne({
                name       : "Unnamed CV",
                created_at : new Date(),
                updated_at : new Date(),
                sections   : ['section1', 'section2']
            }, function (err, result) {
                request(app.express)
                .get('/resumes/' + result.insertedId + '/sections')
                .expect(200)
                .end(function (err, result) {
                    result.body.should.containDeep(['section1', 'section2']);
                    done(err);
                });
            });
        });

    });

    describe('Sad paths', function () {

        it('[GET] should send 404 NOT FOUND for a non-existent resume /resumes/:resume_id', function (done) {
            request(app.express)
            .get('/resumes/123456789abc123456789abc')
            .expect(404)
            .end(done);
        });

        it('[GET] should send 404 NOT FOUND for a non-existent resume /resumes/:resume_id/sections', function (done) {
            request(app.express)
            .get('/resumes/123456789abc123456789abc/sections')
            .expect(404)
            .end(done);
        });

        it('[DELETE] should send 404 NOT FOUND for a non-existent resume', function (done) {
            request(app.express)
            .delete('/resumes/123456789abc123456789abc')
            .expect(404)
            .end(done);
        });

        it('should handle invalid :resume_id correctly', function (done) {
            request(app.express)
            .get('/resumes/invalid_id')
            .expect(404)
            .end(done);
        });

    });
});
