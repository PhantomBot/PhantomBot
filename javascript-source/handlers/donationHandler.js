/**
 * donationHandler.js
 *
 * Detect and report donations.
 */
(function() {
    var announceDonations = ($.inidb.exists('donations', 'announce') ? $.getIniDbBoolean('donations', 'announce') : true),
        donationReward = parseFloat($.inidb.exists('donations', 'reward') ? $.inidb.get('donations', 'reward') : 0),
        donationAddonDir = "./addons/donationHandler";

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
            donationMessage = donationJson.getString("message");

        if ($.inidb.exists('donations', donationID)) {
            return;
        }

        $.inidb.set('donations', donationID, donationJson);
        $.inidb.set('donations', 'last_donation', donationID);

        $.writeToFile(donationUsername + ": " + donationAmount.toFixed(2), donationAddonDir + "/latestDonation.txt", false);

        if (announceDonations) {
            if (donationReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                var rewardPoints = Math.round(donationAmount * donationReward);
                var donationSay = ($.inidb.exists('donations', 'rewardmessage') ? $.inidb.get('donations', 'rewardmessage') : $.lang.get('donationhandler.donation.newreward'));
                donationSay = donationSay.replace('(name)', donationUsername);
                donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
                donationSay = donationSay.replace('(points)', rewardPoints.toString());
                donationSay = donationSay.replace('(pointname)', (rewardPoints == 1 ? $.pointNameSingle : $.pointNameMultiple).toLowerCase());
                donationSay = donationSay.replace('(currency)', donationCurrency);
                $.say(donationSay);

                if ($.inidb.exists('points', donationUsername.toLowerCase())) {
                    $.inidb.incr('points', donationUsername.toLowerCase(), rewardPoints);
                }
            } else {
                var donationSay = ($.inidb.exists('donations', 'message') ? $.inidb.get('donations', 'message') : $.lang.get('donationhandler.donation.new'));
                donationSay = donationSay.replace('(name)', donationUsername);
                donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
                donationSay = donationSay.replace('(currency)', donationCurrency);
                $.say(donationSay);
            }
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
         * @commandpath lastdonation - Display the last donation.
         */
        if (command.equalsIgnoreCase('lastdonation')) {
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
                donationMessage = donationJson.getString("message");

            var donationSay = ($.inidb.exists('donations', 'lastmessage') ? $.inidb.get('donations', 'lastmessage') : $.lang.get('donationhandler.lastdonation.success'));
            donationSay = donationSay.replace('(name)', donationUsername);
            donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
            donationSay = donationSay.replace('(currency)', donationCurrency);
            $.say(donationSay);
        }

        /**
         * @commandpath donations - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('donations')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.usage'));
                return;
            }

            /**
             * @commandpath donations announce - Toggles announcements for donations off and on
             */
            if (args[0].equalsIgnoreCase('announce')) {
                if (announceDonations) {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.announce.disable'));
                    announceDonations = false;
                    $.inidb.set('donations', 'announce', 'false');
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.announce.enable'));
                    announceDonations = true;
                    $.inidb.set('donations', 'announce', 'true');
                }
                return;
            }

            /**
             * @commandpath donations reward [n.n] - Set a reward for donations.
             */
            if (args[0].equalsIgnoreCase('reward')) {
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
                return;
            }

            /**
             * @commandpath donations message [message text] - Set the message when no reward is given. Tags: (name), (amount) and (currency)
             * @commandpath donations rewardmessage [message text] - Set the message when a reward is given. Tags: (name), (amount), (currency), (points) and (pointname)
             * @commandpath donations lastmessage [message text] - Set the message for !lastdonation. Tags: (name), (amount) and (currency)
             */
            if (args[0].equalsIgnoreCase('message') || args[0].equalsIgnoreCase('rewardmessage') || args[0].equalsIgnoreCase('lastmessage')) {
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
                $.say($.whisperPrefix(sender) + $.lang.get('donationhandler.donations.' + comArg + '.success', message));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            $.registerChatCommand('./handlers/donationHandler.js', 'lastdonation', 7);
            $.registerChatCommand('./handlers/donationHandler.js', 'donations', 1);
        }
    });
})();
