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

// Function that querys all of the data we need.
$(function () {
    // Get filter toggles.
    socket.getDBValues('moderation_get_toggles', {
        tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
        keys: ['linksToggle', 'capsToggle', 'spamToggle', 'symbolsToggle', 'emotesToggle', 'longMessageToggle', 'colorsToggle', 'spamTrackerToggle', 'fakePurgeToggle']
    }, true, function (e) {
        // Set the links filter toggle.
        $('#filter-links').prop('checked', e.linksToggle === 'true');
        // Set the caps filter toggle.
        $('#filter-caps').prop('checked', e.capsToggle === 'true');
        // Set the spam filter toggle.
        $('#filter-spam').prop('checked', e.spamToggle === 'true');
        // Set the symbols filter toggle.
        $('#filter-symbols').prop('checked', e.symbolsToggle === 'true');
        // Set the emotes filter toggle.
        $('#filter-emotes').prop('checked', e.emotesToggle === 'true');
        // Set the long messages filter toggle.
        $('#filter-messages').prop('checked', e.longMessageToggle === 'true');
        // Set the colors filter toggle.
        $('#filter-me').prop('checked', e.colorsToggle === 'true');
        // Set the spam tracker filter toggle.
        $('#filter-tracker').prop('checked', e.spamTrackerToggle === 'true');
        // Set the fake purges filter toggle.
        $('#filter-purges').prop('checked', e.fakePurgeToggle === 'true');
    });
});

