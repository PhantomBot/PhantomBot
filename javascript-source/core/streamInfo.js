(function() {

    var playTime = null;
    var lastGame = null;
    var currentGame = null;

    /**
     * @function updatePlayTime()
     */
    function updatePlayTime() {
        if ($.twitchcache.isStreamOnlineString().equals('false')) {
            playTime = null;
            currentGame = null;

            if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
                $.inidb.set('panelstats', 'playTimeStart', 0);
            }
            return;
        }

        currentGame = $.twitchcache.getGameTitle() + '';

        if (currentGame != null && lastGame != currentGame) {
            lastGame = currentGame;
            playTime = $.systemTime();

            if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
                $.inidb.set('panelstats', 'playTimeStart', playTime);
            }
        }
    };

    /**
     * @function getPlayTimeGame()
     * @export $
     */
    function getPlayTimeGame() {
        if (currentGame == null) {
            return "Some Game";
        }
        return currentGame;
    }  

    /**
     * @function getPlayTime()
     * @export $
     */
    function getPlayTime() { 
        if (playTime != null) {
            var time = $.systemTime() - playTime;
            return $.getTimeString(time / 1000);
        } else {
            return '0 seconds'; //Put this here, but it should never happen.
        }
    };

    /**
     * @function isOnline
     * @export $
     * @param {string} channelName
     * @returns {boolean}
     */
    function isOnline(channelName) {
        return !$.twitch.GetStream(channelName).isNull('stream');
    };

    /**
     * @function getStatus
     * @export $
     * @param {string} channelName
     * @returns {string}
     */
    function getStatus(channelName) {
        var channelData = $.twitch.GetChannel(channelName);

        if (!channelData.isNull('status')) {
            return channelData.getString('status');
        }
        return '';
    };

    /**
     * @function getGame
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getGame(channelName) {
        var channelData = $.twitch.GetChannel(channelName);

        if (!channelData.isNull('game')) {
            return channelData.getString("game");
        }
        return '';
    };

    /**
     * @function getStreamUptimeSeconds
     * @export $
     * @param channelName
     * @returns {number}
     */
    function getStreamUptimeSeconds(channelName) {
        var stream = $.twitch.GetStream(channelName),
            now = new Date(),
            createdAtDate,
            time;

        if (stream.isNull('stream')) {
            return 0;
        }

        createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
        if (createdAtDate) {
            time = now - createdAtDate;
            return Math.floor(time / 1000);
        } else {
            return 0;
        }
    }

    /**
     * @function getStreamUptime
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getStreamUptime(channelName) {
        var stream = $.twitch.GetStream(channelName),
            now = new Date(),
            createdAtDate,
            time;

        if (stream.isNull('stream')) {
            return 'Stream is offline';
        }

        createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
        if (createdAtDate) {
            time = now - createdAtDate;
            return $.getTimeString(time / 1000);
        } else {
            return 'Stream is offline';
        }
    };

    /**
     * @function getStreamStartedAt
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getStreamStartedAt(channelName) {
        var stream = $.twitch.GetStream(channelName),
            createdAtDate;

        if (stream.isNull('stream')) {
            return 'Stream is offline';
        }

        createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
        return $.dateToString(createdAtDate);
    };

    /**
     * @function getViewers
     * @export $
     * @param channelName
     * @returns {Number}
     */
    function getViewers(channelName) {
        var stream = $.twitch.GetStream(channelName);

        if (!stream.isNull('stream')) {
            return stream.getJSONObject('stream').getInt('viewers');
        } else {
            return 0;
        }
    };

    /**
     * @function getFollows
     * @export $
     * @param channelName
     * @returns {Number}
     */
    function getFollows(channelName) {
        var channel = $.twitch.GetChannel(channelName);

        if (!channel.isNull('followers')) {
            return channel.getInt('followers');
        } else {
            return 0;
        }
    };

    /**
     * @function getFollowAge
     * @export $
     * @param channelName
     * @returns {Number}
     */
    function getFollowAge (sender, channelName) {
        var username = $.twitch.GetUserFollowsChannel(sender, channelName),
            followedAt = new Date(username.getString('created_at')),
            now = new Date(followedAt).getTime();

        if (followedAt) {
            return $.getLongTimeString(now);
        } else {
            return sender + ' is not following';
        }
    }

    /**
     * @function updateGame
     * @export $
     * @param {string} channelName
     * @param {string} game
     * @param {string} sender
     */
    function updateGame(channelName, game, sender) {
        var http = $.twitch.UpdateChannel(channelName, '', game);

        if (http.getBoolean('_success')) {
            if (http.getInt('_http') == 200) {
                $.inidb.set('streamInfo', 'game', http.getString('game'));
                $.say('Changed the game to "' + http.getString('game') + '"!');
                $.logEvent('streamCommand.js', 25, $.username.resolve(sender) + ' changed the current game to ' + http.getString('game'));

                if ($.bot.isModuleEnabled('./commands/deathctrCommand.js')) {
                    $.deathUpdateFile(game);
                }
            } else {
                $.say($.whisperPrefix(sender) + 'Failed to change the game. TwitchAPI must be having issues');
                $.consoleDebug(http.getString('message'));
                $.logError('streamCommand.js', 29, http.getString('message'));
            }
        } else {
            $.say('Failed to change the game. TwitchAPI must be having issues');
            $.consoleDebug(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
            $.logError('streamCommand.js', 34, http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
        }
    };

    /**
     * @function updateStatus
     * @export $
     * @param {string} channelName
     * @param {string} status
     * @param {string} sender
     */
    function updateStatus(channelName, status, sender) {
        var http = $.twitch.UpdateChannel(channelName, status, '');

        if (http.getBoolean('_success')) {
            if (http.getInt('_http') == 200) {
                $.inidb.set('streamInfo', 'title', http.getString('status'));
                $.say('Changed the title to "' + http.getString('status') + '"!');
                $.logEvent('streamCommand.js', 54, sender + ' changed the current status to ' + http.getString('status'));
            } else {
                $.say($.whisperPrefix(sender) + 'Failed to change the status. TwitchAPI must be having issues');
                $.consoleDebug(http.getString('message'));
                $.logError('streamCommand.js', 58, http.getString('message'));
            }
        } else {
            $.say($.whisperPrefix(sender) + 'Failed to change the status. TwitchAPI must be having issues');
            $.consoleDebug(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
            $.logError('streamCommand.js', 63, http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
        }
    };

    /**
     * Execute the updatePlayTime function.
     */
    setInterval(function() {
        updatePlayTime();
    }, 6e4, 'updatePlayTime');

    /** Export functions to API */
    $.getPlayTime = getPlayTime;
    $.getPlayTimeGame = getPlayTimeGame;
    $.getFollows = getFollows;
    $.getGame = getGame;
    $.getStatus = getStatus;
    $.getStreamStartedAt = getStreamStartedAt;
    $.getStreamUptime = getStreamUptime;
    $.getStreamUptimeSeconds = getStreamUptimeSeconds;
    $.getViewers = getViewers;
    $.isOnline = isOnline;
    $.updateGame = updateGame;
    $.updateStatus = updateStatus;
    $.getFollowAge = getFollowAge;
})();
