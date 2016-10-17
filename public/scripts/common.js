var Common = (function($) {

    /**
     * Show .show-on-hover elements when mouse is hovered 
     * on descendants of this element that can be reached by the given selector.
     */
    $.fn.enableShowOnHover = function (selector) {

        var parent = $(this);

        parent.on('mouseenter', selector, function() {
            $(this).find('.show-on-hover').show();
        });

        parent.on('mouseleave', selector, function() {
            $(this).find('.show-on-hover').hide();
        });
    };

    var that = {};

    that.init = function() {
    };

    return that;

})(jQuery);

jQuery(function() {
    Common.init();
});
