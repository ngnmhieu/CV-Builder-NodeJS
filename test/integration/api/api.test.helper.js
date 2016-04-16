/**
 * Helper module for REST API Integration Tests
 */

module.exports = {

    createUser: function(db, callback) {
    db.collection('users').insertOne({
            email: 'user@example.com',
            password: '123456789'
        }, callback);
    },
};
