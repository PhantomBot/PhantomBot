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

/* global Packages */

(function () {
    var cmd, i, keys, match, temp;

    /*
     * @transformer randomInt
     * @formula (#) a random integer from 1 to 100, inclusive
     * @formula (# a:int, b:int) a random integer from a to b, inclusive
     * @example Caster: !addcom !lucky Your lucky number is (#)
     * User: !lucky
     * Bot: Your lucky number is 7
     */
    function randomInt(args) {
        if (!args) {
            return {
                result: $.jsString($.randRange(1, 100)),
                cache: false
            };
        } else if ((match = args.match(/^\s(-?\d+),\s?(-?\d+)$/))) {
            return {
                result: $.jsString($.randRange(parseInt(match[1]), parseInt(match[2]))),
                cache: false
            };
        }
    }

    /*
     * @transformer buildArgs
     * @formula (n:int) the n-th argument (escaped by default)
     * @formula (n:int=tag:str) the n-th argument, if given, else another tag to replace this one
     * @formula (n:int|default:str) the n-th argument, if given, else a provided default value
     * @example Caster: !addcom !love (sender) loves (1).
     * User: !love monkeys
     * Bot: User loves monkeys.
     * @raw sometimes
     * @cached
     */
    function buildArgs(n) {
        return function (args, event) {
            var arg = event.getArgs()[n - 1];
            if (!args) {
                return {result: arg !== undefined ? $.jsString(arg) : ''};
            } else if ((match = args.match(/^([=\|])(.*)$/))) {
                if (arg !== undefined) {
                    return {
                        result: $.jsString(arg),
                        cache: true
                    };
                }
                return {
                    result: ($.equalsIgnoreCase(match[1], '=') ? '(' : '') + escapeTags(match[2]) + ($.equalsIgnoreCase(match[1], '=') ? ')' : ''),
                    raw: $.equalsIgnoreCase(match[1], '='),
                    cache: true
                };
            }
        };
    }

    /*
     * @transformer atSender
     * @formula (@sender) '@<Sender's Name>, '
     * @example Caster: !addcom !hello (@sender) you are awesome!
     * User: !hello
     * Bot: @User, you're awesome!
     * @cached
     */
    function atSender(args, event) {
        if (!args) {
            return {
                result: $.jsString($.userPrefix(event.getSender(), true)),
                cache: true
            };
        }
    }

    /*
     * @transformer age
     * @formula (age) outputs the age of the sender's Twitch account; If the sender provides an argument, checks that Twitch account instead
     * @example Caster: !addcom !age (age)
     * User: !age
     * Bot: @User, user has been on Twitch since April 19, 2009.
     *
     * User: !age User2
     * Bot: @User, user2 has been on Twitch since December 25, 2010.
     * @cancels
     */
    function age(args, event) {
        if (!args) {
            $.getChannelAge(event);
            return {cancel: true};
        }
    }

    /*
     * @transformer alert
     * @formula (alert fileName:str) sends a GIF/video alert to the alerts overlay, fading out after 3 seconds
     * @formula (alert fileName:str, durationSeconds:int) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with the audio volume set to 0.8
     * @formula (alert fileName:str, durationSeconds:int, volume:float) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0
     * @formula (alert fileName:str, durationSeconds:int, volume:float, css:text) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, and the provided CSS applied to the GIF/video
     * @formula (alert fileName:str, durationSeconds:int, volume:float, css:text, message:text) sends a GIF/video alert to the alerts overlay, fading out after durationSeconds, with audio volume set on a scale of 0.0-1.0, a message under the GIF/video, and the provided CSS applied to the GIF/video and message
     * @notes if an audio file exists next to the GIF/video file with the same fileName but an audio extension (eg. banana.gif and banana.mp3), then the audio file will automatically load and play at the provided volume
     * @example Caster: !addcom !banana (alert banana.gif)
     */
    function alert(args) {
        if ((match = args.match(/^ ([,.\w\W]+)$/))) {
            $.alertspollssocket.alertImage(match[1]);
            return {result: '', cache: false};
        }
    }

    /*
     * @transformer baresender
     * @formula (baresender) the login name of the message's sender
     */
    function baresender(args, event) {
        if (!args) {
            return {result: $.jsString(event.getSender())};
        }
    }

    /*
     * @transformer channelname
     * @formula (channelname) the display name of the Twitch channel
     */
    function channelname(args) {
        if (!args) {
            return {
                result: $.jsString($.username.resolve($.channelName)),
                cache: true
            };
        }
    }

    /*
     * @transformer code
     * @formula (code length:int) random code of the given length composed of a-zA-Z0-9
     * @example Caster: !addcom !code (code 5)
     * User: !code
     * Bot: A1D4f
     */
    function code(args) {
        var code,
                length,
                temp = '';
        if ((match = args.match(/^(?:=|\s)([1-9]\d*)$/))) {
            code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            length = parseInt(match[1]);
            for (i = 0; i < length; i++) {
                temp += code.charAt(Math.floor(Math.random() * code.length));
            }
            return {
                result: temp,
                cache: false
            };
        }
    }

    /*
     * @transformer command
     * @formula (command name:str) execute command with given name and pass no args
     * @formula (command name:str args:str) execute command with given name and pass args
     * @cancels
     */
    function command(args, event) {
        var argStr;
        if ((match = args.match(/^\s(\S+)(?:\s(.*))?$/))) {
            cmd = match[1];
            argStr = match[2] || '';
            if (cmd.length > 0) {
                var EventBus = Packages.tv.phantombot.event.EventBus;
                var CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
                EventBus.instance().postAsync(new CommandEvent(event.getSender(), cmd, argStr));
            }
            return {cancel: true};
        }
    }

    /*
     * @transformer commandslist
     * @formula (commandslist) lists custom commands (paginated)
     * @formula (commandslist prefix:str) lists custom commands (paginated) with a prefix in the output
     * @cancels
     */
    function commandslist(args, event) {
        var prefix;
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            prefix = match[1] || '';
            keys = $.inidb.GetKeyList('pricecom', '');
            temp = [];
            for (i in keys) {
                if (!keys[i].includes(' ')) {
                    temp.push('!' + keys[i] + ': ' + $.getPoints$.jsString($.inidb.get('pricecom', keys[i])));
                }
            }
            $.paginateArray(temp, 'NULL' + prefix, ', ', true, event.getSender());
            return {cancel: true};
        }
    }

    /*
     * @transformer count
     * @formula (count) increases the count of how often this command has been called and output new count
     * @example Caster:  !addcom !spam Chat has been spammed (count) times
     * User: !spam
     * Bot: Chat has been spammed 5050 times.
     */
    function count(args, event) {
        if (!args) {
            $.inidb.incr('commandCount', event.getCommand(), 1);
            return {result: $.jsString($.inidb.get('commandCount', event.getCommand()))};
        }
    }

    /*
     * @transformer countdown
     * @formula (countdown datetime:str) shows the time remaining until the given datetime
     * @notes for information about accepted datetime formats, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
     * @example Caster: !addcom !count Time Left: (countdown December 23 2017 23:59:59 GMT+0200)
     * User: !count
     * Bot: Time Left: 20 hours, 30 minutes and 55 seconds.
     * @cached
     */
    function countdown(args) {
        if ((match = args.match(/^(?:=|\s)(.*)$/))) {
            temp = Date.parse(match[1]);
            if (isNaN(temp)) {
                return {result: $.lang.get('customcommands.datetime.format.invalid', match[1])};
            }
            temp -= Date.parse($.getLocalTime());
            return {
                result: $.jsString($.getCount$.jsString(temp / 1000, false)),
                cache: true
            };
        }
    }

    /*
     * @transformer countup
     * @formula (countup datetime:str) shows the time elapsed since the given datetime
     * @notes for information about accepted datetime formats, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
     * @example Caster: !addcom !ago You missed it by (countup December 23 2017 23:59:59 GMT+0200)
     * User: !ago
     * Bot: You missed it by 20 hours, 30 minutes and 55 seconds.
     * @cached
     */
    function countup(args) {
        if ((match = args.match(/^(?:=|\s)(.*)$/))) {
            temp = Date.parse(match[1]);
            if (isNaN(temp)) {
                return {result: $.lang.get('customcommands.datetime.format.invalid', match[1])};
            }
            temp = Date.parse($.getLocalTime()) - temp;
            return {
                result: $.jsString($.getCount$.jsString(temp / 1000, true)),
                cache: true
            };
        }
    }

    /*
     * @transformer currenttime
     * @formula (currenttime timezone:str, format:str) shows the current date/time in given timezone, using the provided output format
     * @notes for information about crafting a format string, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html
     * @notes for information about accepted timezone strings, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/TimeZone.html
     * @cached
     */
    function currenttime(args) {
        if ((match = args.match(/^ (.+), (.*)$/))) {
            return {
                result: $.jsString($.getCurrentLocalTime$.jsString(match[2], match[1])),
                cache: true
            };
        }
    }

    /*
     * @transformer downtime
     * @formula (downtime) how long the channel has been offline
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
     * @transformer echo
     * @formula (echo) all arguments passed to the command
     * @example Caster: !addcom !echo (echo)
     * User: !echo test test
     * Bot: test test
     */
    function echo(args, event) {
        if (!args) {
            return {result: event.getArguments() ? $.jsString(event.getArguments()) : ''};
        }
    }

    /*
     * @transformer encodeurl
     * @formula (encodeurl url:str) url encode the given url
     * @cached
     */
    function encodeurl(args) {
        if ((match = args.match(/^ (.*)$/))) {
            return {
                result: encodeURI(match[1]),
                cache: true
            };
        }
    }

    /*
     * @transformer encodeurlparam
     * @formula (encodeurlparam paramter:str) like encodeurl but also ecapes "&", "=", "+", "/", etc.
     * @cached
     */
    function encodeurlparam(args) {
        if ((match = args.match(/^ (.*)$/))) {
            return {
                result: encodeURIComponent(match[1]),
                cache: true
            };
        }
    }

    /*
     * @transformer followage
     * @formula (followage) sends a message denoting how long the sender of command is following this channel
     * @formula (followage user:str) sends a message denoting how long the provided user is following this channel
     * @formula (followage user:str channel:str) sends a message denoting how long the provided user is following the provided channel
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
     * @example Caster: !addcom !follows We currently have (follows) followers!
     * User: !follows
     * Bot: We currently have 1000 followers!
     * @cached
     */
    function follows(args) {
        if (!args) {
            return {
                result: $.jsString($.getFollows($.channelName)),
                cache: true
            };
        }
    }

    /*
     * @transformer game
     * @formula (game) currently played game
     * @example Caster: !addcom !game (pointtouser) current  game is: (game)
     * User: !game
     * Bot: User -> current game is: Programming
     * @cached
     */
    function game(args) {
        if (!args) {
            return {
                result: $.jsString($.getGame($.channelName)),
                cache: true
            };
        }
    }

    /*
     * @transformer gameinfo
     * @formula (gameinfo) similar to (game) but include game time if online
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
     * @transformer gettimevar
     * @formula (gettimevar name:str) retrieves the specified timevar, set using !settimevar, for use in a (countdown) or (countup) transformer
     * @example Caster: !settimevar christmas December 25 2017 00:00:00 GMT-0500
     * Caster: !addcom !count Time Left until Christmas: (countdown (gettimevar christmas))
     * User: !count
     * Bot: Time Left until Christmas: 20 hours, 30 minutes and 55 seconds.
     * @cached
     */
    function gettimevar(args) {
        if (!args) {
            return {
                result: $.getLocalTime(),
                cache: true
            };
        } else {
            return {
                result: $.inidb.get('timevars', args),
                cache: true
            };
        }
    }

    /*
     * @formula help
     * @formula (help message:str) if no arguments are provided to the command, outputs the provided message and then cancels the command
     * @cancels sometimes
     */
    function help(args, event) {
        if ((match = args.match(/^(?:=|\s)(.*)$/))) {
            if (event.getArgs()[0] === undefined) {
                $.say(match[1]);
                return {cancel: true};
            } else {
                return {result: ''};
            }
        }
    }

    /*
     * @transformer hours
     * @formula (hours) number of hours sender has spent in chat
     * @formula (hours user:str) number of hours the provided user has spent in chat
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
     * @transformer keywordcount
     * @formula (keywordcount keyword:str) increase the keyword count for the given keyword and return new count
     */
    function keywordcount(args) {
        var keyword,
                keywordInfo;
        if ((match = args.match(/^\s(.+)$/))) {
            keyword = match[1];
            if ($.inidb.exists('keywords', keyword)) {
                keywordInfo = JSON.parse($.inidb.get('keywords', keyword));
                if ('count' in keywordInfo) {
                    ++keywordInfo["count"];
                } else {
                    keywordInfo["count"] = 1;
                }
                $.inidb.set('keywords', keyword, JSON.stringify(keywordInfo));
                return {result: $.jsString(keywordInfo["count"])};
            } else {
                return {result: $.lang.get('customcommands.keyword.404', keyword)};
            }
        }
    }

    /*
     * @transformer lasttip
     * @formula (lasttip) last tip message
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
     * @transformer pay
     * @formula (pay) outputs the number of points the sender has gained by using this command
     * @formula (pay command:str) outputs the number of points the sender would gain if they use the specified command
     * @cached
     */
    function pay(args, event) {
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            cmd = match[1] || '';
            if (cmd.length === 0) {
                cmd = event.getCommand();
            }
            if ($.inidb.exists('paycom', cmd)) {
                temp = $.inidb.get('paycom', cmd);
            } else {
                temp = 0;
            }
            return {
                result: $.jsString($.getPoints$.jsString(temp)),
                cache: true
            };
        }
    }

    /*
     * @transformer playsound
     * @formula (playsound hook:str) plays a sound hook on the alerts overlay
     * @formula (playsound hook:str|volume:float) plays a sound hook on the alerts overlay, with audio volume set on a scale of 0.0-1.0
     * @example Caster: !addcom !good Played sound goodgood (playsound goodgood)
     * @example Caster: !addcom !evil Played sound evil (playsound evillaugh|0.5)
     */
    function playsound(args) {
        if ((match = args.match(/^\s([a-zA-Z0-9_\-\s\,\(\)\'\"\~]+)([|]([.0-9_]{0,5}))?$/))) {
            if (!$.audioHookExists(match[1])) {
                $.log.error('Could not play audio hook: Audio hook does not exist.');
                return {result: $.lang.get('customcommands.playsound.404', match[1])};
            }
            $.alertspollssocket.triggerAudioPanel(match[1], match[3] !== undefined ? match[3] : -1);
            return {result: '', cache: false};
        }
    }

    /*
     * @transformer playtime
     * @formula (playtime) how long this channel has streamed current game; if offline, sends an error to chat and cancels the command
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
     * @transformer pointname
     * @formula (pointname) the plural name of the loyalty points
     * @example Caster: !addcom !pointsname (sender) current points name is set to: (pointname)
     * User: !pointsname
     * Bot: User current points name is set to: points
     */
    function pointname(args) {
        if (!args) {
            return {result: $.jsString($.pointNameMultiple)};
        }
    }

    /*
     * @transformer pointtouser
     * @formula (pointtouser) user + ' -> '; uses sender's display name if no other is provided
     * @example Caster: !addcom !facebook (pointtouser) like my Facebook page!
     * User: !facebook
     * Bot: User ->  like my Facebook page!
     *
     * User: !facebook User2
     * Bot: User2 -> like my Facebook  page!
     * @cached
     */
    function pointtouser(args, event) {
        temp = '';
        if (event.getArgs().length > 0) {
            temp = $.js$.jsString(event.getArgs()[0]).replace(/[^a-zA-Z0-9_]/g, '');
        }
        if (temp.length === 0) {
            temp = event.getSender();
        }
        return {
            result: $.jsString($.username.resolve(temp)) + ' -> ',
            cache: true
        };
    }

    /*
     * @transformer points
     * @formula (points) points of the sender
     * @formula (points user:str) points of the given user
     * @cached
     */
    function points(args, event) {
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            var user;
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = $.jsString(event.getSender());
            }
            return {
                result: $.jsString($.getUserPoints(user)),
                cache: true
            };
        }
    }

    /*
     * @transformer price
     * @formula (price) the number of points the sender paid to use this command
     * @formula (price command:str) the number of points the sender would pay if they use the specified command
     * @example Caster: !addcom !cost This command costs (price) (pointname)
     * User: !cost
     * Bot: This command costs 10 points
     * @cached
     */
    function price(args, event) {
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            cmd = match[1] || '';
            if (cmd.length === 0) {
                cmd = event.getCommand();
            }
            if ($.inidb.exists('pricecom', cmd)) {
                temp = $.inidb.get('pricecom', cmd);
            } else {
                temp = 0;
            }
            return {
                result: $.jsString($.getPoints$.jsString(temp)),
                cache: true
            };
        }
    }

    /*
     * @transformer random
     * @formula (random) random user in chat, or the bot's name if chat is empty
     * @example Caster: !addcom !poke /me pokes (random) with a long wooden stick.
     * User: !poke
     * Bot: /me pokes User2 with a long wooden stick.
     */
    function random(args) {
        if (!args) {
            try {
                var name = $.username.resolve($.randElement($.users));

                if ($.users.length === 0 || name === null || name === undefined) {
                    name = $.username.resolve($.botName);
                }

                return {
                    result: $.jsString(name),
                    cache: false
                };
            } catch (ex) {
                return {result: $.jsString($.username.resolve($.botName))};
            }
        }
    }

    /*
     * @transformer randomrank
     * @formula (randomrank) random user in chat, or the bot's name if chat is empty; the chosen user's rank is prefixed
     * @example Caster: !addcom !poke /me Pokes (randomrank) with a bar of soap.
     * User: !poke
     * Bot: /me Pokes Master User2 with a bar of soap.
     */
    function randomrank(args) {
        if (!args) {
            try {
                return {
                    result: $.jsString($.resolveRank($.randElement($.users))),
                    cache: false
                };
            } catch (ex) {
                return {result: $.jsString($.resolveRank($.botName))};
            }
        }
    }

    /*
     * @transformer readfile
     * @formula (readfile filename:str) first line of the specified file
     * @notes files will be read from the addons folder, or a subfolder therein specified by the filename parameter
     * @example Caster: !addcom !lastfollow Last follower was (readfile ./followHandler/latestFollower.txt)
     * User: !lastfollow
     * Bot: Last follower was User
     * @cached
     */
    function readfile(args) {
        var fileName;
        if ((match = args.match(/^ (.+)$/))) {
            fileName = './addons/' + $.replace(match[1], '..', '');
            if (!$.fileExists(fileName)) {
                return {
                    result: $.lang.get('customcommands.file.404', fileName),
                    cache: true
                };
            }
            return {
                result: $.jsString($.readFile(fileName)[0] || ''),
                cache: true
            };
        }
    }

    /*
     * @transformer readfilerand
     * @formula (readfilerand filename:str) random line of the specified file
     * @notes files will be read from the addons folder, or a subfolder therein specified by the filename parameter
     */
    function readfilerand(args) {
        var fileName;
        if ((match = args.match(/^ (.+)$/))) {
            fileName = './addons/' + $.replace(match[1], '..', '');
            if (!$.fileExists(fileName)) {
                return {result: $.lang.get('customcommands.file.404', fileName)};
            }
            temp = $.readFile(fileName);
            return {result: $.jsString($.randElement(temp) || ''), cache: false};
        }
    }

    /*
     * @transformer repeat
     * @formula (repeat n:int, message:str) repeat the message n times (copy/paste)
     * @note the value of n is limited to a maximum of 30
     * @cached
     */
    function repeat(args) {
        var MAX_COUNTER_VALUE = 30,
                n;
        if ((match = args.match(/^\s([1-9]\d*),\s?(.*)$/))) {
            if (!match[2]) {
                return {result: ''};
            }
            n = parseInt(match[1]);
            if (n > MAX_COUNTER_VALUE) {
                n = MAX_COUNTER_VALUE;
            }
            if (n < 1) {
                n = 1;
            }
            temp = [];
            for (i = 0; i < n; i++) {
                temp.push(match[2]);
            }
            return {
                result: temp.join(' '),
                cache: true
            };
        }
    }

    /*
     * @transformer sender
     * @formula (sender) the sender's display name
     * @example Caster: !addcom !hello Hello, (sender)!
     * User: !hello
     * Bot: Hello, User!
     * @cached
     */
    function sender(args, event) {
        if (!args) {
            return {
                result: $.jsString($.username.resolve(event.getSender())),
                cache: true
            };
        }
    }

    /*
     * @transformer senderrank
     * @formula (senderrank) the sender's display name, prefixed with their rank
     * @example Caster: !addcom !poke /me Pokes (senderrank) with a bar of soap.
     * User: !poke
     * Bot: /me Pokes Master User with a bar of soap.
     * @cached
     */
    function senderrank(args, event) {
        if (!args) {
            return {
                result: $.jsString($.resolveRank(event.getSender())),
                cache: true
            };
        }
    }

    /*
     * @transformer senderrankonly
     * @formula (senderrankonly) the sender's rank
     * @cached
     */
    function senderrankonly(args, event) {
        if (!args) {
            return {
                result: $.jsString($.getRank(event.getSender())),
                cache: true
            };
        }
    }

    /*
     * @transformer status
     * @formula (status) the current stream title
     * @example Caster: !addcom !status (pointtouser) current status is: (status)
     * User: !status
     * Bot: User -> current status is: Fun programming!
     * @cached
     */
    function status(args) {
        if (!args) {
            return {
                result: $.jsString($.getStatus($.channelName)),
                cache: true
            };
        }
    }

    /*
     * @transformer subscribers
     * @formula (subscribers) number of subscribers of this channel
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
     * @transformer team_member_followers
     * @formula (team_member_followers team:str, membername:str) number of followers of user membername in the provided team
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_member_followers(args) {
        var teamObj,
                teamMember;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                teamMember = teamObj.getTeamMember(match[2]);
                if (teamMember !== null) {
                    return {
                        result: $.jsString(teamMember.get('followers')),
                        cache: true
                    };
                } else {
                    return {
                        result: $.lang.get('customcommands.teamapi.member.404', match[1]),
                        cache: true
                    };
                }
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[2]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_member_game
     * @formula (team_member_game team:str, membername:str) game user membername in the provided team currently plays
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_member_game(args) {
        var teamObj,
                teamMember;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                teamMember = teamObj.getTeamMember(match[2]);
                if (teamMember !== null) {
                    return {
                        result: $.jsString(teamMember.get$.jsString('game')),
                        cache: true
                    };
                } else {
                    return {
                        result: $.lang.get('customcommands.teamapi.member.404', match[1]),
                        cache: true
                    };
                }
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[2]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_member_url
     * @formula (team_member_url team:str, membername:str) url of user membername in the provided team
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_member_url(args) {
        var teamObj,
                teamMember;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+),\s([a-zA-Z0-9_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                teamMember = teamObj.getTeamMember(match[2]);
                if (teamMember !== null) {
                    return {
                        result: $.jsString(teamMember.get$.jsString('url')),
                        cache: true
                    };
                } else {
                    return {
                        result: $.lang.get('customcommands.teamapi.member.404', match[1]),
                        cache: true
                    };
                }
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[2]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_members
     * @formula (team_members team:str) number of members in the provided team
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_members(args) {
        var teamObj;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: $.jsString(teamObj.getTotalMembers()),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_name
     * @formula (team_name team:str) name of the provided team
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_name(args) {
        var teamObj;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: $.jsString(teamObj.getName()),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_random_member
     * @formula (team_random_member team:str) random member of the provided team
     * @notes the team parameter should be the url slug for the team
     */
    function team_random_member(args) {
        var teamObj;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: $.jsString(teamObj.getRandomMember()),
                    cache: false
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer team_url
     * @formula (team_url team:str) url to the provided team
     * @notes the team parameter should be the url slug for the team
     * @cached
     */
    function team_url(args) {
        var teamObj;
        if ((match = args.match(/^ ([a-zA-Z0-9-_]+)$/))) {
            teamObj = $.twitchteamscache.getTeam(match[1]);
            if (teamObj !== null) {
                return {
                    result: $.jsString(teamObj.getUrl()),
                    cache: true
                };
            } else {
                return {
                    result: $.lang.get('customcommands.teamapi.team.404', match[1]),
                    cache: true
                };
            }
        }
    }

    /*
     * @transformer titleinfo
     * @formula (titleinfo) title + uptime if online
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
     * @transformer token
     * @formula (token) replaced with the secret token that was set by !tokencom or the panel
     * @example Caster: !addcom !weather (customapijson http://api.apixu.com/v1/current.json?key=(token)&q=$1 {Weather for} location.name {:} current.condition.text {Temps:} current.temp_f {F} current.temp_c {C})
     * Caster: !tokencom !weather mySecretApiKey
     * User: !weather 80314
     * // customapijson generates the below response using the url: http://api.apixu.com/v1/current.json?key=mySecretApiKey&q=80314
     * Bot: Weather for Boulder, CO : Sunny Temps: 75 F 24 C
     * @cached
     */
    function token(args, event) {
        cmd = event.getCommand();
        if ($.inidb.HasKey('commandtoken', '', cmd)) {
            return {
                result: $.inidb.Get$.jsString('commandtoken', '', cmd),
                cache: true
            };
        } else {
            return {
                result: 'NOT_SET',
                cache: true
            };
        }
    }

    /*
     * @transformer touser
     * @formula (touser) display name of the user provided as an argument by the sender; sender's display name if no other is provided
     * @example Caster: !addcom !twitter (touser) Hey! Follow my Twitter!
     * User: !twitter
     * Bot: User Hey! Follow my Twitter!
     *
     * User: !twitter User2
     * Bot: User2 Hey! Follow my Twitter!
     * @cached
     */
    function touser(args, event) {
        temp = '';
        if (event.getArgs().length > 0) {
            temp = $.js$.jsString(event.getArgs()[0]).replace(/[^a-zA-Z0-9_]/g, '');
        }
        if (temp.length === 0) {
            temp = event.getSender();
        }
        return {
            result: $.jsString($.username.resolve(temp)),
            cache: true
        };
    }

    /*
     * @transformer unescape
     * @formula (unescape str:str) unescape \\ \( \) to \ ( ) respectively
     * @raw
     * @cached
     */
    function unescape(args) {
        if ((match = args.match(/^ (.*)$/))) {
            return {
                result: match[1],
                raw: true,
                cache: true
            };
        }
    }

    /*
     * @transformer uptime
     * @formula (uptime) how long the channel has been streaming this session; if offline, an error is sent to chat and the command is canceled
     * @cancels sometimes
     * @example Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime).
     * User: !uptime
     * Bot: @User, PhantomBot has been live for 2 hours, 3 minutes and 30 seconds.
     * @cached
     */
    function uptime(args, event) {
        if (!args) {
            if (!$.isOnline($.channelName)) {
                $.say($.userPrefix(event.getSender(), true) + $.lang.get('timesystem.uptime.offline', $.channelName));
                return {cancel: true};
            }
            return {
                result: $.getStreamUptime($.channelName),
                cache: true
            };
        }
    }

    /*
     * @transformer viewers
     * @formula (viewers) number of current viewers
     * @example Caster: !addcom !viewers We currently have (viewers) viewers watching us!
     * User: !viewers
     * Bot: We currently have 600 viewers watching us!
     * @cached
     */
    function viewers(args) {
        if (!args) {
            return {
                result: $.jsString($.getViewers($.channelName) + ' '),
                cache: true
            };
        }
    }

    /*
     * @transformer views
     * @formula (views) number of total view count for the stream
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

    /*
     * @transformer writefile
     * @formula (writefile filename:str, append:bool, text:str) writes the specified text to the provided file; if append is 'true', data is appended to the end of the file, otherwise the file is overwritten
     * @notes files will be placed in the addons folder, or a subfolder therein specified by the filename parameter
     * @example Caster: !addcom !settxt (writefile test.txt, true, (echo))
     */
    function writefile(args) {
        var fileName;
        if ((match = args.match(/^ (.+), (.+), (.+)$/))) {
            fileName = './addons/' + $.replace(match[1], '..', '');
            $.writeToFile(match[3], fileName, match[2] === 'true');
            return {result: '', cache: false};
        }
    }

    transformers = {
        '#': randomInt,
        '@sender': atSender,
        'adminonlyedit': adminonlyedit,
        'age': age,
        'alert': alert,
        'baresender': baresender,
        'channelname': channelname,
        'code': code,
        'command': command,
        'commandslist': commandslist,
        'count': count,
        'countdown': countdown,
        'countup': countup,
        'currenttime': currenttime,
        'customapi': customapi,
        'customapijson': customapijson,
        'downtime': downtime,
        'echo': echo,
        'encodeurl': encodeurl,
        'encodeurlparam': encodeurlparam,
        'followage': followage,
        'followdate': followdate,
        'follows': follows,
        'game': game,
        'gameinfo': gameinfo,
        'gameonly': gameonly,
        'gamesplayed': gamesplayed,
        'gettimevar': gettimevar,
        'help': help,
        'hours': hours,
        'hoursround': hoursround,
        'keywordcount': keywordcount,
        'lasttip': lasttip,
        'offlineonly': offlineonly,
        'onlineonly': onlineonly,
        'pay': pay,
        'playsound': playsound,
        'playtime': playtime,
        'pointname': pointname,
        'pointtouser': pointtouser,
        'points': points,
        'price': price,
        'random': random,
        'randomrank': randomrank,
        'readfile': readfile,
        'readfilerand': readfilerand,
        'repeat': repeat,
        'sender': sender,
        'senderrank': senderrank,
        'senderrankonly': senderrankonly,
        'status': status,
        'subscribers': subscribers,
        'team_member_followers': team_member_followers,
        'team_member_game': team_member_game,
        'team_member_url': team_member_url,
        'team_members': team_members,
        'team_name': team_name,
        'team_random_member': team_random_member,
        'team_url': team_url,
        'titleinfo': titleinfo,
        'token': token,
        'touser': touser,
        'unescape': unescape,
        'uptime': uptime,
        'useronly': useronly,
        'viewers': viewers,
        'views': views,
        'writefile': writefile
    };
    for (i = 1; i <= 9; i++) {
        transformers[$.jsString(i)] = buildArgs(i);
    }
})();