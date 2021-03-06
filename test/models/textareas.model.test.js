var helpers = require('../helpers'),
    app_root = helpers.app_root,
    mongo = require(app_root + 'config/mongodb'),
    ObjectId = require('mongodb').ObjectId,
    should = require('should'),
    expect = require('chai').expect;

var db, textareas, resumes;

before(function (done) {
    mongo.init(function (err, client) {
        db = require(app_root + 'config/mongodb').client;
        textareas = require(app_root + 'app/models/textareas.server.model');
        resumes = require(app_root + 'app/models/resumes.server.model');
        done();
    });
});

describe('Textarea Model', function (done) {

    afterEach(function () {
        db.collection('resumes').drop();
        db.collection('textareas').drop();
    });

    it('#createEmpty should create an empty textarea, with default name and empty content', function (done) {

        resumes.createEmpty({_id: ObjectId()}).then(function (resume) {

            expect(resume.sections).to.be.empty;

            textareas.createEmpty(resume, function (err, result) {

                // after creating
                should.not.exists(err);

                db.collection('textareas').findOne({_id: result._id }, function (err, resultTextarea) {

                    // new list should have default name and no item
                    resultTextarea.name.should.equal('A new Textarea');
                    resultTextarea.content.should.equal('');

                    // list should be added to resume sections
                    db.collection('resumes').findOne({_id: resume._id}, function (err, resumeResult) {
                        resumeResult.sections.should.containEql({'type': 'textarea', _id: resultTextarea._id});
                        done();
                    });
                });
            });
        });

    });

    var insertEmptyTextarea = function (callback) {
        db.collection('textareas').insertOne({
            name    : 'Empty textarea',
            content : '',
        }, callback)
    };

    it('#deleteById should delete a textarea, and remove it from resumes.sections', function (done) {
        db.collection('textareas').insertOne({
            name    : 'Empty textarea',
            content : '',
        }, function (err, textRes) {

            db.collection('resumes').insertOne({
                name: 'Test CV',
                created_at : new Date(),
                updated_at : new Date(),
                sections: [{'type': 'textarea', _id: textRes.insertedId}]
            }, function (err, resumeRes) {
                textareas.deleteById(resumeRes.ops[0], textRes.ops[0], function () {
                    db.collection('textareas').findOne({_id: textRes.insertedId}, function (err, list) {
                        should.not.exists(list);
                        db.collection('resumes').findOne({_id: resumeRes.insertedId}, function (err, resume) {
                            resume.sections.should.be.empty();
                            done();
                        })
                    });
                });
            });
        });
    });

    it('#updateById should update a textarea', function (done) {

        db.collection('textareas').insertOne({
            name    : 'Empty Textarea',
            content : '',
        }, function (err, textRes) {

            textareas.updateById(textRes.ops[0], {
                name: 'A new Textarea',
                content: '',
            }).then(function (updateResult) {

                db.collection('textareas').findOne({_id: textRes.insertedId}, function (err, list) {
                    list.name.should.equal('A new Textarea');
                    done();
                });
            });
        });
    });

    it('1#updateById should not update a textarea when attributes are missing', function (done) {
        db.collection('textareas').insertOne({
            name          : 'Empty Textarea',
        }, function (err, listRes) {

            textareas.updateById(listRes.ops[0], {}).then(function (updateResult) {
            }, (err) => {
                should.exists(err);
                done();
            });
        });
    });

    it('2#updateById should not update a textarea when invalid parameters are provided', function (done) {
        db.collection('textareas').insertOne({
            name    : 'Empty Textarea',
            content : null,
        }, function (err, listRes) {

            textareas.updateById(listRes.ops[0], {
                name  : 'A new Textarea',
            }).then(function (updateResult) {
            }, (err) => {
                should.exists(err);
                done();
            });
        });
    });
});

