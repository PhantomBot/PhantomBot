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

/**
 * This module is to handle custom keywords in discord.
 */
(function () {

    /*
     * @event discordChannelMessage
     * @usestransformers global discord commandevent keywordevent noevent
     */
    $.bind('discordChannelMessage', function (event) {
        var message = event.getMessage().toLowerCase(),
                channel = event.getDiscordChannel(),
                keys = $.inidb.GetKeyList('discordKeywords', ''),
                i;

        for (i in keys) {
            // Some users use special symbols that may break regex so this will fix that.
            let sent = false;
            try {
                if (message.match('\\b' + keys[i] + '\\b') && !message.includes('!keyword')) {
                    var kevent1 = new Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent(event.getDiscordUser(), event.getDiscordChannel(),
                            event.getDiscordMessage(), 'keyword_' + keys[i], message, event.isAdmin());
                    var tag = $.transformers.tags(kevent1, $.inidb.get('discordKeywords', keys[i]), ['discord', ['commandevent', 'keywordevent', 'noevent']], {platform: 'discord'});
                    if (tag !== null) {
                        $.discord.say(channel, tag);
                    }
                    sent = true;
                    break;
                }
            } catch (e) {
                try {
                    if (!sent && message.includes(keys[i]) && !message.includes('!keyword')) {
                        var kevent2 = new Packages.tv.phantombot.event.discord.channel.DiscordChannelCommandEvent(event.getDiscordUser(), event.getDiscordChannel(),
                                event.getDiscordMessage(), 'keyword_' + keys[i], message, event.isAdmin());
                        var tag = $.transformers.tags(kevent2, $.inidb.get('discordKeywords', keys[i]), ['discord', ['commandevent', 'keywordevent', 'noevent']], {platform: 'discord'});
                        if (tag !== null) {
                            $.discord.say(channel, tag);
                        }
                        break;
                    }
                } catch (e) {
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

        if (command.equalsIgnoreCase('keyword')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.keywordhandler.usage'));
                return;
            }

            /**
             * @discordcommandpath keyword add [keyword] [response] - Adds a custom keyword.
             */
            if (action.equalsIgnoreCase('add')) {
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
            if (action.equalsIgnoreCase('edit')) {
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
            if (action.equalsIgnoreCase('remove')) {
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
     * @event initReady
     */
    $.bind('initReady', function () {
        $.discord.registerCommand('./discord/handlers/keywordHandler.js', 'keyword', 1);
        $.discord.registerSubCommand('keyword', 'add', 1);
        $.discord.registerSubCommand('keyword', 'edit', 1);
        $.discord.registerSubCommand('keyword', 'remove', 1);
    });
})();
