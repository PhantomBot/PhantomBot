/**
 * ranks.js
 *
 * Provide an API for custom user titles
 * use the $ API
 */
(function () {
  /**
   * @function hasRank
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function hasRank(username) {
    return $.inidb.exists('viewerRanks', username.toLowerCase());
  };

  /**
   * @function getRank
   * @export $
   * @param {string} username
   * @returns {string}
   */
  function getRank(username) {
    if (hasRank(username)) {
      return $.inidb.get('viewerRanks', username.toLowerCase());
    } else {
      return '';
    }
  };

  /**
   * @function removeRank
   * @param {string} username
   */
  function removeRank(username) {
    if (hasRank(username)) {
      $.inidb.del('viewerRanks', username.toLowerCase());
      $.say($.username.resolve(username) + ' has been demoted from their rank.')
    }
  };

  /**
   * @function setRank
   * @param {string} username
   * @param {string} rank
   */
  function setRank(username, rank) {
    $.inidb.set('viewerRanks', username.toLowerCase(), rank);
    $.say($.username.resolve(username) + ' has been promoted to "' + rank + '"!');
  };

  /**
   * @function getRankTimeSetting
   * @returns {Number}
   */
  function getRankTimeSetting() {
    return ($.inidb.exists('settings', 'rankEligableTime') ? $.inidb.exists('settings', 'rankEligableTime') : 50);
  };

  /**
   * @function resolveRank
   * @export $
   * @param {string} username
   * @returns {string}
   */
  function resolveRank(username) {
    return (getRank(username) + ' ' + $.username.resolve(username)).trim();
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase();
    var username = $.username.resolve(sender);
    var command = event.getCommand();
    var args = event.getArgs();
    var action = args[0];

    /**
     * @commandpath rank - Announce YOUR current rank
     */
    if (command.equalsIgnoreCase('rank')) {
      if (action && $.isMod(sender)) {
        var subject = args[1].toLowerCase();

        /**
         * @commandpath rank set [username] [rank] - Set a user's rank, may contain spaces
         */
        if (action == 'set' && subject) {
          var rankName = args.splice(2).join(' ');
          if (rankName) {
            setRank(subject, rankName);
          }
        }

        /**
         * @commandpath rank del [username] - Unset a user's rank
         */
        if (action == 'del' && subject) {
          removeRank(subject);
        }

        /**
         * @commandpath rank settime [hours] - Set the amount of hours a user has to be in the chat to be eligable for a rank (Esthetic only)
         */
        if (action == 'settime' && subject && !isNaN(parseInt(subject))) {
          $.inidb.set('settings', 'rankEligableTime', subject);
          $.say($.whisperPrefix(sender) + 'Set minimal time required for a rank to ' + subject + ' hours.');
        }
      } else {
        if (hasRank(sender)) {
          $.say(username + ', your rank is currently "' + getRank(sender) + '".');
        } else {
          $.say(username + ', you currently do not have a rank. You can get one if you\'ve been in this chat for ' + getRankTimeSetting() + ' hours or more.');
        }
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./core/ranks.js')) {
      $.registerChatCommand('./core/ranks.js', 'rank', 7);
    }
  });

  /** Export functions to API */
  $.resolveRank = resolveRank;
  $.getRank = getRank;
  $.hasRank = hasRank;
})();