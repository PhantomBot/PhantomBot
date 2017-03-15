/**
 * This module is to handle StreamLabs notifications.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('discordSettings', 'streamlabsToggle', false),
        message = $.getSetIniDbString('discordSettings', 'streamlabsMessage', 'Thank you very much (name) for the tip of $(amount) (currency)!'),
        channelName = $.getSetIniDbString('discordSettings', 'streamlabsChannel', ''),
        announce = false;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/streamlabsHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'streamlabsToggle', false);
            message = $.getIniDbString('discordSettings', 'streamlabsMessage', 'Thank you very much (name) for the tip of $(amount) (currency)!');
            channelName = $.getIniDbString('discordSettings', 'streamlabsChannel', '');
        }
    });

    /**
     * @event twitchAlertsDonationsInitialized
     */
    $.bind('twitchAlertsDonationInitialized', function(event) {
        announce = true;
    });

    /**
     * @event twitchAlertsDonations
     */
    $.bind('twitchAlertsDonation', function(event) {
        if (toggle === false || announce === false || channelName == '') {
            return;
        }

        var donationJsonStr = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationJson = new JSONObject(donationJsonStr),
            donationID = donationJson.get("donation_id"),
            donationCurrency = donationJson.getString("currency"),
            donationAmount = donationJson.getString("amount"),
            donationUsername = donationJson.getString("name"),
            donationMsg = donationJson.getString("message"),
            s = message;

        if ($.inidb.exists('discordDonations', 'streamlabs' + donationID)) {
            return;
        } else {
            $.inidb.set('discordDonations', 'streamlabs' + donationID, 'true');
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

        $.discord.say(channelName, s);
    });

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('streamlabshandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamlabshandler.usage'));
                return;
            }

            /**
             * @discordcommandpath streamlabshandler toggle - Toggles the StreamLabs donation announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'streamlabsToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamlabshandler.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            }

            /**
             * @discordcommandpath streamlabshandler message [message] - Sets the StreamLabs donation announcement message.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamlabshandler.message.usage'));
                    return;
                }

                message = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'streamlabsMessage', message);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamlabshandler.message.set', message));
            }

            /**
             * @discordcommandpath streamlabshandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamlabshandler.channel.usage'));
                    return;
                }

                channelName = subAction.replace('#', '').toLowerCase();
                $.inidb.set('discordSettings', 'streamlabsChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamlabshandler.channel.set', channelName));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/streamlabsHandler.js')) {
            $.discord.registerCommand('./discord/handlers/streamlabsHandler.js', 'streamlabshandler', 1);
            $.discord.registerSubCommand('streamlabshandler', 'toggle', 1);
            $.discord.registerSubCommand('streamlabshandler', 'message', 1);
            $.discord.registerSubCommand('streamlabshandler', 'channel', 1);

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
