/**
 * topCommand.js
 *
 * Build and announce lists of top viewers (Highest points, highest time spent in the channel)
 */
(function () {
  /**
   * @function getTop5
   * @param {string} iniName
   * @returns {Array}
   */
  function getTop5(iniName) {
    var keys = $.inidb.GetKeyList(iniName, ''),
        list = [],
        i;

    for (i in keys) {
      list.push({
        username: keys[i],
        value: $.inidb.get(iniName, keys[i])
      });
    }

    list.sort(function (a, b) {
      return (b.value - a.value);
    });

    return list.splice(0, 5);
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var command = event.getCommand(),
        top5 = [],
        c = 1,
        temp,
        i;

    /**
     * @commandpath top5 - Get the top 5 viewers in the channel
     */
    if (command.equalsIgnoreCase('top5')) {
      temp = getTop5('points');

      for (i in temp) {
        top5.push(c + '. ' + $.resolveRank(temp[i].username + ' ' + $.getPointsString(temp[i].value)));
        c++;
      }

      $.say($.lang.get('top5.default', $.pointNameMultiple, top5.join(', ')));
    }

    /**
     * @commandpath top5time - Get the top 5 viewers in the channel with time
     */
    if (command.equalsIgnoreCase('top5time')) {
      temp = getTop5('time');

      for (i in temp) {
        top5.push(c + '. ' + $.resolveRank(temp[i].username + ' ' + $.getTimeString(temp[i].value, true)));
        c++;
      }

      $.say($.lang.get('top5.default', 'time', top5.join(', ')));
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./commands/topCommand.js')) {
      $.registerChatCommand('./commands/topCommand.js', 'top5', 7);
      $.registerChatCommand('./commands/topCommand.js', 'top5time', 7);
    }
  });
})();