(function() {

    // Pre-build regular expressions.
    var reCustomAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&]+)\)/), // URL[1]
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&]+)\s([\w\W]+)\)/), // URL[1], JSONmatch[2..n]
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/),
        reCheckTags = new RegExp(/\(customapi|\(sender\)|\(touser\)|\(@sender\)|\(baresender\)|\(random\)|\(pointname\)|\(uptime\)|\(game\)|\(status\)|\(follows\)|\(count\)|\(price\)/),
        reSenderTag = new RegExp(/\(sender\)/),
        reTouserTag = new RegExp(/\(touser\)/),
        reATSenderTag = new RegExp(/\(@sender\)/),
        reBaresenderTag = new RegExp(/\(baresender\)/),
        reRandomTag = new RegExp(/\(random\)/),
        rePointnameTag = new RegExp(/\(pointname\)/),
        reUptimeTag = new RegExp(/\(uptime\)/),
        reGameTag = new RegExp(/\(game\)/),
        reStatusTag = new RegExp(/\(status\)/),
        reFollowsTag = new RegExp(/\(follows\)/),
        reCountTag = new RegExp(/\(count\)/),
        rePriceTag = new RegExp(/\(price\)/);

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
     * @function replaceCommandTags
     * @export $
     * @param {string} message
     * @param {Object} event
     * @param {Array} [tagList]
     * @param {Array} [tagReplacements]
     * @returns {string}
     */
    function replaceCommandTags(message, event, command, tagList, tagReplacements) {
        var JSONObject = Packages.org.json.JSONObject,
            jsonObject,
            touser,
            price,
            customAPIResponse = '',
            origCustomAPIResponse = '',
            customAPIReturnString = '',
            customJSONStringTag = '',
            regExCheck,
            jsonItems,
            jsonCheckList,
            message = message + '',
            sender = event.getSender(),
            args = event.getArgs();

        if (message.indexOf('(touser)') != -1) {
            touser = (!args[0] ? sender : args[0]);
        }

        if (message.indexOf('(price)') != -1) {
            if ($.inidb.get('pricecom', command) == null) {
                price = 0;
            } else {
                price = $.inidb.get('pricecom', command);
            }
        }

        if (message.indexOf('(count)') != -1) {
            $.inidb.incr('commandCount', command, 1);
        }

        // Get the URL for a customapi, if applicable, and process $1 - $9.  See below about that.
        //
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
        // 
        if ((regExCheck = message.match(reCustomAPIJson))) {
            // Check for and process $1 - $9 in the URL.
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

        if (tagList) {
            for (i in tagList) {
                var regex = new RegExp('/' + tagList[i].replace(/([\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|])/g, '\\$&') + '/', 'ig');
                message = message.replace(regex, tagReplacements[i]);
            }
        }

        // This needs to be improved, we can loose up to 500ms with all of the replace() methods when
        // there is nothing to replace.  This is a quick fix to just not even attempt to perform the
        // replace when we don't appear to see tags.
        //
        if (message.match(reCheckTags))
            return message.replace(reSenderTag, $.username.resolve(event.getSender()))
                .replace(reTouserTag, $.username.resolve(touser))
                .replace(reATSenderTag, '@' + $.username.resolve(event.getSender()))
                .replace(reBaresenderTag, event.getSender())
                .replace(reRandomTag, $.username.resolve($.randElement($.users)[0]))
                .replace(rePointnameTag, $.pointNameMultiple)
                .replace(reUptimeTag, $.getStreamUptime($.channelName))
                .replace(reGameTag, $.getGame($.channelName))
                .replace(reStatusTag, $.getStatus($.channelName))
                .replace(reFollowsTag, $.getFollows($.channelName))
                .replace(reCountTag, $.inidb.get('commandCount', command))
                .replace(rePriceTag, price)
                .replace(reCustomAPI, customAPIReturnString)
                .replace(reCustomAPIJson, customAPIReturnString);

        return message;
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
            }
        }
    };

    /**
     * @function addComRegisterAliases
     */
    function addComRegisterAliases() {
        var commands = $.inidb.GetKeyList('aliases', ''),
            ownerCommand,
            i;
        for (i in commands) {
            if (!$.commandExists(commands[i])) {
                ownerCommand = $.inidb.get('aliases', commands[i]);
                $.registerChatCommand('./commands/customCommands.js', commands[i], $.getCommandGroup(ownerCommand));
            }
        }
    };

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
            subAction = args[1];

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

            action = args[0].replace('!', '');
            argString = argString.substring(argString.indexOf(args[0]) + args[0].length() + 1);

            $.inidb.set('command', action, argString);
            $.registerChatCommand('./commands/customCommands.js', action);
            $.logEvent('./commands/customCommands.js', 28, sender + ' added command !' + action + ' with the message "' + argString + '"');
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

            action = args[0].replace('!', '');

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.usage'));
                return;
            } else if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            argString = argString.substring(argString.indexOf(args[0]) + args[0].length() + 1);

            $.inidb.set('command', action, argString);
            $.registerChatCommand('./commands/customCommands.js', action);
            $.logEvent('./commands/customCommands.js', 28, sender + ' edited the command !' + action + ' with the message "' + argString + '"');
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

            action = args[0].replace('!', '');

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
                return;
            } else if (!$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            $.inidb.del('command', action);
            $.inidb.del('permcom', action);
            $.unregisterChatCommand('./commands/customCommands.js', action);
            $.logEvent('./commands/customCommands.js', 28, sender + ' deleted the command !' + action);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.success', action));
        }

        /**
         * @commandpath aliascom [existing command] [alias] - Create an alias to any command
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

            action = args[0].replace('!', '');
            subAction = args[1].replace('!', '');

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404'));
                return
            }

            if ($.inidb.exists('aliases', subAction)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error', subAction));
                return;
            }

            if ($.commandExists(subAction)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
                return;
            }

            $.inidb.set('aliases', subAction, action);
            $.registerChatCommand('./commands/customCommands.js', subAction);
            $.logEvent('customCommands.js', 59, sender + ' added alias "!' + subAction + '" for "!' + action + '"');
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', action, subAction));
        }
        return ($.getSubcommandGroup(command, subcommand) >= $.getUserGroupId(user));

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

            action = args[0].replace('!', '');
            if (!$.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', action));
                return;
            }

            $.unregisterChatCommand(action);
            $.inidb.del('aliases', action);
            $.logEvent('customCommands.js', 56, sender + ' deleted alias !' + action);
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

            action = args[0].replace('!', '');

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

            action = args[0].replace('!', '');

            $.inidb.set('pricecom', action, subAction);
            list = $.inidb.GetKeyList('aliases', '');

            for (i in list) {
                for (i in list) {
                    if ($.inidb.get('aliases', list[i]).equalsIgnoreCase(action)) {
                        $.inidb.set('pricecom', list[i], subAction);
                    }
                }
            }
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
            $.say($.whisperPrefix(sender) + 'Command tags: (sender), (@sender), (baresender), (random), (uptime), (game), (status), (follows), (count), (touser), (price), (pointname), (customapi) (customjsonapi)');
        }

        /**
         * @commandpath commands - Provides a list of all available commands.
         */
        if (command.equalsIgnoreCase('commands')) {
            var cmds = $.inidb.GetKeyList('command', ''),
                cmd = '',
                i;

            for (i in cmds) {
                cmd += '!';
                cmd += cmds[i];
                cmd += ', ';
            }

            if (cmd.length != 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.cmds', cmd));
                return;
            }
        }

        if ($.inidb.exists('command', command.toLowerCase())) {
            subAction = $.inidb.get('command', command.toLowerCase());
            $.say(replaceCommandTags(subAction, event, command.toLowerCase()));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            addComRegisterCommands();
            addComRegisterAliases();

            $.registerChatCommand('./commands/customCommands.js', 'addcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'pricecom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'aliascom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'delalias', 2);
            $.registerChatCommand('./commands/customCommands.js', 'delcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'editcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'permcom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'listtags', 2);
            $.registerChatCommand('./commands/customCommands.js', 'commands', 7);
        }
    });

    /** Export functions to API */
    $.returnCommandCost = returnCommandCost;
    $.replaceCommandTags = replaceCommandTags;
    $.permCom = permCom;
    $.getCommandPrice = getCommandPrice;
})();
