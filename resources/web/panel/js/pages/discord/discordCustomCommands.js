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
    let discordChannels = null,
            lastUpdate = 0,
            updateInterval = 5000,
            allowedChannelTypes = ['GUILD_NEWS', 'GUILD_TEXT'];
    function refreshChannels() {
        return new Promise((resolve) => {
            if (Date.now() - lastUpdate > updateInterval) {
                socket.getDiscordChannelList('discord_customcommands_getchannels', function (d) {
                    discordChannels = d.data;
                    lastUpdate = Date.now();
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    async function getChannelSelector(id, title, placeholder, values, tooltip) {
        await refreshChannels();

        if (values === undefined || values === null) {
            values = '';
        }

        if (discordChannels === null) {
            return helpers.getInputGroup(id, 'text', title, placeholder, values, tooltip);
        }

        let data = [];
        values = values.split(',');

        for (const [category, channels] of Object.entries(discordChannels)) {
            let entry = {};
            entry.title = channels.name;
            entry.options = [];

            for (const [channel, info] of Object.entries(channels)) {
                if (channel === 'name') {
                    continue;
                }

                entry.options.push({
                    'name': info.name,
                    'value': channel,
                    'selected': values.includes(channel),
                    'disabled': !allowedChannelTypes.includes(info.type)
                });
            }

            data.push(entry);
        }

        return helpers.getMultiDropdownGroup(id, title, data, tooltip);
    }

    function discordChannelTemplate(fchannel) {
        if (discordChannels === undefined || discordChannels === null) {
            return $('<span><i class="fa fa-triangle-exclamation fa-lg" style="margin-right: 5px;" /> Unable retrieve channel list</span>');
        }
        if (fchannel.id) {
            for (const [category, channels] of Object.entries(discordChannels)) {
                for (const [channel, info] of Object.entries(channels)) {
                    if (fchannel.id === channel) {
                        switch (info.type) {
                            case 'GUILD_NEWS':
                                return $('<span><i class="fa fa-bullhorn fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_STAGE_VOICE':
                                return $('<span><i class="fa fa-users fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_STORE':
                                return $('<span><i class="fa fa-shopping-cart fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_TEXT':
                                return $('<span><i class="fa fa-hashtag fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_VOICE':
                                return $('<span><i class="fa fa-volume-up fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                        }
                    }
                }
            }
        }

        return fchannel.text;
    }

    async function showAddEditModal(isEdit, command, e, cooldownJson, perm, perms) {
        // Get advance modal from our util functions in /utils/helpers.js
        let modalId = (isEdit ? 'edit' : 'add') + '-command',
                modalTitle = (isEdit ? 'Edit' : 'Add') + ' Command';
        helpers.getAdvanceModal(modalId, modalTitle, 'Save', $('<form/>', {
            'role': 'form'
        })
                // Append input box for the command name. This one is disabled.
                .append(helpers.getInputGroup('command-name', 'text', 'Command', '', '!' + command, 'Name of the command.' + (isEdit ? ' This cannot be edited.' : ''), isEdit))
                // Append a text box for the command response.
                .append(helpers.getTextAreaGroup('command-response', 'text', 'Response', '', helpers.getDefaultIfNullOrUndefined(e.discordCommands, ''), 'Response of the command.'))
                // Append a select option for the command permission.
                .append(helpers.getMultiDropdownGroup('command-permission', 'Allowed Roles and Permissions', [
                    {
                        'title': 'Permissions',
                        'options': isEdit ? perm.permissions : [{
                                'name': 'Administrators',
                                'selected': true
                            }]
                    },
                    {
                        'title': 'Roles',
                        'selected': perm.roles,
                        'options': perms.roles
                    }
                ], 'Which roles are allowed to run this command. The Administrator permission is people with the Administrator permission selected on their role in Discord'))
                // Add an advance section that can be opened with a button toggle.
                .append($('<div/>', {
                    'class': 'collapse',
                    'id': 'advance-collapse',
                    'html': $('<form/>', {
                        'role': 'form'
                    })
                            // Append input box for the command cost.
                            .append(helpers.getInputGroup('command-cost', 'number', 'Cost', '0', helpers.getDefaultIfNullOrUndefined(e.discordPricecom, '0'),
                                    'Cost in points that will be taken from the user when running the command.'))
                            // Append input box for the command channel.
                            .append(await getChannelSelector('command-channel', 'Channel', '#commands', helpers.getDefaultIfNullOrUndefined(e.discordChannelcom, ''),
                                    'Channel you want this command to work in. Seperate with commas (no spaces) for multiple. If left empty, the command will work in all channels.'))
                            // Append input box for the command alias.
                            .append(helpers.getInputGroup('command-alias', 'text', 'Alias', '!ex', helpers.getDefaultIfNullOrUndefined(e.discordAliascom, ''),
                                    'Another command name that will also trigger this command.'))
                            // Append input box for the global command cooldown.
                            .append(helpers.getInputGroup('command-cooldown-global', 'number', 'Global Cooldown (Seconds)', '-1', cooldownJson.globalSec,
                                    'Global Cooldown of the command in seconds. -1 Uses the bot-wide settings.'))
                            // Append input box for per-user cooldown.
                            .append(helpers.getInputGroup('command-cooldown-user', 'number', 'Per-User Cooldown (Seconds)', '-1', cooldownJson.userSec,
                                    'Per-User cooldown of the command in seconds. -1 removes per-user cooldown.'))
                            // Callback function to be called once we hit the save button on the modal.
                })), function () {
            let commandName = $('#command-name'),
                    commandResponse = $('#command-response'),
                    commandPermissions = $('#command-permission option'),
                    commandCost = $('#command-cost'),
                    commandChannel = $('#command-channel option'),
                    commandAlias = $('#command-alias'),
                    commandCooldownGlobal = $('#command-cooldown-global'),
                    commandCooldownUser = $('#command-cooldown-user');

            // Remove the ! and spaces.
            commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());
            commandAlias.val(commandAlias.val().replace(/(\!|\s)/g, '').toLowerCase());

            // Generate all permissions.
            const permObj = {
                'roles': [],
                'permissions': []
            };

            commandPermissions.each(function () {
                var section = $(this).parent().attr('label');

                // This is a permission.
                if (section === 'Permissions') {
                    permObj.permissions.push({
                        'name': $(this).html(),
                        'selected': $(this).is(':selected').toString()
                    });
                } else if ($(this).is(':selected')) {
                    permObj.roles.push($(this).attr('id'));
                }
            });

            let commandChannels = [];

            commandChannel.each(function () {
                if ($(this).is(':selected')) {
                    commandChannels.push($(this).val());
                }
            });

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(commandName):
                case helpers.handleInputString(commandResponse):
                case helpers.handleInputNumber(commandCooldownGlobal, - 1):
                case helpers.handleInputNumber(commandCooldownUser, - 1):
                    break;
                default:
                    // Save command information here and close the modal.
                    socket.updateDBValues('discord_custom_command_add', {
                        tables: ['discordPricecom', 'discordPermcom', 'discordCommands'],
                        keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                        values: [commandCost.val(), JSON.stringify(permObj), commandResponse.val()]
                    }, async function () {
                        await new Promise((resolve) => {
                            if (commandChannels.length > 0) {
                                socket.updateDBValue('discord_channel_command_cmd', 'discordChannelcom', commandName.val(), commandChannels.join(','), resolve);
                            } else {
                                socket.removeDBValue('discord_channel_command_cmd', 'discordChannelcom', commandName.val(), resolve);
                            }
                        });

                        await new Promise((resolve) => {
                            if (commandAlias.val().length > 0) {
                                socket.updateDBValue('discord_alias_command_cmd', 'discordAliascom', commandName.val(), commandAlias.val(), resolve);
                            } else {
                                socket.removeDBValue('discord_alias_command_cmd', 'discordAliascom', commandName.val(), resolve);
                            }
                        });

                        socket.wsEvent('discord_custom_command_cooldown_ws', './discord/core/commandCoolDown.js', null,
                                ['add', commandName.val(), commandCooldownGlobal.val(), commandCooldownUser.val()], async function () {

                            // Reload the table.
                            updateDatatable();
                            // Close the modal.
                            $('#' + modalId).modal('hide');
                            // Tell the user the command was added.
                            toastr.success('Successfully ' + (isEdit ? 'edited' : 'added') + ' command !' + commandName.val());

                            await helpers.sleep(5e2);
                            // Add the command to the cache.
                            socket.wsEvent('discord_custom_command_cache', './discord/commands/customCommands.js', '',
                                    [commandName.val(), JSON.stringify(permObj), commandChannels.join(','), commandAlias.val(), commandCost.val()], new Function());
                        });
                    });
            }
        }).on('shown.bs.modal', async function () {
            await refreshChannels();
            if (discordChannels !== null) {
                $('#command-permission').select2({templateResult: discordChannelTemplate});
                $('#command-channel').select2({templateResult: discordChannelTemplate});
            }
        }).modal('toggle');
    }

    // Toggle for the module.
    $('#discordCustomCommandsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('discord_custom_commands_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./discord/commands/customCommands.js', updateDatatable);
    });


    function updateDatatable() {
        // Check if the module is enabled.
        socket.getDBValue('discord_custom_command_module', 'modules', './discord/commands/customCommands.js', function (e) {
            // If the module is off, don't load any data.
            if (!helpers.handleModuleLoadUp('discordCustomCommandsModule', e.modules)) {
                // if the table exists, destroy it.
                if ($.fn.DataTable.isDataTable('#discordCustomCommandsTable')) {
                    $('#discordCustomCommandsTable').DataTable().destroy();
                    // Remove all of the old events.
                    $('#discordCustomCommandsTable').off();
                }
                $('#discord-addcom-button').off();
                return;
            } else {
                $('#discord-addcom-button').off();
                // Add command button.
                $('#discord-addcom-button').on('click', function () {
                    socket.getDBValue('discord_custom_cmds_roles', 'discordPermsObj', 'obj', function (permObj) {
                        let perms = JSON.parse(permObj.discordPermsObj);

                        showAddEditModal(false, '', {}, {globalSec: -1, userSec: -1}, {roles: []}, perms);
                    });
                });
            }

            // Query custom commands.
            socket.getDBTableValues('discord_commands_get_custom', 'discordCommands', function (results) {
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
                    $('#discordCustomCommandsTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                    return;
                }

                // Create table.
                const table = $('#discordCustomCommandsTable').DataTable({
                    'searching': true,
                    'autoWidth': false,
                    'lengthChange': false,
                    'data': tableData,
                    'columnDefs': [
                        {'className': 'default-table', 'orderable': false, 'targets': 2},
                        {'width': '15%', 'targets': 0}
                    ],
                    'columns': [
                        {'title': 'Command'},
                        {'title': 'Response'},
                        {'title': 'Actions'}
                    ]
                });

                // On delete button.
                table.on('click', '.btn-danger', function () {
                    const   command = $(this).data('command'),
                            row = $(this).parents('tr');

                    // Ask the user if he want to remove the command.
                    helpers.getConfirmDeleteModal('custom_command_modal_remove', 'Are you sure you want to remove command !' + command + '?', true,
                            'The command !' + command + ' has been successfully removed!', function () {
                                socket.removeDBValues('discord_custom_command_rm', {
                                    tables: ['discordCommands', 'discordPermcom', 'discordCooldown', 'discordChannelcom', 'discordPricecom', 'discordAliascom'],
                                    keys: [command, command, command, command, command, command]
                                }, function () {
                                    socket.wsEvent('discord_custom_command_rm_cache', './discord/commands/customCommands.js', 'remove', [command], function () {
                                        // Remove the table row.
                                        table.row(row).remove().draw(false);
                                    });
                                });
                            });
                });

                // On edit button.
                table.on('click', '.btn-warning', function () {
                    const command = $(this).data('command');

                    // Get all the info about the command.
                    socket.getDBValues('discord_custom_command_edit', {
                        tables: ['discordPricecom', 'discordPermcom', 'discordAliascom', 'discordChannelcom', 'discordCommands', 'discordCooldown', 'discordPermsObj'],
                        keys: [command, command, command, command, command, command, 'obj']
                    }, function (e) {
                        let cooldownJson = (e.discordCooldown === null ? {globalSec: -1, userSec: -1} : JSON.parse(e.discordCooldown)),
                                perm = JSON.parse(e.discordPermcom),
                                perms = JSON.parse(e.discordPermsObj);

                        showAddEditModal(true, command, e, cooldownJson, perm, perms);
                    });
                });
            });
        });
    }

    updateDatatable();
});
