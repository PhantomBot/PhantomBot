/**
 * tg-battle.js
 *
 * This module adds a basic battling system for tamagotchis.
 * A higher experience level tamagotchi will have an advantage over the other tamagotchi.
 *
 * Chances by difference in experience level:
 * 1: 55% / 45%
 * 2: 60% / 40%
 * 3: 65% / 35%
 * 4: 70% / 30%
 * 5: 75% / 25%
 * 6: 80% / 20%
 * 7: 85% / 15%
 * 8: 90% / 10%
 * 9+: 95% / 5%
 */
(function () {
  var waitTime = ($.inidb.exists('tgBattleSettings', 'waitTime') ? parseInt($.inidb.get('tgBattleSettings', 'waitTime')) : 60) * 1000,
      foodCost = ($.inidb.exists('tgBattleSettings', 'foodCost') ? parseInt($.inidb.get('tgBattleSettings', 'foodCost')) : 2),
      lostFunDecr = ($.inidb.exists('tgBattleSettings', 'lostFunDecr') ? parseInt($.inidb.get('tgBattleSettings', 'lostFunDecr')) : 2),
      winFunIncr = ($.inidb.exists('tgBattleSettings', 'winFunIncr') ? parseInt($.inidb.get('tgBattleSettings', 'winFunIncr')) : 4),
      baseGainExp = 0.75,
      waitTimeoutFunDecr = 1,
      currentBattle = {
        active: false,
        senderTG: null,
        targetTG: null,
        waitTimerId: -1,
      };

  /**
   * @function prepareBattle
   * @param {string} sender
   * @param {string} target
   * @returns {boolean}
   */
  function prepareBattle(sender, target) {
    var senderTG = $.tamagotchi.getByOwner(sender),
        targetTG = $.tamagotchi.getByOwner(target);

    if (!senderTG || !targetTG || sender.equalsIgnoreCase(target)) {
      $.say($.lang.get('tgbattle.notready.missingtg'));
      return false;
    }

    if (!senderTG.isHappy()) {
      $.say($.lang.get('tgbattle.notready.lowfun', senderTG.name));
      return false;
    }
    if (!targetTG.isHappy()) {
      $.say($.lang.get('tgbattle.notready.lowfun', targetTG.name));
      return false;
    }

    if (Math.floor(senderTG.foodLevel) <= foodCost + 1) {
      $.say($.lang.get('tgbattle.notready.lowfood', senderTG.name));
      return false;
    }

    if (Math.floor(targetTG.foodLevel) <= foodCost + 1) {
      $.say($.lang.get('tgbattle.notready.lowfood', targetTG.name));
      return false;
    }

    currentBattle.waitTimerId = setTimeout(function () {
      $.say($.lang.get('tgbattle.wait.timedout', $.username.resolve(targetTG.owner)));

      senderTG.decrFunLevel(waitTimeoutFunDecr).save();

      currentBattle = {
        active: false,
        senderTG: null,
        targetTG: null,
        waitTimerId: -1,
      };
      clearTimeout(currentBattle.waitTimerId);
    }, waitTime);

    currentBattle.active = true;
    currentBattle.senderTG = senderTG;
    currentBattle.targetTG = targetTG;

    $.say($.lang.get(
        'tgbattle.wait.foraccept',
        senderTG.name,
        targetTG.name,
        $.username.resolve(targetTG.owner)
    ));
  };

  /**
   * @function battleAccepted
   */
  function battleAccepted() {
    var senderTG = currentBattle.senderTG,
        targetTG = currentBattle.targetTG,
        expDifference = Math.max(Math.min(senderTG.expLevel - targetTG.expLevel, 10), -10),
        decision = ($.randRange(0, 24) <= (10 + expDifference)),
        t;

    clearTimeout(currentBattle.waitTimerId);

    $.say($.lang.get(
        'tgbattle.battle.starting',
        currentBattle.senderTG.name,
        currentBattle.targetTG.name
    ));

    t = setTimeout(function () {
      currentBattle.senderTG
          .incrExpLevel((decision ? baseGainExp * 2 : baseGainExp))
          .decrFoodLevel(foodCost)
          .incrFunLevel((decision ? winFunIncr : -lostFunDecr))
          .save()
      ;
      currentBattle.targetTG
          .incrExpLevel((!decision ? baseGainExp * 2 : baseGainExp))
          .decrFoodLevel(foodCost)
          .incrFunLevel((!decision ? winFunIncr : -lostFunDecr))
          .save()
      ;

      if (decision) {
        $.say($.lang.get(
            'tgbattle.battle.done',
            currentBattle.senderTG.name,
            currentBattle.targetTG.name
        ));
      } else {
        $.say($.lang.get(
            'tgbattle.battle.done',
            currentBattle.targetTG.name,
            currentBattle.senderTG.name
        ));
      }

      currentBattle.active = false;
      clearTimeout(t);
    }, 5e3);
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var command = event.getCommand(),
        sender = event.getSender(),
        args = event.getArgs();

    /**
     * @commandpath tgbattle [username] - Invite an other user to have your tamagotchis battle it out
     */
    if (command.equalsIgnoreCase('tgbattle')) {
      if (args.length != 1) {
        $.say($.whisperPrefix(sender) + $.lang.get('tgbattle.usage'));
        return;
      }

      prepareBattle(sender, args[0]);
    }

    /**
     * @commandpath tgbaccept - Accept an incomming battle request
     */
    if (command.equalsIgnoreCase('tgbaccept') && currentBattle.active && currentBattle.targetTG.owner.equalsIgnoreCase(sender)) {
      $.consoleLn(sender + ' accepted the battle');
      battleAccepted();
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/tamagotchi/tg-battle.js')) {
      $.registerChatCommand('./games/tamagotchi/tg-battle.js', 'tgbattle', 6);
      $.registerChatCommand('./games/tamagotchi/tg-battle.js', 'tgbaccept', 6);
    }
  });
})();