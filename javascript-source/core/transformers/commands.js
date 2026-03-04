/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
    /*
     * @transformer command
     * @formula (command name:str) execute command with given name and pass no args
     * @formula (command name:str args:str) execute command with given name and pass args
     * @labels twitch discord commandevent commands
     */
    function command(args) {
        let cmd;
        let pargs = $.parseArgs(args.args, ' ', 2, true);
        if (pargs !== null) {
            cmd = pargs[0];
            let argStr = '';

            if (pargs.length > 1) {
                argStr = pargs[1];
            }

            let EventBus = Packages.tv.phantombot.event.EventBus;
            if (args.platform === 'discord') {
                let DiscordCommandEvent = Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
                EventBus.instance().postAsync(new DiscordCommandEvent(args.event.getDiscordUser(), args.event.getDiscordChannel(),
                        args.event.getDiscordMessage(), cmd, argStr, args.event.isAdmin()));
            } else {
                let CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
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
        let i, keys, temp;
        let prefix = args.args || '';
        keys = $.inidb.GetKeyList('pricecom', '');
        temp = [];
        for (i in keys) {
            if (!keys[i].includes(' ')) {
                temp.push('!' + keys[i] + ': ' + $.getPointsString($.getIniDbString('pricecom', keys[i])));
            }
        }
        $.paginateArray(temp, 'NULL' + prefix, ', ', true, args.event.getSender());
        return {cancel: true};
    }

    /*
     * @transformer count
     * @formula (count) increases the count of how often this command has been called and outputs new count
     * @formula (count amount:int) increases the count of how often this command has been called by the specified amount and outputs new count
     * @formula (count amount:int name:str) increases the count of how often the named counter has been called by the specified amount and outputs new count
     * @formula (count reset name:str) zeroes the named counter and outputs new count
     * @labels twitch discord noevent commandevent commands
     * @example Caster: !addcom !spam Chat has been spammed (count) times
     * User: !spam
     * Bot: Chat has been spammed 5050 times.
     * @notes Specify an amount of `0` to display the count without changing it.
     * Specify a negative amount to subtract from it.
     * The default counter name is the command name, without the `!`
     */
    function count(args) {
        let match;
        match = $.parseArgs(args.args, ' ', 2, true);
        let incr = 1;
        let counter;
        let table = 'commandCount';

        if (args.platform === 'discord') {
            table = 'discordCommandCount';
        }

        if (match !== null && match.length > 1 && match[1].length > 0) {
            counter = match[1];
        } else if (args.event === undefined || args.event.getCommand === undefined) {
            return {result: 'No counter name'};
        } else {
            counter = args.event.getCommand();
        }

        if (match !== null && match.length > 0) {
            if (!isNaN(match[0])) {
                incr = parseInt(match[0]);
            } else if (match[0].toLowerCase() === 'reset') {
                incr = -$.getIniDbNumber(table, counter);
            }
        }

        $.inidb.incr(table, counter, incr);
        return {result: $.getIniDbString(table, counter)};
    }

    /*
     * @transformer delaycommand
     * @formula (delaycommand delayseconds:int name:str) execute command with given name and pass no args, after the given delay
     * @formula (delaycommand delayseconds:int name:str args:str) execute command with given name and pass args, after the given delay
     * @labels twitch discord commandevent commands
     */
    function delaycommand(args) {
        let cmd;
        let pargs = $.parseArgs(args.args, ' ', 3, true);
        try {
            if (pargs !== null) {
                let delay = parseInt(pargs[0]);
                cmd = pargs[1];
                let argStr = '';

                if (pargs.length > 2) {
                    argStr = pargs[2];
                }

                setTimeout(function () {
                    let EventBus = Packages.tv.phantombot.event.EventBus;
                    if (args.platform === 'discord') {
                        let DiscordCommandEvent = Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
                        EventBus.instance().postAsync(new DiscordCommandEvent(args.event.getDiscordUser(), args.event.getDiscordChannel(),
                                args.event.getDiscordMessage(), cmd, argStr, args.event.isAdmin()));
                    } else {
                        let CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
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
     * @transformer discordcommand
     * @formula (discordcommand discordchannel:str name:str) explicitly execute a command on Discord, including when triggering from Twitch chat, with given name and pass no args, with the specified channel in the context
     * @formula (discordcommand discordchannel:str name:str args:str) explicitly execute a command on Discord, including when triggering from Twitch chat, with given name and pass args, with the specified channel in the context
     * @labels twitch discord commandevent commands
     * @notes The parameter `discordchannel` can be either the channel ID or the channel name
     * @notes If this command tag is executed from Twitch chat, the sender must have already performed `!account link`
     * on Discord for a sender to be defined in the command event and any Discord administrator permissions to apply;
     * Otherwise, the command executes with a `null` sender
     */
    function discordcommand(args) {
        let pargs = $.parseArgs(args.args, ' ', 2, true);
        if (pargs !== null && pargs.length > 1) {
            let channel = $.discordAPI.getChannel(pargs[0]);
            let cmd = pargs[1];
            let argStr = '';

            if (pargs.length > 2) {
                argStr = pargs[2];
            }

            if (channel !== null) {
                let user = null;
                let isAdmin = false;
                let message = null;
                if (args.platform === 'discord') {
                    user = args.event.getDiscordUser();
                    isAdmin = args.event.isAdmin();
                    message = args.event.getDiscordMessage();
                } else {
                    user = $.discord.twitchToDiscord(args.event.getSender());
                    if (user !== null) {
                        user = $.discord.getUserById(user);
                        if (user !== null) {
                            isAdmin = $.discordAPI.isAdministrator(user);
                        }
                    }
                }
                Packages.tv.phantombot.event.EventBus.instance()
                    .postAsync(new Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent(
                        user, channel, message, cmd, argStr, isAdmin));
            }
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
        if (args.args) {
            if (args.event.getArgs()[0] === undefined) {
                $.say(args.args);
                return {cancel: true};
            } else {
                return {result: ''};
            }
        }
    }

    /*
     * @transformer twitchcommand
     * @formula (twitchcommand name:str) explicitly execute a command on Twitch chat, including when triggering from Discord, with given name and pass no args
     * @formula (twitchcommand name:str args:str) explicitly execute a command on Twitch chat, including when triggering from Discord, with given name and pass args
     * @labels twitch discord commandevent commands
     * @notes If this command tag is executed from Discord, the sender must have already performed `!account link`
     * on Discord for a sender to be defined in the command event and any Twitch chat permissions to apply;
     * Otherwise, the command executes with a blank sender
     */
    function twitchcommand(args) {
        let cmd;
        let pargs = $.parseArgs(args.args, ' ', 2, true);
        if (pargs !== null) {
            cmd = pargs[0];
            let argStr = '';

            if (pargs.length > 1) {
                argStr = pargs[1];
            }

            let sender = '';
            let tags = null;
            if (args.platform === 'discord') {
                sender = $.discord.resolveTwitchName(args.event.getSenderId());
                if (sender === null) {
                    sender = '';
                }
            } else {
                sender = args.event.getSender();
                tags = args.event.getTags();
            }
            
            Packages.tv.phantombot.event.EventBus.instance()
                .postAsync(new Packages.tv.phantombot.event.command.CommandEvent(
                    sender, cmd, argStr, tags));
        }

        return {
            result: ''
        };
    }

    let transformers = [
        new $.transformers.transformer('command', ['twitch', 'discord', 'commandevent', 'commands'], command),
        new $.transformers.transformer('commandslist', ['twitch', 'commandevent', 'commands'], commandslist),
        new $.transformers.transformer('count', ['twitch', 'discord', 'noevent', 'commandevent', 'commands'], count),
        new $.transformers.transformer('delaycommand', ['twitch', 'discord', 'commandevent', 'commands'], delaycommand),
        new $.transformers.transformer('discordcommand', ['twitch', 'discord', 'commandevent', 'commands'], discordcommand),
        new $.transformers.transformer('help', ['twitch', 'discord', 'commandevent', 'commands'], help),
        new $.transformers.transformer('twitchcommand', ['twitch', 'discord', 'commandevent', 'commands'], twitchcommand)
    ];

    $.transformers.addTransformers(transformers);
})();
