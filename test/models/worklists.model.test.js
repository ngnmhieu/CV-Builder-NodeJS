var app_root = '/Users/hieusun/Work/programming/nodejs/cvbuilder/',
    helpers = require('../helpers'),
    mongo = require(app_root + 'config/mongodb'),
    should = require('should');

var db, worklists, resumes;

before(function (done) {
    mongo.init(function (err, client) {
        db = require(app_root + 'config/mongodb').client;
        worklists = require(app_root + 'app/models/worklists.server.model');
        resumes = require(app_root + 'app/models/resumes.server.model');
        done();
    });
});

describe('Worklist Model', function (done) {

    afterEach(function () {
        db.collection('resumes').drop();
        db.collection('worklists').drop();
    });

    it('#createEmpty should create an empty worklist, with default name and no items', function (done) {

        db.collection('resumes').insertOne({
            name: 'Test CV',
            created_at : new Date(),
            updated_at : new Date(),
            sections: []
        }, function (err, res) {
            var resume = res.ops[0];

            // before creating
            resume.sections.should.be.empty();

            worklists.createEmpty(resume, function (err, result) {

                // after creating
                should.not.exists(err);

                db.collection('worklists').findOne({_id: result.insertedId }, function (err, resultList) {

                    // new list should have default name and no item
                    resultList.name.should.equal('New worklist');
                    resultList.items.should.be.empty();

                    // list should be added to resume sections
                    db.collection('resumes').findOne({_id: resume._id}, function (err, resumeResult) {
                        resumeResult.sections.should.containEql({'type': 'worklist', _id: resultList._id});
                        done();
                    });
                });
            });
        });

    });

    var insertEmptyworkList = function (callback) {
        db.collection('worklists').insertOne({
            name          : 'Empty work List',
            items         : [],
            order         : 1
        }, callback)
    };

    it('#deleteById should delete a worklist, and remove it from resumes.sections', function (done) {
        db.collection('worklists').insertOne({
            name          : 'Empty work List',
            items         : [],
            order         : 1
        }, function (err, listRes) {

            db.collection('resumes').insertOne({
                name: 'Test CV',
                created_at : new Date(),
                updated_at : new Date(),
                sections: [{'type': 'worklist', _id: listRes.insertedId}]
            }, function (err, resumeRes) {
                worklists.deleteById(resumeRes.ops[0], listRes.ops[0], function () {
                    db.collection('worklists').findOne({_id: listRes.insertedId}, function (err, list) {
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

    it('#updateById should update a work list', function (done) {

        db.collection('worklists').insertOne({
            name          : 'Empty Work List',
            items         : [],
            order         : 1
        }, function (err, listRes) {

            worklists.updateById(listRes.ops[0], {
                name: 'A New Work List',
                items: [
                    { title: 'web developer', institution: 'abc gmbh', startDate: new Date(), endDate: new Date(), desc: '', tillNow: false },
                    { title: 'accountant', institution: 'xyz gmbh', startDate: new Date(), endDate: new Date(), desc: '', tillNow: false }
                ],
                order: 2
            }, function (err, updateResult) {

                db.collection('worklists').findOne({_id: listRes.insertedId}, function (err, list) {
                    list.name.should.equal('A New Work List');
                    list.items.should.not.be.empty();
                    list.order.should.equal(2);
                    done();
                });
            });
        });
    });

    it('1#updateById should not update a work list when attributes are missing', function (done) {
        db.collection('worklists').insertOne({
            name          : 'Empty Work List',
        }, function (err, listRes) {

            worklists.updateById(listRes.ops[0], {}, function (err, updateResult) {
                should.exists(err);
                done();
            });
        });
    });

    it('2#updateById should not update a work list when invalid parameters are provided', function (done) {
        db.collection('worklists').insertOne({
            name  : 'Empty Work List',
            items : ['string'],
            order : 1
        }, function (err, listRes) {

            worklists.updateById(listRes.ops[0], {
                name  : 'A New Work List',
                items : ['string'], // invalid
                order : 1
            }, function (err, updateResult) {
                should.exists(err);
                done();
            });
        });
    });
});

