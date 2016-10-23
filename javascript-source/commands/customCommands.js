/**
 * @info this handle custom commands and other things
 *
 */
(function() {
    var ScriptEventManager = Packages.me.mast3rplan.phantombot.script.ScriptEventManager,
        CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent,
        customAPI = new RegExp(/\(customapi\s([\w\W:\/\$\=\?\&]+)\)/),
        customAPIJson = new RegExp(/\(customapijson ([\w\.:\/\$=\?\&]+)\s([\w\W]+)\)/),
        customAPIText = new RegExp(/\{([\w\W]+)\}/),
        commandTag = new RegExp(/\(command\s([\w]+)\)/),
        tag = new RegExp(/\(age\)|\(sender\)|\(@sender\)|\(baresender\)|\(random\)|\(1\)|\(count\)|\(pointname\)|\(price\)|\(#\)|\(uptime\)|\(follows\)|\(game\)|\(status\)|\(touser\)|\(echo\)|\(alert [,.\w]+\)|\(readfile|\(1=|\(countdown=|\(downtime\)|\(paycom\)|\(onlineonly\)|\(offlineonly\)|\(code=|\(followage\)|\(gameinfo\)|\(titleinfo\)|\(gameonly=|\(playtime\)|\(gamesplayed\)|\(customapi|\(customapijson/),
        commandCache = {};

    /**
     * @function postCommand
     * @info Used to post a command via scripts.
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {string} arguments
     */
    function postCommand(username, command, arguments, tags) {
        ScriptEventManager.instance().runDirect(new CommandEvent(username, command, (arguments !== undefined ? arguments : ''), (tags ? tags : null)));
    }

    /**
     * @function getCustomAPI
     * @info Uses the http request server to call a API.
     *
     * @export $
     * @param {string} url
     * @returns {string}
     */
    function getCustomAPI(url) {
        var HttpResponse = Packages.com.gmt2001.HttpResponse,
            HttpRequest = Packages.com.gmt2001.HttpRequest,
            HashMap = Packages.java.util.HashMap,
            responseData = HttpRequest.getData(HttpRequest.RequestType.GET, url, '', new HashMap());
        return responseData.content;
    }

    /**
     * @function returnCommandCost
     * @info returns the command cost that was used.
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {boolean} isMod
     */
    function returnCommandCost(username, command, isMod) {
        if ($.inidb.exists('pricecom', command) && parseInt($.inidb.get('pricecom', command)) > 0) {
            if ($.getIniDbBoolean('settings', 'pricecomMods', false) && isMod || !isMod) {
                $.inidb.incr('points', username, $.inidb.get('pricecom', command));
            }
        }
    }

    /**
     * @function permCom
     * @info Used to check if the user has permission to use a command.
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {string} subCommand
     * @returns {int}
     */
    function permCom(username, command, subCommand) {
        if ($.isAdmin(username)) {
            return 0;
        }

        if (subCommand === '') {
            return ($.getCommandGroup(command) >= $.getUserGroupId(username) ? 0 : 1);
        } else {
            return ($.getSubCommandGroup(command, subCommand) >= $.getUserGroupId(username) ? 0 : 2);
        }
    }

    /**
     * @function priceCom
     * @info Used to check if the user has enough points to use that command.
     *
     * @export $
     * @param {string} username
     * @prarm {string} command
     * @param {string} subCommand
     * @returns {boolean}
     */
    function priceCom(username, command, subCommand) {
        return (getCommandPrice(command, subCommand) < $.getUserPoints(username) ? 0 : 1);
    }

    /**
     * @function getCommandPrice
     * @info Used to get the command price.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {int}
     */
    function getCommandPrice(command, subCommand) {
        if (subCommand === '') {
            return $.getCommandCost(command);
        } else {
            return $.getSubCommandCost(command, subCommand);
        }
    }

    /**
     * @function registerCustomCommands
     * @info Used to register custom commands.
     *
     * @export $
     */
    function registerCustomCommands() {
        var keys = $.inidb.GetKeyList('command', ''),
            i;

        /* Checks if the module is enabled. */
        if (!$.bot.isModuleEnabled('./commands/customCommands.js')) {
            return;
        }

        /* Load the cutom command cache. */
        loadCustomCommandCache();

        /* Registers the custom commands */
        for (i = 0; i < keys.length; i++) {
            $.registerChatCommand('./commands/customCommands.js', keys[i], 7);
        }
    }

    /**
     * @function registerCustomAliases
     * @info Used to register custom command aliases.
     *
     * @export $
     */
    function registerCustomAliases() {
        var keys = $.inidb.GetKeyList('aliases', ''),
            i;

        /* Checks if the module is enabled. */
        if (!$.bot.isModuleEnabled('./commands/customCommands.js')) {
            return;
        }

        /* Registers the custom aliases */
        for (i = 0; i < keys.length; i++) {
            $.registerChatAlias('./commands/customCommands.js', keys[i], $.getIniDbNumber('permcom', $.inidb.get('command', keys[i]), 7));
        }
    }

    /**
     * @function loadCustomCommandCache
     * @info Used to put commands in a array cache.
     *
     * @export $
     */
    function loadCustomCommandCache() {
        var keys = $.inidb.GetKeyList('command', ''),
            i;

        /* Checks if the module is enabled. */
        if (!$.bot.isModuleEnabled('./commands/customCommands.js')) {
            return;
        }

        commandCache = {};

        /* Registers the custom commands */
        for (i in keys) {
            commandCache[keys[i]] = $.inidb.get('command', keys[i]);
        }
    }

    /**
     * @function isCustomCommandCached
     * @info Tells you if the custom command is cached.
     *
     * @export $
     * @param {string} command
     * @returns {boolean}
     */
    function isCustomCommandCached(command) {
        return (commandCache[command] !== undefined);
    }

    /**
     * @function customCommandExists
     * @info Used to see if a custom command exists
     *
     * @export $
     * @param {string} command
     * @returns {boolean}
     */
    function customCommandExists(command) {
        return $.inidb.exists('command', command);
    }

    /**
     * @function customAliasExists
     * @info Used to see if a custom alias exists
     *
     * @export $
     * @param {string} alias
     * @returns {boolean}
     */
    function customAliasExists(alias) {
        return $.inidb.exists('aliases', alias);
    }

    /**
     * @function add
     * @info Used to add a custom command or alias.
     *
     * @param {string} command
     * @param {string} response
     * @param {int} permissionId
     * @param {boolean} alias
     */
    function add(command, response, permissionId, alias) {
        if (alias) {
            $.inidb.set('aliases', command, response);
            $.registerChatAlias('./commands/customCommands.js', command, $.getIniDbNumber('permcom', command, 7));
        } else {
            $.inidb.set('command', command, response);
            $.inidb.set('permcom', command, permissionId);
            commandCache[command] = response;
            $.registerChatCommand('./commands/customCommands.js', command, permissionId);
        }
    }

    /**
     * @function remove
     * @info Used to remove a command or alias.
     *
     * @param {string} command
     * @param {boolean} alias
     */
    function remove(command, alias) {
        if (alias) {
            $.inidb.del('aliases', command);
            $.unregisterChatCommand(command);
        } else {
            $.inidb.del('command', command);
            $.inidb.del('disabledCommands', command);
            delete commandCache[command];
            $.unregisterChatCommand(command);
        }
    }

    /**
     * @function edit
     * @info Used to edit a custom command
     *
     * @param {string} command
     * @param {stirng} response
     */
    function edit(command, response) {
        $.inidb.set('command', command, response);
        commandCache[command] = response;
    }

    /**
     * @function api
     * @info Used to call a api
     *
     * @param {object} event
     * @param {string} message
     */
    function api(event, message) {
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
        if ((regExCheck = message.match(customAPI))) {
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
            customAPIReturnString = getCustomAPI(regExCheck[1]);
        }

        // Design Note.  As of this comment, this parser only supports parsing out of objects, it does not
        // support parsing of arrays, especially walking arrays.  If that needs to be done, please write
        // a custom JavaScript.  We limit $1 - $9 as well; 10 or more arguments being passed by users to an
        // API seems like overkill.  Even 9 does, to be honest.
        if ((regExCheck = message.match(customAPIJson))) {
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
            origCustomAPIResponse = getCustomAPI(regExCheck[1]);
            jsonItems = regExCheck[2].split(' ');
            for (var j = 0; j < jsonItems.length; j++) {
                if (jsonItems[j].startsWith('{') && jsonItems[j].endsWith('}')) {
                    customAPIReturnString += " " + jsonItems[j].match(customAPIText)[1];
                } else if (jsonItems[j].startsWith('{') && !jsonItems[j].endsWith('}')) {
                    customJSONStringTag = '';
                    while (!jsonItems[j].endsWith('}')) {
                        customJSONStringTag += jsonItems[j++] + " ";
                    }
                    customJSONStringTag += jsonItems[j];
                    customAPIReturnString += " " + customJSONStringTag.match(customAPIText)[1];
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
            return message.replace(customAPI, customAPIReturnString).replace(customAPIJson, customAPIReturnString);
        }

        /* Check for a command */
        if (message.match(commandTag)) {
            arguments = message.match(commandTag)[1];
            if (arguments.length !== 0) {
                postCommand(event.getSender(), arguments, message.replace(commandTag, ''), event.getTags());
            }
        }
        return null;
    }

    /**
     * @function tags
     * @info Used to replace command tags in custom commands or keywords
     *
     * @param {object} event
     * @param {string} message
     * @param {boolean} toUser
     */
    function tags(event, message, toUser) {
        if (toUser && event.getArgs()[0] !== undefined) {
            if (!message.match(tag)) {
                return (event.getArgs()[0] + ' -> ' + message);
            }
        }
    
        if (message.match(/\(1\)/g)) {
            for (var i = 1; i < 10; i++) {
                if (message.includes('(' + i + ')')) {
                    message = message.replace('(' + i + ')', (event.getArgs()[i - 1] !== undefined ? event.getArgs()[i - 1] : ''));
                } else {
                    break;
                }
            }
        }
    
        if (message.match(/\(1=[^)]+\)/g)) {
            if (event.getArgs()[0]) {
                var t = message.match(/\(1=[^)]+\)/)[0];
                message = message.replace(t, event.getArgs()[0]);
            }
            message = message.replace(/\(1=/g, '(');
        }
    
        if (message.match(/(\(sender\)|\(baresender\))/)) {
            message = message.replace(/(\(sender\)|\(baresender\))/g, $.username.resolve(event.getSender(), event.getTags()));
        }
    
        if (message.match(/\(senderrank\)/)) {
            message = message.replace(/\(senderrank\)/g, $.resolveRank(event.getSender()));
        }
    
        if (message.match(/\(@sender\)/)) {
            message = message.replace(/\(@sender\)/g, String('@' + $.username.resolve(event.getSender(), event.getTags()) + ', '));
        }
    
        if (message.match(/\(game\)/)) {
            message = message.replace(/\(game\)/g, $.getGame($.channelName));
        }
    
        if (message.match(/(\(status\)|\(title\))/)) {
            message = message.replace(/(\(status\)|\(title\))/g, $.getStatus($.channelName));
        }
    
        if (message.match(/\(count\)/)) {
            $.inidb.incr('commandCount', event.getCommand(), 1);
            message = message.replace(/\(count\)/g, $.inidb.get('commandCount', event.getCommand()));
        }
    
        if (message.match(/\(random\)/)) {
            message = message.replace(/\(random\)/g, $.username.resolve($.randElement($.users)[0]));
        }
    
        if (message.match(/\(randomrank\)/)) {
            message = message.replace(/\(randomrank\)/g, $.resolveRank($.randElement($.users)[0]));
        }
    
        if (message.match(/\(pointname\)/)) {
            message = message.replace(/\(pointname\)/g, $.pointNameMultiple);
        }
    
        if (message.match(/\(points\)/)) {
            message = message.replace(/\(points\)/g, String($.getPointsString($.getUserPoints(event.getSender()))));
        }
    
        if (message.match(/\(time\)/)) {
            message = message.replace(/\(time\)/g, String($.getTimeString($.getUserTime(event.getSender()))));
        }
    
        if (message.match(/\(price\)/)) {
            message = message.replace(/\(price\)/g, String($.inidb.exists('pricecom', event.getCommand() ? $.getPointsString($.inidb.get('pricecom', event.getCommand())) : $.getPointsString('0'))));
        }
    
        if (message.match(/(\(pay\)|\(reward\))/)) {
            message = message.replace(/(\(pay\)|\(reward\))/g, String($.inidb.exists('paycom', event.getCommand() ? $.getPointsString($.inidb.get('paycom', event.getCommand())) : $.getPointsString('0'))));
        }
    
        if (message.match(/(\(follows\)|\(followers\))/)) {
            message = message.replace(/(\(follows\)|\(followers\))/g, String($.getFollows($.channelName) + ' '));
        }
    
        if (message.match(/\(#\)/)) {
            message = message.replace(/\(#\)/g, String($.randRange(1, 100) + ' '));
        }
    
        if (message.match(/\(viewers\)/)) {
            message = message.replace(/\(viewers\)/g, String($.getViewers($.channelName) + ' '));
        }
    
        if (message.match(/\(subscribers\)/)) {
            message = message.replace(/\(subscribers\)/g, String($.getSubscriberCount() + ' '));
        }
    
        if (message.match(/\(touser\)/)) {
            message = message.replace(/\(touser\)/g, (event.getArgs()[0] === undefined ? $.username.resolve(event.getSender(), event.getTags()) : $.username.resolve(event.getArgs()[0])));
        }
    
        if (message.match(/\(echo\)/)) {
            message = message.replace(/\(echo\)/g, String(event.getArguments()));
        }
    
        if (message.match(/\(gamesplayed\)/)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = message.replace(/\(gamesplayed\)/g, $.getGamesPlayed());
        }
    
        if (message.match(/\(code=/)) {
            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                length = message.substr(6).replace(')', '');
                text = '',
                i;
               
            for (i = 0; i < length; i++) {
                text += code.charAt(Math.floor(Math.random() * code.length));
            }
            message = message.replace('(code=' + length + ')', String(text));
        }
    
        if (message.match(/\(alert [,.\w]+\)/)) {
            $.panelsocketserver.alertImage(message.match(/\(alert ([,.\w]+)\)/)[1]);
            message = message.replace('\\(alert [,.\\w]+\\)', '');
            if (message === '') {
                return null;
            }
        }
    
        if (message.match(/\(readfile/)) {
            if (message.search(/\((readfile ([^)]+)\))/g) >= 0) {
                message = message.replace('(' + RegExp.$1, $.readFile('addons/' + RegExp.$2)[0]);
            }
        }
    
        if (message.match(/\(gameinfo\)/)) {
            if ($.getGame($.channelName) == ' ') {
                message = message.replace(/\(gameinfo\)/g, $.lang.get('streamcommand.game.no.game'));
            } else if (!$.isOnline($.channelName) || $.getPlayTime() == 0) {
                message = message.replace(/\(gameinfo\)/g, $.lang.get('streamcommand.game.offline', $.getGame($.channelName)));
            } else {
                message = message.replace(/\(gameinfo\)/g, $.lang.get('streamcommand.game.online', $.getGame($.channelName), $.getPlayTime()));
            }
        }
    
        if (message.match(/\(titleinfo\)/)) {
            if ($.getStatus($.channelName) == ' ') {
                message = message.replace(/\(titleinfo\)/g, $.lang.get('streamcommand.title.no.title'));
            } else if (!$.isOnline($.channelName)) {
                message = message.replace(/\(titleinfo\)/g, $.lang.get('streamcommand.title.offline', $.getStatus($.channelName)));
            } else {
                message = message.replace(/\(titleinfo\)/g, $.lang.get('streamcommand.title.online', $.getStatus($.channelName), String($.getStreamUptime($.channelName))));
            }
        }
    
        if (message.match(/\(uptime\)/)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = message.replace(/\(uptime\)/g, String($.getStreamUptime($.channelName)));
        }
    
        if (message.match(/\(playtime\)/g)) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return null;
            }
            message = message.replace(/\(playtime\)/g, ($.getPlayTime() ? $.getPlayTime() : ''));
        }
    
        if (message.match(/\(followage\)/)) {
            $.getFollowAge(event.getSender(), (event.getArgs().length > 0 ? event.getArgs()[0] : event.getSender()), (event.getArgs().length > 1 ? event.getArgs()[0] : $.channelName));
            return null;
        }
    
        if (message.match(/\(age\)/)) {
            $.getChannelAge(event);
            return null;
        }

        if (message.match(/\(offlineonly\)/)) {
            if ($.isOnline($.channelName)) {
                return null;
            }
            message = message.replace(/\(offlineonly\)/g, '');
        }

        if (message.match(/\(onlineonly\)/)) {
            if (!$.isOnline($.channelName)) {
                return null;
            }
            message = message.replace(/\(onlineonly\)/g, '');
        }
    
        if (message.match(customAPI) || message.match(customAPIJson) || message.match(commandTag)) {
            message = api(event, message);
        }
    
        return message;
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            subActionArgs = args[2],
            permissionId,
            response;

        /* Checks for custom commands */
        if (commandCache[command] !== undefined) {
            var check = tags(event, commandCache[command], true);
            if (check !== null) {
                $.say(check);
            }
            return;
        }

        /**
         * @commandpath commands - Shows all the bot's custom commands.
         */
        if (command.equalsIgnoreCase('commands')) {
            var commands = $.inidb.GetKeyList('command', ''),
                list = [],
                i;

            for (i in commands) {
                if (permCom(sender, commands[i], '') === 0) {
                    list.push('!' + commands[i]);
                }
            }

            if (list.length > 0) {
                $.paginateArray(list, 'customcommands.commands.list', ', ', true, sender);
            }
            return;
        }

        if (command.equalsIgnoreCase('botcommands')) {
            var commands = $.inidb.GetKeyList('permcom', ''),
                list = [],
                pages,
                i;

            for (i in commands) {
                if (commands[i].includes(' ')) {
                    continue;
                }
                if (permCom(sender, commands[i], '') === 0) {
                    list.push('!' + commands[i]);
                }
            }

            if (list.length > 0) {
                if (action !== undefined && !isNaN(parseInt(action))) {
                    $.paginateArray(list, 'customcommands.commands.botcommands', ', ', true, sender, parseInt(action));
                } else {
                    pages = $.paginateArray(list, 'customcommands.commands.botcommands', ', ', true, sender, 1);
                    if (pages !== 1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.commands.botcommands.pages', pages));
                    }
                }
            }
            return;
        }

        if (command.equalsIgnoreCase('command')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.usage'));
                return;
            }

            /** 
             * @commandpath command add [command] [response] [-admin / -mod / -sub / -reg] - Adds a custom command. You can choose a permission or it will default to everyone, this can be changed later.
             */
            if (action.equalsIgnoreCase('add')) {
                if (subAction === undefined || subActionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.add.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();
                response = args.splice(2).join(' ');

                /* Checks if the command already exists */
                if ($.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.add.error.exists', subAction));
                    return;
                }

                /* Checks if the command is disabled. */
                if ($.inidb.exists('disabledCommands', subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.add.error.disabled', subAction));
                    return;
                }

                /* Checks if the user wants to set a permission on the command */
                if (arguments.endsWith('-admin')) {
                    response.substring(7);
                    permissionId = 1;
                } else if (arguments.endsWith('-mod')) {
                    response.substring(5);
                    permissionId = 2;
                } else if (arguments.endsWith('-sub')) {
                    response.substring(5);
                    permissionId = 3;
                } else if (arguments.endsWith('-reg')) {
                    response.substring(5);
                    permissionId = 6;
                } else {
                    permissionId = 7;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.add.success', subAction));
                add(subAction, response, permissionId);
                return;
            }

            /**
             * @commandpath command remove [command] - Removes that custom command.
             */
            if (action.equalsIgnoreCase('remove')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.remove.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (customAliasExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.remove.error.alias', subAction));
                    return;
                }

                /* Checks if the command exists */
                if (!customCommandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.remove.error.not.found', subAction));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.remove.success', subAction));
                remove(subAction);
                return;
            }

            /**
             * @commandpath command edit [command] [response] - Edits the response of that command.
             */
            if (action.equalsIgnoreCase('edit')) {
                if (subAction === undefined || subActionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.edit.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();
                response = args.splice(2).join(' ');

                /* Checks if the command exists */
                if (!customCommandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.edit.error.not.found', subAction));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.edit.success', subAction));
                edit(subAction, response);
                return;
            }

            /**
             * @commandpath command alias add [alias] [existing command] - Adds a alias for that command.
             * @commandpath command alias remove [alias] - Removes that alias.
             */
            if (action.equalsIgnoreCase('alias')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('add')) {
                    if (subActionArgs === undefined || args[3] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.usage'));
                        return;
                    }

                    subActionArgs = subActionArgs.replace('!', '').toLowerCase();
                    args[3] = args[3].replace('!', '').toLowerCase();

                    /* Checks if the alias exists*/
                    if (customAliasExists(subActionArgs) || $.commandExists(subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.error.exists', subActionArgs));
                        return;
                    }

                    /* Checks if the command exists*/
                    if (!$.commandExists(args[3])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.command.error.not.found', args[3]));
                        return;
                    }

                    /* Checks if the alias has arguments. */
                    if (!args[3].match(/;/) && args.length !== 5) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.success', subActionArgs, args[3]));
                        add(subActionArgs, args[3], null, true);
                    } else if (!args[3].match(/;/) && args.length === 5) {
                        /* Checks if the sub command exists */
                        if (!$.subCommandExists(args[3], args[4])) {
                            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.error.not.found', (args[3] + ' ' + args[4])));
                            return;
                        }

                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.success', subActionArgs, (args[3] + ' ' + args[4])));
                        add(subActionArgs, args[3] + ' ' + args[4], null, true);
                    } else {
                        var aliasArgs = args.splice(3).join(' ').replace(/\!/g, ''),
                            aliasArguments = aliasArgs.split(';'),
                            aliases = [],
                            i;

                        /* Checks if all commands exist */
                        for (i in aliasArguments) {
                            if (!$.commandExists(aliasArguments[i])) {
                                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.error.not.found', aliasArguments[i]));
                                return;
                            }
                            aliases.push('!' + aliasArguments[i]);
                        }

                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.add.multiple.success', aliases.join(', '), subActionArgs));
                        add(subActionArgs, aliasArgs, null, true);
                    }
                }

                if (subAction.equalsIgnoreCase('remove')) {
                    if (subActionArgs === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.remove.usage'));
                        return;
                    }

                    subActionArgs = subActionArgs.replace('!', '').toLowerCase();

                    /* Checks if the alias exists*/
                    if (!customAliasExists(subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.remove.error.not.found', subActionArgs));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.alias.remove.success', subActionArgs));
                    remove(subActionArgs, true);
                }
                return;
            }

            /**
             * @commandpath command permission [command] [permission id] - Sets a permission on a command.
             */
            if (action.equalsIgnoreCase('permission')) {
                if (subAction === undefined || subActionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (!$.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.error.not.found', subAction));
                    return;
                }

                /* Checks if the command is alias */
                if (customAliasExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.error.alias'));
                    return;
                }

                /* Checks the arguments */
                if (args.length === 3) {
                    if (isNaN(parseInt(subActionArgs))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.usage'));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.set.success', subAction, $.getGroupNameById(subActionArgs)));
                    $.inidb.set('permcom', subAction, subActionArgs);
                    $.updateCommandGroup(subAction, subActionArgs);

                    var list = $.inidb.GetKeyList('aliases', ''),
                        i;
                    /* Sets the price for other aliases */
                    for (i in list) {
                        if (list[i].equalsIgnoreCase(subAction)) {
                            $.inidb.set('permcom', $.inidb.get('aliases', list[i]), subActionArgs);
                            $.updateCommandGroup($.inidb.get('aliases', list[i]), subActionArgs);
                        }
                    }
                } else {
                    subActionArgs = subActionArgs.toLowerCase();

                    if (isNaN(parseInt(args[3]))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.usage'));
                        return;
                    }

                    /* Checks if the sub command exists */
                    if (!$.subCommandExists(subAction, subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.set.error.not.found', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.permission.set.success', (subAction + ' ' + subActionArgs), $.getGroupNameById(args[3])));
                    $.inidb.set('permcom', subAction + ' ' + subActionArgs, args[3]);
                    $.updateSubCommandGroup(subAction, subActionArgs, args[3]);
                }
                return;
            }

            /**
             * @commandpath command cost [command] [amount] - Sets the cost on that command.
             */
            if (action.equalsIgnoreCase('cost')) {
                if (subAction === undefined || subActionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (!$.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.error.not.found', subAction));
                    return;
                }

                /* Checks the arguments */
                if (args.length === 3) {
                    /* Checks if the price can be parsed */
                    if (isNaN(parseInt(subActionArgs))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.usage'));
                        return
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.set.success', subAction, $.getPointsString(subActionArgs)));
                    $.inidb.set('pricecom', subAction, subActionArgs);
                    $.updateCommandCost(subAction, subActionArgs);
                } else {
                    subActionArgs = subActionArgs.toLowerCase();

                    /* Checks if the sub command exists */
                    if (!$.subCommandExists(subAction, subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.error.not.found', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    /* Checks if the price can be parsed */
                    if (isNaN(parseInt(args[3]))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.usage'));
                        return
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cost.set.success', (subAction + ' ' + subActionArgs), $.getPointsString(args[3])));
                    $.inidb.set('pricecom', subAction + ' ' + subActionArgs, args[3]);
                    $.updateSubCommandCost(subAction, subActionArgs, args[3]);
                }
                return;
            }

            /**
             * @commandpath command reward [command] [amount] - Sets the reward on that command.
             */
            if (action.equalsIgnoreCase('reward')) {
                if (subAction === undefined || subActionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (!$.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.error.not.found', subAction));
                    return;
                }

                /* Checks the arguments */
                if (args.length === 3) {
                    /* Checks if the reward can be parsed */
                    if (isNaN(parseInt(subActionArgs))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.usage'));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.set.success', subAction, $.getPointsString(subActionArgs)));
                    $.inidb.set('paycom', subAction, subActionArgs);
                } else {
                    subActionArgs = subActionArgs.toLowerCase();

                    /* Checks if the reward can be parsed */
                    if (isNaN(parseInt(args[3]))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.usage'));
                        return;
                    }

                    /* Checks if the sub command exists */
                    if (!$.subCommandExists(subAction, subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.error.not.found', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.reward.set.success', (subAction + ' ' + subActionArgs), $.getPointsString(args[3])));
                    $.inidb.set('paycom', subAction + ' ' + subActionArgs, args[3]);
                }
                return;
            }

            /**
             * @commandpath command cooldown [command] [seconds] - Sets a cooldown on that command. Use -1 to remove it and 0 to make it ignore the global cooldown.
             */
            if (action.equalsIgnoreCase('cooldown')) {
                if (subAction === undefined || subActionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (!$.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.error.not.found', subAction));
                    return;
                }

                /* Checks the arguments */
                if (args.length === 3) {
                    /* Checks if the seconds is a number */
                    if (isNaN(parseInt(subActionArgs))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.usage'));
                        return;
                    }

                    /* Checks if the user wants to remove the cooldown */
                    if (subActionArgs == -1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.remove.success', subAction));
                        $.inidb.del('cooldown', subAction);
                        $.updateCommandCooldown(subAction, subActionArgs, -1);
                        return;
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.set.success', subAction, subActionArgs));
                        $.inidb.set('cooldown', subAction, subActionArgs);
                        $.updateCommandCooldown(subAction, subActionArgs);
                        return;
                    }
                } else {
                    subActionArgs = subActionArgs.toLowerCase();

                    /* Checks if the sub command exists */
                    if (!$.subCommandExists(subAction, subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.error.not.found', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    /* Checks if the seconds is a number */
                    if (isNaN(parseInt(args[3]))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.usage'));
                        return;
                    }

                    if (args[3] == -1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.remove.success', (subAction + ' ' + subActionArgs)));
                        $.inidb.del('cooldown', subAction + ' ' + subActionArgs);
                        $.updateSubCommandCooldown(subAction + ' ' + subActionArgs, 0);
                        return;
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.cooldown.set.success', (subAction + ' ' + subActionArgs), args[3]));
                        $.inidb.set('cooldown', subAction + ' ' + subActionArgs, args[3]);
                        $.updateSubCommandCooldown(subAction, subActionArgs, args[3]);
                        return;
                    }
                }
                return;
            }

            /**
             * @commandpath command enable [command] - Enables that command if it is disabled.
             */
            if (action.equalsIgnoreCase('enable')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (!$.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.error.not.found', subAction));
                    return;
                }

                /* Checks the arguments */
                if (args.length === 2) {
                    /*Checks if the command is disabled */
                    if (!$.inidb.exists('disabledCommands', subAction)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.error.not.disabled', subAction));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.enabled', subAction));
                    $.inidb.del('disabledCommands', subAction);
                    if (!$.inidb.exists('command', subAction)) {
                        $.registerChatCommand('./commands/customCommands.js', subAction, 7);
                    } else {
                        commandCache[subAction] = $.inidb.get('command', subAction);
                        $.registerChatCommand('./commands/customCommands.js', subAction, 7);
                    }
                } else {
                    subActionArgs = subActionArgs.toLowerCase();

                    /* Checks if the sub command exists */
                    if (!$.subCommandExists(subAction, subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.error.not.found', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    /*Checks if the command is disabled */
                    if (!$.inidb.exists('disabledCommands', subAction + ' ' + subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.error.not.disabled', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.enable.enabled', (subAction + ' ' + subActionArgs)));
                    $.inidb.del('disabledCommands', subAction + ' ' + subActionArgs);
                    if (!$.commandExists(subAction)) {
                        $.registerChatCommand('./commands/customCommands.js', subAction, 7);
                    }
                    $.registerChatSubcommand(subAction, subActionArgs, 7);
                }
                return;
            }

            /**
             * @commandpath command disable [command] - Disables that command.
             */
            if (action.equalsIgnoreCase('disable')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.usage'));
                    return;
                }

                subAction = subAction.replace('!', '').toLowerCase();

                /* Checks if the command exists */
                if (!$.commandExists(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.error.not.found', subAction));
                    return;
                }

                /* Checks the arguments */
                if (args.length === 2) {
                    /* Checks if the command is disabled */
                    if ($.inidb.exists('disabledCommands', subAction)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.error.disabled', subAction));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.disabled', subAction));
                    $.inidb.set('disabledCommands', subAction, true);
                    if (!$.inidb.exists('command', subAction)) {
                        $.disableChatCommand(subAction, '');
                    } else {
                        delete commandCache[subAction];
                        $.disableChatCommand(subAction, '');
                    }
                } else {
                    subActionArgs = subActionArgs.toLowerCase();

                    /* Checks if the sub command exists */
                    if (!$.subCommandExists(subAction, subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.error.not.found', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    /* Checks if the command is disabled */
                    if ($.inidb.exists('disabledCommands', subAction + ' ' + subActionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.error.disabled', (subAction + ' ' + subActionArgs)));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.command.disable.disabled', (subAction + ' ' + subActionArgs)));
                    $.inidb.set('disabledCommands', subAction + ' ' + subActionArgs, true);
                    $.disableChatCommand(subAction, subActionArgs);
                }
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            $.registerChatCommand('./commands/customCommands.js', 'command', 2);
            $.registerChatCommand('./commands/customCommands.js', 'botcommands', 2);
            $.registerChatCommand('./commands/customCommands.js', 'commands', 7);

            $.registerChatSubcommand('command', 'add', 2);
            $.registerChatSubcommand('command', 'remove', 2);
            $.registerChatSubcommand('command', 'edit', 2);
            $.registerChatSubcommand('command', 'cooldown', 2);
            $.registerChatSubcommand('command', 'cost', 1);
            $.registerChatSubcommand('command', 'permission', 1);
            $.registerChatSubcommand('command', 'enable', 1);
            $.registerChatSubcommand('command', 'disable', 1);
            $.registerChatSubcommand('command', 'reward', 1);
            $.registerChatSubcommand('command', 'alias', 1);
        }
    });

    /* Exports functions to the global $ api. */
    $.permCom = permCom;
    $.priceCom = priceCom;
    $.registerCustomCommands = registerCustomCommands;
    $.registerCustomAliases = registerCustomAliases;
    $.getCommandPrice = getCommandPrice;
    $.returnCommandCost = returnCommandCost;
    $.getCustomAPI = getCustomAPI;
    $.tags = tags;
    $.command = {
        add: add,
        edit: edit,
        remove: remove,
        post: postCommand,
        isCached: isCustomCommandCached,
        loadCache: loadCustomCommandCache
    };
})();