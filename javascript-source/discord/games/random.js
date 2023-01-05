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
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var channel = event.getDiscordChannel(),
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
        $.discord.registerCommand('./discord/games/random.js', 'random', 0);

        if (responseCount === 0) {
            loadResponses();
        }
    });
})();
