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
 * This module is to handle streamelements notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'streamelementsToggle', false),
        message = $.getSetIniDbString('discordSettings', 'streamelementsMessage', 'Thank you very much (name) for the tip of $(amount) (currency)!'),
        channelName = $.getSetIniDbString('discordSettings', 'streamelementsChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/streamElementsHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'streamelementsToggle', false);
            message = $.getIniDbString('discordSettings', 'streamelementsMessage', 'Thank you very much (name) for the tip of $(amount) (currency)!');
            channelName = $.getIniDbString('discordSettings', 'streamelementsChannel', '');
        }
    });

    /**
     * @event streamElementsDonationInitialized
     */
    $.bind('streamElementsDonationInitialized', function(event) {
        announce = true;
    });

    /**
     * @event streamElementsDonation
     */
    $.bind('streamElementsDonation', function(event) {
        if (announce === false || toggle === false || channelName == '') {
            return;
        }

        var jsonString = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationObj = new JSONObject(jsonString),
            donationID = donationObj.getString('_id'),
            paramObj = donationObj.getJSONObject('donation'),
            donationUsername = paramObj.getJSONObject('user').getString('username'),
            donationCurrency = paramObj.getString('currency'),
            donationMessage = (paramObj.has('message') ? paramObj.getString('message') : ''),
            donationAmount = paramObj.getFloat('amount'),
            s = message;

        if ($.inidb.exists('discordDonations', 'streamelements' + donationID)) {
            return;
        } else {
            $.inidb.set('discordDonations', 'streamelements' + donationID, 'true');
        }

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', donationUsername);
        }

        if (s.match(/\(currency\)/)) {
            s = $.replace(s, '(currency)', donationCurrency);
        }

        if (s.match(/\(amount\)/)) {
            s = $.replace(s, '(amount)', String(donationAmount.toFixed(2)));
        }

        if (s.match(/\(amount\.toFixed\(0\)\)/)) {
            s = $.replace(s, '(amount.toFixed(0))', String(donationAmount.toFixed(0)));
        }

        if (s.match(/\(message\)/)) {
            s = $.replace(s, '(message)', donationMessage);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withColor(87, 113, 220)
                    .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/streamelements-embed-icon.png')
                    .withTitle($.lang.get('discord.streamelementshandler.embed.title'))
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

        if (command.equalsIgnoreCase('streamelementshandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamelementshandler.usage'));
                return;
            }

            /**
             * @discordcommandpath streamelementshandler toggle - Toggles the streamelements donation announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'streamelementsToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamelementshandler.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath streamelementshandler message [message] - Sets the streamelements donation announcement message.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamelementshandler.message.usage'));
                    return;
                }

                message = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'streamelementsMessage', message);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamelementshandler.message.set', message));
            }

            /**
             * @discordcommandpath streamelementshandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamelementshandler.channel.usage'));
                    return;
                }

                channelName = $.discord.sanitizeChannelName(subAction);
                $.inidb.set('discordSettings', 'streamelementsChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamelementshandler.channel.set', subAction));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/streamElementsHandler.js', 'streamelementshandler', 1);
        $.discord.registerSubCommand('streamelementshandler', 'toggle', 1);
        $.discord.registerSubCommand('streamelementshandler', 'message', 1);
        $.discord.registerSubCommand('streamelementshandler', 'channel', 1);
    });
})();
