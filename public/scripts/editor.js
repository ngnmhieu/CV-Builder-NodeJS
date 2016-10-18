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
        Handlebars.registerPartial('worklistItem', $('#worklist-item-template').html());

        // date helper
        Handlebars.registerHelper('date', function(dateStr) {
            var date = isNaN(Date.parse(dateStr)) ? new Date() : new Date(dateStr);
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var dateNum = date.getDate();

            return year + '-' + (month < 10 ? '0' + month : month) + '-' + (dateNum < 10 ? '0' + dateNum : dateNum);
        });

        Handlebars.registerHelper('tern', function(cond, pos, neg) {
            return cond ? pos : neg;
        });

        var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        Handlebars.registerHelper('monthSelect', function(options, selectedDate) {
            var date = isNaN(Date.parse(selectedDate)) ? new Date() : new Date(selectedDate);
            var html = '<select ' + options + '>' ;
            var selectedMonth = date.getMonth();
            for (var i in MONTHS)  {
                var selected = selectedMonth == i ? 'selected' : '';
                var month = parseInt(i) + 1;
                html += '<option value="'+ month +'" ' + selected + '>' + MONTHS[i] + '</option>';
            }
            html += '</select>';
            return new Handlebars.SafeString(html);
        });

        Handlebars.registerHelper('yearSelect', function(options, selectedDate) {
            var date = isNaN(Date.parse(selectedDate)) ? new Date() : new Date(selectedDate);
            var html = '<select ' + options + '>' ;
            var selectedYear = date.getFullYear();
            for (var i = selectedYear - 50; i < selectedYear + 50; i++)  {
                var selected = selectedYear == i ? 'selected' : '';
                html += '<option value="'+ i +'" ' + selected + '>' + i + '</option>';
            }
            html += '</select>';
            return new Handlebars.SafeString(html);
        });

    };

    // reinitializes some UI elements upon DOM change
    var refreshUI = function() {

        var datepickerOpts = {
            selectMonths: true, // Creates a dropdown to control month
            selectYears: 100, // Creates a dropdown of 15 years to control year
            formatSubmit: 'yyyy-mm-dd',
            format: 'yyyy-mm-dd'
        };

        // enable datepicker
        $('.worklist .datepicker').pickadate(datepickerOpts);

        $('.basicinfo .datepicker').pickadate(_.extend(datepickerOpts, {max: true}));

        $('select').material_select();

        Materialize.updateTextFields();
    };

    var initEvents = function() {

        /** generic code for section **/

        // add section
        $('.add-sec-form').on('submit', function(e) {

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
        
        // add item to list (temporarily)
        $(document).on('click', '.add-item-btn', function(e) {

            e.preventDefault();

            var container = $('#' + $(this).data('item-container-id'));
            var template = $('#' + $(this).data('item-template-id')).html();

            container.append(render(template, {}));

            refreshUI();
        });

        // delete item from list
        $(document).on('click', '.delete-item-btn', function(e) {
            e.preventDefault();
            $(this).closest('.item').remove();
        });


        // Elements with .form-submit can be used to submit the enclosing form
        $(document).on('click', 'form .form-submit', function(e) {
            e.preventDefault();
            $(this).closest('form').submit();
        });

        /** END generic code for section **/

        
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
                dob      : form.find('input[name=dob]').val() || "",
            };
        });

        var formatDate = function(month, year) {
            month = parseInt(month) < 10 ? '0' + month : month;
            return year + '-' + month + '-01';
        };

        // save worklist
        saveSection('.worklist-edit-form', function(form) {

            var name = form.find('input[name=name]').val();
            var items = $.map(form.find('.item'), function(el) {
                var item = $(el);
                var monthStart = item.find('select[name=monthStart]').val();
                var yearStart  = item.find('select[name=yearStart]').val();
                var monthEnd = item.find('select[name=monthEnd]').val();
                var yearEnd  = item.find('select[name=yearEnd]').val();

                return {
                    title       : item.find('input[name=title]').val(),
                    institution : item.find('input[name=institution]').val(),
                    startDate   : formatDate(monthStart, yearStart),
                    endDate     : formatDate(monthEnd, yearEnd),
                    tillNow     : item.find('input[name=tillNow]').is(':checked'),
                    desc        : item.find('textarea[name=desc]').val(),
                    order       : -1
                }
            });

            console.log({
                name: name,
                items: items,
                order: 0,
                orderedItems: false
            });

            return {
                name: name,
                items: items,
                order: 0,
                orderedItems: false
            };
        });

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

                    console.log(resume);
                var renderSection = function(sec) {
                    var template = $('#' + sec.type + '-template').html();
                    console.log(sec);
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