// Function that handles setting events.
$(function () {
    let isSwappedSubscriberVIP = false;

    function updateSubscriberVIPSwap() {
        socket.getDBValues('moderation_get_vipswapped', {
            tables: ['settings'],
            keys: ['isSwappedSubscriberVIP']
        }, true, function (e) {
            isSwappedSubscriberVIP = e.isSwappedSubscriberVIP === '1';
        });
    }
    updateSubscriberVIPSwap();

    function prepExcludeCheckboxes() {
        updateSubscriberVIPSwap();
        $('#exclude-regulars').change(function () {
            $('#exclude-vips').prop('checked', $('#exclude-regulars').prop('checked'));
            $('#exclude-vips').prop('disabled', $('#exclude-regulars').prop('checked'));
            $('#exclude-subscribers').prop('checked', $('#exclude-regulars').prop('checked'));
            $('#exclude-subscribers').prop('disabled', $('#exclude-regulars').prop('checked'));
        });

        if ($('#exclude-regulars').prop('checked')) {
            $('#exclude-vips').prop('checked', $('#exclude-regulars').prop('checked'));
            $('#exclude-vips').prop('disabled', $('#exclude-regulars').prop('checked'));
            $('#exclude-subscribers').prop('checked', $('#exclude-regulars').prop('checked'));
            $('#exclude-subscribers').prop('disabled', $('#exclude-regulars').prop('checked'));
        }

        if ($('#exclude-subscribers').prop('checked') && isSwappedSubscriberVIP) {
            $('#exclude-vips').prop('checked', $('#exclude-subscribers').prop('checked'));
            $('#exclude-vips').prop('disabled', $('#exclude-subscribers').prop('checked'));
        }

        $('#exclude-subscribers').change(function () {
            if (isSwappedSubscriberVIP) {
                $('#exclude-vips').prop('checked', $('#exclude-subscribers').prop('checked'));
                $('#exclude-vips').prop('disabled', $('#exclude-subscribers').prop('checked'));
            }
        });

        if ($('#exclude-vips').prop('checked') && !isSwappedSubscriberVIP) {
            $('#exclude-subscribers').prop('checked', $('#exclude-vips').prop('checked'));
            $('#exclude-subscribers').prop('disabled', $('#exclude-vips').prop('checked'));
        }

        $('#exclude-vips').change(function () {
            if (!isSwappedSubscriberVIP) {
                $('#exclude-subscribers').prop('checked', $('#exclude-vips').prop('checked'));
                $('#exclude-subscribers').prop('disabled', $('#exclude-vips').prop('checked'));
            }
        });
    }

    // Filter toggle click.
    $('[data-filter]').on('change', function () {
        // Update the db with the new toggle.
        socket.updateDBValue('moderation_update_filter', 'chatModerator', $(this).data('filter'), $(this).is(':checked'), function () {
            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                toastr.success('Filter toggle successfully updated!');
            });
        });
    });

    // Cluster begins here.

    // Handle link filter settings.
    $('#filter-links-btn').on('click', function () {
        // Get link filter settings.
        socket.getDBValues('moderation_get_link_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['linksMessage', 'linkPermitTime', 'subscribersModerateLinks', 'regularsModerateLinks', 'vipsModerateLinks', 'silentTimeoutLinks', 'silentLinkMessage', 'warningTimeLinks', 'timeoutTimeLinks']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('link-settings', 'Link Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.linksMessage, 'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutLinks === 'true', 'Silent', 'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeLinks,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeLinks,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentLinkMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for the permit time.
                                .append(helpers.getInputGroup('permit-time', 'number', 'Permit Duration', '0', e.linkPermitTime,
                                        'How long in seconds a user has to post a link when permitted.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateLinks !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateLinks !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateLinks !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        permitTime = $('#permit-time'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputNumber(permitTime):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_links', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['linksMessage', 'linkPermitTime', 'subscribersModerateLinks', 'regularsModerateLinks', 'vipsModerateLinks', 'silentTimeoutLinks',
                                'silentLinkMessage', 'warningTimeLinks', 'timeoutTimeLinks'],
                            values: [timeoutMessage.val(), permitTime.val(), isSub, isReg, isVip, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#link-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the link filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle caps filter settings.
    $('#filter-caps-btn').on('click', function () {
        // Get caps filter settings.
        socket.getDBValues('moderation_get_caps_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['capsMessage', 'capsLimitPercent', 'capsTriggerLength', 'subscribersModerateCaps',
                'regularsModerateCaps', 'vipsModerateCaps', 'silentTimeoutCaps', 'silentCapMessage', 'warningTimeCaps', 'timeoutTimeCaps']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('caps-settings', 'Caps Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.capsMessage, 'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutCaps === 'true', 'Silent', 'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeCaps,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeCaps,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentCapMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for amount of caps required before checking.
                                .append(helpers.getInputGroup('caps-trigger-amount', 'number', 'Caps Trigger Amount', '0', e.capsTriggerLength,
                                        'Amount of caps required in the message before checking for caps.'))
                                // Append input box for the max caps percent
                                .append(helpers.getInputGroup('caps-amount', 'number', 'Caps Limit Percent', '0', e.capsLimitPercent,
                                        'Maximum amount in percent of caps allowed in a message.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateCaps !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateCaps !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateCaps !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        capsTrigger = $('#caps-trigger-amount'),
                        capsLimit = $('#caps-amount'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputNumber(capsTrigger):
                    case helpers.handleInputNumber(capsLimit):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_caps', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['capsMessage', 'capsLimitPercent', 'capsTriggerLength', 'subscribersModerateCaps',
                                'regularsModerateCaps', 'vipsModerateCaps', 'silentTimeoutCaps', 'silentCapMessage', 'warningTimeCaps', 'timeoutTimeCaps'],
                            values: [timeoutMessage.val(), capsLimit.val(), capsTrigger.val(), isSub, isReg, isVip, timeoutMessageToggle,
                                timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#caps-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the caps filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle symbols filter settings.
    $('#filter-symbols-btn').on('click', function () {
        // Get symbols filter settings.
        socket.getDBValues('moderation_get_symbols_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['symbolsMessage', 'symbolsLimitPercent', 'symbolsGroupLimit', 'symbolsTriggerLength',
                'subscribersModerateSymbols', 'regularsModerateSymbols', 'vipsModerateSymbols', 'silentTimeoutSymbols', 'silentSymbolsMessage', 'warningTimeSymbols', 'timeoutTimeSymbols']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('symbols-settings', 'Symbols Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.symbolsMessage, 'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutSymbols === 'true', 'Silent', 'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeSymbols,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeSymbols,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentSymbolsMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for amount of symbols required before checking.
                                .append(helpers.getInputGroup('symbols-trigger-amount', 'number', 'Symbols Trigger Amount', '0', e.symbolsTriggerLength,
                                        'Amount of symbols required in the message before checking for symbols.'))
                                // Append input box for the max symbols percent.
                                .append(helpers.getInputGroup('symbols-amount', 'number', 'Symbols Limit Percent', '0', e.symbolsLimitPercent,
                                        'Maximum amount in percent of symbols allowed in a message.'))
                                // Append input box for the max groupped symbols.
                                .append(helpers.getInputGroup('symbols-amount-group', 'number', 'Symbols Group Limit', '0', e.symbolsGroupLimit,
                                        'Maximum amount of groupped symbols allowed.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateSymbols !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateSymbols !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateSymbols !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        symbolsTrigger = $('#symbols-trigger-amount'),
                        symbolsLimit = $('#symbols-amount'),
                        symbolsLimitGroup = $('#symbols-amount-group'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputNumber(symbolsTrigger):
                    case helpers.handleInputNumber(symbolsLimit):
                    case helpers.handleInputNumber(symbolsLimitGroup):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_symbols', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['symbolsMessage', 'symbolsLimitPercent', 'symbolsGroupLimit', 'symbolsTriggerLength',
                                'subscribersModerateSymbols', 'regularsModerateSymbols', 'vipsModerateSymbols', 'silentTimeoutSymbols', 'silentSymbolsMessage', 'warningTimeSymbols', 'timeoutTimeSymbols'],
                            values: [timeoutMessage.val(), symbolsLimit.val(), symbolsLimitGroup.val(), symbolsTrigger.val(),
                                isSub, isReg, isVip, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#symbols-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the symbols filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle spam filter settings.
    $('#filter-spam-btn').on('click', function () {
        // Get spam filter settings.
        socket.getDBValues('moderation_get_spam_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['spamMessage', 'spamLimit', 'subscribersModerateSpam', 'regularsModerateSpam', 'vipsModerateSpam',
                'silentTimeoutSpam', 'silentSpamMessage', 'warningTimeSpam', 'timeoutTimeSpam']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('spam-settings', 'Spam Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.spamMessage,
                            'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutSpam === 'true', 'Silent',
                                    'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeSpam,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeSpam,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentSpamMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for amount of caps required before checking.
                                .append(helpers.getInputGroup('spam-amount', 'number', 'Spam Limit', '0', e.spamLimit,
                                        'Amount of repeating characters allowed in a message.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateSpam !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateSpam !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.subscribersModerateSpam !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        spamLimit = $('#spam-amount'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputNumber(spamLimit):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_spam', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['spamMessage', 'spamLimit', 'subscribersModerateSpam', 'regularsModerateSpam', 'vipsModerateSpam',
                                'silentTimeoutSpam', 'silentSpamMessage', 'warningTimeSpam', 'timeoutTimeSpam'],
                            values: [timeoutMessage.val(), spamLimit.val(), isSub, isReg, isVip, timeoutMessageToggle,
                                timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#spam-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the spam filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle emotes filter settings.
    $('#filter-emotes-btn').on('click', function () {
        // Get emotes filter settings.
        socket.getDBValues('moderation_get_emotes_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['emotesMessage', 'emotesLimit', 'subscribersModerateEmotes',
                'regularsModerateEmotes', 'vipsModerateEmotes', 'silentTimeoutEmotes', 'silentEmoteMessage', 'warningTimeEmotes', 'timeoutTimeEmotes']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('emotes-settings', 'Emotes Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.emotesMessage,
                            'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutEmotes === 'true', 'Silent',
                                    'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeEmotes,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeEmotes,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentEmoteMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for amount of caps required before checking.
                                .append(helpers.getInputGroup('emote-amount', 'number', 'Emote Limit', '0', e.emotesLimit,
                                        'Amount of emotes allowed in a message.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateEmotes !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateEmotes !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateEmotes !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        emoteLimit = $('#emote-amount'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputNumber(emoteLimit):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_emotes', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['emotesMessage', 'emotesLimit', 'subscribersModerateEmotes',
                                'regularsModerateEmotes', 'vipsModerateEmotes', 'silentTimeoutEmotes', 'silentEmoteMessage', 'warningTimeEmotes', 'timeoutTimeEmotes'],
                            values: [timeoutMessage.val(), emoteLimit.val(), isSub, isReg, isVip, timeoutMessageToggle,
                                timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#emotes-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the emotes filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle me filter settings.
    $('#filter-me-btn').on('click', function () {
        // Get me filter settings.
        socket.getDBValues('moderation_get_me_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['colorsMessage', 'subscribersModerateColors', 'regularsModerateColors', 'vipsModerateColors',
                'silentTimeoutColors', 'silentColorMessage', 'warningTimeColors', 'timeoutTimeColors']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('me-settings', 'Me Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.colorsMessage,
                            'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutColors === 'true', 'Silent',
                                    'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeColors,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeColors,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentColorMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateColors !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateColors !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateColors !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_me', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['colorsMessage', 'subscribersModerateColors', 'regularsModerateColors', 'vipsModerateColors',
                                'silentTimeoutColors', 'silentColorMessage', 'warningTimeColors', 'timeoutTimeColors'],
                            values: [timeoutMessage.val(), isSub, isReg, isVip, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#me-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the me filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle message length filter settings.
    $('#filter-msglen-btn').on('click', function () {
        // Get message length filter settings.
        socket.getDBValues('moderation_get_msglen_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['longMessageMessage', 'longMessageLimit', 'subscribersModerateLongMsg',
                'regularsModerateLongMsg', 'vipsModerateLongMsg', 'silentTimeoutLongMsg', 'silentLongMessage', 'warningTimeLongMsg', 'timeoutTimeLongMsg']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('msglen-settings', 'Paragraph Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.longMessageMessage,
                            'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutLongMsg === 'true', 'Silent',
                                    'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeLongMsg,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeLongMsg,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentLongMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for max amount of chars allowed in a message
                                .append(helpers.getInputGroup('msg-limit', 'number', 'Message Charcater Limit', '0', e.longMessageLimit,
                                        'Amount of characters allowed in a message.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateLongMsg !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateLongMsg !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateLongMsg !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        msgLimit = $('#msg-limit'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputString(msgLimit):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_longmsg', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['longMessageMessage', 'longMessageLimit', 'subscribersModerateLongMsg',
                                'regularsModerateLongMsg', 'vipsModerateLongMsg', 'silentTimeoutLongMsg', 'silentLongMessage', 'warningTimeLongMsg', 'timeoutTimeLongMsg'],
                            values: [timeoutMessage.val(), msgLimit.val(), isSub, isReg, isVip, timeoutMessageToggle,
                                timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#msglen-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the message length filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle fake purge filter settings.
    $('#filter-purges-btn').on('click', function () {
        // Get purges filter settings.
        socket.getDBValues('moderation_get_purges_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['fakePurgeMessage', 'subscribersModerateFakePurge', 'regularsModerateFakePurge', 'vipsModerateFakePurge',
                'silentTimeoutFakePurge', 'silentFakePurgeMessage', 'warningTimeFakePurge', 'timeoutTimeFakePurge']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('purges-settings', 'Fake Purge Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.fakePurgeMessage, 'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutFakePurge === 'true', 'Silent', 'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeFakePurge,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeFakePurge,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentFakePurgeMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateFakePurge !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateFakePurge !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateFakePurge !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_purges', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['fakePurgeMessage', 'subscribersModerateFakePurge', 'regularsModerateFakePurge', 'vipsModerateFakePurge',
                                'silentTimeoutFakePurge', 'silentFakePurgeMessage', 'warningTimeFakePurge', 'timeoutTimeFakePurge'],
                            values: [timeoutMessage.val(), isSub, isReg, isVip, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#purges-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the fake purge filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });

    // Handle tracker filter settings.
    $('#filter-tracker-btn').on('click', function () {
        // Get tracker length filter settings.
        socket.getDBValues('moderation_get_msglen_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['spamTrackerMessage', 'spamTrackerTime', 'spamTrackerLimit', 'subscribersModerateSpamTracker',
                'regularsModerateSpamTracker', 'vipsModerateSpamTracker', 'silentTimeoutSpamTracker', 'silentSpamTrackerMessage', 'warningTimeSpamTracker', 'timeoutTimeSpamTracker']
        }, true, function (e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('tracker-settings', 'User Moderation Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('timeout-message', 'text', 'Warning Message', '', e.spamTrackerMessage,
                            'Message said in chat when a user gets timed-out.')
                            // Append checkbox for if this message should be enabled.
                            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutSpamTracker === 'true', 'Silent',
                                    'If the warning message should be said or not.')))
                    // Append input box for the warning time.
                    .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warning Duration (Seconds)', '0', e.warningTimeSpamTracker,
                            'How long in seconds the user gets timed-out for on his first offence. 0 seconds will just delete the last message.'))
                    // Append input box for the timeout time.
                    .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeoutTimeSpamTracker,
                            'How long in seconds the user gets timed-out for on his last offence. 0 seconds will just delete the last message.'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'style': 'margin-top: 10px;',
                        'html': $('<form/>', {
                            'role': 'form'
                        })
                                // Append ban reason. This is the message Twitch shows with the timeout.
                                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Reason', '', e.silentSpamTrackerMessage,
                                        'Message shown to all moderators when the user gets timed-out.'))
                                // Append input box for the seconds reset time of the message caching of user.
                                .append(helpers.getInputGroup('track-time', 'number', 'Message Reset Time', '0', e.spamTrackerTime,
                                        'How long until the message count the user has sent resets.'))
                                // Append input box for the amount of messages the user can send in the reset time.
                                .append(helpers.getInputGroup('track-limit', 'number', 'Message Limit', '0', e.spamTrackerLimit,
                                        'How many messages users can send in the reset time period.'))
                                // Add group for toggles.
                                .append($('<div/>', {
                                    'class': 'form-group'
                                })
                                        // Tooltip to toggle for regulars to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateSpamTracker !== 'true', 'Exclude Regulars',
                                                'If regulars should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for subs to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateSpamTracker !== 'true', 'Exclude Subscribers',
                                                'If subscribers should be allowed to bypass this filter.'))
                                        // Tooltip to toggle for vips to bypass this filter.
                                        .append(helpers.getCheckBox('exclude-vips', e.vipsModerateSpamTracker !== 'true', 'Exclude VIPs',
                                                'If vips should be allowed to bypass this filter.')))
                                // Callback function to be called once we hit the save button on the modal.
                    })), function () {
                let timeoutMessage = $('#timeout-message'),
                        timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                        warningTime = $('#timeout-warning-time'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutReason = $('#timeout-banmsg'),
                        trackTime = $('#track-time'),
                        trackLimit = $('#track-limit'),
                        isReg = $('#exclude-regulars').is(':checked') !== true,
                        isSub = $('#exclude-subscribers').is(':checked') !== true,
                        isVip = $('#exclude-vips').is(':checked') !== true;

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(timeoutMessage):
                    case helpers.handleInputNumber(warningTime):
                    case helpers.handleInputNumber(timeoutTime):
                    case helpers.handleInputString(timeoutReason):
                    case helpers.handleInputString(trackTime):
                    case helpers.handleInputString(trackLimit):
                        break;
                    default:
                        // Update moderation settings.
                        socket.updateDBValues('moderation_update_tracker', {
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['spamTrackerMessage', 'spamTrackerTime', 'spamTrackerLimit',
                                'subscribersModerateSpamTracker', 'regularsModerateSpamTracker', 'vipsModerateSpamTracker', 'silentTimeoutSpamTracker', 'silentSpamTrackerMessage', 'warningTimeSpamTracker', 'timeoutTimeSpamTracker'],
                            values: [timeoutMessage.val(), trackTime.val(), trackLimit.val(), isSub, isReg, isVip,
                                timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function () {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function () {
                                // Hide modal
                                $('#tracker-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Successfully updated the user moderation filter settings!');
                            });
                        });
                }
            }).modal('toggle');

            prepExcludeCheckboxes();
        });
    });
});
