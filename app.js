var express  = require('./config/express');

var db = require('./config/mongodb');

var config = require('./config/config');

/**
 * Express object
 */
var app;

/**
 * Initializes application 
 */
exports.init = function (callback) {
    
    db.init(function (err) {

        if (err) throw err;

        var app = express();

        exports.httpServer = app.listen(config.app.port);

        exports.express = app;

        console.log('[ MODE: ' + process.env.NODE_ENV + ' ] Server running at http://localhost:'+ config.app.port);

        if (typeof callback === 'function')
            callback();
    });
};

