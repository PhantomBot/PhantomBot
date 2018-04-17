/**
 * This module is to handle StreamTip notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'streamtipToggle', false),
        message = $.getSetIniDbString('discordSettings', 'streamtipMessage', 'Thank you very much (name) for the tip of $(amount) (currency)!'),
        channelName = $.getSetIniDbString('discordSettings', 'streamtipChannel', ''),
        announce = false;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/streamtipHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'streamtipToggle', false);
            message = $.getIniDbString('discordSettings', 'streamtipMessage', 'Thank you very much (name) for the tip of $(amount) (currency)!');
            channelName = $.getIniDbString('discordSettings', 'streamtipChannel', '');
        }
    });

    /**
     * @event streamTipDonationInitialized
     */
    $.bind('streamTipDonationInitialized', function(event) {
        announce = true;
    });

    /**
     * @event streamTipDonation
     */
    $.bind('streamTipDonation', function(event) {
        if (announce === false || toggle === false || channelName == '') {
            return;
        }

        var donationJsonStr = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationJson = new JSONObject(donationJsonStr),
            donationID = donationJson.getString("_id"),
            donationCreatedAt = donationJson.getString("date"),
            donationCurrency = donationJson.getString("currencyCode"),
            donationCurrencySymbol = donationJson.getString("currencySymbol"),
            donationAmount = donationJson.getString("amount"),
            donationUsername = donationJson.getString("username"),
            donationMsg = donationJson.getString("note"),
            s = message;

        if ($.inidb.exists('discordDonations', 'streamtip' + donationID)) {
            return;
        } else {
            $.inidb.set('discordDonations', 'streamtip' + donationID, 'true');
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', donationUsername);
        }

        if (s.match(/\(amount\)/g)) {
            s = $.replace(s, '(amount)', parseInt(donationAmount).toFixed(2).toString());
        }

        if (s.match(/\(amount\.toFixed\(0\)\)/)) {
            s = $.replace(s, '(amount.toFixed(0))', parseInt(donationAmount).toFixed(0).toString());
        }

        if (s.match(/\(currency\)/g)) {
            s = $.replace(s, '(currency)', donationCurrency);
        }

        if (s.match(/\(message\)/g)) {
            s = $.replace(s, '(message)', donationMsg);
        }

        $.discordAPI.sendMessageEmbed(channelName, new Packages.sx.blah.discord.util.EmbedBuilder()
                    .withColor(60, 141, 188)
                    .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/streamtip-embed-icon.png')
                    .withTitle($.lang.get('discord.streamtiphandler.embed.title'))
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
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('streamtiphandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamtiphandler.usage'));
                return;
            }

            /**
             * @discordcommandpath streamtiphandler toggle - Toggles the StreamTip donation announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'streamtipToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamtiphandler.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath streamtiphandler message [message] - Sets the StreamTip donation announcement message.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamtiphandler.message.usage'));
                    return;
                }

                message = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'streamtipMessage', message);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamtiphandler.message.set', message));
            }

            /**
             * @discordcommandpath streamtiphandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamtiphandler.channel.usage'));
                    return;
                }

                channelName = subAction.replace('#', '').toLowerCase();
                $.inidb.set('discordSettings', 'streamtipChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamtiphandler.channel.set', channelName));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/handlers/streamtipHandler.js', 'streamtiphandler', 1);
        $.discord.registerSubCommand('streamtiphandler', 'toggle', 1);
        $.discord.registerSubCommand('streamtiphandler', 'message', 1);
        $.discord.registerSubCommand('streamtiphandler', 'channel', 1);
    });
})();