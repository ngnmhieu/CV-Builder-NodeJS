process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express  = require('./config/express');

var db = require('./config/mongodb');

db.init(function (err) {
    
    var app = express();

    app.listen(3000);

    module.exports = app;

    console.log('[ MODE: ' + process.env.NODE_ENV + ' ] Server running at http://localhost:3000');

});
