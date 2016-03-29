(function() {

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            sender = event.getSender(),
            username = $.username.resolve(sender),
            keywordCheck,
            keys = $.inidb.GetKeyList('keywords', '');

        for (var i in keys) {
            keywordCheck = new RegExp('\\b' + keys[i] + '\\b', 'i');
            if (keywordCheck.exec(message)) {
                keyword = $.inidb.get('keywords', keys[i]);
                keyword = keyword.replace('(sender)', username)
                       .replace('(@sender)', '@' + username)
                       .replace('(baresender)', sender)
                       .replace('(pointsname)', $.pointNameMultiple)
                       .replace('(uptime)', $.getStreamUptime($.channelName))
                       .replace('(game)', $.getGame($.channelName))
                       .replace('(status)', $.getStatus($.channelName));

                if ($.coolDown.get(keys[i], sender) > 0 && !$.isAdmin(sender)) {
                    $.consoleDebug('keyword ' + keys[i] + ' not sent because its on a cooldown.');
                    return;
                }
                $.say(keyword);
                return;
            }
        }
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
            subAction = args[1].toLowerCase();

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
