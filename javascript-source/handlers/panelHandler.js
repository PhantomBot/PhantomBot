/*
 * panelHandler.js
 * Provides statistics and other bits of useful information to the Web Panel.
 */

(function() {

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
    function updateChatLinesDB() {
       $.inidb.incr('panelchatstats', 'chat_' + $.getCurLocalTimeString('MM.dd.yy'), 1);
    }

    /**
     * @function updateChatLinesDB()
     */
    function updateModLinesDB() {
       $.inidb.incr('panelchatstats', 'mod_' + $.getCurLocalTimeString('MM.dd.yy'), 1);
    }

    /**
     * @function updateAll()
     */
    function updateAll() {
        updateViewerCount();
        updateStreamOnline();
        updateStreamUptime();
    }

    /**
     * @event initReady
     *
     * If the module is enabled, run a timer to update the panelstats DB table.
     * Runs every minute to reduce wear and tear on the DB.  If disabled,
     * set the table as such.
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.consoleLn("Web Panel Statistics Enabled");
            $.inidb.set('panelstats', 'enabled', 'true');
            updateAll();
    
            setInterval(function() {
                updateAll();
            }, 6e4);
        } else {
            $.consoleLn("Web Panel Statistics Disabled");
            $.inidb.set('panelstats', 'enabled', 'false');
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
