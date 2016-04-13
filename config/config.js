var config = require('./env/' + process.env.NODE_ENV + '.js');

/**
 * Default configurations
 */
config.app = config.app || {};
config.app.root = config.app.root || process.cwd(); // default app root to current working directory of this process
config.app.port = config.app.port || 3000; // default to port 3000

// default database configurations
config.mongodb = config.mongodb || {};
config.mongodb.host = config.mongodb.host || 'localhost';
config.mongodb.port = config.mongodb.port || 27017;
config.mongodb.dbname = config.mongodb.dbname || 'cvbuilder';

module.exports = config;
