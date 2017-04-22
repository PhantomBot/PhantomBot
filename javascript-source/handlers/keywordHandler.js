(function() {
    /* Package up the script manager for when the command tag is used in keywords. Not using the eventBus cause its really slow. */
    var ScriptEventManager = Packages.me.mast3rplan.phantombot.script.ScriptEventManager,
        CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            keys = $.inidb.GetKeyList('keywords', ''),
            keyword,
            key,
            origKey,
            i;

        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            for (i in keys) {
                try {
                    if (message.match(keys[i].toLowerCase())) {
                        key = keys[i].toLowerCase();
                        origKey = keys[i];
                        break;
                    }
                } catch (ex) {
                    if (message.includes(keys[i].toLowerCase())) {
                        key = keys[i].toLowerCase();
                        origKey = keys[i];
                        break;
                    }
                }
            }

            // Some users use special symbols that may break regex so this will fix that.
            try {
                if (!message.match('\\b' + key + '\\b') || message.includes('!keyword')) {
                    return;
                }
            } catch (ex) {
                if (ex.message.toLowerCase().includes('invalid quantifier') || ex.message.toLowerCase().includes('syntax')) {
                    if (!message.includes(keys[i]) || message.includes('!keyword')) {
                        return;
                    }
                } else {
                    $.log.error('Failed to send keyword "' + keys[i] + '": ' + ex.message);
                    return;
                }
            }

            keyword = $.inidb.get('keywords', origKey);

            if ($.coolDownKeywords.get(key, event.getSender()) > 0) {
                $.consoleDebug('[COOLDOWN] Keyword ' + key + ' was not sent because its on a cooldown.');
                return;
            }

            /** Is this keyword using a command tag? */
            if (keyword.match(/command:/g)) {
                var keyString = keyword.substring(8),
                    arguments = '';

                if (keyString.contains(' ')) {
                    keyword = keyString.substring(0, keyString.indexOf(' '));
                    arguments = keyString.substring(keyString.indexOf(' ') + 1);
                    keyString = keyword;
                }

                ScriptEventManager.instance().runDirect(new CommandEvent(event.getSender(), keyString, arguments));
                return;
            }

            if ($.inidb.exists('pricekey', key) && ((($.isMod(event.getSender()) && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(event.getSender())) || !$.isModv3(event.getSender(), event.getTags())))) {
                if ($.getUserPoints(event.getSender()) < $.inidb.get('pricekey', key)) {
                    return;
                }
                $.inidb.decr('points', event.getSender(), parseInt($.inidb.get('pricekey', key)));
            }

            $.say($.tags(event, keyword, false));
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /*
         * @commandpath keyword - Base command for keyword options
         */
        if (command.equalsIgnoreCase('keyword')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.usage'));
                return;
            }

            /*
             * @commandpath keyword add [keyword] [response] - Adds a keyword and a response
             */
            if (action.equalsIgnoreCase('add')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.add.usage'));
                    return;
                }

                var response = args.splice(2).join(' ');
                subAction = subAction.toLowerCase();

                $.setIniDbString('keywords', subAction, response);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.added', subAction));
            }

            /*
             * @commandpath keyword remove [keyword] - Removes a given keyword
             */
            if (action.equalsIgnoreCase('remove')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.remove.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                subAction = args[1].toLowerCase();
                
                $.inidb.del('keywords', subAction);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.removed', subAction));
            }

            /*
             * @commandpath keyword cooldown [keyword] [seconds] - Sets a cooldown on the keyword. Use -1 to remove it. If you use the command: tag and you have a cooldown on that command it will use that cooldown
             */
            if (action.equalsIgnoreCase('cooldown') || action.equalsIgnoreCase('cooldownkeyword')) {
                if (subAction === undefined || isNaN(parseInt(args[2]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                if (args[2] === -1) {
                    $.inidb.del('coolkey', subAction.toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.removed', subAction));
                    $.coolDownKeywords.clear(subAction.toLowerCase());
                    return;
                }

                $.inidb.set('coolkey', subAction.toLowerCase(), parseInt(args[2]));
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.set', subAction, args[2]));
                $.coolDownKeywords.clear(subAction.toLowerCase());
            }

            /*
             * @commandpath keyword price [keyword] [cost] - Sets a price on that keyword if points are enabled. Use -1 to remove it. If you use the command: tag it will use the pricecom that has been set on that command
             */
            if (action.equalsIgnoreCase('price')) {
                if (subAction === undefined || isNaN(parseInt(args[2]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.price.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                if (args[2] === -1) {
                    $.inidb.del('pricekey', subAction.toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.price.removed', subAction));
                    $.coolDownKeywords.clear(subAction.toLowerCase());
                    return;
                }

                $.inidb.set('pricekey', subAction.toLowerCase(), parseInt(args[2]));
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.price.set', subAction, $.getPointsString(args[2])));
                $.coolDownKeywords.clear(subAction.toLowerCase());
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            $.registerChatCommand('./handlers/keywordHandler.js', 'keyword', 1);
        }
    });
})();
