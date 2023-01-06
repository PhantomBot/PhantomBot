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
 * random.js
 *
 * A command that randomly picks a random message from the the randoms stack and post it in the chat.
 */
(function() {
    var pg13toggle = $.getSetIniDbBoolean('randomSettings', 'pg13toggle', false),
        randomsCount = 0,
        lastRandom = 0,
        randomsPG13Count = 0,
        lastPG13Random = 0,
        _PG13Lock = new Packages.java.util.concurrent.locks.ReentrantLock(),
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./games/random.js')) {
            pg13toggle = $.getIniDbBoolean('randomSettings', 'pg13toggle');
        }
    });

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('randomcommand.' + i); i++) {
            randomsCount++;
        }

        for (i = 1; $.lang.exists('randomcommand.pg13.' + i); i++) {
            randomsPG13Count++;
        }

        $.consoleDebug($.lang.get('randomcommand.console.loaded', (randomsCount + randomsPG13Count)));
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            doPG13Random = false,
            rand;

        /**
         * @commandpath random - Something random will happen
         * @commandpath random pg13toggle - Toggle PG-13 mode on and off
         */
        if (command.equalsIgnoreCase('random')) {
            if (args[0] !== undefined) {
                if (args[0].equalsIgnoreCase('pg13toggle')) {
                    pg13toggle = !pg13toggle;
                    $.setIniDbBoolean('randomSettings', 'pg13toggle', pg13toggle);
                    $.say($.lang.get('randomcommand.pg13toggle', pg13toggle));
                    return;
                }
            }

            if ($.randRange(1, 100) > 80) {
                doPG13Random = true;
            }

            if (doPG13Random || pg13toggle) {
                _PG13Lock.lock();
                try {
                    do {
                        rand = $.randRange(1, randomsPG13Count);
                    } while (rand === lastPG13Random);

                    lastPG13Random = rand;
                } finally {
                    _PG13Lock.unlock();
                }

                $.say($.tags(event, $.lang.get('randomcommand.pg13.' + rand), false));
                return;
            }

            _lock.lock();
            try {
                do {
                    rand = $.randRange(1, randomsCount);
                } while (rand === lastRandom);

                lastRandom = rand;
            } finally {
                _lock.unlock();
            }

            $.say($.tags(event, $.lang.get('randomcommand.' + rand), false));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        loadResponses();
        $.registerChatCommand('./games/random.js', 'random');
        $.registerChatSubcommand('random', 'pg13toggle', $.PERMISSION.Admin);
    });
})();
