/**
 * hostHandler.js
 *
 * Register and announce (un)host events.
 * Optionally supports rewarding points for a follow (Only every 6 hours!)
 */
(function() {
    var hostReward = $.getSetIniDbNumber('settings', 'hostReward', 200),
        hostMessage = $.getSetIniDbString('settings', 'hostMessage', $.lang.get('hosthandler.host.message')),
        hostHistory = $.getSetIniDbBoolean('settings', 'hostHistory', false),
        hostTimeout = 216e5, // 6 hours = 6 * 60 * 60 * 1000
        hostList = {},
        announceHosts = false;


    function updateHost() {
        hostReward = $.getIniDbNumber('settings', 'hostReward');
        hostMessage = $.getIniDbString('settings', 'hostMessage');
        hostHistory = $.getIniDbBoolean('settings', 'hostHistory');
    }
    /**
     * @event twitchHostsInitialized
     */
    $.bind('twitchHostsInitialized', function() {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        $.consoleLn(">> Enabling hosts announcements");
        $.log.event('Host announcements enabled');
        announceHosts = true;
    });

    /**
     * @event twitchHosted
     */
    $.bind('twitchHosted', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        var hoster = $.username.resolve(event.getHoster()),
            now = $.systemTime(),
            msg = hostMessage,
            jsonObject = {};

        if (!announceHosts) {
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

        msg = msg.replace('(name)', hoster);
        msg = msg.replace('(reward)', hostReward.toString());
        $.say(msg);

        $.inidb.incr('points', hoster.toLowerCase(), hostReward);

        if ($.getIniDbBoolean('settings', 'hostHistory', false)) {
            jsonObject = { 'host' : String(hoster), 'time' : now, 'viewers' : 0 }; // Add viewers as placeholder.
            $.inidb.set('hosthistory', hoster + '_' + now, JSON.stringify(jsonObject));
        }

    });

    /**
     * @event twitchUnhosted
     */
    $.bind('twitchUnhosted', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            return;
        }

        var hoster = event.getHoster();
        delete hostList[hoster];
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            commandArg = parseInt(args[0]),
            temp = [],
            i;

        /**
         * @commandpath hostreward [amount] - Set the amount of points to reward when a channel starts hosting
         */
        if (command.equalsIgnoreCase('hostreward')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (isNaN(commandArg)) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.usage', $.pointNameMultiple));
                return;
            }

            $.inidb.set('settings', 'hostReward', commandArg);
            hostReward = parseInt(commandArg);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostreward.success', $.getPointsString(commandArg)));
            $.log.event(sender + ' changed the host reward to ' + commandArg);
        }

        /**
         * @commandpath hostmessage [message] - Set a message given when a channel hosts
         */
        if (command.equalsIgnoreCase('hostmessage')) {
            if (!args || args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostmessage.usage'));
                return;
            }

            hostMessage = event.getArguments();
            $.inidb.set('settings', 'hostMessage', hostMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('hosthandler.set.hostmessage.success'));
            $.log.event(sender + ' changed the host message to ' + hostMessage);
        }

        /**
         * @commandpath unhost - Send the /unhost command to Twitch
         */
        if (command.equalsIgnoreCase('unhost')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            $.say('.unhost');
        }

        /**
         * @commandpath host [channel] - Send the /host command to Twitch
         */
        if (command.equalsIgnoreCase('host')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            $.say('.host ' + args[0]);
            $.log.event(sender + ' hosted channel ' + args[1]);
        }

        /**
         * @commandpath hostcount - Announce the number of other channels hosting this channel
         */
        if (command.equalsIgnoreCase('hostcount')) {
            for (i in hostList) {
                temp.push(i);
            }

            if (temp.length == 0) {
                $.say($.lang.get('hosthandler.hostcount.404'));
                return;
            }
            $.say($.lang.get('hosthandler.hostcount', temp.length));
        }

        /**
         * @commandpath hostlist - Announce a list of other channels hosting this channel
         */
        if (command.equalsIgnoreCase('hostlist')) {
            for (i in hostList) {
                temp.push(i);
            }

            if (temp.length == 0) {
                $.say($.lang.get('hosthandler.hostlist.404'));
                return;
            }

            $.say($.lang.get('hosthandler.hostlist', temp.join(', ')));
        }

        /**
         * @commandpath hosthistory [on/off] - Enable/disable collection of host history data for the Panel.
         */
        if (command.equalsIgnoreCase('hosthistory')) {
            if (!args || args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.usage', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
                return;
            }
            if (args[0].equalsIgnoreCase('on')) {
                $.setIniDbBoolean('settings', 'hostHistory', true);
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.change', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
            } else if (args[0].equalsIgnoreCase('off')) {
                $.setIniDbBoolean('settings', 'hostHistory', false);
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.change', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('hosthistory.usage', $.getIniDbBoolean('settings', 'hostHistory') ? "on" : "off"));
                return;
            }
        }

        if (command.equalsIgnoreCase('reloadhost')) {
            updateHost();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/hostHandler.js')) {
            $.registerChatCommand('./handlers/hostHandler.js', 'hostmessage', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'hostreward', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'unhost', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'host', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'hostcount');
            $.registerChatCommand('./handlers/hostHandler.js', 'hostlist');
            $.registerChatCommand('./handlers/hostHandler.js', 'hosthistory', 1);
            $.registerChatCommand('./handlers/hostHandler.js', 'reloadhost', 1);
        }
    });
})();
