/**
 * hostHandler.js
 *
 * Register and announce (un)host events.
 * Optionally supports rewarding points for a follow (Only every 6 hours!)
 */
(function () {
  var hostReward = ($.inidb.exists('settings', 'hostReward') ? $.inidb.get('settings', 'hostReward') : 200),
      hostTimeout = 216e5, //6 hours = 6 * 60 * 60 * 1000
      hostList = [],
      hostHistory = [],
      announceHosts = false;

  /**
   * @event twitchHostsInitialized
   */
  $.bind('twitchHostsInitialized', function () {
    $.consoleLn(">> Enabling new hoster announcements");
    announceHosts = true;
  });

  /**
   * @event twitchHosted
   */
  $.bind('twitchHosted', function (event) {
    var hoster = event.getHoster(),
        username = $.username.resolve(hoster),
        now = $.systemTime();

    if (!announceHosts) {
      return;
    }

    $.writeToFile(hoster, "./addons/hostHandler/latestHost.txt", false);

    if (hostList[hoster] > now || hostHistory[hoster] > now) {
      return;
    }

    hostList[hoster] = now + hostTimeout;

    if (hostReward > 0) {
      $.inidb.incr('points', hoster, hostReward);
      $.say($.lang.get('hosthandler.newhost.reward', username, hostReward));
    } else {
      $.say($.lang.get('hosthandler.newhost', username));
    }
  });

  /**
   * @event twitchUnhosted
   */
  $.bind('twitchUnhosted', function (event) {
    var hoster = event.getHoster(),
        i;
    for (i in hostList) {
      if (hoster.equalsIgnoreCase(i)) {
        hostHistory[i] = hostList[i];
        hostList.splice(i, 1);
        return;
      }
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        commandArg = parseInt(args[0]),
        temp = [],
        i;

    /**
     * @commandpath hostreward [amount] - Set the amount of points to reward when a channel starts hosting
     */
    if (command.equalsIgnoreCase('hostreward')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (isNaN(commandArg)) {
        $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.usage', $.pointNameMultiple));
        return;
      }

      $.inidb.set('settings', 'hostReward', commandArg);
      $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.success', $.getPointsString(commandArg)));
    }

    /**
     * @commandpath unhost - Send the /unhost command to twitch
     */
    if (command.equalsIgnoreCase('unhost')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      $.say('.unhost');
    }

    /**
     * @commandpath hostcount - Announce the current number of other channels hosting this channel
     */
    if (command.equalsIgnoreCase('hostcount')) {
      $.say($.lang.get('hosthandler.newhost', hostList.length));
    }

    /**
     * @commandpath hostlist - Announce a list of current other channels hosting this channel
     */
    if (command.equalsIgnoreCase('hostlist')) {
      for (i in hostList) {
        temp.push(i)
      }
      $.say($.lang.get('hosthandler.hostlist', temp.join(', ')));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
      if ($.bot.isModuleEnabled('./handlers/hostHandler.js')) {
        $.registerChatCommand('./handlers/hostHandler.js', 'hostreward', 1);
        $.registerChatCommand('./handlers/hostHandler.js', 'unhost', 1);
        $.registerChatCommand('./handlers/hostHandler.js', 'hostcount');
        $.registerChatCommand('./handlers/hostHandler.js', 'hostlist');
      }
    });
})();