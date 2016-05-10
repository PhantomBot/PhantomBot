/**
 * streamCommand.js
 *
 * This module offers commands to view/alter channel information like current game, title and status
 */
(function() {

    /**
     * @function makeTwitchVODTime()
     * @param  twitchUptime
     * @return twitchVODTime
     */
    function makeTwitchVODTime(twitchUptime)
    {
        var twitchVODTime,
            match = [];

        /* Uptime contains hours, run regular expression match as such. */
        if (twitchUptime.indexOf('hours') !== -1) {
            match = twitchUptime.match(/(\d+) hours, (\d+) minutes, (\d+) seconds/);
            return '?t=' + match[1] + 'h' + match[2] + 'm' + match[3] + 's';
        
        /* Uptime contains minutes, but not hours, run regular expression match as such. */
        } else if (twitchUptime.indexOf('minutes') !== -1) {
            match = twitchUptime.match(/(\d+) minutes, (\d+) seconds/);
            return '?t=' + match[1] + 'm' + match[2] + 's';

        /* Uptime only contains seconds, run regular expression match as such. */
        } else {
            match = twitchUptime.match(/(\d+) seconds/);
            return '?t=' + match[1] + 's';
        }
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs(),
            uptime,
            twitchVODtime,
            vodJsonStr,
            vodJsonObj = {};

        /**
         * @commandpath online - Tell if the stream is online or not
         */
        if (command.equalsIgnoreCase('online')) {
            if ($.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.online.online'));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.online.offline'));
            }
            return;
        }

        /**
         * @commandpath viewers - Announce the current amount of viewers in the chat
         */
        if (command.equalsIgnoreCase('viewers')) {
            $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.viewers', $.getViewers($.channelName)));
            return;
        }

        /**
         * @commandpath game [game title] - Announce Twitch game title, and play time or set the game title.
         */
        if (command.equalsIgnoreCase('game')) {
            if (args.length == 0) {
                if (!$.isOnline($.channelName)) {
                    $.say($.lang.get('streamcommand.game.offline', $.getGame($.channelName)));
                } else {
                    $.say($.lang.get('streamcommand.game.online', $.getGame($.channelName), $.getPlayTime()));
                }
                return;
            } else {
                if (!$.isAdmin(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }
                $.updateGame($.channelName, argsString, sender);
                return;
            }
        }

        /**
         * @commandpath title [stream title] - Announce Twitch stream title or set the stream title
         */
        if (command.equalsIgnoreCase('title')) {
            if (args.length == 0) {
                $.say($.lang.get('streamcommand.title', $.getStatus($.channelName)));
                return;
            } else {
                if (!$.isAdmin(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }
                $.updateStatus($.channelName, argsString, sender);
                return;
            }
        }

        /**
         * @commandpath playtime - Tell's you how long the streamer has been playing that game for, in the current stream
         */
        if (command.equalsIgnoreCase('playtime')) {
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.playtime.offline', $.channelName));
                return;
            }
            $.say($.lang.get('streamcommand.playtime.online', $.username.resolve($.channelName), $.getPlayTimeGame() + $.getPlayTime()));
            return;
        }

        /**
         * @commandpath vod - Displays stream uptime and current VOD or, if offline, the last VOD available.
         */
        if (command.equalsIgnoreCase('vod')) {
            if ($.isOnline($.channelName)) {
                vodJsonStr = $.twitch.GetChannelVODs($.channelName, 'current') + '';
                if (vodJsonStr.length === 0 || vodJsonStr === null) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.vod.404'));
                    return;
                }
                uptime = $.getStreamUptime($.channelName);
                twitchVODtime = makeTwitchVODTime(uptime);
                vodJsonObj = JSON.parse(vodJsonStr);
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.vod.online', uptime, vodJsonObj.videos[0].url + twitchVODtime));
                return;
            } else {
                vodJsonStr = $.twitch.GetChannelVODs($.channelName, 'archives') + '';
                if (vodJsonStr.length === 0 || vodJsonStr === null) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.vod.404'));
                    return;
                }
                vodJsonObj = JSON.parse(vodJsonStr);
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.vod.offline', vodJsonObj.videos[0].url, $.getTimeString(vodJsonObj.videos[0].length)));
                return;
            } 
        }
    });


    /** NEED TO LANG THIS SCRIPT **/
    
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/streamCommand.js')) {
            $.registerChatCommand('./commands/streamCommand.js', 'online', 7);
            $.registerChatCommand('./commands/streamCommand.js', 'viewers', 7);
            $.registerChatCommand('./commands/streamCommand.js', 'game', 7);
            $.registerChatCommand('./commands/streamCommand.js', 'title', 7);
            $.registerChatCommand('./commands/streamCommand.js', 'playtime', 7);
            $.registerChatCommand('./commands/streamCommand.js', 'vod', 7);
        }
    });
})();
