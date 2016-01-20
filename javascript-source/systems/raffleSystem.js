/**
 * raffleSystem.js
 *
 * Run/manage raffles
 */
(function () {
  var currentRaffle = {
    raffleActive: false,
    keyWord: '',
    time: 0,
    forFollowers: false,
    cost: 0,
    users: [],
    winner: '',
    raffleMaster: $.ownerName,
    raffleTimerId: -1,
    startTime: 0,
  };

  /**
   * @function updateFile
   * @param {string} line
   */
  function updateFile(line) {
    var append = true;
    if (startTime == 0) {
      currentRaffle.startTime = $.systemTime();
      append = false;
    }

    if (!$.isDirectory('./addons/raffleSystem')) {
      $.mkDir('./addons/raffleSystem');
    }

    $.writeToFile(line, './addons/raffleSystem/raffle_' + $.logging.getLogDateString(startTime) + '_' + $.logging.getLogTimeString(startTime) + '.txt', append);
  };

  /**
   * @function startRaffle
   * @param {string} keyWord
   * @param {boolean} forFollowers
   * @param {Number} time
   * @param {Number} cost
   * @param {string} raffleMaster
   */
  function startRaffle(keyWord, forFollowers, time, cost, raffleMaster) {
    if (raffleActive) {
      $.say($.whisperPrefix(raffleMaster) + $.lang.get('rafflesystem.start.error.alreadyrunning'));
      return;
    }

    $.registerChatCommand('./systems/raffleSystem.js', keyWord, 7);
    currentRaffle.keyWord = keyWord;

    if (raffleMaster) {
      currentRaffle.raffleMaster = raffleMaster;
    }

    if (forFollowers) {
      currentRaffle.forFollowers = forFollowers;
    }

    if (!isNaN(time) && time > 0) {
      currentRaffle.raffleTimerId = setTimeout(function () {
        endRaffle();
      }, time * 1e3);
    }

    if (!isNaN(cost) && cost > 0) {
      currentRaffle.cost = cost;
    }

    currentRaffle.raffleActive = true;
    $.say(getRaffleText(raffleMaster));
    updateFile(
        'New Raffle: ' +
        (raffleMaster ? 'By ' + raffleMaster : '') +
        (keyWord ? ', Keyword !' + keyWord : '') +
        (forFollowers ? ', followers only' : '') +
        (time ? ', Run time ' + time + 'seconds' : '') +
        (cost ? ', Cost ' + cost + ' ' + $.pointNameMultiple : '')
    )
  };

  /**
   * @function endRaffle
   */
  function endRaffle() {
    if (!raffleActive) {
      $.say($.whisperPrefix(currentRaffle.raffleMaster) + $.lang.get('rafflesystem.close.error.notrunning'));
      return;
    }
    if (raffleTimerId > -1) {
      clearTimeout(raffleTimerId);
      currentRaffle.raffleTimerId = -1;
    }
    updateFile('Raffle ended');
    pickWinner();
    currentRaffle.raffleActive = false;
    currentRaffle.startTime = 0;
  };

  /**
   * @function pickWinner
   * @param {boolean} [redraw]
   */
  function pickWinner(redraw) {
    currentRaffle.winner = $.randElement(currentRaffle.users);
    if (redraw) {
      if (currentRaffle.users.length == 0) {
        $.say($.lang.get('rafflesystem.redraw.error.noentries'));
        return;
      }
      $.say($.lang.get('rafflesystem.redraw.success', $.username.resolve(winner)));
      updateFile('Redraw winner: ' + winner);
    } else {
      if (currentRaffle.users.length == 0) {
        $.say($.lang.get('rafflesystem.close.success.noentries'));
        return
      }
      $.say($.lang.get('rafflesystem.close.success', $.username.resolve(winner)));
      updateFile('Winner: ' + winner);
    }
  };

  /**
   * @function enterRaffle
   * @param {string} username
   */
  function enterRaffle(username) {
    if (raffleActive) {
      if (username == $.channelName) {
        $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.enter.error.iscaster'));
        return;
      }
      if ($.list.contains(currentRaffle.users, username)) {
        $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.enter.error.alreadyentered'));
        return;
      }
      if (currentRaffle.forFollowers) {
        if (!$.user.isFollower(username)) {
          $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.enter.error.notfollows'));
          return;
        }
      }
      if (currentRaffle.cost > 0) {
        if (currentRaffle.cost > $.getUserPoints(username)) {
          $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.enter.error.needpoints'));
          return;
        }
      }
      currentRaffle.users.push(username);
      updateFile('Join: ' + username);
      $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.enter.success'));
    } else {
      $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.enter.error.notrunning'));
    }
  };

  /**
   * @function getRaffleText
   * @param {string} sender
   * @returns {string}
   */
  function getRaffleText(sender) {
    if (currentRaffle.raffleActive) {
      return $.lang.get('rafflesystem.enter.notkeyword', currentRaffle.keyWord);
    } else {
      return $.whisperPrefix(sender) + $.lang.get('rafflesystem.enter.error.notrunning');
    }
  };

  /**
   * @function checkArgs
   * @param {string} keyWord
   * @param {Number} time
   * @param {Number} cost
   * @returns {boolean}
   */
  function checkArgs(keyWord, time, cost) {
    var status = true;
    if (!keyWord || keyWord == '') {
      status = false;
    }
    if (time && isNaN(parseInt(time))) {
      status = false;
    }
    if (cost && isNaN(parseInt(cost))) {
      status = false;
    }
    if (status) {
      return true;
    }
    $.say($.whisperPrefix(currentRaffle.raffleMaster) + $.lang.get('rafflesystem.start.usage'));
    return false;
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        action,
        actionArgs;

    /**
     * @commandpath raffle - Announce information about a possibly currently running raffle
     */
    if (command.equalsIgnoreCase('raffle')) {
      if (args.length == 0) {
        $.say(getRaffleText(sender));
        return;
      }

      action = args[0];
      actionArgs = (event.getArguments() + '').replace(action, '').trim();

      if (action) {
        if (!$.isModv3(sender, event.getTags())) {
          $.say($.whisperPrefix(sender) + $.modMsg);
          return;
        }

        /**
         * @commandpath raffle start [-follow] [-k keyword] [-t time in seconds] [-c cost] - Start a new raffle, follow, time and cost are optional
         */
        if (action.equalsIgnoreCase('start')) {
          var forFollowers = (actionArgs.indexOf('-follow') > -1),
              keyWord = actionArgs.match(/-k\s([a-z]+)/i),
              time = actionArgs.match(/-t\s([0-9]+)/i),
              cost = actionArgs.match(/-c\s([0-9]+)/i);

          keyWord = (keyWord ? keyWord[1] : '');
          time = (time ? time[1] : '');
          cost = (cost ? cost[1] : '');

          if (checkArgs(keyWord.toString(), parseInt(time), parseInt(cost))) {
            startRaffle(keyWord.toString(), forFollowers, parseInt(time), parseInt(cost), $.username.resolve(sender));
          }
        }

        /**
         * @commandpath raffle close - End the current raffle and pick a winner
         */
        if (action.equalsIgnoreCase('close')) {
          endRaffle();
        }

        /**
         * @commandpath raffle redraw - Redraw the winner of the previous raffle
         */
        if (action.equalsIgnoreCase('redraw')) {
          if (!currentRaffle.raffleActive) {
            pickWinner(true);
          } else {
            $.say($.whisperPrefix(sender) + 'You can\'t repick a winner during a raffle!');
          }
        }
      }
    }

    /**
     * @commandpath RAFFLEKEYWORD - Enter the current raffle
     */
    if (command.equalsIgnoreCase(keyWord)) {
      enterRaffle(sender);
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/raffleSystem.js')) {
      $.registerChatCommand('./systems/raffleSystem.js', 'raffle', 2);
    }
  });
})();