/**
 * commandTimer.js
 *
 * Enable commands being run at interval and only when a set amount of messages have been posted in the chat.
 * NOTE: This only works for custom commands for ./commands/customCommands.js!
 */
(function () {
  var requiredMsgs = ($.inidb.exists('commandTimerSettings', 'requiredMsgs') ? parseInt($.inidb.get('commandTimerSettings', 'requiredMsgs')) : 10),
      intervalSec = ($.inidb.exists('commandTimerSettings', 'intervalSec') ? parseInt($.inidb.get('commandTimerSettings', 'intervalSec')) : 600),
      randomize = ($.inidb.exists('commandTimerSettings', 'randomize') ? $.getIniDbBoolean('commandTimerSettings', 'randomize') : true),
      active = ($.inidb.exists('commandTimerSettings', 'active') ? $.getIniDbBoolean('commandTimerSettings', 'active') : true),
      commands = [],
      lastRandom = -1,
      cMsgCount = 0,
      lastCommandTime = 0;

  /**
   * @function load
   * @returns {Number}
   */
  function load() {
    var cmdKeys = $.inidb.GetKeyList('commandTimer', ''),
        i;

    commands = [];

    for (i in cmdKeys) {
      commands.push(cmdKeys[i]);
    }

    $.consoleLn($.lang.get('commandtimer.console.loaded', commands.length));

    return commands.length;
  };

  /**
   * @function toggle
   * @returns {boolean}
   */
  function toggle() {
    active = !active;
    $.setIniDbBoolean('commandTimerSettings', 'active', active);
    return active;
  };

  /**
   * @function toggleRandom
   * @returns {boolean}
   */
  function toggleRandom() {
    randomize = !randomize;
    $.setIniDbBoolean('commandTimerSettings', 'randomize', randomize);
    return randomize;
  };

  /**
   * @function addCommandToTimer
   * @param {string} command
   * @returns {Number}
   */
  function addCommandToTimer(command) {
    $.setIniDbBoolean('commandTimer', command, true);
    return load();
  };

  /**
   * @function removeCommandFromTimer
   * @param {string} command
   * @returns {Number}
   */
  function removeCommandFromTimer(command) {
    $.inidb.del('commandTimer', command);
    return load();
  };

  /**
   * @event ircChannelMessage
   */
  $.bind('ircChannelMessage', function (event) {
    var now = $.systemTime(),
        rand;

    if (event.getSender().equalsIgnoreCase($.botName)) {
      return;
    }
    ++cMsgCount;
    if (cMsgCount >= requiredMsgs) {
      if (now > lastCommandTime + (intervalSec * 1e3)) {
        cMsgCount = 0;
        lastCommandTime = now + (intervalSec * 1e3);

        if (randomize) {
          do {
            rand = $.rand(commands.length - 1);
          } while (rand == lastRandom);
        } else {
          if (lastRandom + 1 >= commands.length) {
            rand = 0;
          } else {
            rand = lastRandom + 1;
          }
        }

        lastRandom = rand;

        Packages.me.mast3rplan.phantombot.event.EventBus.instance().post(
            new Packages.me.mast3rplan.phantombot.event.command.CommandEvent($.botName, commands[rand], '')
        );
      }
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender(),
        command = event.getCommand(),
        args = event.getArgs(),
        argCommand = args[0],
        commandArg;

    /**
     * @commandpath addcommandtimer [command] - Add a command to the command timer
     */
    if (command.equalsIgnoreCase('addcommandtimer')) {
      if (!argCommand) {
        $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.add.usage'));
        return;
      }

      addCommandToTimer(argCommand);
      $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.add.success', argCommand));
      return;
    }

    /**
     * @commandpath delcommandtimer [command] - Remove a command from the command timer
     */
    if (command.equalsIgnoreCase('delcommandtimer')) {
      if (!argCommand) {
        $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.del.usage'));
        return;
      }

      removeCommandFromTimer(argCommand);
      $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.del.success', argCommand));
      return;
    }

    if (command.equalsIgnoreCase('commandtimer')) {
      /**
       * @commandpath commandtimer toggle - Toggle running commands on set interval
       */
      if (argCommand.equalsIgnoreCase('toggle')) {
        toggle();
        $.say($.whisperPrefix(sender) + $.lang.get(
                'commandtimer.toggle.success',
                (active ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))
            ));
        return;
      }

      /**
       * @commandpath commandtimer togglerandom - Toggle randomizing timed commands
       */
      if (argCommand.equalsIgnoreCase('togglerandom')) {
        toggleRandom();
        $.say($.whisperPrefix(sender) + $.lang.get(
                'commandtimer.togglerandom.success',
                (randomize ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))
            ));
        return;
      }

      /**
       * @commandpath commandtimer settime [seconds] - Set the interval for the command timer
       */
      if (argCommand.equalsIgnoreCase('settime')) {
        commandArg = parseInt(args[1]);
        if (!args[1] || isNaN(commandArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.settime.usage'));
          return;
        }

        intervalSec = commandArg;
        $.inidb.set('commandTimerSettings', 'intervalSec', commandArg);
        $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.settime.success', commandArg));
        return;
      }

      /**
       * @commandpath commandtimer setreqmsgs [amount] - Set the amount of messages that have to posted in the chat before running a timed command
       */
      if (argCommand.equalsIgnoreCase('setreqmsgs')) {
        commandArg = parseInt(args[1]);
        if (!args[1] || isNaN(commandArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.setreqmsgs.usage'));
          return;
        }

        intervalSec = commandArg;
        $.inidb.set('commandTimerSettings', 'requiredMsgs', commandArg);
        $.say($.whisperPrefix(sender) + $.lang.get('commandtimer.setreqmsgs.success', commandArg));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/commandTimer.js')) {
      load();
      $.registerChatCommand('./systems/commandTimer.js', 'addcommandtimer', 1);
      $.registerChatCommand('./systems/commandTimer.js', 'delcommandtimer', 1);
      $.registerChatCommand('./systems/commandTimer.js', 'commandtimer', 1);
    }
  });
})();