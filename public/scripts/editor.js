var Editor = (function($) {

    var that = {};

    var user, resume;

    var initUI = function() {

        // enable datepicker
        $('.datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 100, // Creates a dropdown of 15 years to control year
            max: true,
            formatSubmit: 'dd.mm.yyyy'
        });

        // show-on-hover elements
        $(document).enableShowOnHover('.bulletlist .bulletlist-item');
        $(document).enableShowOnHover('.worklist .worklist-item');
    };

    var initEvents = function() {

        $("#BulletlistAddForm").on('submit', function(e) {
            e.preventDefault();
            $.post({
                url: '/users/' + userId + '/resumes/' + resumeId + '/bulletlists',
            }).done(function(data) {
                // reload resume with one way data binding
            }).fail(function() {
                // TODO
            });
        });

        $(document).on('submit', '.bulletlist-card .add-item-form', function(e) {

            e.preventDefault();

            var url = $(this).attr('action');
            var container = $('#' + $(this).data('item-container-id'));
            var templateSrc = $('#' + $(this).data('item-template-id'));

            $.post({
                url: url
            }).done(function(data) {
                var source = templateSrc.html();
                var template = Handlebars.compile(source);
                var html = template(data);
                container.append(html);
            }).fail(function() {
                // TODO
            });
        });

        /**
         * Elements with .form-submit can be used to submit the enclosing form
         */
        $(document).on('click', 'form .form-submit', function(e) {
            e.preventDefault();
            $(this).closest('form').submit();
        });

    };

    var displayResume = function() {

        var resumeId = $('#ResumeId').val();

        var userId = $('#UserId').val();

        $.get("/users/" + userId).done(function(userData) {

            user = userData;

            $.get("/users/" + userId + "/resumes/" + resumeId).done(function(resumeData) {

                resume = resumeData;

                resume.sections.forEach(function(sec) {
                    var source = $('#' + sec.type + '-template').html();
                    var template = Handlebars.compile(source);
                    var html = template({
                        sec: sec,
                        user: user,
                        resume: resume
                    });
                    $('#ResumeEditor').append(html);
                });
            });
        });
    };

    that.init = function() {

        initUI();

        initEvents();

        displayResume();
    };

    return that;

})(jQuery);

jQuery(function() {
    Editor.init();
});
