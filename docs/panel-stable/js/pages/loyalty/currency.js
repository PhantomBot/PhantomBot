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
$(run = function () {
    // Get module status.
    socket.getDBValue('get_points_module_status', 'modules', './systems/pointSystem.js', function (e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('pointsModule', e.modules)) {
            return;
        }

        // Get points settings.
        socket.getDBValues('get_points_settings', {
            tables: ['pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'settings'],
            keys: ['onlineGain', 'offlineGain', 'onlinePayoutInterval', 'offlinePayoutInterval', 'activeBonus', 'pointNameSingle', 'pointNameMultiple', 'pointsMessage', 'topListAmountPoints']
        }, true, function (e) {
            // Set the points message.
            $('#points-message').val(e.pointsMessage);
            // Set the currency name single.
            $('#points-name-single').val(e.pointNameSingle);
            // Set the currency name multiple.
            $('#points-name-multiple').val(e.pointNameMultiple);
            // Set online interval.
            $('#points-interval-online').val(e.onlinePayoutInterval);
            // Set offline interval.
            $('#points-interval-offline').val(e.offlinePayoutInterval);
            // Set online payout.
            $('#points-payout-online').val(e.onlineGain);
            // Set offline payout.
            $('#points-payout-offline').val(e.offlineGain);
            // Set active bonus.
            $('#points-active').val(e.activeBonus);
            // Set top list.
            $('#points-top').val(e.topListAmountPoints);
        });

        // Get online group payout.
        socket.getDBTableValues('get_points_online_group_payout', 'grouppoints', function (results) {
            for (let i = 0; i < results.length; i++) {
                $('#points-payout-' + results[i].key.toLowerCase() + '-on').val(results[i].value);
            }
        });

        // Get offline group payout.
        socket.getDBTableValues('get_points_offline_group_payout', 'grouppointsoffline', function (results) {
            for (let i = 0; i < results.length; i++) {
                $('#points-payout-' + results[i].key.toLowerCase() + '-off').val(results[i].value);
            }
        });
    });
});

