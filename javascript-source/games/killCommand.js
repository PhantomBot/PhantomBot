/**
 * killCommand.js
 *
 * Viewers can show each other the love of REAL friends by expressing it in pain.
 */
(function() {
    var selfMessageCount = 0,
        otherMessageCount = 0,
        lastRandom = -1,
        jailTimeout = $.getSetIniDbNumber('settings', 'killTimeoutTime', 60),
        lang,
        rand;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('killcommand.self.' + i); i++) {
            selfMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.other.' + i); i++) {
            otherMessageCount++;
        }
        $.consoleDebug($.lang.get('killcommand.console.loaded', selfMessageCount, otherMessageCount));
    };

    function selfKill(sender) {
        do {
            rand = $.randRange(1, selfMessageCount);
        } while (rand == lastRandom);
        $.say($.lang.get('killcommand.self.' + rand, $.resolveRank(sender)));
        lastRandom = rand;
    };

    function kill(sender, user) {
        do {
            rand = $.randRange(1, otherMessageCount);
        } while (rand == lastRandom);
        lang = $.lang.get('killcommand.other.' + rand, $.resolveRank(sender), $.resolveRank(user), jailTimeout, $.botName);
        if (lang.startsWith('(jail)')) {
            lang = $.replace(lang, '(jail)', '');
            $.say(lang);
            if (!$.isMod(sender) && jailTimeout > 0) {
                setTimeout(function () {
                    $.say('.timeout ' + sender + ' ' + jailTimeout);
                }, 1500);
            }
        } else {
            $.say(lang);
        }
        lastRandom = rand;
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();

        /**
         * @commandpath kill [username] - Kill a fellow viewer (not for real!), omit the username to kill yourself
         */
        if (command.equalsIgnoreCase('kill')) {
            if (args.length <= 0 || args[0].toLowerCase() == sender) {
                selfKill(sender);
            } else {
                kill(sender, args[0]);
            }
        }

        /**
         * @commandpath jailtimeouttime [amount in seconds] - Set the timeout time for jail time on the kill command.
         */
        if (command.equalsIgnoreCase('jailtimeouttime')) {
            if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.jail.timeout.usage'));
                return;
            }

            jailTimeout = args[0];
            $.inidb.set('settings', 'killTimeoutTime', args[0]);
            $.say($.whisperPrefix(sender) + $.lang.get('killcommand.jail.timeout.set', jailTimeout));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/killCommand.js')) {
            if (selfMessageCount == 0 && otherMessageCount == 0) {
               loadResponses();
            }
            $.registerChatCommand('./games/killCommand.js', 'kill', 7);
            $.registerChatCommand('./games/killCommand.js', 'jailtimeouttime', 1);
        }
    });
})();
