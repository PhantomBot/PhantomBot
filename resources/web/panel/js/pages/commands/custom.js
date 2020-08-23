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
    // Check if the module is enabled.
    socket.getDBValue('custom_command_module', 'modules', './commands/customCommands.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('customCommandsModule', e.modules)) {
            return;
        }
        // Query custom commands.
        socket.getDBTableValues('commands_get_custom', 'command', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                tableData.push([
                    '!' + results[i].key,
                    results[i].value,
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
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-command': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#customCommandsTable')) {
                $('#customCommandsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#customCommandsTable').off();
            }

            // Create table.
            let table = $('#customCommandsTable').DataTable({
                'searching': true,
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '15%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Befehl' },
                    { 'title': 'Antwort' },
                    { 'title': 'Aktionen' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let command = $(this).data('command'),
                    row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Sind Sie sicher, dass Sie den Befehl !' + command + ' entfernen möchten?', true,
                    'Der Befehl !' + command + ' wurde erfolgreich entfernt!', function () {
                    // Delete all information about the command.
                    socket.removeDBValues('custom_command_remove', {
                        tables: ['command', 'permcom', 'cooldown', 'aliases', 'pricecom', 'paycom', 'commandtoken'],
                        keys: [command, command, command, command, command, command, command]
                    }, function() {
                        socket.wsEvent('custom_command_remove_ws', './commands/customCommands.js', null, ['remove', String(command)], function() {
                            // Remove the table row.
                            table.row(row).remove().draw(false);
                        });
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let command = $(this).data('command'),
                    t = $(this);

                // Get all the info about the command.
                socket.getDBValues('custom_command_edit', {
                    tables: ['command', 'permcom', 'cooldown', 'pricecom', 'paycom'],
                    keys: [command, command, command, command, command]
                }, function(e) {
                    let cooldownJson = (e.cooldown === null ? { isGlobal: 'true', seconds: 0 } : JSON.parse(e.cooldown));

                    let tokenButton = '';

                    if (e.command.match(/\(customapi/gi) !== null) {
                        tokenButton = $('<button/>', {
                            'type': 'button',
                            'class': 'btn',
                            'style': 'float: right; position: relative; bottom: 6px;',
                            'data-command': command,
                            'click': function() {
                                tokenEditModal($(this).data('command'));
                            },
                            'text': 'Add/Edit Befehls Token'
                        });
                    }

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-command', 'Befehl Bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('command-name', 'text', 'Befehl', '', '!' + command, 'Name des Befehls. Dieser kann nicht bearbeitet werden.', true))
                    // Append a text box for the command response.
                    .append(helpers.getTextAreaGroup('command-response', 'text', 'Antwort', '', e.command, 'Antwort des Befehls. Verwenden Sie die Eingabetaste für mehrere Chat-Linien, maximal 5.'))
                    .append(tokenButton)
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
                            .append(helpers.getInputGroup('command-cost', 'number', 'Kosten', '0', helpers.getDefaultIfNullOrUndefined(e.pricecom, '0'),
                                'Kosten in Punkten, die dem Benutzer bei der Ausführung des Befehls abgezogen werden.'))
                            // Append input box for the command reward.
                            .append(helpers.getInputGroup('command-reward', 'number', 'Belohnung', '0', helpers.getDefaultIfNullOrUndefined(e.paycom, '0'),
                                'Belohnung in Punkten, die der Benutzer beim Ausführen des Befehls erhalten soll.'))
                            // Append input box for the command cooldown.
                            .append(helpers.getInputGroup('command-cooldown', 'number', 'Abklingzeit (Sekunden)', '5', cooldownJson.seconds,
                                'Abklingzeit des Befehls in Sekunden.')
                                // Append checkbox for if the cooldown is global or per-user.
                                .append(helpers.getCheckBox('command-cooldown-global', cooldownJson.isGlobal === 'true', 'Global',
                                    'Wenn diese Option aktiviert ist, wird die Abklingzeit auf alle im Kanal angewendet. Wenn diese Option nicht aktiviert ist, wird die Abklingzeit pro Benutzer angewendet.')))
                        // Callback function to be called once we hit the save button on the modal.
                    })), function() {
                        let commandName = $('#command-name'),
                            commandResponse = $('#command-response'),
                            commandPermission = $('#command-permission'),
                            commandCost = $('#command-cost'),
                            commandReward = $('#command-reward'),
                            commandCooldown = $('#command-cooldown'),
                            commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

                        // Remove the ! and spaces.
                        commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(commandName):
                            case helpers.handleInputString(commandResponse):
                            case helpers.handleInputNumber(commandCost):
                            case helpers.handleInputNumber(commandReward):
                            case helpers.handleInputNumber(commandCooldown):
                                break;
                            default:

                                // Save command information here and close the modal.
                                socket.updateDBValues('custom_command_edit', {
                                    tables: ['pricecom', 'permcom', 'paycom', 'command'],
                                    keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                                    values: [commandCost.val(), helpers.getGroupIdByName(commandPermission.find(':selected').text(), true),
                                            commandReward.val(), commandResponse.val()]
                                }, function() {
                                    // Register the custom command with the cache.
                                    socket.wsEvent('custom_command_edit_ws', './commands/customCommands.js', null, ['edit', String(commandName.val()),
                                        commandResponse.val()], function() {
                                        // Add the cooldown to the cache.
                                        socket.wsEvent('custom_command_edit_cooldown_ws', './core/commandCoolDown.js', null,
                                            ['add', commandName.val(), commandCooldown.val(), String(commandCooldownGlobal)], function() {
                                            // Update command permission.
                                            socket.sendCommand('edit_command_permission_cmd', 'permcomsilent ' + commandName.val() + ' ' +
                                                helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), function() {
                                                // Update the command response
                                                t.parents('tr').find('td:eq(1)').text(commandResponse.val());
                                                // Close the modal.
                                                $('#edit-command').modal('hide');
                                                // Tell the user the command was edited.
                                                toastr.success('Successfully edited command !' + commandName.val());
                                            });
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

// Function that handlers the loading of events.
$(function() {
    // Toggle for the module.
    $('#customCommandsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('custom_commands_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/customCommands.js', run);
    });

    // Add command button.
    $('#addcom-button').on('click', function () {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getAdvanceModal('add-command', 'Befehl hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
            // Append input box for the command name.
            .append(helpers.getInputGroup('command-name', 'text', 'Befehl', '!example'))
            // Append a text box for the command response.
            .append(helpers.getTextAreaGroup('command-response', 'text', 'Antwort', 'Antwortbeispiel!', '', 'Verwenden Sie die Eingabetaste für mehrere Chat-Linien, maximal 5.'))
            // Append a select option for the command permission.
            .append(helpers.getDropdownGroup('command-permission', 'User Level', 'Viewers',
                ['Caster', 'Administrators', 'Moderators', 'Subscribers', 'Donators', 'VIPs', 'Regulars', 'Viewers']))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'html': $('<form/>', {
                    'role': 'form'
                })
                    // Append input box for the command cost.
                    .append(helpers.getInputGroup('command-cost', 'number', 'Kosten', '0', '0',
                        'Kosten in Punkten, die dem Benutzer bei der Ausführung des Befehls abgezogen werden.'))
                    // Append input box for the command reward.
                    .append(helpers.getInputGroup('command-reward', 'number', 'Belohnung', '0', '0',
                        'Belohnung in Punkten, die der Benutzer beim Ausführen des Befehls erhalten soll.'))
                    // Append input box for the command cooldown.
                    .append(helpers.getInputGroup('command-cooldown', 'number', 'Abklingzeit (Sekunden)', '0', '5',
                        'Abklingzeit des Befehls in Sekunden.')
                        // Append checkbox for if the cooldown is global or per-user.
                        .append(helpers.getCheckBox('command-cooldown-global', true, 'Global',
                            'Wenn diese Option aktiviert ist, wird die Abklingzeit auf alle im Kanal angewendet. Wenn diese Option nicht aktiviert ist, wird die Abklingzeit pro Benutzer angewendet.')))
                // Callback function to be called once we hit the save button on the modal.
            })), function () {
            let commandName = $('#command-name'),
                commandResponse = $('#command-response'),
                commandPermission = $('#command-permission'),
                commandCost = $('#command-cost'),
                commandReward = $('#command-reward'),
                commandCooldown = $('#command-cooldown'),
                commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

            // Remove the ! and spaces.
            commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(commandName):
                case helpers.handleInputString(commandResponse):
                case helpers.handleInputNumber(commandCost):
                case helpers.handleInputNumber(commandReward):
                case helpers.handleInputNumber(commandCooldown):
                    break;
                default:
                    // Make sure the command doesn't exist already.
                    socket.getDBValue('custom_command_exists', 'permcom', commandName.val(), function (e) {
                        // If the command exists we stop here.
                        if (e.permcom !== null) {
                            toastr.error('Der Befehl konnte nicht hinzugefügt werden, da er bereits vorhanden ist.');
                            return;
                        }

                        // Save command information here and close the modal.
                        socket.updateDBValues('custom_command_add', {
                            tables: ['pricecom', 'permcom', 'paycom', 'command'],
                            keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                            values: [commandCost.val(), helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), commandReward.val(), commandResponse.val()]
                        }, function () {
                            // Register the custom command with the cache.
                            socket.wsEvent('custom_command_add_ws', './commands/customCommands.js', null,
                                ['add', commandName.val(), commandResponse.val()], function () {
                                    // Add the cooldown to the cache.
                                    socket.wsEvent('custom_command_cooldown_ws', './core/commandCoolDown.js', null,
                                        ['add', commandName.val(), commandCooldown.val(), String(commandCooldownGlobal)], function () {
                                            // Reload the table.
                                            run();
                                            // Close the modal.
                                            $('#add-command').modal('hide');
                                            // Tell the user the command was added.
                                            toastr.success('Befehl !' + commandName.val() + ' erfolgreich hinzugefügt');
                                        });
                                });
                        });
                    });
            }
        }).modal('toggle');
    });

    // On token button.
    tokenEditModal = function (command) {
        // Get modal from our util functions in /utils/helpers.js
        helpers.getModal('token-command', 'Setze Command Token', 'Speichern', $('<form/>', {
            'role': 'form'
        })
            .append('In dieser Dialog wird ein user/pass oder API-Schlüssel gespeichert, der in ein (customapi)-Tag ersetzt wird.\n\
        <br /> HINWEIS: Dies ist nur nützlich, wenn Sie ein (Token) Subtag in die URL eines (customapi) oder (customapijson) Befehlstags einfügen.\n\
        <br /> Beispiel (Verwendung der Bots Chat-Befehle zu Demonstrationszwecken):\n\
        <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;!addcom myapicommand (customapi http://(token)@example.com/myapi)\n\
        <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;!tokencom myapicommand myuser:mypass\n\
        <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i>Der Befehl ruft jetzt effektiv http://myuser:mypass@example.com/myapi auf und reduziert gleichzeitig die Sichtbarkeit Ihres user/pass.</i>')
            // Append input box for the command name. This one is disabled.
            .append(helpers.getInputGroup('command-tname', 'text', 'Befehl', '', '!' + command, 'Name des Befehls. Dieser kann nicht bearbeitet werden.', true))
            // Append a text box for the command token.
            .append(helpers.getInputGroup('command-token', 'text', 'Token', '', 'Der Tokenwert für den Befehl.')), function () {
            let commandName = $('#command-tname'),
                commandToken = $('#command-token');

            // Remove the ! and spaces.
            commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(commandName):
                    break;
                default:
                    // Update command token.
                    socket.sendCommand('command_settoken_cmd', 'tokencom silent@' + commandName.val() + ' ' + commandToken.val(), function () {
                        // Close the modal.
                        $('#token-command').modal('hide');
                        // Tell the user the command was edited.
                        toastr.success('Token für den Befehl !' + commandName.val() + ' erfolgreich geändert.');
                    });
            }
        }).modal('toggle');
    };
});
