(function() {
    $.getSetIniDbBoolean('autohost_config', 'enabled', false);
    $.getSetIniDbBoolean('autohost_config', 'pick_rank', false);
    $.getSetIniDbBoolean('autohost_config', 'force', false);
    $.getSetIniDbNumber('autohost_config', 'offline_time', 0);
    $.getSetIniDbNumber('autohost_config', 'host_time_minutes', 0);
    $.getSetIniDbNumber('autohost_config', 'delay_time_minutes', 5);

    var streamIsOnline = $.isOnline($.channelName);

    /**
     * @function checkAutoHost
     *
     * This function checks to see if auto hosting should be enabled.
     */
    function checkAutoHost() {
        // If stream is reported as online and force mode is not enabled, disable autohosting.
        //
        if ($.isOnline($.channelName) && !$.getIniDbBoolean('autohost_config', 'force')) {
            streamIsOnline = true;
            $.inidb.set('autohost_config', 'hosting', 'false');
            $.inidb.set('autohost_config', 'currently_hosting', '');
            return;
        }

        // Stream is already hosting?  This function is done.
        //
        if ($.getSetIniDbBoolean('autohost_config', 'hosting', false)) {
            return;
        }

        // Stream is offline now, set the time the stream went offline.
        //
        if (streamIsOnline) {
            streamIsOnline = false;
            $.inidb.set('autohost_config', 'offline_time', $.systemTime());
        }

        // If there is a delay time, use that.
        //
        if ($.getIniDbNumber('autohost_config', 'delay_time_minutes') > 0) {
            if ($.getIniDbNumber('autohost_config', 'offline_time') + ($.getIniDbNumber('autohost_config', 'delay_time_minutes') * 6e4) < $.systemTime()) {
                $.inidb.set('autohost_config', 'hosting', 'false');
                return;
            }
        }

        // If autohost was forced while Twitch still determined the stream was online and now
        // Twitch says the stream is offline, disable the force flag.
        //
        if (!$.isOnline($.channelName) && $.getIniDbBoolean('autohost_config', 'force')) {
            $.inidb.set('autohost_config', 'force', 'false');
        }

        // Enable auto-hosting
        //
        $.inidb.set('autohost_config', 'hosting', 'true');
    }

    /**
     * @function doAutoHost
     * @param force{Boolean} Determines if the autohost should be forced, ignoring the timer.
     *
     * Performs the autohosting of a Twitch Channel
     */
    function doAutoHost(force) {

        // If we are currently hosting someone, check to see if they are still online, and if so
        // then if the host_time is 0 keep hosting, otherwise, check to see if we have been hosting
        // them less than our configured number of allowed hours.  If they are otherwise offline
        // or we have been hosting them long enough, then we fall down into setting up a new host.
        //
        if ($.getIniDbString('autohost_config', 'currently_hosting').length > 0 && !force) {
            if ($.isOnline($.getIniDbString('autohost_config', 'currently_hosting'))) {
                if ($.getIniDbNumber('autohost_config', 'host_time_minutes') === 0) {
                    return;
                }
                if (($.getIniDbNumber('autohost_config', 'last_host_start') +
                     $.getIniDbNumber('autohost_config', 'host_time_minutes') * 6e4) < $.systemTime()) {
                    return;
                }
            }
        }

        var lastRank = $.getSetIniDbNumber('autohost_config', 'last_rank', 0),
            lastHost = $.getSetIniDbString('autohost_config', 'last_host', ''),
            hostList = $.inidb.GetKeyList('autohost_hosts', ''),
            hostTime = $.getIniDbNumber('autohost_config', 'host_start_time'),
            channelToHost = "",
            foundLastHost = false;

        if (hostList.length === 0) {
            return;
        }

        if (lastHost.length === 0) {
            foundLastHost = true;
        }

        // Go through the list and start after the last channel hosted unless there was no
        // channel previously hosted.  If the previously hosted channel was deleted, the
        // next loop will handle that.
        //
        for (var i in hostList) {
            if (foundLastHost) {
                if ($.isOnline(hostList[i])) {
                    channelToHost = hostList[i];
                    break;
                }
            }
            if (hostList[i].equals(lastHost)) {
                foundLastHost = true;
            }
        }

        // Start at the head of the list if there was a previous channel being hosted.
        //
        if (channelToHost.length === 0 && lastHost.length > 0) {
            for (var i in hostList) {
                if ($.isOnline(hostList[i])) {
                    channelToHost = hostList[i];
                    break;
                }
                if (hostList[i].equals(lastHost)) {
                    break;
                }
            }
        }

        // Host!
        //
        if (channelToHost.length > 0) {
            $.say('.host ' + channelToHost);
            $.inidb.set('autohost_config', 'last_host', channelToHost);
            $.inidb.set('autohost_config', 'currently_hosting', channelToHost);
        }
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath autohost [start|force|stop|delay|hosttime|skip|add|del|list] - Base command for autohost
         */
        if (command.equalsIgnoreCase('autohost')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('autohost.command.usage'));
                return;
            }

            /**
             * @commandpath autohost [start|force|stop] - Start, force start, or stop autohosting.
             * Note that force is the same as start, it just instructs the process to ignore the stream
             * online status.
             */
            if (action.equalsIgnoreCase('start') || action.equalsIgnoreCase('force')) {
                $.setIniDbBoolean('autohost_config', 'enabled', true);
                if (action.equalsIgnoreCase('force')) {
                    $.setIniDbBoolean('autohost_config', 'force', true); 
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.force'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.on'));
                }
                return;
            }
            if (action.equalsIgnoreCase('stop')) {
                $.say($.whisperPrefix(sender) + $.lang.get('autohost.off'));
                $.setIniDbBoolean('autohost_config', 'enabled', false);
                return;
            }

            /**
             * @commandpath autohost delay [minutes] - Time to wait after stream is detected as offline.
             */
            if (action.equalsIgnoreCase('delay')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.delay.usage', $.getIniDbNumber('autohost_config', 'delay_time_minutes')));
                    return;
                }
                if (isNaN(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.delay.usage', $.getIniDbNumber('autohost_config', 'delay_time_minutes')));
                    return;
                }
                if (subAction < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.delay.usage', $.getIniDbNumber('autohost_config', 'delay_time_minutes')));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('autohost.delay.success', subAction));
                $.inidb.set('autohost_config', 'delay_time_minutes', subAction);
                return;
            }

            /**
             * @commandpath autohost hosttime [minutes] - Minutes to host a channel, 0 means infinite.
             */
            if (action.equalsIgnoreCase('hosttime')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.hosttime.usage', $.getIniDbNumber('autohost_config', 'host_time_minutes')));
                    return;
                }
                if (isNaN(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.hosttime.usage', $.getIniDbNumber('autohost_config', 'host_time_minutes')));
                    return;
                }
                if (subAction < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.hosttime.usage', $.getIniDbNumber('autohost_config', 'host_time_minutes')));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('autohost.hosttime.success', subAction));
                $.inidb.set('autohost_config', 'host_time_minutes', subAction);
                return;
            }

            /*
             * @commandpath autohost skip - Skip to the next channel.
             */
            if (action.equalsIgnoreCase('skip')) {
                if ($.getIniDbBoolean('autohost_config', 'hosting', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.skip.noautohost'));
                    return;
                }
                doAutoHost(true);
            }

            /*
             * @commandpath autohost add [channel] - Adds a channel to the autohost list.
             */
            if (action.equalsIgnoreCase('add')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.add.usage'));
                    return;
                }
                if ($.inidb.exists('autohost_hosts', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.add.duplicate'));
                    return;
                }
                $.inidb.set('autohost_hosts', subAction.toLowerCase(), subAction.toLowerCase());
                $.say($.whisperPrefix(sender) + $.lang.get('autohost.add.success', subAction.toLowerCase()));
            }

            /*
             * @commandpath autohost del [channel] - Deletes a channel from the autohost list.
             */
            if (action.equalsIgnoreCase('del')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.del.usage'));
                    return;
                }
                if (!$.inidb.exists('autohost_hosts', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.del.404'));
                    return;
                }
                $.inidb.del('autohost_hosts', subAction.toLowerCase());
                $.say($.whisperPrefix(sender) + $.lang.get('autohost.del.success', subAction.toLowerCase()));
            }

            /*
             * @commandpath autohost list - Lists channels in the autohost list.
             */
           if (action.equalsIgnoreCase('list')) {
                var hostKeys = $.inidb.GetKeyList('autohost_hosts', '');
                if (subAction === undefined) {
                    var totalPages = $.paginateArray(hostKeys, 'autohost.list', ', ', true, sender, 1);
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.list.total', totalPages));
                } else if (isNaN(subAction)) {
                    var totalPages = $.paginateArray(hostKeys, 'autohost.list', ', ', true, sender, 1);
                    $.say($.whisperPrefix(sender) + $.lang.get('autohost.list.total', totalPages));
                } else {
                    $.paginateArray(hostKeys, 'autohost.list', ', ', true, sender, parseInt(subAction));
                }
           }
        }
    });


    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/autoHostSystem.js')) {
            $.registerChatCommand('./systems/autoHostSystem.js', 'autohost', 1);

            setTimeout(function() {
                checkAutoHost();
                if ($.getIniDbBoolean('autohost_config', 'hosting', false)) {
                    doAutoHost(false);
                }
            }, 6e3);
        }
    });
})();
