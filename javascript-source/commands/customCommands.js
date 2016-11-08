(function() {

    // Pre-build regular expressions.
    var reCustomAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&]+)\)/), // URL[1]
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&]+)\s([\w\W]+)\)/), // URL[1], JSONmatch[2..n]
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/),
        reCommandTag = new RegExp(/\(command\s([\w]+)\)/),
        tagCheck = new RegExp(/\(age\)|\(sender\)|\(@sender\)|\(baresender\)|\(random\)|\(1\)|\(count\)|\(pointname\)|\(price\)|\(#\)|\(uptime\)|\(follows\)|\(game\)|\(status\)|\(touser\)|\(echo\)|\(alert [,.\w]+\)|\(readfile|\(1=|\(countdown=|\(downtime\)|\(paycom\)|\(onlineonly\)|\(offlineonly\)|\(code=|\(followage\)|\(gameinfo\)|\(titleinfo\)|\(gameonly=|\(playtime\)|\(gamesplayed\)|\(pointtouser\)|\(customapi |\(customapijson /);

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
    function returnCommandCost(sender, command, isMod) {
        sender = sender.toLowerCase();
        command = command.toLowerCase();
        if ($.inidb.exists('pricecom', command) && parseInt($.inidb.get('pricecom', command)) > 0) {
            if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(sender)) || !isMod))) {
                $.inidb.incr('points', sender, $.inidb.get('pricecom', command));
            }
        }
    };

    /**
     * @function tags
     * @param {string} event
     * @param {string} message
     * @return {string}
     */
    function tags(event, message, atEnabled) {
        if (atEnabled && event.getArgs()[0] !== undefined && $.isModv3(event.getSender(), event.getTags())) {
            if (!message.match(tagCheck)) {
                return event.getArgs()[0] + ' -> ' + message;
            }
        }

        if (message.match(/\(adminonlyedit\)/)) {
            message = $.replace(message, '(adminonlyedit)', '');
        }

        if (message.match(/\(pointtouser\)/)) {
            if (event.getArgs()[0] !== undefined) {
                message = $.replace(message, '(pointtouser)', (event.getArgs()[0] + ' -> '));
            } else {
                message = $.replace(message, '(pointtouser)', $.userPrefix(event.getSender(), true));
            }
        }

        if (message.match(/\(1\)/g)) {
            for (var i = 1; i < 10; i++) {
                if (message.includes('(' + i + ')')) {
                    message = $.replace(message, '(' + i + ')', (event.getArgs()[i - 1] !== undefined ? event.getArgs()[i - 1] : ''));
                } else {
                    break;
                }
            }
        }

        if (message.match(/\(1=[^)]+\)/g)) {
            if (event.getArgs()[0]) {
                var t = message.match(/\(1=[^)]+\)/)[0];
                message = $.replace(message, t, event.getArgs()[0]);
            }
            message = $.replace(message, '(1=', '(');
        }

        if (message.match(/\(countdown=[^)]+\)/g)) {
            var t = message.match(/\([^)]+\)/)[0], countdown, time;
            countdown = t.replace('(countdown=', '').replace(')', '');
            time = (Date.parse(countdown) - Date.parse(new Date()));
            message = $.replace(message, t, $.getTimeString(time / 1000));
        }

        if (message.match(/\(downtime\)/g)) {
            message = $.replace(message, '(downtime)', String($.getStreamDownTime()));
        }

        if (message.match(/\(channelname\)/g)) {
            message = $.replace(message, '(channelname)', $.username.resolve($.channelName));
        }

        if (message.match(/\(onlineonly\)/g)) {
            if (!$.isOnline($.channelName)) {
                return null;
            }
            message = $.replace(message, '(onlineonly)', '');
        }

        if (message.match(/\(offlineonly\)/g)) {
            if ($.isOnline($.channelName)) {
                return null;
            }
            message = $.replace(message, '(offlineonly)', '');
        }

        if (message.match(/\(gameonly=[^)]+\)/g)) {
            var t = message.match(/\([^)]+\)/)[0],
                game = t.replace('(gameonly=', '').replace(')', '');

            if (!$.getGame($.channelName).equalsIgnoreCase(game)) {
                return null;
            }
            message = $.replace(message, t, '');
        }

        if (message.match(/\(sender\)/g)) {
            message = $.replace(message, '(sender)', $.username.resolve(event.getSender()));
        }

        if (message.match(/\(senderrank\)/g)) {
            message = $.replace(message, '(senderrank)', $.resolveRank(event.getSender()));
        }

        if (message.match(/\(@sender\)/g)) {
            message = $.replace(message, '(@sender)', $.userPrefix(event.getSender(), true));
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

        if (message.match(/\(randomrank\)/g)) {
            message = $.replace(message, '(randomrank)', $.resolveRank($.randElement($.users)[0]));
        }

        if (message.match(/\(pointname\)/g)) {
            message = $.replace(message, '(pointname)', $.pointNameMultiple);
        }

        if (message.match(/\(price\)/g)) {
            message = $.replace(message, '(price)', String($.inidb.exists('pricecom', event.getCommand()) ? $.getPointsString($.inidb.get('pricecom', event.getCommand())) : $.getPointsString(0)));
        }

        if (message.match(/\(pay\)/g)) {
            message = $.replace(message, '(pay)', String($.inidb.exists('paycom', event.getCommand()) ? $.getPointsString($.inidb.get('paycom', event.getCommand())) : $.getPointsString(0)));
        }

        if (message.match(/\(#\)/g)) {
            message = $.replace(message, '(#)', String($.randRange(1, 100)));
        }

        if (message.match(/\(viewers\)/g)) {
            message = $.replace(message, '(viewers)', String($.getViewers($.channelName) + ' '));
        }

        if (message.match(/\(follows\)/g)) {
            message = $.replace(message, '(follows)', String($.getFollows($.channelName) + ' '));
        }

        if (message.match(/\(subscribers\)/g)) {
            message = $.replace(message, '(subscribers)', String($.getSubscriberCount() + ' '));
        }

        if (message.match(/\(touser\)/g)) {
            message = $.replace(message, '(touser)', (!event.getArgs()[0] ? $.username.resolve(event.getSender()) : $.username.resolve(event.getArgs()[0])));
        }

        if (message.match(/\(echo\)/g)) {
            message = $.replace(message, '(echo)', event.getArguments());
        }

        if (message.match(/\(gamesplayed\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = $.replace(message, '(gamesplayed)', $.getGamesPlayed());
        }

        if (message.match(/\(code=/g)) {
            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                length = message.substr(6).replace(')', '');
                text = '',
                i;

            for (i = 0; i < length; i++) {
                text += code.charAt(Math.floor(Math.random() * code.length));
            }
            message = $.replace(message, '(code=' + length +')', String(text));
        }

        if (message.match(/\(alert [,.\w]+\)/g)) {
            var filename = message.match(/\(alert ([,.\w]+)\)/)[1];
            $.panelsocketserver.alertImage(filename);
            message = message.replaceFirst('\\(alert [,.\\w]+\\)', '');
            if (message == '') return null;
        }

        if (message.match(/\(readfile/)) {
            if (message.search(/\((readfile ([^)]+)\))/g) >= 0) {
                message = $.replace(message, '(' + RegExp.$1, $.readFile('addons/' + RegExp.$2)[0]);
            }
        }

        if (message.match(reCustomAPIJson) || message.match(reCustomAPI) || message.match(reCommandTag)) {
            message = apiTags(event, message);
        }

        if (message.match(/\(gameinfo\)/)) {
            if ($.getGame($.channelName) == ' ' || $.getGame($.channelName) == '') {
                message = $.replace(message, '(gameinfo)', $.lang.get('streamcommand.game.no.game'));
            } else if (!$.isOnline($.channelName) || $.getPlayTime() == 0) {
                message = $.replace(message, '(gameinfo)', $.lang.get('streamcommand.game.offline', $.getGame($.channelName)));
            } else {
                message = $.replace(message, '(gameinfo)', $.lang.get('streamcommand.game.online', $.getGame($.channelName), $.getPlayTime()));
            }
        }

        if (message.match(/\(titleinfo\)/)) {
            if ($.getStatus($.channelName) == ' ' || $.getStatus($.channelName) == '') {
                message = $.replace(message, '(titleinfo)', $.lang.get('streamcommand.title.no.title'));
            } else if (!$.isOnline($.channelName)) {
                message = $.replace(message, '(titleinfo)', $.lang.get('streamcommand.title.offline', $.getStatus($.channelName)));
            } else {
                message = $.replace(message, '(titleinfo)', $.lang.get('streamcommand.title.online', $.getStatus($.channelName), String($.getStreamUptime($.channelName))));
            }
        }

        if (message.match(/\(followage\)/g)) {
            var args = event.getArgs(), channel = $.channelName, sender = event.getSender();
            
            if (args.length > 0) sender = args[0];
            if (args.length > 1) channel = args[1];

            $.getFollowAge(event.getSender(), sender, channel);
            return null;
        }

        if (message.match(/\(playtime\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = $.replace(message, '(playtime)', ($.getPlayTime() ? $.getPlayTime() : ''));
        }

        if (message.match(/\(uptime\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = $.replace(message, '(uptime)', String($.getStreamUptime($.channelName)));
        }

        if (message.match(/\(age\)/g)) {
            $.getChannelAge(event);
            return null;
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
                                    customAPIResponse = new JSONObject(origCustomAPIResponse).getInt(jsonCheckList[0]);
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
                EventBus.instance().post(new CommandEvent(event.getSender(), commandToExec, message.replace(reCommandTag, '')));//Don't use postCommand. it got removed.
                return null;
            }
        }

        return message.replace(reCustomAPI, customAPIReturnString).replace(reCustomAPIJson, customAPIReturnString);
    };

    /**
     * @function permCom
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {sub} subcommand
     * @returns 0 = good, 1 = command perm bad, 2 = subcommand perm bad
     */
    function permCom(username, command, subcommand) {
        username = username.toLowerCase();
        if ($.isAdmin(username)) {
            return 0;
        }
        if (subcommand == '') {
            if ($.getCommandGroup(command) >= $.getUserGroupId(username)) {
                return 0;
            } else {
                return 1;
            }
        }
        if ($.getSubcommandGroup(command, subcommand) >= $.getUserGroupId(username)) {
            return 0;
        } else {
            return 2;
        }
    };

    /**
     * @function getCommandPrice
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {string} subCommandAction
     * @returns {Number}
     */
    function getCommandPrice(command, subCommand, subCommandAction) {
        command = command.toLowerCase();
        subCommand = subCommand.toLowerCase();
        subCommandAction = subCommandAction.toLowerCase();
        return parseInt($.inidb.exists('pricecom', command + ' ' + subCommand + ' ' + subCommandAction) ?
                            $.inidb.get('pricecom', command + ' ' + subCommand + ' ' + subCommandAction) :
                                $.inidb.exists('pricecom', command + ' ' + subCommand) ?
                                    $.inidb.get('pricecom', command + ' ' + subCommand) :
                                        $.inidb.exists('pricecom', command) ?
                                            $.inidb.get('pricecom', command) : 0);
    };

    /**
     * @function addComRegisterCommands
     */
    function addComRegisterCommands() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var commands = $.inidb.GetKeyList('command', ''),
                i;
            for (i in commands) {
                if (!$.commandExists(commands[i])) {
                    $.registerChatCommand('./commands/customCommands.js', commands[i], 7);
                }
            }
        }
    };

    /**
     * @function addComRegisterAliases
     */
    function addComRegisterAliases() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var aliases = $.inidb.GetKeyList('aliases', ''),
                i;
            for (i in aliases) {
                if (!$.commandExists(aliases[i])) {
                    $.registerChatCommand('./commands/customCommands.js', aliases[i], $.getIniDbNumber('permcom', aliases[i], 7));
                    $.registerChatAlias(aliases[i]);
                }
            }
        }
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            aliasArgs;

        /** Used for custom commands */
        if ($.inidb.exists('command', command)) {
            var tag = tags(event, $.inidb.get('command', command), true);
            if (tag !== null) {
                $.say(tag);
            }
            return;
        }

        /**
         * @commandpath addcom [command] [command text] - Add a custom command (see !listtags)
         */
        if (command.equalsIgnoreCase('addcom')) {
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

            if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.disabled'));
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

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.success', action));
            $.inidb.set('command', action.toLowerCase(), argString);
            $.registerChatCommand('./commands/customCommands.js', action);
            $.log.event(sender + ' added command !' + action + ' with the message "' + argString + '"');
        }

        /**
         * @commandpath editcom [command] [command text] - Replaces the given custom command
         */
        if (command.equalsIgnoreCase('editcom')) {
            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.usage'));
                return;
            } 

            action = args[0].replace('!', '').toLowerCase();
            
            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            } else if ($.commandExists(action) && !$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.404'));
                return;
            } else if ($.inidb.get('command', action).match(/\(adminonlyedit\)/) && !$.isAdmin(sender)) {
                if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getGroupNameById('1')));
                }
                return;
            }

            argString = argString.substring(argString.indexOf(args[0]) + args[0].length() + 1);

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.success', action));
            $.inidb.set('command', action.toLowerCase(), argString);
            $.registerChatCommand('./commands/customCommands.js', action);
            $.log.event(sender + ' edited the command !' + action + ' with the message "' + argString + '"');
        }

        /**
         * @commandpath delcom [command] - Delete a custom command
         */
        if (command.equalsIgnoreCase('delcom')) {
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

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.success', action));
            $.inidb.del('command', action);
            $.inidb.del('permcom', action);
            $.inidb.del('pricecom', action);
            $.inidb.del('aliases', action);
            $.unregisterChatCommand(action);
            $.log.event(sender + ' deleted the command !' + action);
        }

        /**
         * @commandpath aliascom [alias] [existing command] [parameters] - Create an alias to any command, optionally with parameters
         */
        if (command.equalsIgnoreCase('aliascom')) {
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

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', action + aliasArgs, subAction));
            $.inidb.set('aliases', subAction, action + aliasArgs);
            $.registerChatCommand('./commands/customCommands.js', subAction);
            $.registerChatAlias(subAction);
            $.log.event(sender + ' added alias "!' + subAction + '" for "!' + action + aliasArgs + '"');
        }

        /**
         * @commandpath delalias [alias] - Delete an alias
         */
        if (command.equalsIgnoreCase('delalias')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();
            if (!$.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get("customcommands.alias.delete.success", action));
            $.unregisterChatCommand(action.toLowerCase());
            $.inidb.del('aliases', action.toLowerCase());
            $.log.event(sender + ' deleted alias !' + action);
        }

        /**
         * @commandpath permcom [command] [groupId] - Set the permissions for a command
         * @commandpath permcom [command] [subcommand] [groupId] - Set the permissions for a subcommand
         */
        if (command.equalsIgnoreCase('permcom')) {
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

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action, $.getGroupNameById(group)));
                var list = $.inidb.GetKeyList('aliases', ''),
                    i;

                for (i in list) {
                    if (list[i].equalsIgnoreCase(action)) {
                        $.inidb.set('permcom', $.inidb.get('aliases', list[i]), group);
                        $.updateCommandGroup($.inidb.get('aliases', list[i]), group);
                    } 
                }
                $.inidb.set('permcom', action, group);
                $.log.event(sender + ' set permission on command !' + action + ' to group ' + group);
                $.updateCommandGroup(action, group);
                return;
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

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action + " " + subcommand, $.getGroupNameById(group)));
            $.inidb.set('permcom', action + " " + subcommand, group);
            $.log.event(sender + ' set permission on sub command !' + action + ' ' + subcommand + ' to group ' + group);
            $.updateSubcommandGroup(action, subcommand, group);
        }

        /**
         * @commandpath pricecom [command] [amount] - Set the amount of points a command should cost
         * @commandpath pricecom [command] [subcommand] [amount] - Set the amount of points a command should cost
         * @commandpath pricecom [command] [subcommand] [subaction] [amount] - Set the amount of points a command should cost
         */
        if (command.equalsIgnoreCase('pricecom')) {
            if (!action || !subAction || args.length > 4) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.usage'));
                return;
            }

            /* Traditional !pricecom. Set a price to a command and handle any aliases. */
            if (args.length == 2) {
                action = args[0].replace('!', '').toLowerCase();
                if (!$.commandExists(action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
                    return;
                } else if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }
    
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action, subAction, $.pointNameMultiple));
                $.inidb.set('pricecom', action, subAction);
                var list = $.inidb.GetKeyList('aliases', ''),
                    i;
    
                for (i in list) {
                    if (list[i].equalsIgnoreCase(action)) {
                        $.inidb.set('pricecom', $.inidb.get('aliases', list[i]), parseInt(subAction));
                    } 
                    if ($.inidb.get('aliases', list[i]).includes(action)) {
                        $.inidb.set('pricecom', list[i], parseInt(subAction));
                    }
                }
                $.log.event(sender + ' set price on command !' + action + ' to ' + subAction + ' ' + $.pointNameMultiple);
                return;
            }

            /**
             * Enhanced !pricecom that supports a subcommand and subaction.  Note that we do not check to ensure that the subcommand
             * or subaction are valid, only the root of the command.
             */
            action = args[0].replace('!', '').toLowerCase();
            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
                return;
            }

            /* Handle subcommand with price. */
            if (args.length == 3) {
                if (isNaN(args[2]) || parseInt(args[2]) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction, args[2], $.pointNameMultiple));
                $.inidb.set('pricecom', action + ' ' + subAction, args[2]);
                $.log.event(sender + ' set price on command !' + action + ' ' + subAction + ' to ' + args[2] + ' ' + $.pointNameMultiple);
                return;
            }

            /* Handle subcommand with subaction with price. */
            if (args.length == 4) {
                if (isNaN(args[3]) || parseInt(args[3]) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction + ' ' + args[2], args[3], $.pointNameMultiple));
                $.inidb.set('pricecom', action + ' ' + subAction +  ' ' + args[2], args[3]);
                $.log.event(sender + ' set price on command !' + action + ' ' + subAction + ' to ' + args[2] + ' ' + $.pointNameMultiple);
                return;
            }
        }

        /**
         * @commandpath paycom [command] [amount] - Set the amount of points a command should pay a viewer
         */
        if (command.equalsIgnoreCase('paycom')) {
            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.usage'));
                return;
            }

            action = args[0].replace('!', '').toLowerCase();
            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.error.404'));
                return;
            } else if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.error.invalid'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.success', action, subAction, $.pointNameMultiple));
            $.inidb.set('paycom', action, subAction);
            var list = $.inidb.GetKeyList('aliases', ''),
                i;

            for (i in list) {
                if (list[i].equalsIgnoreCase(action)) {
                    $.inidb.set('paycom', $.inidb.get('aliases', list[i]), parseInt(subAction));
                }
                if ($.inidb.get('aliases', list[i]).includes(action)) {
                    $.inidb.set('paycom', list[i], parseInt(subAction));
                }
            }
            $.log.event(sender + ' set payment on command !' + action + ' to ' + subAction + ' ' + $.pointNameMultiple);
        }

        /**
         * @commandpath listtags - Displays a list of tags that may be used in custom commands
         */
        if (command.equalsIgnoreCase('listtags')) {
            $.say($.whisperPrefix(sender) + 'Command tags: (sender), (@sender), (baresender), (random), (#), (uptime), (game), (status), (follows), (count), (touser), (price), (viewers), (pointname), (customapi), (echo), (customjsonapi), (age), (command command_name). (command command_name) must be the first item if used. Do not include the !');
        }

        /**
         * @commandpath commands - Provides a list of all available custom commands.
         */
        if (command.equalsIgnoreCase('commands')) {
            var cmds = $.inidb.GetKeyList('command', ''),
                aliases = $.inidb.GetKeyList('aliases', ''),
                cmdList = [];

            for (idx in cmds) {
                if (!$.inidb.exists('disabledCommands', cmds[idx])) {
                    if (permCom(sender, cmds[idx], '') === 0) {
                        cmdList.push('!' + cmds[idx]);
                    }
                }
            }

            for (idx in aliases) {
                //if (!$.inidb.exists('disabledCommands', $.inidb.get('aliases', aliases[idx]))) { Did not add it here in case someone disables a command to only use the alias.
                    if (permCom(sender, $.inidb.get('aliases', aliases[idx]), '') === 0) {
                        cmdList.push('!' + aliases[idx]);
                    }
                //}
            }
            if (cmdList.length > 0) {
                $.paginateArray(cmdList, 'customcommands.cmds', ', ', true, sender);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.404.no.commands'));
            }
        }

        /**
         * @commandpath botcommands - Will show you all of the bots commands
         */
        if (command.equalsIgnoreCase('botcommands')) {
            var cmds = $.inidb.GetKeyList('permcom', ''),
                idx,
                totalPages,
                cmdList = [];

            for (idx in cmds) {
                if (cmds[idx].indexOf(' ') !== -1) {
                    continue;
                }
                if (permCom(sender, cmds[idx], '') === 0) {
                    cmdList.push('!' + cmds[idx]);
                }
            }

            if (action === undefined) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, 1);
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.total', totalPages));
                return;
            } 
            if (!isNaN(action)) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, parseInt(action));
                return;
            } 
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.error'));
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
            $.tempUnRegisterChatCommand(action.toLowerCase());
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

            if (!$.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.err'));
                return;
            }

            $.inidb.del('disabledCommands', action);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.success', action));
            $.registerChatCommand(($.inidb.exists('tempDisabledCommandScript', action.toLowerCase()) ? $.inidb.get('tempDisabledCommandScript', action.toLowerCase()) : './commands/customCommands.js'), action.toLowerCase());
            $.log.event(sender + ' re-enabled command !' + command);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            $.registerChatCommand('./commands/customCommands.js', 'addcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'pricecom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'paycom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'aliascom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'delalias', 2);
            $.registerChatCommand('./commands/customCommands.js', 'delcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'editcom', 2);
            $.registerChatCommand('./commands/customCommands.js', 'permcom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'listtags', 2);
            $.registerChatCommand('./commands/customCommands.js', 'commands', 7);
            $.registerChatCommand('./commands/customCommands.js', 'disablecom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'enablecom', 1);
            $.registerChatCommand('./commands/customCommands.js', 'botcommands', 2);
        }
    });

    /** Export functions to API */
    $.addComRegisterCommands = addComRegisterCommands;
    $.addComRegisterAliases = addComRegisterAliases;
    $.returnCommandCost = returnCommandCost;
    $.permCom = permCom;
    $.getCommandPrice = getCommandPrice;
    $.tags = tags;
})();
