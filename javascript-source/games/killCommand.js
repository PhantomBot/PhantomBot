/**
 * killCommand.js
 *
 * Viewers can show each other the love of REAL friends by expressing it in pain.
 */
(function() {
    var selfMessageCount = 0,
        otherMessageCount = 0,
        lastRandom = -1,
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
        $.say($.lang.get('killcommand.other.' + rand, $.resolveRank(sender), $.resolveRank(user)));
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
        }
    });
})();
