var Editor = (function($) {

  var that = {};

  var user, resume, dobDatePicker;

  // helper function to render templates
  var render = function(source, context) {
    var template = Handlebars.compile(source);
    return template(context);
  };

  var initUI = function() {

    // show-on-hover elements
    $(document).enableShowOnHover('.bulletlist .bulletlist-item');
    $(document).enableShowOnHover('.worklist .worklist-item');
    $(document).enableShowOnHover('.card', '.section-edit-btn');
    $(document).enableShowOnHover('.card', '.display-mode .section-control');

    // register partials for handlebars
    Handlebars.registerPartial('sectionHeaderDisplay', $('#section-header-display-template').html());
    Handlebars.registerPartial('sectionHeaderEdit', $('#section-header-edit-template').html());
    Handlebars.registerPartial('resumeinfoDisplay', $('#resumeinfo-display-template').html());
    Handlebars.registerPartial('basicinfoDisplay', $('#basicinfo-display-template').html());
    Handlebars.registerPartial('basicinfoEdit', $('#basicinfo-edit-template').html());
    Handlebars.registerPartial('bulletlistDisplay', $('#bulletlist-display-template').html());
    Handlebars.registerPartial('bulletlistEdit', $('#bulletlist-edit-template').html());
    Handlebars.registerPartial('bulletlistOption', $('#bulletlist-option-template').html());
    Handlebars.registerPartial('bulletlistItem', $('#bulletlist-item-template').html());
    Handlebars.registerPartial('worklistDisplay', $('#worklist-display-template').html());
    Handlebars.registerPartial('worklistEdit', $('#worklist-edit-template').html());
    Handlebars.registerPartial('worklistItem', $('#worklist-item-template').html());

    Handlebars.registerPartial('textareaDisplay', $('#textarea-display-template').html());
    Handlebars.registerPartial('textareaEdit', $('#textarea-edit-template').html());

    // date helper
    Handlebars.registerHelper('isoDate', function(dateStr) {
      if (typeof dateStr == 'undefined' || dateStr == null || dateStr.length == 0)
        return '';
      var date = isNaN(Date.parse(dateStr)) ? new Date() : new Date(dateStr);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var dateNum = date.getDate();

      return year + '-' + (month < 10 ? '0' + month : month) + '-' + (dateNum < 10 ? '0' + dateNum : dateNum);
    });

    Handlebars.registerHelper('dateFormat', function(dateStr, format) {
      var format = typeof format != 'string' ? 'D MMM YYYY' : format;
      return moment(dateStr).format(format);
    });

    Handlebars.registerHelper('tern', function(cond, pos, neg) {
      return cond ? pos : neg;
    });

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    Handlebars.registerHelper('monthSelect', function(selectedDate, options, disabled) {
      var date = isNaN(Date.parse(selectedDate)) ? new Date() : new Date(selectedDate);
      var disabled = disabled ? 'disabled' : '';
      var html = '<select ' + options + ' ' + disabled + '>';
      var selectedMonth = date.getMonth();
      for (var i in MONTHS) {
        var selected = selectedMonth == i ? 'selected' : '';
        var month = parseInt(i) + 1;
        html += '<option value="' + month + '" ' + selected + '>' + MONTHS[i] + '</option>';
      }
      html += '</select>';
      return new Handlebars.SafeString(html);
    });

    Handlebars.registerHelper('yearSelect', function(selectedDate, options, disabled) {
      var date = isNaN(Date.parse(selectedDate)) ? new Date() : new Date(selectedDate);
      var disabled = disabled ? 'disabled' : '';
      var html = '<select ' + options + ' ' + disabled + '>';
      var selectedYear = date.getFullYear();

      for (var i = selectedYear - 50; i < selectedYear + 20; i++) {
        var selected = selectedYear == i ? 'selected' : '';
        html += '<option value="' + i + '" ' + selected + '>' + i + '</option>';
      }
      html += '</select>';

      return new Handlebars.SafeString(html);
    });

    Handlebars.registerHelper('placeholder', function(value, placeholder) {
      var out = value || placeholder;
      return new Handlebars.SafeString(out);
    });
  };

  // reinitializes some UI elements upon DOM change
  // TODO: do we need date picker any more? search for 'refreshUI' in this file
  var refreshUI = function() {

    var datepickerOpts = {
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 100, // Creates a dropdown of 15 years to control year
      formatSubmit: 'yyyy-mm-dd',
      format: 'dd mmm yyyy'
    };

    // enable datepicker
    $('.worklist .datepicker').pickadate(datepickerOpts);

    dobDatePicker = $('.basicinfo .datepicker').pickadate(_.extend(datepickerOpts, {
      max: true
    }));

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
        var newSec = $(render(template, {
          param: data,
          user: user,
          resume: resume,
        }));

        container.append(newSec);

        // trigger edit mode
        newSec.find('.section-edit-btn').click();

        // refreshUI();
      }).fail(function() {
        // TODO
        console.log('fail to add seciton');
      });
    });

    // delete section
    $(document).on('submit', '.section-delete-form', function(e) {

      e.preventDefault();

      // TODO: materialize confirm modal
      var confirm = window.confirm("Do you want to delete this section?");

      if (!confirm)
        return;

      var card = $(this).closest('.card');

      // hide card first
      card.hide();

      $.ajax({
        type: 'DELETE',
        url: $(this).attr('action')
      }).done(function(res) {
        card.remove();
      }).fail(function(res) {
        // TODO
        console.log('fail to delete section');

        // show card if it cannot be saved
        card.show();
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

      $(document).on('submit', formSelector, function(e) {

        e.preventDefault();

        var form = $(this);
        var card = form.closest('.card');
        var displayArea = card.find('.display-mode');
        var editArea = card.find('.edit-mode');

        editArea.find('.temporarily-removed').remove();

        var data = dataExtractor(form);

        return $.ajax({
          type: 'PUT',
          url: form.attr('action'),
          data: JSON.stringify(data),
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
        }).done(function(data) {

          if (typeof done == 'function') {
            return done(data, form, card, displayArea, editArea);
          }

          var template = $('#' + form.data('display-template-id')).html();
          displayArea.html(render(template, {
            param: data,
            user: user,
            resume: resume
          }));

          // remove class .temporary from temporary entries
          editArea.find('.temporary').removeClass('temporary');

          editArea.hide();
          displayArea.show();

        }).fail(fail || function(res, stastus) {

          console.log('fail to save');
          console.log(res);
          console.log(status);

        });
      });

    };

    // add item to list (temporarily)
    $(document).on('click', '.add-item-btn', function(e) {

      e.preventDefault();

      var container = $('#' + $(this).data('item-container-id'));
      var template = $('#' + $(this).data('item-template-id')).html();
      var itemCount = parseInt(container.data('item-count'));

      container.append(render(template, {
        itemIndex: itemCount,
        temporary: true // temporary items will be deleted when `Cancel` is clicked
      }));

      container.data('item-count', itemCount + 1)

      // refreshUI();
    });

    // delete item from list
    $(document).on('click', '.item-delete-btn', function(e) {
      e.preventDefault();
      $(this).closest('.item').addClass('temporarily-removed').hide();
    });


    // Elements with .form-submit can be used to submit the enclosing form
    $(document).on('click', 'form .form-submit', function(e) {
      e.preventDefault();
      $(this).closest('form').submit();
    });

    // Elements with .form-submit-btn can be used to submit 
    // a form with the corresponding id specified in data-form-id attribute
    $(document).on('click', '.form-submit-btn', function(e) {
      e.preventDefault();
      var formId = $(this).data('form-id');
      $('#' + formId).submit();
    });


    /** END generic code for section **/

    saveSection('.resumeinfo-edit-form', function(form) {
      var name = form.find('input[name=name]').val();
      return {
        name: name
      };
    }, function(data, form, card, displayArea, editArea) {

      var template = $('#' + form.data('display-template-id')).html();

      // save new resume
      resume = data;

      displayArea.html(render(template, {
        user: user,
        resume: resume
      }));

      // remove class .temporary from temporary entries
      editArea.find('.temporary').removeClass('temporary');

      editArea.hide();

      displayArea.show();
    });


    // save bulletlist
    saveSection('.bulletlist-edit-form', function(form) {
      var name = form.find('input[name=name]').val();
      var numbered = form.find('input[name=numbered]').is(':checked');
      var items = $.map(form.find('input.item-content'), function(input) {
        return {
          content: input.value,
          order: -1
        }
      });

      return {
        name: name,
        items: items,
        order: 0,
        numbered: numbered
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
        name: form.find('input[name=name]').val() || "",
        email: form.find('input[name=email]').val() || "",
        website: form.find('input[name=website]').val() || "",
        phone: form.find('input[name=phone]').val() || "",
        fax: form.find('input[name=fax]').val() || "",
        address1: form.find('input[name=address1]').val() || "",
        address2: form.find('input[name=address2]').val() || "",
        address3: form.find('input[name=address3]').val() || "",
        dob: form.find('input[name=dob_submit]').val() || "",
      };
    });

    var toISODate = function(month, year) {
      month = parseInt(month) < 10 ? '0' + month : month;
      return year + '-' + month + '-01';
    };

    // save worklist
    saveSection('.worklist-edit-form', function(form) {

      var name = form.find('input[name=name]').val();
      var items = $.map(form.find('.item'), function(el) {
        var item = $(el);
        var monthStart = item.find('select[name=monthStart]').val();
        var yearStart = item.find('select[name=yearStart]').val();
        var monthEnd = item.find('select[name=monthEnd]').val();
        var yearEnd = item.find('select[name=yearEnd]').val();

        return {
          title: item.find('input[name=title]').val(),
          institution: item.find('input[name=institution]').val(),
          startDate: toISODate(monthStart, yearStart),
          endDate: toISODate(monthEnd, yearEnd),
          tillNow: item.find('input.tillNow').is(':checked'),
          desc: item.find('textarea[name=desc]').val(),
          order: -1
        }
      });

      return {
        name: name,
        items: items,
        order: 0,
        numbered: false
      };
    });

    // toggle until now checkbox event
    $(document).on('change', 'input.tillNow', function(e) {
      var disableDate = $(this).is(':checked');
      $(this).closest('.worklist-item').find('.workitem-end-date select').prop('disabled', disableDate);
      // refreshUI();
    });

    // toggle numbered list / bulletlist
    $(document).on('change', 'input[name=numbered]', function(e) {

      var numbered = $(this).is(':checked');
      var list = $(this).closest('.bulletlist-card').find('.bulletlist');
      if (numbered)
        list.addClass('numbered');
      else
        list.removeClass('numbered');
    });

    // edit section
    $(document).on('click', '.section-edit-btn', function() {
      var card = $(this).closest('.card')
      var editArea = card.find('.edit-mode');
      var displayArea = card.find('.display-mode');

      var formData = editArea.values();

      // restore form data if cancel is clicked
      editArea.find('.cancel').off('click').on('click', function(e) {

        e.preventDefault();

        editArea.hide();

        // restore form data
        editArea.values(formData);

        // remove all temporary entries
        editArea.find('.temporary').remove();

        // restore all temporarily removed entries
        editArea.find('.temporarily-removed')
          .removeClass('temporarily-removed').show();

        // refreshUI();

        displayArea.show();
      });

      editArea.show();

      displayArea.hide();
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

        var renderSection = function(sec) {
          var template = $('#' + sec.type + '-template').html();
          var html = render(template, {
            param: sec,
            user: user,
            resume: resume
          });

          resumeEditor.append(html);
        };

        // resume information
        renderSection({
          type: 'resumeinfo'
        });

        // personal information
        renderSection(_.extend(resume.basicinfo, {
          type: 'basicinfo'
        }));

        // sections
        resume.sections.forEach(renderSection);

        // refreshUI();
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
