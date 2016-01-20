/**
 * killCommand.js
 *
 * Viewers can show each other the love of REAL friends by expressing it in pain.
 */
(function () {
  var selfMessageCount = 0,
      otherMessageCount = 0,
      lastRandom = -1;

  /**
   * @function loadResponses
   */
  function loadResponses() {
    var i;
    for (i = 1; $.lang.exists('killcommand.self.' + i); i++) {
      selfMessageCount++;
    }
    for (i = 1; $.lang.exists('killcommand.other.' + i); i++) {
      otherMessageCount++;
    }
    $.consoleLn($.lang.get('killcommand.console.loaded', selfMessageCount, otherMessageCount));
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        rand;

    /**
     * @commandpath kill [username] - Kill a fellow viewer (not for real tho!), ommit the username to kill yourself
     */
    if (command.equalsIgnoreCase('kill')) {
      if (args.length > 0) {
        do {
          rand = $.randRange(1, otherMessageCount);
        } while (rand == lastRandom);
        $.say($.lang.get('killcommand.other.' + rand, $.resolveRank(sender), $.resolveRank(args[0])));
      } else {
        do {
          rand = $.randRange(1, selfMessageCount);
        } while (rand == lastRandom);
        $.say($.lang.get('killcommand.self.' + rand, $.resolveRank(sender)));
      }
      lastRandom = rand;
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/killCommand.js')) {
      loadResponses();
      $.registerChatCommand('./games/killCommand.js', 'kill', 6);
    }
  });
})();