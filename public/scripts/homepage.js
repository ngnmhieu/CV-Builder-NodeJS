(function ($) {
    $.fn.serializeFormJSON = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);

var Homepage = (function ($) {

    var that = {};

    that.login = function (email, password) {

        var loginNotice = $("#loginNotice");

        $.post({
            url: '/session',
            data: { email: email, password: password }
        }).done(function (data) {
            window.location.href = "/";
        }).fail(function () {
            loginNotice.show();
        });
    };

    that.init = function () {

        var registerForm = $("#registerForm");
        var registerNotice = $("#registerNotice");

        var loginForm = $("#loginForm");
        var loginNotice = $("#loginNotice");

        registerForm.on('submit', function (e) {

            e.preventDefault();

            $.post({
                url: '/users',
                data: registerForm.serialize()
            }).done(function(data) {

                var email = registerForm.find('input[name="email"]').val();
                var password = registerForm.find('input[name="password"]').val();

                that.login(email, password);

            }).fail(function(data) {
                registerNotice.show();
            });

        });

        loginForm.on('submit', function(e) {
            e.preventDefault();

            var email = loginForm.find('input[name="email"]').val();
            var password = loginForm.find('input[name="password"]').val();

            that.login(email, password);
        });
    };

    that.logout = function () {
        $.ajax({
            url: '/session',
            method: 'delete'
        }).done(function () {
            window.location.href = "/";
        });
    };

    return that;

})(jQuery);

jQuery(function(){
    Homepage.init();
});
