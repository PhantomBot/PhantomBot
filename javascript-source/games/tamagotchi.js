/**
 * tamagotchi.js
 *
 * This module enables users to manage basic needs for their tamagotchi.
 * An API is exported to "$.tamagotchi" for other scripts to utilize.
 */
(function () {
  var defaultAnimals = ['cat', 'dog', 'horse', 'llama', 'panda', 'bunny'],
      pricing = {
        buyNewTG: ($.inidb.exists('tamagotchiSettings', 'pricingBuyNewTG') ? parseInt($.inidb.get('tamagotchi_settings', 'pricingBuyNewTG')) : 1000),
        buyFood: ($.inidb.exists('tamagotchiSettings', 'pricingBuyFood') ? parseInt($.inidb.get('tamagotchi_settings', 'pricingBuyFood')) : 5),
      },
      foodLevelTTLHrs = ($.inidb.exists('tamagotchiSettings', 'foodLevelTTLHrs') ? parseInt($.inidb.get('tamagotchi_settings', 'foodLevelTTLHrs')) : 24),
      foodMax = ($.inidb.exists('tamagotchiSettings', 'foodMax') ? parseInt($.inidb.get('tamagotchi_settings', 'foodMax')) : 30),
      baseLevelCap = ($.inidb.exists('tamagotchiSettings', 'generalLevelCap') ? parseInt($.inidb.get('tamagotchi_settings', 'generalLevelCap')) : 100);

  /**
   * @class
   * @description This class holds information about a tamagotchi.
   * @param {string} owner
   * @param {string} type
   * @param {string} name
   * @param {Number} [dob]
   * @param {Number} [foodLevel]
   * @param {Number} [funLevel]
   * @param {Number} [expLevel]
   * @param {Number} [sex]
   */
  function Tamagotchi(owner, type, name, dob, foodLevel, funLevel, expLevel, sex) {
    this.owner = (owner + '').toLowerCase();
    this.type = (type + '').toLowerCase();
    this.name = (name + '');
    this.dob = (isNaN(dob) ? $.systemTime()  :dob);
    this.foodLevel = (isNaN(foodLevel) ? 7 : foodLevel);
    this.funLevel = (isNaN(funLevel) ? 3 : funLevel);
    this.expLevel = (isNaN(expLevel) ? 0 : expLevel);
    this.sex = (!isNaN(sex) ? sex : ($.rand(50) > 25 ? 0 : 1));

    /**
     * @function growOneHour
     * @returns {Tamagotchi}
     */
    this.growOneHour = function () {
      var foodDecr = (1 / foodLevelTTLHrs),
          funDecr = (1 / (foodLevelTTLHrs / 2));

      this
          .decrFunLevel(funDecr)
          .decrFoodLevel(foodDecr)
      ;

      if (this.foodLevel <= 0) {
        this.kill();
      }

      return this;
    };

    /**
     * @function kill
     * @returns {Tamagotchi}
     */
    this.kill = function () {
      $.inidb.del('tamagotchi', this.owner);
      $.inidb.SaveAll(true);
      $.say($.whisperPrefix(this.owner) + $.lang.get('tamagotchi.died', this.name, getTypesString(), $.getPointsString(pricing.buyNewTG)));
      return this;
    };

    /**
     * @function getAgeInSeconds
     * @returns {Number}
     */
    this.getAgeInSeconds = function () {
      return ($.systemTime() - this.dob) / 1000;
    };

    /**
     * @function getSexString
     * @return {string}
     */
    this.getSexString = function () {
      return $.lang.get((this.sex == 1 ? 'tamagotchi.sex.male' : 'tamagotchi.sex.female'));
    };

    /**
     * @function isHappy
     * @param {boolean} [acceptMeh]
     * @returns {boolean}
     */
    this.isHappy = function (acceptMeh) {
      return (this.funLevel >= (acceptMeh ? 1 : 7));
    };

    /**
     * @function save
     * @returns {Tamagotchi}
     */
    this.save = function () {
      $.inidb.set('tamagotchi', this.owner, JSON.stringify({
        owner: this.owner,
        type: this.type,
        name: this.name,
        dob: this.dob,
        foodLevel: this.foodLevel,
        funLevel: this.funLevel,
        expLevel: this.expLevel,
        sex: this.sex,
      }));

      return this;
    };

    /**
     * @function incrFoodLevel
     * @param {Number} amount
     * @returns {Tamagotchi}
     */
    this.incrFoodLevel = function (amount) {
      this.foodLevel += amount;
      $.say($.whisperPrefix(this.owner) + $.lang.get(
              'tamagotchi.foodgiven',
              this.name,
              amount,
              $.getTimeString(amount * foodLevelTTLHrsToSec())
          ));
      return this;
    };

    /**
     * @function decrFoodLevel
     * @param {Number} amount
     * @returns {Tamagotchi}
     */
    this.decrFoodLevel = function (amount) {
      this.foodLevel -= amount;
      if (this.foodLevel >= 0 && this.foodLevel <= 0.05) {
        $.say($.whisperPrefix(this.owner) + $.lang.get('tamagotchi.needsfood', this.name, this.getSexString()));
      }
      return this;
    };

    /**
     * @function incrFunLevel
     * @param {Number} amount
     * @returns {Tamagotchi}
     */
    this.incrFunLevel = function (amount) {
      this.funLevel += amount;
      if (this.funLevel > baseLevelCap / 2) {
        this.funLevel = baseLevelCap / 2;
      }
      return this;
    };

    /**
     * @function decrFunLevel
     * @param {Number} amount
     * @returns {Tamagotchi}
     */
    this.decrFunLevel = function (amount) {
      this.funLevel -= amount;
      if (this.funLevel < 0) {
        this.funLevel = 0;
      }
      return this;
    };

    /**
     * @function incrExpLevel
     * @param {Number} amount
     * @returns {Tamagotchi}
     */
    this.incrExpLevel = function (amount) {
      this.expLevel += amount;
      if (this.expLevel > baseLevelCap) {
        this.expLevel = baseLevelCap;
      }
      return this;
    };

    /**
     * @function sayAge
     * @returns {Tamagotchi}
     */
    this.sayAge = function () {
      $.say($.lang.get(
          'tamagotchi.showage',
          $.resolveRank(this.owner),
          this.name,
          $.getTimeString(this.getAgeInSeconds()),
          Math.round(this.foodLevel)
      ));
      return this;
    };

    /**
     * @function sayExpLevel
     * @returns {Tamagotchi}
     */
    this.sayExpLevel = function () {
      $.say($.lang.get('tamagotchi.explevel', this.name, Math.floor(this.expLevel)));
      return this;
    };

    /**
     * @function sayFunLevel
     * @returns {Tamagotchi}
     */
    this.sayFunLevel = function () {
      if (this.funLevel > 7) {
        $.say($.lang.get('tamagotchi.funlevel.ishappy', this.name));
      } else if (this.funLevel > 0) {
        $.say($.lang.get('tamagotchi.funlevel.ismeh', this.name, this.getSexString()));
      } else {
        $.say($.lang.get('tamagotchi.funlevel.issad', this.name, this.getSexString()));
      }
      return this;
    };

    /**
     * @function sayFoodLevelTooLow
     * @returns {Tamagotchi}
     */
    this.sayFoodLevelTooLow = function () {
      $.say($.lang.get('tamagotchi.foodlow', this.name));
      return this;
    };
  }

  /**
   * @function getTypesString
   * @returns {string}
   */
  function getTypesString() {
    return '"' + defaultAnimals.join('", "') + '"';
  };

  /**
   * @function typeExists
   * @param {string} type
   * @returns {boolean}
   */
  function typeExists(type) {
    for (var i in defaultAnimals) {
      if (defaultAnimals[i].equalsIgnoreCase(type)) {
        return true;
      }
    }
    return false;
  };

  /**
   * @function getByOwner
   * @export $.tamagotchi
   * @param {string} owner
   * @returns {Tamagotchi}
   */
  function getByOwner(owner) {
    if (!tgExists(owner)) {
      return null;
    }
    var dbTGInfo = JSON.parse($.inidb.get('tamagotchi', owner.toLowerCase()));
    return new Tamagotchi(
        dbTGInfo.owner,
        dbTGInfo.type,
        dbTGInfo.name,
        dbTGInfo.dob,
        dbTGInfo.foodLevel,
        dbTGInfo.funLevel,
        dbTGInfo.expLevel,
        dbTGInfo.sex
    )
  };

  /**
   * @function tgExists
   * @export $.tamagotchi
   * @param {string} owner
   * @returns {boolean}
   */
  function tgExists(owner) {
    return $.inidb.exists('tamagotchi', owner.toLowerCase());
  };

  /**
   * @function say404
   * @export $.tamagotchi
   * @param {string} sender
   */
  function say404(sender) {
    $.say($.whisperPrefix(sender) + $.lang.get(
            'tamagotchi.404',
            getTypesString(),
            $.getPointsString(pricing.buyNewTG)
        ));
  };

  /**
   * @function sayTarget404
   * @export $.tamagotchi
   * @param sender
   * @param target
   */
  function sayTarget404(sender, target) {
    $.say($.whisperPrefix(sender) + $.lang.get('tamagotchi.404foruser', $.resolveRank(target)));
  };

  /**
   * @function foodLevelTTLHrsToSec
   * @export $.tamagotchi
   * @returns {Number}
   */
  function foodLevelTTLHrsToSec() {
    return (foodLevelTTLHrs * 3600);
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var command = event.getCommand(),
        sender = event.getSender().toLowerCase(),
        senderPoints = $.getUserPoints(sender),
        args = event.getArgs();

    /**
     * @commandpath tamagotchi - Get information about a tamagotchi or how to get one
     */
    if (command.equalsIgnoreCase('tamagotchi')) {
      if (args.length > 0) {
        if (tgExists(args[0])) {
          getByOwner(args[0]).sayAge().sayFunLevel().sayExpLevel();
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('tamagotchi.404foruser', $.username.resolve(args[0])));
        }
        return;
      }
      if (tgExists(sender)) {
        getByOwner(sender).sayAge().sayFunLevel().sayExpLevel();
      } else {
        say404(sender);
      }
    }

    /**
     * @commandpath tgbuy [type] [name] - By a new tamagotchi
     */
    if (command.equalsIgnoreCase('tgbuy')) {
      if (args.length < 2 || !typeExists(args[0])) {
        $.say($.whisperPrefix(sender) + $.lang.get(
                'tamagotchi.buytamagotchi.usage',
                getTypesString(),
                $.getPointsString(pricing.buyNewTG)
            ));
        return;
      }

      if (senderPoints < pricing.buyNewTG) {
        $.say($.whisperPrefix(sender) + $.lang.get(
                'tamagotchi.buytamagotchi.needpoints',
                $.pointNameMultiple,
                $.getPointsString(pricing.buyNewTG)
            ));
        ;
        return;
      }

      if (tgExists(sender)) {
        $.say($.whisperPrefix(sender) + $.lang.get('tamagotchi.buytamagotchi.alreadyown'));
        return;
      }

      if ($.strlen(args[1]) > 13) {
        $.say($.whisperPrefix(sender) + $.lang.get('tamagotchi.buytamagotchi.nametoolong'));
        return;
      }

      var newTG = new Tamagotchi(sender, args[0], args[1]).save();
      $.say($.lang.get('tamagotchi.bought', $.resolveRank(sender), newTG.getSexString(), newTG.type, newTG.name));
      newTG.sayAge().sayFunLevel();
    }

    /**
     * @commandpath tgfeed [amount] - Feed your tamagotchi
     */
    if (command.equalsIgnoreCase('tgfeed')) {
      if (args.length < 1 || isNaN(parseInt(args[0]))) {
        $.say($.whisperPrefix(sender) + $.lang.get(
                'tamagotchi.feedtamagotchi.usage',
                $.getPointsString(pricing.buyFood),
                $.getTimeString(foodLevelTTLHrsToSec(), true)
            ));
        return;
      }

      var amount = parseInt(args[0]);
      var targetTG = getByOwner(sender);

      if (senderPoints < (pricing.buyFood * amount)) {
        $.say($.whisperPrefix(sender) + $.lang.get(
                'tamagotchi.feedtamagotchi.needpoints',
                $.pointNameMultiple,
                $.getPointsString(pricing.buyFood)));
        return;
      }

      if (!targetTG) {
        $.say($.whisperPrefix(sender) + $.lang.get(
                'tamagotchi.404',
                getTypesString(),
                $.getPointsString(pricing.buyNewTG)
            ));
        return;
      }

      if (targetTG.foodLevel + amount > foodMax + Math.floor(targetTG.expLevel)) {
        $.say($.whisperPrefix(sender) + $.lang.get('tamagotchi.feedtamagotchi.maxreached', targetTG.name, foodMax));
        return;
      }

      $.inidb.decr('points', sender, amount * pricing.buyFood);
      targetTG.incrFoodLevel(amount).save();
    }

    /**
     * @commandpath tgkill - Kill your tamagotchi
     */
    if (command.equalsIgnoreCase('tgkill')) {
      var tg = getByOwner(sender);
      if (!tg) {
        $.say($.whisperPrefix(sender) + $.lang.get(
                'tamagotchi.buytamagotchi.usage',
                getTypesString(),
                $.getPointsString(pricing.buyNewTG)
            ));
        return;
      }

      tg.kill();
    }
  });

  setInterval(function () {
    var tgOwners = $.inidb.GetKeyList('tamagotchi', '');
    for (var i in tgOwners) {
      getByOwner(tgOwners[i]).growOneHour().save();
    }
  }, 36e5);

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./games/tamagotchi.js')) {
      $.registerChatCommand('./games/tamagotchi.js', 'tamagotchi', 6);
      $.registerChatCommand('./games/tamagotchi.js', 'tgbuy', 6);
      $.registerChatCommand('./games/tamagotchi.js', 'tgfeed', 6);
      $.registerChatCommand('./games/tamagotchi.js', 'tgkill', 6);
    }

    $.consoleLn($.lang.get('tamagotchi.console.loaded', $.inidb.GetKeyList('tamagotchi', '').length));
  });

  /** Export functions to API */
  $.tamagotchi = {
    getByOwner: getByOwner,
    tgExists: tgExists,
    say404: say404,
    sayTarget404: sayTarget404,
    foodLevelTTLHrsToSec: foodLevelTTLHrsToSec,
  };
})();