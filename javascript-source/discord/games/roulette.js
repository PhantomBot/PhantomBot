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
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getUsername(),
            channel = event.getDiscordChannel(),
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
        $.discord.registerCommand('./discord/games/roulette.js', 'roulette', 0);

        if (responseCountWin === 0 && responseCountLost === 0) {
            loadResponses();
        }
    });
})();
