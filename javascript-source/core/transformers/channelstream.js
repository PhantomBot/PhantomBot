/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

(function () {
    var match, temp;

    /*
     * @transformer channelname
     * @formula (channelname) the display name of the Twitch channel
     * @formula (channelname channel:str) the display name of the provided Twitch channel
     * @labels twitch discord noevent channel stream
     */
    function channelname(args) {
        if (!args.args) {
            temp = $.channelName;
        } else {
            temp = args.args.trim();
        }
        return {
            result: $.username.resolve(temp),
            cache: true
        };
    }

    /*
     * @transformer downtime
     * @formula (downtime) how long the channel has been offline
     * @labels twitch discord noevent channel stream
     * @cached
     */
    function downtime() {
        return {
            result: $.getStreamDownTime(),
            cache: true
        };
    }

    /*
     * @transformer followage
     * @formula (followage) sends a message denoting how long the sender of command is following this channel
     * @formula (followage user:str) sends a message denoting how long the provided user is following this channel
     * @formula (followage user:str channel:str) sends a message denoting how long the provided user is following the provided channel
     * @labels twitch commandevent channel stream
     * @example Caster: !addcom !followage (followage)
     * User: !followage
     * Bot: @User, user has been following channel PhantomBot since March 29, 2016. (340 days)
     * @cancels
     */
    function followage(args) {
        var channel,
                user;
        if ((match = args.args.match(/^(?: (\S*)(?: (.*))?)?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            channel = (match[2] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(args.event.getSender());
            }
            if (channel.length === 0) {
                channel = $.jsString($.channelName);
            }
            $.getFollowAge(args.event.getSender(), user, channel);
            return {
                cancel: true
            };
        }
    }

    /*
     * @transformer followdate
     * @formula (followdate) the date the sender of this command last followed this channel
     * @formula (followdate user:str) the date the provided user last followed this channel
     * @formula (followdate user:str channel:str) the date the provided user last followed the provided channel
     * @labels twitch commandevent channel stream
     * @cached
     */
    function followdate(args) {
        var channel,
                user;
        if ((match = args.args.match(/^(?: (\S*)(?: (.*))?)?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            channel = (match[2] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(args.event.getSender());
            }
            if (channel.length === 0) {
                channel = $.jsString($.channelName);
            }
            return {
                result: $.getFollowDate(args.event.getSender(), user, channel),
                cache: true
            };
        }
    }

    /*
     * @transformer follows
     * @formula (follows) number of follower of this channel
     * @formula (follows channel:str) number of follower of the specified channel
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !follows We currently have (follows) followers!
     * User: !follows
     * Bot: We currently have 1000 followers!
     * @cached
     */
    function follows(args) {
        if (!args.args) {
            temp = $.channelName;
        } else {
            temp = args.args.trim();
        }
        return {
            result: $.getFollows(temp),
            cache: true
        };
    }

    /*
     * @transformer game
     * @formula (game) currently played game
     * @formula (game channel:str) currently played game of the specified channel
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !game (pointtouser) current  game is: (game)
     * User: !game
     * Bot: User -> current game is: Programming
     * @cached
     */
    function game(args) {
        if (!args.args) {
            temp = $.channelName;
        } else {
            temp = args.args.trim();
        }
        return {
            result: $.getGame(temp),
            cache: true
        };
    }

    /*
     * @transformer gameinfo
     * @formula (gameinfo) similar to (game) but include game time if online
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !game (pointtouser) Current game: (gameinfo).
     * User: !game
     * Bot: User -> Current game: Programming Playtime: 3 hours, 20 minutes and 35 seconds.
     * @cached
     */
    function gameinfo() {
        var game,
                playtime;
        game = $.getGame($.channelName);
        if (!game.trim()) {
            return {
                result: $.lang.get('streamcommand.game.no.game'),
                cache: true
            };
        } else if (!$.isOnline($.channelName) || !(playtime = $.getPlayTime())) {
            return {
                result: $.lang.get('streamcommand.game.offline', game),
                cache: true
            };
        } else {
            return {
                result: $.lang.get('streamcommand.game.online', $.getGame($.channelName), playtime),
                cache: true
            };
        }
    }

    /*
     * @transformer gamesplayed
     * @formula (gamesplayed) list games played in current stream, and the approximate uptime when each game was started; if offline, cancels the command
     * @labels twitch discord commandevent channel stream
     * @example Caster: !addcom !gamesplayed Games played in this stream: (gamesplayed)
     * User: !gamesplayed
     * Bot: Games played in this stream: Creative - 00:00, Programming - 02:30
     * @cancels sometimes
     * @cached
     */
    function gamesplayed(args) {
        if (!$.isOnline($.channelName)) {
            if (args.platform !== 'discord') {
                $.say($.userPrefix(args.event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
            }
            return {cancel: true};
        }
        return {
            result: $.getGamesPlayed(),
            cache: true
        };
    }

    /*
     * @transformer hours
     * @formula (hours) number of hours sender has spent in chat
     * @formula (hours user:str) number of hours the provided user has spent in chat
     * @labels twitch commandevent channel stream
     * @cached
     */
    function hours(args) {
        var user;
        if ((match = args.args.match(/^(?: (.*))?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(args.event.getSender());
            }
            return {
                result: $.getUserTime(user) / 3600,
                cache: true
            };
        }
    }

    /*
     * @transformer hoursround
     * @formula (hoursround) number of hours sender has spent in chat, with the value rounded to the nearest tenth of an hour
     * @formula (hoursround user:str) number of hours the provided user has spent in chat, with the value rounded to the nearest tenth of an hour
     * @labels twitch commandevent channel stream
     * @cached
     */
    function hoursround(args) {
        var user;
        if ((match = args.args.match(/^(?: (.*))?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(args.event.getSender());
            }
            return {
                result: Math.round($.getUserTime(user) / 360) / 10,
                cache: true
            };
        }
    }

    /*
     * @transformer lasttip
     * @formula (lasttip) last tip message
     * @labels twitch discord noevent channel stream
     * @cached
     */
    function lasttip() {
        if ($.inidb.exists('donations', 'last_donation_message')) {
            return {
                result: $.inidb.get('donations', 'last_donation_message'),
                cache: true
            };
        } else {
            return {
                result: $.lang.get('customcommands.lasttip.404'),
                cache: true
            };
        }
    }

    /*
     * @transformer playtime
     * @formula (playtime) how long this channel has streamed current game; if offline, sends an error to chat and cancels the command
     * @labels twitch discord commandevent channel stream
     * @example Caster: !addcom !playtime Current playtime: (playtime).
     * User: !playtime
     * Bot: Current playtime: 30 minutes.
     * @cancels sometimes
     * @cached
     */
    function playtime(args) {
        if (!$.isOnline($.channelName)) {
            if (args.platform !== 'discord') {
                $.say($.userPrefix(args.event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
            }
            return {cancel: true};
        }
        return {
            result: $.getPlayTime() || '',
            cache: true
        };
    }

    /*
     * @transformer status
     * @formula (status) the current stream title
     * @formula (status channel:str) the current stream title of the specified channel
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !status (pointtouser) current status is: (status)
     * User: !status
     * Bot: User -> current status is: Fun programming!
     * @cached
     */
    function status(args) {
        if (!args.args) {
            temp = $.channelName;
        } else {
            temp = args.args.trim();
        }
        return {
            result: $.getStatus(temp),
            cache: true
        };
    }

    /*
     * @transformer subscribers
     * @formula (subscribers) number of subscribers of this channel
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !subs (subscribers) subscribers!
     * User: !subs
     * Bot: 10 subscribers!
     * @notes only works if the apioauth in botlogin.txt belongs to the broadcaster
     * @cached
     */
    function subscribers() {
        return {
            result: $.getSubscriberCount(),
            cache: true
        };
    }

    /*
     * @transformer titleinfo
     * @formula (titleinfo) title + uptime if online
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !title (pointtouser) Current title: (titleinfo).
     * User: !title
     * Bot: User -> Current title: Fun programming! Uptime: 3 hours, 20 minutes and 35 seconds.
     * @cached
     */
    function titleinfo() {
        var status = $.getStatus($.channelName);
        if (!status.trim()) {
            return {
                result: $.lang.get('streamcommand.title.no.title'),
                cache: true
            };
        } else if (!$.isOnline($.channelName)) {
            return {
                result: $.lang.get('streamcommand.title.offline', status),
                cache: true
            };
        } else {
            return {
                result: $.lang.get('streamcommand.title.online', status, $.jsString($.getStreamUptime($.channelName))),
                cache: true
            };
        }
    }

    /*
     * @transformer uptime
     * @formula (uptime) how long the channel has been streaming this session; if offline, an error is sent to chat and the command is canceled
     * @formula (uptime channel:str) how long the specified channel has been streaming this session; if offline, an error is sent to chat and the command is canceled
     * @labels twitch discord commandevent channel stream
     * @example Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime).
     * User: !uptime
     * Bot: @User, PhantomBot has been live for 2 hours, 3 minutes and 30 seconds.
     * @cancels sometimes
     * @cached
     */
    function uptime(args) {
        if (!args.args) {
            temp = $.channelName;
        } else {
            temp = args.args.trim();
        }
        if (!$.isOnline(temp)) {
            if (args.platform !== 'discord') {
                $.say($.userPrefix(args.event.getSender(), true) + $.lang.get('timesystem.uptime.offline', temp));
            }
            return {cancel: true};
        }
        return {
            result: $.getStreamUptime(temp),
            cache: true
        };
    }

    /*
     * @transformer viewers
     * @formula (viewers) number of current viewers
     * @formula (viewers channel:str) number of current viewers for the specified channel
     * @labels twitch discord noevent channel stream
     * @example Caster: !addcom !viewers We currently have (viewers) viewers watching us!
     * User: !viewers
     * Bot: We currently have 600 viewers watching us!
     * @cached
     */
    function viewers(args) {
        if (!args.args) {
            temp = $.channelName;
        } else {
            temp = args.args.trim();
        }
        return {
            result: $.getViewers(temp),
            cache: true
        };
    }

    /*
     * @deprecated
     */
    function views() {
        return {
            result: $.twitchcache.getViews(),
            cache: true
        };
    }

    var transformers = [
        new $.transformers.transformer('channelname', ['twitch', 'discord', 'noevent', 'channel', 'stream'], channelname),
        new $.transformers.transformer('downtime', ['twitch', 'discord', 'noevent', 'channel', 'stream'], downtime),
        new $.transformers.transformer('followage', ['twitch', 'commandevent', 'channel', 'stream'], followage),
        new $.transformers.transformer('followdate', ['twitch', 'commandevent', 'channel', 'stream'], followdate),
        new $.transformers.transformer('follows', ['twitch', 'discord', 'noevent', 'channel', 'stream'], follows),
        new $.transformers.transformer('game', ['twitch', 'discord', 'noevent', 'channel', 'stream'], game),
        new $.transformers.transformer('gameinfo', ['twitch', 'discord', 'noevent', 'channel', 'stream'], gameinfo),
        new $.transformers.transformer('gamesplayed', ['twitch', 'discord', 'noevent', 'channel', 'stream'], gamesplayed),
        new $.transformers.transformer('hours', ['twitch', 'commandevent', 'channel', 'stream'], hours),
        new $.transformers.transformer('hoursround', ['twitch', 'commandevent', 'channel', 'stream'], hoursround),
        new $.transformers.transformer('lasttip', ['twitch', 'discord', 'noevent', 'channel', 'stream'], lasttip),
        new $.transformers.transformer('playtime', ['twitch', 'discord', 'commandevent', 'channel', 'stream'], playtime),
        new $.transformers.transformer('status', ['twitch', 'discord', 'noevent', 'channel', 'stream'], status),
        new $.transformers.transformer('subscribers', ['twitch', 'discord', 'noevent', 'channel', 'stream'], subscribers),
        new $.transformers.transformer('titleinfo', ['twitch', 'discord', 'noevent', 'channel', 'stream'], titleinfo),
        new $.transformers.transformer('uptime', ['twitch', 'discord', 'commandevent', 'channel', 'stream'], uptime),
        new $.transformers.transformer('viewers', ['twitch', 'discord', 'commandevent', 'channel', 'noevent', 'stream'], viewers),
        new $.transformers.transformer('views', ['twitch', 'commandevent', 'channel', 'noevent', 'stream'], views)
    ];

    $.transformers.addTransformers(transformers);
})();
