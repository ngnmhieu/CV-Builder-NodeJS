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
            firstName: params.firstName,
            lastName: params.lastName,
            email: params.email,
            password: hash
        }, callback);

    });
};

/**
 * @param {ObjectID} id User's ID
 */
exports.findById = function (id, callback) {
    users.findOne({
        _id: id
    }, {password: 0}, callback);
};

/**
 * @param {Object} userParam
 * @param {String} userParam.email user's email
 * @param {String} userParam.password user's password
 * @param {Function} User object will be passed to callback if authentication succeeds, null otherwise
 */
exports.authenticate = function (userParam, callback) {

    if (userParam == null || userParam.email == null || userParam.password == null
        || userParam.email.length == 0 || userParam.password.length == 0) {
        callback(null);
        return;
    }

    users.findOne({email: userParam.email}, function (err, user) {
        if (err || user == null) {
            callback(null);
        } else {
            bcrypt.compare(userParam.password, user.password, function(err, res) {
                callback(res ? user : null);
            });
        }

    });
};

/**
 * @param {Object} user
 * @param {String} user.email user's email
 * @param {String} user.password user's password: at least 8 characters
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

    if (!user.firstName || user.firstName.length == 0) {
        errors.push({
            attribute: 'firstName',
            message: 'First name is required'
        });
    }

    if (!user.lastName || user.lastName.length == 0) {
        errors.push({
            attribute: 'lastName',
            message: 'Last name is required'
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
