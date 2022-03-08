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
 * This module is to handle hosts notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'hostToggle', false),
        hostMessage = $.getSetIniDbString('discordSettings', 'hostMessage', '(name) just hosted for (viewers) viewers!'),
        channelName = $.getSetIniDbString('discordSettings', 'hostChannel', ''),
        hosters = {},
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/hostHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'hostToggle', false);
            hostMessage = $.getIniDbString('discordSettings', 'hostMessage', '(name) just hosted for (viewers) viewers!');
            channelName = $.getIniDbString('discordSettings', 'hostChannel', '');
        }
    });

    /**
     * @event twitchHostsInitialized
     */
    $.bind('twitchHostsInitialized', function(event) {
        announce = true;
    });

    /**
     * @event twitchHosted
     */
    $.bind('twitchHosted', function(event) {
        var hoster = event.getHoster(),
            viewers = parseInt(event.getUsers()),
            now = $.systemTime(),
            s = hostMessage;

        if (announce === false || toggle === false || channelName == '') {
            return;
        }

        if (hosters[hoster] !== undefined) {
            if (hosters[hoster].time > now) {
                return;
            }
            hosters[hoster].time = now + 216e5;
        } else {
            hosters[hoster] = {};
            hosters[hoster].time = now + 216e5;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', hoster);
        }

        if (s.match(/\(viewers\)/g)) {
            s = $.replace(s, '(viewers)', String(viewers));
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(255, 0, 0)
                    .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/host-embed-icon.png')
                    .withTitle($.lang.get('discord.hosthandler.host.embedtitle'))
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

        if (command.equalsIgnoreCase('hosthandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.usage'));
                return;
            }

            /**
             * @discordcommandpath hosthandler toggle - Toggles the hosts announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'hostToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.host.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath hosthandler hostmessage [message] - Sets the host announcement message.
             */
            if (action.equalsIgnoreCase('hostmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.host.message.usage'));
                    return;
                }

                hostMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'hostMessage', hostMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.host.message.set', hostMessage));
            }

            /**
             * @discordcommandpath hosthandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'hostChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/hostHandler.js', 'hosthandler', 1);
        $.discord.registerSubCommand('hosthandler', 'toggle', 1);
        $.discord.registerSubCommand('hosthandler', 'hostmessage', 1);
        $.discord.registerSubCommand('hosthandler', 'channel', 1);
    });
})();
