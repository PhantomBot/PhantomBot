/**
 * streamTipHandler.js
 *
 * Detect and report donations.
 */
(function() {
    var announceDonations = $.getSetIniDbBoolean('streamtip', 'announce', true),
        donationReward = $.getSetIniDbFloat('streamtip', 'reward', 0),
        donationMessage = $.getSetIniDbString('streamtip', 'message', $.lang.get('streamtip.donation.new')),
        donationLastMsg = $.getSetIniDbString('streamtip', 'lastmessage', $.lang.get('streamtip.lastdonation.success')),
        donationGroup = $.getSetIniDbBoolean('streamtip', 'donationGroup', false),
        donationGroupMin = $.getSetIniDbNumber('streamtip', 'donationGroupMin', 5),
        donationAddonDir = "./addons/streamTipHandler";

    /*
     * @function donationpanelupdate
     */
    function donationpanelupdate() {
        announceDonations = $.getIniDbBoolean('streamtip', 'announce');
        donationReward = $.getIniDbFloat('streamtip', 'reward');
        donationMessage = $.getIniDbString('streamtip', 'message');
        donationLastMsg = $.getIniDbString('streamtip', 'lastmessage');
        donationGroup = $.getIniDbBoolean('streamtip', 'donationGroup');
        donationGroupMin = $.getIniDbNumber('streamtip', 'donationGroupMin');
    }

    /*
     * @event streamTipDonationsInitialized
     */
    $.bind('streamTipDonationInitialized', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/streamTipHandler.js')) {
            return;
        }

        if (!$.isDirectory(donationAddonDir)) {
            $.consoleDebug(">> Creating StreamTip handler Directory: " + donationAddonDir);
            $.mkDir(donationAddonDir);
        }

        $.consoleLn(">> Enabling StreamTip donation announcements");
        $.log.event('Donation announcements enabled');
        announceDonations = true;
    });

    /*
     * @event streamTipDonations
     */
    $.bind('streamTipDonation', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/streamTipHandler.js')) {
            return;
        }

        var donationJsonStr = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationJson = new JSONObject(donationJsonStr);

        var donationID = donationJson.getString("_id"),
            donationCreatedAt = donationJson.getString("date"),
            donationCurrency = donationJson.getString("currencyCode"),
            donationCurrencySymbol = donationJson.getString("currencySymbol"),
            donationAmount = parseFloat(donationJson.getString("amount")),
            donationUsername = donationJson.getString("username"),
            donationMsg = donationJson.getString("note");

        if ($.inidb.exists('streamtip', donationID)) {
            return;
        }

        $.inidb.set('streamInfo', 'lastDonator', $.username.resolve(donationUsername));

        $.inidb.set('streamtip', donationID, donationJson);

        $.inidb.set('streamtip', 'last_donation', donationID);

        $.inidb.set('donations', 'last_donation_message', $.lang.get('main.donation.last.tip.message', donationUsername, donationCurrency, donationAmount.toFixed(2)));

        $.writeToFile(donationUsername + ": " + donationAmount.toFixed(2) + " ", donationAddonDir + "/latestDonation.txt", false);

        if (announceDonations) {
            var rewardPoints = Math.round(donationAmount * donationReward);
            var donationSay = donationMessage;
            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(amount.toFixed(0))', donationAmount.toFixed(0));
            donationSay = donationSay.replace('(points)', rewardPoints.toString());
            donationSay = donationSay.replace('(pointname)', (rewardPoints == 1 ? $.pointNameSingle : $.pointNameMultiple).toLowerCase());
            donationSay = donationSay.replace('(currency)', donationCurrency);
            donationSay = donationSay.replace('(currencysymbol)', donationCurrencySymbol);
            donationSay = donationSay.replace('(message)', donationMsg);
            $.say(donationSay);
        }

        if (donationGroup) {
            $.inidb.incr('streamtip', donationUsername.toLowerCase(), donationAmount.toFixed(2));
            if ($.inidb.exists('streamtip', donationUsername.toLowerCase()) && $.inidb.get('streamtip', donationUsername.toLowerCase()) >= donationGroupMin) {
                if ($.getUserGroupId(donationUsername.toLowerCase()) > 3) {
                    $.setUserGroupById(donationUsername.toLowerCase(), '4');
                }
            }
        }

        if ($.inidb.exists('points', donationUsername.toLowerCase()) && rewardPoints > 0) {
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
         * @commandpath streamtip - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('streamtip')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.usage'));
                return;
            }

            /*
             * @commandpath streamtip toggledonators - Toggles the Donator's group.
             */
            if (action.equalsIgnoreCase('toggledonators')) {
                donationGroup = !donationGroup;
                $.setIniDbBoolean('streamtip', 'donationGroup', donationGroup);
                $.say($.whisperPrefix(sender) + (donationGroup ? $.lang.get('streamtip.enabled.donators') : $.lang.get('streamtip.disabled.donators')));
            }

            /*
             * @commandpath streamtip minmumbeforepromotion - Set the minimum before people get promoted to a Donator
             */
            if (action.equalsIgnoreCase('minmumbeforepromotion')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donators.min.usage'));
                    return;
                }

                donationGroupMin = subAction;
                $.setIniDbNumber('streamtip', 'donationGroupMin', donationGroupMin);
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donators.min', donationGroupMin));
            }

            /*
             * @commandpath streamtip announce - Toggles announcements for donations off and on
             */
            if (action.equalsIgnoreCase('announce')) {
                announceDonations = !announceDonations;
                $.setIniDbBoolean('streamtip', 'announce', announceDonations);
                $.say($.whisperPrefix(sender) + (announceDonations ? $.lang.get('streamtip.donations.announce.enable') : $.lang.get('streamtip.donations.announce.disable')));
            }

            /*
             * @commandpath streamtip rewardmultiplier [n.n] - Set a reward multiplier for donations.
             */
            if (action.equalsIgnoreCase('rewardmultiplier')) {
                if (isNaN(parseFloat(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.reward.usage'));
                    return;
                }

                donationReward = parseFloat(subAction);
                $.setIniDbFloat('streamtip', 'reward', donationReward);
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.reward.success', subAction, (subAction == "1" ? $.pointNameSingle : $.pointNameMultiple).toLowerCase()));
            }

            /*
             * @commandpath streamtip message [message text] - Set the donation message. Tags: (name), (amount), (points), (pointname), (message) and (currency)
             */
            if (action.equalsIgnoreCase('message')) {
                var comArg = args[0].toLowerCase();

                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.message.usage'));
                    return;
                }

                var message = args.splice(1).join(' ');
                if (message.search(/\(name\)/) == -1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.message.no-name'));
                    return;
                }

                $.setIniDbString('streamtip', comArg, message);

                donationMessage = $.getIniDbString('streamtip', 'message');

                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.message.success', message));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/streamTipHandler.js')) {
            $.registerChatCommand('./handlers/streamTipHandler.js', 'streamtip', 1);
        }
    });

    $.donationpanelupdatestreamtip = donationpanelupdate;
})();
