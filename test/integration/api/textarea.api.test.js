var helpers = require('../../helpers'),
    api_helper = require('./api.test.helper'),
    app_root = helpers.app_root,
    ObjectId = require('mongodb').ObjectId,
    should = require('should'),
    session = require('supertest-session');

describe('Textarea REST API', function() {

    var app, request, db, resumes, textareas, userId;

    before(function(done) {
        app = require(app_root + 'app');
        app.init(function() {
            db = require(app_root + 'config/mongodb').client;
            resumes = require(app_root + 'app/models/resumes.server.model');
            textareas = require(app_root + 'app/models/textareas.server.model');
            request = session(app.express);
            api_helper.createUser(db, function(err, resultUser) {
                userId = resultUser.insertedId;
                done();
            });
        });
    });

    // login first 
    before(function(done) {
        api_helper.login(request, done);
    });

    after(function(done) {
        db.collection('users').drop();
        app.httpServer.close();
        done();
    });

    var resume;

    beforeEach(function(done) {
        resumes.createEmpty({_id: ObjectId(userId)}, function(err, res) {
            resume = res.ops[0];
            done();
        });
    });

    afterEach(function(done) {
        db.collection('textareas').drop();
        db.collection('resumes').drop();
        done();
    });

    var getTextareaURI = function(resumeId, textareaId) {
        return '/users/' + userId + '/resumes/' + resumeId + '/textareas' + (textareaId ? '/' + textareaId : '');
    };

    describe('Happy paths', function() {

        it('[POST /users/:user_id/resumes/:resume_id/textareas/] should create an empty textarea', function(done) {
            request.post(getTextareaURI(resume._id))
                .expect('Location', /\/users\/[0-9a-f]{24}\/resumes\/[0-9a-f]{24}\/textareas\/[0-9a-f]{24}/)
                .expect(201)
                .end(function(err, result) {
                    if (err)
                        done(err);
                    else
                        request.get(result.headers.location).expect(200).end(done);
                });
        });

        it('[GET /users/:user_id/resumes/:resume_id/textareas/:textarea_id] should return a textarea', function(done) {
            textareas.createEmpty(resume, function(err, result) {
                request.get(getTextareaURI(resume._id, result._id))
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        should.exists(res.body._id);
                        should.exists(res.body.name);
                        should.exists(res.body.content);
                        should.exists(res.body.order);
                        res.body._id.should.equal(result._id.toString());
                        done(err);
                    });
            });
        });

        it('[DELETE /users/:user_id/resumes/:resume_id/textareas/:textarea_id] should delete a textarea', function(done) {
            textareas.createEmpty(resume, function(err, result) {
                request.delete(getTextareaURI(resume._id, result._id))
                    .expect(200)
                    .end(done);
            });
        });

        it('[PUT /users/:user_id/resumes/:resume_id/textareas/:textarea_id] should update an existing textarea', function(done) {
            textareas.createEmpty(resume, function(err, textResult) {
                request.put(getTextareaURI(resume._id, textResult._id))
                    .set('Content-Type', 'application/json')
                    .send({
                        name: 'A new Textarea',
                        content: 'New Content',
                        order: 2,
                    })
                    .expect(200)
                    .end(function(err, res) {
                        textareas.collection.findOne({
                            _id: textResult._id
                        }, function(findErr, result) {
                            should.not.exists(findErr);
                            should.exists(result);
                            result.name.should.equal('A new Textarea');
                            result.content.should.equal('New Content');
                            result.order.should.equal(2);
                            done(err);
                        });
                    });
            });
        });
    });

    describe('Sad paths', function() {

        it('[GET] should return 404 for a textarea which doesnt exists', function(done) {
            request.get(getTextareaURI(resume._id, '0123456789ab0123456789ef'))
                .expect(404)
                .end(done);
        });

        it('[GET] should return 404 for a textarea, which doesnt belong to a given resume', function(done) {
            resumes.createEmpty({_id: ObjectId(userId)}, function(err, res) {
                var anotherResume = res.ops[0];
                textareas.createEmpty(anotherResume, function(err, textResult) {
                    request.get(getTextareaURI(resume._id, textResult._id))
                        .expect(404)
                        .end(done);
                });
            });
        });

        it('[GET] Should return 404 for a invalid :textarea_id', function(done) {
            request.get(getTextareaURI(resume._id, '0123456789xy0123456789zt'))
                .expect(404)
                .end(done);
        });

        it('[PUT] should not update textarea with malformed supertest entity', function(done) {
            textareas.createEmpty(resume, function(err, textResult) {
                request.put(getTextareaURI(resume._id, textResult._id))
                    .set('Content-Type', 'application/json')
                    .send('invalid data')
                    .expect(400)
                    .end(done);
            });
        });

        it('[PUT] should not update textarea with semantics invalid data ', function(done) {
            textareas.createEmpty(resume, function(err, textResult) {
                request.put(getTextareaURI(resume._id, textResult._id))
                    .set('Content-Type', 'application/json')
                    .send({})
                    .expect(400)
                    .end(done);
            });
        });
    });

});
