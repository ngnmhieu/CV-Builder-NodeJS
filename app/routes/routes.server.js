
module.exports = function(app) {

    var resumes     = require('../controllers/resumes.server.controller');
    var bulletlists = require('../controllers/bulletlists.server.controller');

    /**
     * Resume
     */
    app.route("/resumes")
        .post(resumes.create);

    app.route("/resumes/:resume_id")
        .get(resumes.read)
        .delete(resumes.remove);

    app.get("/resumes/:resume_id/sections", resumes.sections);


    /**
     * Bulletlist
     */
    app.route("/resumes/:resume_id/bulletlists/")
        .post(bulletlists.create);

    app.route("/resumes/:resume_id/bulletlists/:bulletlist_id")
        .get(bulletlists.read)
        .put(bulletlists.update)
        .delete(bulletlists.remove);

    app.param('resume_id', resumes.byId);
    app.param('bulletlist_id', bulletlists.byId);
}
