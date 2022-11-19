(function () {
    const emoteProvider = 'bttv';
    var emotes = [],
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    function loadCacheFromDatabase() {
        var cacheContents = $.inidb.get('emotecache', 'bttvEmotes');
        if (cacheContents !== undefined && cacheContents !== null && cacheContents.length() > 0) {
            prepareLocalCache(JSON.parse(cacheContents));
        } else {
            // No cache :(
            $.consoleLn('No cache data for BTTV Emote Handler');
        }
    }

    function prepareLocalCache(bttvEmoteCache) {
        _lock.lock();
        try {
            emotes = [];
            // Flatten the object, no need to distinguish
            Object.keys(bttvEmoteCache).forEach((key) => {
                bttvEmoteCache[key].forEach((emote) => {
                    emotes.push(emote);
                });
            });
        } finally {
            _lock.unlock();
        }
    }

    $.bind('ircChannelMessage', function (event) {
        var message = String(event.getMessage());
        _lock.lock();
        try {
            emotes.forEach((emote) => {
                var count = 0;
                var lastPosition = message.indexOf(emote.code);
                while (lastPosition !== -1) {
                    count++;
                    lastPosition = message.indexOf(emote.code, lastPosition + 1);
                }

                if (count > 0) {
                    $.alertspollssocket.triggerEmote(emote.id, count, emoteProvider);
                }
            });
        } finally {
            _lock.unlock();
        }
    });

    $.bind('emotesCacheUpdated', function (event) {
        prepareLocalCache(event.getBttvEmotes());
    });

    $.bind('initReady', function () {
        loadCacheFromDatabase();
    });
})();
