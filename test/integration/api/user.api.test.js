var helpers = require('../../helpers'),
    app_root = helpers.app_root,
    api_helper = require('./api.test.helper'),
    should = require('should'),
    request = require('supertest');

describe('User REST API', function () {

    var app, db, users;

    before(function (done) {
        app = require(app_root + 'app');
        app.init(function () {
            db = require(app_root + 'config/mongodb').client;
            done();
        });
    });

    after(function (done) {
        app.httpServer.close();
        done();
    });

    beforeEach(function (done) {
        done();
    });

    afterEach(function () {
        db.collection('users').drop();
    });

    describe('Happy paths', function () {

        it('[POST /session should log user in]', function(done) {
            api_helper.createUser(db, function(err, result) {
                userId = result.insertedId;
                request(app.express)
                    .post('/session')
                    .set('Content-Type', 'application/json')
                    .send({
                        email: 'user@example.com',
                        password: '123456789' 
                    })
                    .expect(200)
                    .end(done);
            });
        });


        it('[POST /users] should register a user with valid infomration', function (done) {

            request(app.express).post('/users')
                .type('json')
                .send({
                    firstName: 'Hieu',
                    lastName: 'Nguyen',
                    email: 'user@example.com',
                    password: '123456789'
                })
                .expect(201)
                .expect('Location', /\/users\/[0-9a-f]{24}/)
                .end(done);
        });
    });

    describe('Sad paths', function () {

        it('[POST /session] should return 401 if user cannot be authenticated', function (done) {
            api_helper.createUser(db, function(err, result) {
                request(app.express)
                    .post('/session')
                    .set('Content-Type', 'application/json')
                    .send({
                        email: 'user@example.com',
                        password: 'wrongpass' 
                    })
                    .expect(400)
                    .end(done);
            });
        });


        it('[POST /users] should return 400 if email is already used', function (done) {
            var email = 'user@example.com';
            db.collection('users').insertOne({email: email, password: '123456789'}, function () {
                request(app.express).post("/users")
                    .type("json")
                    .send({
                        email: email,
                        password: "123456789"
                    }).expect(400).end(done);
            });
        });

        it('[POST /users] should return 400 if email is invalid', function (done) {
            request(app.express).post("/users")
                .type("json")
                .send({
                    email: "invalid@",
                    password: "123456789"
                }).expect(400).end(done);
        });

        it('[POST /users] should return 400 if email is missing or password is missing', function (done) {
            request(app.express).post("/users")
                .type("json")
                .send({
                    password: "123456789"
                }).expect(400).end(done);
        });

    });

});
