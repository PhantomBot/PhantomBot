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

    /**
     * @function donationpanelupdate
     */
    function donationpanelupdate() {
        announceDonations = $.getIniDbBoolean('streamtip', 'announce');
        donationReward = $.getIniDbFloat('streamtip', 'reward');
        donationMessage = $.getIniDbString('streamtip', 'message');
        donationLastMsg = $.getIniDbString('streamtip', 'lastmessage');
        donationGroup = $.getIniDbBoolean('streamtip', 'donationGroup');
        donationGroupMin = $.getIniDbNumber('streamtip', 'donationGroupMin');
    };

    /**
     * @event streamTipDonationsInitialized
     */
    $.bind('streamTipDonationInitialized', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/streamTipHandler.js')) {
            return;
        }

        if (!$.isDirectory(donationAddonDir)) {
            $.consoleLn(">> Creating StreamTip handler Directory: " + donationAddonDir);
            $.mkDir(donationAddonDir);
        }

        $.consoleLn(">> Enabling Stream tip donation announcements");
        $.log.event('Donation announcements enabled');
        announceDonations = true;
    });

    /**
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

        $.writeToFile(donationUsername + ": " + donationAmount.toFixed(2), donationAddonDir + "/latestDonation.txt", false);

        if (announceDonations) {
            var rewardPoints = Math.round(donationAmount * donationReward);
            var donationSay = donationMessage;
            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(points)', rewardPoints.toString());
            donationSay = donationSay.replace('(pointname)', (rewardPoints == 1 ? $.pointNameSingle : $.pointNameMultiple).toLowerCase());
            donationSay = donationSay.replace('(currency)', donationCurrency);
            donationSay = donationSay.replace('(currencysymbol)', donationCurrencySymbol);
            donationSay = donationSay.replace('(message)', donationMsg);
            $.say(donationSay);
        }

        if (donationGroup) { // if the Donation group is enabled.
            $.inidb.incr('streamtip', donationUsername.toLowerCase(), donationAmount.toFixed(2));
            if ($.inidb.exists('streamtip', donationUsername.toLowerCase()) && $.inidb.get('streamtip', donationUsername.toLowerCase()) >= donationGroupMin) { // Check if the donator donated enough in total before promoting him.
                if ($.getUserGroupId(donationUsername.toLowerCase()) > 3) { // Check if the user is not a mod, or admin, or sub.
                    $.setUserGroupById(donationUsername.toLowerCase(), '4'); // Set user as a Donator
                }
            }
        }

        if ($.inidb.exists('points', donationUsername.toLowerCase()) && rewardPoints > 0) {
            $.inidb.incr('points', donationUsername.toLowerCase(), rewardPoints);
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();

        /**
         * @commandpath lasttip - Display the last donation.
         */
        if (command.equalsIgnoreCase('lastdonation') || command.equalsIgnoreCase('lasttip')) {
            if (!$.inidb.exists('streamtip', 'last_donation')) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.lastdonation.no-donations'));
                return;
            }

            var donationID = $.inidb.get('streamtip', 'last_donation');
            if (!$.inidb.exists('streamtip', donationID)) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.lastdonation.404'));
                return;
            }

            var donationJsonStr = $.inidb.get('streamtip', donationID),
                JSONObject = Packages.org.json.JSONObject,
                donationJson = new JSONObject(donationJsonStr);

            var donationID = donationJson.getString("donation_id"),
                donationCreatedAt = donationJson.getString("created_at"),
                donationCurrency = donationJson.getString("currency"),
                donationCurrencySymbol = donationJson.getString("currencySymbol"),
                donationAmount = parseFloat(donationJson.getString("amount")),
                donationUsername = donationJson.getString("name"),
                donationMsg = donationJson.getString("message");

            var donationSay = donationLastMsg;
            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(currency)', donationCurrency);
            donationSay = donationSay.replace('(currencysymbol)', donationCurrencySymbol);
            $.say(donationSay);
        }

        /**
         * @commandpath streamtip - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('streamtip')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.usage'));
                return;
            }

            /**
             * @commandpath streamtip toggledonators - Toggles the Donator's group.
             */
            if (args[0].equalsIgnoreCase('toggledonators')) {
                if (donationGroup) {
                    donationGroup = false;
                    $.inidb.set('streamtip', 'donationGroup', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.disabled.donators'));
                    $.log.event(sender + ' disabled donation Donator group.');
                } else {
                    donationGroup = true;
                    $.inidb.set('streamtip', 'donationGroup', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.enabled.donators'));
                    $.log.event(sender + ' enabled donation Donator group.');
                }
            }

            /**
             * @commandpath streamtip minmumbeforepromotion - Set the minimum before people get promoted to a Donator
             */
            if (args[0].equalsIgnoreCase('minmumbeforepromotion')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donators.min.usage'));
                    return;
                }
                donationGroupMin = args[1];
                $.inidb.set('streamtip', 'donationGroupMin', args[1]);
                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donators.min', args[1]));
                $.log.event(sender + ' set the minimum before being promoted to a Donator was set to ' + args[1]);
            }

            /**
             * @commandpath streamtip announce - Toggles announcements for donations off and on
             */
            if (args[0].equalsIgnoreCase('announce')) {
                if (announceDonations) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.announce.disable'));
                    announceDonations = false;
                    $.inidb.set('streamtip', 'announce', 'false');
                    $.log.event(sender + ' disabled donation announcements');
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.announce.enable'));
                    announceDonations = true;
                    $.inidb.set('streamtip', 'announce', 'true');
                    $.log.event(sender + ' enabled donation announcements');
                }
                return;
            }

            /**
             * @commandpath streamtip rewardmultiplier [n.n] - Set a reward multiplier for donations.
             */
            if (args[0].equalsIgnoreCase('rewardmultiplier')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.reward.usage'));
                    return;
                }
                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.reward.usage'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.reward.success', args[1], (args[1] == "1" ? $.pointNameSingle : $.pointNameMultiple).toLowerCase()));
                $.inidb.set('streamtip', 'reward', args[1]);
                donationReward = parseFloat(args[1]);
                $.log.event(sender + ' changed donation reward to ' + args[1]);
                return;
            }

            /**
             * @commandpath streamtip message [message text] - Set the donation message. Tags: (name), (amount), (points), (pointname), (message) and (currency)
             * @commandpath streamtip lastmessage [message text] - Set the message for !lastdonation. Tags: (name), (amount) and (currency)
             */
            if (args[0].equalsIgnoreCase('message') || args[0].equalsIgnoreCase('lastmessage')) {
                var comArg = args[0].toLowerCase();

                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.' + comArg + '.usage'));
                    return;
                }

                var message = args.splice(1).join(' ');
                if (message.search(/\(name\)/) == -1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.' + comArg + '.no-name'));
                    return;
                }

                $.inidb.set('streamtip', comArg, message);

                donationMessage = $.getIniDbString('streamtip', 'message');
                donationLastMsg = $.getIniDbString('streamtip', 'lastmessage');

                $.say($.whisperPrefix(sender) + $.lang.get('streamtip.donations.' + comArg + '.success', message));
                $.log.event(sender + ' set the donation message to ' + message);
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/streamTipHandler.js')) {
            $.registerChatCommand('./handlers/streamTipHandler.js', 'lasttip', 7);
            $.registerChatCommand('./handlers/streamTipHandler.js', 'streamtip', 1);
        }
    });
    $.donationpanelupdatestreamtip = donationpanelupdate;
})();
