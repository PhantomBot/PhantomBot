/**
 * 8ball.js
 *
 * A game that answers questions with random (Non-relating) answers
 */
(function () {
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
    $.consoleLn($.lang.get('8ball.console.loaded', responseCount));
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        random;

    /**
     * @commandpath 8ball [question] - Ask the 8ball for advice
     */
    if (command.equalsIgnoreCase('8ball')) {
      if (!args[0]) {
        $.say($.whisperPrefix(sender) + $.lang.get('8ball.usage'));
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
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/8ball.js')) {
      loadResponses();
      $.registerChatCommand('./games/8ball.js', '8ball', 7);
    }
  });
})();