/**
 * customCommands.js
 *
 * Register custom commands.
 *
 * These commands can run logic to a certain degree by using on or more
 * of the following tags in the command output:
 *
 * - (...) The whole parameter string (Everything that is after the command)
 * - (sender) The sender's username, resolved with rank
 * - (baresender) The sender's username, without rank
 * - (random) A random user from the current viewer list
 * - (pointsname) The plural name of your currency
 *
 * Todo: Create an export function for custom commands
 */
(function () {
  /**
   * @function returnCommandCost
   * @export $
   * @param {string} sender
   * @param {string} command
   */
  function returnCommandCost(sender, command) {
    sender = sender.toLowerCase();
    command = command.toLowerCase();
    if ($.inidb.exists('pricecom', command) && parseInt($.inidb.get('pricecom', command)) > 0) {
      if (!$.isMod(sender)) {
        $.inidb.incr('points', sender, $.inidb.get('pricecom', command));
        $.inidb.SaveAll();
      }
    }
  };

  /**
   * @function replaceCommandTags
   * @export $
   * @param {string} message
   * @param {Object} event
   * @param {Array} [tagList]
   * @param {Array} [tagReplacements]
   * @returns {string}
   */
  function replaceCommandTags(message, event, tagList, tagReplacements) {
    var i;
    message = message + '';
    if (tagList) {
      for (i in tagList) {
        var regex = new RegExp('/' + tagList[i].replace(/([\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|])/g, '\\$&') + '/', 'ig');
        message = message.replace(regex, tagReplacements[i]);
      }
    }

    return message
        .replace(/\([.]{3}\)/g, (event.getArgs().length == 1 ? $.username.resolve(event.getArgs()[0]) : event.getArguments()))
        .replace(/\(sender\)/g, $.resolveRank(event.getSender().toLowerCase()))
        .replace(/\(baresender\)/g, $.username.resolve(event.getSender().toLowerCase()))
        .replace(/\(random\)/g, $.username.resolve($.randElement($.users)[0]))
        .replace(/\(pointsname\)/g, $.pointNameMultiple)
        ;
  };

  /**
   * @function permCom
   * @export $
   * @param {string} user
   * @param {string} command
   * @returns {boolean}
   */
  function permCom(user, command) {
    if ($.isAdmin(user)) {
      return true;
    }
    return ($.getCommandGroup(command) >= $.getUserGroupId(user));
  };

  /**
   * @function getCommandPrice
   * @export $
   * @param {string} command
   * @returns {Number}
   */
  function getCommandPrice(command) {
    return parseInt($.inidb.exists('pricecom', command) ? $.inidb.get('pricecom', command) : 0);
  };

  /**
   * @function addComRegisterCommands
   */
  function addComRegisterCommands() {
    var commands = $.inidb.GetKeyList('command', ''),
        i;
    for (i in commands) {
      if (!$.commandExists(commands[i])) {
        $.registerChatCommand('./commands/customCommands.js', commands[i], ($.inidb.exists('permcom', commands[i]) ? parseInt($.inidb.get('permcom', commands[i])) : 7));
      }
    }
  };

  /**
   * @function addComRegisterAliases
   */
  function addComRegisterAliases() {
    var commands = $.inidb.GetKeyList('aliases', ''),
        ownerCommand,
        i;
    for (i in commands) {
      if (!$.commandExists(commands[i])) {
        ownerCommand = $.inidb.get('aliases', commands[i]);
        $.registerChatCommand('./commands/customCommands.js', commands[i], $.getCommandGroup(ownerCommand));
      }
    }
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        username = $.username.resolve(sender, event.getTags()),
        command = event.getCommand(),
        args = event.getArgs(),
        argString = event.getArguments(),
        commandKey,
        commandArgument,
        list,
        i;

    /**
     * @commandpath addcom [command] [command text] - Add a custom command
     */
    if (command.equalsIgnoreCase('addcom')) {
      if (!$.isModv3(sender, event.getTags())) {
        $.say($.whisperPrefix(sender) + $.modMsg);
        return;
      }

      commandKey = (args[0] + '').replace(/^!/, '').toLowerCase();
      commandArgument = argString.substr(commandKey.length).trim();

      if ($.commandExists(commandKey) || commandKey.length == 0 || commandArgument.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.error', username));
        return;
      }

      $.registerChatCommand('./commands/customCommands.js', commandKey);
      $.inidb.set('command', commandKey, commandArgument);
      $.logEvent('customCommands.js', 50, username + ' created command "!' + commandKey + '" with message "' + commandArgument + '"');
      $.say($.whisperPrefix(sender) + $.lang.get("customcommands.add.success", username, commandKey));
    }

    /**
     * @commandpath delcom [command] - Delete a custom command
     */
    if (command.equalsIgnoreCase('delcom')) {
      if (!$.isModv3(sender, event.getTags())) {
        $.say($.whisperPrefix(sender) + $.modMsg);
        return;
      }

      commandKey = (args[0] + '').replace(/^!/, '').toLowerCase();
      list = $.inidb.GetKeyList('aliases', '');

      if (commandKey.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
        return;
      }

      if (!$.commandExists(commandKey)) {
        $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', commandKey));
        return;
      }

      for (i in list) {
        if ($.inidb.get('aliases', list[i]).equalsIgnoreCase(commandKey)) {
          $.unregisterChatCommand(list[i]);
          $.inidb.del('aliases', list[i]);
        }
      }

      $.unregisterChatCommand(commandKey);
      $.inidb.del('command', commandKey);
      $.inidb.del('permcom', commandKey);
      $.say($.whisperPrefix(sender) + $.lang.get("customcommands.delete.success", username, commandKey));
    }

    /**
     * @commandpath aliascom [alias] [command] - Create an alias to any command
     */
    if (command.equalsIgnoreCase('aliascom')) {
      if (!$.isModv3(sender, event.getTags())) {
        $.say($.whisperPrefix(sender) + $.modMsg);
        return;
      }

      commandKey = args[0].replace('!', '').toLowerCase();
      commandArgument = args[1].replace('!', '').toLowerCase();

      if (!commandKey || !commandArgument) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
      }

      if (!$.commandExists(commandArgument)) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404', username));
        return
      }

      if ($.inidb.exists('aliases', commandKey)) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error', username));
        return;
      }

      $.inidb.set('aliases', commandArgument, commandKey);
      $.registerChatCommand('./commands/customCommands.js', commandArgument);
      $.logEvent('customCommands.js', 59, username + ' added alias "!' + commandArgument + '" for "!' + commandKey + '"');
      $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', username, commandKey, commandArgument));
    }

    /**
     * @commandpath delalias [alias] - Delete an alias
     */
    if (command.equalsIgnoreCase('delalias')) {
      if (!$.isModv3(sender, event.getTags())) {
        $.say($.whisperPrefix(sender) + $.modMsg);
        return;
      }

      commandKey = (args[0] + '').replace(/^!(.*)/, '$1').toLowerCase();

      if (!commandKey) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
        return;
      }

      if (!$.inidb.exists('alias', commandKey)) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', username));
        return;
      }

      $.unregisterChatCommand(commandKey);
      $.inidb.del('aliases', commandKey);
      $.logEvent('customCommands.js', 56, username + ' deleted alias !' + commandKey);
      $.say($.whisperPrefix(sender) + $.lang.get("customcommands.delete.success", username, commandKey));
    }

    /**
     * @commandpath permcom [command] [groupId] - Set the permissions for a command
     */
    if (command.equalsIgnoreCase('permcom')) {
      var group;
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      commandKey = (args[0] + '').replace(/^!(.*)/, '$1').toLowerCase();
      group = (args[1] + '');

      if (!commandKey || !group) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.usage'));
        return;
      }

      if (isNaN(parseInt(group))) {
        group = $.getGroupIdByName(group);
      }

      $.inidb.set('permcom', commandKey, group);
      $.say($.whisperPrefix(sender) + $.lang.get("customcommands.set.perm.success", commandKey, $.getGroupNameById(group)));
    }

    /**
     * @commandpath pricecom [command] [amount] - Set the amount of points a command should cost
     */
    if (command.equalsIgnoreCase('pricecom')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      commandKey = (args[0] + '').replace(/^!(.*)/, '$1').toLowerCase();
      commandArgument = args[1];

      if (!commandKey || !commandArgument) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.usage'));
        return;
      }

      if (!$.commandExists(commandKey)) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
        return;
      }

      if (isNaN(parseInt(commandArgument)) || parseInt(commandArgument) < 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
        return;
      }

      $.inidb.set('pricecom', commandKey, commandArgument);
      list = $.inidb.GetKeyList('aliases', '');

      for (i in list) {
        for (i in list) {
          if ($.inidb.get('aliases', list[i]).equalsIgnoreCase(commandKey)) {
            $.inidb.set('pricecom', list[i], commandArgument);
          }
        }
      }

      $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', commandKey, commandArgument, $.pointNameMultiple));
    }

    if ($.inidb.exists('command', command.toLowerCase())) {
      commandArgument = $.inidb.get('command', command.toLowerCase());
      $.say(replaceCommandTags(commandArgument, event));
    }

    addComRegisterAliases();
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
      addComRegisterCommands();
      addComRegisterAliases();

      $.registerChatCommand('./commands/customCommands.js', 'addcom', 2);
      $.registerChatCommand('./commands/customCommands.js', 'pricecom', 2);
      $.registerChatCommand('./commands/customCommands.js', 'aliascom', 2);
      $.registerChatCommand('./commands/customCommands.js', 'delalias', 2);
      $.registerChatCommand('./commands/customCommands.js', 'delcom', 2);
      $.registerChatCommand('./commands/customCommands.js', 'permcom', 1);
    }
  });

  /** Export functions to API */
  $.returnCommandCost = returnCommandCost;
  $.replaceCommandTags = replaceCommandTags;
  $.permCom = permCom;
  $.getCommandPrice = getCommandPrice;
})();