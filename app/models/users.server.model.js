var db = require('../../config/mongodb').client,
    users = db.collection('users'),
    bcrypt = require('bcryptjs');

exports.collection = users;

exports.create = function (params, callback) {

    validateUserInfo(params, function (errors) {

        if (errors.length != 0) {
            callback(errors);
            return;
        }

        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(params.password, salt);

        users.insertOne({
            email: params.email,
            password: hash
        }, callback);

    });
};

/**
 * @param {Object} user
 * @param {String} user.email user's email
 * @param {String} user.password user's password: at least 8 characters
 * @return {Array} list of errors
 */
var validateUserInfo = function (user, callback) {

    var errors = [];

    if (!user.email || user.email.length == 0) {
        errors.push({
            attribute: 'email',
            message: 'Email is required'
        });
    } else if (!user.email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}/)) {
        errors.push({
            attribute: 'email',
            message: 'Malformed Email'
        });
    }

    if (!user.password || user.password.length == 0) {
        errors.push({
            attribute: 'password',
            message: 'Password is required'
        });
    } else if (user.password.length < 8) {
        errors.push({
            attribute: 'password',
            message: 'User password must be at least 8 characters long'
        });
    }

    users.find({email: user.email}).count(function (err, count) {
        if (count != 0) {
            errors.push({
                attribute: 'email',
                message: 'Duplicated Email'
            });
        }

        callback(errors);
    });
};
