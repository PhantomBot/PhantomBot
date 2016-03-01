/**
 * commandCoolDown.js
 *
 * Manage cooldowns for commands
 * Cooldowns are kept per user.
 *
 * To use the cooldown in other scipts use the $.coolDown API
 */
(function () {
  var curentCooldowns = [],
      moderatorCooldown = $.getIniDbBoolean('settings', 'moderatorCooldown', false);

  /**
   * @function set
   * @export $.coolDown
   * @param {string} command
   * @param {Number} time
   * @param {string|null} [forUser]
   */
  function set(command, time, forUser) {
    if (!time || isNaN(time)) {
      time = $.systemTime() + ($.inidb.exists('commandCooldown', command) ? parseInt($.inidb.get('commandCooldown', command)) * 1000 : 0);
    }

    if (!forUser) {
      forUser = 'global';
    }

    if (time > 0) {
      curentCooldowns.push({
        command: command,
        username: forUser,
        expiresAt: time,
      });
    }
  };

  /**
   * @function get
   * @export $.coolDown
   * @param {string} command
   * @param {string} [sender]
   * @returns {Number}
   */
  function get(command, sender) {
    if ($.isMod(sender) && !moderatorCooldown) {
      return 0
    }

    var cooldown,
        i;

    for (i in curentCooldowns) {
      if (!curentCooldowns[i].command.equalsIgnoreCase(command)) {
        continue;
      }
      if (curentCooldowns[i].username.equalsIgnoreCase('global') || curentCooldowns[i].username.equalsIgnoreCase(sender)) {
        cooldown = curentCooldowns[i].expiresAt - $.systemTime();
        if (cooldown <= 0) {
          curentCooldowns.splice(i, 1);
          set(command, null, (sender ? sender : null));
        }
        return cooldown;
      }
    }
    set(command, null, (sender ? sender : null));
    return 0;
  };

  /**
   * @function clear
   * @export $.coolDown
   * @param {string} command
   */
  function clear(command) {
    var i;
    for (i in curentCooldowns) {
      if (curentCooldowns[i].command.equalsIgnoreCase(command)) {
        curentCooldowns.splice(i, 1);
        return;
      }
    }
  };

  /**
   * @function hasCooldown
   * @export $.coolDown
   * @param {string} command
   * @returns {boolean}
   */
  function hasCooldown(command) {
    return $.inidb.exists('commandCooldown', command);
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        argCommand = args[0],
        coolDown = parseInt(args[1]);

    /**
     * @commandpath cooldown [comamnd] [seconds] - Set the cooldown for a command
     */
    if (command.equalsIgnoreCase('cooldown')) {

      if (!argCommand || isNaN(coolDown)) {
        $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.usage'));
        return;
      }

      if (coolDown == 0) {
        $.inidb.del('commandCooldown', argCommand.toLowerCase());
      } else {
        $.inidb.set('commandCooldown', argCommand.toLowerCase(), coolDown);
      }
      $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.success', argCommand, $.getTimeString(coolDown)));
    }

    /**
     * @commandpath clearcooldown [command] - Clear all cooldowns for the given command
     */
    if (command.equalsIgnoreCase('clearcooldown')) {
      if (!argCommand) {
        $.say($.whisperPrefix(sender) + $.lang.get('cooldown.clear.usage'));
        return;
      }

      clear(argCommand);
      $.say($.whisperPrefix(sender) + $.lang.get('cooldown.clear.success', argCommand));
    }

    /**
     * @commandpath togglemodcooldown - Toggle command cooldown for mods
     */
    if (command.equalsIgnoreCase('togglemodcooldown')) {
      moderatorCooldown = !moderatorCooldown;
      $.setIniDbBoolean('settings', 'moderatorCooldown', moderatorCooldown);

      $.say($.whisperPrefix(sender) + $.lang.get(
              'cooldown.set.togglemodcooldown',
              (moderatorCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))
          ));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./core/commandCoolDown.js')) {
      $.registerChatCommand('./core/commandCoolDown.js', 'cooldown', 1);
      $.registerChatCommand('./core/commandCoolDown.js', 'clearcooldown', 1);
      $.registerChatCommand('./core/commandCoolDown.js', 'togglemodcooldown', 1);
    }
  });

  /** Export functions to API */
  $.coolDown = {
    set: set,
    get: get,
    unPause: clear,
    hasCooldown: hasCooldown,
  };
})();
