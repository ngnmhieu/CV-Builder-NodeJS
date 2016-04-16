var users = require('../models/users.server.model'),
    ObjectId = require('mongodb').ObjectId;

/**
 * GET /users/:id
 * returns a user
 * @param req
 * @param res
 */
exports.read = function (req, res) {
    var user = req.userObj;
    res.json({
        _id: user._id,
        email: user.email,
    });
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

exports.byId = function (req, res, next, id) {

    if (!ObjectId.isValid(id)) {
        res.sendStatus(404);
        return;
    }

    users.collection.find({
        _id: ObjectId(id)
    }, {fields: {email: 1}}).limit(1).next(function (err, result) {

        if (err) throw err;

        if (result == null) {
            res.sendStatus(404);
            return;
        }

        req.userObj = result;

        next();
    });
};
