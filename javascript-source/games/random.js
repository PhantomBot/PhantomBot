/*
 * Copyright (C) 2016-2018 phantombot.tv
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
 * random.js
 *
 * A command that randomly picks a random message from the the randoms stack and post it in the chat.
 */
(function() {
    var randomsCount = 0,
        lastRandom = 0;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('randomcommand.' + i); i++) {
            randomsCount++;
        }
        $.consoleDebug($.lang.get('randomcommand.console.loaded', randomsCount));
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            rand;

        /**
         * @commandpath random - Something random will happen
         */
        if (command.equalsIgnoreCase('random')) {
            do {
                rand = $.randRange(1, randomsCount);
            } while (rand == lastRandom);
            lastRandom = rand;
            $.say($.tags(event, $.lang.get('randomcommand.' + rand), false));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if (randomsCount == 0) {
            loadResponses();
        }

        $.registerChatCommand('./games/random.js', 'random');
    });
})();