(function() {
    /** Package up the script manager for when the command tag is used in keywords. Not using the eventBus cause its really slow. */
    var ScriptEventManager = Packages.me.mast3rplan.phantombot.script.ScriptEventManager,
        CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;

    /**
     * Gets the irc-message event from the event bus in the core.
     *
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            keys = $.inidb.GetKeyList('keywords', ''),
            keyword,
            key,
            origKey,
            i;
        
        /** is this modules enabled? */
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            /** Make a loop for all keus to try to match one in the message */
            for (i in keys) {
                /** match a keyword */
                if (message.match(keys[i].toLowerCase())) {
                    /** save that mached key */
                    key = keys[i].toLowerCase();
                    origKey = keys[i];
                    break; //stop this big loop.
                }
            }

            /** Make sure the keyword is in spaces and not in a word */
            if (message.match('\\b' + key + '\\b') && !message.match(/!keyword/)) {
                /** get that keyword in the DB */
                keyword = $.inidb.get('keywords', origKey);

                /** is the keyword on cooldown? */
                if ($.coolDownKeywords.get(key, event.getSender()) > 0) {
                    $.consoleDebug('[COOLDOWN] Keyword ' + key + ' was not sent because its on a cooldown.');
                    return;
                }

                /** Is this keyword using a command tag? */
                if (keyword.match(/command:/g)) {
                    var keyString = keyword.substring(8),
                        arguments = '';

                    /** Does this command have arguments */
                    if (keyString.contains(' ')) {
                        keyword = keyString.substring(0, keyString.indexOf(' '));
                        arguments = keyString.substring(keyString.indexOf(' ') + 1);
                        keyString = keyword;
                    }
                    /** Post that command. */
                    ScriptEventManager.instance().runDirect(new CommandEvent(event.getSender(), keyString, arguments));
                    return;
                }

                /** Is there a cost for this key? */
                if ($.inidb.exists('pricekey', key) && ((($.isMod(sender) && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(sender)) || !$.isMod(sender)))) {
                    if ($.getUserPoints(event.getSender()) < $.inidb.get('pricekey', key)) {
                        return;
                    }
                    $.inidb.decr('points', event.getSender(), parseInt($.inidb.get('pricekey', key)));
                }

                /** Say the keyword and check for tags */
                $.say($.tags(event, keyword, false));
            }
        }
    });

    /**
     * gets the command event from the core.
     *
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * Gets the usage for the keyword command.
         *
         * @commandpath keyword - Base command for keyword options
         */
        if (command.equalsIgnoreCase('keyword')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.usage'));
                return;
            }

            /**
             * Add a keyword with a responce.
             *
             * @commandpath keyword add [keyword] [response] - Adds a keyword and a response
             */
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.add.usage'));
                    return;
                }

                var response = args.splice(2).join(' ');
                subAction = args[1].toLowerCase();

                $.inidb.set('keywords', subAction, response);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.added', subAction));
                $.log.event(sender + ' added keyword "' + subAction + '" with the message "' + response + '"');
                return;
            }

            /**
             * Remove a key word if it exist.
             *
             * @commandpath keyword remove [keyword] - Removes a given keyword
             */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.remove.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                subAction = args[1].toLowerCase();
                
                $.inidb.del('keywords', subAction);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.removed', subAction));
                $.log.event(sender + ' removed the keyword "' + subAction + '"');
            }

            /**
             * Set a cooldown on a keyword
             *
             * @commandpath keyword cooldown [keyword] [seconds] - Sets a cooldown on the keyword. Use -1 to remove it. If you use the command: tag and you have a cooldown on that command it will use that cooldown
             */
            if (action.equalsIgnoreCase('cooldown') || action.equalsIgnoreCase('cooldownkeyword')) {
                if (!subAction || !parseInt(args[2])) {
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
                $.log.event(sender + ' added a cooldown to the keyword "' + subAction + '"');
            }

            /**
             * Set a price on a keyword
             *
             * @commandpath keyword price [keyword] [cost] - Sets a price on that keyword if points are enabled. Use -1 to remove it. If you use the command: tag it will use the pricecom that has been set on that command
             */
            if (action.equalsIgnoreCase('price')) {
                if (!subAction || !parseInt(args[2])) {
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
                $.log.event(sender + ' added a price to the keyword "' + subAction + '"');
            }
        }
    });

    /**
     * Load up the command once the bot is fully booted.
     *
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            $.registerChatCommand('./handlers/keywordHandler.js', 'keyword', 1);
        }
    });
})();
