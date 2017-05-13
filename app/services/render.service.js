const fs              = require('fs');
const _               = require('lodash');
const Readable        = require('stream').Readable;
const path            = require('path');
const wkhtmltopdf     = require('wkhtmltopdf');
const debug           = require('debug')('cvbuilder.service.render');
const config          = require('../../config/config');
const templateService = require('./template.service');

// directory where pdf files are stored
const OUTPUT_DIR = path.join(config.app.root, 'files');

// set the binary path
wkhtmltopdf.command = config.wkhtmltopdf.binary;

// other options for wkhtmltopdf
const WKHTMLTOPDF_OPTIONS = {
    'margin-top': '15mm',
    'margin-bottom': '15mm',
    'margin-left': 0,
    'margin-right': 0,
    'page-height': '297mm',
    'page-width': '212mm'
};

/**
 * @param {Resume} resume - resume object
 * @return {Stream} null if no saved file found
 */
function getSavedPdf(resume) {
    let outputPath = getPdfOutputPath(resume);
    return fs.existsSync(outputPath) ? fs.createReadStream(outputPath) : null;
}

/**
 * @return {string} absolute path to the output pdf file
 */
function getPdfOutputPath(resume) {
    return path.join(OUTPUT_DIR, resume._id + '.pdf');
}

/**
 * @param {string} html       - html string
 * @param {function} callback - the pdf stream will be passed to the
 *                              callback
 */
function renderPdf(resume, callback) {
    let output = getSavedPdf(resume);

    // TODO: temporary
    resume.isDirty = true;

    // resume hasn't been changed and pdf is already rendered
    // just return the rendered pdf file
    if (!resume.isDirty && output != null) {
        return callback(output);
    }

    // render the template
    templateService.renderHtml(resume).then((html) => {
        let options = _.extend(WKHTMLTOPDF_OPTIONS, {
            // 'header-spacing': 20
            //
        });
        output = wkhtmltopdf(html, options);
        // write output to file
        let outFile = getPdfOutputPath(resume);
        try { 
            output.pipe(fs.createWriteStream(outFile));
        } catch(err) {
            debug('Cannot save pdf file: %o', err); 
        }
        // return the output stream
        callback(output);
    });
}

/**
 * @param {Resume} resume - resume object
 * @return {Stream} null if no saved file found
 */
function getSavedHtml(resume) {
    let outputPath = getHtmlOutputPath(resume);
    return fs.existsSync(outputPath) ? fs.createReadStream(outputPath) : null;
}

function getHtmlOutputPath(resume) {
    return path.join(OUTPUT_DIR, resume._id + '.html');
}

function renderHtml(resume, callback) {
    let output = getSavedHtml(resume);

    // TODO: temporary
    resume.isDirty = true;

    // resume hasn't been changed and pdf is already rendered
    // just return the rendered pdf file
    if (!resume.isDirty && output != null) {
        return callback(output);
    }

    // render the template
    templateService.renderHtml(resume).then((html) => {
        // write output to file
        let outFile = getHtmlOutputPath(resume);
        try { 
            output = createStringStream(html);
            output.pipe(fs.createWriteStream(outFile));
        } catch(err) {
            debug('Cannot save html file: %o', err); 
        }
        // return the output stream
        callback(output);
    });
}

/**
 * @return {Stream} - a string stream
 */
function createStringStream(str) {
    var s = new Readable;
    s.push(str);
    s.push(null);
    return s;
}

module.exports = {
    renderPdf,
    renderHtml
};
