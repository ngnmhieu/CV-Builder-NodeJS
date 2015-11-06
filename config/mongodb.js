var config  = require('./config'),
    client  = require('mongodb').MongoClient;

var host   = config.mongodb.host,
    dbname = config.mongodb.dbname,
    port   = config.mongodb.port ? ':' + config.mongodb.port : '';

module.exports.init = function (callback) {
    // establish connection only once
    if (!module.exports.client) {
        client.connect('mongodb://' + host + port + '/' + dbname, function (err, db) {
            module.exports.client = db;
            callback(err);
        });
    } else {
        callback();
    }
};
