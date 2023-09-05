/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

/* global Packages */

/**
 * logging.js
 *
 * Binds for logging triggers and settings commands
 */
(function () {
    let cmdLogEnabled = $.getSetIniDbBoolean('discordSettings', 'customCommandLogs', false),
        cmdDiscordLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if ($.equalsIgnoreCase(event.getScript(), './core/logging.js')) {
            cmdLogEnabled = $.getSetIniDbBoolean('discordSettings', 'customCommandLogs', false);
            cmdDiscordLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');
        }
    });

    /*
     * @function logCustomCommand
     *
     * @param {object} info
     */
    function logCustomCommand(info) {
        let lines = Object.keys(info).map(function (key) {
            return '**' + $.lang.get('discord.customcommandlogs.' + key) + '**: ' + info[key];
        });
        $.log.file('customCommands', lines.join('\r\n'));
        if ($.hasDiscordToken && cmdLogEnabled && cmdDiscordLogChannel) {
            $.discordAPI.sendMessageEmbed(cmdDiscordLogChannel, 'blue', lines.join('\r\n\r\n'));
        }
    }

    /*
     * @function logRotate
     */
    function logRotate() {
        let logFiles,
                idx,
                logFileDate,
                logDirs = $.findFiles('./logs/', ''),
                logDirIdx,
                match,
                date,
                rotateDays = $.getIniDbNumber('settings', 'log_rotate_days', 0);

        if (rotateDays === 0) {
            return;
        }

        let checkDate = Packages.java.time.LocalDate.now().minusDays(rotateDays);

        $.log.event('Starting Log Rotation');
        for (logDirIdx = 0; logDirIdx < logDirs.length; logDirIdx++) {
            logFiles = $.findFiles('./logs/' + logDirs[logDirIdx], 'txt');
            for (idx = 0; idx < logFiles.length; idx++) {
                match = logFiles[idx].match(/(\d{4}-\d{2}-\d{2})/);
                if (match !== undefined && match !== null && match[1] !== undefined && match[1] !== null) {
                    logFileDate = match[1];
                    date = Packages.java.time.LocalDate.parse(logFileDate);
                    if (date.isBefore(checkDate)) {
                        $.log.event('Log Rotate: Deleted ./logs/' + logDirs[logDirIdx] + '/' + logFiles[idx]);
                        $.deleteFile('./logs/' + logDirs[logDirIdx] + '/' + logFiles[idx], true);
                    }
                }
            }
        }
        $.log.event('Finished Log Rotation');
    }

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        $.log.file('chat', '' + event.getSender() + ': ' + event.getMessage());
    });

    /*
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function (event) {
        let sender = event.getSender().toLowerCase(),
                message = event.getMessage().toLowerCase();

        if (message.startsWith('specialuser')) {
            return;
        }

        if ($.equalsIgnoreCase(sender, 'jtv')) {
            if ($.equalsIgnoreCase(message, 'clearchat')) {
                $.log.file('private-messages', '' + $.lang.get('console.received.clearchat'));
            } else if (message.indexOf('clearchat') !== -1) {
                $.log.event($.lang.get('console.received.purgetimeoutban', message.substring(10)));
            } else if (message.indexOf('now in slow mode') !== -1) {
                $.log.file('private-messages', '' + $.lang.get('console.received.slowmode.start', message.substring(message.indexOf('every') + 6)));
            } else if (message.indexOf('no longer in slow mode') !== -1) {
                $.log.file('private-messages', '' + $.lang.get('console.received.slowmode.end'));
            } else if (message.indexOf('now in subscribers-only') !== -1) {
                $.log.file('private-messages', '' + $.lang.get('console.received.subscriberonly.start'));
            } else if (message.indexOf('no longer in subscribers-only') !== -1) {
                $.log.file('private-messages', '' + $.lang.get('console.received.subscriberonly.end'));
            } else if (message.indexOf('now in r9k') !== -1) {
                $.log.file('private-messages', '' + $.lang.get('console.received.r9k.start'));
            } else if (message.indexOf('no longer in r9k') !== -1) {
                $.log.file('private-messages', '' + $.lang.get('console.received.r9k.end'));
            } else {
                $.log.file('private-messages', '' + sender + ': ' + message);
            }
        }
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
        let command = event.getCommand(),
                sender = event.getSender(),
                args = event.getArgs(),
                action = args[0];

        if ($.equalsIgnoreCase(command, 'log')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('logging.usage'));
                return;
            }

            /**
             * @commandpath log rotatedays [days] - Display or set number of days to rotate the logs. 0 to disable log rotation.
             */
            if ($.equalsIgnoreCase(action, 'rotatedays')) {
                if (args[1] === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('logging.rotatedays.usage', $.getIniDbNumber('settings', 'log_rotate_days')));
                    return;
                }
                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('logging.rotatedays.usage', $.getIniDbNumber('settings', 'log_rotate_days')));
                    return;
                }
                if (parseInt(args[1]) === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('logging.rotatedays.success.off'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('logging.rotatedays.success', args[1]));
                }
                $.inidb.set('settings', 'log_rotate_days', args[1]);
                return;
            }

            /**
             * @commandpath log files - Toggle the logging of files
             */
            if ($.equalsIgnoreCase(action, 'files')) {
                let enabled = !$.getIniDbBoolean('settings', 'log.file');
                $.setIniDbBoolean('settings', 'log.file', enabled);
                $.reloadLogs();
                $.say($.whisperPrefix(sender) + (enabled ? $.lang.get('logging.enabled.files') : $.lang.get('logging.disabled.files')));
                return;
            }

            /**
             * @commandpath log events - Toggle the logging of events
             */
            if ($.equalsIgnoreCase(action, 'events')) {
                let enabled = !$.getIniDbBoolean('settings', 'log.event');
                $.setIniDbBoolean('settings', 'log.event', enabled);
                $.reloadLogs();
                $.say($.whisperPrefix(sender) + (enabled ? $.lang.get('logging.enabled.event') : $.lang.get('logging.disabled.event')));
                return;
            }

            /**
             * @commandpath log errors - Toggle the logging of errors
             */
            if ($.equalsIgnoreCase(action, 'errors')) {
                let enabled = !$.getIniDbBoolean('settings', 'log.error');
                $.setIniDbBoolean('settings', 'log.error', enabled);
                $.reloadLogs();
                $.say($.whisperPrefix(sender) + (enabled  ? $.lang.get('logging.enabled.error') : $.lang.get('logging.disabled.error')));
            }
        }
    });

    setInterval(function () {
        logRotate();
    }, 24 * 60 * 6e4, 'scripts::core::logging.js');

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./core/logging.js', 'log', $.PERMISSION.Admin);

        logRotate();
    });

    $.logCustomCommand = logCustomCommand;
})();
