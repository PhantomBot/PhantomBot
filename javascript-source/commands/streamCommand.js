/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * streamCommand.js
 *
 * This module offers commands to view/alter channel information like current game, title and status
 */
(function() {

    /*
     * @function makeTwitchVODTime
     *
     * @param  twitchUptime - Number of seconds stream has been up.
     * @return twitchVODTime
     */
    function makeTwitchVODTime(twitchUptime) {
        return '?t=' + twitchUptime + 's';
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
         * @commandpath setgame [game name] - Set your Twitch game title.
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
         * @commandpath settitle [stream title] - Set your Twitch stream title.
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

    /*
     * Export Methods
     */
    $.makeTwitchVODTime = makeTwitchVODTime;
})();
