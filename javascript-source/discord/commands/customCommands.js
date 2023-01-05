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

/**
 * This module is to handle custom commands for discord.
 */
(function () {

    /**
     * @function permCom
     *
     * @export $.discord
     * @param {string} command
     * @param {string} subCommand
     * @return {int}
     */
    function permCom(command, subCommand) {
        if (subCommand === '') {
            return $.discord.getCommandPermission(command);
        } else {
            return $.discord.getSubCommandPermission(command, subCommand);
        }
    }

    /**
     * @function loadCustomCommands
     *
     * @export $.discord
     */
    function loadCustomCommands() {
        if ($.bot.isModuleEnabled('./discord/commands/customCommands.js')) {
            var keys = $.inidb.GetKeyList('discordCommands', ''),
                    i;

            for (i = 0; i < keys.length; i++) {
                $.discord.registerCommand('./discord/commands/customCommands.js', keys[i], 0);
            }
        }
    }

    /*
     * @event discordChannelCommand
     * @usestransformers global discord commandevent noevent
     */
    $.bind('discordChannelCommand', function (event) {
        var channel = event.getDiscordChannel(),
                command = event.getCommand(),
                mention = event.getMention(),
                args = event.getArgs(),
                action = args[0],
                subAction = args[1];

        /**
         * Checks for custom commands, no command path needed here.
         */
        if ($.inidb.exists('discordCommands', command)) {
            var tag = $.transformers.tags(event, $.inidb.get('discordCommands', command), ['discord', ['commandevent', 'noevent']], {platform: 'discord'});
            if (tag !== null) {
                $.discord.say(channel, tag);
            }
            return;
        }

        /**
         * @discordcommandpath addcom [command] [response] - Adds a custom command to be used in your Discord server.
         */
        if (command.equalsIgnoreCase('addcom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.addcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if ($.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.addcom.err'));
                return;
            }

            $.inidb.set('discordCommands', action, args.slice(1).join(' '));
            $.discord.registerCommand('./discord/commands/customCommands.js', action, 0);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.addcom.success', action));
        }

        /**
         * @discordcommandpath editcom [command] [response] - Edits an existing command.
         */
        if (command.equalsIgnoreCase('editcom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.editcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.editcom.404'));
                return;
            }

            $.inidb.set('discordCommands', action, args.slice(1).join(' '));
            $.discord.registerCommand('./discord/commands/customCommands.js', action, 0);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.editcom.success', action));
        }

        /**
         * @discordcommandpath delcom [command] - Deletes a custom command.
         */
        if (command.equalsIgnoreCase('delcom')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delcom.404'));
                return;
            }

            $.inidb.del('discordCommands', action);
            $.discord.unregisterCommand(action);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delcom.success', action));
        }

        /**
         * @discordcommandpath channelcom [command] [channel / --global / --list] - Makes a command only work in that channel, separate the channels with commas (no spaces) for multiple, use --global as the channel to make the command global again.
         */
        if (command.equalsIgnoreCase('channelcom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.404'));
                return;
            }

            if (subAction.equalsIgnoreCase('--global') || subAction.equalsIgnoreCase('-g')) {
                $.inidb.del('discordChannelcom', action);
                $.discord.updateCommandChannel(action);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.global', action));
                return;
            } else if (subAction.equalsIgnoreCase('--list') || subAction.equalsIgnoreCase('-l')) {
                var keys = ($.inidb.exists('discordChannelcom', action) ? $.inidb.get('discordChannelcom', action).split(',') : []),
                        key = [],
                        i;

                for (i in keys) {
                    key.push('#' + keys[i]);
                }

                if (key.length !== 0) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + key.join(', '));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.404'));
                }
                return;
            }

            var keys = subAction.split(','),
                    key = [],
                    i;

            for (i in keys) {
                key.push($.discord.sanitizeChannelName(keys[i]));
            }

            $.inidb.set('discordChannelcom', action, key.join(','));
            $.discord.updateCommandChannel(action);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.channelcom.success', action, subAction.replace(',', ', ')));
        }

        /**
         * @discordcommandpath pricecom [command] [amount] - Sets a cost for that command, users must of their Twitch accounts linked for this to work.
         */
        if (command.equalsIgnoreCase('pricecom')) {
            if (action === undefined || (subAction === undefined || isNaN(parseInt(subAction)))) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.pricecom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.404'));
                return;
            }

            $.inidb.set('discordPricecom', action, subAction);
            $.discord.setCommandCost(action, subAction);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.pricecom.success', action, $.getPointsString(subAction)));
        }

        /**
         * @discordcommandpath aliascom [alias] [command] - Alias a command to another command, this only works with commands that have a single command.
         */
        if (command.equalsIgnoreCase('aliascom')) {
            if (action === undefined || subAction === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.aliascom.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            subAction = subAction.replace('!', '').toLowerCase();

            if (!$.discord.commandExists(subAction)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.404'));
                return;
            }

            $.inidb.set('discordAliascom', subAction, action);
            $.discord.setCommandAlias(subAction, action);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.aliascom.success', action, subAction));
        }

        /**
         * @discordcommandpath delalias [alias] - Removes the alias of that command.
         */
        if (command.equalsIgnoreCase('delalias')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delalias.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.discord.aliasExists(action)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.alias.404'));
                return;
            }

            var keys = $.inidb.GetKeyList('discordAliascom', ''),
                    i;
            for (i in keys) {
                if ($.inidb.get('discordAliascom', keys[i]).equalsIgnoreCase(action)) {
                    $.inidb.del('discordAliascom', keys[i]);
                    $.discord.removeAlias(keys[i], '');
                }
            }
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.customcommands.delalias.success', action));
        }

        /**
         * @discordcommandpath commands - Shows all of the custom commands you created.
         */
        if (command.equalsIgnoreCase('commands')) {
            var keys = $.inidb.GetKeyList('discordCommands', ''),
                    temp = [],
                    i;

            for (i = 0; i < keys.length; i++) {
                temp.push('!' + keys[i]);
            }

            $.paginateArrayDiscord(temp, 'discord.customcommands.commands', ', ', channel, mention);
        }

        /**
         * @discordcommandpath botcommands - Gives you a list of commands that you are allowed to use.
         */
        if (command.equalsIgnoreCase('botcommands')) {
            var keys = $.inidb.GetKeyList('discordPermcom', ''),
                    temp = [],
                    i;

            for (i = 0; i < keys.length; i++) {
                if (keys[i].indexOf(' ') === -1) {
                    temp.push('!' + keys[i]);
                }
            }
            $.paginateArrayDiscord(temp, 'discord.customcommands.bot.commands', ', ', channel, mention);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.discord.registerCommand('./discord/commands/customCommands.js', 'addcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'delcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'editcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'coolcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'channelcom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'pricecom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'aliascom', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'delalias', 1);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'commands', 0);
        $.discord.registerCommand('./discord/commands/customCommands.js', 'botcommands', 1);

        loadCustomCommands();
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./discord/commands/customCommands.js')) {
            if (event.getArguments().length() === 0) {
                if (!$.discord.commandExists(event.getArgs()[0])) {
                    $.discord.registerCommand('./discord/commands/customCommands.js', event.getArgs()[0], event.getArgs()[1]);
                } else {
                    $.discord.setCommandPermission(event.getArgs()[0], event.getArgs()[1]);
                    $.discord.setCommandCost(event.getArgs()[0], (event.getArgs()[4].length() === 0 ? '' : event.getArgs()[4]));
                    if (event.getArgs()[3].length() === 0) {
                        $.discord.removeAlias(event.getArgs()[0], $.inidb.get('discordAliascom', event.getArgs()[0]));
                    } else {
                        $.discord.setCommandAlias(event.getArgs()[0], (event.getArgs()[3].length() === 0 ? '' : event.getArgs()[3]));
                    }

                    if (event.getArgs()[2].length() === 0) {
                        $.inidb.del('discordChannelcom', event.getArgs()[0]);
                    } else {
                        $.inidb.set('discordChannelcom', event.getArgs()[0], String(event.getArgs()[2]).replace(/#/g, '').toLowerCase());
                    }

                    $.discord.updateCommandChannel(event.getArgs()[0]);
                }
            } else {
                $.discord.unregisterCommand(event.getArgs()[0]);
            }
        }
    });

    /* Export the function to the $.discord api. */
    $.discord.loadCustomCommands = loadCustomCommands;
    $.discord.permCom = permCom;
})();
