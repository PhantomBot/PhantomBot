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
     * @transformer command
     * @formula (command name:str) execute command with given name and pass no args
     * @formula (command name:str args:str) execute command with given name and pass args
     * @labels twitch commandevent commands
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
     * @labels twitch commandevent commands
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
                    temp.push('!' + keys[i] + ': ' + $.getPointsString($.inidb.get('pricecom', keys[i])));
                }
            }
            $.paginateArray(temp, 'NULL' + prefix, ', ', true, event.getSender());
            return {cancel: true};
        }
    }

    /*
     * @transformer count
     * @formula (count) increases the count of how often this command has been called and outputs new count
     * @formula (count amount:int) increases the count of how often this command has been called by the specified amount and outputs new count
     * @formula (count amount:int name:str) increases the count of how often the named counter has been called by the specified amount and outputs new count
     * @labels twitch commandevent commands
     * @example Caster: !addcom !spam Chat has been spammed (count) times
     * User: !spam
     * Bot: Chat has been spammed 5050 times.
     * @notes Specify an amount of `0` to display the count without changing it.
     * Specify a negative amount to subtract from it.
     * To zero the count, use `(count -(count 0 counterName) counterName)`.
     * The default counter name is the command name, without the `!`
     */
    function count(args, event) {
        match = $.parseArgs(args, ' ', 2, true);
        var incr = 1;
        var counter = event.getCommand();

        if (match !== null && match.length > 0 && !isNaN(match[1])) {
            incr = parseInt(incr);
        }

        if (match !== null && match.length > 1 && match[2].length > 0) {
            counter = match[2];
        }

        $.inidb.incr('commandCount', counter, incr);
        return {result: $.inidb.get('commandCount', counter)};
    }

    /*
     * @formula help
     * @formula (help message:str) if no arguments are provided to the command, outputs the provided message and then cancels the command
     * @labels twitch discord commandevent commands
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

    var transformers = [
        new $.transformers.transformer('command', ['twitch', 'commandevent', 'commands'], command),
        new $.transformers.transformer('commandslist', ['twitch', 'commandevent', 'commands'], commandslist),
        new $.transformers.transformer('count', ['twitch', 'commandevent', 'commands'], count),
        new $.transformers.transformer('help', ['twitch', 'discord', 'commandevent', 'commands'], help)
    ];

    $.transformers.addTransformers(transformers);
})();
