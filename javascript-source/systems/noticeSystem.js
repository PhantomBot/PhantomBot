/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * noticeSystem.js
 *
 * Will say a message or a command every x amount of minutes.
 */

(function() {
    var noticeReqMessages = $.getSetIniDbNumber('noticeSettings', 'reqmessages', 25),
        noticeInterval = $.getSetIniDbNumber('noticeSettings', 'interval', 10),
        noticeToggle = $.getSetIniDbBoolean('noticeSettings', 'noticetoggle', false),
        numberOfNotices = 0,
        noticeOffline = $.getSetIniDbBoolean('noticeSettings', 'noticeOfflineToggle', false),
        isReloading = false,
        messageCount = 0,
        RandomNotice = 0,
        lastNoticeSent = 0,
        interval;

    function updateNumberOfNotices() {
        var keys = $.inidb.GetKeyList('notices', ''),
            count = 0;

        for (i = 0; i < keys.length; i++) {
            if (!$.jsString(keys[i]).endsWith('_disabled')) {
                count++;
            }
        }

        numberOfNotices = count;
    };

    /**
     * @function reloadNotices
     */
    function reloadNotices() {
        if (!isReloading) {
            isReloading = true;
            var keys = $.inidb.GetKeyList('notices', ''),
                temp = [],
                temp2 = [],
                i;

            for (i = 0; i < keys.length; i++) {
                if (!$.jsString(keys[i]).endsWith('_disabled') && $.inidb.get('notices', keys[i]) !== null) {
                    temp[i] = $.inidb.get('notices', keys[i]);
                    if ($.inidb.exists('notices', keys[i] + '_disabled')) {
                        temp2[i] = $.jsString($.inidb.get('notices', keys[i] + '_disabled'));
                    } else {
                        temp2[i] = '0';
                    }
                }
            }

            $.inidb.RemoveFile('notices');

            for (i = 0; i < temp.length; i++) {
                $.inidb.set('notices', 'message_' + i, temp[i]);
                if (temp2[i] === '1') {
                    $.inidb.set('notices', 'message_' + i + '_disabled', temp2[i]);
                }
            }

            updateNumberOfNotices();
            if (RandomNotice >= numberOfNotices) {
                RandomNotice = 0;
            }
            isReloading = false;
        }
    };

    /**
     * @function sendNotice
     */
    function sendNotice() {
        var EventBus = Packages.tv.phantombot.event.EventBus,
            CommandEvent = Packages.tv.phantombot.event.command.CommandEvent,
            start = RandomNotice,
            notice = null,
            disabled;

        do {
            notice = $.inidb.get('notices', 'message_' + RandomNotice);
            disabled = $.inidb.GetBoolean('notices', '', 'message_' + RandomNotice + '_disabled');

            RandomNotice++;

            if (RandomNotice >= numberOfNotices) {
                RandomNotice = 0;
            }

            if (disabled) {
                notice = null;
            }

            if (notice && notice.match(/\(gameonly=.*\)/g)) {
                var game = notice.match(/\(gameonly=(.*)\)/)[1];
                if ($.getGame($.channelName).equalsIgnoreCase(game)) {
                    notice = $.replace(notice, notice.match(/(\(gameonly=.*\))/)[1], "");
                } else {
                    notice = null;
                }
            }
        } while(!notice && start !== RandomNotice);

        if (notice === null) {
            return;
        }

        if (notice.startsWith('command:')) {
            notice = notice.substring(8).replace('!', '');
            EventBus.instance().post(new CommandEvent($.botName, notice, ' '));
        } else if (notice.startsWith('!')) {
            notice = notice.substring(1);
            EventBus.instance().post(new CommandEvent($.botName, notice, ' '));
        } else {
            $.say(notice);
        }
    };

    /**
     * @function reloadNoticeSettings
     */
    function reloadNoticeSettings() {
        noticeReqMessages = $.getIniDbNumber('noticeSettings', 'reqmessages');
        noticeToggle = $.getIniDbBoolean('noticeSettings', 'noticetoggle');
        noticeOffline = $.getIniDbBoolean('noticeSettings', 'noticeOfflineToggle');
        noticeInterval = $.getIniDbNumber('noticeSettings', 'interval');
    };

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
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
            action = args[0];

        /**
         * @commandpath notice - Base command for managing notices
         */
        if (command.equalsIgnoreCase('notice')) {
            if (args.length === 0) {
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
                    argsString = args.slice(2).join(' ');
                    $.inidb.set('notices', 'message_' + args[1], argsString);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-success'));
                    return;
                }
            }

            /**
             * @commandpath notice toggleid [id] - Toggles on/off the notice at the given ID
             */
            if (action.equalsIgnoreCase('toggleid')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-toggleid-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    var disabled = $.inidb.GetBoolean('notices', '', 'message_' + args[1] + '_disabled');
                    $.inidb.SetBoolean('notices', '', 'message_' + args[1] + '_disabled', !disabled);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-toggleid-success', args[1], disabled ? 'enabled' : 'disabled'));
                    return;
                }
            }

            if (action.equalsIgnoreCase('toggleidsilent')) {
                if (args.length < 2 || !$.inidb.exists('notices', 'message_' + args[1])) {
                    return;
                } else {
                    var disabled = $.inidb.GetBoolean('notices', '', 'message_' + args[1] + '_disabled');
                    $.inidb.SetBoolean('notices', '', 'message_' + args[1] + '_disabled', !disabled);
                    return;
                }
            }

            /**
             * USED FOR THE PANEL
             */
            if (action.equalsIgnoreCase('editsilent')) {
                if (args.length < 3) {
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    argsString = args.slice(2).join(' ');
                    $.inidb.set('notices', 'message_' + args[1], argsString);
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-success'));
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
                    $.inidb.del('notices', 'message_' + args[1] + '_disabled');
                    reloadNotices();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-success'));
                    return;
                }
            }

            /**
             * USED BY THE PANEL
             */
            if (action.equalsIgnoreCase('removesilent')) {
                if (args.length < 2) {
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    $.inidb.del('notices', 'message_' + args[1]);
                    $.inidb.del('notices', 'message_' + args[1] + '_disabled');
                    reloadNotices();
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-success'));
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
                    argsString = args.slice(1).join(' ');
                    $.inidb.set('notices', 'message_' + numberOfNotices, argsString);
                    numberOfNotices++;
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-success'));
                    return;
                }
            }

            /**
             * USED BY THE PANEL
             */
            if (action.equalsIgnoreCase('addsilent')) {
                if (args.length < 2) {
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-usage'));
                    return;
                } else {
                    argsString = args.slice(1).join(' ');
                    $.inidb.set('notices', 'message_' + numberOfNotices, argsString);
                    numberOfNotices++;
                    //$.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-success'));
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
                } else if (isNaN(args[1]) || parseInt(args[1]) < 5) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-interval-404'));
                    return;
                } else {
                    $.inidb.set('noticeSettings', 'interval', parseInt(args[1]));
                    noticeInterval = parseInt(args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-inteval-success'));
                    reloadNoticeSettings();
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
                }

                $.inidb.set('noticeSettings', 'reqmessages', args[1]);
                noticeReqMessages = parseInt(args[1]);
                $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-success'));
                return;
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
                    $.inidb.set('noticeSettings', 'noticeOfflineToggle', 'false');
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-disabled.offline'));
                } else {
                    noticeOffline = true;
                    $.inidb.set('noticeSettings', 'noticeOfflineToggle', 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-enabled.offline'));
                }
            }
        }
    });

    // Set the interval to announce
    interval = setInterval(function() {
        if (noticeToggle && $.bot.isModuleEnabled('./systems/noticeSystem.js') && numberOfNotices > 0) {
            if ((noticeReqMessages < 0 || messageCount >= noticeReqMessages) && (lastNoticeSent + (noticeInterval * 6e4)) <= $.systemTime()) {
                if ((noticeOffline && !$.isOnline($.channelName)) || $.isOnline($.channelName)) {
                    sendNotice();
                    messageCount = 0;
                    lastNoticeSent = $.systemTime();
                }
            }
        }
    }, 1e4, 'scripts::handlers::noticeSystem.js');

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/noticeSystem.js', 'notice', 1);

        updateNumberOfNotices();
    });

    $.reloadNoticeSettings = reloadNoticeSettings;
})();
