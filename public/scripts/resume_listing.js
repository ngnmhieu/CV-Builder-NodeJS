var ResumeListing = (function($) {

    var that = {};
    var resumeListing;

    var initUI = function() {
        resumeListing.enableShowOnHover('.collection .collection-item');
    };

    that.init = function() {
        resumeListing = $("#ResumesListing");
        initUI();
    };

    return that;

})(jQuery);

jQuery(function() {
    ResumeListing.init();
});
