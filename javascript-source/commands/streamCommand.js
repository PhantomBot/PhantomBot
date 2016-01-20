/**
 * streamCommand.js
 *
 * This module offers commands to view/alter channel information like current game, title and status
 */
(function () {
  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        argsString = event.getArguments().trim();

    /**
     * @commandpath online - Tell if the stream is online or not
     */
    if (command.equalsIgnoreCase('online')) {
      if ($.isOnline($.channelName)) {
        $.say($.whisperPrefix(sender) + 'Stream is online!');
      } else {
        $.say($.whisperPrefix(sender) + 'Stream is offline.');
      }
    }

    /**
     * @commandpath viewers - Announce the current amount of viewers in the chat
     */
    if (command.equalsIgnoreCase('viewers')) {
      $.say($.whisperPrefix(sender) + 'Currently ' + $.getViewers($.channelName) + ' viewers are watching ' + $.username.resolve($.channelName) + '!');
    }

    /**
     * @commandpath game - Announce the current set game
     * @commandpath game [game title] - Set the game
     */
    if (command.equalsIgnoreCase('game')) {
      if ($.strlen(argsString) == 0) {
        $.say('Current Game: ' + $.getGame($.channelName));
      } else {
        if (!$.isAdmin(sender)) {
          $.say($.whisperPrefix(sender) + $.casterMsg);
          return;
        }

        $.updateGame($.channelName, argsString, sender);
      }
    }

    /**
     * @commandpath title - Announce the current set stream title
     * @commandpath title [title] - Set the stream title
     */
    if (command.equalsIgnoreCase('title')) {
      if ($.strlen(argsString) == 0) {
        $.say('Current Status: ' + $.getStatus($.channelName));
      } else {
        if (!$.isAdmin(sender)) {
          $.say($.whisperPrefix(sender) + $.casterMsg);
          return;
        }

        $.updateStatus($.channelName, argsString, sender);
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./commands/streamCommand.js')) {
      $.registerChatCommand('./commands/streamCommand.js', 'online');
      $.registerChatCommand('./commands/streamCommand.js', 'viewers');
      $.registerChatCommand('./commands/streamCommand.js', 'game');
      $.registerChatCommand('./commands/streamCommand.js', 'title');
    }
  });
})();