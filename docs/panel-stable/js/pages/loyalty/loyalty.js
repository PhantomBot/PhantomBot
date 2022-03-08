/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

// Function that querys all of the data we need.
$(run = function() {
    // Get time settings.
    socket.getDBValues('time_get_settings', {
        tables: ['timeSettings', 'timeSettings', 'timeSettings', 'timeSettings', 'settings', 'settings'],
        keys: ['timeLevel', 'timeLevelWarning', 'keepTimeWhenOffline', 'timePromoteHours', 'topListAmountTime', 'timezone']
    }, true, function(e) {
        // Set the bot timezone.
        $('#loyalty-timezone').val((e.timezone === null ? 'GMT' : e.timezone));
        // Auto add time when offline.
        $('#time-offline').val((e.keepTimeWhenOffline === 'true' ? 'Yes' : 'No'));
        // Auto promote users.
        $('#time-promote').val((e.timeLevel === 'true' ? 'Yes' : 'No'));
        // Auto promote chat notice
        $('#time-promote-notice').val((e.timeLevelWarning === 'true' ? 'Yes' : 'No'));
        // Time to be promoted.
        $('#loyalty-promotion').val(e.timePromoteHours);
        // Top list amount.
        $('#loyalty-top').val(e.topListAmountTime);
    });
});

// Function that handlers the loading of events.
$(function() {
    // Button that reloads the time top 100.
    $('#loyalty-reload').on('click', function() {
        // Reload all.
        run();
        // Alert the user.
        toastr.success('Successfully updated the top 100 table.');
    });

    // Get user time button.
    $('#time-get-user').on('click', function() {
        let username = $('#time-username').val().toLowerCase();

        if (username.length > 0) {
            socket.getDBValue('time_get_user_total', 'time', username, function(e) {
                $('#time-username-time').val((e.time === null ? '0' : e.time));
            });
        }
    });

    // Save user points.
    $('#time-save-user').on('click', function() {
        let username = $('#time-username'),
            time = $('#time-username-time');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputString(username):
            case helpers.handleInputNumber(time):
                break;
            default:
                // Save user time.
                socket.updateDBValue('time_update_user', 'time', username.val().toLowerCase(), time.val(), function() {
                    // Alert the user.
                    toastr.success('Successfully updated user time!');

                    // Reset box values.
                    username.val('');
                    time.val('');
                });
        }
    });

    // Save time settings.
    $('#loyalty-save-all').on('click', function() {
        let timeZone = $('#loyalty-timezone'),
            countOfflineTime = $('#time-offline').find(':selected').text() === 'Yes',
            timePromote = $('#time-promote').find(':selected').text() === 'Yes',
            timePromoteNotice = $('#time-promote-notice').find(':selected').text() === 'Yes',
            regHours = $('#loyalty-promotion'),
            timeTop = $('#loyalty-top');

        // Make sure everything has a value.
        switch (false) {
            case helpers.handleInputString(timeZone):
            case helpers.handleInputNumber(regHours):
            case helpers.handleInputNumber(timeTop):
                break;
            default:
                // Update database.
                socket.updateDBValues('time_update_settings', {
                    tables: ['timeSettings', 'timeSettings', 'timeSettings', 'timeSettings', 'settings', 'settings'],
                    keys: ['timeLevel', 'timeLevelWarning', 'keepTimeWhenOffline', 'timePromoteHours', 'topListAmountTime', 'timezone'],
                    values: [timePromote, timePromoteNotice, countOfflineTime, regHours.val(), (parseInt(timeTop.val()) > 15 ? 15 : timeTop.val()), timeZone.val()]
                }, function() {
                    socket.sendCommand('update_time_settings_cmd', 'reloadtop', function() {
                        toastr.success('Successfully updated time settings!');
                    });
                });
        }
    });
});
