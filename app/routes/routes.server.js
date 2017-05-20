module.exports = function(app) {

    let user = require('../controllers/user.server.controller');
    let resumes = require('../controllers/resume.server.controller');
    let bulletlists = require('../controllers/bulletlist.server.controller');
    let worklists = require('../controllers/worklist.server.controller');
    let textareas = require('../controllers/textarea.server.controller');
    let basicinfo = require('../controllers/basicinfo.server.controller');
    let page = require('../controllers/page.server.controller');
    let templateController = require('../controllers/template.server.controller');

    app.use(user.setLoggedInUser);

    app.get('/', page.index);

    /******************
     * User
     ******************/
    app.route("/users")
        .post(user.register);

    app.route("/users/:user_id")
        .get(user.show);

    app.param('user_id', user.byId);

    app.route("/session")
        .post(user.login)
        .delete(user.logout);

    /******************
     * Resume
     ******************/
    app.route("/users/:user_id/resumes")
        .post(resumes.create);

    app.route("/users/:user_id/resumes/:resume_id")
        .get(resumes.read)
        .put(resumes.update)
        .delete(resumes.remove);

    app.get("/users/:user_id/resumes/:resume_id/sections", resumes.sections);

    app.param('resume_id', resumes.byId);

    app.get("/templates", templateController.all);

    /***************
     * Web pages
     ***************/
    app.route('/resumes')
        .all(user.authenticate)
        .get(page.resumes);

    app.route('/resumes/:resume_id')
        .all(user.authenticate)
        .get(page.editResume);

    app.route('/resumes/:resume_id/pdf')
        .all(user.authenticate)
        .get(resumes.renderPdf);
    app.route('/resumes/:resume_id/html')
        .all(user.authenticate)
        .get(resumes.renderHtml);

    /**
     * Basicinfo
     */
    app.route("/users/:user_id/resumes/:resume_id/basicinfo")
        .get(basicinfo.read)
        .put(basicinfo.update);

    /**
     * Bulletlist
     */
    app.route("/users/:user_id/resumes/:resume_id/bulletlists/")
        .post(bulletlists.create);

    app.route("/users/:user_id/resumes/:resume_id/bulletlists/:bulletlist_id")
        .get(bulletlists.read)
        .put(bulletlists.update)
        .delete(bulletlists.remove);

    app.param('bulletlist_id', bulletlists.byId);

    /**
     * Worklist
     */
    app.route("/users/:user_id/resumes/:resume_id/worklists/")
        .post(worklists.create);

    app.route("/users/:user_id/resumes/:resume_id/worklists/:worklist_id")
        .get(worklists.read)
        .put(worklists.update)
        .delete(worklists.remove);

    app.param('worklist_id', worklists.byId);

    /**
     * Textarea
     */
    app.route("/users/:user_id/resumes/:resume_id/textareas/")
        .post(textareas.create);

    app.route("/users/:user_id/resumes/:resume_id/textareas/:textarea_id")
        .get(textareas.read)
        .put(textareas.update)
        .delete(textareas.remove);

    app.param('textarea_id', textareas.byId);
}
