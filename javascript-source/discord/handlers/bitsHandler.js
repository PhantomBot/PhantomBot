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
 * This module is to handle bits notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'bitsToggle', false),
        message = $.getSetIniDbString('discordSettings', 'bitsMessage', '(name) just cheered (amount) bits!'),
        channelName = $.getSetIniDbString('discordSettings', 'bitsChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/bitsHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'bitsToggle', false);
            message = $.getIniDbString('discordSettings', 'bitsMessage', '(name) just cheered (amount) bits!');
            channelName = $.getIniDbString('discordSettings', 'bitsChannel', '');
        }
    });

    /*
     * @function getCheerAmount
     *
     * @param {String} bits
     */
    function getCheerAmount(bits) {
        bits = parseInt(bits);

        switch (true) {
            case bits < 100:
                return '1';
            case bits >= 100 && bits < 1000:
                return '100';
            case bits >= 1000 && bits < 5000:
                return '1000';
            case bits >= 5000 && bits < 10000:
                return '5000';
            case bits >= 10000 && bits < 100000:
                return '10000';
            case bits >= 100000:
                return '100000';
            default:
                return '1';
        }
    }

    /*
     * @function getBitsColor
     *
     * @param {String} bits
     */
    function getBitsColor(bits) {
        bits = parseInt(bits);

        switch (true) {
            case bits < 100:
                return 0xa1a1a1;
            case bits >= 100 && bits < 1000:
                return 0x8618fc;
            case bits >= 1000 && bits < 5000:
                return 0x00f7db;
            case bits >= 5000 && bits < 10000:
                return 0x2845bc;
            case bits >= 10000 && bits < 100000:
                return 0xd41818;
            case bits >= 100000:
                return 0xfffa34;
            default:
                return 0xa1a1a1;
        }
    }

    /**
     * @event twitchBits
     */
    $.bind('twitchBits', function(event) {
        var username = event.getUsername(),
            bits = event.getBits(),
            ircMessage = event.getMessage(),
            emoteRegexStr = $.twitch.GetCheerEmotesRegex(),
            s = message;

        if (announce === false || toggle === false || channelName == '') {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', username);
        }

        if (s.match(/\(amount\)/g)) {
            s = $.replace(s, '(amount)', bits);
        }

        if ((ircMessage + '').length > 0) {
            if (emoteRegexStr.length() > 0) {
                emoteRegex = new RegExp(emoteRegexStr, 'gi');
                ircMessage = String(ircMessage).valueOf();
                ircMessage = ircMessage.replace(emoteRegex, '').trim();
            }
        }

        if (ircMessage.length > 0) {
        	$.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(getBitsColor(bits))
                    .withThumbnail('https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/' + getCheerAmount(bits) + '/1.gif')
                    .withTitle($.lang.get('discord.bitshandler.bits.embed.title'))
                    .appendDescription(s)
                    .appendField($.lang.get('discord.bitsHandler.bits.embed.messagetitle'), ircMessage, true)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
        } else {
        	$.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(getBitsColor(bits))
                    .withThumbnail('https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/' + getCheerAmount(bits) + '/1.gif')
                    .withTitle($.lang.get('discord.bitshandler.bits.embed.title'))
                    .appendDescription(s)
                    .withTimestamp(Date.now())
                    .withFooterText('Twitch')
                    .withFooterIcon($.twitchcache.getLogoLink()).build());
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

        if (command.equalsIgnoreCase('bitshandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.usage'));
                return;
            }

            /**
             * @discordcommandpath bitshandler toggle - Toggles bit announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'bitsToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath bitshandler message [message] - Sets the bit announcement message.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.message.usage'));
                    return;
                }

                message = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'bitsMessage', message);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.message.set', message));
            }

            /**
             * @discordcommandpath bitshandler channel [channel name] - Sets the channel bit announcements will be made in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'bitsChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/bitsHandler.js', 'bitshandler', 1);
        $.discord.registerSubCommand('bitshandler', 'toggle', 1);
        $.discord.registerSubCommand('bitshandler', 'message', 1);
        $.discord.registerSubCommand('bitshandler', 'channel', 1);

        announce = true;
    });
})();
