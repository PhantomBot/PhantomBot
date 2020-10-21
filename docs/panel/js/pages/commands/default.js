/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
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
    // Query all commands.
    socket.getDBTableValues('commands_get_all', 'permcom', function(results) {
        socket.getDBTableValues('custom_commands_get_all', 'command', function(customCommands) {
            let tableData = [],
                cmds = [];

            for (let i = 0; i < customCommands.length; i++) {
                cmds.push(customCommands[i].key);
            }

            for (let i = 0; i < results.length; i++) {
                if (cmds.indexOf(results[i].key) !== -1) {
                    continue;
                }

                tableData.push([
                    '!' + results[i].key,
                    helpers.getGroupNameById(results[i].value),
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-toggle': 'tooltip',
                        'title': 'Deletes the command permission and resets it to default on startup. This does not remove the command unless it doesn\'t exist anymore.',
                        'data-command': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fas fa-sm fa-sync-alt'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-command': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fas fa-sm fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#defaultCommandsTable')) {
                $('#defaultCommandsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#defaultCommandsTable').off();
            }

            // Create table.
            let table = $('#defaultCommandsTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table-large', 'orderable': false, 'targets': 2 },
                    { 'width': '45%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Command' },
                    { 'title': 'User Level' },
                    { 'title': 'Actions' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let command = $(this).data('command'),
                    row = $(this).parents('tr'),
                    t = $(this);

                // Ask the user if he want to reset the command.
                helpers.getConfirmDeleteModal('default_command_modal_remove', 'Are you sure you want to reset the command\'s permission?', false,
                        'The command\'s permission has been reset!', function() {
                    socket.removeDBValue('permcom_temp_del', 'permcom', command, function(e) {
                        // Hide tooltip.
                        t.tooltip('hide');
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let command = $(this).data('command'),
                    t = $(this);

                // Get all the info about the command.
                socket.getDBValues('default_command_edit', {
                    tables: ['permcom', 'cooldown', 'pricecom', 'paycom'],
                    keys: [command, command, command, command]
                }, function(e) {
                    let cooldownJson = (e.cooldown === null ? { isGlobal: 'true', seconds: 0 } : JSON.parse(e.cooldown));

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-command', 'Edit Command', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('command-name', 'text', 'Command', '', '!' + command, 'Name of the command. This cannot be edited.', true))
                    // Append a select option for the command permission.
                    .append(helpers.getDropdownGroup('command-permission', 'User Level', helpers.getGroupNameById(e.permcom),
                        ['Caster', 'Administrators', 'Moderators', 'Subscribers', 'Donators', 'VIPs', 'Regulars', 'Viewers']))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'html': $('<form/>', {
                                'role': 'form'
                            })
                            // Append input box for the command cost.
                            .append(helpers.getInputGroup('command-cost', 'number', 'Cost', '0', helpers.getDefaultIfNullOrUndefined(e.pricecom, '0'),
                                'Cost in points that will be taken from the user when running the command.'))
                            // Append input box for the command reward.
                            .append(helpers.getInputGroup('command-reward', 'number', 'Reward', '0', helpers.getDefaultIfNullOrUndefined(e.paycom, '0'),
                                'Reward in points the user will be given when running the command.'))
                            // Append input box for the command cooldown.
                            .append(helpers.getInputGroup('command-cooldown', 'number', 'Cooldown (Seconds)', '5', cooldownJson.seconds,
                                'Cooldown of the command in seconds.')
                                // Append checkbox for if the cooldown is global or per-user.
                                .append(helpers.getCheckBox('command-cooldown-global', cooldownJson.isGlobal === 'true', 'Global',
                                    'If checked the cooldown will be applied to everyone in the channel. When not checked, the cooldown is applied per-user.')))
                            // Callback function to be called once we hit the save button on the modal.
                    })), function() {
                        let commandPermission = $('#command-permission'),
                            commandCost = $('#command-cost'),
                            commandReward = $('#command-reward'),
                            commandCooldown = $('#command-cooldown'),
                            commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputNumber(commandCost):
                            case helpers.handleInputNumber(commandReward):
                            case helpers.handleInputNumber(commandCooldown):
                                break;
                            default:
                                // Save command information here and close the modal.
                                socket.updateDBValues('custom_command_edit', {
                                    tables: ['pricecom', 'paycom'],
                                    keys: [command, command],
                                    values: [commandCost.val(), commandReward.val()]
                                }, function() {
                                    // Add the cooldown to the cache.
                                    socket.wsEvent('default_command_edit_cooldown_ws', './core/commandCoolDown.js', null,
                                        ['add', command, commandCooldown.val(), String(commandCooldownGlobal)], function() {
                                        // Edit the command permission.
                                        socket.sendCommand('default_command_permisison_update', 'permcomsilent ' + command + ' ' +
                                            helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), function() {
                                            // Update user level value.
                                            t.parents('tr').find('td:eq(1)').text(commandPermission.find(':selected').text());
                                            // Close the modal.
                                            $('#edit-command').modal('hide');
                                            // Tell the user the command was edited.
                                            toastr.success('Successfully edited command !' + command);
                                        });
                                    });
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    });
});
