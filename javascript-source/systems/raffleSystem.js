(function() {
    var cost = 0,
        entries = [],
        keyword = '',
        followers = false,
        raffleStatus = false,
        msgToggle = ($.inidb.exists('settings', 'raffleMSGToggle') ? $.getIniDbBoolean('settings', 'raffleMSGToggle') : true),
        timer = 0,
        a = '';

    /**
     * @function checkArgs
     * @returns {boolean}
     */
    function checkArgs(user, key, price, t, followersOnly) {
        if (raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.opened'));
            return;
        }

        if (!key || !price) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.missing.syntax'));
            return;
        }

        if (price < 0) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.negative'));
            return;
        }

        if (key.contains('!')) {
            key = key.replace('!', '');
        }

        if (key) {
            keyword = key;
        }

        if (price) {
            cost = parseInt(price);
        }

        if (t) {
            timer = parseInt(t);
        }

        if (followersOnly && followersOnly.equalsIgnoreCase('-followers')) {
            followers = true;
            a = $.lang.get('rafflesystem.msg.need.to.be.follwing');
        }
        openRaffle(key, cost, followers, timer, a);
    };

    /**
     * @function openRaffle
     * @returns {opens raffle}
     */
    function openRaffle(key, cost, followers, timer, a) {
        $.say($.lang.get('rafflesystem.raffle.opened', $.getPointsString(cost), key, a));
        $.registerChatCommand('./systems/raffleSystem.js', key, 7);
        entries = [];
        raffleStatus = true;

        if (timer > 0) {
            var a = setInterval(function() {
                $.say($.lang.get('rafflesystem.warn', key));
                clearInterval(a);
            }, (timer / 2) * 1000);
            var b = setInterval(function() {
                closeRaffle();
                clearInterval(b);
            }, timer * 1000);
        }
    };

    /**
     * @function closeRaffle
     * @returns {closes raffle}
     */
    function closeRaffle(user, key) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.not.opened'));
            return;
        }

        resetRaffle();
        $.unregisterChatCommand(key);

        $.say($.lang.get('rafflesystem.raffle.closed'));
        winner();
    };

    /**
     * @function winner
     * @returns {winner}
     */
    function winner(force) {
        if (entries.length == 0) {
            $.say($.lang.get('rafflesystem.raffle.close.err'));
            return;
        }

        if (force) {
            $.say($.lang.get('rafflesystem.raffle.repick', $.username.resolve($.randElement(entries))));
            return;
        }

        var Winner = $.randElement(entries);
        $.say($.lang.get('rafflesystem.winner', $.username.resolve(Winner)));
    };

    /**
     * @function enterRaffle
     * @returns {message}
     */
    function enterRaffle(user, cost) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.not.opened'));
            return;
        }

        if (followers) {
            if (!$.user.isFollower(user)) {
                $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.not.following'));
                return;
            }
        }

        if ($.list.contains(entries, user)) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.enter.error.alreadyentered'));
            return;
        }

        if (cost > 0) {
            if (cost > $.getUserPoints(user)) {
                $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.points', $.pointNameMultiple));
                return;
            } else {
                $.inidb.decr('points', user, cost);
            }
        }

        if (msgToggle) {
            $.say($.lang.get('rafflesystem.entered', user)); //Removed $.username.resolve() to not abuse the api in a big channel.
        }

        entries.push(user);
    };

    /**
     * @function resetRaffle
     */
    function resetRaffle() {
        raffleStatus = false;
        followers = false;
        keyword = '';
        cost = 0;
        timer = 0;
        a = '';
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
         * @commandpath raffle [option] - Displays the usage of the raffle command
         */
        if (command.equalsIgnoreCase('raffle')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.usage'));
                return;
            }

            /**
             * @commandpath raffle open [keyword] [cost] [timer in seconds (use 0 if you dont want a timer)] [-followers] - Opens a raffle. -followers is optional.
             */
            if (action.equalsIgnoreCase('open')) {
                checkArgs(sender, args[1], args[2], args[3], args[4]);
            }

            /**
             * @commandpath raffle close - Closes a raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                closeRaffle(sender, keyword);
            }

            /**
             * @commandpath raffle repick - Picks a new winner for the raffle
             */
            if (action.equalsIgnoreCase('repick')) {
                winner(true);
            }

            /**
             * @commandpath raffle messagetoggle - Toggles on and off a message when entering a raffle
             */
            if (action.equalsIgnoreCase('messagetoggle')) {
                if (msgToggle) {
                    msgToggle = false;
                    $.inidb.set('settings', 'raffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.msg.disabled'));
                } else {
                    msgToggle = true;
                    $.inidb.set('settings', 'raffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.msg.enabled'));
                }
            }
        }

        if (command.equalsIgnoreCase(keyword)) {
            enterRaffle(sender, cost);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/raffleSystem.js')) {
            $.registerChatCommand('./systems/raffleSystem.js', 'raffle', 2);
        }
    });
})();
