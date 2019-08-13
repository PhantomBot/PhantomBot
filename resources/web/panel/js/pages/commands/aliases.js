/*
 * Copyright (c) 2019. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Valentin Sickert <lapotor@lapotor.de>
 */

// Function that querys all of the data we need.
$(run = function() {
    // Check if the module is enabled.
    socket.getDBValue('alias_command_module', 'modules', './commands/customCommands.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.getModuleStatus('aliasesModule', e.modules)) {
            return;
        }

        // Query aliases.
        socket.getDBTableValues('commands_get_aliases', 'aliases', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                tableData.push([
                    '!' + results[i].key,
                    '!' + results[i].value,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-alias': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-alias': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#aliasesTable')) {
                $('#aliasesTable').DataTable().destroy();
                // Remove all of the old events.
                $('#aliasesTable').off();
            }

            // Create table.
            let table = $('#aliasesTable').DataTable({
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
                    { 'title': 'Alias' },
                    { 'title': 'Befehl' },
                    { 'title': 'Aktion' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let alias = $(this).data('alias'),
                    row = $(this).parents('tr');

                // Ask the user if he wants to delete the alias.
                helpers.getConfirmDeleteModal('custom_alias_modal_remove', 'Sind Sie sicher, dass Sie den Alias !' + alias + ' entfernen möchten?', true,
                    'Der Alias !' + alias + ' wurde erfolgreich entfernt!', function() { // Callback if the user clicks delete.
                // Delete all information about the alias.
                    socket.removeDBValue('alias_remove', 'aliases', alias, function() {
                        socket.sendCommand('alias_remove_cmd', 'reloadcommand ' + alias, function() {
                            // Remove the table row.
                            table.row(row).remove().draw(false);
                        });
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let alias = $(this).data('alias'),
                    t = $(this);

                socket.getDBValue('alias_name_get', 'aliases', alias, function(e) {
                    helpers.getModal('edit-alias', 'Alias bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append alias name.
                    .append(helpers.getInputGroup('alias-name', 'text', 'Alias', '', '!' + alias, 'Name des Alias. Dieser kann nicht bearbeitet werden.', true))
                    // Append alias.
                    .append(helpers.getInputGroup('alias-cmd', 'text', 'Befehl', '', '!' + e.aliases, 'Befehl, der vom Alias ausgeführt werden soll.')), function() {// Callback once we click the save button.
                        let aliasCmd = $('#alias-cmd');

                        // Remove the ! and spaces.
                        aliasCmd.val(aliasCmd.val().replace(/(\!|\s)/g, '').toLowerCase());

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(aliasCmd):
                                break;
                            default:
                                // Update the alias.
                                socket.updateDBValue('update_command_alias', 'aliases', alias, aliasCmd.val(), function() {
                                    // Update the table.
                                    t.parents('tr').find('td:eq(1)').text('!' + aliasCmd.val());
                                    // Close the modal.
                                    $('#edit-alias').modal('hide');
                                    // Alert the user.
                                    toastr.success('Alias !' + alias + ' erfolgreich bearbeitet !');
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
    $('#aliasesModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('aliases_commands_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/customCommands.js', run);
    });

    // Add alias button.
    $('#aliascom-button').on('click', function() {
        helpers.getModal('add-alias', 'Alias hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append alias name.
        .append(helpers.getInputGroup('alias-name', 'text', 'Alias', '!cmds', '', 'Name des Alias.'))
        // Append alias.
        .append(helpers.getInputGroup('alias-cmd', 'text', 'Befehl', '!commands', '', 'Befehl, der vom Alias ausgeführt werden soll.')), function() {// Callback once we click the save button.
            let aliasName = $('#alias-name'),
                aliasCmd = $('#alias-cmd');

            // Remove the ! and spaces.
            aliasName.val(aliasName.val().replace(/(\!|\s)/g, '').toLowerCase());
            aliasCmd.val(aliasCmd.val().replace(/\!/g, '').toLowerCase());

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(aliasName):
                case helpers.handleInputString(aliasCmd):
                    break;
                default:
                    // Make sure the alias doesn't exit already.
                    socket.getDBValue('alias_exists', 'aliases', aliasName.val(), function(e) {
                        // If the command exists we stop here.
                        if (e.aliases !== null) {
                            toastr.error('Es ist nicht gelungen, einen Alias hinzuzufügen, da er bereits existiert.');
                            return;
                        }

                        // Add the alias.
                        socket.updateDBValue('add_command_alias', 'aliases', aliasName.val(), aliasCmd.val(), function() {
                            socket.sendCommand('alias_add_cmd', 'reloadcommand', function() {
                                // Reload the table.
                                run();
                                // Close the modal.
                                $('#add-alias').modal('hide');
                                // Alert the user.
                                toastr.success('Alias !' + aliasName.val() + 'erfolgreich hinzugefügt');
                            });
                        });
                    });
            }
        }).modal('toggle');
    });
});
