var helpers = require('../helpers'),
    app_root = helpers.app_root,
    mongo = require(app_root + 'config/mongodb'),
    should = require('should'),
    ObjectId = require('mongodb').ObjectId,
    expect = require('chai').expect;

var db, bulletlists, resumes;

before(function (done) {
    mongo.init(function (err, client) {
        db = require(app_root + 'config/mongodb').client;
        bulletlists = require(app_root + 'app/models/bulletlists.server.model');
        resumes = require(app_root + 'app/models/resumes.server.model');
        done();
    });
});

describe('Bulletlist Model', function (done) {

    afterEach(function () {
        db.collection('resumes').drop();
        db.collection('bulletlists').drop();
    });

    it('#createEmpty should create an empty bullet list, with default name and no items', function (done) {

        resumes.createEmpty({_id: ObjectId()}).then(function (resume) {

            expect(resume.sections).to.be.empty;

            bulletlists.createEmpty(resume, function (err, result) {

                expect(err).to.not.exist;
                expect(result).to.exist;

                db.collection('bulletlists').findOne({_id: result._id }).then(function (resultList) {

                    expect(resultList).to.exist;
                    expect(resultList.name).to.not.be.empty;
                    expect(resultList.items).to.be.empty;

                    // list should be added to resume sections
                    resumes.findById(resume._id, function(err, resumeResult) {
                        expect(resumeResult.sections.length).to.equal(1);
                        done();
                    });
                });
            });
        });

    });

    var insertEmptyBulletList = function (callback) {
        db.collection('bulletlists').insertOne({
            name          : 'Empty Bullet List',
            items         : [],
            order         : 1,
            numbered : false
        }, callback)
    };

    it('#deleteById should delete a bulletlist, and remove it from resumes.sections', function (done) {
        resumes.createEmpty({_id: ObjectId()}).then(function (resume) {
            bulletlists.createEmpty(resume, function(err, listRes) {

                bulletlists.deleteById(resume, listRes, function () {
                    db.collection('bulletlists').findOne({_id: listRes._id}, function (err, list) {
                        should.not.exists(list);
                        resumes.findById(resume._id, function (err, resume) {
                            resume.sections.should.be.empty();
                            done();
                        });
                    });
                });

            });
        });
    });

    it('#updateById should update a bullet list', function (done) {

        db.collection('bulletlists').insertOne({
            name          : 'Empty Bullet List',
            items         : [],
            order         : 1,
            numbered : false
        }, function (err, listRes) {
            bulletlists.updateById(listRes.ops[0], {
                name: 'A New Bullet List',
                items: [{
                    content: 'Item 1',
                    order: 1
                }],
                order: 2,
                numbered: true
            }, function (err, updateResult) {
                expect(err).to.not.exist;

                db.collection('bulletlists').findOne({_id: listRes.insertedId}, function (err, list) {
                    expect(list.name).to.not.be.empty;
                    expect(list.items).to.not.be.empty;
                    expect(list.order).to.equal(2);
                    expect(list.numbered).to.be.true;
                    done();
                });
            });
        });
    });

    it('1#updateById should not update a bullet list when attributes are missing', function (done) {
        
        db.collection('bulletlists').insertOne({
            name          : 'Empty Bullet List',
            items         : [],
            order         : 1,
            numbered : false
        }, function (err, listRes) {

            bulletlists.updateById(listRes.ops[0], {}, function (err, updateResult) {
                should.exists(err);
                done();
            });
        });
    });

    it('2#updateById should not update a work list when provided with invalid parameters', function (done) {
        db.collection('bulletlists').insertOne({
            name          : 'Empty Bullet List',
            items         : [true, false], // invalid, must be strings
            order         : 1,
            numbered : true
        }, function (err, listRes) {

            bulletlists.updateById(listRes.ops[0], {}, function (err, updateResult) {
                should.exists(err);
                done();
            });
        });
    });
});

