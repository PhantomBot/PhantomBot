/**
 * commandPause.js
 *
 * Pause using ANY command
 */
(function() {
    var isActive = $.getSetIniDbBoolean('commandPause', 'commandsPaused', false),
        defaultTime = $.getSetIniDbNumber('commandPause', 'defaultTime', 300),
        timerId = -1;

    /**
     * @function pause
     * @export $.commandPause
     * @param {Number} [seconds]
     */
    function pause(seconds) {
        seconds = (seconds ? seconds : defaultTime);
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
    };

    /**
     * @function isPaused
     * @export $.commandPause
     * @returns {boolean}
     */
    function isPaused() {
        return isActive;
    };

    /**
     * @function clear
     * @export $.commandPause
     */
    function unPause() {
        if (timerId > -1) {
            clearTimeout(timerId);
            $.setIniDbBoolean('commandPause', 'commandsPaused', false);
            isActive = false;
            timerId = -1;
            $.say($.lang.get('commandpause.ended'));
        }
    };

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
            if (args[0] != undefined || args[0] != null) {
                if (args[0] == 'clear') {
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
        if ($.bot.isModuleEnabled('./core/commandPause.js')) {
            $.registerChatCommand('./core/commandPause.js', 'pausecommands', 2);
        }
    });

    /** Export functions to API */
    $.commandPause = {
        pause: pause,
        isPaused: isPaused,
        unPause: unPause,
    };
})();
