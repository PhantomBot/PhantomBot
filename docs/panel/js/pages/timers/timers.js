/*
 * Copyright (C) 2016-2020 phantombot.tv
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
    // Check if the module is enabled.
    socket.getDBValue('notice_module_toggle', 'modules', './systems/noticeSystem.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('noticesModule', e.modules)) {
            return;
        }

        // Query aliases.
        socket.getDBTableValues('timers_get_all', 'notices', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                // Strip the "message_" part to get the ID.
                results[i].key = results[i].key.substring(8);

                tableData.push([
                    results[i].key,
                    results[i].value,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-notice': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fas fa-sm fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-notice': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fas fa-sm fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#timersTable')) {
                $('#timersTable').DataTable().destroy();
                // Remove all of the old events.
                $('#timersTable').off();
            }

            // Create table.
            let table = $('#timersTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '3%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Id' },
                    { 'title': 'Message' },
                    { 'title': 'Actions' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let timerId = $(this).data('notice');

                // Ask the user if he want to remove the timer.
                helpers.getConfirmDeleteModal('timer_modal_remove', 'Are you sure you want to remove timer with ID ' + timerId + '?', true,
                    'You\'ve successfully removed timer with ID ' + timerId + '!', function() {
                    // Remove the timer
                    socket.sendCommand('notice_remove_cmd', 'notice removesilent ' + timerId, function() {
                        // Reload the table.
                        run();
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let notice = $(this).data('notice'),
                    t = $(this);

                socket.getDBValue('notice_get_edit', 'notices', 'message_' + notice, function(e) {
                    helpers.getModal('edit-timer', 'Edit Timer', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    // Append timer text.
                    .append(helpers.getTextAreaGroup('notice-text', 'text', 'Timer Message', '', e.notices, 'Message of this timer. Use the "command:" prefix then the name of the command to run a command.')),
                    // Callback once the user clicks save.
                    function() {// Callback once we click the save button.
                        let noticeText = $('#notice-text');

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(noticeText):
                                break;
                            default:
                                // Edit the timer
                                socket.sendCommand('notice_edit_cmd', 'notice editsilent ' + notice + ' ' + noticeText.val(), function() {
                                    // Update the table.
                                    t.parents('tr').find('td:eq(1)').text(noticeText.val());
                                    // Close the modal.
                                    $('#edit-timer').modal('hide');
                                    // Alert the user.
                                    toastr.success('Successfully edited the timer!');
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    });
});

// Function that handlers the loading of events.
$(function() {
    // Toggle for the module.
    $('#noticesModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('notices_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/noticeSystem.js', run);
    });

    // Add timer button.
    $('#add-timer-button').on('click', function() {
        helpers.getModal('add-timer', 'Add Timer', 'Save', $('<form/>', {
            'role': 'form'
        })
        // Append timer text.
        .append(helpers.getTextAreaGroup('notice-text', 'text', 'Timer Message', 'Follow me on Twitter! https://twitter.com/PhantomBotApp', '', 'Message of this timer. Use the "command:" prefix then the name of the command to run a command.')),
        // Callback once the user clicks save.
        function() {// Callback once we click the save button.
            let noticeText = $('#notice-text');

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(noticeText):
                    break;
                default:
                    // Edit the timer
                    socket.sendCommand('notice_add_cmd', 'notice addsilent ' + noticeText.val(), function() {
                        // Update the table.
                        run();
                        // Close the modal.
                        $('#add-timer').modal('hide');
                        // Alert the user.
                        toastr.success('Successfully added the timer!');
                    });
            }
        }).modal('toggle');
    });

    // Notice settings button.
    $('#timer-settings-button').on('click', function() {
        socket.getDBValues('notice_get_settings', {
            tables: ['noticeSettings', 'noticeSettings', 'noticeSettings', 'noticeSettings'],
            keys: ['reqmessages', 'interval', 'noticetoggle', 'noticeOfflineToggle']
        }, true, function(e) {
            helpers.getModal('settings-timer', 'Timer Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Append alias name.
            .append(helpers.getInputGroup('notice-interval', 'number', 'Timer Interval (Minutes)', '', e.interval, 'Interval at which a random timer is said in chat.'))
            // Append alias name.
            .append(helpers.getInputGroup('notice-reqmsg', 'number', 'Timer Required Messages', '', e.reqmessages, 'Amount of message required to trigger a random timer along with the interval.'))
            // Append toggle.
            .append(helpers.getDropdownGroup('notice-toggle', 'Active Timers', (e.noticetoggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'], 'If the timers should be enabled.'))
            // Append offline toggle.
            .append(helpers.getDropdownGroup('notice-offline-toggle', 'Active Offline Timers', (e.noticeOfflineToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'], 'If the timers should be said in offline chat.')),
            // Callback once the user clicks save.
            function() {// Callback once we click the save button.
                let noticeInterval = $('#notice-interval'),
                    noticeReqMsg = $('#notice-reqmsg'),
                    noticeToggle = $('#notice-toggle').find(':selected').text() === 'Yes',
                    noticeOfflineToggle = $('#notice-offline-toggle').find(':selected').text() === 'Yes';

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputNumber(noticeInterval):
                    case helpers.handleInputNumber(noticeReqMsg):
                        break;
                    default:
                        socket.updateDBValues('notices_update_settings', {
                            tables: ['noticeSettings', 'noticeSettings', 'noticeSettings', 'noticeSettings'],
                            keys: ['reqmessages', 'interval', 'noticetoggle', 'noticeOfflineToggle'],
                            values: [noticeReqMsg.val(), noticeInterval.val(), noticeToggle, noticeOfflineToggle]
                        }, function() {
                            socket.sendCommand('notices_update_settings_cmd', 'reloadnotice', function() {
                                // Close the modal.
                                $('#settings-timer').modal('hide');
                                // Alert the user.
                                toastr.success('Successfully updated timer settings');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
