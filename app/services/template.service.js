const _          = require('lodash');
const path       = require('path');
const fs         = require('fs');
const Handlebars = require('handlebars');
const moment     = require('moment');
const debug      = require('debug')('cvbuilder.service.template');
const config     = require('../../config/config');

const TEMPLATE_DIR = path.join(config.app.root, 'resources', 'templates');
const TEMPLATES_CONFIG_PATH = path.join(config.app.root, 'config', 'templates.json');

function loadTemplates() {
  let data = fs.readFileSync(path.join(TEMPLATES_CONFIG_PATH));  
  try {
    let templates = JSON.parse(data);
    debug(`Successfully load JSON file ${TEMPLATES_CONFIG_PATH}`);
    return _.zipObject(_.map(templates,'id'), templates);
  } catch(e) {
    debug(`Cannot parse content of file ${TEMPLATES_CONFIG_PATH}: ${e}`);
    return {};
  }
}

const DEFAULT_TEMPLATE_ID = 'classic';

const templates = loadTemplates();

const TemplateService = class {

  constructor(resume) {
    this.resume = resume;
    this.template = templates[this.resume.template.id];
    this.registerHelpers();
  }

  /**
   * Render a page partial
   * @param {string} filename - filename of the partial template
   * @param {object} data     - the data needed to render the template
   *
   * @return {Promise} - a promise that resolve to html content
   */
  _renderPartial(filename, data) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(
        TEMPLATE_DIR, this.template.id, filename
      ), "utf-8", (err, source) => {
        if (err) {
          reject(err);
        } else {
          let template = Handlebars.compile(source);
          resolve(template(data));
        }
      });
    });
  }

  renderSection(section) {
    return this._renderPartial(`${section.type}.html`, {
      resume: this.resume,
      section: section
    });
  }

  renderHead() {
    let html = '';

    html += `<head>`;
    html += `  <meta charset="utf-8" />`;
    this.template.stylesheets.forEach((style) => {
      html += `  <link rel="stylesheet" href="{{localfile '${style}'}}" type="text/css" />`;
    });
    html += `  <title>{{resume.name}}</title>`;
    html += `</head>`;

    let template = Handlebars.compile(html);

    return Promise.resolve(template({
      resume: this.resume
    })); 
  };

  renderBasicinfo() {
    return this._renderPartial('basicinfo.html', {
      resume: this.resume,
      section: this.resume.basicinfo
    });
  };

  renderPageHeader() {
    return this._renderPartial('header.html', {
      resume: this.resume
    });
  }

  renderPageFooter() {
    return this._renderPartial('footer.html', {
      resume: this.resume
    });
  }

  renderHtml() {
    let self = this;
    return new Promise((resolve, reject) => {
      let html = '';
      let renderPromises = _.concat(
        [],
        Promise.resolve('<html>'),
        this.renderHead(), 
        Promise.resolve('<body>'),
        this.renderPageHeader(),
        this.renderBasicinfo(),
        this.resume.sections.sort(() => {
        }).map((section) => {
          return this.renderSection(section);
        }),
        this.renderPageFooter(),
        Promise.resolve('</body>'),
        Promise.resolve('</html>')
      );

      Promise.all(renderPromises).then((contents) => {
        resolve(contents.join(''));
      }, reject).catch((err) => {
        reject(err);
      });
    });
  }

  registerHelpers() {
    // get the absolute path for local file
    Handlebars.registerHelper('localfile', (filename) => {
      return 'file://' + path.join(TEMPLATE_DIR, this.template.id, filename);
    });
  }
}

/****************************
 * Common Handlebars Helpers
 ****************************/

// ternary expression
Handlebars.registerHelper('tern', function(cond, pos, neg) {
  return cond ? pos : neg;
});
// join a number of strings with delimiter
Handlebars.registerHelper('join', function(delim, ...args) {
  return args.slice(0, args.length-1)
  .filter((arg) => { return !!arg  })
  .join(delim);
});
// date pformating
Handlebars.registerHelper('dateFormat', function(dateStr, format) {
  var format = typeof format != 'string' ? 'D MMM YYYY' : format;
  return moment(dateStr).format(format);
});

/**
 * @param {Resume} resume - resume object
 * @return {Promise} a promise that resolve to html content
 */
let renderHtml = function(resume) {
  let templateService = new TemplateService(resume);
  return templateService.renderHtml();
};
/**
 * @param {string} id - template id
 * @return {Template}
 */
let findTemplate = function(id) {
  return templates[id];
};
/**
 * @return {Array[Template]}
 */
let getTemplates = function() {
  return templates;
};
/**
 * @return {Template}
 */
let getDefaultTemplate = function() {
  return templates[DEFAULT_TEMPLATE_ID];
};

module.exports = {
  renderHtml,
  getTemplates,
  findTemplate,
  getDefaultTemplate
}
