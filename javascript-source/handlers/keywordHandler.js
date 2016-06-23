(function() {
    var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus;
    var CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            keys = $.inidb.GetKeyList('keywords', ''),
            keyword,
            key,
            i;
            
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            for (i in keys) {
                if (message.match(keys[i])) {
                    key = keys[i];
                    break;
                }
            }

            if (message.match('\\b' + key + '\\b') && !message.match(/!keyword/)) {
                keyword = $.inidb.get('keywords', key);

                if ($.coolDown.get(key, event.getSender()) > 0) {
                    $.consoleDebug('[COOLDOWN] Keyword ' + key + ' was not sent because its on a cooldown.');
                    return;
                }

                if (keyword.match(/command:/g)) {
                    EventBus.instance().post(new CommandEvent($.botName, keyword.substring(8), ' '));
                    return;
                }

                if (keyword.match(/\(sender\)/g)) {
                    keyword = $.replace(keyword, '(sender)', $.username.resolve(event.getSender()));
                }
        
                if (keyword.match(/\(@sender\)/g)) {
                    keyword = $.replace(keyword, '(@sender)', '@' + $.username.resolve(event.getSender()));
                }
        
                if (keyword.match(/\(baresender\)/g)) {
                    keyword = $.replace(keyword, '(baresender)', event.getSender());
                }
        
                if (keyword.match(/\(game\)/g)) {
                    keyword = $.replace(keyword, '(game)', $.getGame($.channelName));
                }
        
                if (keyword.match(/\(status\)/g)) {
                    keyword = $.replace(keyword, '(status)', $.getStatus($.channelName));
                }
        
                if (keyword.match(/\(count\)/g)) {
                    $.inidb.incr('keywordCount', keyword, 1);
                    keyword = $.replace(keyword, '(count)', $.inidb.get('keywordCount', keyword));
                }
        
                if (keyword.match(/\(random\)/g)) {
                    keyword = $.replace(keyword, '(random)', $.username.resolve($.randElement($.users)[0]));
                }
        
                if (keyword.match(/\(pointname\)/g)) {
                    keyword = $.replace(keyword, '(pointname)', $.pointNameMultiple);
                }
        
                if (keyword.match(/\(#\)/g)) {
                    keyword = $.replace(keyword, '(#)', String($.randRange(1, 100)));
                }
        
                if (keyword.match(/\(uptime\)/g)) {
                    keyword = $.replace(keyword, '(uptime)', String($.getStreamUptime($.channelName)));
                }
        
                if (keyword.match(/\(viewers\)/g)) {
                    keyword = $.replace(keyword, '(viewers)', String($.getViewers($.channelName)));
                }
        
                if (keyword.match(/\(follows\)/g)) {
                    keyword = $.replace(keyword, '(follows)', String($.getFollows($.channelName)));
                }

                $.say(keyword);
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
                $.log.event(sender + ' added keyword "' + subAction + '" with the message "' + response + '"');
                return;
            }

            /**
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
