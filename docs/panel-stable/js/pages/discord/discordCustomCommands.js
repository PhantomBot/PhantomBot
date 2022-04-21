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

$(run = function () {
    let discordChannels = null,
        allowedChannelTypes = ['GUILD_NEWS', 'GUILD_TEXT'],
        callback = null;

    function refreshChannels(oncomplete) {
        callback = oncomplete;
        socket.getDiscordChannelList('discord_customcommands1_getchannels', function (d) {
            discordChannels = d.data;
            if (callback !== undefined && callback !== null) {
                callback();
            }
        });
    }

    function getChannelSelector(id, title, placeholder, value, tooltip, allowedChannelTypes) {
        if (discordChannels === null) {
            return helpers.getInputGroup(id, 'text', title, placeholder, value, tooltip);
        }
        let data = [];

        for (const [category, channels] of Object.entries(discordChannels)) {
            let entry = {};
            entry.title = channels.name;
            entry.options = [];

            for (const [channel, info] of Object.entries(channels)) {
                if (channel == 'name') {
                    continue;
                }

                entry.options.push({
                    'name': info.name,
                    'value': channel,
                    'selected': channel == value,
                    'disabled': !allowedChannelTypes.includes(info.type)
                });
            }

            data.push(entry);
        }

        return helpers.getDropdownGroupWithGrouping(id, title, data, tooltip);
    }

    function discordChannelTemplate(fchannel) {
        if (discordChannels === undefined || discordChannels === null) {
            return $('<span><i class="fa fa-triangle-exclamation fa-lg" style="margin-right: 5px;" /> Unable retrieve channel list</span>');
        }
        if (fchannel.id) {
            for (const [category, channels] of Object.entries(discordChannels)) {
                for (const [channel, info] of Object.entries(channels)) {
                    if (fchannel.id == channel) {
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

    // Check if the module is enabled.
    socket.getDBValue('discord_custom_command_module', 'modules', './discord/commands/customCommands.js', function (e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('discordCustomCommandsModule', e.modules)) {
            return;
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
                $('#discordCustomCommandsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#discordCustomCommandsTable').off();
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
                        socket.removeDBValues('rm_discord_command', {
                            tables: ['discordCommands', 'discordPermcom', 'discordCooldown', 'discordChannelcom', 'discordPricecom', 'discordAliascom'],
                            keys: [command, command, command, command, command, command]
                        }, function () {
                            socket.wsEvent('discord', './discord/commands/customCommands.js', 'remove', [command], function () {
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
                socket.getDBValues('custom_command_edit', {
                    tables: ['discordPricecom', 'discordPermcom', 'discordAliascom', 'discordChannelcom', 'discordCommands', 'discordCooldown', 'discordPermsObj'],
                    keys: [command, command, command, command, command, command, 'obj']
                }, function (e) {
                    let cooldownJson = (e.discordCooldown === null ? { globalSec: -1, userSec: -1 } : JSON.parse(e.discordCooldown)),
                        perm = JSON.parse(e.discordPermcom),
                        perms = JSON.parse(e.discordPermsObj);

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-command', 'Edit Command', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('command-name', 'text', 'Command', '', '!' + command, 'Name of the command. This cannot be edited.', true))
                    // Append a text box for the command response.
                    .append(helpers.getTextAreaGroup('command-response', 'text', 'Response', '', e.discordCommands, 'Response of the command.'))
                    // Append a select option for the command permission.
                    .append(helpers.getMultiDropdownGroup('command-permission', 'Allowed Roles and Permissions', [
                        {
                            'title': 'Permissions',
                            'options': perm.permissions
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
                        .append(getChannelSelector('command-channel', 'Channel', '#commands', helpers.getDefaultIfNullOrUndefined(e.discordChannelcom, ''),
                                'Channel you want this command to work in. Seperate with commas (no spaces) for multiple. If left empty, the command will work in all channels.', allowedChannelTypes))
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
                            commandChannel = $('#command-channel'),
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
                            if (section == 'Permissions') {
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
                            case helpers.handleInputNumber(commandCooldownGlobal, -1):
                            case helpers.handleInputNumber(commandCooldownUser, -1):
                                break;
                            default:
                                // Save command information here and close the modal.
                                socket.updateDBValues('custom_command_add', {
                                    tables: ['discordPricecom', 'discordPermcom', 'discordCommands',],
                                    keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                                    values: [commandCost.val(), JSON.stringify(permObj), commandResponse.val()]
                                }, function () {
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

                                    socket.wsEvent('custom_command_edit_cooldown_ws', './discord/core/commandCoolDown.js', null,
                                        ['add', commandName.val(), commandCooldownGlobal.val(), commandCooldownUser.val()], function () {

                                        // Reload the table.
                                        run();
                                        // Close the modal.
                                        $('#edit-command').modal('hide');
                                        // Tell the user the command was added.
                                        toastr.success('Successfully edited command !' + commandName.val());

                                        // I hate doing this, but the logic is fucked anyways.
                                        helpers.setTimeout(function () {
                                            // Add the command to the cache.
                                            socket.wsEvent('discord', './discord/commands/customCommands.js', '',
                                                    [commandName.val(), JSON.stringify(permObj), commandChannel.val(), commandAlias.val(), commandCost.val()], new Function());
                                        }, 5e2);
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                        refreshChannels(function () {
                            if (discordChannels !== null) {
                                $('#command-permission').select2({templateResult: discordChannelTemplate});
                                $('#command-channel').select2({templateResult: discordChannelTemplate});
                            }
                        });
                    }).modal('toggle');
                });
            });
        });
    });

    refreshChannels();
});


// Function that handlers the loading of events.
$(function () {
    let discordChannels = null,
        allowedChannelTypes = ['GUILD_NEWS', 'GUILD_TEXT'],
        callback = null;

    function refreshChannels(oncomplete) {
        callback = oncomplete;
        socket.getDiscordChannelList('discord_customcommands2_getchannels', function (d) {
            discordChannels = d.data;
            if (callback !== undefined && callback !== null) {
                callback();
            }
        });
    }

    function getChannelSelector(id, title, placeholder, value, tooltip, allowedChannelTypes) {
        if (discordChannels === null) {
            return helpers.getInputGroup(id, 'text', title, placeholder, value, tooltip);
        }
        let data = [];

        for (const [category, channels] of Object.entries(discordChannels)) {
            let entry = {};
            entry.title = channels.name;
            entry.options = [];

            for (const [channel, info] of Object.entries(channels)) {
                if (channel == 'name') {
                    continue;
                }

                entry.options.push({
                    'name': info.name,
                    'value': channel,
                    'selected': channel == value,
                    'disabled': !allowedChannelTypes.includes(info.type)
                });
            }

            data.push(entry);
        }

        return helpers.getDropdownGroupWithGrouping(id, title, data, tooltip);
    }

    function discordChannelTemplate(fchannel) {
        if (discordChannels === undefined || discordChannels === null) {
            return $('<span><i class="fa fa-triangle-exclamation fa-lg" style="margin-right: 5px;" /> Unable retrieve channel list</span>');
        }

        if (fchannel.id) {
            for (const [category, channels] of Object.entries(discordChannels)) {
                for (const [channel, info] of Object.entries(channels)) {
                    if (fchannel.id == channel) {
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

    // Toggle for the module.
    $('#discordCustomCommandsModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('discord_custom_commands_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./discord/commands/customCommands.js', run);
    });

    // Add command button.
    $('#discord-addcom-button').on('click', function () {
        socket.getDBValue('discord_custom_cmds_roles', 'discordPermsObj', 'obj', function (permObj) {
            let perms = JSON.parse(permObj.discordPermsObj);

            // Get advance modal from our util functions in /utils/helpers.js
            helpers.getAdvanceModal('add-command', 'Add Command', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Append input box for the command name.
            .append(helpers.getInputGroup('command-name', 'text', 'Command', '!example'))
            // Append a text box for the command response.
            .append(helpers.getTextAreaGroup('command-response', 'text', 'Response', 'Response example!'))
            // Append a select option for the command permission.
            .append(helpers.getMultiDropdownGroup('command-permission', 'Allowed Roles and Permissions', [
                {
                    'title': 'Permissions',
                    'options': [{
                            'name': 'Administrators',
                            'selected': 'true'
                        }]
                },
                {
                    'title': 'Roles',
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
                .append(helpers.getInputGroup('command-cost', 'number', 'Cost', '0', '0',
                    'Cost in points that will be taken from the user when running the command.'))
                // Append input box for the command channel.
                .append(getChannelSelector('command-channel', 'Channel', '#commands', '',
                    'Channel you want this command to work in. Seperate with a space and comma for multiple. If left empty, the command will work in all channels.', allowedChannelTypes))
                // Append input box for the command alias.
                .append(helpers.getInputGroup('command-alias', 'text', 'Alias', '!ex', '',
                    'Another command name that will also trigger this command.'))
                // Append input box for the global command cooldown.
                .append(helpers.getInputGroup('command-cooldown-global', 'number', 'Global Cooldown (Seconds)', '-1', undefined,
                    'Global Cooldown of the command in seconds. -1 Uses the bot-wide settings.')
                // Append input box for per-user cooldown.
                .append(helpers.getInputGroup('command-cooldown-user', 'number', 'Per-User Cooldown (Seconds)', '-1', undefined,
                    'Per-User cooldown of the command in seconds. -1 removes per-user cooldown.')))
                // Callback function to be called once we hit the save button on the modal.
            })), function () {
                let commandName = $('#command-name'),
                    commandResponse = $('#command-response'),
                    commandPermissions = $('#command-permission option'),
                    commandCost = $('#command-cost'),
                    commandChannel = $('#command-channel'),
                    commandAlias = $('#command-alias'),
                    commandCooldownGlobal = $('#command-cooldown-global'),
                    commandCooldownUser = $('#command-cooldown-user');

                // Remove the ! and spaces.
                commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());
                commandAlias.val(commandAlias.val().replace(/(\!|\s)/g, '').toLowerCase());

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(commandName):
                    case helpers.handleInputString(commandResponse):
                    case helpers.handleInputNumber(commandCooldownGlobal, -1):
                    case helpers.handleInputNumber(commandCooldownUser, -1):
                        break;
                    default:
                        // Make sure the command doesn't exist already.
                        socket.getDBValue('custom_command_exists', 'discordPermcom', commandName.val(), function (e) {
                            // If the command exists we stop here.
                            if (e.discordPermcom !== null) {
                                toastr.error('Failed to add command as it already exists.');
                                return;
                            }

                            // Generate all permissions.
                            const permObj = {
                                'roles': [],
                                'permissions': []
                            };

                            commandPermissions.each(function () {
                                var section = $(this).parent().attr('label');

                                // This is a permission.
                                if (section == 'Permissions') {
                                    permObj.permissions.push({
                                        'name': $(this).html(),
                                        'selected': $(this).is(':selected').toString()
                                    });
                                } else if ($(this).is(':selected')) {
                                    permObj.roles.push($(this).attr('id'));
                                }
                            });

                            // Save command information here and close the modal.
                            socket.updateDBValues('custom_command_add', {
                                tables: ['discordPricecom', 'discordPermcom', 'discordCommands'],
                                keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                                values: [commandCost.val(), JSON.stringify(permObj), commandResponse.val()]
                            }, function () {
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

                                socket.wsEvent('custom_discord_command_cooldown_ws', './discord/core/commandCoolDown.js', null,
                                    ['add', commandName.val(), commandCooldownGlobal.val(), commandCooldownUser.val()], function () {

                                    // Reload the table.
                                    run();
                                    // Close the modal.
                                    $('#add-command').modal('hide');
                                    // Tell the user the command was added.
                                    toastr.success('Successfully added command !' + commandName.val());

                                    // I hate doing this, but the logic is fucked anyways.
                                    helpers.setTimeout(function () {
                                        // Add the command to the cache.
                                        socket.wsEvent('discord', './discord/commands/customCommands.js', '',
                                                [commandName.val(), JSON.stringify(permObj), commandChannel.val(), commandAlias.val(), commandCost.val()], new Function());
                                    }, 5e2);
                                });
                            });
                        });
                }
            }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#command-permission').select2({templateResult: discordChannelTemplate});
                        $('#command-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    refreshChannels();
});
