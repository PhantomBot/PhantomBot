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

/* global Packages */

(function () {
    var cmd, i, keys, match, temp;

    /*
     * @transformer command
     * @formula (command name:str) execute command with given name and pass no args
     * @formula (command name:str args:str) execute command with given name and pass args
     * @labels twitch discord commandevent commands
     */
    function command(args) {
        var pargs = $.parseArgs(args.args, ' ', 2, true);
        if (pargs !== null) {
            cmd = pargs[0];
            var argStr = '';

            if (pargs.length > 1) {
                argStr = pargs[1];
            }

            var EventBus = Packages.tv.phantombot.event.EventBus;
            if (args.platform === 'discord') {
                var DiscordCommandEvent = Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
                EventBus.instance().postAsync(new DiscordCommandEvent(args.event.getDiscordUser(), args.event.getDiscordChannel(),
                        args.event.getDiscordMessage(), cmd, argStr, args.event.isAdmin()));
            } else {
                var CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
                EventBus.instance().postAsync(new CommandEvent(args.event.getSender(), cmd, argStr, args.event.getTags()));
            }
        }

        return {
            result: ''
        };
    }

    /*
     * @transformer commandslist
     * @formula (commandslist) lists custom commands (paginated)
     * @formula (commandslist prefix:str) lists custom commands (paginated) with a prefix in the output
     * @labels twitch commandevent commands
     * @cancels
     */
    function commandslist(args) {
        var prefix;
        if ((match = args.args.match(/^(?:\s(.*))?$/))) {
            prefix = match[1] || '';
            keys = $.inidb.GetKeyList('pricecom', '');
            temp = [];
            for (i in keys) {
                if (!keys[i].includes(' ')) {
                    temp.push('!' + keys[i] + ': ' + $.getPointsString($.inidb.get('pricecom', keys[i])));
                }
            }
            $.paginateArray(temp, 'NULL' + prefix, ', ', true, args.event.getSender());
            return {cancel: true};
        }
    }

    /*
     * @transformer count
     * @formula (count) increases the count of how often this command has been called and outputs new count
     * @formula (count amount:int) increases the count of how often this command has been called by the specified amount and outputs new count
     * @formula (count amount:int name:str) increases the count of how often the named counter has been called by the specified amount and outputs new count
     * @formula (count reset name:str) zeroes the named counter and outputs new count
     * @labels twitch discord commandevent commands
     * @example Caster: !addcom !spam Chat has been spammed (count) times
     * User: !spam
     * Bot: Chat has been spammed 5050 times.
     * @notes Specify an amount of `0` to display the count without changing it.
     * Specify a negative amount to subtract from it.
     * The default counter name is the command name, without the `!`
     */
    function count(args) {
        match = $.parseArgs(args.args, ' ', 2, true);
        var incr = 1;
        var counter = args.event.getCommand();
        var table = 'commandCount';

        if (args.platform === 'discord') {
            table = 'discordCommandCount';
        }

        if (match !== null && match.length > 1 && match[1].length > 0) {
            counter = match[1];
        }

        if (match !== null && match.length > 0) {
            if (!isNaN(match[0])) {
                incr = parseInt(match[0]);
            } else if (match[0].toLowerCase() === 'reset') {
                incr = -$.inidb.GetInteger(table, '', counter);
            }
        }

        $.inidb.incr(table, counter, incr);
        return {result: $.inidb.get(table, counter)};
    }

    /*
     * @transformer delaycommand
     * @formula (delaycommand delayseconds:int name:str) execute command with given name and pass no args, after the given delay
     * @formula (delaycommand delayseconds:int name:str args:str) execute command with given name and pass args, after the given delay
     * @labels twitch discord commandevent commands
     */
    function delaycommand(args) {
        var pargs = $.parseArgs(args.args, ' ', 3, true);
        try {
            if (pargs !== null) {
                var delay = parseInt(pargs[0]);
                cmd = pargs[1];
                var argStr = '';

                if (pargs.length > 2) {
                    argStr = pargs[2];
                }

                setTimeout(function () {
                    var EventBus = Packages.tv.phantombot.event.EventBus;
                    if (args.platform === 'discord') {
                        var DiscordCommandEvent = Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
                        EventBus.instance().postAsync(new DiscordCommandEvent(args.event.getDiscordUser(), args.event.getDiscordChannel(),
                                args.event.getDiscordMessage(), cmd, argStr, args.event.isAdmin()));
                    } else {
                        var CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
                        EventBus.instance().postAsync(new CommandEvent(args.event.getSender(), cmd, argStr, args.event.getTags()));
                    }
                }, delay * 1000, 'delaycommand ' + cmd + ' ' + delay);
            }
        } catch (e) {
        }

        return {
            result: ''
        };
    }

    /*
     * @formula help
     * @formula (help message:str) if no arguments are provided to the command, outputs the provided message and then cancels the command
     * @labels twitch discord commandevent commands
     * @cancels sometimes
     */
    function help(args) {
        if ((match = args.args.match(/^(?:=|\s)(.*)$/))) {
            if (args.event.getArgs()[0] === undefined) {
                $.say(match[1]);
                return {cancel: true};
            } else {
                return {result: ''};
            }
        }
    }

    var transformers = [
        new $.transformers.transformer('command', ['twitch', 'discord', 'commandevent', 'commands'], command),
        new $.transformers.transformer('commandslist', ['twitch', 'commandevent', 'commands'], commandslist),
        new $.transformers.transformer('count', ['twitch', 'discord', 'commandevent', 'commands'], count),
        new $.transformers.transformer('delaycommand', ['twitch', 'discord', 'commandevent', 'commands'], delaycommand),
        new $.transformers.transformer('help', ['twitch', 'discord', 'commandevent', 'commands'], help)
    ];

    $.transformers.addTransformers(transformers);
})();
