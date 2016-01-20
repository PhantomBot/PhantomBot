/**
 * random.js
 *
 * A command that randomly picks a random message from the the randoms stack and post it in the chat.
 */
(function () {
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
    $.consoleLn($.lang.get('randomcommand.console.loaded', randomsCount));
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
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
      $.say($.replaceCommandTags($.lang.get('randomcommand.' + rand), event));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/random.js')) {
      loadResponses();
      $.registerChatCommand('./games/random.js', 'random');
    }
  });
})();