/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var channel = event.getDiscordChannel(),
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
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('8ball.usage'));
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
        $.discord.registerCommand('./discord/games/8ball.js', '8ball', 0);

        if (responseCount === 0) {
            loadResponses();
        }
    });
})();
