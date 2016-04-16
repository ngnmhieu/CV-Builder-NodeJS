var helpers = require('../../helpers'),
    app_root = helpers.app_root,
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

        it('[POST /users] should register a user with valid infomration', function (done) {

            request(app.express).post('/users')
                .type('json')
                .send({
                    email: 'user@example.com',
                    password: '123456789'
                })
                .expect(201)
                .expect('Location', /\/users\/[0-9a-f]{24}/)
                .end(function (err, res) {
                    if (err)
                        return done(err);
                    request(app.express)
                        .get(res.headers.location)
                        .expect(200).end(done);
                })
        });

        it('[GET /users/:user_id] should return user information', function (done) {

            db.collection('users').insertOne({
                email: 'user@example.com',
                password: '123456789'
            }, function (err, result) {
                request(app.express)
                    .get('/users/' + result.insertedId)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .expect({
                        _id: result.insertedId.toString(),
                        email: "user@example.com"
                    })
                    .end(done);
            });
        });

    });

    describe('Sad paths', function () {

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


        it('[GET /users/:user_id] should return 404 if user not found', function (done) {
            // non-existent user
            request(app.express).get("/users/5716737221a1965c00980fd7")
                .expect(404).end(done);
        });

        // it('[GET /users/:user_id] should return 401 if user cannot be authenticated', function (done) {
            //
            // db.collection('users').insertOne({email: 'user@example.com', password: '123456789'}, function (err, result) {
            //     request(app.express).get("/users/" + result.insertedId)
            //         .expect(401).end(done);
            // });
        // });

    });

});
