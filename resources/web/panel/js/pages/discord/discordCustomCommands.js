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

$(run = function() {
    // Check if the module is enabled.
    socket.getDBValue('discord_custom_command_module', 'modules', './discord/commands/customCommands.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('discordCustomCommandsModule', e.modules)) {
            return;
        }

        // Query custom commands.
        socket.getDBTableValues('discord_commands_get_custom', 'discordCommands', function(results) {
            const tableData = [];

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
            if ($.fn.DataTable.isDataTable('#discordCustomCommandsTable')) {
                $('#discordCustomCommandsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#discordCustomCommandsTable').off();
            }

            // Create table.
            const table = $('#discordCustomCommandsTable').DataTable({
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
                    { 'title': 'Aktion' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                const command = $(this).data('command'),
                    row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Sind Sie sicher, dass Sie den Befehl !' + command + ' entfernen möchten?', true,
                    'Der Befehl !' + command + ' wurde erfolgreich entfernt!', function() {
                    socket.removeDBValues('rm_discord_command', {
                        tables: ['discordCommands', 'discordPermcom', 'discordCooldown', 'discordChannelcom', 'discordPricecom', 'discordAliascom'],
                        keys: [command, command, command, command, command, command]
                    }, function() {
                        socket.wsEvent('discord', './discord/commands/customCommands.js', 'remove', [command], function() {
                            // Remove the table row.
                            table.row(row).remove().draw(false);
                        });
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                const command = $(this).data('command'),
                    t = $(this);

                // Get all the info about the command.
                socket.getDBValues('custom_command_edit', {
                    tables: ['discordPricecom', 'discordPermcom', 'discordAliascom', 'discordChannelcom', 'discordCommands', 'discordCooldown', 'discordPermsObj'],
                    keys: [command, command, command, command, command, command, 'obj']
                }, function(e) {
                    let cooldownJson = (e.discordCooldown === null ? { isGlobal: 'true', seconds: 0 } : JSON.parse(e.discordCooldown));
                    let perm = JSON.parse(e.discordPermcom);
                    let perms = JSON.parse(e.discordPermsObj);

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-command', 'Befehl Bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('command-name', 'text', 'Befehl', '', '!' + command, 'Name des Befehls. Dieser kann nicht bearbeitet werden.', true))
                    // Append a text box for the command response.
                    .append(helpers.getTextAreaGroup('command-response', 'text', 'Antwort', '', e.discordCommands, 'Antwort des Befehls.'))
                    // Append a select option for the command permission.
                    .append(helpers.getMultiDropdownGroup('command-permission', 'Zulässige Rollen und Berechtigungen', [
                        {
                            'title': 'Berechtigungen',
                            'options': perm.permissions
                        },
                        {
                            'title': 'Rollen',
                            'selected': perm.roles,
                            'options': perms.roles
                        }
                    ], 'Welche Rollen dürfen diesen Befehl ausführen? Die Administratorberechtigung ist Personen mit der Administratorberechtigung, die für ihre Rolle in Discord ausgewählt wurde'))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'html': $('<form/>', {
                                'role': 'form'
                            })
                            // Append input box for the command cost.
                            .append(helpers.getInputGroup('command-cost', 'number', 'Kosten', '0', helpers.getDefaultIfNullOrUndefined(e.discordPricecom, '0'),
                                'Kosten in Punkten, die dem Benutzer bei der Ausführung des Befehls abgezogen werden.'))
                            // Append input box for the command channel.
                            .append(helpers.getInputGroup('command-channel', 'text', 'Kanal', '#commands', helpers.getDefaultIfNullOrUndefined(e.discordChannelcom, ''),
                                'Kanal, in dem dieser Befehl funktionieren soll. Trennen Sie mit Leerzeichen und Komma für mehrere. Wenn leer, funktioniert der Befehl in allen Kanälen.'))
                            // Append input box for the command alias.
                            .append(helpers.getInputGroup('command-alias', 'text', 'Alias', '!ex', helpers.getDefaultIfNullOrUndefined(e.discordAliascom, ''),
                                'Ein weiterer Befehlsname, der auch diesen Befehl auslöst.'))
                            // Append input box for the command cooldown.
                            .append(helpers.getInputGroup('command-cooldown', 'number', 'Abklingzeit (Sekunden)', '0', helpers.getDefaultIfNullOrUndefined(cooldownJson.seconds, '0'),
                                'Abklingzeit des Befehls in Sekunden.')
                                // Append checkbox for if the cooldown is global or per-user.
                                .append(helpers.getCheckBox('command-cooldown-global', cooldownJson.isGlobal === 'true', 'Global',
                                    'Wenn diese Option aktiviert ist, wird die Abklingzeit auf alle Personen im Kanal angewendet. Wenn diese Option nicht aktiviert ist pro Benutzer angewendet.')))
                            // Callback function to be called once we hit the save button on the modal.
                    })), function() {
                        let commandName = $('#command-name'),
                            commandResponse = $('#command-response'),
                            commandPermissions = $('#command-permission option'),
                            commandCost = $('#command-cost'),
                            commandChannel = $('#command-channel'),
                            commandAlias = $('#command-alias'),
                            commandCooldown = $('#command-cooldown'),
                            commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

                        // Remove the ! and spaces.
                        commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());
                        commandAlias.val(commandAlias.val().replace(/(\!|\s)/g, '').toLowerCase());

                        // Generate all permissions.
                        const permObj = {
                            'roles': [],
                            'permissions': []
                        };

                        commandPermissions.each(function() {
                            var section = $(this).parent().attr('label');

                            // This is a permission.
                            if (section == 'Berechtigungen') {
                                permObj.permissions.push({
                                    'name': $(this).html(),
                                    'selected': $(this).is(':selected').toString()
                                });
                            } else if ($(this).is(':selected')) {
                                permObj.roles.push($(this).attr('id'));
                            }
                        });

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(commandName):
                            case helpers.handleInputString(commandResponse):
                            case helpers.handleInputNumber(commandCooldown):
                                break;
                            default:
                                // Save command information here and close the modal.
                                socket.updateDBValues('custom_command_add', {
                                    tables: ['discordPricecom', 'discordPermcom', 'discordCommands', 'discordCooldown'],
                                    keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                                    values: [commandCost.val(), JSON.stringify(permObj), commandResponse.val(), JSON.stringify({command: String(commandName.val()), seconds: String(commandCooldown.val()), isGlobal: String(commandCooldownGlobal)})]
                                }, function() {
                                    if (commandChannel.val().length > 0) {
                                        socket.updateDBValue('discord_channel_command_cmd', 'discordChannelcom', commandName.val(), commandChannel.val(), new Function());
                                    } else {
                                        socket.removeDBValue('discord_channel_command_cmd', 'discordChannelcom', commandName.val(), new Function());
                                    }

                                    if (commandAlias.val().length > 0) {
                                        socket.updateDBValue('discord_alias_command_cmd', 'discordAliascom', commandName.val(), commandAlias.val(), new Function());
                                    } else {
                                        socket.removeDBValue('discord_alias_command_cmd', 'discordAliascom', commandName.val(), new Function());
                                    }

                                    // Reload the table.
                                    run();
                                    // Close the modal.
                                    $('#edit-command').modal('hide');
                                    // Tell the user the command was added.
                                    toastr.success('Befehl erfolgreich bearbeitet !' + commandName.val());

                                    // I hate doing this, but the logic is fucked anyways.
                                    helpers.setTimeout(function() {
                                        // Add the cooldown to the cache.
                                        socket.wsEvent('discord', './discord/commands/customCommands.js', '',
                                            [commandName.val(), JSON.stringify(permObj),
                                            commandChannel.val(), commandAlias.val(), commandCost.val()], new Function());
                                    }, 5e2);
                                });
                        }
                    }).on('shown.bs.modal', function(e) {
                        $('#command-permission').select2();
                    }).modal('toggle');
                });
            });
        });
    });
});


