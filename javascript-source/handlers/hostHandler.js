/**
 * hostHandler.js
 *
 * Register and announce (un)host events.
 * Optionally supports rewarding points for a follow (Only every 6 hours!)
 */
(function() {
    var hostReward = $.getSetIniDbNumber('settings', 'hostReward', 0),
        autoHostReward = $.getSetIniDbNumber('settings', 'autoHostReward', 0),
        hostMinViewerCount = $.getSetIniDbNumber('settings', 'hostMinViewerCount', 0),
        hostMinCount = $.getSetIniDbNumber('settings', 'hostMinCount', 0),
        hostMessage = $.getSetIniDbString('settings', 'hostMessage', $.lang.get('hosthandler.host.message')),
        autoHostMessage = $.getSetIniDbString('settings', 'autoHostMessage', $.lang.get('hosthandler.autohost.message')),
        hostHistory = $.getSetIniDbBoolean('settings', 'hostHistory', false),
        hostToggle = $.getSetIniDbBoolean('settings', 'hostToggle', false),
        autoHostToggle = $.getSetIniDbBoolean('settings', 'autoHostToggle', false),
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
        hostMinCount = $.getIniDbNumber('settings', 'hostMinCount');
        hostMessage = $.getIniDbString('settings', 'hostMessage');
        autoHostMessage = $.getIniDbString('settings', 'autoHostMessage');
        hostHistory = $.getIniDbBoolean('settings', 'hostHistory');
        hostToggle = $.getIniDbBoolean('settings', 'hostToggle');
        autoHostToggle = $.getIniDbBoolean('settings', 'autoHostToggle');
    }

    /*
     * @event twitchHostsInitialized
     */
    $.bind('twitchHostsInitialized', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        $.consoleLn('>> Enabling hosts announcements');
        announceHosts = true;
    });

    /*
     * @event twitchAutoHosted
     */
    $.bind('twitchAutoHosted', function(event) {
        var hoster = event.getHoster().toLowerCase(),
            viewers = parseInt(event.getUsers()),
            s = autoHostMessage;

        if (announceHosts === false) {
            return;
        }

        if (hostList[hoster] !== undefined) {
            if (hostList[hoster].hostTime < $.systemTime()) {
                hostList[hoster] = { hostTime: ($.systemTime() + hostTimeout) };
            } else {
                return;
            }
        } else {
            hostList[hoster] = { hostTime: ($.systemTime() + hostTimeout) };
        }

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', $.username.resolve(hoster));
        }

        if (s.match(/\(reward\)/)) {
            s = $.replace(s, '(reward)', autoHostReward.toString());
        }

        if (s.match(/\(viewers\)/)) {
            s = $.replace(s, '(viewers)', viewers.toString());
        }

        if (s.match(/^\/w/)) {
            s = s.replace('/w', ' /w');
        }

        if (autoHostToggle === true && viewers >= hostMinCount) {
            $.say(s);
        }

        $.writeToFile(hoster + ' ', './addons/hostHandler/latestHost.txt', false);
        $.writeToFile(hoster + ' ', './addons/hostHandler/latestHostOrAutoHost.txt', false);
        if (autoHostReward > 0 && viewers >= hostMinViewerCount) {
            $.inidb.incr('points', hoster.toLowerCase(), autoHostReward);
        }
    });

    /*
     * @event twitchHosted
     */
    $.bind('twitchHosted', function(event) {
        var hoster = event.getHoster().toLowerCase(),
            viewers = parseInt(event.getUsers()),
            s = hostMessage;

        // Always update the Host History even if announcements are off or if they recently
        // hosted the channel and it would not be noted in chat.  This was the caster does
        // have a log of all hosts that did occur, announced or not.
        //
        if ($.getIniDbBoolean('settings', 'hostHistory', false)) {
            var now = $.systemTime();
            var jsonObject = { 'host' : String(hoster), 'time' : now, 'viewers' : viewers };
            $.inidb.set('hosthistory', hoster + '_' + now, JSON.stringify(jsonObject));
        }

        if (announceHosts === false) {
            return;
        }

        if (hostList[hoster] !== undefined) {
            if (hostList[hoster].hostTime < $.systemTime()) {
                hostList[hoster] = { hostTime: ($.systemTime() + hostTimeout) };
            } else {
                return;
            }
        } else {
            hostList[hoster] = { hostTime: ($.systemTime() + hostTimeout) };
        }

        if (s.match(/\(name\)/)) {
            s = $.replace(s, '(name)', $.username.resolve(hoster));
        }

        if (s.match(/\(reward\)/)) {
            s = $.replace(s, '(reward)', hostReward.toString());
        }

        if (s.match(/\(viewers\)/)) {
            s = $.replace(s, '(viewers)', viewers.toString());
        }

        if (s.match(/^\/w/)) {
            s = s.replace('/w', ' /w');
        }

        if (hostToggle === true && viewers >= hostMinCount) {
            $.say(s);
        }

        $.writeToFile(hoster + ' ', './addons/hostHandler/latestAutoHost.txt', false);
        $.writeToFile(hoster + ' ', './addons/hostHandler/latestHostOrAutoHost.txt', false);
        if (hostReward > 0 && viewers >= hostMinViewerCount) {
            $.inidb.incr('points', hoster.toLowerCase(), hostReward);
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments(),
            args = event.getArgs(),
            action = args[0];

        /*
         * @commandpath hosttoggle - Toggles host announcements.
         */
        if (command.equalsIgnoreCase('hosttoggle')) {
            hostToggle = !hostToggle;
            $.setIniDbBoolean('settings', 'hostToggle', hostToggle);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.host.toggle', (hostToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /*
         * @commandpath autohosttoggle - Toggles auto host announcements.
         */
        if (command.equalsIgnoreCase('autohosttoggle')) {
            autoHostToggle = !autoHostToggle;
            $.setIniDbBoolean('settings', 'autoHostToggle', autoHostToggle);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.auto.host.toggle', (autoHostToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

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
         * @commandpath hostminviewers [amount] - The number of viewers in the hosted channel required to trigger the chat alert.
         */
        if (command.equalsIgnoreCase('hostminviewers')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostminviewers.usage', hostMinCount));
                return;
            }

            hostMinCount = parseInt(action);
            $.setIniDbNumber('settings', 'hostMinCount', hostMinCount);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostminviewers.success', hostMinCount));
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
            }
        }

        /*
         * @commandpath host [channel name] - Will host that channel. Make sure to add your bot as a channel editor on your Twitch dashboard for this to work.
         */
        if (command.equalsIgnoreCase('host')) {
            if (action !== undefined) {
                $.say('.host ' + action);
            }
        }

        /*
         * @commandpath unhost - Will unhost the channel that is being hosted. Make sure to add your bot as a channel editor on your Twitch dashboard for this to work.
         */
        if (command.equalsIgnoreCase('unhost')) {
            if (action !== undefined) {
                $.say('.unhost');
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
            $.registerChatCommand('./handlers/hostHandler.js', 'hosttoggle', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'autohosttoggle', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'host', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'unhost', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'hostminviewers', 1);
        }
    });

    $.updateHost = updateHost;
})();
