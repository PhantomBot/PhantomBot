/**
 * pointSystem.js
 *
 * Manage user loyalty points and export and API to manipulate points in other modules
 * Use the $ API
 */
(function () {
  var pointsTimedGain = ($.getIniDbBoolean('pointSettings', 'pointsTimedGain') ? $.getIniDbBoolean('pointSettings', 'pointsTimedGain') : true),
      onlineGain = ($.inidb.exists('pointSettings', 'onlineGain') ? parseInt($.inidb.get('pointSettings', 'onlineGain')) : 1),
      offlineGain = ($.inidb.exists('pointSettings', 'offlineGain') ? parseInt($.inidb.get('pointSettings', 'offlineGain')) : 1),
      onlinePayoutInterval = ($.inidb.exists('pointSettings', 'onlinePayoutInterval') ? parseInt($.inidb.get('pointSettings', 'onlinePayoutInterval')) : 10),
      offlinePayoutInterval = ($.inidb.exists('pointSettings', 'offlinePayoutInterval') ? parseInt($.inidb.get('pointSettings', 'offlinePayoutInterval')) : 0),
      modPointsPermToggle = ($.getIniDbBoolean('pointSettings', 'modPointsPermToggle') ? $.getIniDbBoolean('pointSettings', 'modPointsPermToggle') : false),
      lastPayout = 0,

      /** @export $ */
      pointNameSingle = ($.inidb.exists('pointSettings', 'pointNameSingle') ? $.inidb.get('pointSettings', 'pointNameSingle') : 'Point'),
      pointNameMultiple = ($.inidb.exists('pointSettings', 'pointNameMultiple') ? $.inidb.get('pointSettings', 'pointNameMultiple') : 'Points');

  /**
   * @function getUserPoints
   * @export $
   * @param {string} username
   * @returns {*}
   */
  function getUserPoints(username) {
    if ($.inidb.exists('points', username)) {
      return parseInt($.inidb.get('points', username));
    } else {
      return 0;
    }
  };

  /**
   * @function getPointsString
   * @export $
   * @param {Number} points
   * @returns {string}
   */
  function getPointsString(points) {
    if (parseInt(points) == 1) {
      return points + ' ' + pointNameSingle;
    }
    return points + ' ' + pointNameMultiple;
  };

  /**
   * @function hasPerm
   * @param {Object} event
   * @returns {boolean}
   */
  function hasPerm(event) {
    if (modPointsPermToggle) {
      if (!$.isModv3(event.getSender().toLowerCase(), event.getTags())) {
        $.say($.whisperPrefix(event.getSender().toLowerCase()) + $.modMsg);
        return false;
      }
    } else if (!$.isAdmin(event.getSender().toLowerCase())) {
      $.say($.whisperPrefix(event.getSender().toLowerCase()) + $.adminMsg);
      return false;
    }
    return true;
  };

  /**
   * @function registerPointCommands
   * @param {string} [oldName]
   */
  function registerPointCommands(oldName) {
    if (oldName && $.commandExists(oldName)) {
      $.unregisterChatCommand(oldName);
    }
    if (!$.commandExists(pointNameSingle)) {
      $.registerChatCommand('./core/pointSystem.js', pointNameSingle, 7);
    }
    if (!$.commandExists(pointNameMultiple)) {
      $.registerChatCommand('./core/pointSystem.js', pointNameMultiple, 7);
    }
  };

  /**
   * @function runPointsPayout
   */
  function runPointsPayout() {
    var now = $.systemTime(),
        uUsers = [],
        username,
        amount,
        i;
    if (!$.bot.isModuleEnabled('./core/pointSystem.js')) {
      return;
    }

    if ($.isOnline($.channelName)) {
      if (onlinePayoutInterval > 0 && (lastPayout + (onlinePayoutInterval * 6e4)) <= now) {
        amount = onlineGain;
      } else {
        return;
      }
    } else {
      if (offlinePayoutInterval > 0 && (lastPayout + (offlinePayoutInterval * 6e4)) <= now) {
        amount = offlineGain;
      } else {
        return;
      }
    }

    for (i in $.users) {
      username = $.users[i][0].toLowerCase();
      $.inidb.incr('points', username, amount);
      uUsers.push(username);
    }
    $.log('pointSystem', 'Executed ' + $.pointNameMultiple + ' payouts. Amount: ' + amount + '. Users: ' + (uUsers.length > 0 ? uUsers.join(', ') : 'none'));

    lastPayout = now;
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        username = $.username.resolve(sender, event.getTags()),
        command = event.getCommand(),
        args = event.getArgs(),
        action = args[0],
        actionArg1 = args[1],
        actionArg2 = args[2],
        temp,
        i;

    /**
     * @commandpath points - Announce YOUR current amount of points, this base command can be replaced by the pointsname and pointsnamemultiple
     * @commandpath POINTNAMEMULTIPLE - Announce YOUR current amount of points
     * @commandpath POINTNAMESINGLE - Announce YOUR current amount of points
     *
     * Todo: add @commandpath tags to command paths
     */
    if (command.equalsIgnoreCase('points') || command.equalsIgnoreCase($.pointNameMultiple) || command.equalsIgnoreCase($.pointNameSingle)) {
      if (!action) {
        if ($.getUserPoints(sender) == 0) {
          $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.get.self.nopoints', $.pointNameMultiple));
        } else {
          $.say($.lang.get('pointsystem.get.self.withtime', $.resolveRank(sender), $.getPointsString($.getUserPoints(sender)), $.getUserTimeString(sender)));
        }
      } else {
        if (!hasPerm(event)) {
          return;
        }

        /**
         * @commandpath points add [username] [amount] - Add an amount of points to a user's balance
         */
        if (action.equalsIgnoreCase('add')) {
          actionArg1 = (actionArg1 + '').toLowerCase();
          actionArg2 = parseInt(actionArg2);
          if (isNaN(actionArg2)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.usage'));
            return;
          }

          if (!actionArg1 || !$.user.isKnown(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
            return;
          }

          if (actionArg2 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.error.negative', $.pointNameMultiple));
            return;
          }

          if ($.user.isKnown(actionArg1)) {
            $.inidb.incr('points', actionArg1, actionArg2);
            $.say($.lang.get('pointsystem.add.success',
                $.getPointsString(actionArg2), $.username.resolve(actionArg1), $.getPointsString($.getUserPoints(actionArg1))));
          }
        }

        /**
         * @commandpath points take [username] [amount] - Take an amount of points from the user's balance
         */
        if (action.equalsIgnoreCase('take')) {
          actionArg1 = (actionArg1 + '').toLowerCase();
          actionArg2 = parseInt(actionArg2);
          if (isNaN(actionArg2)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.usage'));
            return
          }

          if (!actionArg1 || !$.user.isKnown(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
            return;
          }

          if (actionArg2 > $.getUserPoints(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.error.toomuch', username, $.pointNameMultiple));
            return;
          }

          $.inidb.decr('points', actionArg1, actionArg2);
          $.say($.lang.get('pointsystem.take.success',
              $.getPointsString(actionArg2), $.username.resolve(actionArg1), $.getPointsString($.getUserPoints(actionArg1))))
        }

        /**
         * @commandpath points set [username] [amount] - Set the user's points balance to an amount
         */
        if (action.equalsIgnoreCase('set')) {
          actionArg1 = (actionArg1 + '').toLowerCase();
          actionArg2 = parseInt(actionArg2);
          if (isNaN(actionArg2)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.setbalance.usage'));
            return;
          }

          if (!actionArg1 || !$.user.isKnown(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
            return;
          }

          if (actionArg2 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.setbalance.error.negative', $.pointNameMultiple));
            return;
          }

          $.inidb.set('points', actionArg1, actionArg2);
          $.say($.lang.get('pointsystem.setbalance.success',
              $.pointNameSingle, $.username.resolve(actionArg1), $.getPointsString($.getUserPoints(actionArg1))));
        }

        /**
         * @commandpath points all [amount] - Send an amount of points to all users in the chat
         */
        if (action.equalsIgnoreCase('all')) {
          actionArg1 = parseInt(actionArg1);
          if (isNaN(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.all.usage'));
            return;
          }

          if (actionArg1 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.error.negative', $.pointNameMultiple));
            return;
          }

          for (i in $.users) {
            $.inidb.incr('points', $.users[i][0].toLowerCase());
          }
          $.say($.lang.get('pointsystem.add.all.success', $.getPointsString(actionArg1)));
        }

        /**
         * @commandpath points - setname single [name] - Set the points handle for single points
         * @commandpath points - setname multiple [name] - Set the points handle for plural points
         */
        if (action.equalsIgnoreCase('setname')) {
          (actionArg1 + '').toLowerCase();
          (actionArg2 + '').toLowerCase();

          if (actionArg1 == 'single' && actionArg2) {
            temp = $.pointNameSingle;
            $.pointNameSingle = actionArg2.toLowerCase();
            $.inidb.set('pointSettings', 'pointNameSingle', $.pointNameSingle);
            registerPointCommands(temp);
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.single.success', temp, $.pointNameSingle));
            return;
          }
          if (actionArg1 == 'multiple' && actionArg2) {
            temp = $.pointNameMultiple;
            $.pointNameMultiple = actionArg2.toLowerCase();
            $.inidb.set('pointSettings', 'pointNameMultiple', $.pointNameMultiple);
            registerPointCommands(temp);
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.multiple.success', temp, $.pointNameMultiple));
            return;
          }
          if (!actionArg2) {
            temp = $.pointNameMultiple;
            $.pointNameMultiple = $.pointNameSingle = actionArg2;
            $.inidb.set('pointSettings', 'pointNameSingle', $.pointNameSingle);
            $.inidb.set('pointSettings', 'pointNameMultiple', $.pointNameSingle);
            registerPointCommands(temp);
            $.say($.whisperPrefix(sender) + $.lang.get("pointsystem.set.name.both.success", temp, $.pointNameMultiple));
            return
          }
          $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.usage'));
        }

        /**
         * @commandpath points setgain [amount] - Set the amount of points gained per payout interval while the channel is online
         */
        if (action.equalsIgnoreCase('setgain')) {
          actionArg1 = parseInt(actionArg1);
          if (isNaN(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.usage'));
            return;
          }

          if (actionArg1 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.error.negative', $.pointNameMultiple));
            return;
          }

          onlineGain = actionArg1;
          $.inidb.set('pointSettings', 'onlineGain', onlineGain);
          $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.success', $.pointNameSingle, $.getPointsString(onlineGain), onlinePayoutInterval));
        }

        /**
         * @commandpath points setofflinegain [amount] - Set the amount of points gained per interval while the channel is offline
         */
        if (action.equalsIgnoreCase('setofflinegain')) {
          actionArg1 = parseInt(actionArg1);
          if (isNaN(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.offline.usage'));
            return;
          }

          if (actionArg1 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.error.negative', $.pointNameMultiple));
            return;
          }

          offlineGain = actionArg1;
          $.inidb.set('pointSettings', 'offlineGain', offlineGain);
          $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.offline.success',
                  $.pointNameSingle, $.getPointsString(offlineGain), offlinePayoutInterval));
        }

        /**
         * @commandpath points setinterval [minutes] - Set the points payout interval for when the channel is online
         */
        if (action.equalsIgnoreCase('setinterval')) {
          actionArg1 = parseInt(actionArg1);
          if (isNaN(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.usage'));
            return;
          }

          if (actionArg1 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.error.negative', $.pointNameMultiple));
            return;
          }

          onlinePayoutInterval = actionArg1;
          $.inidb.set('pointSettings', 'onlinePayoutInterval', onlinePayoutInterval);
          $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.success', $.pointNameSingle, onlinePayoutInterval));
        }

        /**
         * @commandpath points setofflineinterval [minutes] - Set the points payout interval for when the channel is offline
         */
        if (action.equalsIgnoreCase('setofflineinterval')) {
          actionArg1 = parseInt(actionArg1);
          if (isNaN(actionArg1)) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.offline.usage'));
            return;
          }

          if (actionArg1 < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.error.negative', $.pointNameMultiple));
            return;
          }

          offlinePayoutInterval = actionArg1;
          $.inidb.set('pointSettings', 'offlinePayoutInterval', offlinePayoutInterval);
          $.say($.whisperPrefix(sender) + $.lang.get("pointsystem.set.interval.offline.success", $.pointNameSingle, offlinePayoutInterval));
        }

        if (action.equalsIgnoreCase('modpermtoggle')) {
          modPointsPermToggle = !modPointsPermToggle;
          $.setIniDbBoolean('pointSettings', 'modPointsPermToggle', modPointsPermToggle);
          $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.modpermtoggle.success',
                  (modPointsPermToggle ? 'moderator' : 'administrator')));
        }
      }
    }


    /**
     * @commandpath makeitrain [amount] - Send a random amount of points to each user in the channel
     */
    if (command.equalsIgnoreCase('makeitrain')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      action = parseInt(action);
      if (isNaN(action)) {
        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.makeitrain.usage'));
        return;
      }

      if (action < 1) {
        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.makeitrain.error.negative', $.pointNameMultiple));
        return;
      }

      for (i in $.users) {
        var amount = $.randRange(1, action);
        temp = [];
        $.inidb.incr('points', $.users[i][0].toLowerCase(), amount);
        if (!$.users[i][0].equalsIgnoreCase($.botName)) {
          temp.push($.username.resolve($.users[i][0]) + ': ' + $.getPointsString(amount));
        }
      }

      if (temp.length > 0) {
        $.say($.lang.get('pointsystem.makeitrain.success', username, $.pointNameMultiple, temp.join(', ')));
      }
    }
  });

  // Set the timer for the points payouts
  setInterval(function () {
    runPointsPayout();
  }, 6e4);

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./core/pointSystem.js')) {
      $.registerChatCommand('./core/pointSystem.js', 'makeitrain', 2);
      $.registerChatCommand('./core/pointSystem.js', 'points', 7);
      registerPointCommands();
    }
  });

  /** Export functions to API */
  $.pointNameSingle = pointNameSingle;
  $.pointNameMultiple = pointNameMultiple;
  $.getUserPoints = getUserPoints;
  $.getPointsString = getPointsString;
})();