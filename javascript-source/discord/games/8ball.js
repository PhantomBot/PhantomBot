/**
 * This module is to handles the 8ball game.
 */
(function() {
	var responseCount = 0,
        lastRandom = 0;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        for (var i = 1; $.lang.exists('8ball.answer.' + i); i++) {
            responseCount++;
        }
    }

    /**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @discordcommandpath 8ball [question] - Ask the magic 8ball a question.
         */
        if (command.equalsIgnoreCase('8ball')) {
        	if (action === undefined) {
        		$.discord.say(channel, $.discord.userPrefix(mention) + 'Usage: !8ball [question]');
        		return;
        	}

        	var random;
        	do {
        		random = $.randRange(1, responseCount);
        	} while (random == lastRandom);

        	$.discord.say(channel, $.lang.get('8ball.discord.response', $.lang.get('8ball.answer.' + random)));
        	lastRandom = random;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/games/8ball.js')) {
            $.discord.registerCommand('./discord/games/8ball.js', '8ball', 0);

            if (responseCount === 0) {
                loadResponses();
            }

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
