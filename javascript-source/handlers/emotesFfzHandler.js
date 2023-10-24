(function () {
    const emoteProvider = 'ffz';
    var emotes = [],
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    function loadCacheFromDatabase() {
        var cacheContents = $.getIniDbString('emotecache', 'ffzEmotes');
        if (cacheContents !== undefined && cacheContents !== null && $.strlen(cacheContents) > 0) {
            prepareLocalCache(JSON.parse(cacheContents));
        } else {
            // No cache :(
            $.consoleLn('No cache data for FFZ Emote Handler');
        }
    }

    function prepareLocalCache(ffzEmoteCache) {
        _lock.lock();
        try {
            emotes = [];
            // Flatten the object, no need to distinguish
            Object.keys(ffzEmoteCache).forEach((key) => {
                ffzEmoteCache[key].forEach((emote) => {
                    emotes.push(emote);
                });
            });
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function isFullWord
     * Checks if the given emoteCode at the index is a full word in message considering beginning and end of the string,
     * line breaks and spaces.
     *
     * @param {int} index           the start index of the found emote
     * @param {string} emoteCode    the code of the found emote used to retrieve the length of it
     * @param {message} message     the message to check if the emote is a full word or not
     * @return {bool}               true if the emote is a full word (can also return true if message doesn't fit the
     *                              other parameters because accessing an array out of bounds returns undefined which is
     *                              used as check if the emoteCode is at the beginning or end of message
     */
    function isFullWord(index, emoteCode, message){
        const wordBoundary = [undefined, ' ', '\n'];
        return wordBoundary.includes(message[index - 1]) && wordBoundary.includes(message[index + emoteCode.length]);
    }

    $.bind('ircChannelMessage', function (event) {
        var message = String(event.getMessage());
        _lock.lock();
        try {
            emotes.forEach((emote) => {
                var count = 0;
                var lastPosition = message.indexOf(emote.code);
                while (lastPosition !== -1) {
                    if(isFullWord(lastPosition, emote.code, message)){
                        count++;
                    }
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