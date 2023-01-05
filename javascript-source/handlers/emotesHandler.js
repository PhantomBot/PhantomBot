/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Packages */

/**
 * emotesHandler.js
 *
 * Pull down emotes from Twitch, BetterTTV and FrankerZ.
 */
(function() {
    var emotesRegExpList = [],
        loaded = false,
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

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
        var bttvEmotesCache = { global: [], local: [], shared: [] };
        var ffzEmotesCache = { global: [], local: [], shared: [] };

        jsonArray = bttvEmotes.getJSONArray('data');
        for (i = 0; i < jsonArray.length(); i++) {
            var emoteObject = jsonArray.getJSONObject(i);
            emote = emoteObject.getString('code');

            // Check for emote at the beginning, middle and end of a string.
            emoteRegExp = '\\b' + emote + '\\b';
            newEmotesRegExpList.push(emoteRegExp);
            // Grab a copy of the raw emote data for other purposes
            bttvEmotesCache.global.push({
                id: String(emoteObject.getString('id')),
                code: String(emote),
                imageType: String(emoteObject.getString('imageType'))
            });
        }

        if (bttvLocalEmotes.has('channelEmotes')) {
            jsonArray = bttvLocalEmotes.getJSONArray('channelEmotes');
            for (i = 0; i < jsonArray.length(); i++) {
                var emoteObject = jsonArray.getJSONObject(i);
                emote = emoteObject.getString('code');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);
                // Grab a copy of the raw emote data for other purposes
                bttvEmotesCache.local.push({
                    id: String(emoteObject.getString('id')),
                    code: String(emote),
                    imageType: String(emoteObject.getString('imageType'))
                });
            }
        }

        if (bttvLocalEmotes.has('sharedEmotes')) {
            jsonArray = bttvLocalEmotes.getJSONArray('sharedEmotes');
            for (i = 0; i < jsonArray.length(); i++) {
                var emoteObject = jsonArray.getJSONObject(i);
                emote = emoteObject.getString('code');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);
                // Grab a copy of the raw emote data for other purposes
                bttvEmotesCache.shared.push({
                    id: String(emoteObject.getString('id')),
                    code: String(emote),
                    imageType: String(emoteObject.getString('imageType'))
                });
            }
        }

        defaultSets = ffzEmotes.getJSONArray('default_sets');
        for (i = 0; i < defaultSets.length(); i++) {
            currentSet = String(defaultSets.getInt(i));
            jsonArray = ffzEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (j = 0; j < jsonArray.length(); j++) {
                var emoteObject = jsonArray.getJSONObject(j);
                emote = $.replace($.replace($.replace($.replace($.replace(emoteObject.getString('name'), '(', '\\('), ')', '\\)'), '\'', '\\\''), '[', '\\['), ']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);

                // Grab a copy of the raw emote data for other purposes
                ffzEmotesCache.global.push({
                    id: Number(emoteObject.getInt('id')),
                    code: String(emoteObject.getString('name'))
                });
            }
        }

        if (ffzLocalEmotes.has('room')) {
            currentSet = String(ffzLocalEmotes.getJSONObject('room').getInt('set'));
            jsonArray = ffzLocalEmotes.getJSONObject('sets').getJSONObject(currentSet).getJSONArray('emoticons');
            for (i = 0; i < jsonArray.length(); i++) {
                var emoteObject = jsonArray.getJSONObject(i);
                emote = $.replace($.replace($.replace($.replace($.replace(emoteObject.getString('name'), '(', '\\('), ')', '\\)'), '\'', '\\\''), '[', '\\['), ']', '\\]');

                // Check for emote at the beginning, middle and end of a string.
                emoteRegExp = '\\b' + emote + '\\b';
                newEmotesRegExpList.push(emoteRegExp);

                // Grab a copy of the raw emote data for other purposes
                ffzEmotesCache.global.push({
                    id: Number(emoteObject.getInt('id')),
                    code: String(emoteObject.getString('name'))
                });
            }
        }

        _lock.lock();
        try {
            emotesRegExpList = new RegExp(newEmotesRegExpList.join('|'), 'g');
        } finally {
            _lock.unlock();
        }
        $.inidb.set('emotecache', 'regexp_cache', newEmotesRegExpList.join(','));
        $.inidb.set('emotecache', 'bttvEmotes', JSON.stringify(bttvEmotesCache));
        $.inidb.set('emotecache', 'ffzEmotes', JSON.stringify(ffzEmotesCache));

        loaded = true;
        $.consoleDebug("Built " + newEmotesRegExpList.length + " regular expressions for emote handling.");
        $.consoleDebug("Loaded Emotes from BetterTwitchTV: " + bttvEmotesCache.global.length + " global, " + bttvEmotesCache.shared.length + " shared, " + bttvEmotesCache.local.length + " local");
        $.consoleDebug("Loaded Emotes from FrankerFacez: " + ffzEmotesCache.global.length + " global, " + ffzEmotesCache.shared.length + " shared, " + ffzEmotesCache.local.length + " local");

        var EventBus = Packages.tv.phantombot.event.EventBus;
        var EmotesCacheUpdatedEvent = Packages.tv.phantombot.event.emotes.EmotesCacheUpdatedEvent;
        EventBus.instance().post(new EmotesCacheUpdatedEvent(bttvEmotesCache, ffzEmotesCache));
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

        _lock.lock();
        try {
            emotesRegExpList = new RegExp(newEmotesRegExpList.join('|'), 'g');
        } finally {
            _lock.unlock();
        }

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
        _lock.lock();
        try {
            return emotesRegExpList;
        } finally {
            _lock.unlock();
        }
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

        _lock.lock();
        try {
            var matched = message.match(emotesRegExpList);
        } finally {
            _lock.unlock();
        }

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
