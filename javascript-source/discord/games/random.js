/**
 * This module is to handles the random game.
 */
(function() {
	var responseCount = 0,
        lastRandom = 0;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        for (var i = 1; $.lang.exists('randomcommand.' + i); i++) {
            responseCount++;
        }
    }

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var channel = event.getChannel(),
            command = event.getCommand();

        /**
         * @discordcommandpath random - Will display something really random.
         */
        if (command.equalsIgnoreCase('random')) {
            var random;
        	do {
        		random = $.randRange(1, responseCount);
        	} while (random == lastRandom);

        	$.discord.say(channel, $.tags(event, $.lang.get('randomcommand.' + random), false));
        	lastRandom = random;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/games/random.js')) {
            $.discord.registerCommand('./discord/games/random.js', 'random', 0);

            if (responseCount === 0) {
                loadResponses();
            }

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
