/**
 * hostHandler.js
 *
 * Register and announce (un)host events.
 * Optionally supports rewarding points for a follow (Only every 6 hours!)
 */
(function() {
    var hostReward = $.getSetIniDbNumber('settings', 'hostReward', 200),
        autoHostReward = $.getSetIniDbNumber('settings', 'autoHostReward', 0),
        hostMinViewerCount = $.getSetIniDbNumber('settings', 'hostMinViewerCount', 0),
        hostMessage = $.getSetIniDbString('settings', 'hostMessage', $.lang.get('hosthandler.host.message')),
        autoHostMessage = $.getSetIniDbString('settings', 'autoHostMessage', $.lang.get('hosthandler.autohost.message')),
        hostHistory = $.getSetIniDbBoolean('settings', 'hostHistory', false),
        hostTimeout = 216e5, // 6 hours = 6 * 60 * 60 * 1000
        hostList = {},
        announceHosts = false;

    /*
     * @function updateHost
     */
    function updateHost() {
        hostReward = $.getIniDbNumber('settings', 'hostReward');
        autoHostReward = $.getIniDbNumber('settings', 'autoHostReward');
        hostMinViewerCont = $.getIniDbNumber('settings', 'hostMinViewerCount');
        hostMessage = $.getIniDbString('settings', 'hostMessage');
        autoHostMessage = $.getIniDbString('settings', 'autoHostMessage');
        hostHistory = $.getIniDbBoolean('settings', 'hostHistory');
    }

    /*
     * @event twitchHostsInitialized
     */
    $.bind('twitchHostsInitialized', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        $.consoleLn('>> Enabling hosts announcements');
        $.log.event('Host announcements enabled');
        announceHosts = true;
    });

    /**
     * Gets the autohost event from the core.
     *
     * @event twitchAutoHosted
     */
    $.bind('twitchAutoHosted', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        if (announceHosts === false) {
            return;
        }

        var hoster = $.username.resolve(event.getHoster()),
            viewers = event.getUsers(),
            now = $.systemTime(),
            s = autoHostMessage;

        if (hostList[hoster]) {
            if (hostList[hoster].hostTime > now) {
                return;
            }
            hostList[hoster].hostTime = now + hostTimeout;
        } else {
            hostList[hoster] = {
                hostTime: now + hostTimeout
            };
        }

        $.say(s.replace('(name)', hoster).replace('(reward)', autoHostReward.toString()).replace('(viewers)', viewers.toString()).replace('/w', ' /w'));

        if (autoHostReward > 0) {
            $.inidb.incr('points', hoster.toLowerCase(), autoHostReward);
        }
    });

    /*
     * @event twitchHosted
     */
    $.bind('twitchHosted', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        var hoster = $.username.resolve(event.getHoster()),
            viewers = event.getUsers(),
            now = $.systemTime(),
            s = hostMessage,
            thisReward = hostReward,
            jsonObject = {};

        if (announceHosts === false) {
            return;
        }

        $.writeToFile(hoster, "./addons/hostHandler/latestHost.txt", false);

        if (hostList[hoster]) {
            if (hostList[hoster].hostTime > now) {
                return;
            }
            hostList[hoster].hostTime = now + hostTimeout;
        } else {
            hostList[hoster] = {
                hostTime: now + hostTimeout
            };
        }

        if (viewers < hostMinViewerCount) {
            thisReward = 0;
        }

        $.say(s.replace('(name)', hoster).replace('(reward)', autoHostReward.toString()).replace('(viewers)', viewers.toString()).replace('/w', ' /w'));

        if (thisReward > 0) {
            $.inidb.incr('points', hoster.toLowerCase(), thisReward);
        }

        if ($.getIniDbBoolean('settings', 'hostHistory', false)) {
            jsonObject = { 'host' : String(hoster), 'time' : now, 'viewers' : viewers };
            $.inidb.set('hosthistory', hoster + '_' + now, JSON.stringify(jsonObject));
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            argsString = event.getArguments(),
            action = args[0];

        /*
         * @commandpath hostreward [amount] - Set the amount of points to reward when a channel starts hosting
         */
        if (command.equalsIgnoreCase('hostreward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.usage', $.pointNameMultiple));
                return;
            }

            hostReward = parseInt(action);
            $.setIniDbNumber('settings', 'hostReward', hostReward);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.success', $.getPointsString(action)));
        }

        /*
         * @commandpath autohostreward [amount] - Set the amount of points to reward when a channel starts autohosting
         */
        if (command.equalsIgnoreCase('autohostreward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.autohostreward.usage', $.pointNameMultiple));
                return;
            }

            autoHostReward = parseInt(action);
            $.setIniDbNumber('settings', 'autoHostReward', autoHostReward);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.autohostreward.success', $.getPointsString(action)));
        }

        /*
         * @commandpath hostrewardminviewers [amount] - The number of viewers in the hosted channel required to provide a reward.
         */
        if (command.equalsIgnoreCase('hostrewardminviewers')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostrewardminviewers.usage'));
                return;
            }

            hostMinViewerCount = parseInt(action);
            $.setIniDbNumber('settings', 'hostMinViewerCount', hostMinViewerCount);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostrewardminviewers.success', hostMinViewerCount));
        }

        /*
         * @commandpath hostmessage [message] - Set a message given when a channel hosts
         */
        if (command.equalsIgnoreCase('hostmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostmessage.usage'));
                return;
            }

            hostMessage = argsString;
            $.setIniDbString('settings', 'hostMessage', hostMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostmessage.success'));
            $.log.event(sender + ' changed the host message to ' + hostMessage);
        }

        /*
         * @commandpath autohostmessage [message] - Set a message given when a channel autohosts
         */
        if (command.equalsIgnoreCase('autohostmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.autohostmessage.usage'));
                return;
            }

            autoHostMessage = argsString;
            $.setIniDbString('settings', 'autoHostMessage', autoHostMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.autohostmessage.success'));
        }

        /*
         * @commandpath hosthistory [on/off] - Enable or disable collection of host history data for the Panel.
         */
        if (command.equalsIgnoreCase('hosthistory')) {
            if (args.length < 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.usage', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
                return;
            }
            if (action.equalsIgnoreCase('on')) {
                $.setIniDbBoolean('settings', 'hostHistory', true);
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.change', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
            } else if (action.equalsIgnoreCase('off')) {
                $.setIniDbBoolean('settings', 'hostHistory', false);
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.change', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.usage', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
                return;
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            $.registerChatCommand('./handlers/hostHandler.js', 'hostmessage', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'autohostmessage', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'hostreward', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'autohostreward', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'hostrewardminviewers', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'hosthistory', 1);
        }
    });

    $.updateHost = updateHost;
})();
