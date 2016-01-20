/**
 * roulette.js
 *
 * Resolve issues with a game of russian roulette.
 */
(function () {
  var timeoutTime = ($.inidb.exists('roulette', 'timeoutTime') ? parseInt($.inidb.get('roulette', 'timeoutTime')) : 60),
      responseCounts = {
        win: 0,
        lost: 0,
      },
      lastRandom = 0;

  /**
   * @function loadResponses
   */
  function loadResponses() {
    var i;

    for (i = 1; $.lang.exists('roulette.win.' + i); i++) {
      responseCounts.win++;
    }

    for (i = 1; $.lang.exists('roulette.lost.' + i); i++) {
      responseCounts.lost++;
    }

    $.consoleLn($.lang.get('roulette.console.loaded', responseCounts.win, responseCounts.lost));
  };

  /**
   * @function timeoutUser
   * @param {string} username
   */
  function timeoutUser(username) {
    $.timeoutUser(username, timeoutTime);
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        random,
        d1,
        d2;

    /**
     * @commandpath roulette - Pull the trigger and find out if there's a bullet in the chamber
     */
    if (command.equalsIgnoreCase('roulette')) {
      d1 = $.randRange(1, 2);
      d2 = $.randRange(1, 2);

      if (d1 == d2) {
        do {
          random = $.randRange(1, responseCounts.win);
        } while (random == lastRandom);
        $.say($.lang.get('roulette.win.' + random, $.resolveRank(sender)));
      } else {
        do {
          random = $.randRange(1, responseCounts.lost);
        } while (random == lastRandom);
        $.say($.lang.get('roulette.lost.' + random, $.resolveRank(sender)));
        if (!$.isModv3(sender, event.getTags())) {
          if ($.whisperMode) {
            $.say($.whisperPrefix(sender) + $.lang.get('roulette.timeout.notifyuser', timeoutTime));
          }
          timeoutUser(sender);
        }
      }
    }

    /**
     * @commandpath roulettetimeouttime [seconds] - Set the timeout time for the roulette command
     */
    if (command.equalsIgnoreCase('roulettetimeouttime')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (isNaN(parseInt(args[0]))) {
        $.say($.whisperPrefix(sender) + $.lang.get('roulette.set.timeouttime.usage'));
        return;
      }

      timeoutTime = parseInt(args[0]);
      $.inidb.set('roulette', 'timeoutTime', timeoutTime);
      $.say($.whisperPrefix(sender) + $.lang.get('roulette.set.timeouttime.success', timeoutTime));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/roulette.js')) {
      loadResponses();
      $.registerChatCommand('./games/roulette.js', 'roulette', 7);
    }
  });
})();