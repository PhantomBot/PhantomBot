/*
 * panelHandler.js
 * Provides statistics and other bits of useful information to the Web Panel.
 */

(function() {
    var alreadyStarted = false;

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
     * @function getTitlePanel()
     */
    function getGamePanel() {
        $.inidb.set('streamInfo', 'game', $.getGame($.channelName));
    };

    /**
     * @function updateAll()
     */
    function updateAll() {
        updateViewerCount();
        updateStreamOnline();
        updateStreamUptime();
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
                getTitlePanel();
                getGamePanel();
        
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
    $.panelDB = {
        updateChatLinesDB: updateChatLinesDB,
        updateModLinesDB: updateModLinesDB,
    };

})();
