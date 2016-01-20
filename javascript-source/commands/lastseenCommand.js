/**
 * lastseenCommand.js
 *
 * This module stores the dates of when users have last been interacting with the chat
 */
(function () {
  /**
   * @event ircChannelJoin
   */
  $.bind('ircChannelJoin', function (event) {
    $.inidb.set('lastseen', event.getUser().toLowerCase(), $.systemTime());
  });

  /**
   * @event ircChannelLeave
   */
  $.bind('ircChannelLeave', function (event) {
    $.inidb.set('lastseen', event.getUser().toLowerCase(), $.systemTime());
  });

  /**
   * @event ircChannelMessage
   */
  $.bind('ircChannelMessage', function (event) {
    $.inidb.set('lastseen', event.getSender().toLowerCase(), $.systemTime());
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        target = args[0],
        date;

    /**
     * @commandpath lastseen [username] - Find out when the given user interacted with the chat
     */
    if (command.equalsIgnoreCase('lastseen')) {
      if (!target || target == '') {
        $.say($.whisperPrefix(sender) + $.lang.get('lastseen.usage'));
        return;
      }

      target = target.toLowerCase();

      if ($.inidb.exists('lastseen', target)) {
        date = new Date(parseInt($.inidb.get('lastseen', target.toLowerCase())));
        $.say($.whisperPrefix(sender) + $.lang.get('lastseen.response', $.username.resolve(target), date.toLocaleDateString(), date.toLocaleTimeString()));
      } else {
        $.say($.whisperPrefix(sender) + $.lang.get('lastseen.404', $.username.resolve(target)));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./commands/lastseenCommand.js')) {
      $.registerChatCommand('./commands/lastseenCommand.js', 'lastseen', 6);
    }
  });
})();