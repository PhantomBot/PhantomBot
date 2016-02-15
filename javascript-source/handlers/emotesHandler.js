/**
 * emotesHandler.js
 *
 * Pull down emotes from Twitch, BetterTTV and FrankerZ.
 */

/* Note that the handlers in Core have been disabled for now while still testing. */

(function () {
  var freshEmotes = false,
      emotesString = ($.inidb.exists('emotecache', 'emotes') ? $.inidb.get('emotecache', 'emotes') : "");
      emotesRegExpList = [];

  if (emotesString != "") {
    freshEmotes = true;
    getEmotesRegExp();
  }

  /**
   * @event emotesGet
   */
  $.bind('emotesGet', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/emotesHandler.js')) {
      return;
    }
    emotesString = event.getEmotes();
    $.consoleLn("New emotes have been pushed from the Core.");
    $.inidb.set('emotecache', 'emotes', emotesString);
    freshEmotes = true;
  });

  /**
   * @function emotesLoaded
   * @export $.emotesHelper
   * @param {Object} event
   * @returns {number}
   */
  function emotesLoaded() {
    return (emotesString != "");
  }

  /**
   * @function getEmotesRegExp
   * @export $.emotesHelper
   * @returns {List}{RegExp}
   */
  function getEmotesRegExp() {
    if (freshEmotes) {
      var emotesList = emotesString.split(","),
          emoteRegExp;

      emotesRegExpList = [];
      $.writeToFile("", "emoteRegExp", false);
      for (var i = 0; i < emotesList.length; i++) {
        // Check for emote at the beginning, middle and end of a string.
        emoteRegExp = '(^' + emotesList[i] + '|\\s' + emotesList[i] + '\\s|' + emotesList[i] + '$)';
        emotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
        $.writeToFile(emoteRegExp, "emoteRegExp", true);
      }
      freshEmotes = false;
      $.consoleLn("Built " + emotesList.length + " regular expressions for emote handling.");
    }
    return emotesRegExpList;
  }

  /**
   * Export functions to API
   */
  $.emotesHelper = {
    emotesLoaded: emotesLoaded,
    getEmotesRegExp: getEmotesRegExp,
  };

})();
