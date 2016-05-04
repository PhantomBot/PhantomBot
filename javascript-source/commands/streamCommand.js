/**
 * streamCommand.js
 *
 * This module offers commands to view/alter channel information like current game, title and status
 */
(function() {
    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs();

        /**
         * @commandpath online - Tell if the stream is online or not
         */
        if (command.equalsIgnoreCase('online')) {
            if ($.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + 'Stream is online!');
            } else {
                $.say($.whisperPrefix(sender) + 'Stream is offline.');
            }
        }

        /**
         * @commandpath viewers - Announce the current amount of viewers in the chat
         */
        if (command.equalsIgnoreCase('viewers')) {
            $.say($.whisperPrefix(sender) + 'Currently ' + $.getViewers($.channelName) + ' viewers are watching ' + $.username.resolve($.channelName) + '!');
        }

        /**
         * @commandpath game [game title] - Announce Twitch game title, and play time or set the game title.
         */
        if (command.equalsIgnoreCase('game')) {
            if (args.length == 0) {
                if (!$.isOnline($.channelName)) {
                    $.say('Current Game: ' + $.getGame($.channelName));
                } else {
                    $.say('Current Game: ' + $.getGame($.channelName) + ', Playtime: ' + $.getPlayTime());
                }
            } else {
                if (!$.isAdmin(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }

                $.updateGame($.channelName, argsString, sender);
            }
        }

        /**
         * @commandpath title [stream title] - Announce Twitch stream title or set the stream title
         */
        if (command.equalsIgnoreCase('title')) {
            if (args.length == 0) {
                $.say('Current Status: ' + $.getStatus($.channelName));
            } else {
                if (!$.isAdmin(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }

                $.updateStatus($.channelName, argsString, sender);
            }
        }

        /**
         * @commandpath playtime - Tell's you how long the streamer has been playing that game for, in the current stream
         */
        if (command.equalsIgnoreCase('playtime')) {
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.channelName + ' is currently offline.');
                return;
            }
            $.say('@' + $.username.resolve(sender) + ', ' + $.username.resolve($.channelName) + ' has been playing ' + $.getPlayTimeGame() + ' for ' + $.getPlayTime() + '!');
        }
    });


    /** NEED TO LANG THIS SCRIPT **/
    
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/streamCommand.js')) {
            $.registerChatCommand('./commands/streamCommand.js', 'online');
            $.registerChatCommand('./commands/streamCommand.js', 'viewers');
            $.registerChatCommand('./commands/streamCommand.js', 'game');
            $.registerChatCommand('./commands/streamCommand.js', 'title');
            $.registerChatCommand('./commands/streamCommand.js', 'playtime');
        }
    });
})();
