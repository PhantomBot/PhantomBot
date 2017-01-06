/**
 * This module is to handles the random game.
 */
(function() {
    var responseCountWin = 0,
        responseCountLost = 0,
        lastRandom = 0;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        for (var i = 1; $.lang.exists('roulette.win.' + i); i++) {
            responseCountWin++;
        }

        for (var i = 1; $.lang.exists('roulette.lost.' + i); i++) {
            responseCountLost++;
        }
    }

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var sender = event.getUsername(),
            channel = event.getChannel(),
            command = event.getCommand();

        /**
         * @discordcommandpath roulette - Pull the trigger and find out if there's a bullet in the chamber
         */
        if (command.equalsIgnoreCase('roulette')) {
            var r1 = $.randRange(1, 2),
                r2 = $.randRange(1, 2),
                random;

            if (r1 == r2) {
                do {
                    random = $.randRange(1, responseCountWin);
                } while (random == lastRandom);
                $.discord.say(channel, $.lang.get('roulette.win.' + random, sender));
            } else {
                do {
                    random = $.randRange(1, responseCountLost);
                } while (random == lastRandom);
                $.discord.say(channel, $.lang.get('roulette.lost.' + random, sender));
            }
            lastRandom = random;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/games/roulette.js')) {
            $.discord.registerCommand('./discord/games/roulette.js', 'roulette', 0);

            if (responseCountWin === 0 && responseCountLost === 0) {
                loadResponses();
            }

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
