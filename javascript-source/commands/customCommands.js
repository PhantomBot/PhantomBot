(function() {

    // Pre-build regular expressions.
    var reCustomAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&]+)\)/), // URL[1]
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&]+)\s([\w\W]+)\)/), // URL[1], JSONmatch[2..n]
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/),
        reCheckTags = new RegExp(/\(customapi|\(sender\)|\(touser\)|\(@sender\)|\(baresender\)|\(random\)|\(pointname\)|\(uptime\)|\(game\)|\(status\)|\(follows\)|\(count\)|\(price\)/),
        reSenderTag = new RegExp(/\(sender\)/g),
        reTouserTag = new RegExp(/\(touser\)/g),
        reATSenderTag = new RegExp(/\(@sender\)/g),
        reBaresenderTag = new RegExp(/\(baresender\)/g),
        reRandomTag = new RegExp(/\(random\)/g),
        rePointnameTag = new RegExp(/\(pointname\)/g),
        reUptimeTag = new RegExp(/\(uptime\)/g),
        reGameTag = new RegExp(/\(game\)/g),
        reStatusTag = new RegExp(/\(status\)/g),
        reFollowsTag = new RegExp(/\(follows\)/g),
        reCountTag = new RegExp(/\(count\)/g),
        rePriceTag = new RegExp(/\(price\)/g),
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
            commandToExec = '',
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

        if (message.indexOf('(1)') != -1) {
            for (var i = 0; i < args.length; i++) {
                message = message.replace('(' + (i + 1) + ')', args[i]);
            }
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

        if (message.match(reCommandTag)) {
            commandToExec = message.match(reCommandTag)[1];
            message = message.replace(reCommandTag, '');
        }

        // This needs to be improved, we can loose up to 500ms with all of the replace() methods when
        // there is nothing to replace.  This is a quick fix to just not even attempt to perform the
        // replace when we don't appear to see tags.
        //
        if (message.match(reCheckTags)) {
            message = message.replace(reSenderTag, $.username.resolve(event.getSender()))
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
        }

        if (commandToExec.length > 0) {
            var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus,
                CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;
            EventBus.instance().postCommand(new CommandEvent(sender, commandToExec, message));
            return '';
        }

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
            $.say($.whisperPrefix(sender) + 'Command tags: (sender), (@sender), (baresender), (random), (uptime), (game), (status), (follows), (count), (touser), (price), (pointname), (customapi) (customjsonapi) (command command_name). (command command_name) must be the first item if used. Do not include the !');
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
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.cmds', cmd.slice(0, -2)));
            } else {
                if ($.isModv3(sender, event.getTags())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.404.no.commands'));
                    return;
                }
            }
        }

        /**
         * @commandpath botcommands - Links you to the bot commands site
         */
        if (command.equalsIgnoreCase('botcommands')) {
            if (!$.isOwner(sender)) {
                return;
            }
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

        /**
         * @commandpath shortcut [add] [shortcut] [command] [parameters] - Creates a shortcut to a command with parameters.
         * @commandpath shortcut [del] [shortcut] - Deletes a shortcut.
         * @commandpath shortcut [list] - Lists the shortcuts.
         */
        if (command.equalsIgnoreCase('shortcut')) {
            if (args[0] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.usage'));
                return;
            }
            if (args[0].equalsIgnoreCase('add')) {
                if (args.length < 4) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.add.usage'));
                    return;
                }
                var sCommand = args[1],
                    cCommand = args[2],
                    parameters = args.splice(3).join(' ');

                if ($.commandExists(sCommand)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.add.shortcut.exists', sCommand));
                    return;
                }
                if (!$.commandExists(cCommand)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.add.command.noexists', cCommand));
                    return;
                }
                $.inidb.set('aliases', sCommand, cCommand + ' ' + parameters);
                $.registerChatCommand('./commands/customCommands.js', sCommand, 7);
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.add.success', sCommand, cCommand, parameters));
                return;
            } 
            if (args[0].equalsIgnoreCase('del')) {
                if (args[1] === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.del.usage'));
                    return;
                }
                var sCommand = args[1];
                if (!$.inidb.exists('shortcuts', sCommand)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.del.noexists', sCommand));
                    return;
                }
                $.inidb.del('aliases', sCommand);
                $.unregisterChatCommand(sCommand);
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.del.success', sCommand));
                return;
            }
            if (args[0].equalsIgnoreCase('list')) {
                var shortcutList = $.inidb.GetKeyList('aliases', '');
                if (shortcutList.length > 0) {
                    $.paginateArray(shortcutList, 'customcommands.shortcut.list', ', ', true, sender);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.shortcut.list.empty'));
                }
                return;
            }    
        }

        if ($.inidb.exists('command', command.toLowerCase())) {
            subAction = $.inidb.get('command', command.toLowerCase());
            var customCommandString = replaceCommandTags(subAction, event, command.toLowerCase());
            if (customCommandString.length > 0) {
                $.say(customCommandString);
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
            $.registerChatCommand('./commands/customCommands.js', 'botcommands');
            $.registerChatCommand('./commands/customCommands.js', 'shortcut', 7);

            $.registerChatCommand('shortcut', 'add', 2);
            $.registerChatCommand('shortcut', 'del', 2);
            $.registerChatCommand('shortcut', 'list', 7);
        }
    });

    /** Export functions to API */
    $.addComRegisterCommands = addComRegisterCommands;
    $.addComRegisterAliases = addComRegisterAliases;
    $.returnCommandCost = returnCommandCost;
    $.replaceCommandTags = replaceCommandTags;
    $.permCom = permCom;
    $.getCommandPrice = getCommandPrice;
})();
