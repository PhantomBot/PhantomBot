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
 * commandPause.js
 *
 * Pause using ANY command
 */
(function() {
    var isActive = $.getSetIniDbBoolean('commandPause', 'commandsPaused', false),
        defaultTime = $.getSetIniDbNumber('commandPause', 'defaultTime', 300),
        timerId,
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function pause
     * @export $.commandPause
     * @param {Number} [seconds]
     */
    function pause(seconds) {
        seconds = (seconds !== undefined ? seconds : defaultTime);
        _lock.lock();
        try {
            if (isActive) {
                clearTimeout(timerId);
            } else {
                $.setIniDbBoolean('commandPause', 'commandsPaused', true);
                isActive = true;
            }

            timerId = setTimeout(function() {
                unPause();
            }, seconds * 1e3);
            $.say($.lang.get('commandpause.initiated', $.getTimeString(seconds)));
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function isPaused
     * @export $.commandPause
     * @returns {boolean}
     */
    function isPaused() {
        _lock.lock();
        try {
            return isActive;
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function clear
     * @export $.commandPause
     */
    function unPause() {
        _lock.lock();
        try {
            if (timerId !== undefined) {
                clearTimeout(timerId);
                $.setIniDbBoolean('commandPause', 'commandsPaused', false);
                isActive = false;
                timerId = undefined;
                $.say($.lang.get('commandpause.ended'));
            } else {
                $.say($.lang.get('commandpause.notactive'));
            }
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @event event
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs();

        /**
         * @commandpath pausecommands [seconds] - Pause all command usage for the given amount of time. If [seconds] is not present, uses a default value
         * @commandpath pausecommands clear - Unpause commands
         */
        if (command.equalsIgnoreCase('pausecommands')) {
            if (args[0] !== undefined || args[0] !== null) {
                if ($.jsString(args[0]) === 'clear') {
                    unPause();
                    return;
                }

                if (!isNaN(parseInt(args[0]))) {
                    pause(parseInt(args[0]));
                } else {
                    pause();
                }
            } else {
                $.say($.lang.get('pausecommands.usage'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/commandPause.js', 'pausecommands', $.PERMISSION.Mod);
    });

    /** Export functions to API */
    $.commandPause = {
        pause: pause,
        isPaused: isPaused,
        unPause: unPause
    };
})();
