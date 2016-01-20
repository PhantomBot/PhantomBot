/**
 * commandRegister.js
 *
 * Register and keep track of commands.
 * (previously known as commandList.js)
 *
 * NOTE: You will have to register ANY command you implement!
 * The commandEvent will not get fired to your module if the registry does not know about it!
 */
(function () {
  var commands = [];

  /**
   * @function registerChatCommand
   * @export $
   * @param {string} script
   * @param {string} command
   * @param {string|Number} [groupId]
   */
  function registerChatCommand(script, command, groupId) {
    script = script.replace('\\', '/').replace('./scripts/', '');
    groupId = (groupId ? groupId : 7);

    if (typeof groupId == 'string') {
      groupId = $.getGroupIdByName(groupId);
    }

    if ($.commandExists(command)) {
      return;
    }

    commands.push({
      command: command,
      groupId: groupId,
      script: script,
    });
  };

  /**
   * @function unregisterChatCommand
   * @export $
   * @param {string} command
   */
  function unregisterChatCommand(command) {
    var i;
    for (i in commands) {
      if (commands[i].command.equalsIgnoreCase(command)) {
        commands.splice(i, i);
      }
    }
  };

  /**
   * @function commandExists
   * @export $
   * @param {string} command
   * @returns {boolean}
   */
  function commandExists(command) {
    var i;
    for (i in commands) {
      if (commands[i].command.equalsIgnoreCase(command)) {
        return true;
      }
    }
    return false;
  };

  /**
   * @function getCommandGroup
   * @export $
   * @param command
   * @param name
   * @returns {Number}
   */
  function getCommandGroup(command, name) {
    var i;
    for (i = 0; i < commands.length; i++) {
      if (commands[i].command.equalsIgnoreCase(command)) {
        if (name) {
          return $.getGroupNameById(commands[i].groupId);
        } else {
          return commands[i].groupId;
        }
      }
    }
    return 7;
  };

  /** Export functions to API */
  $.registerChatCommand = registerChatCommand;
  $.unregisterChatCommand = unregisterChatCommand;
  $.commandExists = commandExists;
  $.getCommandGroup = getCommandGroup;
})();