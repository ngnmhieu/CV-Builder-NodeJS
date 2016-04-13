var helpers = require('../../helpers'),
    app_root = helpers.app_root,
    should = require('should'),
    request = require('supertest');

describe('Bulletlist REST API', function () {

    var app, db, resumes, bulletlists;

    before(function (done) {
        app = require(app_root + 'app');
        app.init(function () {
            db          = require(app_root + 'config/mongodb').client;
            resumes     = require(app_root + 'app/models/resumes.server.model');
            bulletlists = require(app_root + 'app/models/bulletlists.server.model');
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

    describe('Happy paths', function () {
        it('[GET    /resumes/:resume_id/bulletlists] should return a bullet list', function (done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).get(getBulletListURI(resume._id, listResult.insertedId))
                .expect('Content-Type', /json/)
                .expect(200)
                .end(done);
            });
        });

        it('[POST   /resumes/:resume_id/bulletlists/:bulletlist_id] should create an empty bullet list', function (done) {
            request(app.express).post(getBulletListURI(resume._id))
            .expect('Location', /\/resumes\/[0-9a-f]{24}\/bulletlists\/[0-9a-f]{24}/)
            .expect(201)
            .end(function (err, result) {
                if (err) 
                    done(err);
                else 
                    request(app.express).get(result.headers.location).expect(200).end(done);
            });
        });

        it('[DELETE /resumes/:resume_id/bulletlists/:bulletlist_id] should delete a bullet list', function (done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).delete(getBulletListURI(resume._id, listResult.insertedId))
                .expect(200)
                .end(done);
            });
        });

        it('[PUT    /resumes/:resume_id/bulletlists/:bulletlist_id] should update an existing bullet list', function (done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).put(getBulletListURI(resume._id, listResult.insertedId))
                .set('Content-Type', 'application/json')
                .send({
                    name: 'A bullet list',
                    items: ['item1', 'item2'],
                    order: 1,
                    ordered_items: false
                })
                .expect(200)
                .end(done);
            });
        });
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

        it('[PUT] should not update bullet list with malformed request entity', function(done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).put(getBulletListURI(resume._id, listResult.insertedId))
                .set('Content-Type', 'application/json')
                .send('invalid data')
                .expect(400)
                .end(done);
            });
        });

        it('[PUT] should not update bullet list with semantics invalid data', function(done) {
            bulletlists.createEmpty(resume, function (err, listResult) {
                request(app.express).put(getBulletListURI(resume._id, listResult.insertedId))
                .set('Content-Type', 'application/json')
                .send({})
                .expect(422)
                .end(done);
            });
        });
    });
});
