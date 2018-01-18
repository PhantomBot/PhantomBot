/*
 * streamElementsHandler.js
 *
 * Gets donation from the StreamElements API and posts them in Twitch chat.
 */
(function() {
    var message = $.getSetIniDbString('streamElementsHandler', 'message', $.lang.get('streamElements.donation.new')),
        toggle = $.getSetIniDbBoolean('streamElementsHandler', 'toggle', false),
        reward = $.getSetIniDbFloat('streamElementsHandler', 'reward', 0),
        group = $.getSetIniDbBoolean('streamElementsHandler', 'group', false),
        groupMin = $.getSetIniDbNumber('streamElementsHandler', 'groupMin', 5),
        dir = './addons/streamElements',
        announce = false;

    /*
     * @function reloadStreamElements
     */
    function reloadStreamElements() {
        message = $.getIniDbString('streamElementsHandler', 'message');
        toggle = $.getIniDbBoolean('streamElementsHandler', 'toggle');
        reward = $.getIniDbFloat('streamElementsHandler', 'reward');
        group = $.getIniDbBoolean('streamElementsHandler', 'group');
        groupMin = $.getIniDbNumber('streamElementsHandler', 'groupMin');
    }

    /*
     * @event streamElementsDonationInitialized
     */
    $.bind('streamElementsDonationInitialized', function(event) {
        if (!$.isDirectory(dir)) {
            $.consoleDebug('>> Creating the StreamElements Handler Directory: ' + dir);
            $.mkDir(dir);
        }

        $.consoleLn('>> Enabling StreamElements donation announcements');
        $.log.event('StreamElements donation announcements enabled');
        announce = true;
    });

    /*
     * @event streamElementsDonation
     */
    $.bind('streamElementsDonation', function(event) {
        var jsonString = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationObj = new JSONObject(jsonString),
            donationID = donationObj.getString('_id'),
            paramObj = donationObj.getJSONObject('donation'),
            donationUsername = paramObj.getJSONObject('user').getString('username'),
            donationCurrency = paramObj.getString('currency'),
            donationMessage = (paramObj.has('message') ? paramObj.getString('message') : ''),
            donationAmount = paramObj.getInt('amount'),
            s = message;

        if ($.inidb.exists('donations', donationID)) {
            return;
        }

        $.inidb.set('streamInfo', 'lastDonator', donationUsername);

        $.inidb.set('donations', donationID, donationObj);

        $.inidb.set('donations', 'last_donation', donationID);

        $.inidb.set('donations', 'last_donation_message', $.lang.get('main.donation.last.tip.message', donationUsername, donationCurrency, donationAmount));

        $.writeToFile(donationUsername + ": " + donationAmount + " ", dir + '/latestDonation.txt', false);

        if (toggle === true && announce === true) {
            if (s.match(/\(name\)/)) {
                s = $.replace(s, '(name)', donationUsername);
            }

            if (s.match(/\(currency\)/)) {
                s = $.replace(s, '(currency)', donationCurrency);
            }

            if (s.match(/\(amount\)/)) {
                s = $.replace(s, '(amount)', String(parseInt(donationAmount.toFixed(2))));
            }

            if (s.match(/\(amount\.toFixed\(0\)\)/)) {
                s = $.replace(s, '(amount.toFixed(0))', String(parseInt(donationAmount.toFixed(0))));
            }

            if (s.match(/\(message\)/)) {
                s = $.replace(s, '(message)', donationMessage);
            }

            if (s.match(/\(reward\)/)) {
                s = $.replace(s, '(reward)', $.getPointsString(Math.floor(parseFloat(donationAmount) * reward)));
            }

            $.say(s);
        }

        if (reward > 0) {
            $.inidb.incr('points', donationUsername.toLowerCase(), Math.floor(parseFloat(donationAmount) * reward));
        }

        if (group === true) {
            donationUsername = donationUsername.toLowerCase();
            $.inidb.incr('donations', donationUsername, donationAmount);
            if ($.inidb.exists('donations', donationUsername) && $.inidb.get('donations', donationUsername) >= groupMin) {
                if ($.getUserGroupId(donationUsername) > 3) {
                    $.setUserGroupById(donationUsername, '4');
                }
            }
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /*
         * @commandpath streamelements - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('streamelements')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donations.usage'));
                return;
            }

            /*
             * @commandpath streamelements toggledonators - Toggles the Donator's group.
             */
            if (action.equalsIgnoreCase('toggledonators')) {
                group = !group;
                $.setIniDbBoolean('streamElementsHandler', 'group', group);
                $.say($.whisperPrefix(sender) + (group ? $.lang.get('streamelements.enabled.donators') : $.lang.get('streamelements.disabled.donators')));
            }

            /*
             * @commandpath streamelements minmumbeforepromotion - Set the minimum before people get promoted to a Donator
             */
            if (action.equalsIgnoreCase('minmumbeforepromotion')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donators.min.usage'));
                    return;
                }

                groupMin = subAction;
                $.setIniDbNumber('streamElementsHandler', 'groupMin', groupMin);
                $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donators.min', groupMin));
            }

            /*
             * @commandpath streamelements announce - Toggles announcements for donations off and on
             */
            if (action.equalsIgnoreCase('announce')) {
                toggle = !toggle;
                $.setIniDbBoolean('streamElementsHandler', 'toggle', toggle);
                $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('streamelements.donations.announce.enable') : $.lang.get('streamelements.donations.announce.disable')));
            }

            /*
             * @commandpath streamelements rewardmultiplier [n.n] - Set a reward multiplier for donations.
             */
            if (action.equalsIgnoreCase('rewardmultiplier')) {
                if (isNaN(parseFloat(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donations.reward.usage'));
                    return;
                }

                reward = parseFloat(subAction);
                $.setIniDbFloat('streamElementsHandler', 'reward', reward);
                $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donations.reward.success', subAction, (subAction == "1" ? $.pointNameSingle : $.pointNameMultiple).toLowerCase()));
            }

            /*
             * @commandpath streamelements message [message text] - Set the donation message. Tags: (name), (amount), (reward), (message) and (currency)
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donations.message.usage'));
                    return;
                }

                var msg = args.splice(1).join(' ');
                if (msg.search(/\(name\)/) == -1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donations.message.no-name'));
                    return;
                }

                $.setIniDbString('streamElementsHandler', 'message', msg);

                message = $.getIniDbString('streamElementsHandler', 'message');

                $.say($.whisperPrefix(sender) + $.lang.get('streamelements.donations.message.success', msg));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/streamElementsHandler.js', 'streamelements', 1);
    });

    $.reloadStreamElements = reloadStreamElements;
})();