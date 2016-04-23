/**
 * noticeSystem.js
 *
 * Will say a message or a command every x amount of minutes.
 */

(function() {
    var noticeReqMessages = $.getSetIniDbNumber('noticeSettings', 'reqmessages', 25),
        noticeInterval = $.getSetIniDbNumber('noticeSettings', 'interval', 10),
        noticeToggle = $.getSetIniDbBoolean('noticeSettings', 'noticetoggle', false),
        numberOfNotices = (parseInt($.inidb.GetKeyList('notices', '').length) ? parseInt($.inidb.GetKeyList('notices', '').length) : 0),
        noticeOffline = $.getSetIniDbBoolean('noticeSettings', 'noticeOffline', true),
        messageCount = 0,
        RandomNotice = 0;

    /**
     /* @function reloadNotices
       */
    function reloadNotices() {
        var keys = $.inidb.GetKeyList('notices', ''),
            count = 0,
            i;

        for (i = 0; i < keys.length; i++) {
            $.inidb.set('tempnotices', keys[i], $.inidb.get('notices', keys[i]));
        }

        $.inidb.RemoveFile('notices');
        keys = $.inidb.GetKeyList('tempnotices', '');

        for (i = 0; i < keys.length; i++) {
            $.inidb.set('notices', 'message_' + count, $.inidb.get('tempnotices', keys[i]));
            count++;
        }

        $.inidb.RemoveFile('tempnotices');
    };
    /**
     * @function sendNotice
     */
    function sendNotice() {
        var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus,
            CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent,
            notice = $.inidb.get('notices', 'message_' + RandomNotice);

        RandomNotice++;

        if (RandomNotice >= numberOfNotices) {
            RandomNotice = 0;
        }

        if (notice.startsWith('command:')) {
            notice = notice.substring(8);
            EventBus.instance().postCommand(new CommandEvent($.botName, notice, ' '));
        } else {
            $.say(notice);
        }
    };

    /**
     * @function reloadNoticeSettings
     */
    function reloadNoticeSettings() {
        noticeReqMessages = $.getIniDbNumber('noticeSettings', 'reqmessages');
        noticeInterval = $.getIniDbNumber('noticeSettings', 'interval');
        noticeToggle = $.getIniDbBoolean('noticeSettings', 'noticetoggle');
        noticeOffline = $.getIniDbBoolean('noticeSettings', 'noticeOffline');
    };

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function() {
        messageCount++;
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            message = '';

        /**
         * @commandpath notice - Base command for managing notices
         */
        if (command.equalsIgnoreCase('notice')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-usage'));
                return;
            }

            /**
             * @commandpath notice get [id] - Gets the notice related to the ID
             */
            if (action.equalsIgnoreCase('get')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-get-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    $.say($.inidb.get('notices', 'message_' + args[1]));
                    return;
                }
            }

            /**
             * @commandpath notice edit [id] [new message] - Replace the notice at the given ID
             */
            if (action.equalsIgnoreCase('edit')) {
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    argsString = argsString.replace(action + ' ' + args[1], '').trim();
                    $.inidb.set('notices', 'message_' + args[1], argsString);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-success'));
                    return;
                }
            }

            /**
             * @commandpath notice remove [id] - Removes the notice related to the given ID
             */
            if (action.equalsIgnoreCase('remove')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    $.inidb.del('notices', 'message_' + args[1]);
                    numberOfNotices--;
                    reloadNotices();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-success'));
                    return;
                }
            }

            /**
             * @commandpath notice add [message or command] - Adds a notice, with a custom message, or a command ex: !notice add command:COMMANDS_NAME
             */
            if (action.equalsIgnoreCase('add')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-usage'));
                    return;
                } else {
                    argsString = argsString.replace(action + '', '').trim();
                    $.inidb.set('notices', 'message_' + numberOfNotices, argsString);
                    numberOfNotices++;
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-success'));
                    return;
                }
            }

            /**
             * @commandpath notice interval [minutes] - Sets the notice interval in minutes
             */
            if (action.equalsIgnoreCase('interval')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-interval-usage'));
                    return;
                } else if (parseInt(args[1]) < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-interval-404'));
                    return;
                } else {
                    $.inidb.set('noticeSettings', 'interval', args[1]);
                    noticeInterval = parseInt(args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-inteval-success'));

                    setInterval(function() {
                        if (noticeToggle && $.bot.isModuleEnabled('./systems/noticeSystem.js') && numberOfNotices > 0) {
                            if (messageCount >= noticeReqMessages) {
                                if (noticeOffline && $.isOnline($.channelName)) {
                                    sendNotice();
                                    messageCount = 0;
                                }
                            }
                        }
                    }, noticeInterval * 60 * 1000, 'noticeTimer');
                    return;
                }
            }

            /**
             * @commandpath notice req [message count] - Set the number of messages needed to trigger a notice
             */
            if (action.equalsIgnoreCase('req')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-usage'));
                    return;
                } else if (parseInt(args[1]) < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-404'));
                    return;
                } else {
                    $.inidb.set('noticeSettings', 'reqmessages', args[1]);
                    noticeReqMessages = parseInt(args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-success'));
                    return;
                }
            }

            /**
             * @commandpath notice config - Shows current notice configuration
             */
            if (action.equalsIgnoreCase('config')) {
                $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-config', noticeToggle, noticeInterval, noticeReqMessages, numberOfNotices, noticeOffline));
                return;
            }

            /**
             * @commandpath notice toggle - Toggles notices on and off
             */
            if (action.equalsIgnoreCase('toggle')) {
                if (noticeToggle) {
                    noticeToggle = false;
                    $.inidb.set('noticeSettings', 'noticetoggle', 'false');
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-disabled'));
                } else {
                    noticeToggle = true;
                    $.inidb.set('noticeSettings', 'noticetoggle', 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-enabled'));
                }
            }

            /**
             * @commandpath notice toggleoffline - Toggles on and off if notices can be said in chat if the channel is offline
             */
            if (action.equalsIgnoreCase('toggleoffline')) {
                if (noticeOffline) {
                    noticeOffline = false;
                    $.inidb.set('noticeSettings', 'noticeOffline', 'false');
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-disabled.offline'));
                } else {
                    noticeOffline = true;
                    $.inidb.set('noticeSettings', 'noticeOffline', 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-enabled.offline'));
                }
            }
        }

        if (command.equalsIgnoreCase('reloadnotice')) {
            if (!$.isAdmin(sender)) {
                return;
            }
            reloadNoticeSettings();
        }
    });

    // Set the interval to announce
    setInterval(function() {
        if (noticeToggle && $.bot.isModuleEnabled('./systems/noticeSystem.js') && numberOfNotices > 0) {
            if (messageCount >= noticeReqMessages) {
                if ((noticeOffline && !$.isOnline($.channelName)) || $.isOnline($.channelName)) {
                    sendNotice();
                    messageCount = 0;
                }
            }
        }
    }, noticeInterval * 60 * 1000, 'noticeTimer');

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/noticeSystem.js')) {
            $.registerChatCommand('./systems/noticeSystem.js', 'notice', 1);
            $.registerChatCommand('./systems/noticeSystem.js', 'reloadnotice');
        }
    });
})();