// Function that handlers the loading of events.
$(function () {
    // Module toggle.
    $('#pointsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommand('points_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/pointSystem.js', run);
    });

    // Get user points button.
    $('#points-get-user').on('click', function () {
        let username = $('#points-username').val().toLowerCase();

        if (username.length > 0) {
            socket.getDBValue('points_get_user_total', 'points', username, function (e) {
                $('#points-username-points').val((e.points === null ? '0' : e.points));
            });
        }
    });

    // Save user points.
    $('#points-save-user').on('click', function () {
        let username = $('#points-username'),
                points = $('#points-username-points');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputString(username):
            case helpers.handleInputNumber(points):
                break;
            default:
                // Save user points.
                socket.updateDBValue('points_update_user', 'points', username.val().toLowerCase(), points.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully updated user points!');

                    // Reset box values.
                    username.val('');
                    points.val('');
                });
        }
    });

    // Handle penalty button.
    $('#points-panalty-btn').on('click', function () {
        let username = $('#points-panalty-user'),
                time = $('#points-panalty-time');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputString(username):
            case helpers.handleInputNumber(time):
                break;
            default:
                // Set penalty.
                socket.sendCommand('set_penalty_user', 'penalty ' + username.val().toLowerCase() + ' ' + time.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully set penalty on user!');

                    // Reset box values.
                    username.val('');
                    time.val('');
                });
        }
    });

    // Handle points bonus button.
    $('#points-bonus-btn').on('click', function () {
        let amount = $('#points-bonus-amount'),
                time = $('#points-bonus-time');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputNumber(amount):
            case helpers.handleInputNumber(time):
                break;
            default:
                // Set bonus.
                socket.sendCommand('set_bonus_all', 'pointsbonuspanel ' + amount.val() + ' ' + time.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully set the points bonus!');

                    // Reset box values.
                    amount.val('');
                    time.val('');
                });
        }
    });

    // Handle make it rain button.
    $('#points-makeitrain-btn').on('click', function () {
        let amount = $('#points-bonus-amount');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputNumber(amount):
                break;
            default:
                // Set bonus.
                socket.sendCommand('main_it_rain_all', 'makeitrain ' + amount.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully made it rain!');

                    // Reset box values.
                    amount.val('');
                });
        }
    });

    // Handle give all button.
    $('#points-giveall-btn').on('click', function () {
        let amount = $('#points-bonus-amount');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputNumber(amount):
                break;
            default:
                // Set bonus.
                socket.sendCommand('set_give_all', 'pointsallpanel ' + amount.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully gave everyone points!');

                    // Reset box values.
                    amount.val('');
                });
        }
    });

    // Handle take all button.
    $('#points-takeall-btn').on('click', function () {
        let amount = $('#points-bonus-amount');

        // Make sure both input have something.
        switch (false) {
            case helpers.handleInputNumber(amount):
                break;
            default:
                // Set bonus.
                socket.sendCommand('set_give_all', 'pointstakepanel ' + amount.val(), function () {
                    // Alert the user.
                    toastr.success('Successfully took points from everyone!');

                    // Reset box values.
                    amount.val('');
                });
        }
    });

    // Button that reloads the points top 100.
    $('#currency-reload').on('click', function () {
        // Reload all.
        run();
        toastr.success('Successfully updated the top 100 table.');
    });

    // Save all points settings.
    $('#points-save-all').on('click', function () {
        // Save either advanced settings or normal depending on which tab is active.
        if ($('#main-settings').hasClass('active')) {
            let pointsMessage = $('#points-message'),
                    pointsSingle = $('#points-name-single'),
                    pointsMultiple = $('#points-name-multiple'),
                    pointsOnlineInt = $('#points-interval-online'),
                    pointsOfflineInt = $('#points-interval-offline'),
                    pointsOnlinePay = $('#points-payout-online'),
                    pointsOfflinePay = $('#points-payout-offline'),
                    pointsActive = $('#points-active'),
                    topList = $('#points-top');

            // Make sure both input have something.
            switch (false) {
                case helpers.handleInputString(pointsMessage):
                case helpers.handleInputString(pointsSingle):
                case helpers.handleInputString(pointsMultiple):
                case helpers.handleInputNumber(pointsOnlineInt):
                case helpers.handleInputNumber(pointsOfflineInt):
                case helpers.handleInputNumber(pointsOnlinePay):
                case helpers.handleInputNumber(pointsOfflinePay):
                case helpers.handleInputNumber(pointsActive):
                case helpers.handleInputNumber(topList):
                    break;
                default:
                    // Update the settings.
                    socket.updateDBValues('update_points_settings', {
                        tables: ['pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'pointSettings', 'settings'],
                        keys: ['onlineGain', 'offlineGain', 'onlinePayoutInterval', 'offlinePayoutInterval', 'activeBonus', 'pointNameSingle', 'pointNameMultiple', 'pointsMessage', 'topListAmountPoints'],
                        values: [pointsOnlinePay.val(), pointsOfflinePay.val(), pointsOnlineInt.val(), pointsOfflineInt.val(), pointsActive.val(), pointsSingle.val(), pointsMultiple.val(), pointsMessage.val(), (parseInt(topList.val()) > 15 ? '15' : topList.val())]
                    }, function () {
                        socket.sendCommand('update_points_settings_cmd', 'reloadpoints', function () {
                            toastr.success('Successfully updated points settings!');
                        });
                    });
            }
        } else {
            let groups = ['caster', 'administrator', 'moderator', 'subscriber', 'donator', 'regular', 'viewer'], //Hardcoded in order to keep the logic and still have consistent ordering
                    temp = [];

            // Make sure that all groups have a value.
            for (let i = 0; i < groups.length; i++) {
                // Check for the online value.
                if (!helpers.handleInputString($('#points-payout-' + groups[i] + '-on'))) {
                    return;
                }
                // Check for the offline value.
                if (!helpers.handleInputString($('#points-payout-' + groups[i] + '-off'))) {
                    return;
                }
            }

            // Get all values for online.
            for (let i = 0; i < groups.length; i++) {
                temp.push($('#points-payout-' + groups[i] + '-on').val());
            }

            // Update the DB.
            socket.updateDBValues('update_group_payout_online', {
                tables: ['grouppoints', 'grouppoints', 'grouppoints', 'grouppoints', 'grouppoints', 'grouppoints', 'grouppoints'],
                keys: ['Caster', 'Administrator', 'Moderator', 'Subscriber', 'Donator', 'Regular', 'Viewer'],
                values: temp
            }, function () {
                temp = [];

                // Get all values offline online.
                for (let i = 0; i < groups.length; i++) {
                    temp.push($('#points-payout-' + groups[i] + '-off').val());
                }

                // Update the DB.
                socket.updateDBValues('update_group_payout_offline', {
                    tables: ['grouppointsoffline', 'grouppointsoffline', 'grouppointsoffline', 'grouppointsoffline', 'grouppointsoffline', 'grouppointsoffline', 'grouppointsoffline'],
                    keys: ['Caster', 'Administrator', 'Moderator', 'Subscriber', 'Donator', 'Regular', 'Viewer'],
                    values: temp
                }, function () {
                    toastr.success('Successfully updated advanced points settings!');
                });
            });
        }
    });
});
