(function () {
    const emoteProvider = 'ffz';
    var emotes = [];

    function loadCacheFromDatabase() {
        var cacheContents = $.inidb.get('emotecache', 'ffzEmotes');
        if (cacheContents !== undefined) {
            prepareLocalCache(JSON.parse(cacheContents));
        } else {
            // No cache :(
            $.consoleLn('No cache data for FFZ Emote Handler');
        }
    }

    function prepareLocalCache(ffzEmoteCache) {
        emotes = [];
        // Flatten the object, no need to distinguish
        Object.keys(ffzEmoteCache).forEach((key) => {
            ffzEmoteCache[key].forEach((emote) => {
                emotes.push(emote);
            });
        });
    }

    $.bind('ircChannelMessage', function (event) {
        var message = String(event.getMessage());
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
    });

    $.bind('emotesCacheUpdated', function (event) {
        prepareLocalCache(event.getFfzEmotes());
    });

    $.bind('initReady', function () {
        loadCacheFromDatabase();
    });
})();