var config         = require('./config'),
    express        = require('express'),
    morgan         = require('morgan'),
    compress       = require('compression'),
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override');

module.exports = function() {

    var app = express();

    if (process.env.NODE_ENV === 'development') {

      app.use(morgan('dev'));
      console.log("morgan module loaded.")

    } else if (process.env.NODE_ENV === 'production') {

      app.use(compress());
      console.log("compression module loaded");
    }

    app.use(bodyParser.json());
    console.log("body-parser(json) module loaded.");

    app.use(bodyParser.urlencoded({ extended: true }));
    console.log("body-parser(urlencoded) module loaded.");

    app.use(methodOverride());
    console.log("method-override module loaded.");

    app.set('views', './app/views');
    app.set('view engine', 'ejs');

    app.use(express.static('./public'));

    require('../app/routes/routes.server.js')(app);

    return app;
};
