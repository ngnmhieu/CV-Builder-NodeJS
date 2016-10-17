var Homepage = (function($) {

    var that = {};
    var registerForm, registerNotice, loginForm, loginNotice;

    var login = function(email, password) {

        $.post({
            url: '/session',
            data: {
                email: email,
                password: password
            }
        }).done(function(data) {
            window.location.href = "/";
        }).fail(function() {
            loginNotice.show();
        });
    };

    var register = function(email, password) {
        $.post({
            url: '/users',
            data: registerForm.serialize()
        }).done(function(data) {
            login(email, password);
        }).fail(function(data) {
            registerNotice.show();
        });
    };

    var initEvents = function() {

        /**
         * Registration
         */
        registerForm.on('submit', function(e) {

            e.preventDefault();

            var email = registerForm.find('input[name="email"]').val();
            var password = registerForm.find('input[name="password"]').val();

            register(email, password);
        });

        /**
         * Login
         */
        loginForm.on('submit', function(e) {

            e.preventDefault();

            var email = loginForm.find('input[name="email"]').val();
            var password = loginForm.find('input[name="password"]').val();

            login(email, password);
        });
    };

    var initUI = function() {
        $('.modal-trigger').leanModal();
    };

    that.init = function() {

        registerForm = $("#RegisterForm");
        registerNotice = $("#RegisterNotice");

        loginForm = $("#LoginForm");
        loginNotice = $("#LoginNotice");

        initEvents();

        initUI();
    };

    that.logout = function() {
        $.ajax({
            url: '/session',
            method: 'delete'
        }).done(function() {
            window.location.href = "/";
        });
    };

    return that;

})(jQuery);

jQuery(function() {
    Homepage.init();
});
