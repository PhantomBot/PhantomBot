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
 * donationHandler.js
 *
 * Detect and report donations from TwitchAlerts.
 */
(function () {
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
     * @event streamLabsDonationInitialized
     */
    $.bind('streamLabsDonationInitialized', function (event) {
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
     * @event streamLabsDonation
     */
    $.bind('streamLabsDonation', function (event) {
        if (!$.bot.isModuleEnabled('./handlers/donationHandler.js')) {
            return;
        }

        var donationJson = event.getData();

        var donationID = donationJson.get("donation_id").toString(),
                donationCurrency = donationJson.getString("currency"),
                donationAmount = parseFloat(donationJson.getString("amount")),
                donationUsername = donationJson.getString("name"),
                donationMsg = donationJson.getString("message");

        if ($.inidb.exists('donations', donationID)) {
            return;
        }

        $.inidb.set('donations', donationID, event.getJsonString());

        $.inidb.set('streamInfo', 'lastDonator', $.username.resolve(donationUsername));

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

            if (donationSay.match(/\(alert [,.\w\W]+\)/g)) {
                var filename = donationSay.match(/\(alert ([,.\w\W]+)\)/)[1];
                $.alertspollssocket.alertImage(filename);
                donationSay = (donationSay + '').replace(/\(alert [,.\w\W]+\)/, '');
                if (donationSay == '') {
                    return null;
                }
            }

            if (donationSay.match(/\(playsound\s([a-zA-Z1-9_]+)\)/g)) {
                if (!$.audioHookExists(donationSay.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1])) {
                    $.log.error('Could not play audio hook: Audio hook does not exist.');
                } else {
                    $.alertspollssocket.triggerAudioPanel(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1]);
                }
                donationSay = $.replace(donationSay, donationSay.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[0], '');
                if (donationSay == '') {
                    return null;
                }
            }

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
    $.bind('command', function (event) {
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
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/donationHandler.js', 'streamlabs', 1);
    });

    $.donationpanelupdate = donationpanelupdate;
})();
