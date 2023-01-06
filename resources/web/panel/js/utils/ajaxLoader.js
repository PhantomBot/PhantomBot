/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Pace */

$(function () {
    let currentPageInfo = {
        folder: '',
        page: '',
        href: ''
    };
    /*
     * @function removes the page loader.
     */
    function showPage() {
        helpers.log('Showing dashboard page', helpers.LOG_TYPE.DEBUG);
        if ($('.loader').length > 0) {
            // Stop pace since we already have one loader.
            Pace.stop();
            $('.loader').fadeOut(3e2, function () {
                $('.loader').remove();
            });

            $('.main').fadeIn(2e2, function () {
                // Fix the window height.
                $.fn.layout.Constuctor.prototype.fix();
            });

            // Add the load for the master script.
            $('body').append($('<script>', {
                'async': true,
                'src': 'js/pages/global.js'
            }));
            helpers.log('Page shown', helpers.LOG_TYPE.DEBUG);
        }
    }

    /*
     * @function handles the loading of pages.
     *
     * @param {String} folder
     * @param {String} page
     */
    function loadPage(folder, page, href) {
        // Make sure the href isn't blank, then load the page.
        if (page !== '') {
            helpers.log('Starting ajax request for page: ' + folder + '/' + page, helpers.LOG_TYPE.DEBUG);
            // Start pace loading.
            if (href === undefined) {
                Pace.stop();
            } else {
                Pace.restart();
            }

            // Clear all timers. This doesn't clear any global timers (intervals).
            helpers.clearTimers();
            // Remove all temp global functions.
            helpers.temp = {};

            // Load the page.
            $.ajax({
                cache: false,
                dataType: 'html',
                url: 'pages/' + folder + '/' + page,
                success: function (data) {
                    // Set the new page.
                    $('#page-content').html(data);
                    // Scroll to top.
                    $(window).scrollTop(0);
                    if (href !== undefined) {
                        // Set the current tab as active.
                        $.fn.dinamicMenu(href);
                    }
                    helpers.log('Completed ajax request for page: ' + folder + '/' + page, helpers.LOG_TYPE.DEBUG);
                    currentPageInfo = {
                        folder: folder,
                        page: page,
                        href: href === undefined ? '' : href
                    };
                },
                error: function (err) {
                    helpers.logError('Failed to load page (' + page + ') => ' + err.statusText, helpers.LOG_TYPE.FORCE);
                }
            });
        }
    }

    function currentPage() {
        return currentPageInfo;
    }

    // Handles loading of tabs.
    $('[data-folder]').on('click', function (e) {
        e.preventDefault();
        // Load the page.
        loadPage($(this).data('folder'), $(this).attr('href').substring(1), this.href);
    });

    // Export to API.
    $.showPage = showPage;
    $.loadPage = loadPage;
    $.currentPage = currentPage;
});
