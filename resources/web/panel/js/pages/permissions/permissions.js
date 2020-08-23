/*
 * Copyright (C) 2016-2020 phantom.bot
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
    // Query permissions.
    socket.getDBTableValues('permissions_get_group', 'group', function(results) {
        let tableData = [];

        for (let i = 0; i < results.length; i++) {
            // Ignore viewers.
            if (results[i].value === '7') {
                continue;
            }

            tableData.push([
                results[i].key,
                helpers.getGroupNameById(results[i].value),
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'style': 'float: right',
                    'data-toggle': 'tooltip',
                    'title': 'Dies setzt die Berechtigung des Benutzers wieder auf den Zuschauer zurück. Zuschauer werden in dieser Liste nicht angezeigt.',
                    'data-username': results[i].key,
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning',
                    'style': 'float: right',
                    'data-username': results[i].key,
                    'html': $('<i/>', {
                        'class': 'fa fa-edit'
                    })
                })).html()
            ]);
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#permissionsTable')) {
            $('#permissionsTable').DataTable().destroy();
            // Remove all of the old events.
            $('#permissionsTable').off();
        }

        // Create table.
        let table = $('#permissionsTable').DataTable({
            'searching': true,
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
            },
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'columnDefs': [
                { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                { 'width': '45%', 'targets': 0 }
            ],
            'columns': [
                { 'title': 'Benutzer' },
                { 'title': 'Berechtigung' },
                { 'title': 'Aktionen' }
            ]
        });

        // On delete button.
        table.on('click', '.btn-danger', function() {
            let username = $(this).data('username'),
                row = $(this).parents('tr'),
                t = $(this);

            // Ask the user if he wants to reset the user's permission.
            helpers.getConfirmDeleteModal('user_permission_modal_remove', 'Sind Sie sicher, dass Sie die Berechtigung von ' + username + ' auf Zuschauer zurücksetzen möchten?', false,
                'Die Berechtigung von ' + username + ' wurde auf Zuschauer zurückgesetzt!', function() {
                // Delete all information about the alias.
                socket.removeDBValue('permission_remove', 'group', username, function() {
                    socket.sendCommand('permission_remove_cmd', 'permissionsetuser ' + username + ' 7', function() {
                        // Hide tooltip.
                        t.tooltip('hide');
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });
        });

        // On edit button.
        table.on('click', '.btn-warning', function() {
            let username = $(this).data('username'),
                t = $(this);

            socket.getDBValue('permission_user_get', 'group', username, function(e) {
                helpers.getModal('edit-user-perm', 'Benutzerrechte bearbeiten', 'Speichern', $('<form/>', {
                    'role': 'form'
                })
                // Append user name.
                .append(helpers.getInputGroup('user-name', 'text', 'Benutzername', '', username, 'Name des Benutzers. Dieser kann nicht bearbeitet werden.', true))
                // Append the group.
                .append(helpers.getDropdownGroup('user-permission', 'Berechtigung', helpers.getGroupNameById(e.group),
                    ['Caster', 'Administrators', 'Moderators', 'Subscribers', 'Donators', 'VIPs', 'Regulars'])),
                // callback once the user hits save.
                function() {
                    let group = helpers.getGroupIdByName($('#user-permission').find(':selected').text());

                    socket.updateDBValue('permission_user_update', 'group', username, group, function() {
                        socket.sendCommand('permission_edit_cmd', 'permissionsetuser ' + username + ' ' + group, function() {
                            // Update the table.
                            t.parents('tr').find('td:eq(1)').text($('#user-permission').find(':selected').text());
                            // Close the modal.
                            $('#edit-user-perm').modal('hide');
                            // Alert the user.
                            toastr.success('Berechtigungen für ' + username + ' erfolgreich aktualisiert.');
                        });
                    });
                }).modal('toggle');
            });
        });
    });
});

// Function that handlers the loading of events.
$(function() {
    // Add user permission button.
    $('#add-permissions-button').on('click', function() {
        helpers.getModal('add-user-perm', 'Benutzerrechte festlegen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append user name.
        .append(helpers.getInputGroup('user-name', 'text', 'Benutzername', 'PhantomBotDE', '', 'Name des Benutzers, auf den die Berechtigung angewendet werden sollen.'))
        // Append the group.
        .append(helpers.getDropdownGroup('user-permission', 'Berechtigung', 'Regulars', ['Caster', 'Administrators', 'Moderators', 'Subscribers', 'Donators', 'VIPs', 'Regulars'])),
        // callback once the user hits save.
        function() {
            let group = helpers.getGroupIdByName($('#user-permission').find(':selected').text()),
                username = $('#user-name');

            // make sure the user added a username.
            switch (false) {
                case helpers.handleInputString(username):
                    break;
                default:
                    socket.updateDBValue('permission_user_add', 'group', username.val().toLowerCase(), group, function() {
                        socket.sendCommand('permission_add_cmd', 'permissionsetuser ' + username.val().toLowerCase() + ' ' + group, function() {
                            // Update the table.
                            run();
                            // Close the modal.
                            $('#add-user-perm').modal('hide');
                            // Alert the user.
                            toastr.success('Berechtigungen für ' + username.val() + ' erfolgreich hinzugefügt!');
                        });
                    });
            }
        }).modal('toggle');
    });
});
