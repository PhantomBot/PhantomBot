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

        if (panelCheckQuery(msgObject, 'discord_gambling')) {
            for (i in msgObject['results']) {
                $('#gamble_' + msgObject['results'][i]['key']).val(msgObject['results'][i]['value']);
            }
        }

        if (panelCheckQuery(msgObject, 'discord_slotmachine')) {
            for (i in msgObject['results']) {
                $('#discordSlotRewards' + i + 'Input').val(msgObject['results'][i]['value']);
            }
        }

         if (panelCheckQuery(msgObject, 'discord_roll')) {
            for (i in msgObject['results']) {
                $('#discordRollRewards' + i + 'Input').val(msgObject['results'][i]['value']);
            }
        }

        if (panelCheckQuery(msgObject, 'discord_slotmachineemojis')) {
            for (i in msgObject['results']) {
                $('#slotEmoji' + i + 'Input').val(msgObject['results'][i]['value']);
            }
        }

        if (panelCheckQuery(msgObject, 'discord_settings')) {
            var keys = msgObject['results'];

            for (i in keys) {
                if (keys[i]['value'] !== 'true' && keys[i]['value'] !== 'false' && keys[i]['key'] !== 'hostChannel') {
                    $('#' + keys[i]['key'] + 'Input').val(keys[i]['value']);
                } else if (keys[i]['key'] === 'hostChannel') {
                    $('#hostdChannelInput').val(keys[i]['value']);
                } else {
                    $('#' + keys[i]['key'] + 'Input').html(iconToggle[keys[i]['value']]);
                }
            }
        }

        if (panelCheckQuery(msgObject, 'discord_keywords')) {
            var keys = msgObject['results'],
                html = '<table>';

            if (keys.length === 0) {
                $('#keyword-list').html('<i>There are no keywords defined.</i>');
                return;
            }

            for (i in keys) {
                var name = keys[i]['key'],
                    val = keys[i]['value'];

                html += '<tr style="textList">' +
                    '    <td style="width: 15%">' + (name.length > 10 ?  name.substring(0, 10) + '...' : name) + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 90%" type="text" id="editKeyword_' + name.replace(/[^a-zA-Z0-9_]/g, '_SPC_') + '"' +
                    '                   value="' + val + '" />' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" id="removeKeyword_' + name.replace(/[^a-zA-Z0-9_]/g, '_SPC_') + '" onclick="$.removeKeyword(\'' + name + '\')"><i class="fa fa-trash" /> </button>' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" onclick="$.editKeyword(\'' + name + '\')"><i class="fa fa-pencil" /> </button> ' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
            }
            html += '</table>';
            $('#keyword-list').html(html);
        }

        if (panelCheckQuery(msgObject, 'discord_commands')) {
            var keys = msgObject['results'],
                html = '<table style="width: 100%"><tr><th>Command</th><th>Response</th><th>Cooldown</th><th style="float: right;"></td>',
                dataObj = {},
                permission,
                cost,
                cooldown,
                response,
                command,
                channel,
                global;
            
            if (keys.length === 0) {
                $('#commands-list').html('<i>There are no commands defined.</i>');
                return;
            }

            for (i in keys) {
                if (keys[i]['table'] == 'discordPermcom') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { permission: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].permission = keys[i]['value'];
                    }
                } else if (keys[i]['table'] == 'discordCooldown') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { cooldown: JSON.parse(keys[i]['value']).seconds, isGlobal: (JSON.parse(keys[i]['value']).isGlobal == 'true') };
                    } else {
                        dataObj[keys[i]['key']].cooldown = JSON.parse(keys[i]['value']).seconds;
                        dataObj[keys[i]['key']].isGlobal = (JSON.parse(keys[i]['value']).isGlobal == 'true');
                    }
                } else if (keys[i]['table'] == 'discordChannelcom') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { channel: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].channel = keys[i]['value'];
                    }
                } else if (keys[i]['table'] == 'discordPricecom') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { cost: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].cost = keys[i]['value'];
                    }
                } else if (keys[i]['table'] == 'discordAliascom') {
                    if (dataObj[keys[i]['key']] === undefined) {
                        dataObj[keys[i]['key']] = { alias: keys[i]['value'] };
                    } else {
                        dataObj[keys[i]['key']].alias = keys[i]['value'];
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
                    cost = (dataObj[command] !== undefined && dataObj[command].cost === undefined ? 0 : dataObj[command].cost);
                    global = (dataObj[command] !== undefined && dataObj[command].isGlobal === undefined ? true : dataObj[command].isGlobal);

                    html += '<tr>' +
                        '<td>!' + (command.length > 10 ?  command.substring(0, 10) + '...' : command) + '</td>' +
                        '<td>' + (response.length > 50 ?  response.substring(0, 50) + '...' : response) + '</td>' +
                        '<td>' + cooldown + ' sec '+ '</td>' +
                        '<td style="float: right;"><button type="button" class="btn btn-default btn-xs" onclick="$.openCommandModal(\'' + command + '\', \'' + response + '\', \'' + permission + '\', \'' + cost + '\', \'' + cooldown + '\', \'' + channel + '\', \'' + global +'\')"><i class="fa fa-pencil" /> </button>' +
                        '<button type="button" id="delete_command_' + command.replace(/[^a-z1-9_]/ig, '_') + '" class="btn btn-default btn-xs" onclick="$.updateDiscordCommand(\'' + command + '\', \'true\')"><i class="fa fa-trash" /> </button></td> ' +
                        '</tr>';
                }
            }
            html += '</table>';
            $('#command-list').html(html);
        }
    }

    /*
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('discord_settings', 'discordSettings');
        sendDBKeys('discord_keywords', 'discordKeywords');
        sendDBKeys('discord_gambling', 'discordGambling');
        sendDBKeys('discord_roll', 'discordRollReward');
        sendDBKeys('discord_slotmachine', 'discordSlotMachineReward');
        sendDBKeys('discord_slotmachineemojis', 'discordSlotMachineEmojis');
        sendDBKeysList('discord_commands', ['discordCommands', 'discordCooldown', 'discordPermcom', 'discordChannelcom']);
    }

    /*
     * @function updateDiscordTable
     */
    function updateDiscordTable(htmlId, script, table, key, value) {
        var data = (value !== undefined ? value : $('#' + htmlId).val());

        console.log(htmlId + ';' + script + ';' + table + ';' + key + '');
        if (value !== undefined) {
            $('#' + htmlId).html('<i style="color: #6136b1" class="fa fa-spinner fa-spin"/>');
        }

        if ((typeof data === 'string' && data.length > 0) || typeof data === 'number') {
            if (key == 'modLogs') {
                if (value == 'true') {
                    sendDBUpdate('discord_update', 'chatModerator', 'moderationLogs', 'true');
                } else {
                    sendDBUpdate('discord_update', 'chatModerator', 'moderationLogs', 'false');
                }
            }
            
            console.log(table + ':' + key + ':' + data);
            sendDBUpdate('discord_update', table, key, String(data));

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
        $('#command-add-cost-modal').val('0');
        $('#command-add-channel-modal').val('');
        $('#command-add-global').prop('checked', true);
        $('#command-edit-global').prop('checked', true);
    }

    /*
     * @function updateDiscordCommand
     */
    function updateDiscordCommand(cmd, isToRemove) {
        if ((typeof isToRemove === 'string' ? isToRemove == 'true' : isToRemove == true)) {
            $('#delete_command_' + cmd.replace(/[^a-z1-9_]/ig, '_')).html('<i style="color: #6136b1" class="fa fa-spinner fa-spin"/>');
            sendDBDelete('discord_command', 'discordCommands', cmd);
            sendDBDelete('discord_command', 'discordPermcom', cmd);
            sendDBDelete('discord_command', 'discordCooldown', cmd);
            sendDBDelete('discord_command', 'discordChannelcom', cmd);
            sendDBDelete('discord_command', 'discordPricecom', cmd);
            sendDBDelete('discord_command', 'discordAliascom', cmd);
            sendWSEvent('discord', './discord/commands/customCommands.js', 'remove', [cmd]);
        } else {
            var command = ($('#command-name-modal').val().length === 0 ? $('#command-add-name-modal').val() : $('#command-name-modal').val()),
                response = ($('#command-response-modal').val().length === 0 ?  $('#command-add-response-modal').val() : $('#command-response-modal').val()),
                permission = ($('#command-permission-modal').val().length === 0 ?  $('#command-add-permission-modal').val() : $('#command-permission-modal').val()),
                cooldown = ($('#command-cooldown-modal').val().length === 0 ? $('#command-add-cooldown-modal').val() : $('#command-cooldown-modal').val()),
                channel = ($('#command-channel-modal').val().length === 0 ? $('#command-add-channel-modal').val() : $('#command-channel-modal').val()),
                price = ($('#command-cost-modal').val().length === 0 ? $('#command-add-cost-modal').val() : $('#command-cost-modal').val()),
                alias = ($('#command-alias-modal').val().length === 0 ? $('#command-add-alias-modal').val() : $('#command-alias-modal').val()),
                checked = ($('#command-add-global').is(':checked'));

            if (command.length === 0 || response.length === 0 || command.match(/[\'\"\s]/ig) || (permission != 1 && permission != 0)) {
                setTimeout(function() { doQuery(); resetHtmlValues(); }, TIMEOUT_WAIT_TIME);
                newPanelAlert('Could not add command !' + command + '. Either the response was blank, the permission was invalid, or it contained a special symbol.', 'danger', 10000);
                return;
            }

            command = command.replace('!', '').toLowerCase();
            alias = alias.replace('!', '').toLowerCase();

            sendDBUpdate('discord_command', 'discordCommands', command, response.toString());
            sendDBUpdate('discord_command', 'discordPermcom', command, permission.toString());
            sendDBUpdate('discord_command', 'discordCooldown', command, JSON.stringify({command: String(command), seconds: String(cooldown), isGlobal: String(checked)}));
            sendDBUpdate('discord_command', 'discordPricecom', command, price.toString());
            if (channel.length === 0) {
                sendDBDelete('discord_command', 'discordChannelcom', command);
            }
            if (alias.length > 0) {
                sendDBUpdate('discord_command', 'discordAliascom', command, alias.toString());
            } else {
                sendDBDelete('discord_command', 'discordAliascom', command);
            }
            setTimeout(function() { sendWSEvent('discord', './discord/commands/customCommands.js', null, [command, permission, channel, alias, price]); }, TIMEOUT_WAIT_TIME);
        }

        setTimeout(function() { doQuery(); resetHtmlValues(); }, TIMEOUT_WAIT_TIME);
    }

    /*
     * @function openCommandModal
     */
    function openCommandModal(command, response, permission, cost, cooldown, channel, checked) {
        $('#command-name-modal').val(command);
        $('#command-response-modal').val(response);
        $('#command-permission-modal').val(permission);
        $('#command-cooldown-modal').val(cooldown);
        $('#command-channel-modal').val(channel);
        $('#command-cost-modal').val(cost);
        $('#command-edit-global').prop('checked', checked == 'true');

        $('#command-modal').modal();
    }

    /*
     * @function editKeyword
     */
    function editKeyword(keyword) {
        var value = $('#editKeyword_' + keyword.replace(/[^a-zA-Z0-9_]/g, '_SPC_')).val();

        if (value.length > 0) {
            sendDBUpdate('discord_keyword', 'discordKeywords', keyword, value);
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /*
     * @function removeKeyword
     */
    function removeKeyword(keyword) {
        $('#removeKeyword_' + keyword.replace(/[^a-zA-Z0-9_]/g, '_SPC_')).html('<i style="color: #6136b1" class="fa fa-spinner fa-spin"/>');
        sendDBDelete('discord_keyword', 'discordKeywords', keyword);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /*
     * @function addKeyword
     */
    function addKeyword() {
        var keyword = $('#custom-keyword').val(),
            value = $('#custom-keyword-value').val();

        if (keyword.length > 0 && value.length > 0) {
            sendDBUpdate('discord_keyword', 'discordKeywords', keyword, value);
        }
        $('#custom-keyword').val('');
        $('#custom-keyword-value').val('');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function setDiscordSlotRewards
     */
    function setDiscordSlotRewards() {
        var val0 = $('#discordSlotRewards0Input').val(),
            val1 = $('#discordSlotRewards1Input').val(),
            val2 = $('#discordSlotRewards2Input').val(),
            val3 = $('#discordSlotRewards3Input').val(),
            val4 = $('#discordSlotRewards4Input').val();

        if (val0.length > 0 && val1.length > 0 && val2.length > 0 && val3.length > 0 && val4.length > 0) {
            sendDBUpdate('slotRewards0', 'discordSlotMachineReward', 'reward_0', val0);
            sendDBUpdate('slotRewards1', 'discordSlotMachineReward', 'reward_1', val1);
            sendDBUpdate('slotRewards2', 'discordSlotMachineReward', 'reward_2', val2);
            sendDBUpdate('slotRewards3', 'discordSlotMachineReward', 'reward_3', val3);
            sendDBUpdate('slotRewards4', 'discordSlotMachineReward', 'reward_4', val4);
            setTimeout(function() { doQuery(); sendWSEvent('discord', './discord/games/slotMachine.js', null, null); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function setSlotEmojis
     */
    function setSlotEmojis() {
        var val0 = $('#slotEmoji0Input').val(),
            val1 = $('#slotEmoji1Input').val(),
            val2 = $('#slotEmoji2Input').val(),
            val3 = $('#slotEmoji3Input').val(),
            val4 = $('#slotEmoji4Input').val();
         
        if (val0.length > 0 && val1.length > 0 && val2.length > 0 && val3.length > 0 && val4.length > 0) {
            sendDBUpdate('slotEmojis0', 'discordSlotMachineEmojis', 'emoji_0', val0);
            sendDBUpdate('slotEmojis1', 'discordSlotMachineEmojis', 'emoji_1', val1);
            sendDBUpdate('slotEmojis2', 'discordSlotMachineEmojis', 'emoji_2', val2);
            sendDBUpdate('slotEmojis3', 'discordSlotMachineEmojis', 'emoji_3', val3);
            sendDBUpdate('slotEmojis4', 'discordSlotMachineEmojis', 'emoji_4', val4);
            setTimeout(function() { doQuery(); sendWSEvent('discord', './discord/games/slotMachine.js', null, null); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function setDiscordRollRewards 
     */
    function setDiscordRollRewards() {
        var val0 = $('#discordRollRewards0Input').val(),
            val1 = $('#discordRollRewards1Input').val(),
            val2 = $('#discordRollRewards2Input').val(),
            val3 = $('#discordRollRewards3Input').val(),
            val4 = $('#discordRollRewards4Input').val(),
            val5 = $('#discordRollRewards5Input').val();

        if (val0.length > 0 && val1.length > 0 && val2.length > 0 && val3.length > 0 && val4.length > 0 && val5.length > 0) {
            sendDBUpdate('rollRewards0', 'discordRollReward', 'rewards_0', val0);
            sendDBUpdate('rollRewards1', 'discordRollReward', 'rewards_1', val1);
            sendDBUpdate('rollRewards2', 'discordRollReward', 'rewards_2', val2);
            sendDBUpdate('rollRewards3', 'discordRollReward', 'rewards_3', val3);
            sendDBUpdate('rollRewards4', 'discordRollReward', 'rewards_4', val4);
            sendDBUpdate('rollRewards5', 'discordRollReward', 'rewards_5', val5);
            setTimeout(function() { doQuery(); sendWSEvent('discord', './discord/games/roll.js', null, null); }, TIMEOUT_WAIT_TIME);
        }
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
    $.editKeyword = editKeyword;
    $.removeKeyword = removeKeyword;
    $.addKeyword = addKeyword;
    $.setDiscordSlotRewards = setDiscordSlotRewards;
    $.setSlotEmojis = setSlotEmojis;
    $.setDiscordRollRewards = setDiscordRollRewards;
})();
