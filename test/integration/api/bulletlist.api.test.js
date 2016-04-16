var helpers = require('../../helpers'),
    api_helper = require('./api.test.helper'),
    app_root = helpers.app_root,
    should = require('should'),
    request = require('supertest');

describe('Bulletlist REST API', function() {

    var app, db, resumes, bulletlists, userId;

    before(function(done) {
        app = require(app_root + 'app');
        app.init(function() {
            db = require(app_root + 'config/mongodb').client;
            resumes = require(app_root + 'app/models/resumes.server.model');
            bulletlists = require(app_root + 'app/models/bulletlists.server.model');
            api_helper.createUser(db, function(err, resultUser) {
                userId = resultUser.insertedId;
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
        db.collection('bulletlists').drop();
    });

    var resume;

    beforeEach(function(done) {
        resumes.createEmpty(function(err, res) {
            resume = res.ops[0];
            done();
        });
    });

    var getBulletListURI = function(resumeId, bulletListId) {
        return '/users/' + userId + '/resumes/' + resumeId + '/bulletlists' + (bulletListId ? '/' + bulletListId : '');
    };

    describe('Happy paths', function() {
        it('[GET /users/:user_id/resumes/:resume_id/bulletlists] should return a bullet list', function(done) {
            bulletlists.createEmpty(resume, function(err, listResult) {
                request(app.express).get(getBulletListURI(resume._id, listResult.insertedId))
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(done);
            });
        });

        it('[POST /users/:user_id/resumes/:resume_id/bulletlists/:bulletlist_id] should create an empty bullet list', function(done) {
            request(app.express).post(getBulletListURI(resume._id))
                .expect('Location', /\/users\/[0-9a-f]{24}\/resumes\/[0-9a-f]{24}\/bulletlists\/[0-9a-f]{24}/)
                .expect(201)
                .end(function(err, result) {
                    if (err)
                        done(err);
                    else
                        request(app.express).get(result.headers.location).expect(200).end(done);
                });
        });

        it('[DELETE /users/:user_id/resumes/:resume_id/bulletlists/:bulletlist_id] should delete a bullet list', function(done) {
            bulletlists.createEmpty(resume, function(err, listResult) {
                request(app.express).delete(getBulletListURI(resume._id, listResult.insertedId))
                    .expect(200)
                    .end(done);
            });
        });

        it('[PUT /users/:user_id/resumes/:resume_id/bulletlists/:bulletlist_id] should update an existing bullet list', function(done) {
            bulletlists.createEmpty(resume, function(err, listResult) {
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

    describe('Sad paths', function() {

        it('[GET] should return 404 for a bullet list which doesnt exists', function(done) {
            request(app.express).get(getBulletListURI(resume._id, '0123456789ab0123456789ef'))
                .expect(404)
                .end(done);
        });

        it('[GET] should return 404 for a bullet list, which doesnt belong to a given resume', function(done) {
            resumes.createEmpty(function(err, res) {
                var anotherResume = res.ops[0];
                bulletlists.createEmpty(anotherResume, function(err, listResult) {
                    request(app.express).get(getBulletListURI(resume._id, listResult.insertedId))
                        .expect(404)
                        .end(done);
                });
            });
        });

        it('Should return 404 for a invalid :bulletlist_id', function(done) {
            request(app.express).get(getBulletListURI(resume._id, '0123456789xy0123456789zt'))
                .expect(404)
                .end(done);
        });

        it('[PUT] should not update bullet list with malformed request entity', function(done) {
            bulletlists.createEmpty(resume, function(err, listResult) {
                request(app.express).put(getBulletListURI(resume._id, listResult.insertedId))
                    .set('Content-Type', 'application/json')
                    .send('invalid data')
                    .expect(400)
                    .end(done);
            });
        });

        it('[PUT] should not update bullet list with semantics invalid data', function(done) {
            bulletlists.createEmpty(resume, function(err, listResult) {
                request(app.express).put(getBulletListURI(resume._id, listResult.insertedId))
                    .set('Content-Type', 'application/json')
                    .send({})
                    .expect(422)
                    .end(done);
            });
        });
    });
});
