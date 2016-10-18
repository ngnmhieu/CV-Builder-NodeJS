var Editor = (function($) {

    var that = {};

    var user, resume;

    // helper function to render templates
    var render = function(source, context) {
        var template = Handlebars.compile(source);
        return template(context);
    };

    var initUI = function() {

        // show-on-hover elements
        $(document).enableShowOnHover('.bulletlist .bulletlist-item');
        $(document).enableShowOnHover('.worklist .worklist-item');
        $(document).enableShowOnHover('.card', '.delete-section-form');

        // register partials for handlebars
        Handlebars.registerPartial('bulletlistItem', $('#bulletlist-item-template').html());
    };

    // reinitializes some UI elements upon DOM change
    var refreshUI = function() {

        // enable datepicker
        $('.datepicker').pickadate({
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 100, // Creates a dropdown of 15 years to control year
            max: true,
            formatSubmit: 'dd.mm.yyyy'
        });

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
                refreshUI();
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

        /**
         * @param {String} formSelector
         * @param {Function} dataExtractor will be passed the jQuery form object 
         *                   and should return data object
         * @param {Function} (optional) function to run when request succeeds
         * @param {Function} (optional) function to run when request fails
         * @return {jqXHR} done() and fail() can be chained (see jqXHR of jQuery)
         */
        var saveSection = function(formSelector, dataExtractor, done, fail) {

            var doneCallback = done || function(data) {
                console.log('ok');
            };

            var failCallback = fail || function(data) {
                console.log('fail');
                // TODO
            };

            $(document).on('submit', formSelector, function(e) {

                e.preventDefault();

                var data = dataExtractor($(this));

                return $.ajax({
                    type: 'PUT',
                    url: $(this).attr('action'),
                    data: JSON.stringify(data),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: done,
                    fail: fail
                });
            });

        };
        
        // save bulletlist
        saveSection('.bulletlist-edit-form', function(form) {
            var name = form.find('input[name=name]').val();
            var items = $.map(form.find('input[name=list-item]'), function(input) {
                return {
                    content: input.value,
                    order: -1
                }
            });

            return {
                name: name,
                items: items,
                order: 0,
                orderedItems: false
            };
        });

        // save textarea
        saveSection('.textarea-edit-form', function(form) {
            return {
                name: form.find('input[name=name]').val() || "",
                content: form.find('textarea[name=content]').val() || "",
                order: -1
            };
        });

        // save basicinfo
        saveSection('.basicinfo-edit-form', function(form) {
            return {
                name     : form.find('input[name=name]').val() || "",
                email    : form.find('input[name=email]').val() || "",
                website  : form.find('input[name=website]').val() || "",
                phone    : form.find('input[name=phone]').val() || "",
                fax      : form.find('input[name=fax]').val() || "",
                address1 : form.find('input[name=address1]').val() || "",
                address2 : form.find('input[name=address2]').val() || "",
                address3 : form.find('input[name=address3]').val() || "",
                // dob      : $(this).find('input[name=dob]').val() || "",
            };
        });

        // add item to list
        $(document).on('click', '.bulletlist-card .add-item-btn', function(e) {

            e.preventDefault();

            var container = $('#' + $(this).data('item-container-id'));
            var template = $('#' + $(this).data('item-template-id')).html();

            container.append(render(template, {
                content: ''
            }));
            refreshUI();
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

        // save bulletlist
        // $(document).on('submit', '.bulletlist-edit-form', function(e) {
        //
        //     e.preventDefault();
        //
        //     var name = $(this).find('input[name=name]').val();
        //     var items = $.map($(this).find('input[name=list-item]'), function(input) {
        //         return {
        //             content: input.value,
        //             order: -1
        //         }
        //     });
        //
        //     var data = {
        //         name: name,
        //         items: items,
        //         order: 0,
        //         orderedItems: false
        //     };
        //
        //     $.ajax({
        //         type: 'PUT',
        //         url: $(this).attr('action'),
        //         data: JSON.stringify(data),
        //         contentType: 'application/json; charset=utf-8',
        //         dataType: 'json',
        //     }).done(function(res) {
        //         // TODO
        //     }).fail(function(res) {
        //         console.log('fail');
        //         // TODO
        //     });
        // });

        // save textarea
        // $(document).on('submit', '.textarea-edit-form', function(e) {
        //
        //     e.preventDefault();
        //
        //     var data = {
        //         name: $(this).find('input[name=name]').val() || "",
        //         content: $(this).find('textarea[name=content]').val() || "",
        //         order: -1
        //     };
        //
        //     $.ajax({
        //         type: 'PUT',
        //         url: $(this).attr('action'),
        //         data: JSON.stringify(data),
        //         contentType: 'application/json; charset=utf-8',
        //         dataType: 'json',
        //     }).done(function(res) {
        //         console.log('ok');
        //         // TODO
        //     }).fail(function(res, status) {
        //         console.log('fail textarea');
        //         console.log(res);
        //         console.log(status);
        //         // TODO
        //     });
        // });

        // save basicinfo
        // $(document).on('submit', '.basicinfo-edit-form', function(e) {
        //
        //     e.preventDefault();
        //
        //     var data = {
        //         name     : $(this).find('input[name=name]').val() || "",
        //         email    : $(this).find('input[name=email]').val() || "",
        //         website  : $(this).find('input[name=website]').val() || "",
        //         phone    : $(this).find('input[name=phone]').val() || "",
        //         fax      : $(this).find('input[name=fax]').val() || "",
        //         // dob      : $(this).find('input[name=dob]').val() || "",
        //         address1 : $(this).find('input[name=address1]').val() || "",
        //         address2 : $(this).find('input[name=address2]').val() || "",
        //         address3 : $(this).find('input[name=address3]').val() || "",
        //     };
        //
        //     $.ajax({
        //         type: 'PUT',
        //         url: $(this).attr('action'),
        //         data: JSON.stringify(data),
        //         contentType: 'application/json; charset=utf-8',
        //         dataType: 'json',
        //     }).done(function(res) {
        //         // TODO
        //     }).fail(function(res, status) {
        //         console.log('fail textarea');
        //         console.log(res);
        //         console.log(status);
        //     });
        // });


    };

    // render the resume
    var displayResume = function() {

        var resumeId = $('#ResumeId').val();

        var userId = $('#UserId').val();

        var resumeEditor = $('#ResumeEditor');

        $.get("/users/" + userId).done(function(userData) {

            user = userData;

            $.get("/users/" + userId + "/resumes/" + resumeId).done(function(resumeData) {

                resume = resumeData;

                var renderSection = function(sec) {
                    var template = $('#' + sec.type + '-template').html();
                    var html = render(template, {
                        param: sec,
                        user: user,
                        resume: resume
                    });
                    resumeEditor.append(html);
                }; 

                // personal information
                renderSection(_.extend(resume.basicinfo, {type: 'basicinfo'}));

                // sections
                resume.sections.forEach(renderSection);

                refreshUI();
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
