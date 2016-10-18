var Editor = (function($) {

    var that = {};

    var user, resume;
    
    // helper function to render templates
    var render = function(source, context) {
        var template = Handlebars.compile(source);
        return template(context);
    };

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
        $(document).enableShowOnHover('.card', '.delete-section-form');

        // register partials for handlebars
        Handlebars.registerPartial('bulletlistItem', $('#bulletlist-item-template').html());
    };

    // reinitializes some UI elements upon DOM change
    var refreshUI = function() {
        Materialize.updateTextFields();
    };

    var initEvents = function() {

        // add section
        $('.add-item-form').on('submit', function(e) {

            e.preventDefault();

            var container = $('#' + $(this).data('item-container-id'));
            var template = $('#' + $(this).data('item-template-id')).html();

            $.post({
                url: $(this).attr('action')
            }).done(function(data) {
                container.append(render(template, {
                    param: data,
                    user: user,
                    resume: resume,
                }));
            }).fail(function() {
                // TODO
            });
        });

        // delete section
        $(document).on('submit', '.delete-section-form', function(e) {

            e.preventDefault();

            var card = $(this).closest('.card'); 

            $.ajax({
                type: 'DELETE',
                url: $(this).attr('action')
            }).done(function(res) {
                card.remove();
            }).fail(function(res) {
                console.log('fail');
                // TODO
            });
        });

        // save bulletlist
        $(document).on('submit', '.bulletlist-edit-form', function(e) {

            e.preventDefault();

            var name = $(this).find('input[name=name]').val();
            var content = $(this).find('input[name=content]').val();
            var items = $.map($(this).find('input[name=list-item]'), function(input) {
                return {
                    content: input.value,
                    order: -1
                }
            });

            var data = {
                name: name,
                items: items,
                order: 0,
                orderedItems: false
            };
            
            $.ajax({
                type: 'PUT',
                url: $(this).attr('action'),
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
            }).done(function(res) {
                // TODO
            }).fail(function(res) {
                console.log('fail');
                // TODO
            });
        });

        // add item to list
        $(document).on('click', '.bulletlist-card .add-item-btn', function(e) {

            e.preventDefault();

            var container = $('#' + $(this).data('item-container-id'));
            var template = $('#' + $(this).data('item-template-id')).html();

            container.append(render(template, {
                content: ''
            }));
        });

        // delete item from list
        $(document).on('click', '.bulletlist-card .delete-item-btn', function(e) {
            e.preventDefault();
            $(this).closest('.item').remove();
        });

        // Elements with .form-submit can be used to submit the enclosing form
        $(document).on('click', 'form .form-submit', function(e) {
            e.preventDefault();
            $(this).closest('form').submit();
        });

    };

    // render the resume
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
                        param: sec,
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


        // TODO
        var domObserver = new MutationObserver(function(mutations) {
            console.log('new');
            refreshUI();
        });

        domObserver.observe(document, {childList: true});
    };

    return that;

})(jQuery);

jQuery(function() {
    Editor.init();
});
