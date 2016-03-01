/**
 * raidSystem.js
 *
 * Register and announce incomming/outgoing raids
 */
(function () {
  var raidMessage = ($.inidb.exists('settings', 'raidMessage') ? $.inidb.get('settings', 'raidMessage') : $.lang.get('raidsystem.message.nomessageset', $.ownerName));

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        username = (args[0] ? args[0].toLowerCase() : false),
        count;

    /**
     * @commandpath raid [channelname] - Announce and register a new outgoing raid
     */
    if (command.equalsIgnoreCase('raid')) {
      if (!username) {
        $.say($.whisperPrefix(sender) + $.lang.get('raidsystem.raid.usage'));
        return;
      }

      if ($.bot.isModuleEnabled('./core/commandPause.js')) {
        $.commandPause.pause(300);
      }
      $.inidb.incr('outgoingRaids', username, 1);
      $.say($.lang.get('raidsystem.raid', $.username.resolve(username), raidMessage));
    }

    /**
     * @commandpath raider [channelname] - Announce and register a new incoming raid
     */
    if (command.equalsIgnoreCase('raider')) {
      if (!username) {
        $.say($.whisperPrefix(sender) + $.lang.get('raidsystem.raider.usage'));
        return;
      }

      $.inidb.incr('incommingRaids', username, 1);
      count = parseInt($.inidb.get('incommingRaids', username));
      $.say($.lang.get('raidsystem.raided', $.username.resolve(username), count));
    }

    /**
     * @commandpath setraidmsg [message...] - Set a message for users to copy/paste into the target's chat
     */
    if (command.equalsIgnoreCase('setraidmsg')) {
      if (!args || args.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('raidsystem.message.usage'));
        return;
      }

      raidMessage = args.join(' ');
      $.inidb.set('settings', 'raidMessage', raidMessage);
      $.say($.whisperPrefix(sender) + $.lang.get('raidsystem.message.setsuccess', raidMessage));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/raidSystem.js')) {
      $.consoleDebug($.lang.get('raidsystem.console.announceraidmsg', raidMessage));

      $.registerChatCommand('./systems/raidSystem.js', 'raid', 2);
      $.registerChatCommand('./systems/raidSystem.js', 'raider', 2);
      $.registerChatCommand('./systems/raidSystem.js', 'setraidmsg', 1);
    }
  });
})();
