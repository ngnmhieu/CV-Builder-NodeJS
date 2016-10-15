/**
 * Helper module for REST API Integration Tests
 */
var bcrypt = require('bcryptjs');

exports.createUser = function(db, callback) {
        db.collection('users').insertOne({
                email: 'user@example.com',
                password: bcrypt.hashSync('123456789', bcrypt.genSaltSync(10))
            }, callback);
};

exports.login = function(request, done) {
        request
            .post('/session')
            .set('Content-Type', 'application/json')
            .send({
                email: 'user@example.com',
                password: '123456789'
            })
            .expect(200)
            .end(done);
};
