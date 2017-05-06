var helpers = require('../../helpers'),
    api_helper = require('./api.test.helper'),
    app_root = helpers.app_root,
    ObjectId = require('mongodb').ObjectId,
    should = require('should'),
    session = require('supertest-session');

describe('Worklist REST API', function() {

    var app, request, db, resumes, worklists, userId;

    before(function(done) {
        app = require(app_root + 'app');
        app.init(function() {
            db = require(app_root + 'config/mongodb').client;
            resumes = require(app_root + 'app/models/resumes.server.model');
            worklists = require(app_root + 'app/models/worklists.server.model');
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

    afterEach(function() {
        db.collection('resumes').drop();
        db.collection('worklists').drop();
    });

    var resume;

    beforeEach(function(done) {
        resumes.createEmpty({_id: ObjectId(userId)}, function (err, res) {
            resume = res.ops[0];
            done();
        });
    });

    var getWorkListURI = function(resumeId, workListId) {
        return '/users/' + userId + '/resumes/' + resumeId + '/worklists' + (workListId ? '/' + workListId : '');
    };

    describe('Happy paths', function() {

        it('[POST /users/:user_id/resumes/:resume_id/worklists] should create an empty work list', function(done) {
            request.post(getWorkListURI(resume._id))
                .expect('Location', /\/users\/[0-9a-f]{24}\/resumes\/[0-9a-f]{24}\/worklists\/[0-9a-f]{24}/)
                .expect(201)
                .end(function(err, result) {
                    if (err)
                        throw err;
                    else
                        request.get(result.headers.location).expect(200).end(done);
                });
        });

        it('[GET /users/:user_id/resumes/:resume_id/worklists/:worklist_id] should return a work list', function(done) {
            worklists.createEmpty(resume, function(listResult) {
                request.get(getWorkListURI(resume._id, listResult._id))
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if (err) throw err;
                        should.exists(res.body._id);
                        should.exists(res.body.items);
                        should.exists(res.body.order);
                        res.body._id.should.equal(listResult._id.toString());
                        done();
                    });
            });
        });


        it('[DELETE /users/:user_id/resumes/:resume_id/worklists/:worklist_id] should delete a work list', function(done) {
            worklists.createEmpty(resume, function(listResult) {
                request.delete(getWorkListURI(resume._id, listResult._id))
                    .expect(200)
                    .end(done);
            });
        });

        it('[PUT /users/:user_id/resumes/:resume_id/worklists/:worklist_id] should update an existing work list', function(done) {
            worklists.createEmpty(resume, function(listResult) {
                request.put(getWorkListURI(resume._id, listResult._id))
                    .set('Content-Type', 'application/json')
                    .send({
                        name: 'A work list',
                        items: [{
                            title: 'web developer',
                            institution: 'abc gmbh',
                            startDate: new Date(),
                            endDate: new Date(),
                            desc: '',
                            tillNow: false
                        }, {
                            title: 'accountant',
                            institution: 'xyz gmbh',
                            startDate: new Date(),
                            endDate: new Date(),
                            desc: '',
                            tillNow: true
                        }],
                        order: 1,
                    })
                    .expect(200)
                    .end(done);
            });
        });
    });

    describe('Sad paths', function() {

        it('[GET] should return 404 for a work list which doesnt exists', function(done) {
            request.get(getWorkListURI(resume._id, '0123456789ab0123456789ef'))
                .expect(404)
                .end(done);
        });

        it('[GET] should return 404 for a work list, which doesnt belong to a given resume', function(done) {
            resumes.createEmpty({_id: ObjectId(userId)}, function(err, res) {
                var anotherResume = res.ops[0];
                worklists.createEmpty(anotherResume, function(listResult) {
                    request.get(getWorkListURI(resume._id, listResult._id))
                        .expect(404)
                        .end(done);
                });
            });
        });

        it('Should return 404 for a invalid :worklist_id', function(done) {
            request.get(getWorkListURI(resume._id, '0123456789xy0123456789zt'))
                .expect(404)
                .end(done);
        });

        it('[PUT] should not update work list with malformed supertest entity', function(done) {
            worklists.createEmpty(resume, function(listResult) {
                request.put(getWorkListURI(resume._id, listResult._id))
                    .set('Content-Type', 'application/json')
                    .send('invalid data')
                    .expect(400)
                    .end(done);
            });
        });

        it('[PUT] should not update work list with semantics invalid data ', function(done) {
            worklists.createEmpty(resume, function(listResult) {
                request.put(getWorkListURI(resume._id, listResult._id))
                    .set('Content-Type', 'application/json')
                    .send({})
                    .expect(400)
                    .end(done);
            });
        });
    });
});
