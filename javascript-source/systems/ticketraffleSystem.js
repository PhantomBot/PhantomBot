(function() {
    var cost = 0,
        entries = [],
        maxEntries = 0,
        followers = false,
        raffleStatus = false,
        msgToggle = ($.inidb.exists('settings', 'tRaffleMSGToggle') ? $.getIniDbBoolean('settings', 'tRaffleMSGToggle') : false),
        a = '';

    function checkArgs(user, max, price, followersOnly) {
        if (raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.opened'));
            return;
        }

        if (!max || !cost) {
            $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.err.missing.syntax'));
            return;
        }

        if (max) {
            maxEntries = parseInt(max);
        }

        if (price) {
            cost = parseInt(price);
        }

        if (followersOnly && followersOnly.equalsIgnoreCase('-followers')) {
            followers = true;
            a = $.lang.get('ticketrafflesystem.msg.need.to.be.follwing');
        }
        openRaffle(maxEntries, followers, cost, a);
    };

    function openRaffle(maxEntries, followers, cost, a) {
        $.say($.lang.get('ticketrafflesystem.raffle.opened', maxEntries, $.getPointsString(cost), a));
        raffleStatus = true;
    };

    function closeRaffle(user) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.not.opened'));
            return;
        }

        raffleStatus = false;
        followers = false;
        maxEntries = 0;
        cost = 0;
        a = '';

        $.say($.lang.get('ticketrafflesystem.raffle.closed'));
        winner();
        entries = [];
    };

    function winner(force) {
        if (entries.length == 0) {
            $.say($.lang.get('ticketrafflesystem.raffle.close.err'));
            return;
        }

        if (force) {
            $.say($.lang.get('ticketrafflesystem.raffle.repick', $.username.resolve($.randElement(entries))));
            return;
        }

        winner = $.randElement(entries);
        $.say($.lang.get('ticketrafflesystem.winner', $.username.resolve(winner)));
    };

    function enterRaffle(user, times) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.not.opened'));
            return;
        }

        if (times > maxEntries) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.only, buy.amount', maxEntries));
            return;
        }

        for (var i = 0, t = 0; i < entries.length; i++) {
            if (entries[i].equalsIgnoreCase(user)) {
                t++;
                if (t >= maxEntries) {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.litmi.hit', maxEntries));
                    return;
                }
            }
        }

        if (followers) {
            if (!$.user.isFollower(user)) {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.not.following'));
                return;
            }
        }

        if (cost > 0) {
            if (cost > $.getUserPoints(user)) {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.points', $.pointNameMultiple));
                return;
            }
        }

        $.inidb.decr('points', user, (times * cost));
        if (msgToggle) {
            $.say($.lang.get('ticketrafflesystem.entered', $.username.resolve(user), tickets));
        }
        for (var i = 0; i < times; i++) {
            entries.push(user);
        }
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath traffle [option] - Displays usage for the command
         */
        if (command.equalsIgnoreCase('traffle')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.usage'));
                return;
            }

            /**
             * @commandpath traffle [open] [max entries] [cost] [-followers] - Opens a ticket raffle. -followers is optional.
             */
            if (action.equalsIgnoreCase('open')) {
                checkArgs(sender, args[1], args[2], args[3]);
            }

            /**
             * @commandpath traffle [close] - Closes a ticket raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                closeRaffle(sender);
            }

            /**
             * @commandpath traffle [repick] - Picks a new winner for the ticket raffle
             */
            if (action.equalsIgnoreCase('repick')) {
                winner(true);
            }

            /**
             * @commandpath traffle [messagetoggle] - Toggles on and off a message when entering a ticket raffle
             */
            if (action.equalsIgnoreCase('messagetoggle')) {
                if (msgToggle) {
                    msgToggle = false;
                    $.inidb.set('settings', 'tRaffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.msg.disabled'));
                } else {
                    msgToggle = true;
                    $.inidb.set('settings', 'tRaffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.msg.enabled'));
                }
            }
        }

        /**
         * @commandpath tickets [amount] - Buy tickets to enter the ticket raffle.
         */
        if (command.equalsIgnoreCase('tickets')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.ticket.usage'));
                return;
            }
            enterRaffle(sender, parseInt(action));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/ticketRaffleSystem.js')) {
            $.registerChatCommand('./systems/ticketRaffleSystem.js', 'traffle', 2);
        }
    });
})();