var helpers = require('../../helpers'),
    api_helper = require('./api.test.helper'),
    app_root = helpers.app_root,
    ObjectId = require('mongodb').ObjectId,
    should = require('should'),
    session = require('supertest-session');

var app, request, db, resumes, userId, resumeId;

describe('Resume Basicinfo REST API', function () {

    var getBasicinfoURI = function () {
        return '/users/' + userId + '/resumes/' + resumeId + '/basicinfo';
    };

    before(function (done) {
        app = require(app_root + 'app');
        app.init(function () {
            db = require(app_root + 'config/mongodb').client;
            resumes = require(app_root + 'app/models/resumes.server.model');
            request = session(app.express);
            api_helper.createUser(db, function (err, resultUser) {
                userId = resultUser.insertedId;
                resumes.createEmpty({_id: ObjectId(userId)}).then(function (resultResume) {
                    resumeId = resultResume._id;
                    done();
                });
            });
        });
    });
    
    // login first 
    before(function(done) {
        api_helper.login(request, done);
    });

    after(function (done) {
        db.collection('users').drop();
        db.collection('resumes').drop();
        app.httpServer.close();
        done();
    });

    describe('Happy paths', function () {
        it('[GET /users/:user_id/resumes/:resume_id/basicinfo] should return basic informations', function (done) {
            request
                .get(getBasicinfoURI())
                .expect(200)
                .end(function (err, result) {
                    should.exists(result.body);
                    done(err);
                });
        });

        it('[PUT /users/:user_id/resumes/:resume_id/basicinfo] should update basic informations', function (done) {
            request
                .put(getBasicinfoURI())
                .set('Content-Type', 'application/json')
                .send({
                    name: 'A new name',
                    email: 'xyz@example.com',
                    website: 'nguyen.hieu.co',
                    phone: '987654321',
                    address1: 'Altona',
                    address2: 'Hanoi',
                    address3: 'Vietnam',
                })
                .expect(200)
                .end(function (err, result) {
                    resumes.collection.find({
                        _id: resumeId
                    }, {
                        basicinfo: 1
                    }).limit(1).next(function (errors, found) {
                        found.basicinfo.name.should.equal('A new name');
                        found.basicinfo.email.should.equal('xyz@example.com');
                        found.basicinfo.website.should.equal('nguyen.hieu.co');
                        found.basicinfo.phone.should.equal('987654321');
                        found.basicinfo.address1.should.equal('Altona');
                        found.basicinfo.address2.should.equal('Hanoi');
                        found.basicinfo.address3.should.equal('Vietnam');
                        done(err);
                    });
                });
        });
    });

    describe('Sad paths', function () {

        it('[PUT /users/:user_id/resumes/:resume_id/basicinfo] should not update bullet list with malformed supertest entity', function (done) {
            request.put(getBasicinfoURI())
                .set('Content-Type', 'application/json')
                .send('invalid data')
                .expect(400)
                .end(done);
        });

    });
});
