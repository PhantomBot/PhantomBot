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

$(function() {
    const loadExternalCommands = function() {
        // query external commands
        socket.getDBTableValues('commands_get_external', 'externalCommands', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                tableData.push([
                    '!' + results[i].key,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-command': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).html()
                ]);
            }

            const $externalCommandsTable = $('#externalCommandsTable');

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#externalCommandsTable')) {
                $externalCommandsTable.DataTable().destroy();
                // Remove all of the old events.
                $externalCommandsTable.off();
            }

            // Create table.
            let table = $externalCommandsTable.DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    {
                        'className': 'default-table',
                        'orderable': false,
                        'targets': 1
                    },
                ],
                'columns': [
                    {'title': 'External Command'},
                    {'title': 'Actions'}
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let command = $(this).data('command'),
                    row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Are you sure you want to remove the external command !' + command + '?', true,
                    'The external command !' + command + ' has been successfully removed!', function() {
                        // Delete all information about the command.
                        socket.removeDBValues('external_command_remove', {
                            tables: ['externalCommands'],
                            keys: [command]
                        }, function() {
                            socket.wsEvent('external_command_remove_ws', './commands/customCommands.js', null, ['remove', String(command)], function() {
                                // Remove the table row.
                                table.row(row).remove().draw(false);
                            });
                        });
                    });
            });
        });
    };

    const init = function() {
        // Check if the module is enabled.
        socket.getDBValue('custom_command_module', 'modules', './commands/customCommands.js', function(e) {
            // If the module is off, don't load any data.
            if (helpers.handleModuleLoadUp('externalCommandsModule', e.modules)) {
                loadExternalCommands();
            }
        });
    };
    init();


    // Toggle for the module.
    $('#externalCommandsModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('custom_commands_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/customCommands.js', init);
    });

    // Add external command button.
    $('#addextcom-button').on('click', function() {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getModal('add-ext-command', 'Add External Command', 'Save', $('<form/>', {
            'role': 'form'
        })
        // Append input box for the command name.
        .append(helpers.getInputGroup('command-name', 'text', 'Command', '!example')),
        // Append a text box for the command response.
        function() {
            let commandName = $('#command-name');
            // Remove the ! and spaces.
            commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

            // Handle each input to make sure they have a value.
            if (!helpers.handleInputString(commandName)) {
                return;
            }
            // Make sure the command doesn't exist already.
            socket.getDBValue('external_command_exists', 'externalCommands', commandName.val(), function(e) {
                // If the command exists we stop here.
                if (e.externalCommands !== null) {
                    toastr.error('Failed to add external command as it already exists.');
                    return;
                }

                // Save command information here and close the modal.
                socket.updateDBValues('external_command_add', {
                    tables: ['externalCommands'],
                    keys: [commandName.val()],
                    values: [true]
                }, function() {
                    // Reload the table.
                    loadExternalCommands();
                    // Close the modal.
                    $('#add-ext-command').modal('hide');
                    // Tell the user the command was added.
                    toastr.success('Successfully added external command !' + commandName.val());
                });
            });
        }).modal('toggle');
    });
});
