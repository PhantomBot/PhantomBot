/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
 * 8ball.js
 *
 * A game that answers questions with random (Non-relating) answers
 */
(function() {
    var responseCount = 0,
        lastRandom = 0;

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('8ball.answer.' + i); i++) {
            responseCount++;
        }
        $.consoleDebug($.lang.get('8ball.console.loaded', responseCount));
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            random;

        /**
         * @commandpath 8ball [question] - Ask the 8ball for advice
         */
        if (command.equalsIgnoreCase('8ball')) {
            if (!args[0]) {
                $.say($.resolveRank(sender) + ' ' + $.lang.get('8ball.usage'));
                $.returnCommandCost(sender, command, $.isModv3(sender, event.getTags()));
                return
            }

            do {
                random = $.randRange(1, responseCount);
            } while (random == lastRandom);

            $.say($.lang.get('8ball.response', $.lang.get('8ball.answer.' + random)));
            lastRandom = random;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if (responseCount == 0) {
            loadResponses();
        }
        $.registerChatCommand('./games/8ball.js', '8ball', 7);
    });
})();
