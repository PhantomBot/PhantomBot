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
    }, 120e3);

    /**
     * @event emotesGet
     */
    $.bind('emotesGet', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/emotesHandler.js')) {
            return;
        }
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
            emoteRegExp = '(\\b' + emote + '\\b)';
            newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
        }

        if (bttvLocalEmotes.has('emotes')) {
            jsonArray = bttvLocalEmotes.getJSONArray('emotes');
            for (i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString('code').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

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
                emote = jsonArray.getJSONObject(j).getString('name').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '(\\b' + emote + '\\b)';
                newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
            }
        }

        if (ffzLocalEmotes.has('room')) {
            currentSet = String(ffzLocalEmotes.getJSONObject('room').getInt('set'));
            jsonArray = ffzLocalEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (i = 0; i < jsonArray.length(); i++) {
                emote = jsonArray.getJSONObject(i).getString('name').replace('(', '\\(').replace(')', '\\)').replace('\'', '\\\'').replace('[', '\\[').replace(']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '(\\b' + emote + '\\b)';
                newEmotesRegExpList.push(new RegExp(emoteRegExp, 'g'));
            }
        }

        emotesRegExpList = newEmotesRegExpList;
        newEmotesRegExpList = [];
        $.inidb.set('emotecache', 'regexp_cache', emotesRegExpList.join(','));

        loaded = true;
        $.consoleDebug("Built " + emotesRegExpList.length + " regular expressions for emote handling.");
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

        loaded = true;
        $.consoleDebug("Built " + emotesRegExpList.length + " regular expressions for emote handling from cache.");
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

        var total = 0,
            sequences,
            i;

        for (i in emotesRegExpList) {
            sequences = message.match(emotesRegExpList[i]);
            if (sequences !== null) {
                total += sequences.length;
            }
        }

        return total;
    }

    /**
     * Export functions to API
     */
    $.emotesHandler = {
        getEmotesRegExp: getEmotesRegExp,
        getEmotesMatchCount: getEmotesMatchCount,
    };
})();
