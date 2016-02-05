(function () {
    
/**
* @event ircChannelMessage
*/
$.bind('ircChannelMessage', function (event) { 
    var message = event.getMessage(),
        sender = event.getSender(),
        regex = '',
        keyword = '',
        keys = $.inidb.GetKeyList('keywords', '');
        for (var i = 0; i < keys.length; i++) {
            regex = new RegExp('\\b' + keys[i].toLowerCase() + '\\b', 'i');
            if (regex.exec(message)) {
                keyword = $.inidb.get('keywords', message);
				keyword = keyword.replace('(sender)', sender);
                $.say(String(keyword));
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
            subAction = args[1];

        /**
        * @commandpath keyword [option] - Tells you keyword usage
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
            * @commandpath keyword add [keyword] [response] - Adds a keyword
            */  
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.add.usage'));
                    return;
                }

                var keyword = subAction,
                    response = argString.substring(argString.indexOf(keyword) + keyword.length() + 1);

                $.inidb.set('keywords', keyword, response);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.added', keyword));
                return;
            }

            /**
            * @commandpath keyword remove [keyword] - Removes that keyword
            */ 
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.remove.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', keyword)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }
                $.inidb.del('keywords', keyword);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.removed', keyword));
            }
        }
    });
    
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./handlers/keywordHandler.js')) {
            $.registerChatCommand('./handlers/keywordHandler.js', 'keyword', 1);
        }
    });
})();
