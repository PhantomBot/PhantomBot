/**
 * raidSystem.js
 *
 * Register and announce incomming/outgoing raids
 */
(function () {
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
      $.say($.lang.get('raidsystem.raid', $.username.resolve(username)));
    }

    /**
     * @commandpath raider [channelname] - Announce and register a new incomming raid
     */
    if (command.equalsIgnoreCase('raider')) {
      if (!username) {
        $.say($.whisperPrefix(sender) + $.lang.get('raidsystem.raider.usage'));
        return;
      }

      count = parseInt($.inidb.get('incommingRaids', username)) + 1;
      $.inidb.incr('incommingRaids', username, 1);
      $.say($.lang.get('raidsystem.raided', $.username.resolve(username), $.getOrdinal(count)));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/raidSystem.js')) {
      $.registerChatCommand('./systems/raidSystem.js', 'raid', 2);
      $.registerChatCommand('./systems/raidSystem.js', 'raider', 2);
    }
  });
})();