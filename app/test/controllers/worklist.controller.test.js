var helpers = require('../helpers'),
    should = require('should'),
    request = require('supertest');

describe('Worklist REST API', function () {

    var app, db, resumes, worklists;

    before(function (done) {
        app = require('../../../app');
        app.init(function () {
            db        = require('../../../config/mongodb').client;
            resumes   = require('../../models/resumes.server.model');
            worklists = require('../../models/worklists.server.model');
            done();
        });
    });

    after(function (done) {
        app.httpServer.close(); 
        done();
    });

    afterEach(function () {
        db.collection('resumes').drop();
        db.collection('worklists').drop();
    });

    var resume;

    beforeEach(function (done) {
        resumes.createEmpty(function (err, res) {
            resume = res.ops[0];
            done();
        });
    });

    var getWorkListURI = function (resumeId, workListId) {
        return '/resumes/' + resumeId + '/worklists' + (workListId ? '/' + workListId : '');
    };

    describe('Good paths', function () {
        it('[GET] should return a work list /resumes/:resume_id/worklists/:worklist_id', function (done) {
            worklists.createEmpty(resume, function (err, listResult) {
                request(app.express).get(getWorkListURI(resume._id, listResult.insertedId))
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    should.exists(res.body._id);
                    should.exists(res.body.items);
                    should.exists(res.body.order);
                    res.body._id.should.equal(listResult.insertedId.toString());
                    done(err);
                });
            });
        });

        it('[POST] should create an empty work list /resumes/:resume_id/worklists/:worklist_id', function (done) {
            request(app.express).post(getWorkListURI(resume._id))
            .expect('Location', /\/resumes\/[0-9a-f]{24}\/worklists\/[0-9a-f]{24}/)
            .expect(201)
            .end(function (err, result) {
                if (err) 
                    done(err);
                else 
                    request(app.express).get(result.headers.location).expect(200).end(done);
            });
        });

        it('[DELETE] should delete a work list /resumes/:resume_id/worklists/:worklist_id', function (done) {
            worklists.createEmpty(resume, function (err, listResult) {
                request(app.express).delete(getWorkListURI(resume._id, listResult.insertedId))
                .expect(200)
                .end(done);
            });
        });

        it('[PUT] should update an existing work list', function (done) {
            worklists.createEmpty(resume, function (err, listResult) {
                request(app.express).put(getWorkListURI(resume._id, listResult.insertedId))
                .set('Content-Type', 'application/json')
                .send({
                    name: 'A work list',
                    items: [
                        { title: 'web developer', institution: 'abc gmbh', startDate: new Date(), endDate: new Date(), desc: '', tillNow: false },
                        { title: 'accountant', institution: 'xyz gmbh', startDate: new Date(), endDate: new Date(), desc: '', tillNow: true }
                    ],
                    order: 1,
                })
                .expect(200)
                .end(done);
            });
        });
    });

    describe('Sad paths', function () {

        it('[GET] should return 404 for a work list which doesnt exists', function (done) {
            request(app.express).get(getWorkListURI(resume._id, '0123456789ab0123456789ef'))
            .expect(404)
            .end(done);
        });

        it('[GET] should return 404 for a work list, which doesnt belong to a given resume', function (done) {
            resumes.createEmpty(function (err, res) {
                var anotherResume = res.ops[0];
                worklists.createEmpty(anotherResume, function (err, listResult) {
                    request(app.express).get(getWorkListURI(resume._id, listResult.insertedId))
                    .expect(404)
                    .end(done);
                });
            });
        });

        it('Should return 404 for a invalid :worklist_id', function (done) {
            request(app.express).get(getWorkListURI(resume._id, '0123456789xy0123456789zt'))
            .expect(404)
            .end(done);
        });

        it('[PUT] should not update work list with malformed request entity', function(done) {
            worklists.createEmpty(resume, function (err, listResult) {
                request(app.express).put(getWorkListURI(resume._id, listResult.insertedId))
                .set('Content-Type', 'application/json')
                .send('invalid data')
                .expect(400)
                .end(done);
            });
        });

        it('[PUT] should not update work list with semantics invalid data ', function(done) {
            worklists.createEmpty(resume, function (err, listResult) {
                request(app.express).put(getWorkListURI(resume._id, listResult.insertedId))
                .set('Content-Type', 'application/json')
                .send({})
                .expect(422)
                .end(done);
            });
        });
    });
});
