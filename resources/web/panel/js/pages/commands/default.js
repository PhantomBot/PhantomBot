/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

// Function that querys all of the data we need.
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
        const wsUpdate = function () {
            socket.wsEvent('command_disabled_update_ws', './core/commandRegister.js', null,
                    [disabled ? 'disable' : 'enable', name], callback);
        };
        const remove = function (callback) {
            if (removeTables.length > 0) {
                socket.removeDBValues('default_command_visibility_remove', {tables: removeTables, keys: removeKeys}, callback);
            } else {
                callback();
            }
        };
        const add = function (callback) {
            if (addTables.length > 0) {
                socket.updateDBValues('default_command_visibility_update', {tables: addTables, keys: addKeys, values: addValues}, callback);
            } else {
                callback();
            }
        };
        remove(function () {
            add(wsUpdate);
        });
    };

    // Query all commands.
    socket.getDBTablesValues('commands_get_all', [{table: 'permcom'}, {table: 'command'}, {table: 'disabledCommands'}, {table: 'hiddenCommands'}], function (results) {
        let tableData = [],
                cmds = {},
                disabled = {},
                hidden = {},
                permcomResults = [];

        for (let result of results) {
            switch (result['table']) {
                case 'command':
                    cmds[result.key] = true;
                    break;
                case 'disabledCommands':
                    disabled[result.key] = true;
                    break;
                case 'hiddenCommands':
                    hidden[result.key] = true;
                    break;
                case 'permcom':
                    permcomResults.push(result);
                    break;
            }
        }

        for (let i = 0; i < permcomResults.length; i++) {
            if (cmds.hasOwnProperty(permcomResults[i].key)) {
                continue;
            }

            tableData.push([
                '!' + permcomResults[i].key,
                helpers.getGroupNameById(permcomResults[i].value),
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning btn-disablecommand',
                    'style': 'float: right',
                    'data-command': permcomResults[i].key,
                    'html': $('<i/>', {
                                ...getDisabledIconAttr(disabled.hasOwnProperty(permcomResults[i].key)),
                                'style': "width: 9px"
                            })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning btn-hidecommand',
                    'style': 'float: right',
                    'data-command': permcomResults[i].key,
                    'html': $('<i/>', {
                                ...getHiddenIconAttr(hidden.hasOwnProperty(permcomResults[i].key)),
                                'style': "width: 9px"
                            })
                })).html(),
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger btn-deletecommand',
                    'style': 'float: right',
                    'data-toggle': 'tooltip',
                    'title': 'Deletes the command permission and resets it to default on startup. This does not remove the command unless it doesn\'t exist anymore.',
                    'data-command': permcomResults[i].key,
                    'html': $('<i/>', {
                        'class': 'fa fa-refresh'
                    })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning btn-editcommand',
                    'style': 'float: right',
                    'data-command': permcomResults[i].key,
                    'html': $('<i/>', {
                        'class': 'fa fa-edit'
                    })
                })).html()
            ]);
        }

                // if the table exists, destroy it.
                if ($.fn.DataTable.isDataTable('#defaultCommandsTable')) {
                    $('#defaultCommandsTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                    return;
                }

                // Create table.
                let table = $('#defaultCommandsTable').DataTable({
                    'searching': true,
                    'autoWidth': false,
                    'data': tableData,
                    'lengthMenu': [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                    'columnDefs': [
                        {'className': 'default-table-large', 'orderable': false, 'targets': [2, 3]},
                        {'width': '45%', 'targets': 0}
                    ],
                    'columns': [
                        {'title': 'Command', 'defaultContent': '<i>null</i>'},
                        {'title': 'User Level', 'defaultContent': '<i>null</i>'},
                        {'title': 'Status'},
                        {'title': 'Actions'}
                    ]
                });

                // On delete button.
                table.on('click', '.btn-deletecommand', function () {
                    let command = $(this).data('command'),
                            row = $(this).parents('tr'),
                            t = $(this);

                    // Ask the user if he want to reset the command.
                    helpers.getConfirmDeleteModal('default_command_modal_remove', 'Are you sure you want to reset the command\'s permission?', false,
                            'The command\'s permission has been reset!', function () {
                                socket.removeDBValue('permcom_temp_del', 'permcom', command, function (e) {
                                    // Hide tooltip.
                                    t.tooltip('hide');
                                    // Remove the table row.
                                    table.row(row).remove().draw(false);
                                });
                            });
                });

                // On disable button.
                table.on('click', '.btn-disablecommand', function () {
                    let command = $(this).data('command'),
                    row = $(this).parents('tr');
                    socket.getDBValues('default_command_edit', {
                    tables: ['command', 'disabledCommands', 'hiddenCommands'],
                    keys: [command, command, command]
                    }, function (e) {
                        let commandDisabled = e.disabledCommands === null,
                            commandHidden = e.hiddenCommands !== null;
                        updateCommandVisibility(command, commandDisabled, commandHidden, function () {
                            // Update status icon
                            row.find('.disabled-status-icon').attr(getDisabledIconAttr(commandDisabled));
                        });
                    });
                });

                // On hidden button.
                table.on('click', '.btn-hidecommand', function () {
                  let command = $(this).data('command'),
                  row = $(this).parents('tr');
                  socket.getDBValues('default_command_edit', {
                    tables: ['command', 'disabledCommands', 'hiddenCommands'],
                    keys: [command, command, command]
                    }, function (e) {
                      let commandDisabled = e.disabledCommands !== null,
                        commandHidden = e.hiddenCommands === null;
                      updateCommandVisibility(command, commandDisabled, commandHidden, function () {
                            // Update status icon
                            row.find('.hidden-status-icon').attr(getHiddenIconAttr(commandHidden));
                          });
                      });
                });

                // On edit button.
                table.on('click', '.btn-editcommand', function () {
                    let command = $(this).data('command'),
                            t = $(this);

                    // Get all the info about the command.
                    socket.getDBValues('default_command_edit', {
                        tables: ['permcom', 'cooldown', 'pricecom', 'paycom', 'disabledCommands', 'commandRestrictions', 'hiddenCommands'],
                        keys: [command, command, command, command, command, command, command]
                    }, function (e) {
                        let cooldownJson = (e.cooldown === null ? {globalSec: -1, userSec: -1, modsSkip: false, clearOnOnline: false} : JSON.parse(e.cooldown)),
                                restriction = (e.commandRestrictions === null || e.commandRestrictions === undefined || isNaN(e.commandRestrictions) ? -1 : parseInt(e.commandRestrictions));

                        switch (restriction) {
                            case 1:
                                restriction = 'Online only';
                                break;
                            case 2:
                                restriction = 'Offline only';
                                break;
                            default:
                                restriction = 'None';
                        }

                        // Get advance modal from our util functions in /utils/helpers.js
                        helpers.getAdvanceModal('edit-command', 'Edit Command', 'Save', $('<form/>', {
                            'role': 'form'
                        })
                                // Append input box for the command name. This one is disabled.
                                .append(helpers.getInputGroup('command-name', 'text', 'Command', '', '!' + command, 'Name of the command. This cannot be edited.', true))
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
                                            // Append a select option for the command restriction
                                            .append(helpers.getDropdownGroup('command-restriction', 'Restriction', restriction,
                                                    ['None', 'Online only', 'Offline only']))
                                            // Append input box for mods skip cooldown.
                                            .append(helpers.getCheckBox('command-cooldown-modsskip', cooldownJson.modsSkip, 'Mods Skip Cooldown',
                                                    'If checked, moderators are exempt from cooldowns on this command.'))
                                            // Append input box for clear cooldowns on online events
                                            .append(helpers.getCheckBox('command-cooldown-clearononline', cooldownJson.clearOnOnline, 'Clear Cooldowns at stream start',
                                                    'If checked, the cooldowns for this command will be cleared when you go live.'))
                                            .append(helpers.getCheckBox('command-disabled', e.disabledCommands !== null, 'Disabled',
                                                    'If checked, the command cannot be used in chat.'))
                                            .append(helpers.getCheckBox('command-hidden', e.hiddenCommands !== null, 'Hidden',
                                                    'If checked, the command will not be listed when !command is called.'))
                                            // Callback function to be called once we hit the save button on the modal.
                                })), function () {
                            let commandPermission = $('#command-permission'),
                                    commandCost = $('#command-cost'),
                                    commandReward = $('#command-reward'),
                                    commandCooldownGlobal = $('#command-cooldown-global'),
                                    commandCooldownUser = $('#command-cooldown-user'),
                                    commandCooldownModsSkip = $('#command-cooldown-modsskip').is(':checked') ? '1' : '0',
                                    commandCooldownClearOnOnline = $('#command-cooldown-clearononline').is(':checked') ? '1' : '0',
                                    commandDisabled = $('#command-disabled').is(':checked'),
                                    commandHidden = $('#command-hidden').is(':checked'),
                                    commandRestriction = $('#command-restriction option:selected').text().replace(/\b(on|only)\b/g, '').trim().toLowerCase();
                            // Handle each input to make sure they have a value.
                            switch (false) {
                                case helpers.handleInputNumber(commandCost):
                                case helpers.handleInputNumber(commandReward):
                                case helpers.handleInputNumber(commandCooldownGlobal, - 1):
                                case helpers.handleInputNumber(commandCooldownUser, - 1):
                                    break;
                                default:
                                    // Save command information here and close the modal.
                                    socket.updateDBValues('custom_command_edit', {
                                        tables: ['pricecom', 'paycom'],
                                        keys: [command, command],
                                        values: [commandCost.val(), commandReward.val()]
                                    }, function () {
                                        updateCommandVisibility(command, commandDisabled, commandHidden, function () {
                                            // Add the cooldown to the cache.
                                            socket.wsEvent('default_command_edit_cooldown_ws', './core/commandCoolDown.js', null,
                                                    ['add', command, commandCooldownGlobal.val(), commandCooldownUser.val(), commandCooldownModsSkip, commandCooldownClearOnOnline, commandRestriction], function () {
                                                // Edit the command permission.
                                                socket.sendCommand('default_command_permisison_update', 'permcomsilent ' + command + ' ' +
                                                        helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), function () {
                                                    const $tr = t.parents('tr');
                                                    // Update user level value.
                                                    $tr.find('td:eq(1)').text(commandPermission.find(':selected').text());
                                                    // Update status icons
                                                    $tr.find('.disabled-status-icon').attr(getDisabledIconAttr(commandDisabled));
                                                    $tr.find('.hidden-status-icon').attr(getHiddenIconAttr(commandHidden));
                                                    // Close the modal.
                                                    $('#edit-command').modal('hide');
                                                    // Tell the user the command was edited.
                                                    toastr.success('Successfully edited command !' + command);
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
