/*
 * tipeeestreamHandler.js
 *
 * Gets donation from the TipeeeStream API and posts them in Twitch chat.
 */
(function() {
    var message = $.getSetIniDbString('tipeeeStreamHandler', 'message', $.lang.get('tipeeestream.donation.new')),
        toggle = $.getSetIniDbBoolean('tipeeeStreamHandler', 'toggle', false),
        reward = $.getSetIniDbFloat('tipeeeStreamHandler', 'reward', 0),
        group = $.getSetIniDbBoolean('tipeeeStreamHandler', 'group', false),
        groupMin = $.getSetIniDbNumber('tipeeeStreamHandler', 'groupMin', 5),
        dir = './addons/tipeeeStream',
        announce = false;

    /*
     * @function reloadTipeeeStream
     */
    function reloadTipeeeStream() {
        message = $.getIniDbString('tipeeeStreamHandler', 'message');
        toggle = $.getIniDbBoolean('tipeeeStreamHandler', 'toggle');
        reward = $.getIniDbFloat('tipeeeStreamHandler', 'reward');
        group = $.getIniDbBoolean('tipeeeStreamHandler', 'group');
        groupMin = $.getIniDbNumber('tipeeeStreamHandler', 'groupMin');
    }

    /*
     * @event tipeeeStreamDonationInitialized
     */
    $.bind('tipeeeStreamDonationInitialized', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/tipeeeStreamHandler.js')) {
            return;
        }

        if (!$.isDirectory(dir)) {
            $.consoleDebug('>> Creating the TipeeeStream Handler Directory: ' + dir);
            $.mkDir(dir);
        }

        $.consoleLn('>> Enabling TipeeeStream donation announcements');
        $.log.event('TipeeeStream donation announcements enabled');
        announce = true;
    });

    /*
     * @event tipeeeStreamDonation
     */
    $.bind('tipeeeStreamDonation', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/tipeeeStreamHandler.js')) {
            return;
        }

        var jsonString = event.getJsonString(),
            JSONObject = Packages.org.json.JSONObject,
            donationObj = new JSONObject(jsonString),
            donationID = donationObj.getInt('id'),
            paramObj = donationObj.getJSONObject('parameters'),
            donationUsername = paramObj.getString('username'),
            donationCurrency = paramObj.getString('currency'),
            donationMessage = (paramObj.has('message') ? paramObj.getString('message') : ''),
            donationAmount = paramObj.getInt('amount'),
            donationFormattedAmount = donationObj.getString('formattedAmount'),
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
                s = $.replace(s, '(amount)', parseInt(donationAmount.toFixed(2)));
            }

            if (s.match(/\(amount\.toFixed\(0\)\)/)) {
                s = $.replace(s, '(amount.toFixed(0))', parseInt(donationAmount.toFixed(0)));
            }

            if (s.match(/\(message\)/)) {
                s = $.replace(s, '(message)', donationMessage);
            }

            if (s.match(/\(formattedamount\)/)) {
                s = $.replace(s, '(formattedamount)', donationFormattedAmount);
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
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /*
         * @commandpath tipeeestream - Controls various options for donation handling
         */
        if (command.equalsIgnoreCase('tipeeestream')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donations.usage'));
                return;
            }

            /*
             * @commandpath tipeeestream toggledonators - Toggles the Donator's group.
             */
            if (action.equalsIgnoreCase('toggledonators')) {
                group = !group;
                $.setIniDbBoolean('tipeeeStreamHandler', 'group', group);
                $.say($.whisperPrefix(sender) + (group ? $.lang.get('tipeeestream.enabled.donators') : $.lang.get('tipeeestream.disabled.donators')));
            }

            /*
             * @commandpath tipeeestream minmumbeforepromotion - Set the minimum before people get promoted to a Donator
             */
            if (action.equalsIgnoreCase('minmumbeforepromotion')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donators.min.usage'));
                    return;
                }

                groupMin = subAction;
                $.setIniDbNumber('tipeeeStreamHandler', 'groupMin', groupMin);
                $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donators.min', groupMin));
            }

            /*
             * @commandpath tipeeestream announce - Toggles announcements for donations off and on
             */
            if (action.equalsIgnoreCase('announce')) {
                toggle = !toggle;
                $.setIniDbBoolean('tipeeeStreamHandler', 'toggle', toggle);
                $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('tipeeestream.donations.announce.enable') : $.lang.get('tipeeestream.donations.announce.disable')));
            }

            /*
             * @commandpath tipeeestream rewardmultiplier [n.n] - Set a reward multiplier for donations.
             */
            if (action.equalsIgnoreCase('rewardmultiplier')) {
                if (isNaN(parseFloat(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donations.reward.usage'));
                    return;
                }

                reward = parseFloat(subAction);
                $.setIniDbFloat('tipeeeStreamHandler', 'reward', reward);
                $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donations.reward.success', subAction, (subAction == "1" ? $.pointNameSingle : $.pointNameMultiple).toLowerCase()));
            }

            /*
             * @commandpath tipeeestream message [message text] - Set the donation message. Tags: (name), (amount), (reward), (message) and (currency)
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donations.message.usage'));
                    return;
                }

                var msg = args.splice(1).join(' ');
                if (msg.search(/\(name\)/) == -1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donations.message.no-name'));
                    return;
                }

                $.setIniDbString('tipeeeStreamHandler', 'message', msg);

                message = $.getIniDbString('tipeeeStreamHandler', 'message');

                $.say($.whisperPrefix(sender) + $.lang.get('tipeeestream.donations.message.success', msg));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/tipeeeStreamHandler.js')) {
            $.registerChatCommand('./handlers/tipeeeStreamHandler.js', 'tipeeestream', 1);
        }
    });

    $.reloadTipeeeStream = reloadTipeeeStream;
})();
