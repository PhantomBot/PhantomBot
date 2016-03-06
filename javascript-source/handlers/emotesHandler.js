/**
 * emotesHandler.js
 *
 * Pull down emotes from Twitch, BetterTTV and FrankerZ.
 */
(function() {
    var emotesRegExpList = [];

    // Attempt to build the regular expression cache from the inidb.
    buildEmotesRegExp();

    /**
     * @event emotesGet
     */
    $.bind('emotesGet', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/emotesHandler.js')) {
            return;
        }
        emotesString = event.getEmotes();
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
        var emotesList,
            emoteRegExp,
            newEmotesRegExpList = [];

        if (!$.inidb.exists('emotecache', 'emotes')) {
            return;
        }

        emotesList = $.inidb.get('emotecache', 'emotes').split(",");

        for (var i = 0; i < emotesList.length; i++) {
            // Check for emote at the beginning, middle and end of a string.
            emoteRegExp = '(\\b' + emotesList[i] + '\\b)';
            newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
        }
        emotesRegExpList = newEmotesRegExpList;
        $.consoleDebug("Built " + emotesRegExpList.length + " regular expressions for emote handling.");
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
    function getEmotesMatchCount(checkString) {
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