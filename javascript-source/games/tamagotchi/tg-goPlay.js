/**
 * tg-goPlay.js
 *
 * A simple module allowing the user the increase their tamagotchi's mood in exchange for food.
 */
(function () {
  var expLevelIncr = 0.10,
      funLevelIncr = 1.5,
      foodLevelDecr = 1;

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var command = event.getCommand(),
        sender = event.getSender();

    /**
     * @commandpath tgplay - Tell your tamagotchi to go play so it's happiness increases (slightly)
     */
    if (command.equalsIgnoreCase('tgplay')) {
      if ($.tamagotchi.tgExists(sender)) {
        var senderTG = $.tamagotchi.getByOwner(sender);

        $.say($.lang.get('tgplay.play', senderTG.name));

        senderTG
            .incrExpLevel(expLevelIncr)
            .incrFunLevel(funLevelIncr)
            .decrFoodLevel(foodLevelDecr)
            .save()
        ;
      } else {
        $.tamagotchi.say404(sender);
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/tamagotchi/tg-goPlay.js')) {
      $.registerChatCommand('./games/tamagotchi/tg-goPlay.js', 'tgplay', 6);
    }
  });
})();