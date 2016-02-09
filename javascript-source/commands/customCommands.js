(function () {

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
        var i;
            message = message + '',
            args = event.getArgs();

        if (message.indexOf('(touser)') != -1) {
             if (args.length < 1) { 
			 touser = $.username.resolve(event.getSender());
			 }
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

        if (tagList) {
            for (i in tagList) {
                var regex = new RegExp('/' + tagList[i].replace(/([\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|])/g, '\\$&') + '/', 'ig');
                message = message.replace(regex, tagReplacements[i]);
            }
        }

    return message
        .replace('(sender)', $.username.resolve(event.getSender()))
	.replace('(touser)', $.username.resolve(touser))
        .replace('(@sender)', '@' + $.username.resolve(event.getSender()))
        .replace('(baresender)', event.getSender())
        .replace('(random)', $.username.resolve($.randElement($.users)[0]))
        .replace('(pointname)', $.pointNameMultiple)
        .replace('(uptime)', $.getStreamUptime($.channelName))
        .replace('(game)', $.getGame($.channelName))
        .replace('(status)', $.getStatus($.channelName))
        .replace('(follows)', $.getFollows($.channelName))
        .replace('(count)', $.inidb.get('commandCount', command))
	.replace('(price)', price)
        ;
    };

  /**
   * @function permCom
   * @export $
   * @param {string} user
   * @param {string} command
   * @returns {boolean}
   */
    function permCom(user, command) {
        if ($.isAdmin(user)) {
            return true;
        }
        return ($.getCommandGroup(command) >= $.getUserGroupId(user));
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
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
            username = $.username.resolve(sender, event.getTags()),
            command = event.getCommand(),
            args = event.getArgs(),
            argString = event.getArguments(),
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath addcom [command] [command text] - Add a custom command
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
         * @commandpath editcom [command] [message] - Edits that command
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
         * @commandpath aliascom [alias] [command] - Create an alias to any command
         */
        if (command.equalsIgnoreCase('aliascom')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action || !subAction) {
              $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
              return;
            } else if (!$.commandExists(action)) {
              $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404'));
              return
            }

            action = args[0].replace('!', '');
            subAction = args[1].replace('!', '');

            if ($.inidb.exists('aliases', subAction)) {
              $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error'));
              return;
            }

            $.inidb.set('aliases', subAction, action);
            $.registerChatCommand('./commands/customCommands.js', subAction);
            $.logEvent('customCommands.js', 59, sender + ' added alias "!' + subAction + '" for "!' + action + '"');
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', action, subAction));
        }

        /**
         * @commandpath delalias [alias] - Delete an alias
         */
        if (command.equalsIgnoreCase('delalias')) {
           if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
                return;
            } else if (!$.inidb.exists('alias', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404'));
                return;
            }

            action = args[0].replace('!', '');

            $.unregisterChatCommand(action);
            $.inidb.del('aliases', action);
            $.logEvent('customCommands.js', 56, sender + ' deleted alias !' + action);
            $.say($.whisperPrefix(sender) + $.lang.get("customcommands.delete.success", action));
        }

        /**
         * @commandpath permcom [command] [groupId] - Set the permissions for a command
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
            var group = args[1];

            if (isNaN(parseInt(group))) {
              group = $.getGroupIdByName(group);
            }

            $.inidb.set('permcom', action, group);
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action, $.getGroupNameById(group)));
            $.updateCommandGroup(action, group);
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

        if (command.equalsIgnoreCase('listtags')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }
            $.say($.whisperPrefix(sender) + 'Command tags: (sender), (@sender), (baresender), (random), (uptime), (game), (status), (follows), (count), (touser), (price), (pointname)');
        }

        /**
         * @commandpath commands - Give's you a list of all your commands
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
    $.bind('initReady', function () {
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
