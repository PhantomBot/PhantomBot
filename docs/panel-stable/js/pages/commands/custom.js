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

/* global toastr */

$(function () {
    const getDisabledIconAttr = function (disabled) {
        return {
            class: 'fa disabled-status-icon ' + (disabled ? 'fa-ban text-muted' : 'fa-check'),
            title: disabled ? 'disabled' : 'enabled'
        };
    };
    const getHiddenIconAttr = function (hidden) {
        return {
            class: 'fa hidden-status-icon ' + (hidden ? 'fa-eye-slash text-muted' : 'fa-eye'),
            title: hidden ? 'hidden' : 'visible'
        };
    };
    const updateCommandVisibility = function (name, disabled, hidden, callback) {
        let addTables = [],
                addKeys = [],
                addValues = [],
                removeTables = [],
                removeKeys = [];
        if (disabled) {
            addTables.push('disabledCommands');
            addKeys.push(name);
            addValues.push(true);
        } else {
            removeTables.push('disabledCommands');
            removeKeys.push(name);
        }
        if (hidden) {
            addTables.push('hiddenCommands');
            addKeys.push(name);
            addValues.push(true);
        } else {
            removeTables.push('hiddenCommands');
            removeKeys.push(name);
        }
        const remove = function (callback) {
            if (removeTables.length > 0) {
                socket.removeDBValues('custom_command_visibility_remove', {tables: removeTables, keys: removeKeys}, callback);
            } else {
                callback();
            }
        };
        const add = function (callback) {
            if (addTables.length > 0) {
                socket.updateDBValues('custom_command_visibility_update', {tables: addTables, keys: addKeys, values: addValues}, callback);
            } else {
                callback();
            }
        };
        remove(function () {
            add(callback);
        });
    };

    const loadCustomCommands = function () {
        // Query custom commands.
        socket.getDBTablesValues('commands_get_custom', [{table: 'command'}, {table: 'disabledCommands'}, {table: 'hiddenCommands'}], function (results) {
            let tableData = [];
            let disabledCommands = {};
            let hiddenCommands = {};
            let commands = [];
            for (let result of results) {
                switch (result['table']) {
                    case 'command':
                        commands.push(result);
                        break;
                    case 'disabledCommands':
                        disabledCommands[result.key] = true;
                        break;
                    case 'hiddenCommands':
                        hiddenCommands[result.key] = true;
                        break;
                }
            }

            for (let command of commands) {
                tableData.push([
                    '!' + command.key,
                    command.value,
                    $('<div/>')
                            .append($('<i/>', {
                                ...getDisabledIconAttr(disabledCommands.hasOwnProperty(command.key)),
                                'style': "margin-right: 0.5em"
                            }))
                            .append($('<i/>', getHiddenIconAttr(hiddenCommands.hasOwnProperty(command.key))))
                            .html(),
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-command': command.key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-command': command.key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#customCommandsTable')) {
                $('#customCommandsTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                return;
            }

            // Create table.
            let table = $('#customCommandsTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    {'className': 'default-table', 'orderable': false, 'targets': [2, 3]},
                    {'width': '15%', 'targets': 0}
                ],
                'columns': [
                    {'title': 'Command'},
                    {'title': 'Response'},
                    {'title': 'Status'},
                    {'title': 'Actions'}
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function () {
                let command = $(this).data('command'),
                        row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Are you sure you want to remove command !' + command + '?', true,
                        'The command !' + command + ' has been successfully removed!', function () {
                            // Delete all information about the command.
                            socket.removeDBValues('custom_command_remove', {
                                tables: ['command', 'permcom', 'cooldown', 'aliases', 'pricecom', 'paycom', 'commandtoken', 'disabledCommands', 'hiddenCommands'],
                                keys: [command, command, command, command, command, command, command, command, command]
                            }, function () {
                                socket.wsEvent('custom_command_remove_ws', './commands/customCommands.js', null, ['remove', String(command)], function () {
                                    // Remove the table row.
                                    table.row(row).remove().draw(false);
                                });
                            });
                        });
            });

            // On edit button.
            table.on('click', '.btn-warning', function () {
                let command = $(this).data('command'),
                        t = $(this);

                // Get all the info about the command.
                socket.getDBValues('custom_command_edit', {
                    tables: ['command', 'permcom', 'cooldown', 'pricecom', 'paycom', 'disabledCommands', 'hiddenCommands'],
                    keys: [command, command, command, command, command, command, command]
                }, function (e) {
                    let cooldownJson = (e.cooldown === null ? {globalSec: -1, userSec: -1, modsSkip: false} : JSON.parse(e.cooldown)),
                            tokenButton = '';

                    if (e.command.match(/\(customapi/gi) !== null) {
                        tokenButton = $('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-info',
                            'style': 'float: right; position: relative; bottom: 6px;',
                            'data-command': command,
                            'click': function () {
                                tokenEditModal($(this).data('command'));
                            },
                            'text': 'Add/Edit Command Token'
                        });
                    }

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-command', 'Edit Command', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                            // Append input box for the command name. This one is disabled.
                            .append(helpers.getInputGroup('command-name', 'text', 'Command', '', '!' + command, 'Name of the command. This cannot be edited.', true))
                            // Append a text box for the command response.
                            .append(helpers.getTextAreaGroup('command-response', 'text', 'Response', '', e.command, 'Response of the command. Use enter for multiple chat lines maximum is 5.'))
                            .append(tokenButton)
                            // Append a select option for the command permission.
                            .append(helpers.getDropdownGroup('command-permission', 'User Level', helpers.getGroupNameById(e.permcom),
                                    helpers.getPermGroupNames()))
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
                                        // Append input box for the global command cooldown.
                                        .append(helpers.getInputGroup('command-cooldown-global', 'number', 'Global Cooldown (Seconds)', '-1', cooldownJson.globalSec,
                                                'Global Cooldown of the command in seconds. -1 Uses the bot-wide settings.'))
                                        // Append input box for per-user cooldown.
                                        .append(helpers.getInputGroup('command-cooldown-user', 'number', 'Per-User Cooldown (Seconds)', '-1', cooldownJson.userSec,
                                                'Per-User cooldown of the command in seconds. -1 removes per-user cooldown.'))
                                        // Append input box for mods skip cooldown.
                                        .append(helpers.getCheckBox('command-cooldown-modsskip', cooldownJson.modsSkip, 'Mods Skip Cooldown',
                                                'If checked, moderators are exempt from cooldowns on this command.'))
                                        .append(helpers.getCheckBox('command-disabled', e.disabledCommands !== null, 'Disabled',
                                                'If checked, the command cannot be used in chat.'))
                                        .append(helpers.getCheckBox('command-hidden', e.hiddenCommands !== null, 'Hidden',
                                                'If checked, the command will not be listed when !command is called.'))
                                        // Callback function to be called once we hit the save button on the modal.
                            })), function () {
                        let commandName = $('#command-name'),
                                commandResponse = $('#command-response'),
                                commandPermission = $('#command-permission'),
                                commandCost = $('#command-cost'),
                                commandReward = $('#command-reward'),
                                commandCooldownGlobal = $('#command-cooldown-global'),
                                commandCooldownUser = $('#command-cooldown-user'),
                                commandCooldownModsSkip = $('#command-cooldown-modsskip').is(':checked') ? '1' : '0',
                                commandDisabled = $('#command-disabled').is(':checked'),
                                commandHidden = $('#command-hidden').is(':checked');

                        // Remove the ! and spaces.
                        commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(commandName):
                            case helpers.handleInputString(commandResponse):
                            case helpers.handleInputNumber(commandCost):
                            case helpers.handleInputNumber(commandReward):
                            case helpers.handleInputNumber(commandCooldownGlobal, - 1):
                            case helpers.handleInputNumber(commandCooldownUser, - 1):
                                break;
                            default:
                                // Save command information here and close the modal.
                                socket.updateDBValues('custom_command_edit', {
                                    tables: ['pricecom', 'permcom', 'paycom', 'command'],
                                    keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                                    values: [commandCost.val(), helpers.getGroupIdByName(commandPermission.find(':selected').text(), true),
                                        commandReward.val(), commandResponse.val()]
                                }, function () {
                                    updateCommandVisibility(commandName.val(), commandDisabled, commandHidden, function () {
                                        // Register the custom command with the cache.
                                        socket.wsEvent('custom_command_edit_ws', './commands/customCommands.js', null, ['edit', String(commandName.val()),
                                            commandResponse.val(), JSON.stringify({disabled: commandDisabled})], function () {
                                            // Add the cooldown to the cache.
                                            socket.wsEvent('custom_command_edit_cooldown_ws', './core/commandCoolDown.js', null,
                                                    ['add', commandName.val(), commandCooldownGlobal.val(), commandCooldownUser.val(), commandCooldownModsSkip], function () {
                                                // Update command permission.
                                                socket.sendCommand('edit_command_permission_cmd', 'permcomsilent ' + commandName.val() + ' ' +
                                                        helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), function () {
                                                    const $tr = t.parents('tr');
                                                    // Update the command response
                                                    $tr.find('td:eq(1)').text(commandResponse.val());
                                                    // Update status icons
                                                    $tr.find('.disabled-status-icon').attr(getDisabledIconAttr(commandDisabled));
                                                    $tr.find('.hidden-status-icon').attr(getHiddenIconAttr(commandHidden));
                                                    // Close the modal.
                                                    $('#edit-command').modal('hide');
                                                    // Tell the user the command was edited.
                                                    toastr.success('Successfully edited command !' + commandName.val());
                                                });
                                            });
                                        });
                                    });
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    };

    const init = function () {
        // Check if the module is enabled.
        socket.getDBValue('custom_command_module', 'modules', './commands/customCommands.js', function (e) {
            // If the module is off, don't load any data.
            if (helpers.handleModuleLoadUp('customCommandsModule', e.modules)) {
                loadCustomCommands();
            }
        });
    };
    init();


    // Toggle for the module.
    $('#customCommandsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('custom_commands_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/customCommands.js', init);
    });

    // Add command button.
    $('#addcom-button').on('click', function () {
        // Get advance modal from our util functions in /utils/helpers.js
        helpers.getAdvanceModal('add-command', 'Add Command', 'Save', $('<form/>', {
            'role': 'form'
        })
                // Append input box for the command name.
                .append(helpers.getInputGroup('command-name', 'text', 'Command', '!example'))
                // Append a text box for the command response.
                .append(helpers.getTextAreaGroup('command-response', 'text', 'Response', 'Response example! Use enter for multiple chat lines maximum is 5.'))
                // Append a select option for the command permission.
                .append(helpers.getDropdownGroup('command-permission', 'User Level', helpers.getGroupNameById(7),
                        helpers.getPermGroupNames()))
                // Add an advance section that can be opened with a button toggle.
                .append($('<div/>', {
                    'class': 'collapse',
                    'id': 'advance-collapse',
                    'html': $('<form/>', {
                        'role': 'form'
                    })
                            // Append input box for the command cost.
                            .append(helpers.getInputGroup('command-cost', 'number', 'Cost', '0', '0',
                                    'Cost in points that will be taken from the user when running the command.'))
                            // Append input box for the command reward.
                            .append(helpers.getInputGroup('command-reward', 'number', 'Reward', '0', '0',
                                    'Reward in points the user will be given when running the command.'))
                            // Append input box for the global command cooldown.
                            .append(helpers.getInputGroup('command-cooldown-global', 'number', 'Global Cooldown (Seconds)', '-1', '-1',
                                    'Global Cooldown of the command in seconds. -1 Uses the bot-wide settings.')
                                    // Append input box for per-user cooldown.
                                    .append(helpers.getInputGroup('command-cooldown-user', 'number', 'Per-User Cooldown (Seconds)', '-1', '-1',
                                            'Per-User cooldown of the command in seconds. -1 removes per-user cooldown.')))
                            // Append input box for mods skip cooldown.
                            .append(helpers.getCheckBox('command-cooldown-modsskip', false, 'Mods Skip Cooldown',
                                    'If checked, moderators are exempt from cooldowns on this command.'))
                            .append(helpers.getCheckBox('command-disabled', false, 'Disabled',
                                    'If checked, the command cannot be used in chat.'))
                            .append(helpers.getCheckBox('command-hidden', false, 'Hidden',
                                    'If checked, the command will not be listed when !command is called.'))
                })), function () {
            // Callback function to be called once we hit the save button on the modal.
            let commandName = $('#command-name'),
                    commandResponse = $('#command-response'),
                    commandPermission = $('#command-permission'),
                    commandCost = $('#command-cost'),
                    commandReward = $('#command-reward'),
                    commandCooldownGlobal = $('#command-cooldown-global'),
                    commandCooldownUser = $('#command-cooldown-user'),
                    commandCooldownModsSkip = $('#command-cooldown-modsskip').is(':checked') ? '1' : '0',
                    commandDisabled = $('#command-disabled').is(':checked'),
                    commandHidden = $('#command-hidden').is(':checked');

            // Remove the ! and spaces.
            commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(commandName):
                case helpers.handleInputString(commandResponse):
                case helpers.handleInputNumber(commandCost):
                case helpers.handleInputNumber(commandReward):
                case helpers.handleInputNumber(commandCooldownGlobal, - 1):
                case helpers.handleInputNumber(commandCooldownUser, - 1):
                    break;
                default:
                    // Make sure the command doesn't exist already.
                    socket.getDBValue('custom_command_exists', 'permcom', commandName.val(), function (e) {
                        // If the command exists we stop here.
                        if (e.permcom !== null) {
                            toastr.error('Failed to add command as it already exists.');
                            return;
                        }

                        // Save command information here and close the modal.
                        socket.updateDBValues('custom_command_add', {
                            tables: ['pricecom', 'permcom', 'paycom', 'command'],
                            keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                            values: [commandCost.val(), helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), commandReward.val(), commandResponse.val()]
                        }, function () {
                            updateCommandVisibility(commandName.val(), commandDisabled, commandHidden, function () {
                                // Register the custom command with the cache.
                                socket.wsEvent('custom_command_add_ws', './commands/customCommands.js', null,
                                        ['add', commandName.val(), commandResponse.val(), JSON.stringify({disabled: commandDisabled})], function () {
                                    // Add the cooldown to the cache.
                                    socket.wsEvent('custom_command_cooldown_ws', './core/commandCoolDown.js', null,
                                            ['add', commandName.val(), commandCooldownGlobal.val(), commandCooldownUser.val(), commandCooldownModsSkip], function () {
                                        // Reload the table.
                                        loadCustomCommands();
                                        // Close the modal.
                                        $('#add-command').modal('hide');
                                        // Tell the user the command was added.
                                        toastr.success('Successfully added command!' + commandName.val());
                                    });
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
        helpers.getModal('token-command', 'Set Command Token', 'Save', $('<form/>', {
            'role': 'form'
        })
                .append('This dialog stores a user/pass or API key to be replaced into a (customapi) tag.\n\
                <br /> NOTE: This is only useful if you place a (token) subtag into the URL of a (customapi) or (customapijson) command tag.\n\
                <br /> Example (using the bot\s chat commands for demonstration purposes):\n\
                <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;!addcom myapicommand (customapi http://(token)@example.com/myapi)\n\
                <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;!tokencom myapicommand myuser:mypass\n\
                <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i>The command now effectively calls http://myuser:mypass@example.com/myapi while reducing exposure of your user/pass</i>')
                // Append input box for the command name. This one is disabled.
                .append(helpers.getInputGroup('command-tname', 'text', 'Command', '', '!' + command, 'Name of the command. This cannot be edited.', true))
                // Append a text box for the command token.
                .append(helpers.getInputGroup('command-token', 'text', 'Token', '', 'The token value for the command.')), function () {
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
                        toastr.success('Successfully changed token for command !' + commandName.val());
                    });
            }
        }).modal('toggle');
    };
});
