process.env.NODE_ENV = 'test';

var config = require('../config/config');

module.exports = {
    app_root: config.app.root
}
