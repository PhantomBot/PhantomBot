/**
 * emotesHandler.js
 *
 * Pull down emotes from Twitch, BetterTTV and FrankerZ.
 */
(function() {
    var emotesRegExpList = [],
        timeout;

    // Load an existing emote RegExp cache.  Wait to see if there was a problem that needs us to load
    // from cache before doing so.  This saves CPU cycles and memory.
    timeout = setTimeout(function() { if (emotesRegExpList.length === 0) { loadEmoteCache(); } clearTimeout(timeout); }, 120e3);

    /**
     * @event emotesGet
     */
    $.bind('emotesGet', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/emotesHandler.js')) {
            return;
        }
        buildEmotesDB(event.getTwitchEmotes(), event.getBttvEmotes(), event.getBttvLocalEmotes(), event.getFfzEmotes(), event.getFfzLocalEmotes());
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
     * @function buildEmotesDB
     */
    function buildEmotesDB(twitchEmotes, bttvEmotes, bttvLocalEmotes, ffzEmotes, ffzLocalEmotes) {
        var defaultSets = [],
            jsonArray = [],
            currentSet,
            emote,
            i, j,
            emoteRegExp,
            newEmotesRegExpList = [];

        jsonArray = twitchEmotes.getJSONArray('emoticons');
        for (i = 0; i < jsonArray.length(); i++) {
            // Check for emote at the beginning, middle and end of a string.
            emote = jsonArray.getJSONObject(i).getString('regex');
            emoteRegExp = '(\\b' + emote + '\\b)';
            newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
        }

        jsonArray = bttvEmotes.getJSONArray('emotes');
        for (i = 0; i < jsonArray.length(); i++) {
            emote = jsonArray.getJSONObject(i).getString('code').replace('(', '\\(')
                                                                .replace(')', '\\)')
                                                                .replace('\'', '\\\'')
                                                                .replace('[', '\\[')
                                                                .replace(']', '\\]');

            // Check for emote at the beginning, middle and end of a string.
            emoteRegExp = '(\\b' + emote + '\\b)';
            newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
        }

        if (bttvLocalEmotes.has('emotes')) {
            jsonArray = bttvLocalEmotes.getJSONArray('emotes');
            for (i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString('code').replace('(', '\\(')
                                                                    .replace(')', '\\)')
                                                                    .replace('\'', '\\\'')
                                                                    .replace('[', '\\[')
                                                                    .replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '(\\b' + emote + '\\b)';
                newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
            }
        }

        defaultSets = ffzEmotes.getJSONArray('default_sets');
        for (i = 0; i < defaultSets.length(); i++) {
            currentSet = String(defaultSets.getInt(i));
            jsonArray = ffzEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (j = 0; j < jsonArray.length(); j++) {
                emote = jsonArray.getJSONObject(j).getString('name').replace('(', '\\(')
                                                                    .replace(')', '\\)')
                                                                    .replace('\'', '\\\'')
                                                                    .replace('[', '\\[')
                                                                    .replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '(\\b' + emote + '\\b)';
                newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
            }
        }

        if (ffzLocalEmotes.has('room')) {
            currentSet = String(ffzLocalEmotes.getJSONObject('room').getInt('set'));
            jsonArray = ffzLocalEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString('code').replace('(', '\\(')
                                                                    .replace(')', '\\)')
                                                                    .replace('\'', '\\\'')
                                                                    .replace('[', '\\[')
                                                                    .replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '(\\b' + emote + '\\b)';
                newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
            }
        }
        emotesRegExpList = newEmotesRegExpList;
        newEmotesRegExpList = [];
        $.inidb.set('emotecache', 'regexp_cache', emotesRegExpList.join(','));

        $.consoleDebug("Built " + emotesRegExpList.length + " regular expressions for emote handling.");
        $.log.event("Built " + emotesRegExpList.length + " regular expressions for emote handling.");
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
            newEmotesRegExpList.push(new RegExp(regExpList[i]));
        }
        emotesRegExpList = newEmotesRegExpList;
        newEmotesRegExpList = [];

        $.consoleDebug("Built " + emotesRegExpList.length + " regular expressions for emote handling from cache.");
        $.log.event("Built " + emotesRegExpList.length + " regular expressions for emote handling from cache.");

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
            length = 0,
            sequences,
            retObject = {};

        if (!emotesLoaded()) {
            retObject = { "matches" : 0, "length" : 0 };
            return retObject;
        }

        for (var i = 0; i < emotesRegExpList.length; i++) {
            sequences = checkString.match(emotesRegExpList[i]);
            if (sequences !== null) {
                matches += sequences.length;
                for (var j = 0; j < sequences.length; j++) {
                    length += sequences[j].length;
              }
            }
        }
        retObject = { "matches" : matches, "length" : length };
        return retObject;
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
