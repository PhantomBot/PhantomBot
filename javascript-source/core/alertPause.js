/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
 * alertPause.js
 *
 * Pause the sounds and alerts that commands send to the stream overlay
 */
(function() {
    // 0 when alerts are not paused, -1 when they are paused until toggled, otherwise the time the pause ends.
    let pausedUntil = $.getSetIniDbNumber('alertPause', 'pausedUntil', 0);

    /**
     * @function setPausedUntil
     * @param {Number} until
     */
    function setPausedUntil(until) {
        $.setIniDbNumber('alertPause', 'pausedUntil', until);
        pausedUntil = until;
    }

    /**
     * @function pause
     * @export $.alertPause
     * @param {Number} [seconds] Pauses until unPause is called if not present
     */
    function pause(seconds) {
        if (seconds === undefined) {
            setPausedUntil(-1);
            $.say($.lang.get('alertpause.paused'));
        } else {
            setPausedUntil($.systemTime() + (seconds * 1e3));
            $.say($.lang.get('alertpause.paused.timed', $.getTimeString(seconds)));
        }
    }

    /**
     * @function unPause
     * @export $.alertPause
     */
    function unPause() {
        setPausedUntil(0);
        $.say($.lang.get('alertpause.resumed'));
    }

    /**
     * @function isPaused
     * @export $.alertPause
     * @returns {boolean}
     */
    function isPaused() {
        return pausedUntil < 0 || pausedUntil > $.systemTime();
    }

    /**
     * Gives back the points that will be taken for a command once its handler returns, for a command that was refused
     * Does nothing for an event that did not come through the command hook, such as a keyword, since nothing is taken for it
     *
     * @function returnCommandPrice
     * @export $.alertPause
     * @param {CommandEvent} event
     */
    function returnCommandPrice(event) {
        let sender = event.getSender(),
            command = event.getCommand(),
            subCommand = $.getSubCommandFromArguments(command, event.getArgs()),
            price = $.getCommandPrice(command, subCommand, '');

        if (price > 0 && event.isHandeled() && $.priceCom(sender, command, subCommand, $.checkUserPermission(sender, event.getTags(), $.PERMISSION.Mod)) === 0) {
            $.inidb.incr('points', sender, price);
        }
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        let sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs();

        /**
         * @commandpath togglealerts (seconds) - Pause or resume the sounds and alerts that commands, keywords and redemptions send to the stream overlay. If (seconds) is present, pause them for that amount of time
         */
        if ($.equalsIgnoreCase(command, 'togglealerts')) {
            if (args[0] === undefined) {
                if (isPaused()) {
                    unPause();
                } else {
                    pause();
                }
                return;
            }

            let seconds = parseInt(args[0]);

            if (isNaN(seconds) || seconds <= 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('togglealerts.usage'));
                return;
            }

            pause(seconds);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/alertPause.js', 'togglealerts', $.PERMISSION.Admin);
    });

    /** Export functions to API */
    $.alertPause = {
        pause: pause,
        unPause: unPause,
        isPaused: isPaused,
        returnCommandPrice: returnCommandPrice
    };
})();
