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

/**
 * This module is to handle custom keywords in discord.
 */
(function () {

    /*
     * @event discordChannelMessage
     * @usestransformers global discord commandevent keywordevent noevent
     */
    $.bind('discordChannelMessage', function (event) {
        var message = event.getMessage(),
                channel = event.getDiscordChannel(),
                messagePartsLower = message.toLowerCase().split(' '),
                keys = $.inidb.GetKeyList('discordKeywords', ''),
                i;

        if (message.startsWith('!keyword')) {
            return;
        }

        function executeKeyword(keyword, response, event) {
            var cmdEvent = new Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent(event.getDiscordUser(), event.getDiscordChannel(),
                            event.getDiscordMessage(), 'keyword_' + keyword, response, event.isAdmin());
            var tag = $.transformers.tags(cmdEvent, response, ['discord', ['commandevent', 'keywordevent', 'noevent']], {platform: 'discord'});
            if (tag !== null) {
                $.discord.say(channel, tag);
            }
        }

        for (var i = 0; i < keys.length; i++) {
            var str = '',
                    caseAdjustedMessageParts = messagePartsLower;
            for (var idx = 0; idx < caseAdjustedMessageParts.length; idx++) {
                // Create a string to match on the keyword.
                str += (caseAdjustedMessageParts[idx] + ' ');
                // Either match on the exact word or phrase if it contains it.
                if ((keys[i].includes(' ') && str.includes(keys[i])) || (caseAdjustedMessageParts[idx] + '') === (keys[i] + '')) {
                    executeKeyword(keys[i], $.inidb.get('discordKeywords', keys[i]), event);
                    break;
                }
            }
        }
    });

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function (event) {
        var channel = event.getDiscordChannel(),
                command = event.getCommand(),
                mention = event.getMention(),
                args = event.getArgs(),
                action = args[0],
                subAction = args[1];

        if ($.equalsIgnoreCase(command, 'keyword')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.usage'));
                return;
            }

            /**
             * @discordcommandpath keyword add [keyword] [response] - Adds a custom keyword.
             */
            if ($.equalsIgnoreCase(action, 'add')) {
                if (subAction === undefined || args[2] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.add.usage'));
                    return;
                }

                if ($.inidb.exists('discordKeywords', subAction.toLowerCase())) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.add.error'));
                    return;
                }

                $.inidb.set('discordKeywords', subAction.toLowerCase(), args.slice(2).join(' '));
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.add.success', subAction));
            }

            /**
             * @discordcommandpath keyword edit [keyword] [response] - Edits a custom keyword.
             */
            if ($.equalsIgnoreCase(action, 'edit')) {
                if (subAction === undefined || args[2] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.edit.usage'));
                    return;
                }

                if (!$.inidb.exists('discordKeywords', subAction.toLowerCase())) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.404'));
                    return;
                }

                $.inidb.set('discordKeywords', subAction.toLowerCase(), args.slice(2).join(' '));
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.edit.success', subAction));
            }

            /**
             * @discordcommandpath keyword remove [keyword] - Removes a custom keyword.
             */
            if ($.equalsIgnoreCase(action, 'remove')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.remove.usage'));
                    return;
                }

                if (!$.inidb.exists('discordKeywords', subAction.toLowerCase())) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.404'));
                    return;
                }

                $.inidb.del('discordKeywords', subAction.toLowerCase());
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.remove.success', subAction));
            }
        }
    });

    /**
     * @event discordReady
     */
    $.bind('discordReady', function () {
        $.discord.registerCommand('./discord/handlers/keywordHandler.js', 'keyword', 1);
        $.discord.registerSubCommand('keyword', 'add', 1);
        $.discord.registerSubCommand('keyword', 'edit', 1);
        $.discord.registerSubCommand('keyword', 'remove', 1);
    });
})();
