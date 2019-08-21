/* Workaround for Google TV (Android 4.2 (or Higher))
 * This shouldn't depend on jQuery. */
(function () {
    'use strict';

    var gtvDevices = ['NSX-..GT1', 'NSZ-GT1', 'NSZ-GS7', 'NSZ-GS8', 'NSZ-GU1'];
    function isGoogleTV42() {
        var ua = navigator.userAgent;
        for (var i = 0, len = gtvDevices.length; i < len; i++) {
            var template = new RegExp('; ' + gtvDevices[i] + ' ');
            if (template.test(ua) && !ua.match(/GoogleTV/)) {
                return true;
            }
        }
        return false;
    }
    
    // Expose a property for debugging
    window.ohpIsGoogleTV42 = isGoogleTV42();
    if (window.ohpIsGoogleTV42 && document.querySelector !== undefined) {
        var meta = document.querySelector('meta[name=viewport]');
        if (meta) {
            meta.setAttribute('content', 'width=1080');
        }
    }
})();


$(function() {
    var $body = $(document.body);
    $body.addClass('js');

    // const.
    var IS_RTL = $(document.documentElement).attr('dir') == 'rtl';
    var IS_FLAT_STRUCTURE = $body.hasClass('structure-flat');

    function isLRegion() {
        return $('.main > .box-content > .content').css('float') != 'none';
    }


    // Detect PC User-Agent to Display 'Print' Link
    (function() {
        var userAgent = window.navigator.userAgent || '';
        if (userAgent.indexOf("Mobile") == -1) {
            $body.addClass('pc');
        }
    })();


    // S and M Region Header Toggle
    (function() {
        var selector = '#header-search-button > a';
        var cssClassOpened = 'toggle-opened';
        var duration = '';

        $(selector).each(function() {
            var $a = $(this);
            var $panel = $a.parent().next();
            // ARIA
            $a.attr({
                'role': 'button',
                'aria-controls': $panel.attr('id'),
                'aria-expanded': 'false'
            });
        }).click(function() {
            var $a = $(this);
            var $panel = getPanel($a);
            if (!$panel.hasClass(cssClassOpened)) {
                open($a, duration);
            } else {
                close($a, duration);
            }
            return false;
        });

        function getPanel($a) {
            return $('#' + $a.attr('aria-controls'));
        }

        function open($a, duration) {
            var $panel = getPanel($a);
            // if the panel is animating, do nothing
            if ($panel.attr('aria-busy') === 'true') {
                return;
            }
            $panel.attr('aria-busy', 'true');
            $panel.slideDown(duration, function() {
                $a.attr('aria-expanded', 'true');
                $panel.addClass(cssClassOpened);

                // remove style attribute to hide the panel in the L Region
                // (adding cssClassOpen sets appropriate display property value)
                $panel.removeAttr('style');

                $panel.attr('aria-busy', 'false');
            });
        }

        function close($a, duration, callback) {
            var $panel = getPanel($a);
            // if the panel is animating, do nothing
            if ($panel.attr('aria-busy') === 'true') {
                return;
            }

            $panel.attr('aria-busy', 'true');
            $panel.slideUp(duration, function() {
                $a.attr('aria-expanded', 'false');
                $panel.removeClass(cssClassOpened);

                // remove style attribute to hide the panel in the L Region
                // (removing cssClassOpen sets appropriate display property value)
                $panel.removeAttr('style');

                $panel.attr('aria-busy', 'false');
            });
        }

        var menu = $('#header-menu-button > a');
        menu.click(function () { close($(selector), 0); });
    })();


    function resolvePath(path) {
        var knownDirectories = ['cover', 'contents', 'search'];
        var pathname = window.location.pathname;
        var comp = pathname.split('/');
        var directory = pathname.match(/\.html$/) ? comp[comp.length - 2] : comp[comp.length - 1];
        if ($.inArray(directory, knownDirectories) > -1) {
            return '../' + path;
        }
        return path;
    }


    // L Region Menu Toggle
    (function() {
        if (IS_FLAT_STRUCTURE) {
            return;
        }
        var selector = '#menu > ul > li > a';
        var cssClassClosed = 'toggle-closed';
        var openedSrc = resolvePath('common/img/arrow_open.png');
        var closedSrc = resolvePath(IS_RTL ? 'common/img/arrow_close_rtl.png' : 'common/img/arrow_close.png');
        var openedAlt = RESOURCES['menuToggleOpened'];
        var closedAlt = RESOURCES['menuToggleClosed'];

        $(selector).each(function(index) {
            var $a = $(this);
            var $ul = $a.next('ul');

            // Needs from CSS
            var $span = $('<span>');
            $span.append($a.contents());
            $span.appendTo($a);

            // ARIA
            var id = 'menu-submenu' + index;
            $ul.attr('id', id);
            $a.attr({ 'role': 'button', 'aria-controls': id });

            // Close inactive menu
            if ($ul.find('.active').length == 0) {
                $ul.addClass(cssClassClosed);
            }

            // Setup Icon
            $('<img>').appendTo($a);

            // Update Icon
            updateIcon($a, $ul);
        }).click(function(event) {
            if (!isLRegion()) {
                return false;
            }
            var $a = $(this);
            var $ul = $a.next('ul');

            // Close or Open
            $ul.toggleClass(cssClassClosed);

            // Update Icon
            updateIcon($a, $ul);
            return false;
        });

        function updateIcon($a, $ul) {
            var $img = $a.children('img');
            if ($ul.hasClass(cssClassClosed)) {
                $img.attr('src', closedSrc);
                $img.attr('alt', closedAlt);
                $a.attr('aria-expanded', 'false');
            } else {
                $img.attr('src', openedSrc);
                $img.attr('alt', openedAlt);
                $a.attr('aria-expanded', 'true');
            }
            return $img;
        }
    })();
});