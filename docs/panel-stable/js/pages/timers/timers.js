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

(function (){
    let selected = null;

    function openGroupModal(groupData, cb) {
        const idPrefix = groupData == null ? 'add-' : 'edit-'
        const title = groupData == null ? 'Add Group' : 'Edit Group',
              name = groupData == null ? '' : groupData.name,
              noticeToggle  = groupData == null ? 'Yes' : (groupData.noticeToggle === true ? 'Yes' : 'No'),
              noticeOfflineToggle = groupData == null ? 'No' : (groupData.noticeOfflineToggle === true ? 'Yes' : 'No'),
              intervalMin = groupData == null ? '10' : groupData.intervalMin,
              intervalMax = groupData == null ? '' : (intervalMin === groupData.intervalMax ? '' : groupData.intervalMax),
              reqMessages = groupData == null ? '0' : groupData.reqMessages,
              shuffle = groupData == null ? 'No' : (groupData.shuffle === true ? 'Yes' : 'No');

        helpers.getModal(idPrefix + 'group-modal', title, 'Save',
            $('<form/>', {'role': 'form'})
                /*
                name: "Announcements",
                noticeToggle: noticeToggle,
                noticeOfflineToggle: noticeOffline,
                intervalMin: noticeInterval,
                intervalMax: noticeInterval,
                reqMessages: noticeReqMessages,
                shuffle: false,
                messages: notices
                */
                // Append group name.
                .append(helpers.getInputGroup(idPrefix + 'group-name', 'text', 'Group Name', 'Group Name', name))
                // Append toggle.
                .append(helpers.getDropdownGroup(idPrefix + 'notice-toggle', 'Active', noticeToggle, ['Yes', 'No'], 'If the group should be enabled at all.'))
                // Append offline toggle.
                .append(helpers.getDropdownGroup(idPrefix + 'notice-offline-toggle', 'Active Offline', noticeOfflineToggle, ['Yes', 'No'], "If the group\'s messages should be said in offline chat."))
                // Append interval minimum.
                .append(helpers.getInputGroup(idPrefix + 'notice-interval-min', 'number', 'Timer Interval Minimum (Minutes)', '', intervalMin, 'How long to wait at least before sending another message from this group.'))
                // Append interval minimum.
                .append(helpers.getInputGroup(idPrefix + 'notice-interval-max', 'number', 'Timer Interval Maximum (Minutes)', '', intervalMax, 'How long to wait at most before sending another message from this group. Leave blank for no randomization of the time interval.'))
                // Append required messages.
                .append(helpers.getInputGroup(idPrefix + 'notice-req-messages', 'number', 'Timer Required Messages', '', reqMessages, 'Wait for at least this amount of messages before posting another message from this group in chat.'))
                // Append shuffle.
                .append(helpers.getDropdownGroup(idPrefix + 'group-shuffle', 'Shuffle', shuffle, ['Yes', 'No'], "If the group's messages should be said in random order.")),
            // Callback once the user clicks save.
            function() {// Callback once we click the save button.
                const $groupName = $('#' + idPrefix + 'group-name'),
                      $noticeToggle = $('#' + idPrefix + 'notice-toggle'),
                      $noticeOfflineToggle = $('#' + idPrefix + 'notice-offline-toggle'),
                      $noticeIntervalMin = $('#' + idPrefix + 'notice-interval-min'),
                      $noticeIntervalMax = $('#' + idPrefix + 'notice-interval-max'),
                      $noticeReqMsg = $('#' + idPrefix + 'notice-req-messages'),
                      $groupShuffle = $('#' + idPrefix + 'group-shuffle');

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString($groupName):
                    case helpers.handleInput($noticeIntervalMin, function (obj) {
                        if (obj.val().length === 0) {
                            return "Cannot be empty";
                        }
                        if (!isFinite(obj.val())) {
                            return "Please enter a number.";
                        }
                        const min = parseFloat(obj.val());
                        if (min < 0.25) {
                            return "Number must be greater or equal 0.25";
                        }
                        if (parseFloat($noticeIntervalMax.val()) < min) {
                            return "Number must be less or equal to Timer Interval Maximum";
                        }
                        return null;
                    }):
                    case helpers.handleInput($noticeIntervalMax, function (obj) {
                        if (obj.val().length === 0) {
                            obj.val($noticeIntervalMin.val());
                            return null;
                        }
                        if (!isFinite(obj.val())) {
                            return "Please enter a number or leave blank.";
                        }
                        if (parseFloat($noticeIntervalMin.val()) > parseFloat(obj.val())) {
                            return "Number must be greater or equal to Timer Interval Minimum";
                        }
                        return null;
                    }):
                    case helpers.handleInputNumber($noticeReqMsg):
                        break;
                    default:
                        cb({
                            groupName: $groupName.val(),
                            noticeToggle: $noticeToggle.find(':selected').text() === 'Yes',
                            noticeOfflineToggle: $noticeOfflineToggle.find(':selected').text() === 'Yes',
                            noticeIntervalMin: Number($noticeIntervalMin.val()),
                            noticeIntervalMax: Number($noticeIntervalMax.val() || $noticeIntervalMin.val()),
                            noticeReqMsg: Number($noticeReqMsg.val()),
                            groupShuffle: $groupShuffle.find(':selected').text() === 'Yes'
                        });
                }
            }
        ).modal('toggle');
    }

    // Function that queries all of the data we need.
    function run() {
        // Check if the module is enabled.
        socket.getDBValue('notice_module_toggle', 'modules', './systems/noticeSystem.js', function(e) {
            // If the module is off, don't load any data.
            if (!helpers.handleModuleLoadUp('noticesModule', e.modules)) {
                return;
            }

            // Query timer groups
            socket.getDBTableValues('timers_get_all', 'notices', function(results) {
                let tableData = [];
                for (let i = 0; i < results.length; i++) {
                    const groupId = results[i].key,
                          groupName = JSON.parse(results[i].value).name;
                    tableData.push([
                        groupId,
                        groupName,
                        $('<div/>', {
                            'class': 'btn-group'
                        }).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-danger btn-group-delete',
                            'style': 'float: right',
                            'data-group-id': groupId,
                            'data-group-name': groupName,
                            'html': $('<i/>', { 'class': 'fa fa-trash' })
                        })).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-warning btn-group-settings',
                            'style': 'float: right',
                            'data-group-id': groupId,
                            'data-group-name': groupName,
                            'html': $('<i/>', { 'class': 'fa fa-cog' })
                        })).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-success btn-group-edit',
                            'style': 'float: right',
                            'data-group-id': groupId,
                            'data-group-name': groupName,
                            'html': $('<i/>', { 'class': 'fa fa-edit' })
                        })).html()
                    ]);
                }

                const $groupTable = $('#groups-table');
                // if the table exists, destroy it.
                if ($.fn.DataTable.isDataTable('#groups-table')) {
                    $groupTable.DataTable().destroy();
                    // Remove all of the old events.
                    $groupTable.off();
                }

                // Create groups table.
                let table = $groupTable.DataTable({
                    'searching': true,
                    'autoWidth': false,
                    'lengthChange': false,
                    'data': tableData,
                    'columnDefs': [
                        { 'className': 'default-table', 'width': '70px', 'orderable': false, 'targets': 2 },
                        { 'width': '3%', 'targets': 0 }
                    ],
                    'columns': [
                        { 'title': 'Id' },
                        { 'title': 'Name' },
                        { 'title': 'Actions' }
                    ]
                });

                // On delete button.
                table.on('click', '.btn-group-delete', function() {
                    const groupId = $(this).data('groupId').toString(),
                        groupName = $(this).data('groupName');

                    // Ask the user if he want to remove the timer.
                    helpers.getConfirmDeleteModal('timer_modal_remove_group',
                        'Are you sure you want to permanently delete the timer group "' + groupName + '" with all its messages?', true,
                        'You\'ve successfully removed the group "' + groupName + '"!', function() {
                            // Remove the group
                            socket.wsEvent('timer_group_remove_ws', './systems/noticeSystem.js', null,
                                ['removeGroup', groupId], function() {
                                    // Reload the table.
                                    run();
                                }
                            );
                        }
                    );
                });

                // On edit group button.
                table.on('click', '.btn-group-settings', function() {
                    const groupId = $(this).data('groupId').toString(),
                          $this = $(this);

                    socket.getDBValue('timer_group_edit_get', 'notices', groupId, function(e) {
                        let groupData = e.notices;
                        if (groupData == null) {
                            run();  // group doesn't exist anymore => reload
                        }
                        groupData = JSON.parse(groupData);
                        openGroupModal(groupData, function(result) {
                            socket.updateDBValue('timer_group_edit_update', 'notices', groupId, JSON.stringify({
                                name: result.groupName,
                                noticeToggle: result.noticeToggle,
                                noticeOfflineToggle: result.noticeOfflineToggle,
                                intervalMin: result.noticeIntervalMin,
                                intervalMax: result.noticeIntervalMax,
                                reqMessages: result.noticeReqMsg,
                                shuffle: result.groupShuffle,
                                messages: groupData.messages,
                                disabled: groupData.disabled,
                            }), function () {
                                socket.wsEvent('timer_group_edit_ws', './systems/noticeSystem.js', null,
                                    ['reloadGroup', groupId], function() {
                                        // Update group name in table.
                                        $this.parents('tr').find('td:eq(1)').text(result.groupName);
                                        if (selected === Number(groupId)) {
                                            // reload the messages table
                                            showGroupMessages(selected);
                                        }
                                        // Close the modal.
                                        $('#edit-group-modal').modal('hide');
                                        // Alert the user.
                                        toastr.success('Successfully edited the timer group!');
                                    }
                                );
                            });
                        });
                    });
                });

                // On edit button.
                table.on('click', '.btn-group-edit', function() {
                    const groupId = Number($(this).data('groupId'));
                    showGroupMessages(groupId);
                });

                if (selected == null) {
                    if (results.length > 0) {
                        showGroupMessages(0);
                    } else {
                        showGroupMessages(null)
                    }
                } else {
                    if (selected >= results.length) {
                        showGroupMessages(results.length - 1);
                    } else if (selected < 0) {
                        showGroupMessages(results.length + (selected % results.length));
                    } else {
                        showGroupMessages(selected);
                    }
                }
            });
        });
    }
    $(run);

    function showGroupMessages(groupId) {
        selected = groupId;
        const $messageBox = $('#messages-box');
        const $messagesTable = $('#messages-table');
        if (groupId == null) {
            $messageBox.addClass("hidden");
            return;
        }

        socket.getDBValue('timer_messages_edit_get', 'notices', String(groupId), function(e) {
            let groupData = e.notices;
            if (groupData == null) {
                run();  // group doesn't exist anymore => reload
                return;
            }
            groupData = JSON.parse(groupData);

            function messageRowData(i) {
                return [
                    i,
                    groupData.messages[i],
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger btn-group-delete',
                        'style': 'float: right',
                        'data-message-id': i,
                        'html': $('<i/>', { 'class': 'fa fa-trash' })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-success btn-group-edit',
                        'style': 'float: right',
                        'data-message-id': i,
                        'html': $('<i/>', { 'class': 'fa fa-edit' })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-group-toggle btn-' + (groupData.disabled[i] ? 'warning' : 'success'),
                        'data-toggle': 'tooltip',
                        'title': (groupData.disabled[i] ? 'Click to enable the notice.' : 'Click to disable the notice.'),
                        'style': 'float: right',
                        'data-message-id': i,
                        'html': $('<i/>', {
                            'class': 'fa fa-' + (groupData.disabled[i] ? 'check' : 'close')
                        })
                    })).html()
                ];
            }

            $messageBox.find(".box-title > span").text(groupData.name);

            let tableData = [];
            for (let i = 0; i < groupData.messages.length; i++) {
                tableData.push(messageRowData(i));
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#messages-table')) {
                $messagesTable.DataTable().destroy();
                // Remove all of the old events.
                $messagesTable.off();
            }

            // Create messages table.
            let table = $messagesTable.DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'width': '70px', 'orderable': false, 'targets': 2 },
                    { 'width': '3%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Id' },
                    { 'title': 'Text' },
                    { 'title': 'Actions' }
                ]
            });

            // Add message button.
            $('#add-message-button').off('click').on('click', function() {
                helpers.getModal('add-message', 'Add Message', 'Save',
                    $('<form/>', { 'role': 'form'})
                        // Append timer text.
                        .append(helpers.getTextAreaGroup('message-text', 'text', 'Message', 'Follow me on Twitter! https://twitter.com/PhantomBotApp', '', 'Message of this timer. Use the "command:" prefix then the name of the command to run a command.')),
                    // Callback once the user clicks save.
                    function() {// Callback once we click the save button.
                        const $messageText = $('#message-text');

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString($messageText):
                                break;
                            default:
                                groupData.messages.push($messageText.val());
                                groupData.disabled.push(false);
                                socket.updateDBValue('timer_group_add_message_update', 'notices', String(groupId), JSON.stringify(groupData), function () {
                                    socket.wsEvent('timer_group_add_message_ws', './systems/noticeSystem.js', null,
                                        ['reloadGroup', String(groupId)], function() {
                                            // Update group name in table.
                                            table.rows.add([messageRowData(groupData.messages.length - 1)]);
                                            table.draw(false);
                                            // Close the modal.
                                            $('#add-message').modal('hide');
                                            // Alert the user.
                                            toastr.success('Successfully added message!');
                                        }
                                    );
                                });
                        }
                    }
                ).modal('toggle');
            });

            // Delete message button
            table.on('click', '.btn-group-delete', function() {
                const messageId = Number($(this).data('messageId'));
                // Ask the user if he want to remove the timer.
                helpers.getConfirmDeleteModal('timer_modal_remove_message',
                    'Are you sure you want to permanently delete the message?', true,
                    'You\'ve successfully removed the message!', function() {
                        // Remove the message
                        groupData.messages.splice(messageId, 1);
                        groupData.disabled.splice(messageId, 1);
                        table.rows(messageId).remove();
                        table.draw(false);
                        socket.updateDBValue('timer_group_remove_message_update', 'notices', String(groupId), JSON.stringify(groupData), function () {
                            socket.wsEvent('timer_group_remove_message_ws', './systems/noticeSystem.js', null,
                                ['reloadGroup', String(groupId)], function () { }
                            );
                        });
                    }
                );
            });

            // Edit message button.
            table.on('click', '.btn-group-edit', function() {
                const messageId = Number($(this).data('messageId'));
                helpers.getModal('edit-message', 'Edit Message', 'Save',
                    $('<form/>', { 'role': 'form'})
                        // Append timer text.
                        .append(helpers.getTextAreaGroup('message-text', 'text', 'Message', 'Follow me on Twitter! https://twitter.com/PhantomBotApp', groupData.messages[messageId], 'Message of this timer. Use the "command:" prefix then the name of the command to run a command.')),
                    // Callback once the user clicks save.
                    function() {// Callback once we click the save button.
                        const $messageText = $('#message-text');

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString($messageText):
                                break;
                            default:
                                groupData.messages[messageId] = $messageText.val();
                                socket.updateDBValue('timer_group_add_message_update', 'notices', String(groupId), JSON.stringify(groupData), function () {
                                    socket.wsEvent('timer_group_add_message_ws', './systems/noticeSystem.js', null,
                                        ['reloadGroup', String(groupId)], function() {
                                            // Update group name in table.
                                            table.row(messageId).data(messageRowData(messageId));
                                            table.draw(false);
                                            // Close the modal.
                                            $('#edit-message').modal('hide');
                                            // Alert the user.
                                            toastr.success('Successfully edited message!');
                                        }
                                    );
                                });
                        }
                    }
                ).modal('toggle');
            });

            // Toggle message button.
            table.on('click', '.btn-group-toggle', function() {
                const $this = $(this);
                const messageId = Number($this.data('messageId'));
                groupData.disabled[messageId] = !groupData.disabled[messageId];
                socket.updateDBValue('timer_group_toggle_message_update', 'notices', String(groupId), JSON.stringify(groupData), function () {
                    socket.wsEvent('timer_group_toggle_message_ws', './systems/noticeSystem.js', null,
                        ['reloadGroup', String(groupId)], function() {
                            toastr.success('successfully ' + (!groupData.disabled[messageId] ? 'enabled' : 'disabled') + ' the notice.');
                            // Update the button.
                            if (groupData.disabled[messageId]) {
                                $this.removeClass('btn-success').addClass('btn-warning').find('i').removeClass('fa-close').addClass('fa-check');
                                $this.prop('title', 'Click to enable the notice.').tooltip('fixTitle').tooltip('show');
                            } else {
                                $this.removeClass('btn-warning').addClass('btn-success').find('i').removeClass('fa-check').addClass('fa-close');
                                $this.prop('title', 'Click to disable the notice.').tooltip('fixTitle').tooltip('show');
                            }
                        }
                    );
                });
            });

            $messageBox.removeClass("hidden");
        });
    }

    // Function that handlers the loading of events.
    $(function() {
        // Toggle for the module.
        $('#noticesModuleToggle').on('change', function() {
            // Enable the module then query the data.
            socket.sendCommandSync('notices_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/noticeSystem.js', run);
        });

        // On add group button.
        $("#btn-add-group").on('click', function() {
            openGroupModal(null, function(result) {
                socket.wsEvent('timer_group_appended_ws', './systems/noticeSystem.js', null,
                    ['appendGroup', JSON.stringify({
                        name: result.groupName,
                        noticeToggle: result.noticeToggle,
                        noticeOfflineToggle: result.noticeOfflineToggle,
                        intervalMin: result.noticeIntervalMin,
                        intervalMax: result.noticeIntervalMax,
                        reqMessages: result.noticeReqMsg,
                        shuffle: result.groupShuffle,
                        messages: []
                    })], function() {
                        // Close the modal.
                        $('#add-group-modal').modal('hide');
                        // Alert the user.
                        toastr.success('Successfully added the timer group!');
                        selected = -1;
                        // Reload the table.
                        run();
                    }
                );
            });
        });
    });
})();
