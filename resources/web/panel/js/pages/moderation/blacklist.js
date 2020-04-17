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
$(run = function() {
    // Query blacklist.
    socket.getDBTableValues('moderation_blacklist_get', 'blackList', function(results) {
        let tableData = [];

        for (let i = 0; i < results.length; i++) {
            let json = JSON.parse(results[i].value);

            tableData.push([
                json.phrase,
                json.isRegex,
                json.timeout,
                json.message,
                json.banReason,
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'style': 'float: right',
                    'data-blacklist': results[i].key,
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning',
                    'style': 'float: right',
                    'data-blacklist': results[i].key,
                    'html': $('<i/>', {
                        'class': 'fa fa-edit'
                    })
                })).html()
            ]);
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#blacklistTable')) {
            $('#blacklistTable').DataTable().destroy();
            // Remove all of the old events.
            $('#blacklistTable').off();
        }

        // Create table.
        let table = $('#blacklistTable').DataTable({
            'searching': true,
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
            },
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'columnDefs': [
                { 'className': 'default-table', 'orderable': false, 'targets': 5 },
                { 'width': '35%', 'targets': 0 },
                { 'width': '25%', 'targets': 3 },
                { 'width': '25%', 'targets': 4 }
            ],
            'columns': [
                { 'title': 'Blacklist' },
                { 'title': 'Regex' },
                { 'title': 'Timeout' },
                { 'title': 'Nachricht' },
                { 'title': 'Grund' },
                { 'title': 'Aktion' }
            ]
        });

        // On delete button.
        table.on('click', '.btn-danger', function() {
            let blacklist = $(this).data('blacklist'),
                row = $(this).parents('tr');

            // Ask the user if he wants to delete the blacklist.
            helpers.getConfirmDeleteModal('blacklist_modal_remove', 'Bist du sicher, dass du diese Blacklist entfernen willst?', true,
                'Die Blacklist wurde erfolgreich entfernt!', function() { // Callback if the user clicks delete.
                socket.removeDBValue('moderation_blacklist_rm', 'blackList', blacklist, function() {
                    socket.sendCommand('moderation_blacklist_rm_cmd', 'reloadmod', function() {
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });
        });

        // On edit button.
        table.on('click', '.btn-warning', function() {
            let blacklist = $(this).data('blacklist');

            socket.getDBValue('moderation_blacklist_edit_get', 'blackList', blacklist, function(e) {
                e = JSON.parse(e.blackList);
                // Get advance modal from our util functions in /utils/helpers.js
                helpers.getAdvanceModal('blacklist-edit-modal', 'Blacklist bearbeiten', 'Speichern', $('<form/>', {
                    'role': 'form'
                })
                // Append a text area box for the phrase.
                .append(helpers.getTextAreaGroup('ban-phrase', 'text', 'Blacklist Phrase', '', e.phrase, 'Phrase, Wort oder Regex, die auf die Blacklist gesetzt werden sollten.', true)
                // Append checkbox for if this should be regex or not.
                .append(helpers.getCheckBox('is-regex', e.isRegex, 'Regex', 'Wenn die Blacklist Phrase regex verwenden soll.')))
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Nachricht', '', e.message, 'Nachricht, die in den Chat gesendet werden soll, wenn ein Benutzer einen Timeout erhält.')
                // Append checkbox for if this should be regex or not.
                .append(helpers.getCheckBox('timeout-message-toggle', e.isSilent, 'Stumm', 'Ob die Warnmeldung gesendet werden soll oder nicht.')))
                // Append input box for the timeout time.
                .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer (Sekunden)', '0', e.timeout,
                    'Wie lange in Sekunden wird der Benutzer beim Verwenden der Phrase im Chat getimedouted. -1 bannt den Benutzer und 0 löscht einfach die Nachricht.'))
                // Add an advance section that can be opened with a button toggle.
                .append($('<div/>', {
                    'class': 'collapse',
                    'id': 'advance-collapse',
                    'style': 'margin-top: 10px;',
                    'html': $('<form/>', {
                        'role': 'form'
                    })
                    // Append ban reason. This is the message Twitch shows with the timeout.
                    .append(helpers.getInputGroup('timeout-reason', 'text', 'Timeout-Grund', '', e.banReason, 'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
                    // Add group for toggles.
                    .append($('<div/>', {
                        'class': 'form-group'
                    })
                    // Tooltip to toggle for regulars to bypass this filter.
                    .append(helpers.getCheckBox('exclude-regulars', e.excludeRegulars, 'Stammzuschauer ausschließen', 'Wenn Stammzuschauern erlaubt sein soll, diesen Filter zu umgehen.'))
                    // Tooltip to toggle for subs to bypass this filter.
                    .append(helpers.getCheckBox('exclude-subscribers', e.excludeSubscribers, 'Abonnenten ausschließen',
                        'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
                // Callback function to be called once we hit the save button on the modal.
                })), function() {
                    let phrase = $('#ban-phrase'),
                        isRegex = $('#is-regex').is(':checked'),
                        banMsg = $('#timeout-banmsg'),
                        isSilent = $('#timeout-message-toggle').is(':checked'),
                        timeoutTime = $('#timeout-timeout-time'),
                        timeoutMsg = $('#timeout-reason'),
                        isReg = $('#exclude-regulars').is(':checked'),
                        isSub = $('#exclude-subscribers').is(':checked');

                    // Add regex prefix is regex.
                    if (isRegex && !phrase.val().startsWith('regex:')) {
                        phrase.val('regex:' + phrase.val());
                    }

                    // Handle each input to make sure they have a value.
                    switch (false) {
                        case helpers.handleInputString(phrase):
                        case helpers.handleInputString(banMsg):
                        case helpers.handleInputString(timeoutTime): // Handle as string even if it's a number.
                        case helpers.handleInputString(timeoutMsg):
                            break;
                        default:
                            // Delete the old blacklist
                            socket.removeDBValue('rm_moderation_blacklist', 'blackList', blacklist, function() {
                                // Update the blacklist
                                socket.updateDBValue('update_moderation_blacklist', 'blackList', phrase.val(), JSON.stringify({
                                    id: 'panel_' + phrase.val(),
                                    timeout: timeoutTime.val(),
                                    isRegex: isRegex,
                                    phrase: phrase.val(),
                                    isSilent: isSilent,
                                    excludeRegulars: isReg,
                                    excludeSubscribers: isSub,
                                    message: banMsg.val(),
                                    banReason: timeoutMsg.val()
                                }), function() {
                                    socket.sendCommand('moderation_blacklist_reload_cmd', 'reloadmod', function() {
                                        // Update the table.
                                        run();
                                        // Close the modal.
                                        $('#blacklist-edit-modal').modal('hide');
                                        // Alert the user.
                                        toastr.success('Blacklist erfolgreich bearbeitet!');
                                    });
                                });
                            });
                    }
                }).modal('toggle');
            });
        });
    });
});

// Function that handlers the loading of events.
$(function() {
    // Add blacklist button
    $('#add-blacklist-button').on('click', function() {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getAdvanceModal('blacklist-add-modal', 'Blacklist hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append a text area box for the phrase.
        .append(helpers.getTextAreaGroup('ban-phrase', 'text', 'Blacklist Phrase', 'Kappa 123', '', 'Phrase, Wort oder Regex, die auf die Blacklist gesetzt werden sollten.', true)
        // Append checkbox for if this should be regex or not.
        .append(helpers.getCheckBox('is-regex', false, 'Regex', 'Wenn die Blacklist Phrase regex verwenden soll.')))
        // Append ban reason. This is the message Twitch shows with the timeout.
        .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Nachricht', '',
            'Sie wurden wegen der Verwendung einer auf der Blacklist stehenden Phrase gesperrt.', 'Nachricht, die im Chat angezeigt wird, wenn ein Benutzer einen Timeout erhält.')
        // Append checkbox for if this should be regex or not.
        .append(helpers.getCheckBox('timeout-message-toggle', false, 'Stumm', 'Ob die Warnmeldung gesendet werden soll oder nicht.')))
        // Append input box for the timeout time.
        .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Dauer', '0', '600',
            'Wie lange in Sekunden wird der Benutzer beim Verwenden der Phrase im Chat getimedouted. -1 bannt den Benutzer und 0 löscht einfach die Nachricht.'))
        // Add an advance section that can be opened with a button toggle.
        .append($('<div/>', {
            'class': 'collapse',
            'id': 'advance-collapse',
            'style': 'margin-top: 10px;',
            'html': $('<form/>', {
                'role': 'form'
            })
            // Append ban reason. This is the message Twitch shows with the timeout.
            .append(helpers.getInputGroup('timeout-reason', 'text', 'Timeout Grund', '', 'Verwendung einer Phrase die auf der Blacklist steht',
                'Nachricht, die allen Moderatoren angezeigt wird, wenn der Benutzer einen Timeout erhält.'))
            // Add group for toggles.
            .append($('<div/>', {
                'class': 'form-group'
            })
            // Tooltip to toggle for regulars to bypass this filter.
            .append(helpers.getCheckBox('exclude-regulars', false, 'Stammzuschauer ausschließen', 'Wenn Stammzuschauer erlaubt sein soll, diesen Filter zu umgehen.'))
            // Tooltip to toggle for subs to bypass this filter.
            .append(helpers.getCheckBox('exclude-subscribers', false, 'Abonnenten ausschließen',
                'Wenn es den Abonnenten erlaubt sein soll, diesen Filter zu umgehen.')))
        })), function() {
            let phrase = $('#ban-phrase'),
                isRegex = $('#is-regex').is(':checked'),
                banMsg = $('#timeout-banmsg'),
                isSilent = $('#timeout-message-toggle').is(':checked'),
                timeoutTime = $('#timeout-timeout-time'),
                timeoutMsg = $('#timeout-reason'),
                isReg = $('#exclude-regulars').is(':checked'),
                isSub = $('#exclude-subscribers').is(':checked');

            // Add regex prefix is regex.
            if (isRegex && !phrase.val().startsWith('regex:')) {
                phrase.val('regex:' + phrase.val());
            }

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(phrase):
                case helpers.handleInputString(banMsg):
                case helpers.handleInputString(timeoutTime): // Handle as string even if it's a number.
                case helpers.handleInputString(timeoutMsg):
                    break;
                default:
                    // Add the blacklist.
                    socket.updateDBValue('add_moderation_blacklist', 'blackList', phrase.val(), JSON.stringify({
                        id: 'panel_' + phrase.val(),
                        timeout: timeoutTime.val(),
                        isRegex: isRegex,
                        phrase: phrase.val(),
                        isSilent: isSilent,
                        excludeRegulars: isReg,
                        excludeSubscribers: isSub,
                        message: banMsg.val(),
                        banReason: timeoutMsg.val()
                    }), function() {
                        socket.sendCommand('moderation_blacklist_reload_cmd', 'reloadmod', function() {
                            // Update the table.
                            run();
                            // Close the modal.
                            $('#blacklist-add-modal').modal('hide');
                            // Alert the user.
                            toastr.success('Blacklist erfolgreich hinzugefügt!');
                        });
                    });
            }
        }).modal('toggle');
    });
});
