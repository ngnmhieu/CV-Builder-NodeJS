var helpers = require('../helpers'),
    should = require('should'),
    request = require('supertest');

describe('Bulletlist REST API', function () {

    var app, db, resumes, bulletlists;

    before(function (done) {
        app = require('../../../app');
        app.init(function () {
            db          = require('../../../config/mongodb').client;
            resumes     = require('../../models/resumes.server.model');
            bulletlists = require('../../models/bulletlists.server.model');
            done();
        });
    });

    after(function (done) {
        app.httpServer.close(); 
        done();
    });

    afterEach(function () {
        db.collection('resumes').drop();
        db.collection('bulletlists').drop();
    });

    var resume;

    beforeEach(function (done) {
        resumes.createEmpty(function (err, res) {
            resume = res.ops[0];
            done();
        });
    });

    var getBulletListURI = function (resumeId, bulletListId) {
        return '/resumes/' + resumeId + '/bulletlists' + (bulletListId ? '/' + bulletListId : '');
    };

    describe('Good paths', function () {
        it('[GET] should return a bullet list /resumes/:resume_id/bulletlists/:bulletlist_id', function (done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).get(getBulletListURI(resume._id, listResult.insertedId))
                .expect('Content-Type', /json/)
                .expect(200)
                .end(done);
            });
        });

        it('[POST] should create an empty bullet list /resumes/:resume_id/bulletlists/:bulletlist_id', function (done) {
            request(app.express).post(getBulletListURI(resume._id))
            .expect('Location', /\/resumes\/[0-9a-f]{24}\/bulletlists\/[0-9a-f]{24}/)
            .expect(201)
            .end(done);
        });

        it('[DELETE] should delete a bullet list /resumes/:resume_id/bulletlists/:bulletlist_id', function (done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).delete(getBulletListURI(resume._id, listResult.insertedId))
                .expect(200)
                .end(done);
            });
        });

        it('[PUT] should update a bullet list');
    });

    describe('Sad paths', function () {

        it('[GET] should return 404 for a bullet list which doesnt exists', function (done) {
            request(app.express).get(getBulletListURI(resume._id, '0123456789ab0123456789ef'))
            .expect(404)
            .end(done);
        });

        it('[GET] should return 404 for a bullet list, which doesnt belong to a given resume', function (done) {
            resumes.createEmpty(function (err, res) {
                var anotherResume = res.ops[0];
                bulletlists.createEmpty(anotherResume, function (err, listResult) {
                    request(app.express).get(getBulletListURI(resume._id, listResult.insertedId))
                    .expect(404)
                    .end(done);
                });
            });
        });

        it('Should return 404 for a invalid :bulletlist_id', function (done) {
            request(app.express).get(getBulletListURI(resume._id, '0123456789xy0123456789zt'))
            .expect(404)
            .end(done);
        });

        it('[PUT] should not update bullet list with invalid data');
    });
});
