var users = require('../models/users.server.model'),
    ObjectId = require('mongodb').ObjectId;

exports.login = function (req, res) {

    users.authenticate(req.body, function (user) {

        if (user == null) {
            return res.sendStatus(400);
        }

        req.session.userId = user._id.toHexString();

        return res.sendStatus(200);
    }); 
};

exports.logout = function (req, res) {
    req.session.userId = null;
    res.sendStatus(200);
};

/**
 * POST /users/ registers a user
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.register = function (req, res) {

    users.create(req.body, function (err, result) {

        if (err && err.length != 0) {
            return  res.status(400).json(err);
        }

        res.location('/users/' + result.insertedId).sendStatus(201);
    });
};

/**
 * Set the user object if user's ID is set in the URL
 * If user is not logged in yet, then 401 Unauthorized is returned
 * If use is logged in, but is not the user specified in the URL, 403 Forbidden Access is returned
 */
exports.byId = function (req, res, next, userId) {

    var sessionUserId = null;

    if (req.userObj)
        sessionUserId = req.userObj._id.toHexString();

    if (sessionUserId == null) {

        return res.sendStatus(401);

    } else if (sessionUserId != null && sessionUserId != userId) {

        return res.sendStatus(403);
    }

    if (!ObjectId.isValid(userId)) {
        res.sendStatus(404);
        return;
    }

    users.findById(ObjectId(userId), function (err, result) {

        if (err) throw err;

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.userObj = result;

        next();
    });

};

/**
 * Set the user object if user's ID is set in the URL
 * If user is not logged in yet, then 401 Unauthorized is returned
 * If use is logged in, but is not the user specified in the URL, 403 Forbidden Access is returned
 */
exports.authenticate = function (req, res, next) {

    var userId = req.session.userId;

    if (!ObjectId.isValid(userId))
        return next();

    users.findById(ObjectId(userId), function (err, result) {

        if (err) throw err;

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.userObj = result;

        next();
    });
};
