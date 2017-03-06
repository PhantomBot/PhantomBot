/**
 * donationHandler.js
 *
 * Detect and report donations from TwitchAlerts.
 */
(function() {
    var announceDonations = $.getSetIniDbBoolean('donations', 'announce', false),
        donationReward = $.getSetIniDbFloat('donations', 'reward', 0),
        donationMessage = $.getSetIniDbString('donations', 'message', $.lang.get('donationhandler.donation.new')),
        donationGroup = $.getSetIniDbBoolean('donations', 'donationGroup', false),
        donationGroupMin = $.getSetIniDbNumber('donations', 'donationGroupMin', 5),
        donationAddonDir = './addons/donationHandler',
        announceDonationsAllowed = false;

    /*
     * @function donationpanelupdate
     */
    function donationpanelupdate() {
        announceDonations = $.getIniDbBoolean('donations', 'announce');
        donationReward = $.getIniDbFloat('donations', 'reward');
        donationMessage = $.getIniDbString('donations', 'message');
        donationGroup = $.getIniDbBoolean('donations', 'donationGroup');
        donationGroupMin = $.getIniDbNumber('donations', 'donationGroupMin');
    }

    /*
     * @event twitchAlertsDonationsInitialized
     */
    $.bind('twitchAlertsDonationInitialized', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            return;
        }

        if (!$.isDirectory(donationAddonDir)) {
            $.consoleDebug('>> Creating Donation Handler Directory: ' + donationAddonDir);
            $.mkDir(donationAddonDir);
        }

        $.consoleLn('>> Enabling StreamLabs donation announcements');
        $.log.event('Donation announcements enabled');
        announceDonationsAllowed = true;
    });

    /*
     * @event twitchAlertsDonations
     */
    $.bind('twitchAlertsDonation', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            return;
        }

        var donationJsonStr = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationJson = new JSONObject(donationJsonStr);

        var donationID = donationJson.getString("donation_id"),
            donationCreatedAt = donationJson.getString("created_at"),
            donationCurrency = donationJson.getString("currency"),
            donationAmount = parseFloat(donationJson.getString("amount")),
            donationUsername = donationJson.getString("name"),
            donationMsg = donationJson.getString("message");

        if ($.inidb.exists('donations', donationID)) {
            return;
        }

        $.inidb.set('streamInfo', 'lastDonator', $.username.resolve(donationUsername));

        $.inidb.set('donations', donationID, donationJson);

        $.inidb.set('donations', 'last_donation', donationID);

        $.inidb.set('donations', 'last_donation_message', $.lang.get('main.donation.last.tip.message', donationUsername, donationCurrency, donationAmount.toFixed(2)));

        $.writeToFile(donationUsername + ": " + donationAmount.toFixed(2) + " ", donationAddonDir + "/latestDonation.txt", false);

        if (announceDonations && announceDonationsAllowed) {
            var rewardPoints = Math.round(donationAmount * donationReward);
            var donationSay = donationMessage;

            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(amount.toFixed(0))', donationAmount.toFixed(0));
            donationSay = donationSay.replace('(points)', rewardPoints.toString());
            donationSay = donationSay.replace('(pointname)', (rewardPoints == 1 ? $.pointNameSingle : $.pointNameMultiple).toLowerCase());
            donationSay = donationSay.replace('(currency)', donationCurrency);
            donationSay = donationSay.replace('(message)', donationMsg);
            $.say(donationSay);
        }

        if (donationGroup) {
            $.inidb.incr('donations', donationUsername.toLowerCase(), parseInt(donationAmount.toFixed(2)));
            if ($.inidb.exists('donations', donationUsername.toLowerCase()) && $.inidb.get('donations', donationUsername.toLowerCase()) >= donationGroupMin) {
                if ($.getUserGroupId(donationUsername.toLowerCase()) > 3) { 
                    $.setUserGroupById(donationUsername.toLowerCase(), '4');
                }
            }
        }

        if (rewardPoints > 0) {
            $.inidb.incr('points', donationUsername.toLowerCase(), rewardPoints);
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /*
         * @commandpath streamlabs - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('streamlabs')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.usage'));
                return;
            }

            /*
             * @commandpath streamlabs toggledonators - Toggles the Donator's group.
             */
            if (action.equalsIgnoreCase('toggledonators')) {
                donationGroup = !donationGroup;
                $.setIniDbBoolean('donations', 'donationGroup', donationGroup);
                $.say($.whisperPrefix(sender) + (donationGroup ? $.lang.get('donationhandler.enabled.donators') : $.lang.get('donationhandler.disabled.donators')));
            }

            /*
             * @commandpath streamlabs minmumbeforepromotion - Set the minimum before people get promoted to a Donator
             */
            if (action.equalsIgnoreCase('minmumbeforepromotion')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donators.min.usage'));
                    return;
                }

                donationGroupMin = subAction;
                $.setIniDbNumber('donations', 'donationGroupMin', donationGroupMin);
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donators.min', donationGroupMin));
            }

            /*
             * @commandpath streamlabs announce - Toggles announcements for donations off and on
             */
            if (action.equalsIgnoreCase('announce')) {
                announceDonations = !announceDonations;
                $.setIniDbBoolean('donations', 'announce', announceDonations);
                $.say($.whisperPrefix(sender) + (announceDonations ? $.lang.get('donationhandler.donations.announce.enable') : $.lang.get('donationhandler.donations.announce.disable')));
            }

            /*
             * @commandpath streamlabs rewardmultiplier [n.n] - Set a reward multiplier for donations.
             */
            if (action.equalsIgnoreCase('rewardmultiplier')) {
                if (isNaN(parseFloat(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.reward.usage'));
                    return;
                }

                donationReward = parseFloat(subAction);
                $.setIniDbFloat('donations', 'reward', donationReward);
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.reward.success', subAction, (subAction == "1" ? $.pointNameSingle : $.pointNameMultiple).toLowerCase()));
            }

            /*
             * @commandpath streamlabs message [message text] - Set the donation message. Tags: (name), (amount), (points), (pointname), (message) and (currency)
             */
            if (action.equalsIgnoreCase('message') || action.equalsIgnoreCase('lastmessage')) {
                var comArg = action.toLowerCase();

                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.message.usage'));
                    return;
                }

                var message = args.splice(1).join(' ');
                if (message.search(/\(name\)/) === -1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.message.no-name'));
                    return;
                }

                $.setIniDbString('donations', comArg, message);

                donationMessage = $.getIniDbString('donations', 'message');

                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.message.success', message));
            }

            /*
             * @commandpath streamlabs currencycode [currencycode] - Set a currency code to convert all Streamlabs donations to.
             * @commandpath streamlabs currencycode erase - Removes the currency code.
             */
            if (action.equalsIgnoreCase('currencycode')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.streamlabs.currencycode.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('erase')) {
                    $.inidb.del('donations', 'currencycode');
                    Packages.com.illusionaryone.TwitchAlertsAPIv1.instance().SetCurrencyCode('');
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.streamlabs.currencycode.success-erase'));
                } else {
                    $.setIniDbString('donations', 'currencycode', subAction);
                    Packages.com.illusionaryone.TwitchAlertsAPIv1.instance().SetCurrencyCode(subAction);
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.streamlabs.currencycode.success', subAction));
                }
            }
        }
    });

    /**
     * Registers commands once the bot is fully loaded.
     *
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            $.registerChatCommand('./handlers/donationHandler.js', 'streamlabs', 1);
        }
    });

    $.donationpanelupdate = donationpanelupdate;
})();
