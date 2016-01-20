/**
 * commandPause.js
 *
 * Pause using ANY command
 */
(function () {
  var isActive = false,
      defaultTime = ($.inidb.exists('commandPause', 'defaultTime') ? parseInt($.inidb.get('commandPause', 'defaultTime')) : 300),
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
      isActive = true;
    }
    timerId = setTimeout(function () {
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
      isActive = false;
      timerId = -1;
      $.say($.lang.get('commandpause.ended'));
    }
  };

  /**
   * @event event
   */
  $.bind('command', function (event) {
    var command = event.getCommand(),
        args = event.getArgs();

    /**
     * @commandpath pausecommands [seconds] - Pause all command usage for the given amount of time, ommit the seconds parameter to use the set default
     * @commandpath pausecommands clear - Unpause all commands of the pause is active
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
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
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