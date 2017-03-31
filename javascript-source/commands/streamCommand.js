/**
 * streamCommand.js
 *
 * This module offers commands to view/alter channel information like current game, title and status
 */
(function() {

    /*
     * @function makeTwitchVODTime
     *
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

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            vodJsonObj = {},
            twitchVODtime,
            vodJsonStr,
            uptime;
           
        /*
         * @commandpath game - Give's you the current game and the playtime if the channel is online. 
         * @commandpath title - Give's you the current title and the channel uptime if the channel is online.
         * @commandpath followage- Tells you how long you have been following the channel.
         * @commandpath playtime - Tells you how long the caster has been playing the current game for.
         * @commandpath uptime - Give's you the current stream uptime.
         * @commandpath age - Tells you how long you have been on Twitch for.
         * @commandpath setgame [game name] - Set Twitch game title.
         */
        if (command.equalsIgnoreCase('setgame')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.game.set.usage', $.getGame($.channelName)));
                return;
            }
            $.updateGame($.channelName, args.join(' '), sender);
            return;
        }

        /*
         * @commandpath settitle [stream title] - Set Twitch stream title.
         */
        if (command.equalsIgnoreCase('settitle')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.title.set.usage', $.getStatus($.channelName)));
                return;
            }
            $.updateStatus($.channelName, args.join(' '), sender);
            return;
        }

        /*
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
    
    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/streamCommand.js', 'setgame', 1);
        $.registerChatCommand('./commands/streamCommand.js', 'settitle', 1);
        $.registerChatCommand('./commands/streamCommand.js', 'vod', 7);
    });
})();
