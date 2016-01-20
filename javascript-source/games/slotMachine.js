/**
 * slotMachine.js
 *
 * When the user uses the slots, the bot will generate three random numbers.
 * These numbers represent an emote. Each emote has a value.
 * The amount of points; corresponding to the output, will be added to the user's balance.
 */
(function () {
  var emotes = ['Kappa', 'KappaPride', 'BloodTrail', 'jurajiOhNo', 'deIlluminati'],
      prices = [75, 150, 300, 450, 1000];

  /**
   * @function getEmoteKey
   * @returns {Number}
   */
  function getEmoteKey() {
    var rand = $.randRange(1, 1000);
    if (rand <= 75) {
      return 4;
    }
    if (rand > 75 && rand <= 200) {
      return 3;
    }
    if (rand > 200 && rand <= 450) {
      return 2;
    }
    if (rand > 450 && rand <= 700) {
      return 1;
    }
    if (rand > 700) {
      return 0;
    }
  };

  /**
   * @function calculateResult
   * @param {string} sender
   */
  function calculateResult(sender) {
    var e1 = getEmoteKey(),
        e2 = getEmoteKey(),
        e3 = getEmoteKey(),
        message = $.lang.get('slotmachine.result.start', $.username.resolve(sender), emotes[e1], emotes[e2], emotes[e3]);

    if (e1 == e2 && e2 == e3) {
      message += $.lang.get('slotmachine.result.win', $.getPointsString(prices[e1]));
      $.inidb.incr('points', sender, prices[e1]);
      $.say(message + $.gameMessages.getWin(sender));
      return;
    }
    if (e1 == e2 || e2 == e3 || e3 == e1) {
      message += $.lang.get('slotmachine.result.win', $.getPointsString(prices[e1] / 3));
      $.inidb.incr('points', sender, Math.floor(prices[Math.min(e1, e2, e3)] / 3));
      $.say(message + $.gameMessages.getWin(sender));
      return;
    }
    $.say(message + $.gameMessages.getLose(sender));
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var command = (event.getCommand() + '').toLowerCase(),
        sender = event.getSender().toLowerCase();

    /**
     * @commandpath slot - Play the slot machines for some points
     */
    if (command.equalsIgnoreCase('slot')) {
      calculateResult(sender);
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/slotMachine.js')) {
      $.registerChatCommand('./games/slotMachine.js', 'slot', 7);
    }
  });
})();