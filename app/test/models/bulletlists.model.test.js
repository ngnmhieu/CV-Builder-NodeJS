var helpers = require('../helpers'),
    mongo = require('../../../config/mongodb'),
    should = require('should');

var db, bulletlists, resumes;

before(function (done) {
    mongo.init(function (err, client) {
        db = client;
        bulletlists = require('../../models/bulletlists.server.model');
        resumes = require('../../models/resumes.server.model');
        done();
    });
});

describe('Bulletlist Model', function (done) {

    afterEach(function () {
        db.collection('resumes').drop();
        db.collection('bulletlists').drop();
    });

    it('#createEmpty should create an empty bullet list, with default name and no items', function (done) {

        db.collection('resumes').insertOne({
            name: 'Test CV',
            created_at : new Date(),
            updated_at : new Date(),
            sections: []
        }, function (err, res) {
            var resume = res.ops[0];

            // before creating
            resume.sections.should.be.empty();

            bulletlists.createEmpty(resume, function (err, result) {

                // after creating
                should.not.exists(err);

                db.collection('bulletlists').findOne({_id: result.insertedId }, function (err, resultList) {

                    // new list should have default name and no item
                    resultList.name.should.equal('New bullet list');
                    resultList.items.should.be.empty();

                    // list should be added to resume sections
                    db.collection('resumes').findOne({_id: resume._id}, function (err, resumeResult) {
                        resumeResult.sections.should.containEql({'type': 'bulletlist', _id: resultList._id});
                        done();
                    });
                });
            });
        });

    });

    it('#deleteById should delete a bulletlist, and remove it from resumes.sections', function (done) {
        db.collection('bulletlists').insertOne({
            name          : 'Empty Bullet List',
            items         : [],
            order         : 1,
            ordered_items : false
        }, function (err, listRes) {

            db.collection('resumes').insertOne({
                name: 'Test CV',
                created_at : new Date(),
                updated_at : new Date(),
                sections: [{'type': 'bulletlist', _id: listRes.insertedId}]
            }, function (err, resumeRes) {
                bulletlists.deleteById(resumeRes.ops[0], listRes.ops[0], function () {
                    db.collection('bulletlists').findOne({_id: listRes.insertedId}, function (err, list) {
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
});

