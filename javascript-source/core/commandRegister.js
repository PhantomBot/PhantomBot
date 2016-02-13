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
  var commands = [],
      commandScriptTable = {};

  /**
   * @function getCommandScript
   * @export $
   * @param {string} command
   */
  function getCommandScript(command) {
    return commandScriptTable[command];
  }

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

    if ($.inidb.exists('permcom', command)) {
      var newGroupId = parseInt($.inidb.get('permcom', command));
      groupId = newGroupId;
    }

    commands.push({
      command: command,
      groupId: groupId,
      script: script,
    });

    commandScriptTable[command] = script;
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

  /**
   * @function updateCommandGroup
   * @export $
   * @param command
   * @param groupId
   */
  function updateCommandGroup(command, groupId) {
    var i;
    for (i = 0; i < commands.length; i++) {
      if (commands[i].command.equalsIgnoreCase(command)) {
        commands[i].groupId = groupId;
      }
    }
  }

  /**
   * @function updateCommandGroup
   * @export $
   * @param command
   * @param groupId
   */
  function updateCommandGroup(command, groupId) {
    var i;
    for (i = 0; i < commands.length; i++) {
      if (commands[i].command.equalsIgnoreCase(command)) {
        commands[i].groupId = groupId;
      }
    }
  }

  /** Export functions to API */
  $.registerChatCommand = registerChatCommand;
  $.unregisterChatCommand = unregisterChatCommand;
  $.commandExists = commandExists;
  $.getCommandGroup = getCommandGroup;
  $.updateCommandGroup = updateCommandGroup;
  $.getCommandScript = getCommandScript;
})();
