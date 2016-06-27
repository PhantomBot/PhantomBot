/**
 * donationHandler.js
 *
 * Detect and report donations.
 */
(function() {
    var announceDonations = $.getSetIniDbBoolean('donations', 'announce', true),
        donationReward = $.getSetIniDbFloat('donations', 'reward', 0),
        donationMessage = $.getSetIniDbString('donations', 'message', $.lang.get('donationhandler.donation.new')),
        donationLastMsg = $.getSetIniDbString('donations', 'lastmessage', $.lang.get('donationhandler.lastdonation.success')),
        donationGroup = $.getSetIniDbBoolean('donations', 'donationGroup', false),
        donationGroupMin = $.getSetIniDbNumber('donations', 'donationGroupMin', 5),
        donationAddonDir = "./addons/donationHandler";

    /**
     * @function donationpanelupdate
     */
    function donationpanelupdate() {
        announceDonations = $.getIniDbBoolean('donations', 'announce');
        donationReward = $.getIniDbFloat('donations', 'reward');
        donationMessage = $.getIniDbString('donations', 'message');
        donationLastMsg = $.getIniDbString('donations', 'lastmessage');
        donationGroup = $.getIniDbBoolean('donations', 'donationGroup');
        donationGroupMin = $.getIniDbNumber('donations', 'donationGroupMin');
    };

    /**
     * @event twitchAlertsDonationsInitialized
     */
    $.bind('twitchAlertsDonationInitialized', function() {
        if (!$.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            return;
        }

        if (!$.isDirectory(donationAddonDir)) {
            $.consoleLn(">> Creating Donation Handler Directory: " + donationAddonDir);
            $.mkDir(donationAddonDir);
        }

        $.consoleLn(">> Enabling Twitch Alerts donation announcements");
        $.log.event('Donation announcements enabled');
        announceDonations = true;
    });

    /**
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

        $.inidb.set('streamInfo', 'lastDonator', $.username.resolve(donationID));
        $.inidb.set('donations', donationID, donationJson);
        $.inidb.set('donations', 'last_donation', donationID);

        $.writeToFile(donationUsername + ": " + donationAmount.toFixed(2), donationAddonDir + "/latestDonation.txt", false);

        if (announceDonations) {
            var rewardPoints = Math.round(donationAmount * donationReward);
            var donationSay = donationMessage;
            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(points)', rewardPoints.toString());
            donationSay = donationSay.replace('(pointname)', (rewardPoints == 1 ? $.pointNameSingle : $.pointNameMultiple).toLowerCase());
            donationSay = donationSay.replace('(currency)', donationCurrency);
            donationSay = donationSay.replace('(message)', donationMsg);
            $.say(donationSay);
        }

        if (donationGroup) { // if the Donation group is enabled.
            $.inidb.incr('donations', donationUsername.toLowerCase(), donationAmount.toFixed(2));
            if ($.inidb.exists('donations', donationUsername.toLowerCase()) && $.inidb.get('donations', donationUsername.toLowerCase()) >= donationGroupMin) { // Check if the donator donated enough in total before promoting him.
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

        /* Hidden from command list, for panel only. */
        if (command.equalsIgnoreCase('donationpanelupdate')) {
            donationpanelupdate();
        }

        /**
         * @commandpath lasttip - Display the last donation.
         */
        if (command.equalsIgnoreCase('lastdonation') || command.equalsIgnoreCase('lasttip')) {
            if (!$.inidb.exists('donations', 'last_donation')) {
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.lastdonation.no-donations'));
                return;
            }

            var donationID = $.inidb.get('donations', 'last_donation');
            if (!$.inidb.exists('donations', donationID)) {
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.lastdonation.404'));
                return;
            }

            var donationJsonStr = $.inidb.get('donations', donationID),
                JSONObject = Packages.org.json.JSONObject,
                donationJson = new JSONObject(donationJsonStr);

            var donationID = donationJson.getString("donation_id"),
                donationCreatedAt = donationJson.getString("created_at"),
                donationCurrency = donationJson.getString("currency"),
                donationAmount = parseFloat(donationJson.getString("amount")),
                donationUsername = donationJson.getString("name"),
                donationMsg = donationJson.getString("message");

            var donationSay = donationLastMsg;
            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(currency)', donationCurrency);
            $.say(donationSay);
        }

        /**
         * @commandpath tip - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('donations') || command.equalsIgnoreCase('tip')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.usage'));
                return;
            }

            /**
             * @commandpath tip toggledonators - Toggles the Donator's group.
             */
            if (args[0].equalsIgnoreCase('toggledonators')) {
                if (donationGroup) {
                    donationGroup = false;
                    $.inidb.set('donations', 'donationGroup', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.disabled.donators'));
                    $.log.event(sender + ' disabled donation Donator group.');
                } else {
                    donationGroup = true;
                    $.inidb.set('donations', 'donationGroup', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.enabled.donators'));
                    $.log.event(sender + ' enabled donation Donator group.');
                }
            }

            /**
             * @commandpath tip minmumbeforepromotion - Set the minimum before people get promoted to a Donator
             */
            if (args[0].equalsIgnoreCase('minmumbeforepromotion')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donators.min.usage'));
                    return;
                }
                donationGroupMin = args[1];
                $.inidb.set('donations', 'donationGroupMin', args[1]);
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donators.min', args[1]));
                $.log.event(sender + ' set the minimum before being promoted to a Donator was set to ' + args[1]);
            }

            /**
             * @commandpath tip announce - Toggles announcements for donations off and on
             */
            if (args[0].equalsIgnoreCase('announce')) {
                if (announceDonations) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.announce.disable'));
                    announceDonations = false;
                    $.inidb.set('donations', 'announce', 'false');
                    $.log.event(sender + ' disabled donation announcements');
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.announce.enable'));
                    announceDonations = true;
                    $.inidb.set('donations', 'announce', 'true');
                    $.log.event(sender + ' enabled donation announcements');
                }
                return;
            }

            /**
             * @commandpath tip rewardmultiplier [n.n] - Set a reward multiplier for donations.
             */
            if (args[0].equalsIgnoreCase('rewardmultiplier')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.reward.usage'));
                    return;
                }
                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.reward.usage'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.reward.success', args[1], (args[1] == "1" ? $.pointNameSingle : $.pointNameMultiple).toLowerCase()));
                $.inidb.set('donations', 'reward', args[1]);
                donationReward = parseFloat(args[1]);
                $.log.event(sender + ' changed donation reward to ' + args[1]);
                return;
            }

            /**
             * @commandpath tip message [message text] - Set the donation message. Tags: (name), (amount), (points), (pointname), (message) and (currency)
             * @commandpath tip lastmessage [message text] - Set the message for !lastdonation. Tags: (name), (amount) and (currency)
             */
            if (args[0].equalsIgnoreCase('message') || args[0].equalsIgnoreCase('lastmessage')) {
                var comArg = args[0].toLowerCase();

                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.' + comArg + '.usage'));
                    return;
                }

                var message = args.splice(1).join(' ');
                if (message.search(/\(name\)/) == -1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.' + comArg + '.no-name'));
                    return;
                }

                $.inidb.set('donations', comArg, message);

                donationMessage = $.getIniDbString('donations', 'message');
                donationLastMsg = $.getIniDbString('donations', 'lastmessage');

                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.' + comArg + '.success', message));
                $.log.event(sender + ' set the donation message to ' + message);
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            $.registerChatCommand('./handlers/donationHandler.js', 'lastdonation', 7);
            $.registerChatCommand('./handlers/donationHandler.js', 'lasttip', 7);
            $.registerChatCommand('./handlers/donationHandler.js', 'donations', 1);
            $.registerChatCommand('./handlers/donationHandler.js', 'tip', 1);
            $.registerChatCommand('./handlers/donationHandler.js', 'donationpanelupdate', 1);
        }
    });
})();
