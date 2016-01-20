/**
 * cleanupSystem.js
 *
 * A module that enables channel owners to clean the bot's database.
 * It cleans the database of users that haven't been in the channel for more than
 * 30 minutes and have last been seen 3+ months ago.
 */
(function () {
  var lastseenMaxDiff = 2592e6,
      timeMin = 18e3,
      logName = 'viewerCleanup',
      running = false;

  /**
   * @function runCleanup
   * @returns {boolean}
   */
  function runCleanup() {
    var visited = $.inidb.GetKeyList('visited', ''),
        now = $.systemTime(),
        lastseen,
        time,
        points,
        i;

    running = !running;

    for (i in visited) {
      lastseen = ($.inidb.exists('lastseen', visited[i]) ? parseInt($.inidb.get('lastseen', visited[i])) : 0);
      time = ($.inidb.exists('time', visited[i]) ? parseInt($.inidb.get('time', visited[i])) : 0);

      if (time < timeMin && lastseen < (now - lastseenMaxDiff)) {
        if ($.inidb.exists('time', visited[i])) {
          $.inidb.del('time', visited[i]);
        }

        if ($.inidb.exists('points', visited[i])) {
          points = $.inidb.get('points', visited[i]);
          $.inidb.del('points', visited[i]);
        }

        if ($.inidb.exists('heistPayouts', visited[i])) {
          $.inidb.del('heistPayouts', visited[i]);
        }

        $.inidb.del('visited', visited[i]);
        $.log(logName, $.username.resolve(visited[i]) + ' Time: ' + time + ', Points: ' + points, '');
      }

      if ($.getPercentage(i, visited.length) % 10 == 0) {
        $.consoleLn($.lang.get('cleanupsystem.run.progress', $.getPercentage(i, visited.length)));
      }
    }

    running = !running;
    return true;
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand();

    /**
     * @commandpath cleanup - Run a cleanup on the bot's database (Removing any data from users that haven't been seen for a while)
     */
    if (command.equalsIgnoreCase('cleanup') && !running) {
      if (runCleanup()) {
        $.say($.whisperPrefix(sender) + $.lang.get('cleanupsystem.run.success'));
      } else {
        $.say($.whisperPrefix(sender) + $.lang.get('cleanupsystem.run.error'));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/cleanupSystem.js')) {
      $.registerChatCommand('./systems/cleanupSystem.js', 'cleanup', 1);
    }
  });
})();