/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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

// Function that querys all of the data we need.
$(function () {
    // Get logging settings.
    socket.getDBValues('get_logging_settings', {
        tables: ['settings', 'settings', 'settings', 'settings', 'settings',
            'settings', 'settings', 'settings', 'settings', 'settings', 'settings'],
        keys: ['log.file', 'log.event', 'log.error', 'log_rotate_days',
            'response_@chat', 'response_action', 'whisperMode', 'allowNonModWhispers',
            'customCommandAtEnabled', 'shoutoutapi', 'op_mode_mod_policy']
    }, true, function (e) {
        // Update log event toggle.
        $('#logging-events').val((helpers.isTrue(e['log.event']) ? 'Yes' : 'No'));
        // Update log error toggle.
        $('#logging-errors').val((helpers.isTrue(e['log.error']) ? 'Yes' : 'No'));
        // Update log chat toggle.
        $('#logging-chat').val((helpers.isTrue(e['log.file']) ? 'Yes' : 'No'));
        // Update log keep days.
        $('#log-days').val(e.log_rotate_days);
        // Set mute mode.
        $('#bot-mute-mode').val((helpers.isTrue(e['response_@chat']) ? 'No' : 'Yes'));
        // Set action mode.
        $('#bot-action-mode').val((helpers.isTrue(e['response_action']) ? 'Yes' : 'No'));
        // Set whisper mode.
        $('#bot-whisper-mode').val((helpers.isTrue(e['whisperMode']) ? 'Yes' : 'No'));
        // Allow non-mod whisper commands.
        $('#bot-allowNonModWhispers').val((helpers.isTrue(e['allowNonModWhispers']) ? 'Yes' : 'No'));
        // Set atEnabled.
        $('#bot-atenabled').val((helpers.isTrue(e['customCommandAtEnabled']) ? 'Yes' : 'No'));
        // Set shoutout mode.
        $('#bot-shoutout-api').val((helpers.isTrue(e['shoutoutapi']) ? 'Yes' : 'No'));
        // Set op mode mod policy mode.
        $('#op-mode-mod-policy').val(Number(e['op_mode_mod_policy']) || 3);
    });
});

// Function that handles events.
$(function () {
    // Save button
    $('#bot-logging-save').on('click', function () {
        let logEvents = $('#logging-events').find(':selected').text() === 'Yes',
                logErrors = $('#logging-errors').find(':selected').text() === 'Yes',
                logChat = $('#logging-chat').find(':selected').text() === 'Yes',
                muteMode = $('#bot-mute-mode').find(':selected').text() !== 'Yes',
                actionMode = $('#bot-action-mode').find(':selected').text() === 'Yes',
                whisperMode = $('#bot-whisper-mode').find(':selected').text() === 'Yes',
                allowNonModWhispers = $('#bot-allowNonModWhispers').find(':selected').text() === 'Yes',
                atEnabled = $('#bot-atenabled').find(':selected').text() === 'Yes',
                shoutoutMode = $('#bot-shoutout-api').find(':selected').text() === 'Yes',
                logDays = $('#log-days'),
                opModeModPolicy = Number($('#op-mode-mod-policy').val());

        switch (false) {
            case helpers.handleInputNumber(logDays):
                break;
            default:
                socket.updateDBValues('update_logging_settings', {
                    tables: ['settings', 'settings', 'settings', 'settings', 'settings',
                        'settings', 'settings', 'settings', 'settings', 'settings', 'settings'],
                    keys: ['log.file', 'log.event', 'log.error', 'log_rotate_days',
                        'response_@chat', 'response_action', 'whisperMode', 'allowNonModWhispers',
                        'customCommandAtEnabled', 'shoutoutapi', 'op_mode_mod_policy'],
                    values: [logChat, logEvents, logErrors, logDays.val(),
                        muteMode, actionMode, whisperMode, allowNonModWhispers,
                        atEnabled, shoutoutMode, opModeModPolicy]
                }, function () {
                    socket.sendCommand('update_logging_settings_cmd', 'reloadlogs', function () {
                        socket.sendCommand('update_misc_settings_cmd', 'reloadmisc', function () {
                            socket.wsEvent('update_shoutout_settings_ws', './core/coreCommands.js', null, [], function () {
                                toastr.success('Successfully updated log and output settings!');
                            });
                        });
                    });
                });
        }
    });
});
