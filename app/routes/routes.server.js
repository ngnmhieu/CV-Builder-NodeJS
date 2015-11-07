
module.exports = function(app) {

    var resumes     = require('../controllers/resume.server.controller');
    var bulletlists = require('../controllers/bulletlist.server.controller');
    var worklists   = require('../controllers/worklist.server.controller');
    var textareas   = require('../controllers/textarea.server.controller');
    var basicinfo   = require('../controllers/basicinfo.server.controller');

    /**
     * Resume
     */
    app.route("/resumes")
        .post(resumes.create);

    app.route("/resumes/:resume_id")
        .get(resumes.read)
        .delete(resumes.remove);

    app.get("/resumes/:resume_id/sections", resumes.sections);

    app.param('resume_id', resumes.byId);

    /**
     * Basicinfo
     */
    app.route("/resumes/:resume_id/basicinfo")
        .get(basicinfo.read)
        .put(basicinfo.update);

    /**
     * Bulletlist
     */
    app.route("/resumes/:resume_id/bulletlists/")
        .post(bulletlists.create);

    app.route("/resumes/:resume_id/bulletlists/:bulletlist_id")
        .get(bulletlists.read)
        .put(bulletlists.update)
        .delete(bulletlists.remove);

    app.param('bulletlist_id', bulletlists.byId);

    /**
     * Worklist
     */
    app.route("/resumes/:resume_id/worklists/")
        .post(worklists.create);

    app.route("/resumes/:resume_id/worklists/:worklist_id")
        .get(worklists.read)
        .put(worklists.update)
        .delete(worklists.remove);

    app.param('worklist_id', worklists.byId);

    /**
     * Textarea
     */
    app.route("/resumes/:resume_id/textareas/")
        .post(textareas.create);

    app.route("/resumes/:resume_id/textareas/:textarea_id")
        .get(textareas.read)
        .put(textareas.update)
        .delete(textareas.remove);

    app.param('textarea_id', textareas.byId);
}
