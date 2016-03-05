(function () {
    
/**
* @event ircChannelMessage
*/
$.bind('ircChannelMessage', function (event) { 
    var message = event.getMessage().toLowerCase(),
        sender = event.getSender(),
        regex = '',
        keyword = '',
        key = '',
        keys = $.inidb.GetKeyList('keywords', '');
        for (var i = 0; i < keys.length; i++) {
            key = keys[i].toLowerCase();
            regex = new RegExp('\\b' + key + '\\b', 'i');
            if (regex.exec(message)) {
                keyword = $.inidb.get('keywords', key);
                keyword = keyword.replace('(sender)', $.username.resolve(event.getSender()));
                keyword = keyword.replace('(@sender)', '@' + $.username.resolve(event.getSender()));
                keyword = keyword.replace('(baresender)', event.getSender());
                keyword = keyword.replace('(pointsname)', $.pointNameMultiple);
                keyword = keyword.replace('(uptime)', $.getStreamUptime($.channelName));
                keyword = keyword.replace('(game)', $.getGame($.channelName));
                keyword = keyword.replace('(status)', $.getStatus($.channelName));

                if ($.coolDown.get(key, sender) > 0) {
                    $.consoleDebug('keyword ' + key + ' not sent because its on a cooldown.');
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
    $.bind('command', function (event) {
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
            }
        }
    });

    /**
    * @event initReady
    */
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            $.registerChatCommand('./handlers/keywordHandler.js', 'keyword', 1);
        }
    });
})();
