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
    function makeTwitchVODTime(twitchUptime) {
        var hours,
            minutes,
            seconds;

        /* Uptime contains hours, run regular expression match as such. */
        if (twitchUptime.indexOf('hours') !== -1) {
            match = twitchUptime.match(/(\d+) hours, (\d+) minutes and (\d+) seconds/);
            return '?t=' + match[1] + 'h' + match[2] + 'm' + match[3] + 's';

        /* Uptime contains minutes, but not hours, run regular expression match as such. */
        } else if (twitchUptime.indexOf('minutes') !== -1) {
            match = twitchUptime.match(/(\d+) minutes and (\d+) seconds/);
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
            args = event.getArgs(),
            argsString,
            action = args[0],
            uptime,
            twitchVODtime,
            vodJsonStr,
            vodJsonObj = {};

        /**
         * @commandpath setgame [game name] - Set Twitch game title
         */
        if (command.equalsIgnoreCase('setgame') || command.equalsIgnoreCase('editgame')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.game.set.usage', $.getGame($.channelName)));
                return;
            }
            argsString = args.splice(0).join(' ');
            $.updateGame($.channelName, argsString, sender);
            return;
        }

        /** Used for the panel */
        if (command.equalsIgnoreCase('setgamesilent')) {
            argsString = args.splice(0).join(' ');
            $.updateGame($.channelName, argsString, sender, true);
            return;
        } 

        /**
         * @commandpath settitle [stream title] - Set Twitch stream title
         */
        if (command.equalsIgnoreCase('settitle') || command.equalsIgnoreCase('edittitle')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.title.set.usage', $.getStatus($.channelName)));
                return;
            }
            argsString = args.splice(0).join(' ');
            $.updateStatus($.channelName, argsString, sender);
            return;
        }

        /** Used for the panel */
        if (command.equalsIgnoreCase('settitlesilent')) {
            argsString = args.splice(0).join(' ');
            $.updateStatus($.channelName, argsString, sender, true); // used for the panel.
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

        /**
         * @commandpath createdat [channel] - Returns when a channel was created in Twitch Timestamp format.
         *
         * The purpose of this command is for moderators to help identify potential trolls that created a new
         * account after being banned.
         */
        if (command.equalsIgnoreCase('createdat')) {
            if (args.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.createdat.404'));
                return;
            }
            var createdAt = $.twitch.getChannelCreatedDate(args[0]);
            if (createdAt.equals("ERROR")) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.createdat.error'));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.createdat', args[0], createdAt));
            }
            return;
        }
    });
    
    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/streamCommand.js')) {
            $.registerChatCommand('./commands/streamCommand.js', 'setgame', 1);
            $.registerChatCommand('./commands/streamCommand.js', 'settitle', 1);
            $.registerChatCommand('./commands/streamCommand.js', 'editgame', 1);
            $.registerChatCommand('./commands/streamCommand.js', 'edittitle', 1);
            $.registerChatCommand('./commands/streamCommand.js', 'vod', 7);
            $.registerChatCommand('./commands/streamCommand.js', 'createdat', 2);
        }
    });
})();
