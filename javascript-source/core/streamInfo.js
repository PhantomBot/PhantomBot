(function() {
    var currentGame = null;
    var count = 1;
    var gamesPlayed;

    /**
    * @event twitchOnline
    */
    $.bind('twitchOnline', function(event) {
        if (($.systemTime() - $.inidb.get('panelstats', 'playTimeReset')) >= (480 * 6e4)) {
            var uptime = getStreamUptimeSeconds($.channelName);
            $.inidb.set('panelstats', 'gameCount', 1);
            count = $.inidb.get('panelstats', 'gameCount');
            $.inidb.del('streamInfo', 'gamesPlayed');
            $.inidb.set('panelstats', 'playTimeStart', $.systemTime());
            $.inidb.set('panelstats', 'playTimeReset', $.systemTime());
            $.inidb.set('streamInfo', 'gamesPlayed', (count + ': ' + $.twitchcache.getGameTitle() + ' - ' + (uptime / 3600 < 10 ? '0' : '') + Math.floor(uptime / 3600) + ':' 
                    + ((uptime % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptime % 3600) / 60) + '='));
        }
    });

    /**
    * @event twitchOffline
    */
    $.bind('twitchOffline', function(event) {
        if (($.systemTime() - $.inidb.get('panelstats', 'playTimeReset')) >= (480 * 6e4)) {
            $.inidb.set('panelstats', 'playTimeStart', 0);
            $.inidb.set('panelstats', 'playTimeReset', 0);
            $.inidb.set('panelstats', 'gameCount', 1);
            $.inidb.del('streamInfo', 'gamesPlayed');
        }
    });

    /**
    * @event twitchGameChange
    */
    $.bind('twitchGameChange', function(event) {
        var uptime = getStreamUptimeSeconds($.channelName);

        if ($.isOnline($.channelName)) {
            $.inidb.set('panelstats', 'playTimeStart', $.systemTime());
            if ($.inidb.exists('streamInfo', 'gamesPlayed')) {
                $.inidb.incr('panelstats', 'gameCount', 1);
                count = $.inidb.get('panelstats', 'gameCount');
                gamesPlayed = $.inidb.get('streamInfo', 'gamesPlayed');
                gamesPlayed += (count + ': ' + $.twitchcache.getGameTitle() + ' - ' + (uptime / 3600 < 10 ? '0' : '') + Math.floor(uptime / 3600) + ':' 
                    + ((uptime % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptime % 3600) / 60) + '=');
                $.inidb.set('streamInfo', 'gamesPlayed', gamesPlayed);
            } else {
                count = $.inidb.get('panelstats', 'gameCount');
                $.inidb.set('streamInfo', 'gamesPlayed', (count + ': ' + $.twitchcache.getGameTitle() + ' - ' + (uptime / 3600 < 10 ? '0' : '') + Math.floor(uptime / 3600) + ':' 
                    + ((uptime % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptime % 3600) / 60) + '='));
            }
        }
    });

    /**
     * @function getGamesPlayed()
     * @export $
     * @return string
     */
    function getGamesPlayed() {
        if ($.inidb.exists('streamInfo', 'gamesPlayed')) {
            var games = $.inidb.get('streamInfo', 'gamesPlayed'),
                string = games.split('=').join(', ');

            return string;
        }
        return '';
    };

    /**
     * @function getPlayTime()
     * @export $
     */
    function getPlayTime() {
        var playTime = parseInt($.inidb.get('panelstats', 'playTimeStart')),
            time;

        if (playTime) {
            time = ($.systemTime() - playTime);
            return $.getTimeStringMinutes(time / 1000);
        } else {
            return null;
        }
    };

    /**
     * @function isOnline
     * @export $
     * @param {string} channelName
     * @returns {boolean}
     */
    function isOnline(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            return $.twitchcache.isStreamOnlineString().equals('true');
        } else {
            return !$.twitch.GetStream(channelName).isNull('stream');
        }
    };

    /**
     * @function getStatus
     * @export $
     * @param {string} channelName
     * @returns {string}
     */
    function getStatus(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            return ($.twitchcache.getStreamStatus() + '');
        } else {
            var channelData = $.twitch.GetChannel(channelName);

            if (!channelData.isNull('status')) {
                return channelData.getString('status');
            }
            return '';
        }
    };

    /**
     * @function getGame
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getGame(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            return ($.twitchcache.getGameTitle() + '');
        } else {
            var channelData = $.twitch.GetChannel(channelName);

            if (!channelData.isNull('game')) {
                return channelData.getString("game");
            }
            return '';
        }
    };

    /**
     * @function getStreamUptimeSeconds
     * @export $
     * @param channelName
     * @returns {number}
     */
    function getStreamUptimeSeconds(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            return $.twitchcache.getStreamUptimeSeconds();
        } else {
            var stream = $.twitch.GetStream(channelName),
                now = new Date(),
                createdAtDate,
                time;

            if (stream.isNull('stream')) {
                return 0;
            }

            createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
            if (createdAtDate) {
                time = (now - createdAtDate);
                return Math.floor(time / 1000);
            } else {
                return 0;
            }
        }
    };

    /**
     * @function getStreamUptime
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getStreamUptime(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            var uptime = $.twitchcache.getStreamUptimeSeconds();

            if (uptime === 0) {
                var stream = $.twitch.GetStream(channelName),
                    now = new Date(),
                    createdAtDate,
                    time;
    
                if (stream.isNull('stream')) {
                    return false;
                }

                createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
                time = (now - createdAtDate);
                return $.getTimeString(time / 1000);
            }
            return $.getTimeString(uptime);
        } else {
            var stream = $.twitch.GetStream(channelName),
                now = new Date(),
                createdAtDate,
                time;
    
            if (stream.isNull('stream')) {
                return false;
            }
    
            createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
            if (createdAtDate) {
                time = now - createdAtDate;
                return $.getTimeString(time / 1000);
            } else {
                return false;
            }
        }
    };

    /**
     * @function getStreamDownTime
     * @export $
     * @returns {string}
     */
    function getStreamDownTime() {
        var now = $.systemTime(),
            down = $.inidb.get('streamInfo', 'downtime'),
            time;

        if (down > 0) {
            time = (now - down);
            return $.getTimeString(time / 1000);
        }
        return 0;
    };

    /**
     * @function getStreamStartedAt
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getStreamStartedAt(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            if ($.twitchcache.getStreamOnlineString === 'false') {
                return 'Stream is offline';
            }
            createdAtDate = new Date($.twitchcache.getStreamCreatedAt() + '');
            return $.dateToString(createdAtDate);
        } else {
            var stream = $.twitch.GetStream(channelName),
                createdAtDate;

            if (stream.isNull('stream')) {
                return 0;
            }
    
            createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
            return $.dateToString(createdAtDate);
        }
    };

    /**
     * @function getViewers
     * @export $
     * @param channelName
     * @returns {Number}
     */
    function getViewers(channelName) {
        if ($.twitchCacheReady.equals('true') && channelName.equalsIgnoreCase($.channelName)) {
            return $.twitchcache.getViewerCount();
        } else {
            var stream = $.twitch.GetStream(channelName);

            if (!stream.isNull('stream')) {
                return stream.getJSONObject('stream').getInt('viewers');
            } else {
                return 0;
            }
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
     * @param username
     * @param channelName
     */
    function getFollowAge(sender, username, channelName) {
        var user = $.twitch.GetUserFollowsChannel(username, channelName);

        if (user.getInt('_http') === 404) {
            $.say($.lang.get('followhandler.follow.age.err.404', $.userPrefix(sender, true), username, channelName));
            return;
        }

        var date = new Date(user.getString('created_at')),
            dateFormat = new java.text.SimpleDateFormat("MMMM dd', 'yyyy"),
            dateFinal = dateFormat.format(date),
            days = Math.floor((Math.abs((date.getTime() - $.systemTime()) / 1000)) / 86400);

        if (days > 0) {
            $.say($.lang.get('followhandler.follow.age.time.days', $.userPrefix(sender, true), username, channelName, dateFinal, days));
        } else {
            $.say($.lang.get('followhandler.follow.age.time', $.userPrefix(sender, true), username, channelName, dateFinal));
        }
    };

    /**
     * @function getChannelAge
     * @export $
     * @param event
     */
    function getChannelAge(event) {
        var channelData = $.twitch.GetChannel((!event.getArgs()[0] ? event.getSender() : event.getArgs()[0]));

        if (channelData.getInt('_http') === 404) {
            $.say($.userPrefix(event.getSender(), true) + $.lang.get('channel.age.user.404'));
            return;
        }

        var date = new Date(channelData.getString('created_at')),
            dateFormat = new java.text.SimpleDateFormat("MMMM dd', 'yyyy"),
            dateFinal = dateFormat.format(date),
            days = Math.floor((Math.abs((date.getTime() - $.systemTime()) / 1000)) / 86400);

        if (days > 0) {
            $.say($.lang.get('common.get.age.days', $.userPrefix(event.getSender(), true), (!event.getArgs()[0] ? event.getSender() : event.getArgs()[0]), dateFinal, days));
        } else {
            $.say($.lang.get('common.get.age.days', $.userPrefix(event.getSender(), true), (!event.getArgs()[0] ? event.getSender() : event.getArgs()[0]), dateFinal));
        }
    };

    /**
     * @function getSubscriberCount
     * @export $
     * @return {number} count
     */
    function getSubscriberCount() {
        var jsonObject = $.twitch.GetChannelSubscriptions($.channelName.toLowerCase(), 100, 0, true);

        if (jsonObject.getInt('_http') !== 200) {
            return 0;
        }

        var pages = jsonObject['_total'],
            count = 0;

        if (pages == 1) {
            count = jsonObject.getJSONArray('subscriptions').length();
        } else {
            jsonObject = $.twitch.GetChannelSubscriptions($.channelName.toLowerCase(), 100, 0, true);
            count = (pages - 1) * 100 + jsonObject.getJSONArray('subscriptions').length();
        }

        return count;
    };

    /**
     * @function updateGame
     * @export $
     * @param {string} channelName
     * @param {string} game
     * @param {string} sender
     * @param {boolean} silent
     */
    function updateGame(channelName, game, sender, silent) {
        var http = $.twitch.UpdateChannel(channelName, '', game);

        if (http.getBoolean('_success')) {
            if (http.getInt('_http') == 200) {
                $.twitchcache.setGameTitle(http.getString('game'));
                $.inidb.set('streamInfo', 'game', http.getString('game'));
                if (!silent) {
                    $.say('Changed the game to "' + http.getString('game') + '"!');
                }
                $.log.event($.username.resolve(sender) + ' changed the current game to ' + http.getString('game'));

                if ($.bot.isModuleEnabled('./commands/deathctrCommand.js')) {
                    $.deathUpdateFile(game);
                }
            } else {
                $.say($.whisperPrefix(sender) + 'Failed to change the game. Make sure you have your api oauth code set. https://phantombot.tv/oauth');
                $.consoleDebug(http.getString('message'));
                $.log.error(http.getString('message'));
            }
        } else {
            $.say($.whisperPrefix(sender) + 'Failed to change the game. Make sure you have your api oauth code set. https://phantombot.tv/oauth');
            $.consoleDebug(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
            $.log.error(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
        }
    };

    /**
     * @function updateStatus
     * @export $
     * @param {string} channelName
     * @param {string} status
     * @param {string} sender
     * @param {boolean} silent
     */
    function updateStatus(channelName, status, sender, silent) {
        var http = $.twitch.UpdateChannel(channelName, status, '');

        if (http.getBoolean('_success')) {
            if (http.getInt('_http') == 200) {
                $.twitchcache.setStreamStatus(http.getString('status'));
                $.inidb.set('streamInfo', 'title', http.getString('status'));
                if (!silent) {
                    $.say('Changed the title to "' + http.getString('status') + '"!');
                }
                $.log.event(sender + ' changed the current status to ' + http.getString('status'));
            } else {
                $.say($.whisperPrefix(sender) + 'Failed to change the status. Make sure you have your api oauth code set. https://phantombot.tv/oauth');
                $.consoleDebug(http.getString('message'));
                $.log.error(http.getString('message'));
            }
        } else {
            $.say($.whisperPrefix(sender) + 'Failed to change the status. Make sure you have your api oauth code set. https://phantombot.tv/oauth');
            $.consoleDebug(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
            $.log.error(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
        }
    };

    /** Export functions to API */
    $.getPlayTime = getPlayTime;
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
    $.getChannelAge = getChannelAge;
    $.getStreamDownTime = getStreamDownTime;
    $.getGamesPlayed = getGamesPlayed;
    $.getSubscriberCount = getSubscriberCount;
})();
