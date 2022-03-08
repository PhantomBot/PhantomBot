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

/**
 * This module is to handle Twitter notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'twitterToggle', false),
        channelName = $.getSetIniDbString('discordSettings', 'twitterChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/twitterHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'twitterToggle', false);
            channelName = $.getIniDbString('discordSettings', 'twitterChannel', '');
        }
    });

    /**
     * @event twitter
     */
    $.bind('twitter', function(event) {
        if (toggle === false || announce === false || channelName == '') {
            return;
        }

        if (event.getMentionUser() != null) {
            $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                .withTitle($.twitter.getUsername())
                .withUrl('https://twitter.com/' + $.twitter.getUsername())
                .withColor(31, 158, 242)
                .withTimestamp(Date.now())
                .withFooterText('Twitter')
                .withFooterIcon('https://abs.twimg.com/icons/apple-touch-icon-192x192.png')
                .withAuthorName($.lang.get('discord.twitterhandler.tweet'))
                .withDesc('[' + event.getMentionUser() + '](https://twitter.com/' + event.getMentionUser() + '): ' + event.getTweet())
                .build());
        } else {
            // Send the message as an embed.
            $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                .withTitle($.twitter.getUsername())
                .withUrl('https://twitter.com/' + $.twitter.getUsername())
                .withColor(31, 158, 242)
                .withTimestamp(Date.now())
                .withFooterText('Twitter')
                .withFooterIcon('https://abs.twimg.com/icons/apple-touch-icon-192x192.png')
                .withAuthorName($.lang.get('discord.twitterhandler.tweet'))
                .withDesc(event.getTweet())
                .build());
        }
    });

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('twitterhandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.usage'));
                return;
            }

            /**
             * @discordcommandpath twitterhandler toggle - Toggles Twitter announcements. Note this module will use settings from the main Twitter module.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'twitterToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath twitterhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'twitterChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/twitterHandler.js', 'twitterhandler', 1);
        $.discord.registerSubCommand('twitterhandler', 'toggle', 1);
        $.discord.registerSubCommand('twitterhandler', 'channel', 1);

        announce = true;
    });
})();
