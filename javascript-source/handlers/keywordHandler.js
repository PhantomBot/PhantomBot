(function() {

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            sender = event.getSender(),
            username = $.username.resolve(sender),
            keywordCheck,
            keyword,
            key,
            i,
            keys = $.inidb.GetKeyList('keywords', '');

        for (i in keys) {
            if (message.contains(keys[i])) {
                key = keys[i];
                continue;
            }
        }

        keywordCheck = new RegExp('\\b' + key + '\\b', 'i');

        if (keywordCheck.test(message)) {
            keyword = $.inidb.get('keywords', key);
        } else {
            return;
        }

        keyword = keyword.replace('(sender)', username)
               .replace('(@sender)', '@' + username)
               .replace('(baresender)', sender)
               .replace('(pointsname)', $.pointNameMultiple)
               .replace('(uptime)', $.getStreamUptime($.channelName))
               .replace('(game)', $.getGame($.channelName))
               .replace('(status)', $.getStatus($.channelName));

        if (!$.isAdmin(sender) && $.coolDown.get(key, sender) > 0) {
            $.consoleDebug('keyword ' + key + ' not sent because its on a cooldown.');
            return;
        }

        $.say(keyword);
    });

    /**
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
         * @commandpath keyword - Base command for keyword options
         */
        if (command.equalsIgnoreCase('keyword')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.usage'));
                return;
            }

            /**
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
                $.logEvent('keywordHandler.js', 100, sender + ' added keyword "' + subAction + '" with the message "' + response + '"');
                return;
            }

            /**
             * @commandpath keyword remove [keyword] - Removes a given keyword
             */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.remove.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                subAction = args[1].toLowerCase();
                
                $.inidb.del('keywords', subAction);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.removed', subAction));
                $.logEvent('keywordHandler.js', 100, sender + ' removed the keyword "' + subAction + '"');
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            $.registerChatCommand('./handlers/keywordHandler.js', 'keyword', 1);
        }
    });
})();
