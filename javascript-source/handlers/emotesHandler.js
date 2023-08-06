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
        buildEmotesCache(event.getEmotesSet());
    });

    /**
     * @function buildEmotesCache
     **/
    function buildEmotesCache(emoteSets) {
        // emotesSet: List<EmotesCache.EmotesSet>
        let newEmotesRegExpList = [];
        let providerEmoteMap = {};
        $.consoleDebug("Building Emote cache");
        for (let i = 0; i < emoteSets.size(); i++){
            let currentSet = emoteSets.get(i); // EmotesSet
            let providerEmotes = {
                local: convertEmoteEntryList(currentSet.getLocalEmotes()),
                shared: convertEmoteEntryList(currentSet.getSharedEmotes()),
                global:  convertEmoteEntryList(currentSet.getGlobalEmotes())
            };
            providerEmotes.local.concat(providerEmotes.shared, providerEmotes.global).forEach(emote => {
                newEmotesRegExpList.push('\\b' + emote.code + '\\b');
            });
            providerEmoteMap[String(currentSet.getProvider())] = providerEmotes;
            $.consoleDebug("Loaded Emotes from " + currentSet.getProvider() + ": " + providerEmotes.global.length + " global, " + providerEmotes.shared.length + " shared, " + providerEmotes.local.length + " local");
        }

        _lock.lock();
        try {
            emotesRegExpList = new RegExp(newEmotesRegExpList.join('|'), 'g');
        } finally {
            _lock.unlock();
        }

        $.inidb.set('emotecache', 'regexp_cache', newEmotesRegExpList.join(','));
        for (let providerKey in providerEmoteMap){
            $.inidb.set('emotecache', providerKey + 'Emotes', JSON.stringify(providerEmoteMap[providerKey]));
        }

        loaded = true;

        var EventBus = Packages.tv.phantombot.event.EventBus;
        var EmotesCacheUpdatedEvent = Packages.tv.phantombot.event.emotes.EmotesCacheUpdatedEvent;
        EventBus.instance().post(new EmotesCacheUpdatedEvent(providerEmoteMap));
    }

    function convertEmoteEntryList(list) {
        let result = [];
        if (list != null){
            for (let i = 0; i < list.size(); i++) {
                let emote = list.get(i);
                result.push({
                    id: String(emote.getId()),
                    code: String(emote.getCode())
                });
            }
        }
        return result;
    }

    /**
     * @function loadEmoteCache
     */
    function loadEmoteCache() {
        let regExpList = $.optIniDbString('emotecache', '', 'regexp_cache');
        if (!regExpList.isPresent()) {
            return;
        }

        let newEmotesRegExpList = [];
        regExpList = regExpList.get().split(',');

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
