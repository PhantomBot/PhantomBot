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
    var i, match, temp;

    /*
     * @transformer randomInt
     * @formula (#) a random integer from 1 to 100, inclusive
     * @formula (# a:int, b:int) a random integer from a to b, inclusive
     * @labels twitch discord noevent basic
     * @example Caster: !addcom !lucky Your lucky number is (#)
     * User: !lucky
     * Bot: Your lucky number is 7
     */
    function randomInt(args) {
        if (!args.args) {
            return {
                result: $.randRange(1, 100),
                cache: false
            };
        } else if ((match = args.args.match(/^\s(-?\d+),\s?(-?\d+)$/))) {
            return {
                result: $.randRange(parseInt(match[1]), parseInt(match[2])),
                cache: false
            };
        }
    }

    /*
     * @transformer buildArgs
     * @formula (n:int) the n-th argument (escaped by default)
     * @formula (n:int=tag:str) the n-th argument, if given, else another tag to replace this one
     * @formula (n:int|default:str) the n-th argument, if given, else a provided default value
     * @labels twitch discord commandevent basic
     * @example Caster: !addcom !love (sender) loves (1).
     * User: !love monkeys
     * Bot: User loves monkeys.
     * @raw sometimes
     * @cached
     */
    function buildArgs(n) {
        return function (args) {
            var arg = args.event.getArgs()[n - 1];
            if (!args.args) {
                return {result: arg !== undefined ? arg : ''};
            } else if ((match = args.args.match(/^([=\|])(.*)$/))) {
                if (arg !== undefined) {
                    return {
                        result: arg,
                        cache: true
                    };
                }
                return {
                    result: ($.equalsIgnoreCase(match[1], '=') ? '(' : '') + $.transformers.escapeTags(match[2]) + ($.equalsIgnoreCase(match[1], '=') ? ')' : ''),
                    raw: $.equalsIgnoreCase(match[1], '='),
                    cache: true
                };
            }
        };
    }

    /*
     * @transformer delaysay
     * @formula (delaysay delayseconds:int message:str) send the given message to chat, after the given delay
     * @labels twitch discord commandevent commands
     */
    function delaysay(args) {
        var pargs = $.parseArgs(args.args, ' ', 2, true);
        try {
            if (pargs !== null) {
                var delay = parseInt(pargs[0]);
                var argStr = '';

                if (pargs.length > 1) {
                    argStr = pargs[1];
                }

                setTimeout(function () {
                    if (args.platform === 'discord') {
                        $.discord.say(args.event.getDiscordChannel(), argStr);
                    } else {
                        $.say(argStr);
                    }
                }, delay * 1000, 'delaysay ' + delay);
            }
        } catch (e) {
        }

        return {
            result: ''
        };
    }

    /*
     * @transformer echo
     * @formula (echo) all arguments passed to the command
     * @labels twitch discord commandevent basic
     * @example Caster: !addcom !echo (echo)
     * User: !echo test test
     * Bot: test test
     */
    function echo(args) {
        return {result: args.event.getArguments() ? args.event.getArguments() : ''};
    }

    /*
     * @transformer random
     * @formula (random) random user in chat, or the bot's name if chat is empty
     * @labels twitch discord noevent basic
     * @example Caster: !addcom !poke /me pokes (random) with a long wooden stick.
     * User: !poke
     * Bot: /me pokes User2 with a long wooden stick.
     */
    function random(args) {
        if (args.platform === 'discord') {
            return {result: $.discord.username.random()};
        } else {
            try {
                var name = $.username.resolve($.randElement($.users));

                if ($.users.length === 0 || name === null || name === undefined) {
                    name = $.username.resolve($.botName);
                }

                return {result: name};
            } catch (ex) {
                return {result: $.username.resolve($.botName)};
            }
        }
    }

    /*
     * @transformer randomrank
     * @formula (randomrank) random user in chat, or the bot's name if chat is empty; the chosen user's rank is prefixed
     * @labels twitch noevent basic
     * @example Caster: !addcom !poke /me Pokes (randomrank) with a bar of soap.
     * User: !poke
     * Bot: /me Pokes Master User2 with a bar of soap.
     */
    function randomrank() {
        try {
            return {
                result: $.resolveRank($.randElement($.users)),
                cache: false
            };
        } catch (ex) {
            return {result: $.resolveRank($.botName)};
        }
    }

    /*
     * @transformer repeat
     * @formula (repeat n:int, message:str) repeat the message n times (copy/paste)
     * @labels twitch discord noevent basic
     * @note the value of n is limited to a maximum of 30
     * @cached
     */
    function repeat(args) {
        var MAX_COUNTER_VALUE = 30,
                n;
        if ((match = args.args.match(/^\s([1-9]\d*),\s?(.*)$/))) {
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

    var transformers = [
        new $.transformers.transformer('#', ['twitch', 'discord', 'noevent', 'basic'], randomInt),
        new $.transformers.transformer('delaysay', ['twitch', 'discord', 'commandevent', 'basic'], delaysay),
        new $.transformers.transformer('echo', ['twitch', 'discord', 'commandevent', 'basic'], echo),
        new $.transformers.transformer('random', ['twitch', 'discord', 'noevent', 'basic'], random),
        new $.transformers.transformer('randomrank', ['twitch', 'noevent', 'basic'], randomrank),
        new $.transformers.transformer('repeat', ['twitch', 'discord', 'noevent', 'basic'], repeat)
    ];

    for (i = 1; i <= 9; i++) {
        transformers.push(new $.transformers.transformer($.jsString(i), ['twitch', 'discord', 'commandevent', 'basic'], buildArgs(i)));
    }

    $.transformers.addTransformers(transformers);
})();

