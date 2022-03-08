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

/**
 * This module is to handle custom commands for discord.
 */
(function() {
    var reCustomAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&]+)\)/),
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&]+)\s([\w\W]+)\)/),
        reCustomArg = new RegExp(/\(([1-9])=([a-zA-Z1-9\)\(]+)\)/),
        reCustomToUserArg = new RegExp(/\(touser=([a-zA-Z1-9]+)\)/),
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/);

    /**
     * @function getCustomAPIValue
     *
     * @export $.discord
     * @param {string} url
     * @return {object}
     */
    function getCustomAPIValue(url) {
        var HttpResponse = Packages.com.gmt2001.HttpResponse,
            HttpRequest = Packages.com.gmt2001.HttpRequest,
            HashMap = Packages.java.util.HashMap,
            responseData = HttpRequest.getData(HttpRequest.RequestType.GET, url, '', new HashMap());

        return responseData.content;
    }

    /**
     * @function tags
     *
     * @export $.discord
     * @param {object} event
     * @param {string} s
     * @return {string}
     */
    function tags(event, s) {
        if (s.match(reCustomArg)) {
            s = $.replace(s, s.match(reCustomArg)[0], (event.getArgs()[parseInt(s.match(reCustomArg)[1]) - 1] === undefined ? s.match(reCustomArg)[2] : $.discord.resolve.global(event.getArgs()[parseInt(s.match(reCustomArg)[1]) - 1])));
        }

        if (s.match(/\(1\)/g)) {
            for (var i = 1; i < 10; i++) {
                if (s.includes('(' + i + ')')) {
                    s = $.replace(s, '(' + i + ')', (event.getArgs()[i - 1] !== undefined ? event.getArgs()[i - 1] : ''));
                } else {
                    break;
                }
            }
        }

        if (s.match(reCustomToUserArg)) {
            s = $.replace(s, s.match(reCustomToUserArg)[0], (event.getArgs()[0] ? $.discord.username.resolve(event.getArgs().join(' ')) : s.match(reCustomToUserArg)[1]));
        }

        if (s.match(/\(sender\)/)) {
            s = $.replace(s, '(sender)', event.getUsername());
        }

        if (s.match(/\(@sender\)/)) {
            s = $.replace(s, '(@sender)', event.getMention());
        }

        if (s.match(/\(touser\)/)) {
            s = $.replace(s, '(touser)', (event.getArgs()[0] ? $.discord.username.resolve(event.getArgs().join(' ')) : event.getMention()));
        }

        if (s.match(/\(random\)/)) {
            s = $.replace(s, '(random)', $.discord.username.random());
        }

        if (s.match(/\(#\)/)) {
            s = $.replace(s, '(#)', $.randRange(1, 100).toString());
        }

        if (s.match(/\(# (\d+),(\d+)\)/g)) {
            var mat = s.match(/\(# (\d+),(\d+)\)/);
            s = $.replace(s, mat[0], $.randRange(parseInt(mat[1]), parseInt(mat[2])).toString());
        }

        if (s.match(/\(status\)/)) {
            s = $.replace(s, '(status)', $.getStatus($.channelName));
        }

        if (s.match(/\(game\)/)) {
            s = $.replace(s, '(game)', $.getGame($.channelName));
        }

        if (s.match(/\(uptime\)/)) {
            s = $.replace(s, '(uptime)', $.getStreamUptime($.channelName));
        }

        if (s.match(/\(echo\)/)) {
            s = $.replace(s, '(echo)', (event.getArgs()[0] ? event.getArguments() : ''));
        }

        if (s.match(/\(viewers\)/g)) {
            s = $.replace(s, '(viewers)', $.getViewers($.channelName).toString());
        }

        if (s.match(/\(follows\)/g)) {
            s = $.replace(s, '(follows)', $.getFollows($.channelName).toString());
        }

        if (s.match(/\(readfile/)) {
            if (s.search(/\((readfile ([^)]+)\))/g) >= 0) {
                s = $.replace(s, '(' + RegExp.$1, $.readFile('./addons/' + $.replace(RegExp.$2, '..', ''))[0]);
            }
        }

        if (s.match(/\(readfilerand/)) {
            if (s.search(/\((readfilerand ([^)]+)\))/g) >= 0) {
                var results = $.readFile('./addons/' + RegExp.$2);
                s = $.replace(s, '(' + RegExp.$1, $.randElement(results));
            }
        }

        if (s.match(/\(count\)/g)) {
            $.inidb.incr('discordCommandCount', event.getCommand(), 1);
            s = $.replace(s, '(count)', $.inidb.get('discordCommandCount', event.getCommand()));
        }

        if (s.match(/\(writefile ([\w\W^,]+), ([\w^,]+), ([\w\W^,]+)\)/)) {
            var file = s.match(/\(writefile (.+), (.+), (.+)\)/)[1],
                append = (s.match(/\(writefile (.+), (.+), (.+)\)/)[2] == 'true' ? true : false),
                string = s.match(/\(writefile (.+), (.+), (.+)\)/)[3];
            $.writeToFile(string, './addons/' + $.replace(file, '..', ''), append);
            return null;
        }

        if (s.match(/\(lasttip\)/g)) {
            s = $.replace(s, '(lasttip)', ($.inidb.exists('donations', 'last_donation_message') ? $.inidb.get('donations', 'last_donation_message') : 'No donations found.'));
        }

        if (s.match(/\(encodeurl ([\w\W]+)\)/)) {
            var m = s.match(/\(encodeurl ([\w\W]+)\)/);
            s = $.replace(s, m[0], encodeURI(m[1]));
        }

        if (s.match(reCustomAPIJson) || s.match(reCustomAPI)) {
            s = api(event, s);
        }

        if (s.match(/\(setrole ([\w\W\s]+), ([\w\W\s]+)/)) {
            $.discord.setRole(s.match(/\(setrole ([\w\W\s]+), ([\w\W\s]+)\)/)[2], s.match(/\(setrole ([\w\W\s]+), ([\w\W\s]+)\)/)[1]);

            s = $.replace(s, s.match(/\(setrole ([\w\W\s]+), ([\w\W\s]+)\)/)[0], '');
            if (s.length === 0) {
                return null;
            }
        }

        return s;
    }

    /**
     * @function api
     *
     * @param {object} event
     * @param {string} message
     * @return {string}
     */
    function api(event, message) {
        var JSONObject = Packages.org.json.JSONObject,
            JSONArray = Packages.org.json.JSONArray,
            command = event.getCommand(),
            args = event.getArgs(),
            origCustomAPIResponse = '',
            customAPIReturnString = '',
            message = message + '',
            customAPIResponse = '',
            customJSONStringTag = '',
            commandToExec = 0,
            jsonObject,
            regExCheck,
            jsonItems,
            jsonCheckList;

        // Get the URL for a customapi, if applicable, and process $1 - $9.  See below about that.
        if ((regExCheck = message.match(reCustomAPI))) {
            if (regExCheck[1].indexOf('$1') != -1) {
                for (var i = 1; i <= 9; i++) {
                    if (regExCheck[1].indexOf('$' + i) != -1) {
                        if (!args[i - 1]) {
                            return $.lang.get('customcommands.customapi.404', command);
                        }
                        regExCheck[1] = regExCheck[1].replace('$' + i, args[i - 1]);
                    } else {
                        break;
                    }
                }
            }
            customAPIReturnString = getCustomAPIValue(regExCheck[1]);
        }

        // Design Note.  As of this comment, this parser only supports parsing out of objects, it does not
        // support parsing of arrays, especially walking arrays.  If that needs to be done, please write
        // a custom JavaScript.  We limit $1 - $9 as well; 10 or more arguments being passed by users to an
        // API seems like overkill.  Even 9 does, to be honest.
        if ((regExCheck = message.match(reCustomAPIJson))) {
            if (regExCheck[1].indexOf('$1') != -1) {
                for (var i = 1; i <= 9; i++) {
                    if (regExCheck[1].indexOf('$' + i) != -1) {
                        if (!args[i - 1]) {
                            return $.lang.get('customcommands.customapi.404', command);
                        }
                        regExCheck[1] = regExCheck[1].replace('$' + i, args[i - 1]);
                    } else {
                        break;
                    }
                }
            }
            origCustomAPIResponse = getCustomAPIValue(regExCheck[1]);
            jsonItems = regExCheck[2].split(' ');
            for (var j = 0; j < jsonItems.length; j++) {
                if (jsonItems[j].startsWith('{') && jsonItems[j].endsWith('}')) {
                    customAPIReturnString += " " + jsonItems[j].match(reCustomAPITextTag)[1];
                } else if (jsonItems[j].startsWith('{') && !jsonItems[j].endsWith('}')) {
                    customJSONStringTag = '';
                    while (!jsonItems[j].endsWith('}')) {
                        customJSONStringTag += jsonItems[j++] + " ";
                    }
                    customJSONStringTag += jsonItems[j];
                    customAPIReturnString += " " + customJSONStringTag.match(reCustomAPITextTag)[1];
                } else {
                    jsonCheckList = jsonItems[j].split('.');
                    if (jsonCheckList.length == 1) {
                        try {
                            customAPIResponse = new JSONObject(origCustomAPIResponse).get(jsonCheckList[0]);
                        } catch (ex) {
                            $.log.error('Failed to get data from API: ' + ex.message);
                            return $.lang.get('discord.customcommands.customapijson.err', command);
                        }
                        customAPIReturnString += " " + customAPIResponse;
                    } else {
                        for (var i = 0; i < jsonCheckList.length - 1; i++) {
                            if (i == 0) {
                                try {
                                    jsonObject = new JSONObject(origCustomAPIResponse).get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex.message);
                                    return $.lang.get('discord.customcommands.customapijson.err', command);
                                }
                            } else if (!isNaN(jsonCheckList[i + 1])) {
                                try {
                                    jsonObject = jsonObject.get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex.message);
                                    return $.lang.get('discord.customcommands.customapijson.err', command);
                                }
                            } else {
                                try {
                                    jsonObject = jsonObject.get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex.message);
                                    return $.lang.get('discord.customcommands.customapijson.err', command);
                                }
                            }
                        }
                        try {
                            customAPIResponse = jsonObject.get(jsonCheckList[i]);
                        } catch (ex) {
                            $.log.error('Failed to get data from API: ' + ex.message);
                            return $.lang.get('discord.customcommands.customapijson.err', command);
                        }
                        customAPIReturnString += " " + customAPIResponse;
                    }
                }
            }
        }

        return message.replace(reCustomAPI, customAPIReturnString).replace(reCustomAPIJson, customAPIReturnString);
    }

    /**
     * @function permCom
     *
     * @export $.discord
     * @param {string} command
     * @param {string} subCommand
     * @return {int}
     */
    function permCom(command, subCommand) {
        if (subCommand === '') {
            return $.discord.getCommandPermission(command);
        } else {
            return $.discord.getSubCommandPermission(command, subCommand);
        }
    }

    /**
     * @function loadCustomCommands
     *
     * @export $.discord
     */
    function loadCustomCommands() {
        if ($.bot.isModuleEnabled('./discord/commands/customCommands.js')) {
            var keys = $.inidb.GetKeyList('discordCommands', ''),
                i;

            for (i = 0; i < keys.length; i++) {
                $.discord.registerCommand('./discord/commands/customCommands.js', keys[i], 0);
            }
        }
    }

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * Checks for custom commands, no command path needed here.
         */
        if ($.inidb.exists('discordCommands', command)) {
            var tag = tags(event, $.inidb.get('discordCommands', command));
            if (tag !== null) {
                $.discord.say(channel, tag);
            }
            return;
        }

        /**
         * @discordcommandpath addcom [command] [response] - Adds a custom command to be used in your Discord server.
         */
        if (command.equalsIgnoreCase('addcom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.addcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if ($.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.addcom.err'));
                return;
            }

            $.inidb.set('discordCommands', action, args.slice(1).join(' '));
            $.discord.registerCommand('./discord/commands/customCommands.js', action, 0);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.addcom.success', action));
        }

        /**
         * @discordcommandpath editcom [command] [response] - Edits an existing command.
         */
        if (command.equalsIgnoreCase('editcom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.editcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.editcom.404'));
                return;
            }

            $.inidb.set('discordCommands', action, args.slice(1).join(' '));
            $.discord.registerCommand('./discord/commands/customCommands.js', action, 0);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.editcom.success', action));
        }

        /**
         * @discordcommandpath delcom [command] - Deletes a custom command.
         */
        if (command.equalsIgnoreCase('delcom')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delcom.404'));
                return;
            }

            $.inidb.del('discordCommands', action);
            $.discord.unregisterCommand(action);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delcom.success', action));
        }

        /**
         * @discordcommandpath channelcom [command] [channel / --global / --list] - Makes a command only work in that channel, separate the channels with commas (no spaces) for multiple, use --global as the channel to make the command global again.
         */
        if (command.equalsIgnoreCase('channelcom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.404'));
                return;
            }

            if (subAction.equalsIgnoreCase('--global') || subAction.equalsIgnoreCase('-g')) {
                $.inidb.del('discordChannelcom', action);
                $.discord.updateCommandChannel(action);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.global', action));
                return;
            } else if (subAction.equalsIgnoreCase('--list') || subAction.equalsIgnoreCase('-l')) {
                var keys = ($.inidb.exists('discordChannelcom', action) ? $.inidb.get('discordChannelcom', action).split(',') : []),
                    key = [],
                    i;

                for (i in keys) {
                    key.push('#' + keys[i]);
                }

                if (key.length !== 0) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + key.join(', '));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.404'));
                }
                return;
            }

            var keys = subAction.split(','),
                key = [],
                i;

            for (i in keys) {
                key.push($.discord.sanitizeChannelName(keys[i]));
            }

            $.inidb.set('discordChannelcom', action, key.join(','));
            $.discord.updateCommandChannel(action);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.success', action, subAction.replace(',', ', ')));
        }

        /**
         * @discordcommandpath pricecom [command] [amount] - Sets a cost for that command, users must of their Twitch accounts linked for this to work.
         */
        if (command.equalsIgnoreCase('pricecom')) {
            if (action === undefined || (subAction === undefined || isNaN(parseInt(subAction)))) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.pricecom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.404'));
                return;
            }

            $.inidb.set('discordPricecom', action, subAction);
            $.discord.setCommandCost(action, subAction);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.pricecom.success', action, $.getPointsString(subAction)));
        }

        /**
         * @discordcommandpath aliascom [alias] [command] - Alias a command to another command, this only works with commands that have a single command.
         */
        if (command.equalsIgnoreCase('aliascom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.aliascom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            subAction = subAction.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(subAction)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.404'));
                return;
            }

            $.inidb.set('discordAliascom', subAction, action);
            $.discord.setCommandAlias(subAction, action);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.aliascom.success', action, subAction));
        }

        /**
         * @discordcommandpath delalias [alias] - Removes the alias of that command.
         */
        if (command.equalsIgnoreCase('delalias')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delalias.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.aliasExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.alias.404'));
                return;
            }

            var keys = $.inidb.GetKeyList('discordAliascom', ''),
                i;
            for (i in keys) {
                if ($.inidb.get('discordAliascom', keys[i]).equalsIgnoreCase(action)) {
                    $.inidb.del('discordAliascom', keys[i]);
                    $.discord.removeAlias(keys[i], '');
                }
            }
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delalias.success', action));
        }

        /**
         * @discordcommandpath commands - Shows all of the custom commands you created.
         */
        if (command.equalsIgnoreCase('commands')) {
            var keys = $.inidb.GetKeyList('discordCommands', ''),
                temp = [],
                i;

            for (i = 0; i < keys.length; i++) {
                temp.push('!' + keys[i]);
            }

            $.paginateArrayDiscord(temp, 'discord.customcommands.commands', ', ', channel, mention);
        }

        /**
         * @discordcommandpath botcommands - Gives you a list of commands that you are allowed to use.
         */
        if (command.equalsIgnoreCase('botcommands')) {
            var keys = $.inidb.GetKeyList('discordPermcom', ''),
                temp = [],
                i;

            for (i = 0; i < keys.length; i++) {
                if (keys[i].indexOf(' ') === -1) {
                    temp.push('!' + keys[i]);
                }
            }
            $.paginateArrayDiscord(temp, 'discord.customcommands.bot.commands', ', ', channel, mention);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/commands/customCommands.js', 'addcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'delcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'editcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'coolcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'channelcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'pricecom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'aliascom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'delalias', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'commands', 0);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'botcommands', 1);

        loadCustomCommands();
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/commands/customCommands.js')) {
            if (event.getArguments().length() === 0) {
                if (!$.discord.commandExists(event.getArgs()[0])) {
                    $.discord.registerCommand('./discord/commands/customCommands.js', event.getArgs()[0], event.getArgs()[1]);
                } else {
                    $.discord.setCommandPermission(event.getArgs()[0], event.getArgs()[1]);
                    $.discord.setCommandCost(event.getArgs()[0], (event.getArgs()[4].length() === 0 ? '' : event.getArgs()[4]));
                    if (event.getArgs()[3].length() === 0) {
                        $.discord.removeAlias(event.getArgs()[0], $.inidb.get('discordAliascom', event.getArgs()[0]));
                    } else {
                        $.discord.setCommandAlias(event.getArgs()[0], (event.getArgs()[3].length() === 0 ? '' : event.getArgs()[3]));
                    }

                    if (event.getArgs()[2].length() === 0) {
                        $.inidb.del('discordChannelcom', event.getArgs()[0]);
                    } else {
                        $.inidb.set('discordChannelcom', event.getArgs()[0], String(event.getArgs()[2]).replace(/#/g, '').toLowerCase());
                    }

                    $.discord.updateCommandChannel(event.getArgs()[0]);
                }
            } else {
                $.discord.unregisterCommand(event.getArgs()[0]);
            }
        }
    });

    /* Export the function to the $.discord api. */
    $.discord.loadCustomCommands = loadCustomCommands;
    $.discord.tags = tags;
    $.discord.permCom = permCom;
})();
