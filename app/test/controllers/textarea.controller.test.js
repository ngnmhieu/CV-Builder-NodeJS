var helpers = require('../helpers'),
    should = require('should'),
    request = require('supertest');

describe('Textarea REST API', function () {

    var app, db, resumes, textareas;
    
    before(function (done) {
        app = require('../../../app.js');
        app.init(function () {
            db        = require('../../../config/mongodb').client;
            resumes   = require('../../models/resumes.server.model');
            textareas = require('../../models/textareas.server.model');
            done();
        });
    });

    after(function (done) {
        app.httpServer.close();
        done(); 
    });

    var resume;

    beforeEach(function (done) {
        resumes.createEmpty(function (err, res) {
            resume = res.ops[0];
            done();
        });
    });
    
    afterEach(function (done) {
        db.collection('textareas').drop();
        db.collection('resumes').drop();
        done();
    });

    var getTextareaURI = function (resumeId, textareaId) {
        return '/resumes/' + resumeId + '/textareas' + (textareaId ? '/' + textareaId : '');
    };

    describe('Good paths', function () {
        it('[GET] should return a textarea /resumes/:resume_id/textareas/:textarea_id', function (done) {
            textareas.createEmpty(resume, function (err, result) {
                request(app.express).get(getTextareaURI(resume._id, result.insertedId))
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    should.exists(res.body._id);
                    should.exists(res.body.name);
                    should.exists(res.body.content);
                    should.exists(res.body.order);
                    res.body._id.should.equal(result.insertedId.toString());
                    done(err);
                });
            });
        });

        it('[POST] should create an empty textarea /resumes/:resume_id/textareas/:textarea_id', function (done) {
            request(app.express).post(getTextareaURI(resume._id))
            .expect('Location', /\/resumes\/[0-9a-f]{24}\/textareas\/[0-9a-f]{24}/)
            .expect(201)
            .end(function (err, result) {
                if (err) 
                    done(err);
                else 
                    request(app.express).get(result.headers.location).expect(200).end(done);
            });
        });
        //
        it('[DELETE] should delete a textarea /resumes/:resume_id/textareas/:textarea_id', function (done) {
            textareas.createEmpty(resume, function (err, result) {
                request(app.express).delete(getTextareaURI(resume._id, result.insertedId))
                .expect(200)
                .end(done);
            });
        });

        it('[PUT] should update an existing textarea', function (done) {
            textareas.createEmpty(resume, function (err, textResult) {
                request(app.express).put(getTextareaURI(resume._id, textResult.insertedId))
                .set('Content-Type', 'application/json')
                .send({
                    name: 'A new Textarea',
                    content: 'New Content',
                    order: 2,
                })
                .expect(200)
                .end(function (err, res) {
                    textareas.collection.findOne({_id: textResult.insertedId}, function (findErr, result) {
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


});
