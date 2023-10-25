(function () {
    const emoteProvider = 'sevenTv';
    var emotes = [],
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    function loadCacheFromDatabase() {
        var cacheContents = $.inidb.get('emotecache', 'sevenTvEmotes');
        if (cacheContents !== undefined && cacheContents !== null && cacheContents.length() > 0) {
            prepareLocalCache(JSON.parse(cacheContents));
        } else {
            // No cache :(
            $.consoleLn('No cache data for 7TV Emote Handler');
        }
    }

    function prepareLocalCache(sevenTvEmoteCache) {
        _lock.lock();
        try {
            emotes = [];
            // Flatten the object, no need to distinguish
            Object.keys(sevenTvEmoteCache).forEach((key) => {
                sevenTvEmoteCache[key].forEach((emote) => {
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
        if(event.getEmoteSets()[emoteProvider]){
            prepareLocalCache(event.getEmoteSets()[emoteProvider]);
        }
    });

    $.bind('initReady', function () {
        loadCacheFromDatabase();
    });
})();
