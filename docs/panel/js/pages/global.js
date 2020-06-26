/*
 * Copyright (C) 2016-2019 phantombot.tv
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

// Script that handles all of the global things.

$(function () {
    // Dark mode toggle.
    $('#dark-mode-toggle').on('click', function () {
        // Update the toggle.
        socket.updateDBValue('panel_dark_mode_toggle', 'panelData', 'isDark', $(this).is(':checked'), function () {
            window.location.reload();
        });
    });

    // the button that signs out.
    $('#sign-out-btn').on('click', function () {
        $.ajax(
                {
                    type: 'GET',
                    url: 'https://' + helpers.getBotHost() + '/panel/login/remote?logout=true',
                    xhrFields: {
                        withCredentials: true
                    },
                    crossDomain: true,
                    success: function () {
                        window.location = window.location.origin + window.location.pathname + 'login';
                    },
                    error: function (xhr, status, thrown) {
                        toastr.error('Logout request failed: [' + xhr.status + ']' + status + " > " + thrown, '', {timeOut: 0});
                    }
                }
        );
    });

    // Load the display name.
    $(function () {
        $('#main-name, #second-name').text(getDisplayName());
    });

    // Check if Discord is enabled.
    socket.getDBValue('get_discord_status_index', 'panelData', 'hasDiscord', function (e) {
        // Remove the tab if we are not using Discord.
        if (e.panelData !== 'true') {
            $('#discord_index_tab').remove();
            return;
        }
    });

    // Get bot updates.
    socket.getDBValue('get_bot_updates', 'settings', 'newrelease_info', function (e) {
        if (e.settings !== null) {
            e.settings = e.settings.split('|');

            helpers.handleNewBotUpdate(e.settings[0], e.settings[1]);
        }

        // Check for updates every 30 seconds.
        if (helpers.isDoUpdateLoop === undefined) {
            helpers.isDoUpdateLoop = true;

            // This timer is global and will never get killed.
            setInterval(function () {
                helpers.log('Running bot version check.', helpers.LOG_TYPE.INFO);

                socket.getDBValue('get_bot_updates', 'settings', 'newrelease_info', function (e) {
                    if (e.settings !== null) {
                        e.settings = e.settings.split('|');

                        helpers.handleNewBotUpdate(e.settings[0], e.settings[1]);
                    }
                });
            }, 3e4);
        }
    });

    $.fn.dinamicMenu = function(t) {
        $("ul.sidebar-menu a").filter(function() {
            return this.href !== t;
        }).parent().removeClass("active");
        $("ul.sidebar-menu a").filter(function() {
            return this.href === t;
        }).parent().addClass("active");
        $("ul.treeview-menu a").filter(function() {
            return this.href === t;
        }).parentsUntil(".sidebar-menu > .treeview-menu > li").addClass("active");
    };

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]',
        container: "body",
        trigger: "hover",
        delay: {
            show: 400,
            hide: 30
        }
    });

    toastr.options.progressBar = !0
    toastr.options.preventDuplicates = !1
    toastr.options.closeButton = !0
    toastr.options.newestOnTop = !0
});
