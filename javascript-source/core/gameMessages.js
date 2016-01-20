/**
 * gameMessages.js
 *
 * An API for predefined game result messages
 * Use the $.gameMessages API
 */
(function () {
  var lostMessagesCount = 0,
      winMessagesCount = 0,
      lastRandom = -1;

  /**
   * @function loadResponses
   */
  function loadResponses() {
    var i;

    for (i = 1; $.lang.exists('gamemessages.win.' + i); i++) {
      winMessagesCount++;
    }

    for (i = 1; $.lang.exists('gamemessages.lost.' + i); i++) {
      lostMessagesCount++;
    }

    $.consoleLn($.lang.get('gamemessages.console.loaded', winMessagesCount, lostMessagesCount));
  };

  /**
   * @function getWin
   * @export $.gameMessages
   * @param {string} username
   * @returns {string}
   */
  function getWin(username) {
    var rand;
    do {
      rand = $.randRange(1, winMessagesCount);
    } while (rand == lastRandom);
    lastRandom = rand;
    return $.lang.get('gamemessages.win.' + rand, $.resolveRank(username));
  };

  /**
   * @function getLose
   * @export $.gameMessages
   * @param {string} username
   * @returns {string}
   */
  function getLose(username) {
    var rand;
    do {
      rand = $.randRange(1, lostMessagesCount);
    } while (rand == lastRandom);
    lastRandom = rand;
    return $.lang.get('gamemessages.lost.' + rand, $.resolveRank(username));
  };

  var t = setTimeout(function () {
    if ($.bot.isModuleEnabled('./core/gameMessages.js')) {
      loadResponses();
    }
    clearTimeout(t);
  }, 5e3);

  /** Export functions to API */
  $.gameMessages = {
    getWin: getWin,
    getLose: getLose,
  };
})();