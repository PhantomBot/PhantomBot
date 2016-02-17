/**
 * emotesHandler.js
 *
 * Pull down emotes from Twitch, BetterTTV and FrankerZ.
 */
(function () {
  var emotesString = ($.inidb.exists('emotecache', 'emotes') ? $.inidb.get('emotecache', 'emotes') : ""),
      emotesRegExpList = [];

  if (emotesString != "") {
    buildEmotesRegExp();
  }

  /**
   * @event emotesGet
   */
  $.bind('emotesGet', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/emotesHandler.js')) {
      return;
    }
    emotesString = event.getEmotes();
    $.writeToFile(emotesString, "emotesString", false);
    $.consoleLn("New emotes have been pushed from the Core.");
    $.inidb.set('emotecache', 'emotes', emotesString);
    buildEmotesRegExp();
  });

  /**
   * @function emotesLoaded
   * @export $.emotesHandler
   * @returns {boolean}
   */
  function emotesLoaded() {
    return (emotesRegExpList.length != 0);
  }

 /**
  * @function buildEmotesRegExp
  */
  function buildEmotesRegExp() {
    var emotesList = emotesString.split(","),
        emoteRegExp,
        newEmotesRegExpList = [];

    for (var i = 0; i < emotesList.length; i++) {
      // Check for emote at the beginning, middle and end of a string.
      emoteRegExp = '(^' + emotesList[i] + '|\\s' + emotesList[i] + '\\s|' + emotesList[i] + '$)';
      newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
    }
    emotesRegExpList = newEmotesRegExpList;
    $.consoleLn("Built " + emotesRegExpList.length + " regular expressions for emote handling.");
  }

  /**
   * @function getEmotesRegExp
   * @export $.emotesHandler
   * @returns {List}{RegExp}
   */
  function getEmotesRegExp() {
    return emotesRegExpList;
  }

 /**
  * @function getEmotesMatchCount
  * @export $.emotesHandler
  * @param {string}
  * @returns {number}
  */
  function getEmotesMatchCount(checkString)
  {
    var matches = 0,
        sequences;

    if (!emotesLoaded()) {
      return 0;
    }

    for (var i = 0; i < emotesRegExpList.length; i++) {
      sequences = checkString.match(emotesRegExpList[i]);
      matches += (sequences == null ? 0 : sequences.length);
    }
    return matches;
  }

  /**
   * Export functions to API
   */
  $.emotesHandler = {
    emotesLoaded: emotesLoaded,
    getEmotesRegExp: getEmotesRegExp,
    getEmotesMatchCount: getEmotesMatchCount,
  };

})();
