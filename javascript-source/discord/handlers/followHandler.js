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
 * This module is to handle follower announcements.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'followToggle', false),
        message = $.getSetIniDbString('discordSettings', 'followMessage', '(name) just followed!'),
        channelName = $.getSetIniDbString('discordSettings', 'followChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if ($.equalsIgnoreCase(event.getScript(), './discord/handlers/followHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'followToggle', false);
            message = $.getIniDbString('discordSettings', 'followMessage', '(name) just followed!');
            channelName = $.getIniDbString('discordSettings', 'followChannel', '');
        }
    });

    /**
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function(event) {
        announce = true;
    });

    /**
     * @event twitchFollow
     */
    $.bind('twitchFollow', function(event) {
        var follower = event.getFollower(),
            s = message;

        if (announce === false || toggle === false  || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', follower);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(20, 184, 102)
                    .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/follow-embed-icon.png')
                    .withTitle($.lang.get('discord.followhandler.follow.embedtitle'))
                    .appendDescription(s)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
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

        if ($.equalsIgnoreCase(command, 'followhandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.usage'));
                return;
            }

            /**
             * @discordcommandpath followhandler toggle - Toggles the follower announcements.
             */
            if ($.equalsIgnoreCase(action, 'toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'followToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath followhandler message [message] - Sets the follower announcement message.
             */
            if ($.equalsIgnoreCase(action, 'message')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.message.usage'));
                    return;
                }

                message = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'followMessage', message);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.message.set', message));
            }

            /**
             * @discordcommandpath followhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if ($.equalsIgnoreCase(action, 'channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'followChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/followHandler.js', 'followhandler', 1);
        $.discord.registerSubCommand('followhandler', 'toggle', 1);
        $.discord.registerSubCommand('followhandler', 'message', 1);
        $.discord.registerSubCommand('followhandler', 'channel', 1);
    });
})();
