(function() {

    // Pre-build regular expressions.
    var reCustomAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&]+)\)/), // URL[1]
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&]+)\s([\w\W]+)\)/), // URL[1], JSONmatch[2..n]
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/),
        reCommandTag = new RegExp(/\(command\s([\w]+)\)/);

    /**
     * @function getCustomAPIValue
     * @param {string} url
     * @returns {string}
     */
    function getCustomAPIValue(url) {
        var HttpResponse = Packages.com.gmt2001.HttpResponse;
        var HttpRequest = Packages.com.gmt2001.HttpRequest;
        var HashMap = Packages.java.util.HashMap;
        var responseData = HttpRequest.getData(HttpRequest.RequestType.GET, url, "", new HashMap());
        return responseData.content;
    };

    /**
     * @function returnCommandCost
     * @export $
     * @param {string} sender
     * @param {string} command
     */
    function returnCommandCost(sender, command) {
        sender = sender.toLowerCase();
        command = command.toLowerCase();
        if ($.inidb.exists('pricecom', command) && parseInt($.inidb.get('pricecom', command)) > 0) {
            if (!$.isMod(sender)) {
                $.inidb.incr('points', sender, $.inidb.get('pricecom', command));
                $.inidb.SaveAll();
            }
        }
    };

    /**
     * @function tags
     * @param {string} event
     * @param {string} message
     * @return {string}
     */
    function tags(event, message) {
        if (message.match(/\(1\)/g)) {
            for (var i = 0; i < event.getArgs().length; i++) {
                message = $.replace(message, '(' + (i + 1) + ')', event.getArgs()[i]);
            }
        }

        if (message.match(/\(sender\)/g)) {
            message = $.replace(message, '(sender)', $.username.resolve(event.getSender()));
        }

        if (message.match(/\(@sender\)/g)) {
            message = $.replace(message, '(@sender)', '@' + $.username.resolve(event.getSender()));
        }

        if (message.match(/\(baresender\)/g)) {
            message = $.replace(message, '(baresender)', event.getSender());
        }

        if (message.match(/\(game\)/g)) {
            message = $.replace(message, '(game)', $.getGame($.channelName));
        }

        if (message.match(/\(status\)/g)) {
            message = $.replace(message, '(status)', $.getStatus($.channelName));
        }

        if (message.match(/\(count\)/g)) {
            $.inidb.incr('commandCount', event.getCommand(), 1);
            message = $.replace(message, '(count)', $.inidb.get('commandCount', event.getCommand()));
        }

        if (message.match(/\(random\)/g)) {
            message = $.replace(message, '(random)', $.username.resolve($.randElement($.users)[0]));
        }

        if (message.match(/\(pointname\)/g)) {
            message = $.replace(message, '(pointname)', $.pointNameMultiple);
        }

        if (message.match(/\(price\)/g)) {
            message = $.replace(message, '(price)', String($.inidb.exists('pricecom', event.getCommand()) ? $.inidb.get('pricecom', event.getCommand()) : 0));
        }

        if (message.match(/\(#\)/g)) {
            message = $.replace(message, '(#)', String($.randRange(1, 100)));
        }

        if (message.match(/\(uptime\)/g)) {
            message = $.replace(message, '(uptime)', String($.getStreamUptime($.channelName)));
        }

        if (message.match(/\(viewers\)/g)) {
            message = $.replace(message, '(viewers)', String($.getViewers($.channelName)));
        }

        if (message.match(/\(follows\)/g)) {
            message = $.replace(message, '(follows)', String($.getFollows($.channelName)));
        }

        if (message.match(/\(touser\)/g)) {
            message = $.replace(message, '(touser)', (!event.getArgs()[0] ? event.getSender() : event.getArgs()[0]));
        }

        if (message.match(reCustomAPIJson) || message.match(reCustomAPI) || message.match(reCommandTag)) {
            message = apiTags(event, message);
        }
        return message;
    };

    /**
     * @function apiTags
     * @export $
     * @param {string} message
     * @param {Object} event
     * @returns {string}
     */
    function apiTags(event, message) {
        var JSONObject = Packages.org.json.JSONObject,
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
                            customAPIResponse = new JSONObject(origCustomAPIResponse).getString(jsonCheckList[0]);
                        } catch (ex) {
                            if (ex.message.indexOf('not a string') != -1) {
                                try {
                                    customAPIResponse = jsonObject.getInt(jsonCheckList[0]);
                                } catch (ex) {
                                    return $.lang.get('customcommands.customapijson.err', command);
                                }
                            } else {
                                return $.lang.get('customcommands.customapijson.err', command);
                            }
                        }
                        customAPIReturnString += " " + customAPIResponse;
                    } else {
                        for (var i = 0; i < jsonCheckList.length - 1; i++) {
                            if (i == 0) {
                                jsonObject = new JSONObject(origCustomAPIResponse).getJSONObject(jsonCheckList[i]);
                            } else {
                                jsonObject = jsonObject.getJSONObject(jsonCheckList[i]);
                            }
                        }
                        try {
                            customAPIResponse = jsonObject.getString(jsonCheckList[i]);
                        } catch (ex) {
                            if (ex.message.indexOf('not a string') != -1) {
                                try {
                                    customAPIResponse = jsonObject.getInt(jsonCheckList[i]);
                                } catch (ex) {
                                    return $.lang.get('customcommands.customapijson.err', command);
                                }
                            } else {
                                return $.lang.get('customcommands.customapijson.err', command);
                            }
                        }
                        customAPIReturnString += " " + customAPIResponse;
                    }
                }
            }
        }

        if (message.match(reCommandTag)) {
            commandToExec = message.match(reCommandTag)[1];
            if (commandToExec.length > 0) {
                var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus;
                var CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;
                EventBus.instance().postCommand(new CommandEvent(event.getSender(), commandToExec, message.replace(reCommandTag, '')));
                return '';
            }
        }

        return message.replace(reCustomAPI, customAPIReturnString).replace(reCustomAPIJson, customAPIReturnString);
    };

    /**
     * @function permCom
     * @export $
     * @param {string} user
     * @param {string} command
     * @param {sub} subcommand
     * @returns 0 = good, 1 = command perm bad, 2 = subcommand perm bad
     */
    function permCom(user, command, subcommand) {
        if ($.isAdmin(user)) {
            return 0;
        }
        if (subcommand == '') {
            if ($.getCommandGroup(command) >= $.getUserGroupId(user)) {
                return 0;
            } else {
                return 1;
            }
        }
        if ($.getSubcommandGroup(command, subcommand) >= $.getUserGroupId(user)) {
            return 0;
        } else {
            return 2;
        }
    };

    /**
     * @function getCommandPrice
     * @export $
     * @param {string} command
     * @returns {Number}
     */
    function getCommandPrice(command) {
        return parseInt($.inidb.exists('pricecom', command) ? $.inidb.get('pricecom', command) : 0);
    };

    /**
     * @function addComRegisterCommands
     */
    function addComRegisterCommands() {
        var commands = $.inidb.GetKeyList('command', ''),
            i;
        for (i in commands) {
            if (!$.commandExists(commands[i])) {
                $.registerChatCommand('./commands/customCommands.js', commands[i], 7);
            } else {
                $.log.error('Cannot add custom command, command already exists: ' + commands[i]);
            }
        }
    };

    /**
     * @function addComRegisterAliases
     */
    function addComRegisterAliases() {
        var aliases = $.inidb.GetKeyList('aliases', ''),
            i;
        for (i in aliases) {
            if (!$.commandExists(aliases[i])) {
                $.registerChatCommand('./commands/customCommands.js', aliases[i], $.getIniDbNumber('permcom', aliases[i], 7));
            } else {
                $.log.error('Cannot add alias, command already exists: ' + aliases[i]);
            }
        }
    } 

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            username = $.username.resolve(sender, event.getTags()),
            command = event.getCommand(),
            args = event.getArgs(),
            argString = event.getArguments(),
            action = args[0],
            subAction = args[1],
            aliasArgs;

        /**
         * @commandpath addcom [command] [command text] - Add a custom command (see !listtags)
         */
        if (command.equalsIgnoreCase('addcom')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.usage'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();
            argString = argString.substring(argString.indexOf(args[0]) + args[0].length() + 1);

            if ($.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.error'));
                return;
            }

            if (argString.indexOf('(command ') !== -1) {
                if (argString.indexOf('(command ') !== 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.notfirst'));
                    return;
                } else {
                    var checkCmd = argString.match(reCommandTag)[1];
                    if (!$.commandExists(checkCmd)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.invalid', checkCmd));
                        return;
                    }
                }
            }

            $.inidb.set('command', action, argString);
            $.registerChatCommand('./commands/customCommands.js', action);
            $.log.event(sender + ' added command !' + action + ' with the message "' + argString + '"');
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.success', action));
        }

        /**
         * @commandpath editcom [command] [command text] - Replaces the given custom command
         */
        if (command.equalsIgnoreCase('editcom')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            action = args[0].replace('!', '').toLowerCase();

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.usage'));
                return;
            } else if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            } else if ($.commandExists(action) && !$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.404'));
                return;
            }

            argString = argString.substring(argString.indexOf(args[0]) + args[0].length() + 1);

            $.inidb.set('command', action, argString);
            $.registerChatCommand('./commands/customCommands.js', action);
            $.log.event(sender + ' edited the command !' + action + ' with the message "' + argString + '"');
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.success', action));
        }

        /**
         * @commandpath delcom [command] - Delete a custom command
         */
        if (command.equalsIgnoreCase('delcom')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
                return;
            } else if (!$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            $.inidb.del('command', action);
            $.inidb.del('permcom', action);
            $.inidb.del('pricecom', action);
            $.unregisterChatCommand(action);
            $.log.event(sender + ' deleted the command !' + action);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.success', action));
        }

        /**
         * @commandpath aliascom [alias] [existing command] [parameters] - Create an alias to any command, optionally with parameters
         */
        if (command.equalsIgnoreCase('aliascom')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
                return;
            }

            action = args[1].replace('!', '').toLowerCase();
            subAction = args[0].replace('!', '').toLowerCase();
            if (args.length >= 2) {
                aliasArgs = ' ' + args.splice(2).join(' ');
                aliasArgs = aliasArgs.replace('; ', ';').replace(';\!', ';');
            } else {
                aliasArgs = '';
            }

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404'));
                return
            }

            if ($.inidb.exists('aliases', subAction)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error', subAction));
                return;
            }

            if ($.commandExists(subAction.split(' ')[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
                return;
            }

            $.inidb.set('aliases', subAction, action + aliasArgs);
            $.registerChatCommand('./commands/customCommands.js', subAction);
            $.log.event(sender + ' added alias "!' + subAction + '" for "!' + action + aliasArgs + '"');
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', action + aliasArgs, subAction));
        }

        /**
         * @commandpath delalias [alias] - Delete an alias
         */
        if (command.equalsIgnoreCase('delalias')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();
            if (!$.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', action));
                return;
            }

            $.unregisterChatCommand(action);
            $.inidb.del('aliases', action);
            $.log.event(sender + ' deleted alias !' + action);
            $.say($.whisperPrefix(sender) + $.lang.get("customcommands.delete.success", action));
        }

        /**
         * @commandpath permcom [command] [groupId] - Set the permissions for a command
         * @commandpath permcom [command] [subcommand] [groupId] - Set the permissions for a subcommand
         */
        if (command.equalsIgnoreCase('permcom')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.usage'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();

            if (args.length == 2) {
                var group = args[1];

                if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }

                if (!$.commandExists(action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action));
                    return;
                }

                $.inidb.set('permcom', action, group);
                $.log.event(sender + ' set permission on command !' + action + ' to group ' + group);
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action, $.getGroupNameById(group)));
                $.updateCommandGroup(action, group);
            }

            var subcommand = args[1];
            var group = args[2];

            if (isNaN(parseInt(group))) {
                group = $.getGroupIdByName(group);
            }

            if (!$.subCommandExists(action, subcommand)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action + " " + subcommand));
                return;
            }

            $.inidb.set('permcom', action + " " + subcommand, group);
            $.log.event(sender + ' set permission on sub command !' + action + ' ' + subcommand + ' to group ' + group);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action + " " + subcommand, $.getGroupNameById(group)));
            $.updateSubcommandGroup(action, subcommand, group);
        }

        /**
         * @commandpath pricecom [command] [amount] - Set the amount of points a command should cost
         */
        if (command.equalsIgnoreCase('pricecom')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.usage'));
                return;
            } else if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
                return;
            } else if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();

            $.inidb.set('pricecom', action, subAction);
            list = $.inidb.GetKeyList('aliases', '');

            for (i in list) {
                for (i in list) {
                    if ($.inidb.get('aliases', list[i]).equalsIgnoreCase(action)) {
                        $.inidb.set('pricecom', list[i], subAction);
                    }
                }
            }
            $.log.event(sender + ' set price on command !' + action + ' to ' + subAction + ' ' + $.pointNameMultiple);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action, subAction, $.pointNameMultiple));
        }

        /**
         * @commandpath listtags - Displays a list of tags that may be used in custom commands
         */
        if (command.equalsIgnoreCase('listtags')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }
            $.say($.whisperPrefix(sender) + 'Command tags: (sender), (@sender), (baresender), (random), (#), (uptime), (game), (status), (follows), (count), (touser), (price), (viewers), (pointname), (customapi) (customjsonapi) (command command_name). (command command_name) must be the first item if used. Do not include the !');
        }

        /**
         * @commandpath commands - Provides a list of all available custom commands.
         */
        if (command.equalsIgnoreCase('commands')) {
            var cmds = $.inidb.GetKeyList('command', '');

            if (cmds.length > 0) {
                $.paginateArray(cmds, 'customcommands.cmds', ', ', true, sender);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.404.no.commands'));
            }
        }

        /**
         * @commandpath botcommands - Links you to the bot commands site
         */
        if (command.equalsIgnoreCase('botcommands')) {
            $.say('https://phantombot.net/commands');
        }

        /**
         * @commandpath disablecom [command] - Disable a command from being used in chat
         */
        if (command.equalsIgnoreCase('disablecom')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.usage'));
                return;
            }

            action = action.toLowerCase();
            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.404'));
                return;
            }

            if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.err'));
                return;
            }

            $.inidb.set('disabledCommands', action, true);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.success', action));
            $.log.event(sender + ' disabled command !' + command);
        }

        /**
         * @commandpath enablecom [command] - Enable a command thats been disabled from being used in chat
         */
        if (command.equalsIgnoreCase('enablecom')) {
             if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.usage'));
                return;
            }

            action = action.toLowerCase();
            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.404'));
                return;
            }

            if (!$.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.err'));
                return;
            }

            $.inidb.del('disabledCommands', action);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.success', action));
            $.log.event(sender + ' re-enabled command !' + command);
        }

        if ($.inidb.exists('command', command)) {
            var tag = tags(event, $.inidb.get('command', command));
            if (tag != '') {
                $.say(tag);
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {

            $.registerChatCommand('./commands/customCommands.js', 'addcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'pricecom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'aliascom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'delalias', 2);
            $.registerChatCommand('./commands/customCommands.js', 'delcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'editcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'permcom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'listtags', 2);
            $.registerChatCommand('./commands/customCommands.js', 'commands', 7);
            $.registerChatCommand('./commands/customCommands.js', 'disablecom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'enablecom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'botcommands', 0);
        }
    });

    /** Export functions to API */
    $.addComRegisterCommands = addComRegisterCommands;
    $.addComRegisterAliases = addComRegisterAliases;
    $.returnCommandCost = returnCommandCost;
    $.permCom = permCom;
    $.getCommandPrice = getCommandPrice;
})();
