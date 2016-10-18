var Common = (function($) {

    /**
     * Show .show-on-hover elements when mouse is hovered 
     * on descendants of this element that can be reached by the given parentSelector.
     * @param parentSelector selector of the container element
     * @param (optional) selector of the element that will be toggled
     */
    $.fn.enableShowOnHover = function (parentSelector, selector) {

        var parent = $(this);

        selector = selector || '.show-on-hover';

        parent.on('mouseenter', parentSelector, function() {
            $(this).find(selector).show();
        });

        parent.on('mouseleave', parentSelector, function() {
            $(this).find(selector).hide();
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
