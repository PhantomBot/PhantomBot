/**
 * roll.js
 *
 * A game where the bot will generate two random dices and award the sender with the points corresponding to the output.
 */
(function () {
  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        dice1 = $.randRange(1, 6),
        dice2 = $.randRange(1, 6),
        resultMessage = $.lang.get('roll.rolled', $.resolveRank(sender), dice1, dice2),
        total,
        price;

    /**
     * @commandpath roll - Roll the dice for some points
     */
    if (command.equalsIgnoreCase('roll')) {
      if (dice1 == dice2) {
        total = dice1 + dice2;
        price = (total * total);
        switch (total) {
          case 2:
            resultMessage += $.lang.get('roll.doubleone', $.getPointsString(price));
            break;
          case 4:
            resultMessage += $.lang.get('roll.doubletwo', $.getPointsString(price));
            break;
          case 6:
            resultMessage += $.lang.get('roll.doublethree', $.getPointsString(price));
            break;
          case 8:
            resultMessage += $.lang.get('roll.doublefour', $.getPointsString(price));
            break;
          case 10:
            resultMessage += $.lang.get('roll.doublefive', $.getPointsString(price));
            break;
          case 12:
            resultMessage += $.lang.get('roll.doublesix', $.getPointsString(price));
            break;
        }

        $.inidb.incr('points', sender, price);

        $.say(resultMessage + $.gameMessages.getWin(sender));
      } else {
        $.say(resultMessage + $.gameMessages.getLose(sender));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
      if ($.bot.isModuleEnabled('./games/roll.js')) {
        $.registerChatCommand('./games/roll.js', 'roll');
      }
    });
})();