const path       = require('path');
const fs         = require('fs');
const Handlebars = require('handlebars');
const moment     = require('moment');
const debug      = require('debug')('cvbuilder.service.template');
const config     = require('../../config/config');

const TEMPLATE_DIR = path.join(config.app.root, 'resources', 'templates');

// TODO: temporary - for testing purcose
const TEMPLATE_NAME = 'classic';

/**
 * Render a page partial
 * @param {string} filename - filename of the partial template
 * @param {object} data     - the data needed to render the template
 *
 * @return {Promise} - a promise that resolve to html content
 */
function renderPartial(filename, data) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(
      TEMPLATE_DIR, TEMPLATE_NAME, filename
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

function renderSection(resume, section) {
  return renderPartial(`${section.type}.html`, {
    resume: resume,
    section: section
  });
}

function renderHead(resume) {
  return renderPartial('html-head.html', {
    resume: resume
  });
};

function renderBasicinfo(resume) {
  return renderPartial('basicinfo.html', {
    resume: resume,
    section: resume.basicinfo
  });
};

function renderPageHeader(resume) {
  return renderPartial('page-header.html', {
    resume: resume
  });
}

function renderPageFooter(resume) {
  return renderPartial('page-footer.html', {
    resume: resume
  });
}

/**
 * @param {Resume} resume - resume object
 * @return {Promise} a promise that resolve to html content
 */
function renderHtml(resume) {
  return new Promise((resolve, reject) => {
    let html = '';
    let renderPromises = _.concat(
      [],
      Promise.resolve('<html>'),
      renderHead(resume), 
      Promise.resolve('<body>'),
      renderPageHeader(resume),
      renderBasicinfo(resume),
      resume.sections.sort(() => {
      }).map((section) => {
        return renderSection(resume, section);
      }),
      renderPageFooter(resume),
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

/*********************
 * Handlebars Helpers
 *********************/

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
// get the absolute path for local file
Handlebars.registerHelper('localfile', function(filename) {
  return 'file://' + path.join(TEMPLATE_DIR, TEMPLATE_NAME, filename);
});

// date formating
Handlebars.registerHelper('dateFormat', function(dateStr, format) {
  var format = typeof format != 'string' ? 'D MMM YYYY' : format;
  return moment(dateStr).format(format);
});

module.exports = {
  renderHtml
}
