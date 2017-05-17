(function() {
    // Pre-build regular expressions.
    var reCustomAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&\-]+)\)/), // URL[1]
        reCustomAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&\-]+)\s([\w\W]+)\)/), // URL[1], JSONmatch[2..n]
        reCustomAPITextTag = new RegExp(/{([\w\W]+)}/),
        reCommandTag = new RegExp(/\(command\s([\w]+)\)/),
        tagCheck = new RegExp(/\(age\)|\(sender\)|\(@sender\)|\(baresender\)|\(random\)|\(1\)|\(count\)|\(pointname\)|\(currenttime|\(price\)|\(#|\(uptime\)|\(follows\)|\(game\)|\(status\)|\(touser\)|\(echo\)|\(alert [,.\w]+\)|\(readfile|\(1=|\(countdown=|\(downtime\)|\(paycom\)|\(onlineonly\)|\(offlineonly\)|\(code=|\(followage\)|\(gameinfo\)|\(titleinfo\)|\(gameonly=|\(playtime\)|\(gamesplayed\)|\(pointtouser\)|\(lasttip\)|\(writefile .+\)|\(readfilerand|\(commandcostlist\)|\(playsound |\(customapi |\(customapijson /),
        customCommands = [];

    /*
     * @function getCustomAPIValue
     *
     * @param {string} url
     * @returns {string}
     */
    function getCustomAPIValue(url) {
        return $.customAPI.get(url).content;
    }

    /*
     * @function returnCommandCost
     *
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
    }

    /*
     * @function tags
     *
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
                message = $.replace(message, '(pointtouser)', (event.getArguments().split(' ')[0] + ' -> '));
            } else {
                message = $.replace(message, '(pointtouser)', $.userPrefix(event.getSender(), true));
            }
        }

        if (message.match(/\(currenttime/)) {
            var timezone = message.match(/\(currenttime ([\w\W]+), (.*)\)/)[1],
                format = message.match(/\(currenttime ([\w\W]+), (.*)\)/)[2];

            message = $.replace(message, message.match(/\(currenttime ([\w\W]+), (.*)\)/)[0], $.getCurrentLocalTimeString(format, timezone));
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

        if (message.match(/\(commandcostlist\)/)) {
            var keys = $.inidb.GetKeyList('pricecom', ''),
                temp = [],
                i;
            for (i in keys) {
                if (!keys[i].includes(' ')) {
                    temp.push('!' + keys[i] + ': ' + $.getPointsString($.inidb.get('pricecom', keys[i])));
                }
            }
            $.paginateArray(temp, 'NULL' + message.replace('(commandcostlist)', ''), ', ', true, event.getSender());
            return null;
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
                returnCommandCost(event.getSender(), event.getCommand(), $.isModv3(event.getSender(), event.getTags()));
                return null;
            }
            message = $.replace(message, '(onlineonly)', '');
        }

        if (message.match(/\(offlineonly\)/g)) {
            if ($.isOnline($.channelName)) {
                returnCommandCost(event.getSender(), event.getCommand(), $.isModv3(event.getSender(), event.getTags()));
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

        if (message.match(/\(# (\d+),(\d+)\)/g)) {
            var mat = message.match(/\(# (\d+),(\d+)\)/);
            message = $.replace(message, mat[0], String($.randRange(parseInt(mat[1]), parseInt(mat[2]))));
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
            message = $.replace(message, '(touser)', (event.getArgs()[0] === undefined ? $.username.resolve(event.getSender()) : String(event.getArgs()[0]).replace(/[^a-z0-9_@]/ig, '')));
        }

        if (message.match(/\(echo\)/g)) {
            message = $.replace(message, '(echo)', (event.getArguments() ? event.getArguments() : ''));
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
                message = $.replace(message, '(' + RegExp.$1, $.readFile('./addons/' + RegExp.$2)[0]);
            }
        }

        if (message.match(/\(readfilerand/)) {
            if (message.search(/\((readfilerand ([^)]+)\))/g) >= 0) {
                var path = RegExp.$2;
                var path2 = RegExp.$1;
                var results = $.arrayShuffle($.readFile('./addons/' + path.trim()));
                message = $.replace(message, '(' + path2.trim(), $.randElement(results));
            }
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

        if (message.match(/\(lasttip\)/g)) {
            message = $.replace(message, '(lasttip)', ($.inidb.exists('donations', 'last_donation_message') ? $.inidb.get('donations', 'last_donation_message') : 'No donations found.'));
        }

        if (message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/g)) {
            if (!$.audioHookExists(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1])) {
                $.log.error('Could not play audio hook: Audio hook does not exist.');
                return null;
            }
            $.panelsocketserver.triggerAudioPanel(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1]);
            message = $.replace(message, message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[0], '');
            if (message == '') {
                return null;
            }     
        }

        if (message.match(/\(age\)/g)) {
            $.getChannelAge(event);
            return null;
        }

        if (message.match(/\(writefile .+\)/)) {
            if (message.match(/\(writefile (.+), (.+), (.+)\)/)) {
                var file = message.match(/\(writefile (.+), (.+), (.+)\)/)[1],
                    append = (message.match(/\(writefile (.+), (.+), (.+)\)/)[2] == 'true' ? true : false),
                    string = message.match(/\(writefile (.+), (.+), (.+)\)/)[3];
                $.writeToFile(string, './addons/' + file, append);
            }
            message = $.replace(message, message.match(/\(writefile (.+), (.+), (.+)\)/)[0], '');
            if (message == '') {
                return null;
            }
        }

        if (message.match(/\(encodeurl ([\w\W]+)\)/)) {
            var m = message.match(/\(encodeurl ([\w\W]+)\)/);
            message = $.replace(message, m[0], encodeURI(m[1]));
        }

        if (message.match(/\(math (.*)\)/)) {
            var mathStr = message.match(/\(math (.*)\)/)[1].replace(/\s/g, '');

            if (mathStr.length === 0) {
                return null;
            }

            message = $.replace(message, message.match(/\(math (.*)\)/)[0], String(eval(mathStr)));
        }

        if (message.match(reCustomAPIJson) || message.match(reCustomAPI) || message.match(reCommandTag)) {
            message = apiTags(event, message);
        }

        return message;
    }

    /*
     * @function apiTags
     *
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
                                try {
                                    jsonObject = new JSONObject(origCustomAPIResponse).getJSONObject(jsonCheckList[i]);
                                } catch (ex) {
                                    jsonObject = new JSONObject(origCustomAPIResponse).getJSONArray(jsonCheckList[i]);
                                }
                            } else if (!isNaN(jsonCheckList[i + 1])) {
                                try {
                                    jsonObject = jsonObject.getJSONArray(jsonCheckList[i]);
                                } catch (ex) {
                                    jsonObject = jsonObject.getJSONObject(jsonCheckList[i]);
                                }
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
                EventBus.instance().post(new CommandEvent(event.getSender(), commandToExec, message.replace(reCommandTag, '')));
                return null;
            }
        }

        return message.replace(reCustomAPI, customAPIReturnString).replace(reCustomAPIJson, customAPIReturnString);
    }

    /*
     * @function permCom
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {sub} subcommand
     * @returns 0 = good, 1 = command perm bad, 2 = subcommand perm bad
     */
    function permCom(username, command, subcommand) {
        if ($.isAdmin(username)) {
            return 0;
        }
        if (subcommand === '') {
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
    }

    /*
     * @function getCommandPrice
     *
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
    }

    /*
     * @function addComRegisterCommands
     */
    function addComRegisterCommands() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var commands = $.inidb.GetKeyList('command', ''),
                i;
            for (i in commands) {
                if (!$.commandExists(commands[i])) {
                    customCommands[commands[i]] = $.inidb.get('command', commands[i]);
                    $.registerChatCommand('./commands/customCommands.js', commands[i], 7);
                }
            }
        }
    }

    /*
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

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /*
         * This handles custom commands, no command path is needed.
         */
        if (customCommands[command] !== undefined) {
            var tag = tags(event, customCommands[command], true);
            if (tag !== null) {
                $.say(tag);
            }
            return;
        }

        /*
         * @commandpath addcom [command] [command response] - Adds a custom command
         */
        if (command.equalsIgnoreCase('addcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            if ($.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.error'));
                return;
            } else if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.disabled'));
                return;
            } else if (argsString.indexOf('(command ') !== -1) {
                if (argsString.indexOf('(command ') !== 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.notfirst'));
                    return;
                } else {
                    if (!$.commandExists(argsString.match(reCommandTag)[1])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.invalid', checkCmd));
                        return;
                    }
                }
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.success', action));
            $.registerChatCommand('./commands/customCommands.js', action);
            $.inidb.set('command', action, argsString);
            customCommands[action] = argsString;
            return;
        }

        /*
         * @commandpath editcom [command] [command response] - Edits the current response of that command
         */
        if (command.equalsIgnoreCase('editcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.usage'));
                return;
            } 

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');
            
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

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.success', action));
            $.registerChatCommand('./commands/customCommands.js', action, 7);
            $.inidb.set('command', action, argsString);
            customCommands[action] = argsString;
            return;
        }

        /*
         * @commandpath delcom [command] - Delete that custom command
         */
        if (command.equalsIgnoreCase('delcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.success', action));
            $.inidb.del('command', action);
            $.inidb.del('permcom', action);
            $.inidb.del('pricecom', action);
            $.inidb.del('aliases', action);
            $.unregisterChatCommand(action);
            delete customCommands[action];
            return;
        }

        /*
         * @commandpath aliascom [alias name] [existing command] - Create an alias to any command
         */
        if (command.equalsIgnoreCase('aliascom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            subAction = args.slice(1).join(' ').replace('!', '').toLowerCase();

            if (!$.commandExists(subAction.split(' ')[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404'));
                return
            } else if ($.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', subAction, action));
            $.registerChatCommand('./commands/customCommands.js', action);
            $.inidb.set('aliases', action, subAction);
            $.registerChatAlias(action);
            return;
        }

        /*
         * @commandpath delalias [alias] - Delete that alias
         */
        if (command.equalsIgnoreCase('delalias')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.success', action));
            $.unregisterChatCommand(action);
            $.inidb.del('aliases', action);
            return;
        }

        /*
         * @commandpath permcom [command] [groupId] - Set the permissions for any command
         */
        if (command.equalsIgnoreCase('permcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            var group = 7;

            if (args.length === 2) {
                group = args[1];

                if (!$.commandExists(action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action));
                    return;
                } else if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
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
                $.updateCommandGroup(action, group);
            } else {
                group = args[2];
    
                if (!$.subCommandExists(action, subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action + ' ' + subAction));
                    return;
                } else if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }
    
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action + ' ' + subAction, $.getGroupNameById(group)));
                $.inidb.set('permcom', action + ' ' + subAction, group);
                $.updateSubcommandGroup(action, subAction, group);
            }
            return;
        }

        /*
         * @commandpath pricecom [command] [amount] - Set the amount of points a command should cost
         */
        if (command.equalsIgnoreCase('pricecom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
                return;
            }

            if (args.length === 2) {
                if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
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
            } else if (args.length === 3) { 
                if (isNaN(parseInt(args[2])) || parseInt(args[2]) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction, args[2], $.pointNameMultiple));
                $.inidb.set('pricecom', action + ' ' + subAction, args[2]);
            } else {
                if (args.length === 4) {
                    if (isNaN(parseInt(args[3])) || parseInt(args[3]) < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                        return;
                    }
    
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction + ' ' + args[2], args[3], $.pointNameMultiple));
                    $.inidb.set('pricecom', action + ' ' + subAction + ' ' + args[2], args[3]);
                }
            }
            return;
        }

        /*
         * @commandpath paycom [command] [amount] - Set the amount of points a command should reward a viewer
         */
        if (command.equalsIgnoreCase('paycom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

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
                    $.inidb.set('paycom', $.inidb.get('aliases', list[i]), subAction);
                }
                if ($.inidb.get('aliases', list[i]).includes(action)) {
                    $.inidb.set('paycom', list[i], subAction);
                }
            }
            return;
        }

        /*
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
                if (permCom(sender, $.inidb.get('aliases', aliases[idx]), '') === 0) {
                    cmdList.push('!' + aliases[idx]);
                }
            }

            if (cmdList.length > 0) {
                $.paginateArray(cmdList, 'customcommands.cmds', ', ', true, sender);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.404.no.commands'));
            }
            return;
        }

        /*
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
            } else if (!isNaN(action)) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, parseInt(action));
                return;
            } 
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.error'));
            return;
        }

        /*
         * @commandpath disablecom [command] - Disable a command from being used in chat
         */
        if (command.equalsIgnoreCase('disablecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.404'));
                return;
            } else if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.success', action));
            $.inidb.set('disabledCommands', action, true);
            $.tempUnRegisterChatCommand(action);
            return;
        }

        /*
         * @commandpath enablecom [command] - Enable a command thats been disabled from being used in chat
         */
        if (command.equalsIgnoreCase('enablecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.success', action));
            $.inidb.del('disabledCommands', action);
            $.registerChatCommand(($.inidb.exists('tempDisabledCommandScript', action) ? $.inidb.get('tempDisabledCommandScript', action) : './commands/customCommands.js'), action);
            return;
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/customCommands.js', 'addcom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'pricecom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'paycom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'aliascom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'delalias', 2);
        $.registerChatCommand('./commands/customCommands.js', 'delcom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'editcom', 2);
        $.registerChatCommand('./commands/customCommands.js', 'permcom', 1);
        $.registerChatCommand('./commands/customCommands.js', 'commands', 7);
        $.registerChatCommand('./commands/customCommands.js', 'disablecom', 1);
        $.registerChatCommand('./commands/customCommands.js', 'enablecom', 1);
        $.registerChatCommand('./commands/customCommands.js', 'botcommands', 2);
    });
    
    /*
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./commands/customCommands.js')) {
            if (event.getArgs()[0] == 'remove') {
                if (customCommands[event.getArgs()[1].toLowerCase()] !== undefined) {
                    delete customCommands[event.getArgs()[1].toLowerCase()];
                    $.unregisterChatCommand(event.getArgs()[1].toLowerCase());
                    $.coolDown.remove(event.getArgs()[1].toLowerCase());
                }
            } else if (event.getArgs()[0] == 'add') {
                customCommands[event.getArgs()[1].toLowerCase()] = event.getArgs()[2];
                $.registerChatCommand('./commands/customCommands.js', event.getArgs()[1].toLowerCase());
                if (event.getArgs()[3] != null && event.getArgs()[3].equalsIgnoreCase('cooldown')) {
                    $.coolDown.add(event.getArgs()[1].toLowerCase(), parseInt(event.getArgs()[4]), event.getArgs()[5].equals('true'));
                }
            } else if (event.getArgs()[0] == 'edit') {
                customCommands[event.getArgs()[1].toLowerCase()] = event.getArgs()[2];
                if (event.getArgs()[3] != null && event.getArgs()[3].equalsIgnoreCase('cooldown')) {
                    $.coolDown.add(event.getArgs()[1].toLowerCase(), parseInt(event.getArgs()[4]), event.getArgs()[5].equals('true'));
                }
            }
        }
    });

    /*
     * Export functions to API 
     */
    $.addComRegisterCommands = addComRegisterCommands;
    $.addComRegisterAliases = addComRegisterAliases;
    $.returnCommandCost = returnCommandCost;
    $.permCom = permCom;
    $.getCommandPrice = getCommandPrice;
    $.tags = tags;
})();
