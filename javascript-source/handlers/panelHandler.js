/*
 * panelHandler.js
 * Provides statistics and other bits of useful information to the Web Panel.
 */

(function() {
    var alreadyStarted = false,
        interval,
        follower = false;

    /*
     * @event twitchOnline
     */
    $.bind('twitchOnline', function(event) {
        $.setIniDbBoolean('panelstats', 'streamOnline', true);
        $.inidb.set('streamInfo', 'downtime', 0);
        $.inidb.set('panelstats', 'newFollowers', 0);
    });

    /*
     * @event twitchOffline
     */
    $.bind('twitchOffline', function(event) {
        $.setIniDbBoolean('panelstats', 'streamOnline', false);
        $.inidb.set('streamInfo', 'downtime', $.systemTime());
        $.inidb.set('panelstats', 'newFollowers', 0);
    });

    /*
     * @function updateViewerCount
     */
    function updateViewerCount() {
        $.inidb.set('panelstats', 'viewerCount', $.getViewers($.channelName));
    }

    /*
     * @function updateChatterCount
     */
    function updateChatterCount() {
        $.inidb.set('panelstats', 'chatterCount', $.users.length);
    }

    /*
     * @function updateFollowerCount
     */
    function updateFollowerCount() {
        $.inidb.set('panelstats', 'followerCount', $.getFollows($.channelName));
    }

    /*
     * @function updateStreamUptime
     */
    function updateStreamUptime() {
        if ($.twitchCacheReady.equals('true')) {
            var uptimeSec = $.twitchcache.getStreamUptimeSeconds(),
                hrs = (uptimeSec / 3600 < 10 ? '0' : '') + Math.floor(uptimeSec / 3600),
                min = ((uptimeSec % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptimeSec % 3600) / 60);
            $.inidb.set('panelstats', 'streamUptime', hrs + ':' + min);
        }
    }

    /*
     * @function updateChatLinesDB
     */
    function updateChatLinesDB(user) {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.inidb.incr('panelchatstats', 'chat_' + $.getCurLocalTimeString('MM.dd.yy'), 1);
            $.inidb.incr('panelchatuserstats', user, 1);
        }
    }

    /*
     * @function updateChatLinesDB
     */
    function updateModLinesDB(user) {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.inidb.incr('panelmodstats', 'mod_' + $.getCurLocalTimeString('MM.dd.yy'), 1);
            // $.inidb.incr('panelstats', 'timeoutCount', 1);
            // $.inidb.incr('panelmoduserstats', user, 1);
        }
    }

    /*
     * @function updatePlayTime
     */
    function updatePlayTime() {
        var playTimeStart = $.getIniDbNumber('panelstats', 'playTimeStart', 0),
            currentTime = new Date(),
            diffTime;

        if (playTimeStart === 0) {
            playTimeStart = currentTime;
        }
        diffTime = Math.floor((currentTime - playTimeStart) / 1000);
        hrs = (diffTime / 3600 < 10 ? "0" : "") + Math.floor(diffTime / 3600),
        min = ((diffTime % 3600) / 60 < 10 ? "0" : "") + Math.floor((diffTime % 3600) / 60);
        $.inidb.set('panelstats', 'playTime', hrs + ":" + min);
    }

    /*
     * @function getTitlePanel
     */
    function getTitlePanel() {
        $.inidb.set('streamInfo', 'title', $.getStatus($.channelName));
    }

    /*
     * @function getGamePanel
     */
    function getGamePanel() {
        $.inidb.set('streamInfo', 'game', $.getGame($.channelName));
    }

    /*
     * @function updateAll()
     */
    function updateAll() {
        updateViewerCount();
        updatePlayTime();
        updateStreamUptime();
        getTitlePanel();
        getGamePanel();
        updateChatterCount();
        updateFollowerCount();
        if ($.twitchCacheReady.equals('true')) { 
            $.setIniDbNumber('panelstats', 'viewCount', $.twitchcache.getViews()); 
        }
    }

    /*
     * @event twitchFollow
     */
    $.bind('twitchFollow', function(event) {
        if (follower) {
            $.inidb.incr('panelstats', 'newFollowers', 1);
        }
    });

    /*
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function() {
        follower = true;
    });

    /*
     * @event initReady
     *
     * If the module is enabled, run a timer to update the panelstats DB table.
     * Runs every minute to reduce wear and tear on the DB.  If disabled,
     * set the table as such.
     */
    $.bind('initReady', function() {
        if (!alreadyStarted) {
            if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
                alreadyStarted = true;
                $.inidb.set('panelstats', 'enabled', 'true');
                 $.getSetIniDbNumber('panelstats', 'timeoutCount', 1);
                interval = setInterval(function() {  updateAll(); }, 3e4);
            } else {
                $.inidb.set('panelstats', 'enabled', 'false');
            }
        }
    });

    /*
     * Export functions to API
     */
    $.panelDB = {
        updateChatLinesDB: updateChatLinesDB,
        updateModLinesDB: updateModLinesDB
    };
})();
