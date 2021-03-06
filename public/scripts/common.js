var Common = (function($) {

    var self = {};

    /**
     * Show .show-on-hover elements when mouse is hovered 
     * on descendants of this element that can be reached by the given parentSelector.
     * @param parentSelector selector of the container element
     * @param (optional) selector of the element that will be toggled
     *
     * TODO: optimization - avoid using find()
     */
    $.fn.enableShowOnHover = function (parentSelector, selector) {

        var parent = $(this);

        parent.on('mouseover', parentSelector, function() {
            $(this).find(selector).show();
        });

        parent.on('mouseleave', parentSelector, function() {
            $(this).find(selector).hide();
        });
    };

    /**
     * jQuery.values: get or set all of the name/value pairs from child input controls   
     * @argument data {array} If included, will populate all child controls.
     * @returns element if data was provided, or array of values if not
     */
    $.fn.values = function(data) {
        var els = $(this).find(':input').get();

        if(typeof data != 'object') {
            // return all data
            data = {};

            $.each(els, function() {
                if (this.name && (/select|textarea/i.test(this.nodeName)
                    || /text|hidden|password/i.test(this.type))) {
                        data[this.name] = $(this).val();
                    } else if (/checkbox|radio/i.test(this.type)) {
                        data[this.name] = this.checked;
                    }
            });
            return data;
        } else {
            $.each(els, function() {
                if (this.name && typeof data[this.name] != 'undefined') {
                    if(this.type == 'checkbox' || this.type == 'radio') {
                        $(this).prop("checked", data[this.name]).change();
                    } else {
                        $(this).val(data[this.name]);
                    }
                }
            });
            return $(this);
        }
    };

    /**
     * Change the type of the this element
     */
    $.fn.changeElementType = function(newType) {
        var attrs = {};

        $.each(this[0].attributes, function(idx, attr) {
            attrs[attr.nodeName] = attr.nodeValue;
        });

        this.replaceWith(function() {
            return $("<" + newType + "/>", attrs).append($(this).contents());
        });
    };

    self.openModal = function(id) {
        $('#'+id).addClass('is-active');

        // disable scroll
        $('body').addClass('modal-opened');
        $('html').addClass('modal-opened');

        // TODO: click outside also close the modal
    };
    self.closeModal = function(id) {
        $('#'+id).removeClass('is-active');

        // enable scroll
        $('body').removeClass('modal-opened');
        $('html').removeClass('modal-opened');
    };

    $(document).on('click', '.open-modal', function(e) {
      e.preventDefault();
      var id = $(this).data('modal-id');
      self.openModal(id);
    });
    $(document).on('click', '.close-modal', function(e) {
      var id = $(this).data('modal-id');
      if (!id) {
        id = $(this).closest('.modal').attr('id');
      }
      self.closeModal(id);
    });

    self.init = function() {
    };

    return self;

})(jQuery);

jQuery(function() {
    Common.init();
});
