/**
 * roulette.js
 *
 * Resolve issues with a game of russian roulette.
 */
(function() {
    var timeoutTime = $.getSetIniDbNumber('roulette', 'timeoutTime', 60),
        responseCounts = {
            win: 0,
            lost: 0,
        },
        lastRandom = 0;

    function reloadRoulette () {
        timeoutTime = $.getIniDbNumber('roulette', 'timeoutTime');
    };

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;

        for (i = 1; $.lang.exists('roulette.win.' + i); i++) {
            responseCounts.win++;
        }

        for (i = 1; $.lang.exists('roulette.lost.' + i); i++) {
            responseCounts.lost++;
        }

        $.consoleDebug($.lang.get('roulette.console.loaded', responseCounts.win, responseCounts.lost));
    };

    /**
     * @function timeoutUser
     * @param {string} username
     */
    function timeoutUserR(username) {
        setTimeout(function() {
            $.say('.timeout ' + username + ' ' + timeoutTime);
        }, 1800);
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            random,
            d1,
            d2;

        /**
         * @commandpath roulette - Pull the trigger and find out if there's a bullet in the chamber
         */
        if (command.equalsIgnoreCase('roulette')) {
            d1 = $.randRange(1, 2);
            d2 = $.randRange(1, 2);

            if (d1 == d2) {
                do {
                    random = $.randRange(1, responseCounts.win);
                } while (random == lastRandom);
                $.say($.lang.get('roulette.win.' + random, $.resolveRank(sender)));
            } else {
                do {
                    random = $.randRange(1, responseCounts.lost);
                } while (random == lastRandom);
                $.say($.lang.get('roulette.lost.' + random, $.resolveRank(sender)));
                if (!$.isModv3(sender, event.getTags())) {
                    if ($.getBotWhisperMode()) {
                        $.say($.whisperPrefix(sender) + $.lang.get('roulette.timeout.notifyuser', timeoutTime));
                    }
                    timeoutUserR(sender);
                }
            }
        }

        /**
         * @commandpath roulettetimeouttime [seconds] - Sets for how long the user gets timed out for when loosing at roulette
         */
        if (command.equalsIgnoreCase('roulettetimeouttime')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (isNaN(parseInt(args[0]))) {
                $.say($.whisperPrefix(sender) + $.lang.get('roulette.set.timeouttime.usage'));
                return;
            }

            timeoutTime = parseInt(args[0]);
            $.inidb.set('roulette', 'timeoutTime', timeoutTime);
            $.say($.whisperPrefix(sender) + $.lang.get('roulette.set.timeouttime.success', timeoutTime));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/roulette.js')) {
            if (responseCounts.win == 0 && responseCounts.lost == 0) {
                loadResponses();
            }
            $.registerChatCommand('./games/roulette.js', 'roulette', 7);
            $.registerChatCommand('./games/roulette.js', 'roulettetimeouttime', 1);
        }
    });

    $.reloadRoulette = reloadRoulette;
})();
