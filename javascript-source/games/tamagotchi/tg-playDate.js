/**
 * tg-playdate.js
 *
 * Enable viewers to have their tamagotchis go on a playdate for increasing mood levels.
 */
(function () {
  var
      funLevelIncr = ($.inidb.exists('tamagotchiPlayDateSettings', 'funLevelIncr') ? parseFloat($.inidb.exists('tamagotchiPlayDateSettings', 'funLevelIncr')) : 3),
      expLevelIncr = ($.inidb.exists('tamagotchiPlayDateSettings', 'expLevelIncr') ? parseFloat($.inidb.exists('tamagotchiPlayDateSettings', 'expLevelIncr')) : 0.25),
      foodLevelDecr = ($.inidb.exists('tamagotchiPlayDateSettings', 'foodLevelDecr') ? parseFloat($.inidb.exists('tamagotchiPlayDateSettings', 'foodLevelDecr')) : 0.5),
      locationCount = 0,
      lastRandom = -1;

  /**
   * @function loadLocations
   */
  function loadLocations() {
    for (var i = 1; $.lang.exists('tgplaydate.playdatelocation.' + i); i++) {
      locationCount++;
    }

    $.consoleLn($.lang.get('tgplaydate.console.loaded', locationCount));
  };

  /**
   * @function getLocationLangKey
   * @returns {string}
   */
  function getLocationLangKey() {
    var rand;

    do {
      rand = $.randRange(1, locationCount);
    } while (rand == lastRandom);

    lastRandom = rand;

    return 'tgplaydate.playdatelocation.' + rand;
  };

  /**
   * @function runPlayDate
   * @param {string} caller
   * @param {string} target
   */
  function runPlayDate(caller, target) {
    var callerTG = $.tamagotchi.getByOwner(caller),
        targetTG = $.tamagotchi.getByOwner(target);

    if (!callerTG) {
      $.tamagotchi.say404(caller);
      return;
    }

    if (!targetTG) {
      $.say($.whisperPrefix(caller) + $.lang.get('tgplaydate.target.404', $.username.resolve(target)));
      return;
    }

    if (targetTG.foodLevel < 1 + foodLevelDecr) {
      targetTG.sayFoodLevelTooLow();
      return;
    }

    $.say($.lang.get(getLocationLangKey(), targetTG.name, callerTG.name));

    callerTG
        .incrFunLevel(funLevelIncr)
        .incrExpLevel(expLevelIncr)
        .decrFoodLevel(foodLevelDecr)
        .save()
    ;
    targetTG
        .incrFunLevel(funLevelIncr)
        .incrExpLevel(expLevelIncr)
        .decrFoodLevel(foodLevelDecr)
        .save()
    ;
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var command = event.getCommand(),
        sender = event.getSender().toLowerCase(),
        args = event.getArgs();

    if (command.equalsIgnoreCase('tgplaydate')) {
      if (args.length != 1 || sender.equalsIgnoreCase(args[0])) {
        $.say($.whisperPrefix(sender) + $.lang.get('tgplaydate.usage'));
        return;
      }

      runPlayDate(sender, (args[0] + '').toLowerCase());
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/tamagotchi/tg-playDate.js')) {
      loadLocations();
      $.registerChatCommand('./games/tamagotchi/tg-playDate.js', 'tgplaydate', 6);
    }
  });
})();