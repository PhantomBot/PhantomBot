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

(function () {
    var match, temp;

    /*
     * @transformer channelname
     * @formula (channelname) the display name of the Twitch channel
     * @formula (channelname channel:str) the display name of the provided Twitch channel
     * @labels twitch command channel stream
     */
    function channelname(args) {
        if (!args) {
            temp = $.channelName;
        } else {
            temp = args.trim();
        }
        return {
            result: $.jsString($.username.resolve(temp)),
            cache: true
        };
    }

    /*
     * @transformer downtime
     * @formula (downtime) how long the channel has been offline
     * @labels twitch command channel stream
     * @cached
     */
    function downtime(args) {
        if (!args) {
            return {
                result: $.jsString($.getStreamDownTime()),
                cache: true
            };
        }
    }

    /*
     * @transformer followage
     * @formula (followage) sends a message denoting how long the sender of command is following this channel
     * @formula (followage user:str) sends a message denoting how long the provided user is following this channel
     * @formula (followage user:str channel:str) sends a message denoting how long the provided user is following the provided channel
     * @labels twitch command channel stream
     * @example Caster: !addcom !followage (followage)
     * User: !followage
     * Bot: @User, user has been following channel PhantomBot since March 29, 2016. (340 days)
     * @cancels
     */
    function followage(args, event) {
        var channel,
                user;
        if ((match = args.match(/^(?: (\S*)(?: (.*))?)?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            channel = (match[2] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(event.getSender());
            }
            if (channel.length === 0) {
                channel = $.jsString($.channelName);
            }
            $.getFollowAge(event.getSender(), user, channel);
            return {cancel: true};
        }
    }

    /*
     * @transformer followdate
     * @formula (followdate) the date the sender of this command last followed this channel
     * @formula (followdate user:str) the date the provided user last followed this channel
     * @formula (followdate user:str channel:str) the date the provided user last followed the provided channel
     * @labels twitch command channel stream
     * @cached
     */
    function followdate(args, event) {
        var channel,
                user;
        if ((match = args.match(/^(?: (\S*)(?: (.*))?)?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            channel = (match[2] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(event.getSender());
            }
            if (channel.length === 0) {
                channel = $.jsString($.channelName);
            }
            return {
                result: $.jsString($.getFollowDate(event.getSender(), user, channel)),
                cache: true
            };
        }
    }

    /*
     * @transformer follows
     * @formula (follows) number of follower of this channel
     * @formula (follows channel:str) number of follower of the specified channel
     * @labels twitch command channel stream
     * @example Caster: !addcom !follows We currently have (follows) followers!
     * User: !follows
     * Bot: We currently have 1000 followers!
     * @cached
     */
    function follows(args) {
        if (!args) {
            temp = $.channelName;
        } else {
            temp = args.trim();
        }
        return {
            result: $.jsString($.getFollows(temp)),
            cache: true
        };
    }

    /*
     * @transformer game
     * @formula (game) currently played game
     * @formula (game channel:str) currently played game of the specified channel
     * @labels twitch command channel stream
     * @example Caster: !addcom !game (pointtouser) current  game is: (game)
     * User: !game
     * Bot: User -> current game is: Programming
     * @cached
     */
    function game(args) {
        if (!args) {
            temp = $.channelName;
        } else {
            temp = args.trim();
        }
        return {
            result: $.jsString($.getGame(temp)),
            cache: true
        };
    }

    /*
     * @transformer gameinfo
     * @formula (gameinfo) similar to (game) but include game time if online
     * @labels twitch command channel stream
     * @example Caster: !addcom !game (pointtouser) Current game: (gameinfo).
     * User: !game
     * Bot: User -> Current game: Programming Playtime: 3 hours, 20 minutes and 35 seconds.
     * @cached
     */
    function gameinfo(args) {
        var game,
                playtime;
        if (!args) {
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
    }

    /*
     * @transformer gamesplayed
     * @formula (gamesplayed) list games played in current stream, and the approximate uptime when each game was started; if offline, cancels the command
     * @labels twitch command channel stream
     * @example Caster: !addcom !gamesplayed Games played in this stream: (gamesplayed)
     * User: !gamesplayed
     * Bot: Games played in this stream: Creative - 00:00, Programming - 02:30
     * @cancels sometimes
     * @cached
     */
    function gamesplayed(args, event) {
        if (!args) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return {cancel: true};
            }
            return {
                result: $.jsString($.getGamesPlayed()),
                cache: true
            };
        }
    }

    /*
     * @transformer hours
     * @formula (hours) number of hours sender has spent in chat
     * @formula (hours user:str) number of hours the provided user has spent in chat
     * @labels twitch command channel stream
     * @cached
     */
    function hours(args, event) {
        var user;
        if ((match = args.match(/^(?: (.*))?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(event.getSender());
            }
            return {
                result: $.jsString($.getUserTime(user) / 3600),
                cache: true
            };
        }
    }

    /*
     * @transformer hoursround
     * @formula (hoursround) number of hours sender has spent in chat, with the value rounded to the nearest tenth of an hour
     * @formula (hoursround user:str) number of hours the provided user has spent in chat, with the value rounded to the nearest tenth of an hour
     * @labels twitch command channel stream
     * @cached
     */
    function hoursround(args, event) {
        var user;
        if ((match = args.match(/^(?: (.*))?$/))) {
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(event.getSender());
            }
            return {
                result: $.jsString(Math.round($.getUserTime(user) / 360) / 10),
                cache: true
            };
        }
    }

    /*
     * @transformer lasttip
     * @formula (lasttip) last tip message
     * @labels twitch command channel stream
     * @cached
     */
    function lasttip(args) {
        if (!args) {
            if ($.inidb.exists('donations', 'last_donation_message')) {
                return {
                    result: $.jsString($.inidb.get('donations', 'last_donation_message')),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.lasttip.404'),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer playtime
     * @formula (playtime) how long this channel has streamed current game; if offline, sends an error to chat and cancels the command
     * @labels twitch command channel stream
     * @example Caster: !addcom !playtime Current playtime: (playtime).
     * User: !playtime
     * Bot: Current playtime: 30 minutes.
     * @cancels sometimes
     * @cached
     */
    function playtime(args, event) {
        if (!args) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return {cancel: true};
            }
            return {
                result: $.jsString($.getPlayTime() || ''),
                cache: true
            };
        }
    }

    /*
     * @transformer status
     * @formula (status) the current stream title
     * @formula (status channel:str) the current stream title of the specified channel
     * @labels twitch command channel stream
     * @example Caster: !addcom !status (pointtouser) current status is: (status)
     * User: !status
     * Bot: User -> current status is: Fun programming!
     * @cached
     */
    function status(args) {
        if (!args) {
            temp = $.channelName;
        } else {
            temp = args.trim();
        }
        return {
            result: $.jsString($.getStatus(temp)),
            cache: true
        };
    }

    /*
     * @transformer subscribers
     * @formula (subscribers) number of subscribers of this channel
     * @labels twitch command channel stream
     * @example Caster: !addcom !subs (subscribers) subscribers!
     * User: !subs
     * Bot: 10 subscribers!
     * @notes only works if the apioauth in botlogin.txt belongs to the broadcaster
     * @cached
     */
    function subscribers(args) {
        if (!args) {
            return {
                result: $.jsString($.getSubscriberCount() + ' '),
                cache: true
            };
        }
    }

    /*
     * @transformer titleinfo
     * @formula (titleinfo) title + uptime if online
     * @labels twitch command channel stream
     * @example Caster: !addcom !title (pointtouser) Current title: (titleinfo).
     * User: !title
     * Bot: User -> Current title: Fun programming! Uptime: 3 hours, 20 minutes and 35 seconds.
     * @cached
     */
    function titleinfo(args) {
        var status;
        if (!args) {
            status = $.getStatus($.channelName);
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
    }

    /*
     * @transformer uptime
     * @formula (uptime) how long the channel has been streaming this session; if offline, an error is sent to chat and the command is canceled
     * @formula (uptime channel:str) how long the specified channel has been streaming this session; if offline, an error is sent to chat and the command is canceled
     * @labels twitch command channel stream
     * @example Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime).
     * User: !uptime
     * Bot: @User, PhantomBot has been live for 2 hours, 3 minutes and 30 seconds.
     * @cancels sometimes
     * @cached
     */
    function uptime(args, event) {
        if (!args) {
            temp = $.channelName;
        } else {
            temp = args.trim();
        }
        if (!$.isOnline(temp)) {
            $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', temp));
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
     * @labels twitch command channel stream
     * @example Caster: !addcom !viewers We currently have (viewers) viewers watching us!
     * User: !viewers
     * Bot: We currently have 600 viewers watching us!
     * @cached
     */
    function viewers(args) {
        if (!args) {
            temp = $.channelName;
        } else {
            temp = args.trim();
        }
        return {
            result: $.jsString($.getViewers(temp)),
            cache: true
        };
    }

    /*
     * @transformer views
     * @formula (views) number of total view count for the stream
     * @labels twitch command channel stream
     * @cached
     */
    function views(args) {
        if (!args) {
            return {
                result: $.jsString($.twitchcache.getViews()),
                cache: true
            };
        }
    }

    var transformers = [
        new $.transformers.transformer('channelname', ['twitch', 'command', 'channel', 'stream'], channelname),
        new $.transformers.transformer('downtime', ['twitch', 'command', 'channel', 'stream'], downtime),
        new $.transformers.transformer('followage', ['twitch', 'command', 'channel', 'stream'], followage),
        new $.transformers.transformer('followdate', ['twitch', 'command', 'channel', 'stream'], followdate),
        new $.transformers.transformer('follows', ['twitch', 'command', 'channel', 'stream'], follows),
        new $.transformers.transformer('game', ['twitch', 'command', 'channel', 'stream'], game),
        new $.transformers.transformer('gameinfo', ['twitch', 'command', 'channel', 'stream'], gameinfo),
        new $.transformers.transformer('gamesplayed', ['twitch', 'command', 'channel', 'stream'], gamesplayed),
        new $.transformers.transformer('hours', ['twitch', 'command', 'channel', 'stream'], hours),
        new $.transformers.transformer('hoursround', ['twitch', 'command', 'channel', 'stream'], hoursround),
        new $.transformers.transformer('lasttip', ['twitch', 'command', 'channel', 'stream'], lasttip),
        new $.transformers.transformer('playtime', ['twitch', 'command', 'channel', 'stream'], playtime),
        new $.transformers.transformer('status', ['twitch', 'command', 'channel', 'stream'], status),
        new $.transformers.transformer('subscribers', ['twitch', 'command', 'channel', 'stream'], subscribers),
        new $.transformers.transformer('titleinfo', ['twitch', 'command', 'channel', 'stream'], titleinfo),
        new $.transformers.transformer('uptime', ['twitch', 'command', 'channel', 'stream'], uptime),
        new $.transformers.transformer('viewers', ['twitch', 'command', 'channel', 'stream'], viewers),
        new $.transformers.transformer('views', ['twitch', 'command', 'channel', 'stream'], views)
    ];

    $.transformers.addTransformers(transformers);
})();