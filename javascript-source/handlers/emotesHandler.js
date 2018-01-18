/**
 * emotesHandler.js
 *
 * Pull down emotes from Twitch, BetterTTV and FrankerZ.
 */
(function() {
    var emotesRegExpList = [],
        loaded = false;

    // Load an existing emote RegExp cache.  Wait to see if there was a problem that needs us to load
    // from cache before doing so.  This saves CPU cycles and memory.
    setTimeout(function() {
        if (emotesRegExpList.length === 0) {
            loadEmoteCache();
        }
    }, 3e4, 'scripts::handlers::emotesHandler.js');

    /**
     * @event emotesGet
     */
    $.bind('emotesGet', function(event) {
        buildEmotesDB(event.getBttvEmotes(), event.getBttvLocalEmotes(), event.getFfzEmotes(), event.getFfzLocalEmotes());
    });

    /**
     * @function buildEmotesDB
     */
    function buildEmotesDB(bttvEmotes, bttvLocalEmotes, ffzEmotes, ffzLocalEmotes) {
        var defaultSets = [],
            jsonArray = [],
            currentSet,
            emote,
            i, j,
            emoteRegExp,
            newEmotesRegExpList = [];

        jsonArray = bttvEmotes.getJSONArray('emotes');
        for (i = 0; i < jsonArray.length(); i++) {
            emote = jsonArray.getJSONObject(i).getString('code').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

            // Check for emote at the beginning, middle and end of a string.
            emoteRegExp = '\\b' + emote + '\\b';
            newEmotesRegExpList.push(emoteRegExp);
        }

        if (bttvLocalEmotes.has('emotes')) {
            jsonArray = bttvLocalEmotes.getJSONArray('emotes');
            for (i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString('code').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);
            }
        }

        defaultSets = ffzEmotes.getJSONArray('default_sets');
        for (i = 0; i < defaultSets.length(); i++) {
            currentSet = String(defaultSets.getInt(i));
            jsonArray = ffzEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (j = 0; j < jsonArray.length(); j++) {
                emote = jsonArray.getJSONObject(j).getString('name').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);
            }
        }

        if (ffzLocalEmotes.has('room')) {
            currentSet = String(ffzLocalEmotes.getJSONObject('room').getInt('set'));
            jsonArray = ffzLocalEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString('name').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);
            }
        }

        emotesRegExpList = new RegExp(newEmotesRegExpList.join('|'), 'g');
        $.inidb.set('emotecache', 'regexp_cache', newEmotesRegExpList.join(','));

        loaded = true;
        $.consoleDebug("Built " + newEmotesRegExpList.length + " regular expressions for emote handling.");
        newEmotesRegExpList = [];
    }

    /**
     * @function loadEmoteCache
     */
    function loadEmoteCache() {
        if (!$.inidb.exists('emotecache', 'regexp_cache')) {
            return;
        }

        var regExpList = $.inidb.get('emotecache', 'regexp_cache').split(','),
            newEmotesRegExpList = [];

        for (var i = 0; i < regExpList.length; i++) {
            newEmotesRegExpList.push(regExpList[i]);
        }

        emotesRegExpList = new RegExp(newEmotesRegExpList.join('|'), 'g');

        loaded = true;
        $.consoleDebug("Built " + newEmotesRegExpList.length + " regular expressions for emote handling from cache.");
        newEmotesRegExpList = [];
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
    function getEmotesMatchCount(message) {
        if (!loaded) {
            return 0;
        }

        var matched = message.match(emotesRegExpList);

        return (matched !== null ? matched.length : 0);
    }

    /**
     * Export functions to API
     */
    $.emotesHandler = {
        getEmotesRegExp: getEmotesRegExp,
        getEmotesMatchCount: getEmotesMatchCount
    };
})();