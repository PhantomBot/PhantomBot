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

// Function that querys all of the data we need.
$(function () {
    // Get logging settings.
    socket.getDBValues('get_logging_settings', {
        tables: ['settings', 'settings', 'settings', 'settings', 'settings',
            'settings', 'settings', 'settings'],
        keys: ['log.file', 'log.event', 'log.error', 'log_rotate_days',
            'response_@chat', 'response_action', 'whisperMode', 'shoutoutapi']
    }, true, function (e) {
        // Update log event toggle.
        $('#logging-events').val((e['log.event'] === 'true' ? 'Yes' : 'No'));
        // Update log error toggle.
        $('#logging-errors').val((e['log.error'] === 'true' ? 'Yes' : 'No'));
        // Update log chat toggle.
        $('#logging-chat').val((e['log.file'] === 'true' ? 'Yes' : 'No'));
        // Update log keep days.
        $('#log-days').val(e.log_rotate_days);
        // Set mute mode.
        $('#bot-mute-mode').val((e['response_@chat'] === 'true' ? 'No' : 'Yes'));
        // Set action mode.
        $('#bot-action-mode').val((e['response_action'] === 'true' ? 'Yes' : 'No'));
        // Set whisper mode.
        $('#bot-whisper-mode').val((e['whisperMode'] === 'true' ? 'Yes' : 'No'));
        // Set shoutout mode.
        $('#bot-shoutout-api').val((e['shoutoutapi'] === 'true' ? 'Yes' : 'No'));
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
                shoutoutMode = $('#bot-shoutout-api').find(':selected').text() === 'Yes',
                logDays = $('#log-days');

        switch (false) {
            case helpers.handleInputNumber(logDays):
                break;
            default:
                socket.updateDBValues('update_logging_settings', {
                    tables: ['settings', 'settings', 'settings', 'settings', 'settings',
                        'settings', 'settings', 'settings'],
                    keys: ['log.file', 'log.event', 'log.error', 'log_rotate_days',
                        'response_@chat', 'response_action', 'whisperMode', 'shoutoutapi'],
                    values: [logChat, logEvents, logErrors, logDays.val(),
                        muteMode, actionMode, whisperMode, shoutoutMode]
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
