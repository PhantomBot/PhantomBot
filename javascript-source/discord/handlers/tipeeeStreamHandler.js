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
 * This module is to handle tipeeestream notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'tipeeestreamToggle', false),
        message = $.getSetIniDbString('discordSettings', 'tipeeestreamMessage', 'Thank you very much (name) for the tip of (formattedamount) (currency)!'),
        channelName = $.getSetIniDbString('discordSettings', 'tipeeestreamChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/tipeeeStreamHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'tipeeestreamToggle', false);
            message = $.getIniDbString('discordSettings', 'tipeeestreamMessage', 'Thank you very much (name) for the tip of (formattedamount) (currency)!');
            channelName = $.getIniDbString('discordSettings', 'tipeeestreamChannel', '');
        }
    });

    /**
     * @event tipeeeStreamDonationInitialized
     */
    $.bind('tipeeeStreamDonationInitialized', function(event) {
        announce = true;
    });

    /**
     * @event tipeeeStreamDonation
     */
    $.bind('tipeeeStreamDonation', function(event) {
        if (announce === false || toggle === false || channelName == '') {
            return;
        }

        var jsonString = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationObj = new JSONObject(jsonString),
            donationID = donationObj.getInt('id'),
            paramObj = donationObj.getJSONObject('parameters'),
            donationUsername = paramObj.getString('username'),
            donationCurrency = paramObj.getString('currency'),
            donationMessage = (paramObj.has('message') ? paramObj.getString('message') : ''),
            donationAmount = paramObj.getInt('amount'),
            donationFormattedAmount = donationObj.getString('formattedAmount'),
            s = message;

        if ($.inidb.exists('discordDonations', 'tipeeestream' + donationID)) {
            return;
        } else {
            $.inidb.set('discordDonations', 'tipeeestream' + donationID, 'true');
        }

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', donationUsername);
        }

        if (s.match(/\(currency\)/)) {
            s = $.replace(s, '(currency)', donationCurrency);
        }

        if (s.match(/\(amount\)/)) {
            s = $.replace(s, '(amount)', donationAmount.toFixed(2));
        }

        if (s.match(/\(amount\.toFixed\(0\)\)/)) {
            s = $.replace(s, '(amount.toFixed(0))', donationAmount.toFixed(0));
        }

        if (s.match(/\(message\)/)) {
            s = $.replace(s, '(message)', donationMessage);
        }

        if (s.match(/\(formattedamount\)/)) {
            s = $.replace(s, '(formattedamount)', donationFormattedAmount);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(216, 67, 89)
                    .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/tipeeestream-embed-icon.png')
                    .withTitle($.lang.get('discord.tipeeestreamhandler.embed.title'))
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

        if (command.equalsIgnoreCase('tipeeestreamhandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.tipeeestreamhandler.usage'));
                return;
            }

            /**
             * @discordcommandpath tipeeestreamhandler toggle - Toggles the TipeeeStream donation announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'tipeeestreamToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.tipeeestreamhandler.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath tipeeestreamhandler message [message] - Sets the TipeeeStream donation announcement message.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.tipeeestreamhandler.message.usage'));
                    return;
                }

                message = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'tipeeestreamMessage', message);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.tipeeestreamhandler.message.set', message));
            }

            /**
             * @discordcommandpath tipeeestreamhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.tipeeestreamhandler.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'tipeeestreamChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.tipeeestreamhandler.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/tipeeeStreamHandler.js', 'tipeeestreamhandler', 1);
        $.discord.registerSubCommand('tipeeestreamhandler', 'toggle', 1);
        $.discord.registerSubCommand('tipeeestreamhandler', 'message', 1);
        $.discord.registerSubCommand('tipeeestreamhandler', 'channel', 1);
    });
})();
