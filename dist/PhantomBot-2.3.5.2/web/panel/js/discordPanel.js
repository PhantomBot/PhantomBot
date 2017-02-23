/*
 * Copyright (C) 2017 phantombot.tv
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

/* 
 * @author ScaniaTV
 */
(function() {
    var iconToggle = [],
        i;

    iconToggle['false'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle-o\" />";
    iconToggle['true'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle\" />";

    /*
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (jsonEx) {
            console.error('Failed to parse panel message [discordPanel.js]: ' + jsonEx.message);
            return;
        }

        if (panelCheckQuery(msgObject, 'discord_settings')) {
            var keys = msgObject['results'];

            for (i in keys) {
                if (keys[i]['value'] !== 'true' && keys[i]['value'] !== 'false') {
                    $('#' + keys[i]['key'] + 'Input').val(keys[i]['value']);
                } else {
                    $('#' + keys[i]['key'] + 'Input').html(iconToggle[keys[i]['value']]);
                }
            }
        }

        if (panelCheckQuery(msgObject, 'discord_commnads')) {
            var keys = msgObject['results'],
                html = '<table style="width: 100%"><tr><th>Command</th><th>Response</th><th>Cooldown</th><th style="float: right;"></td>',
                dataObj = {},
                permission,
                cooldown,
                response,
                command,
                channel;
                
            for (i in keys) {
                if (keys[i]['table'] == 'discordPermcom') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { permission: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].permission = keys[i]['value'];
                    }
                } else if (keys[i]['table'] == 'discordCooldown') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { cooldown: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].cooldown = keys[i]['value'];
                    }
                } else if (keys[i]['table'] == 'discordChannelcom') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { channel: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].channel = keys[i]['value'];
                    }
                }
            }

            for (i in keys) {
                if (keys[i]['table'] == 'discordCommands') {
                    command = keys[i]['key'];
                    response = keys[i]['value'];
                    permission = dataObj[command].permission;
                    channel = (dataObj[command] !== undefined && dataObj[command].channel === undefined ? '' : dataObj[command].channel);
                    cooldown = (dataObj[command] !== undefined && dataObj[command].cooldown === undefined ? 0 : dataObj[command].cooldown);

                    html += '<tr>' +
                        '<td>!' + (command.length > 10 ?  command.substring(0, 10) + '...' : command) + '</td>' +
                        '<td>' + (response.length > 50 ?  response.substring(0, 50) + '...' : response) + '</td>' +
                        '<td>' + cooldown + ' sec '+ '</td>' +
                        '<td style="float: right;"><button type="button" class="btn btn-default btn-xs" onclick="$.openCommandModal(\'' + command + '\', \'' + response + '\', \'' + permission + '\', \'' + cooldown + '\', \'' + channel + '\')"><i class="fa fa-pencil" /> </button>' +
                        '<button type="button" id="delete_command_' + command.replace(/[^a-z1-9_]/ig, '_') + '" class="btn btn-default btn-xs" onclick="$.updateDiscordCommand(\'' + command + '\', \'true\')"><i class="fa fa-trash" /> </button></td> ' +
                        '</tr>';
                }
            }
            html += '</table>';
            $('#command-list').html(html);
        }
    }

    /*
     * @function updateDiscordTable
     */
    function updateDiscordTable(htmlId, script, table, key, value) {
        var data = (value !== undefined ? value : $('#' + htmlId).val());

        if (value !== undefined) {
            $('#' + htmlId).html('<i style="color: #6136b1" class="fa fa-spinner fa-spin"/>');
        }

        if ((typeof data === 'string' && data.length > 0) || typeof data === 'number') {
            sendDBUpdate('discord_update', table, key, data.toString());

            setTimeout(function() { sendWSEvent('discord', './discord/' + script); doQuery(); }, TIMEOUT_WAIT_TIME);
        } else {
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /*
     * @function resetHtmlValue
     */
    function resetHtmlValues() {
        $('#command-name-modal').val('');
        $('#command-response-modal').val('');
        $('#command-permission-modal').val('');
        $('#command-cooldown-modal').val('');
        $('#command-channel-modal').val();
        $('#command-add-name-modal').val('');
        $('#command-add-response-modal').val('');
        $('#command-add-permission-modal').val('0');
        $('#command-add-cooldown-modal').val('0');
        $('#command-add-channel-modal').val('');
    }

    /*
     * @function updateDiscordCommand
     */
    function updateDiscordCommand(cmd, isToRemove) {
        if (isToRemove == 'true') {
            $('#delete_command_' + cmd.replace(/[^a-z1-9_]/ig, '_')).html('<i style="color: #6136b1" class="fa fa-spinner fa-spin"/>');
            sendDBDelete('discord_command', 'discordCommands', cmd);
            sendDBDelete('discord_command', 'discordPermcom', cmd);
            sendDBDelete('discord_command', 'discordCooldown', cmd);
            sendDBDelete('discord_command', 'discordChannelcom', cmd);
            sendWSEvent('discord', './discord/commands/customCommands.js', 'remove', [cmd]);
        } else {
            var command = ($('#command-name-modal').val().length === 0 ? $('#command-add-name-modal').val() : $('#command-name-modal').val()),
                response = ($('#command-response-modal').val().length === 0 ?  $('#command-add-response-modal').val() : $('#command-response-modal').val()),
                permission = ($('#command-permission-modal').val().length === 0 ?  $('#command-add-permission-modal').val() : $('#command-permission-modal').val()),
                cooldown = ($('#command-cooldown-modal').val().length === 0 ? $('#command-add-cooldown-modal').val() : $('#command-cooldown-modal').val()),
                channel = ($('#command-channel-modal').val().length === 0 ? $('#command-add-channel-modal').val() : $('#command-channel-modal').val());

            if (command.length === 0 || response.length === 0 || command.match(/[\'\"\s]/ig) || (permission != 1 && permission != 0)) {
                setTimeout(function() { doQuery(); resetHtmlValues(); }, TIMEOUT_WAIT_TIME);
                newPanelAlert('Could not add command !' + command + '. Either the response was blank, the permission was invalid, or it contained a special symbol.', 'danger', 10000);
                return;
            }

            command = command.replace('!', '').toLowerCase();

            sendDBUpdate('discord_command', 'discordCommands', command, response.toString());
            sendDBUpdate('discord_command', 'discordPermcom', command, permission.toString());
            sendDBUpdate('discord_command', 'discordCooldown', command, cooldown.toString());
            if (channel.length > 0) {
                sendDBUpdate('discord_command', 'discordChannelcom', command, channel.replace('#', '').toString());
            } else {
                sendDBDelete('discord_command', 'discordChannelcom', command);
            }
            setTimeout(function() { sendWSEvent('discord', './discord/commands/customCommands.js', null, [command, permission, channel]); }, TIMEOUT_WAIT_TIME);
        }

        setTimeout(function() { doQuery(); resetHtmlValues(); }, TIMEOUT_WAIT_TIME);
    }

    /*
     * @function openCommandModal
     */
    function openCommandModal(command, response, permission, cooldown, channel) {
        $('#command-name-modal').val(command);
        $('#command-response-modal').val(response);
        $('#command-permission-modal').val(permission);
        $('#command-cooldown-modal').val(cooldown);
        $('#command-channel-modal').val(channel);

        $('#command-modal').modal();
    }

    /*
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('discord_settings', 'discordSettings');
        sendDBKeysList('discord_commnads', ['discordCommands', 'discordCooldown', 'discordPermcom', 'discordChannelcom']);
    }

    /* Import the HTML file for this panel. */
    $('#discordPanel').load('/panel/discord.html');

    /* Load the DB items for this panel, wait to ensure that we are connected. */
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 18) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    /* Query the DB every 30 seconds for updates. */
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 18 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Discord Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    /* Export functions to the API */
    $.updateDiscordTable = updateDiscordTable;
    $.updateDiscordCommand = updateDiscordCommand;
    $.openCommandModal = openCommandModal;
    $.discordOnMessage = onMessage;
    $.discordDoQuery = doQuery;
})();
