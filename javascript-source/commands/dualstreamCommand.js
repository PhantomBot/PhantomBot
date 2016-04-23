(function() {
    var otherChannels = $.getSetIniDbString('dualStreamCommand', 'otherChannels', 'Channel-1 Channel-2'),
        timerToggle = $.getSetIniDbBoolean('dualStreamCommand', 'timerToggle', false),
        timerInterval = $.getSetIniDbNumber('dualStreamCommand', 'timerInterval', 20),
        reqMessages = $.getSetIniDbNumber('dualStreamCommand', 'reqMessages', 10),
        messageCount = 0;

    function reloadMulti() {
        otherChannels = $.getIniDbString('dualStreamCommand', 'otherChannels');
        timerToggle = $.getIniDbBoolean('dualStreamCommand', 'timerToggle');
        timerInterval = $.getIniDbNumber('dualStreamCommand', 'timerInterval');
        reqMessages = $.getIniDbNumber('dualStreamCommand', 'reqMessages');

        setInterval(function() {
            if (timerToggle && otherChannels != 'Channel-1 Channel-2') {
                if ($.isOnline($.channelName) && messageCount >= reqMessages) {
                    $.say($.lang.get('dualstreamcommand.link') + $.username.resolve($.channelName) + '/' + otherChannels.replace(' ', '/'));
                    messageCount = 0;
                }
            }
        }, timerInterval * 60 *1000, 'dualStreamTimer');
    };

    $.bind('ircChannelMessage', function() {
        messageCount++;
    });

    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            argsString = event.getArguments().trim(),
            channel = argsString,
            channel2 = argsString,
            chan,
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath multi - Displays the current multi-link information of the usage
         */
        if (command.equalsIgnoreCase('multi')) {
            if (!action) {
                if (otherChannels != null) {
                    $.say($.lang.get('dualstreamcommand.link') + $.username.resolve($.channelName) + otherChannels);
                    return;
                } else {
                    if ($.isModv3(sender, event.getTags())) {
                        $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.usage'));
                        return;
                    }
                }
            }

            /**
             * @commandpath multi set [channels] - Adds a space-delimited list of channels to the multi-link (local channel already added)
             */
            if (action.equalsIgnoreCase('set')) {
                if (!$.isModv3(sender, event.getTags())) {
                    $.say($.whisperPrefix(sender) + $.modMsg);
                    return;
                } else if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.set.usage'));
                    return;
                }
                channel = channel.replace(action + ' ', '');
                channel2 = channel.replace(action + ' ', '/');
                channel2 = channel.replace(' ', '/');
                chan = channel2;
                otherChannels = channel;
                $.inidb.set('dualStreamCommand', 'otherChannels', otherChannels);
                $.say($.lang.get('dualstreamcommand.link.set', $.username.resolve($.channelName) + '/' + chan));
                $.logEvent('dualstreamCommand.js', 48, sender + ' set the multi link to "' + $.lang.get('dualstreamcommand.link') + $.username.resolve($.channelName) + '/' + chan + '"');
                return;
            }

            /**
             * @commandpath multi clear - Clears the multi-links and disables the timer
             */
            if (action.equalsIgnoreCase('clear')) {
                if (!$.isModv3(sender, event.getTags())) {
                    $.say($.whisperPrefix(sender) + $.modMsg);
                    return;
                }
                otherChannels = 'Channel-1 Channel-2';
                timerToggle = false;
                $.inidb.del('dualStreamCommand', 'otherChannels');
                $.inidb.set('dualStreamCommand', 'timerToggle', timerToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.clear'));
                $.logEvent('dualstreamCommand.js', 64, sender + ' cleared the multi link');
                return;
            }

            /**
             * @commandpath multi timer [on / off] - Enable/Disable the multi-links timer
             */
            if (action.equalsIgnoreCase('timer')) {
                if (!$.isModv3(sender, event.getTags())) {
                    $.say($.whisperPrefix(sender) + $.modMsg);
                    return;
                } else if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timer.usage'));
                    return;
                }

                if (subAction.equalsIgnoreCase('on')) {
                    timerToggle = true;
                    $.inidb.set('dualStreamCommand', 'timerToggle', timerToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timer.enabled'));
                    $.logEvent('dualstreamCommand.js', 85, sender + ' enabled the multi timer');
                    return;
                } else if (subAction.equalsIgnoreCase('off')) {
                    timerToggle = false;
                    $.inidb.set('dualStreamCommand', 'timerToggle', timerToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timer.disabled'));
                    $.logEvent('dualstreamCommand.js', 91, sender + ' disabled the multi timer');
                    return;
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timer.usage'));
                    return;
                }
            }

            /**
             * @commandpath multi timerinterval [time in minutes] - Set the interval for the multi-links timer
             */
            if (action.equalsIgnoreCase('timerinterval')) {
                if (!$.isModv3(sender, event.getTags())) {
                    $.say($.whisperPrefix(sender) + $.modMsg);
                    return;
                } else if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timerinterval.usage'));
                    return;
                } else if (parseInt(subAction) < 5) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timerinterval.err'));
                    return;
                }
                timerInterval = parseInt(subAction);
                $.inidb.set('dualStreamCommand', 'timerInterval', timerInterval);
                $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timerinterval.set', timerInterval));
                $.logEvent('dualstreamCommand.js', 116, sender + ' changed the multi timer interval to ' + timerInterval + ' seconds');

                setInterval(function() {
                    if (timerToggle && otherChannels != 'Channel-1 Channel-2') {
                        if ($.isOnline($.channelName) && messageCount >= reqMessages) {
                            $.say($.lang.get('dualstreamcommand.link') + $.username.resolve($.channelName) + otherChannels);
                            messageCount = 0;
                        }
                    }
                }, timerInterval * 60 * 1000, 'dualStreamTimer');
                return;
            }

            /**
             * @commandpath multi reqmessage [amount of messages] - Set the amount of message required before triggering the dual stream link
             */
            if (action.equalsIgnoreCase('reqmessage')) {
                if (!$.isModv3(sender, event.getTags())) {
                    $.say($.whisperPrefix(sender) + $.modMsg);
                    return;
                } else if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.req.usage'));
                    return;
                }
                
                reqMessages = parseInt(subAction);
                $.inidb.set('dualStreamCommand', 'reqMessages', reqMessages);
                $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.reqmessages.set', reqMessages));
                $.logEvent('dualstreamCommand.js', 116, sender + ' changed the multi req messages to ' + reqMessages + ' messages');
            }
        }

        if (command.equalsIgnoreCase('reloadmulti')){
            reloadMulti();
        }
    });

    setInterval(function() {
        if (timerToggle && otherChannels != 'Channel-1 Channel-2') {
            if ($.isOnline($.channelName) && messageCount >= reqMessages) {
                $.say($.lang.get('dualstreamcommand.link') + $.username.resolve($.channelName) + '/' + otherChannels.replace(' ', '/'));
                messageCount = 0;
            }
        }
    }, timerInterval * 60 * 1000, 'dualStreamTimer');

    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/dualstreamCommand.js')) {
            $.registerChatCommand('./commands/dualstreamCommand.js', 'multi', 7);
            $.registerChatCommand('./commands/dualstreamCommand.js', 'reloadmulti', 1);
        }
    });
})();
