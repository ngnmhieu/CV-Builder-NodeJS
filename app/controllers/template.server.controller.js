const config     = require('../../config/config');
const templateService = require('../services/template.service');

/**
 * GET /templates
 */
exports.all = function(req, res) {
  res.json(templateService.getTemplates());
};
