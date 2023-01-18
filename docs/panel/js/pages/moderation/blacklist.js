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
$(run = function () {
    // Query blacklist.
    socket.getDBTableValues('moderation_blacklist_get', 'blackList', function (results) {
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
            $('#blacklistTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
            return;
        }

        // Create table.
        let table = $('#blacklistTable').DataTable({
            'searching': true,
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'columnDefs': [
                {'className': 'default-table', 'orderable': false, 'targets': 5},
                {'width': '35%', 'targets': 0},
                {'width': '25%', 'targets': 3},
                {'width': '25%', 'targets': 4}
            ],
            'columns': [
                {'title': 'Blacklist'},
                {'title': 'Regex'},
                {'title': 'Timeout'},
                {'title': 'Message'},
                {'title': 'Reason'},
                {'title': 'Actions'}
            ]
        });

        // On delete button.
        table.on('click', '.btn-danger', function () {
            let blacklist = $(this).data('blacklist'),
                    row = $(this).parents('tr');

            // Ask the user if he wants to delete the blacklist.
            helpers.getConfirmDeleteModal('blacklist_modal_remove', 'Are you sure you want to remove this blacklist?', true,
                    'The blacklist has been successfully removed!', function () { // Callback if the user clicks delete.
                        socket.removeDBValue('moderation_blacklist_rm', 'blackList', blacklist, function () {
                            socket.sendCommand('moderation_blacklist_rm_cmd', 'reloadmod', function () {
                                // Remove the table row.
                                table.row(row).remove().draw(false);
                            });
                        });
                    });
        });

        // On edit button.
        table.on('click', '.btn-warning', function () {
            let blacklist = $(this).data('blacklist');

            socket.getDBValue('moderation_blacklist_edit_get', 'blackList', blacklist, function (e) {
                e = JSON.parse(e.blackList);
                // Get advance modal from our util functions in /utils/helpers.js
                helpers.getAdvanceModal('blacklist-edit-modal', 'Edit Blacklist', 'Save', $('<form/>', {
                    'role': 'form'
                })
                        // Append a text area box for the phrase.
                        .append(helpers.getTextAreaGroup('ban-phrase', 'text', 'Blacklist Phrase', '', e.phrase, 'Phrase, word, or regex that should be blacklisted.', true)
                                // Append checkbox for if this should be regex or not.
                                .append(helpers.getCheckBox('is-regex', e.isRegex, 'Regex', 'If the blacklist phrase should be using regex.')))
                        // Append ban reason. This is the message Twitch shows with the timeout.
                        .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Message', '', e.message, 'Message said in chat when a user gets timed-out.')
                                // Append checkbox for if this should be regex or not.
                                .append(helpers.getCheckBox('timeout-message-toggle', e.isSilent, 'Silent', 'If the warning message should be said or not.')))
                        // Append input box for the timeout time.
                        .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration (Seconds)', '0', e.timeout,
                                'How long in seconds the user gets timed-out for when using the phrase in chat. -1 will ban the user and 0 will just delete the message.'))
                        // Add an advance section that can be opened with a button toggle.
                        .append($('<div/>', {
                            'class': 'collapse',
                            'id': 'advance-collapse',
                            'style': 'margin-top: 10px;',
                            'html': $('<form/>', {
                                'role': 'form'
                            })
                                    // Append ban reason. This is the message Twitch shows with the timeout.
                                    .append(helpers.getInputGroup('timeout-reason', 'text', 'Timeout Reason', '', e.banReason, 'Message shown to all moderators when the user gets timed-out.'))
                                    // Add group for toggles.
                                    .append($('<div/>', {
                                        'class': 'form-group'
                                    })
                                            // Tooltip to toggle for regulars to bypass this filter.
                                            .append(helpers.getCheckBox('exclude-regulars', e.excludeRegulars, 'Exclude Regulars', 'If regulars should be allowed to bypass this filter.'))
                                            // Tooltip to toggle for subs to bypass this filter.
                                            .append(helpers.getCheckBox('exclude-subscribers', e.excludeSubscribers, 'Exclude Subscribers',
                                                    'If subscribers should be allowed to bypass this filter.'))
                                            // Tooltip to toggle for subs to bypass this filter.
                                            .append(helpers.getCheckBox('exclude-vips', e.excludeVips, 'Exclude VIPs',
                                                    'If vips should be allowed to bypass this filter.')))
                                    // Callback function to be called once we hit the save button on the modal.
                        })), function () {
                    let phrase = $('#ban-phrase'),
                            isRegex = $('#is-regex').is(':checked'),
                            banMsg = $('#timeout-banmsg'),
                            isSilent = $('#timeout-message-toggle').is(':checked'),
                            timeoutTime = $('#timeout-timeout-time'),
                            timeoutMsg = $('#timeout-reason'),
                            isReg = $('#exclude-regulars').is(':checked'),
                            isSub = $('#exclude-subscribers').is(':checked'),
                            isVip = $('#exclude-vips').is(':checked');

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
                            socket.removeDBValue('rm_moderation_blacklist', 'blackList', blacklist, function () {
                                // Update the blacklist
                                socket.updateDBValue('update_moderation_blacklist', 'blackList', phrase.val(), JSON.stringify({
                                    id: 'panel_' + phrase.val(),
                                    timeout: timeoutTime.val(),
                                    isRegex: isRegex,
                                    phrase: phrase.val(),
                                    isSilent: isSilent,
                                    excludeRegulars: isReg,
                                    excludeSubscribers: isSub,
                                    excludeVips: isVip,
                                    message: banMsg.val(),
                                    banReason: timeoutMsg.val()
                                }), function () {
                                    socket.sendCommand('moderation_blacklist_reload_cmd', 'reloadmod', function () {
                                        // Update the table.
                                        run();
                                        // Close the modal.
                                        $('#blacklist-edit-modal').modal('hide');
                                        // Alert the user.
                                        toastr.success('Successfully edited blacklist!');
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
$(function () {
    // Add blacklist button
    $('#add-blacklist-button').on('click', function () {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getAdvanceModal('blacklist-add-modal', 'Add Blacklist', 'Save', $('<form/>', {
            'role': 'form'
        })
                // Append a text area box for the phrase.
                .append(helpers.getTextAreaGroup('ban-phrase', 'text', 'Blacklist Phrase', 'Kappa 123', '', 'Phrase, word, or regex that should be blacklisted.', true)
                        // Append checkbox for if this should be regex or not.
                        .append(helpers.getCheckBox('is-regex', false, 'Regex', 'If the blacklist phrase should be using regex.')))
                // Append ban reason. This is the message Twitch shows with the timeout.
                .append(helpers.getInputGroup('timeout-banmsg', 'text', 'Timeout Message', '',
                        'You were timed-out for using a blacklisted phrase.', 'Message said in chat when a user gets timed-out.')
                        // Append checkbox for if this should be regex or not.
                        .append(helpers.getCheckBox('timeout-message-toggle', false, 'Silent', 'If the warning message should be said or not.')))
                // Append input box for the timeout time.
                .append(helpers.getInputGroup('timeout-timeout-time', 'number', 'Timeout Duration', '0', '600',
                        'How long in seconds the user gets timed-out for when using the phrase in chat. -1 will ban the user.'))
                // Add an advance section that can be opened with a button toggle.
                .append($('<div/>', {
                    'class': 'collapse',
                    'id': 'advance-collapse',
                    'style': 'margin-top: 10px;',
                    'html': $('<form/>', {
                        'role': 'form'
                    })
                            // Append ban reason. This is the message Twitch shows with the timeout.
                            .append(helpers.getInputGroup('timeout-reason', 'text', 'Timeout Reason', '', 'Using a blacklisted phrase',
                                    'Message shown to all moderators when the user gets timed-out.'))
                            // Add group for toggles.
                            .append($('<div/>', {
                                'class': 'form-group'
                            })
                                    // Tooltip to toggle for regulars to bypass this filter.
                                    .append(helpers.getCheckBox('exclude-regulars', false, 'Exclude Regulars', 'If regulars should be allowed to bypass this filter.'))
                                    // Tooltip to toggle for subs to bypass this filter.
                                    .append(helpers.getCheckBox('exclude-subscribers', false, 'Exclude Subscribers',
                                            'If subscribers should be allowed to bypass this filter.'))
                                    // Tooltip to toggle for vips to bypass this filter.
                                    .append(helpers.getCheckBox('exclude-vips', false, 'Exclude VIPs',
                                            'If vips should be allowed to bypass this filter.')))
                })), function () {
            let phrase = $('#ban-phrase'),
                    isRegex = $('#is-regex').is(':checked'),
                    banMsg = $('#timeout-banmsg'),
                    isSilent = $('#timeout-message-toggle').is(':checked'),
                    timeoutTime = $('#timeout-timeout-time'),
                    timeoutMsg = $('#timeout-reason'),
                    isReg = $('#exclude-regulars').is(':checked'),
                    isSub = $('#exclude-subscribers').is(':checked'),
                    isVip = $('#exclude-vips').is(':checked');

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
                        excludeVips: isVip,
                        message: banMsg.val(),
                        banReason: timeoutMsg.val()
                    }), function () {
                        socket.sendCommand('moderation_blacklist_reload_cmd', 'reloadmod', function () {
                            // Update the table.
                            run();
                            // Close the modal.
                            $('#blacklist-add-modal').modal('hide');
                            // Alert the user.
                            toastr.success('Successfully added blacklist!');
                        });
                    });
            }
        }).modal('toggle');
    });
});