// Function that handlers the loading of events.
$(function() {
    // Toggle for the module.
    $('#discordCustomCommandsModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('discord_custom_commands_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./discord/commands/customCommands.js', run);
    });

    // Add command button.
    $('#discord-addcom-button').on('click', function() {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getAdvanceModal('add-command', 'Befehl hinzufügen', 'Speichern', $('<form/>', {
            'role': 'form'
        })
        // Append input box for the command name.
        .append(helpers.getInputGroup('command-name', 'text', 'Befehl', '!beispiel'))
        // Append a text box for the command response.
        .append(helpers.getTextAreaGroup('command-response', 'text', 'Antwort', 'Antwort Beispiel!'))
        // Append a select option for the command permission.
        .append(helpers.getDropdownGroup('command-permission', 'User Level', 'Everyone',
            ['Administrators', 'Everyone']))
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
                // Append input box for the command channel.
                .append(helpers.getInputGroup('command-channel', 'text', 'Kanal', '#commands', '',
                    'Kanal, in dem dieser Befehl funktionieren soll. Trennen Sie mit Leerzeichen und Komma für mehrere. Wenn leer, funktioniert der Befehl in allen Kanälen.'))
                // Append input box for the command alias.
                .append(helpers.getInputGroup('command-alias', 'text', 'Alias', '!ex', '',
                    'Ein weiterer Befehlsname, der auch diesen Befehl auslöst.'))
                // Append input box for the command cooldown.
                .append(helpers.getInputGroup('command-cooldown', 'number', 'Abklingzeit (Sekunden)', '0', '5',
                    'Cooldown of the command in seconds.')
                    // Append checkbox for if the cooldown is global or per-user.
                    .append(helpers.getCheckBox('command-cooldown-global', true, 'Global',
                        'Wenn diese Option aktiviert ist, wird die Abklingzeit auf alle Personen im Kanal angewendet. Wenn diese Option nicht aktiviert ist pro Benutzer angewendet.')))
                // Callback function to be called once we hit the save button on the modal.
        })), function() {
            let commandName = $('#command-name'),
                commandResponse = $('#command-response'),
                commandPermission = $('#command-permission'),
                commandCost = $('#command-cost'),
                commandChannel = $('#command-channel'),
                commandAlias = $('#command-alias'),
                commandCooldown = $('#command-cooldown'),
                commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

            // Remove the ! and spaces.
            commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());
            commandAlias.val(commandAlias.val().replace(/(\!|\s)/g, '').toLowerCase());

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(commandName):
                case helpers.handleInputString(commandResponse):
                case helpers.handleInputNumber(commandCooldown):
                    break;
                default:
                    // Make sure the command doesn't exist already.
                    socket.getDBValue('custom_command_exists', 'discordPermcom', commandName.val(), function(e) {
                        // If the command exists we stop here.
                        if (e.discordPermcom !== null) {
                            toastr.error('Der Befehl konnte nicht hinzugefügt werden, da er bereits existiert.');
                            return;
                        }

                        // Save command information here and close the modal.
                        socket.updateDBValues('custom_command_add', {
                            tables: ['discordPricecom', 'discordPermcom', 'discordCommands', 'discordCooldown'],
                            keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                            values: [commandCost.val(), helpers.getDiscordGroupIdByName(commandPermission.find(':selected').text(), true), commandResponse.val(), JSON.stringify({command: String(commandName.val()), seconds: String(commandCooldown.val()), isGlobal: String(commandCooldownGlobal)})]
                        }, function() {
                            if (commandChannel.val().length > 0) {
                                socket.updateDBValue('discord_channel_command_cmd', 'discordChannelcom', commandName.val(), commandChannel.val(), new Function());
                            } else {
                                socket.removeDBValue('discord_channel_command_cmd', 'discordChannelcom', commandName.val(), new Function());
                            }

                            if (commandAlias.val().length > 0) {
                                socket.updateDBValue('discord_alias_command_cmd', 'discordAliascom', commandName.val(), commandAlias.val(), new Function());
                            } else {
                                socket.removeDBValue('discord_alias_command_cmd', 'discordAliascom', commandName.val(), new Function());
                            }

                            // Reload the table.
                            run();
                            // Close the modal.
                            $('#add-command').modal('hide');
                            // Tell the user the command was added.
                            toastr.success('Befehl erfolgreich hinzugefügt !' + commandName.val());

                            // I hate doing this, but the logic is fucked anyways.
                            helpers.setTimeout(function() {
                                // Add the cooldown to the cache.
                                socket.wsEvent('discord', './discord/commands/customCommands.js', '',
                                    [commandName.val(), helpers.getDiscordGroupIdByName(commandPermission.find(':selected').text(), true),
                                    commandChannel.val(), commandAlias.val(), commandCost.val()], new Function());
                            }, 5e2);
                        });
                    });
            }
        }).modal('toggle');
    });
});