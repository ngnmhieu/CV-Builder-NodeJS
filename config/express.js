var config         = require('./config'),
    express        = require('express'),
    ejs            = require('ejs'),
    morgan         = require('morgan'),
    compress       = require('compression'),
    bodyParser     = require('body-parser'),
    session        = require('express-session'),
    methodOverride = require('method-override');

module.exports = function() {

    var app = express();

    var env = process.env.NODE_ENV;

    var https = false;

    var sessionSecret = 'session-secret';

    if (env === 'development') {
        app.use(morgan('dev'));
    }

    if (env === 'production') {
        app.use(compress());
        https = true;
        sessionSecret = process.env.CV_BUILDER_SESSION_SECRET;
    }

    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: https }
    }));

    app.use(bodyParser.json());

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(methodOverride());

    app.set('view engine', 'ejs');
    app.set('views', './app/views');

    app.use(express.static('./public'));

    require('../app/routes/routes.server.js')(app);

    return app;
};
