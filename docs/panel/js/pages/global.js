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

/* global toastr */

// Script that handles all of the global things.

$(function () {
    helpers.getBotVersion();
    socket.addListener('notification', function (e) {
        let options = {};

        if (e.timeout !== undefined && e.timeout !== null && !isNaN(e.timeout) && e.timeout > 0) {
            options.timeOut = e.timeout;
        }

        if (e.extendedTimeout !== undefined && e.extendedTimeout !== null && !isNaN(e.extendedTimeout) && e.extendedTimeout > 0) {
            options.extendedTimeOut = e.extendedTimeout;
        }

        if ((options.timeOut !== undefined && options.timeOut === 0) || (options.extendedTimeOut !== undefined && options.extendedTimeOut === 0)) {
            options.closeButton = true;
        }

        if (e.progressBar !== undefined && e.progressBar !== null) {
            options.progressBar = e.progressBar;
        }

        switch (e.type.toLowerCase()) {
            case 'success':
                toastr.success(e.message, e.title, options);
                break;
            case 'warning':
                toastr.warning(e.message, e.title, options);
                break;
            case 'error':
                toastr.error(e.message, e.title, options);
                break
            default:
                toastr.info(e.message, e.title, options);
        }
    });

    // Dark mode toggle.
    $('#dark-mode-toggle').on('click', function () {
        // Update the toggle.
        socket.updateDBValue('panel_dark_mode_toggle', 'panelData', 'isDark', $(this).is(':checked'), function () {
            window.location.reload();
        });
    });

    // the button that restarts the bot, if configured
    $('#restart-bot-btn').on('click', function () {
        if (!$('#restart-bot-btn').hasClass('disabled')) {
            toastr.info('Restarting the bot...', 'Restart', {timeOut: 3000});
            socket.wsEvent('restart-bot', 'RestartRunner', '', [], function (e) {});
        }
    });

    $('#set-online-btn').on('click', function () {
        socket.sendCommand('set-online', getBotName() + ' forceonline', function (e) {});
    });

    $('#set-offline-btn').on('click', function () {
        socket.sendCommand('set-offline', getBotName() + ' forceoffline', function (e) {});
    });

    socket.addListener('restart-bot-result', function (e) {
        if (e.code === -3) {
            if (e.success) {
                $('#restart-bot-btn').removeClass('disabled');
                $('#restart-bot-btn').attr('title', '');
            } else {
                $('#restart-bot-btn').addClass('disabled');
                $('#restart-bot-btn').attr('title', 'Did not detect the \'restartcmd=\' setting, add it to botlogin.txt with the full path to a script that will restart the bot');
                $('#restart-bot-btn').tooltip();
            }
        } else if (e.success) {
            toastr.success('Restart successful', 'Restart', {timeOut: 3000});
        } else if (e.code === -2) {
            toastr.error('Restart failed with an exception. The exception can be found in the core-error logs', 'Restart', {timeOut: 3000});
        } else if (e.code === -1) {
            toastr.error('Restart failed. Unable to determine OS or OS unsupported', 'Restart', {timeOut: 3000});
        } else {
            toastr.error('Restart failed. The interpreter returned exit code ' + e.code, 'Restart', {timeOut: 3000});
        }
    });

    socket.wsEvent('restart-bot-check', 'RestartRunner', '', [], function (e) {});

    // the button that signs out.
    $('#sign-out-btn').on('click', function () {
        toastr.info('Signing out...', '', {timeOut: 0});
        socket.close();
        window.sessionStorage.removeItem("webauth");
        window.location = window.location.origin + window.location.pathname + 'login/#logoutSuccess=true';
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

    if (helpers.querymap.hasOwnProperty('folder') && helpers.querymap.hasOwnProperty('page')) {
        $.loadPage(helpers.querymap.folder, helpers.querymap.page, window.location + '#' + helpers.querymap.page);
    }
});
