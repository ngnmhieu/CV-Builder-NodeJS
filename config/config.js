var _      = require('lodash');
var debug  = require('debug')('cvbuilder.config');
var config = require('./env/' + process.env.NODE_ENV + '.js');

debug(`Environment: ${process.env.NODE_ENV}`)

// default app configurations
config.app = _.defaults(config.app, {
  root: process.cwd(),
  port: 3000
});

// default database configurations
config.mongodb = _.defaults(config.mongodb, {
  host: 'localhost',
  port: 27017,
  dbname: 'cvbuilder'
});

config.wkhtmltopdf = _.defaults(config.wkhtmltopdf, {
  binary: 'wkhtmltopdf'
});

module.exports = config;
