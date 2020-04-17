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

// Function that querys all of the data we need.
$(function() {
    // Get filter toggles.
    socket.getDBValues('moderation_get_toggles', {
        tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
        keys: ['linksToggle', 'capsToggle', 'spamToggle', 'symbolsToggle', 'emotesToggle', 'longMessageToggle', 'colorsToggle', 'spamTrackerToggle', 'fakePurgeToggle']
    }, true, function(e) {
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
$(function() {
    // Filter toggle click.
    $('[data-filter]').on('change', function() {
        // Update the db with the new toggle.
        socket.updateDBValue('moderation_update_filter', 'chatModerator', $(this).data('filter'), $(this).is(':checked'), function() {
            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                toastr.success('Filtermodus erfolgreich aktualisiert!');
            });
        });
    });

    // Cluster begins here.

    // Handle link filter settings.
    $('#filter-links-btn').on('click', function() {
        // Get link filter settings.
        socket.getDBValues('moderation_get_link_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['linksMessage', 'linkPermitTime', 'subscribersModerateLinks', 'regularsModerateLinks', 'silentTimeoutLinks', 'silentLinkMessage', 'warningTimeLinks', 'timeoutTimeLinks']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('link-settings', 'Link-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.linksMessage, 'Nachricht, die im Chat angezeigt wird, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutLinks === 'true', 'Stumm', 'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeLinks,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeLinks,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentLinkMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for the permit time.
                .append(helpers.getInputGroup('permit-time', 'number', 'Genehmigungsdauer', '0', e.linkPermitTime,
                    'Wie lange in Sekunden ein Benutzer einen Link posten darf, wenn es ihm erlaubt ist.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateLinks !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauer erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateLinks !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    permitTime = $('#permit-time'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                                    'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['linksMessage', 'linkPermitTime', 'subscribersModerateLinks', 'regularsModerateLinks', 'silentTimeoutLinks',
                                    'silentLinkMessage', 'warningTimeLinks', 'timeoutTimeLinks'],
                            values: [timeoutMessage.val(), permitTime.val(), isSub, isReg, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#link-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Link-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle caps filter settings.
    $('#filter-caps-btn').on('click', function() {
        // Get caps filter settings.
        socket.getDBValues('moderation_get_caps_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['capsMessage', 'capsLimitPercent', 'capsTriggerLength', 'subscribersModerateCaps',
                    'regularsModerateCaps', 'silentTimeoutCaps', 'silentCapMessage', 'warningTimeCaps', 'timeoutTimeCaps']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('caps-settings', 'Caps-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.capsMessage, 'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutCaps === 'true', 'Stumm', 'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeCaps,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeCaps,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentCapMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for amount of caps required before checking.
                .append(helpers.getInputGroup('caps-trigger-amount', 'number', 'Caps Auslöser Betrag', '0', e.capsTriggerLength,
                    'Anzahl von Caps, die in der Nachricht benötigt wird, bevor auf Caps geprüft wird.'))
                // Append input box for the max caps percent
                .append(helpers.getInputGroup('caps-amount', 'number', 'Höchstgrenze für Caps in Prozent', '0', e.capsLimitPercent,
                    'Maximale Menge in Prozent der in einer Nachricht erlaubten Caps.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateCaps !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauer erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateCaps !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    capsTrigger = $('#caps-trigger-amount'),
                    capsLimit = $('#caps-amount'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['capsMessage', 'capsLimitPercent', 'capsTriggerLength', 'subscribersModerateCaps',
                                    'regularsModerateCaps', 'silentTimeoutCaps', 'silentCapMessage', 'warningTimeCaps', 'timeoutTimeCaps'],
                            values: [timeoutMessage.val(), capsLimit.val(), capsTrigger.val(), isSub, isReg, timeoutMessageToggle,
                                    timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#caps-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Caps-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle symbols filter settings.
    $('#filter-symbols-btn').on('click', function() {
        // Get symbols filter settings.
        socket.getDBValues('moderation_get_symbols_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['symbolsMessage', 'symbolsLimitPercent', 'symbolsGroupLimit', 'symbolsTriggerLength',
                    'subscribersModerateSymbols', 'regularsModerateSymbols', 'silentTimeoutSymbols', 'silentSymbolsMessage', 'warningTimeSymbols', 'timeoutTimeSymbols']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('symbols-settings', 'Symboleinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.symbolsMessage, 'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutSymbols === 'true', 'Stumm', 'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeSymbols,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeSymbols,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentSymbolsMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for amount of symbols required before checking.
                .append(helpers.getInputGroup('symbols-trigger-amount', 'number', 'Symbole Auslöser Betrag', '0', e.symbolsTriggerLength,
                    'Anzahl der Symbole, die in einer Nachricht benötigt werden, bevor nach Symbolen geprüft wird.'))
                // Append input box for the max symbols percent.
                .append(helpers.getInputGroup('symbols-amount', 'number', 'Symbole Grenzwert in Prozent', '0', e.symbolsLimitPercent,
                    'Maximale Anzahl in Prozent der Symbole, die in einer Nachricht erlaubt sind.'))
                // Append input box for the max groupped symbols.
                .append(helpers.getInputGroup('symbols-amount-group', 'number', 'Gruppengrenze für Symbole', '0', e.symbolsGroupLimit,
                    'Maximal zulässige Anzahl von Symbolen in Gruppen.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateSymbols !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauern erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateSymbols !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    symbolsTrigger = $('#symbols-trigger-amount'),
                    symbolsLimit = $('#symbols-amount'),
                    symbolsLimitGroup = $('#symbols-amount-group'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                                'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['symbolsMessage', 'symbolsLimitPercent', 'symbolsGroupLimit', 'symbolsTriggerLength',
                                'subscribersModerateSymbols', 'regularsModerateSymbols', 'silentTimeoutSymbols', 'silentSymbolsMessage', 'warningTimeSymbols', 'timeoutTimeSymbols'],
                            values: [timeoutMessage.val(), symbolsLimit.val(), symbolsLimitGroup.val(), symbolsTrigger.val(),
                                    isSub, isReg, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#symbols-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Symbol-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle spam filter settings.
    $('#filter-spam-btn').on('click', function() {
        // Get spam filter settings.
        socket.getDBValues('moderation_get_spam_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['spamMessage', 'spamLimit', 'subscribersModerateSpam', 'regularsModerateSpam',
                    'silentTimeoutSpam', 'silentSpamMessage', 'warningTimeSpam', 'timeoutTimeSpam']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('spam-settings', 'Spam-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.spamMessage,
                'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutSpam === 'true', 'Stumm',
                'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeSpam,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeSpam,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout grund', '', e.silentSpamMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for amount of caps required before checking.
                .append(helpers.getInputGroup('spam-amount', 'number', 'Spam-Limit', '0', e.spamLimit,
                    'Anzahl der zulässigen sich wiederholenden Zeichen in einer Nachricht.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateSpam !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauer erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateSpam !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    spamLimit = $('#spam-amount'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['spamMessage', 'spamLimit', 'subscribersModerateSpam', 'regularsModerateSpam',
                                     'silentTimeoutSpam', 'silentSpamMessage', 'warningTimeSpam', 'timeoutTimeSpam'],
                            values: [timeoutMessage.val(), spamLimit.val(), isSub, isReg, timeoutMessageToggle,
                                    timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#spam-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Spam-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle emotes filter settings.
    $('#filter-emotes-btn').on('click', function() {
        // Get emotes filter settings.
        socket.getDBValues('moderation_get_emotes_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['emotesMessage', 'emotesLimit', 'subscribersModerateEmotes',
                    'regularsModerateEmotes', 'silentTimeoutEmotes', 'silentEmoteMessage', 'warningTimeEmotes', 'timeoutTimeEmotes']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('emotes-settings', 'Emotes-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.emotesMessage,
                'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutEmotes === 'true', 'Stumm',
                'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeEmotes,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeEmotes,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentEmoteMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for amount of caps required before checking.
                .append(helpers.getInputGroup('emote-amount', 'number', 'Emote-Limit', '0', e.emotesLimit,
                    'Anzahl der erlaubten Emotes in einer Nachricht.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateEmotes !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauer erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateEmotes !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    emoteLimit = $('#emote-amount'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['emotesMessage', 'emotesLimit', 'subscribersModerateEmotes',
                                    'regularsModerateEmotes', 'silentTimeoutEmotes', 'silentEmoteMessage', 'warningTimeEmotes', 'timeoutTimeEmotes'],
                            values: [timeoutMessage.val(), emoteLimit.val(), isSub, isReg, timeoutMessageToggle,
                                    timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#emotes-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Emotes-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle me filter settings.
    $('#filter-me-btn').on('click', function() {
        // Get me filter settings.
        socket.getDBValues('moderation_get_me_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['colorsMessage', 'subscribersModerateColors', 'regularsModerateColors',
                    'silentTimeoutColors', 'silentColorMessage', 'warningTimeColors', 'timeoutTimeColors']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('me-settings', 'Me Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.colorsMessage,
                'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutColors === 'true', 'Stumm',
                'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeColors,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeColors,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentColorMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateColors !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauern erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateColors !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['colorsMessage', 'subscribersModerateColors', 'regularsModerateColors',
                                    'silentTimeoutColors', 'silentColorMessage', 'warningTimeColors', 'timeoutTimeColors'],
                            values: [timeoutMessage.val(), isSub, isReg, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#me-settings').modal('hide');
                                // Let the user know.
                                toastr.success('me-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle message length filter settings.
    $('#filter-msglen-btn').on('click', function() {
        // Get message length filter settings.
        socket.getDBValues('moderation_get_msglen_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['longMessageMessage', 'longMessageLimit', 'subscribersModerateLongMsg',
                    'regularsModerateLongMsg', 'silentTimeoutLongMsg', 'silentLongMessage', 'warningTimeLongMsg', 'timeoutTimeLongMsg']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('msglen-settings', 'Absatzeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.longMessageMessage,
                'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutLongMsg === 'true', 'Stumm',
                'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeLongMsg,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeLongMsg,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentLongMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for max amount of chars allowed in a message
                .append(helpers.getInputGroup('msg-limit', 'number', 'Nachrichtenzeichenbegrenzung', '0', e.longMessageLimit,
                    'Anzahl der Zeichen, die in einer Nachricht erlaubt sind.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateLongMsg !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauern erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateLongMsg !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    msgLimit = $('#msg-limit'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['longMessageMessage', 'longMessageLimit', 'subscribersModerateLongMsg',
                                    'regularsModerateLongMsg', 'silentTimeoutLongMsg', 'silentLongMessage', 'warningTimeLongMsg', 'timeoutTimeLongMsg'],
                            values: [timeoutMessage.val(), msgLimit.val(), isSub, isReg, timeoutMessageToggle,
                                    timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#msglen-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Nachrichtenlängen-Filter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle fake purge filter settings.
    $('#filter-purges-btn').on('click', function() {
        // Get purges filter settings.
        socket.getDBValues('moderation_get_purges_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['fakePurgeMessage', 'subscribersModerateFakePurge', 'regularsModerateFakePurge',
                    'silentTimeoutFakePurge', 'silentFakePurgeMessage', 'warningTimeFakePurge', 'timeoutTimeFakePurge']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('purges-settings', 'Fake Purge Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.fakePurgeMessage, 'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutFakePurge === 'true', 'Stumm', 'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeFakePurge,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeFakePurge,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentFakePurgeMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateFakePurge !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauern erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateFakePurge !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['fakePurgeMessage', 'subscribersModerateFakePurge', 'regularsModerateFakePurge',
                                    'silentTimeoutFakePurge', 'silentFakePurgeMessage', 'warningTimeFakePurge', 'timeoutTimeFakePurge'],
                            values: [timeoutMessage.val(), isSub, isReg, timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#purges-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Fake Purge Filtereinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Handle tracker filter settings.
    $('#filter-tracker-btn').on('click', function() {
        // Get tracker length filter settings.
        socket.getDBValues('moderation_get_msglen_settings', {
            tables: ['chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator',
                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
            keys: ['spamTrackerMessage', 'spamTrackerTime', 'spamTrackerLimit', 'subscribersModerateSpamTracker',
                    'regularsModerateSpamTracker', 'silentTimeoutSpamTracker', 'silentSpamTrackerMessage', 'warningTimeSpamTracker', 'timeoutTimeSpamTracker']
        }, true, function(e) {
            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('tracker-settings', 'Benutzermoderationseinstellungen', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('timeout-message', 'text', 'Warnmeldung', '', e.spamTrackerMessage,
                'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
            // Append checkbox for if this message should be enabled.
            .append(helpers.getCheckBox('timeout-message-toggle', e.silentTimeoutSpamTracker === 'true', 'Stumm',
                'Ob die Warnmeldung gesendet werden soll oder nicht.')))
            // Append input box for the warning time.
            .append(helpers.getInputGroup('timeout-warning-time', 'number', 'Warndauer (Sekunden)', '0', e.warningTimeSpamTracker,
                'Wie lange in Sekunden der Benutzer bei seinem ersten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Append input box for the timeout time.
            .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeoutTimeSpamTracker,
                'Wie lange in Sekunden der Benutzer bei seinem letzten Vergehen einen Timeout erhält. 0 Sekunden löschen nur die letzte Nachricht.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'style': 'margin-top: 10px;',
                'html': $('<form/>', {
                    'role': 'form'
                })
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Grund', '', e.silentSpamTrackerMessage,
                    'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                // Append input box for the seconds reset time of the message caching of user.
                .append(helpers.getInputGroup('track-time', 'number', 'Nachrichten-Reset-Zeit', '0', e.spamTrackerTime,
                    'Wie lange bis die Anzahl der Nachrichten, die der Benutzer gesendet hat, zurückgesetzt wird.'))
                // Append input box for the amount of messages the user can send in the reset time.
                .append(helpers.getInputGroup('track-limit', 'number', 'Nachrichtenlimit', '0', e.spamTrackerLimit,
                    'Wie viele Nachrichten Benutzer im Reset-Zeitraum senden können.'))
                // Add group for toggles.
                .append($('<div/>', {
                    'class': 'form-group'
                })
                // Tooltip to toggle for regulars to bypass this filter.
                .append(helpers.getCheckBox('exclude-regulars', e.regularsModerateSpamTracker !== 'true', 'Stammzuschauer ausschließen',
                    'Wenn Stammzuschauern erlaubt sein soll, diesen Filter zu umgehen.'))
                // Tooltip to toggle for subs to bypass this filter.
                .append(helpers.getCheckBox('exclude-subscribers', e.subscribersModerateSpamTracker !== 'true', 'Abonnenten ausschließen',
                    'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
            // Callback function to be called once we hit the save button on the modal.
            })), function() {
                let timeoutMessage = $('#timeout-message'),
                    timeoutMessageToggle = $('#timeout-message-toggle').is(':checked') === true,
                    warningTime = $('#timeout-warning-time'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutReason = $('#timeout-banmsg'),
                    trackTime = $('#track-time'),
                    trackLimit = $('#track-limit'),
                    isReg = $('#exclude-regulars').is(':checked') !== true,
                    isSub = $('#exclude-subscribers').is(':checked') !== true;

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
                            tables: ['chatModerator', 'chatModerator', 'chatModerator',
                                    'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator', 'chatModerator'],
                            keys: ['spamTrackerMessage', 'spamTrackerTime', 'spamTrackerLimit',
                                    'subscribersModerateSpamTracker', 'regularsModerateSpamTracker', 'silentTimeoutSpamTracker', 'silentSpamTrackerMessage', 'warningTimeSpamTracker', 'timeoutTimeSpamTracker'],
                            values: [timeoutMessage.val(), trackTime.val(), trackLimit.val(), isSub, isReg,
                                    timeoutMessageToggle, timeoutReason.val(), warningTime.val(), timeoutTime.val()]
                        }, function() {
                            socket.sendCommand('moderation_update_filter_cmd', 'reloadmod', function() {
                                // Hide modal
                                $('#tracker-settings').modal('hide');
                                // Let the user know.
                                toastr.success('Benutzer-Moderationsfilter-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
