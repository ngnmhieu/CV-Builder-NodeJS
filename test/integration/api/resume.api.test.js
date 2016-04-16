var helpers = require('../../helpers'),
    api_helper = require('./api.test.helper'),
    app_root = helpers.app_root,
    should = require('should'),
    request = require('supertest');

var app, db, userId, resumes;

describe('Resume REST API', function() {

    var getResumePath = function(resumeId) {
        return '/users/' + userId + '/resumes/' + (resumeId != null ? resumeId : '');
    };

    before(function(done) {
        app = require(app_root + 'app');
        app.init(function() {
            db = require(app_root + 'config/mongodb').client;
            resumes = require(app_root + 'app/models/resumes.server.model');
            api_helper.createUser(db, function(err, result) {
                userId = result.insertedId;
                done();
            });
        });
    });

    after(function(done) {
        db.collection('users').drop();
        app.httpServer.close();
        done();
    });

    afterEach(function() {
        db.collection('resumes').drop();
    });

    describe('Happy paths', function() {

        it('[POST /users/:user_id/resumes] should create an empty resume', function(done) {
            request(app.express).post(getResumePath())
                .expect(201)
                .expect('Location', /\/users\/([0-9a-f]{24})\/resumes\/([0-9a-f]{24})/)
                .end(function(err, result) {
                    if (err)
                        done(err);
                    else
                        request(app.express).get(result.headers.location).expect(200).end(done);
                });
        });

        it('[GET /users/:user_id/resumes/:resume_id] should get a resume', function(done) {

            resumes.createEmpty(function(err, result) {
                request(app.express).get(getResumePath(result.insertedId))
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, result) {
                        var resume = result.body;
                        resume.name.should.equal("Unnamed CV");
                        done(err);
                    });
            });
        });

        it('[DELETE /users/:user_id/resumes/:resume_id] should delete a resume', function(done) {
            resumes.createEmpty(function(err, result) {
                request(app.express).delete(getResumePath(result.insertedId))
                    .expect(200)
                    .end(done);
            });
        });

        it('[GET /users/:user_id/resumes/:resume_id/sections] should return the sections of the resume', function(done) {

            db.collection('resumes').insertOne({
                name: "Unnamed CV",
                created_at: new Date(),
                updated_at: new Date(),
                sections: ['section1', 'section2']
            }, function(err, result) {
                request(app.express)
                    .get(getResumePath(result.insertedId) + '/sections')
                    .expect(200)
                    .end(function(err, result) {
                        result.body.should.containDeep(['section1', 'section2']);
                        done(err);
                    });
            });
        });

    });

    describe('Sad paths', function() {

        it('[GET] should send 404 NOT FOUND for a non-existent resume /resumes/:resume_id', function(done) {
            request(app.express)
                .get(getResumePath('123456789abc123456789abc'))
                .expect(404)
                .end(done);
        });

        it('[GET] should send 404 NOT FOUND for a non-existent resume /resumes/:resume_id/sections', function(done) {
            request(app.express)
                .get(getResumePath('123456789abc123456789abc') + '/sections')
                .expect(404)
                .end(done);
        });

        it('[DELETE] should send 404 NOT FOUND for a non-existent resume', function(done) {
            request(app.express)
                .delete(getResumePath('123456789abc123456789abc'))
                .expect(404)
                .end(done);
        });

        it('[GET] should handle invalid :resume_id correctly', function(done) {
            request(app.express)
                .get(getResumePath('invalid'))
                .expect(404)
                .end(done);
        });

    });
});
