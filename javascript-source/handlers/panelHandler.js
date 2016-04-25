/*
 * panelHandler.js
 * Provides statistics and other bits of useful information to the Web Panel.
 */

(function() {
    var alreadyStarted = false,
        currentGame = null,
        lastGame = null,
        playTime = null;

    /**
     * @function updateViewerCount()
     */
    function updateViewerCount() {
        $.inidb.set('panelstats', 'viewerCount', $.users.length);
    }

    /**
     * @function updateStreamOnline()
     */
    function updateStreamOnline() {
        $.setIniDbBoolean('panelstats', 'streamOnline', $.isOnline($.channelName));
    }

    /**
     * @function updateStreamUptime()
     */
    function updateStreamUptime() {
        var uptimeSec = $.getStreamUptimeSeconds($.channelName),
            hrs = (uptimeSec / 3600 < 10 ? "0" : "") + Math.floor(uptimeSec / 3600),
            min = ((uptimeSec % 3600) / 60 < 10 ? "0" : "") + Math.floor((uptimeSec % 3600) / 60);
        $.inidb.set('panelstats', 'streamUptime', hrs + ":" + min);
    }

    /**
     * @function updateChatLinesDB()
     */
    function updateChatLinesDB(user) {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.inidb.incr('panelchatstats', 'chat_' + $.getCurLocalTimeString('MM.dd.yy'), 1);
            $.inidb.incr('panelchatuserstats', user, 1);
        }
    }

    /**
     * @function updateChatLinesDB()
     */
    function updateModLinesDB(user) {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.inidb.incr('panelmodstats', 'mod_' + $.getCurLocalTimeString('MM.dd.yy'), 1);
            $.inidb.incr('panelmoduserstats', user, 1);
        }
    }

    /**
     * @function getTitlePanel()
     */
    function getTitlePanel() {
        $.inidb.set('streamInfo', 'title', $.getStatus($.channelName));
    };

    /**
     * @function updatePlayTime()
     */
    function updatePlayTime() { //This is not for the panel, but the info I need to not abuse the api, is in this module.
        if ($.inidb.get('panelstats', 'streamOnline').equalsIgnoreCase('false')) {
            playTime = null;
            currentGame = null;
            return;
        }

        currentGame = $.getGame($.channelName);

        if (currentGame != null && lastGame != currentGame) {
            lastGame = currentGame;
            playTime = $.systemTime();
        }
    };

    /**
     * @function getPlayTime()
     */
    function getPlayTime() { //This is not for the panel, but the info I need to not abuse the api, is in this module.
        if (playTime != null) {
            var time = $.systemTime() - playTime;
            return $.getTimeString(time / 1000);
        } else {
            return '0 seconds'; //Put this here, but it should never happen.
        }
    };

    /**
     * @function getTitlePanel()
     */
    function getGamePanel() {
        $.inidb.set('streamInfo', 'game', currentGame);
    };

    /**
     * @function updateAll()
     */
    function updateAll() {
        updateViewerCount();
        updateStreamOnline();
        updateStreamUptime();
        updatePlayTime();
        getTitlePanel();
        getGamePanel();
    };

    /**
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
                updateAll();
        
                setInterval(function() {
                    updateAll();
                }, 6e4);
            } else {
                $.inidb.set('panelstats', 'enabled', 'false');
            }
        }
    });

    /**
     * Export functions to API
     */
    $.getPlayTime = getPlayTime;
    $.panelDB = {
        updateChatLinesDB: updateChatLinesDB,
        updateModLinesDB: updateModLinesDB,
    };
})();
