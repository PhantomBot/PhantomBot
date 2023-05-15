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
                break;
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

    $('#sync-online-btn').on('click', function () {
        socket.sendCommand('sync-online', 'synconline silent', function (e) {
            toastr.info('Syncing title, game, and online state with Twitch API. This may take a moment', 'Sync Online Status', {timeOut: 10000});
        });
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
        helpers.signOut();
    });

    const passwordChangeForm = $('<form/>', {
        'role': 'form'
    })
    .append(helpers.getInputGroup('user-old-pwd', 'password', 'Current password', '', '', 'Your current password'))
    .append(helpers.getInputGroup('user-new-pwd', 'password', 'New password', '', '', 'Your new password'))
    .append(helpers.getInputGroup('user-new-pwd-2', 'password', 'Repeat new password', '', '', 'Your new password'));

    const passwordChangeCallback = function () {
        let currentPassword = $('#user-old-pwd'),
                newPassword = $('#user-new-pwd'),
                newPassword2 = $('#user-new-pwd-2');

        switch (false) {
            case helpers.handleInputString(currentPassword):
            case helpers.handleInputString(newPassword):
            case helpers.handleInputString(newPassword2):
                break;
            default:
                if (currentPassword.val() === newPassword.val()) {
                    toastr.error('New password is identical to your current password!');
                    break;
                }
                if (newPassword.val() !== newPassword2.val()) {
                    toastr.error('New passwords do not match!');
                    break;
                }

                socket.changePanelUserPWD('change_panel_user_pwd', helpers.currentPanelUserData.username, currentPassword.val(), newPassword.val(), function (res) {
                    if (res.error !== undefined) {
                        toastr.error(res.error);
                        return;
                    }

                    $('#pwdChange-panelUser').modal('hide');
                    toastr.success(res.success);
                    helpers.getConfirmDeleteModal('sign-out-user-modal', 'Sign out required', false, '',
                        function () {
                            helpers.signOut();
                        },
                        {
                            deleteText: 'Sign out',
                            blockClosing: true
                        });
                });
        }
    };

    // the change password button.
    $('#user-pwd-btn').on('click', function () {
        helpers.getModal('pwdChange-panelUser', 'Change password', 'Save', passwordChangeForm, passwordChangeCallback).modal('toggle');
    });
    // Load the display name.
    $(function () {
        if (helpers.currentPanelUserData.userType === 'CONFIG') {
            $('#user-pwd-btn').remove();//Paneluser is defined in the config
        } else { //Remove settings global settings
            $('#panelUser-tab').remove();
            $('#second-side-tab').remove();
            $('#second-side-tab-button').remove();
            $('#third-side-tab').remove();
            $('#third-side-tab-button').remove();
        }

        if (helpers.currentPanelUserData.permission === 'Read only') {
            $('#restart-from-group').remove();
        }

        $('#main-name').text(getChannelName() + ' | ' + helpers.currentPanelUserData.username);
        $('#second-name').text(helpers.currentPanelUserData.username);

        if (!helpers.currentPanelUserData.hasSetPassword) { //Force password change upon first login
            helpers.getModal('pwdChange-panelUser', 'Password change required', 'Save', passwordChangeForm, passwordChangeCallback, {blockClosing: true, removecancel: true})
                    .modal({
                        keyboard: false,
                        backdrop: 'static'
                    });
        }
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
