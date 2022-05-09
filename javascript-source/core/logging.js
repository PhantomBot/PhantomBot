/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
 * logging.js
 *
 * Provide and API for logging events and errors
 * Use the $ API for log functions
 * Use the $.logging API for getting log-like date and time strings
 */
(function () {
    var logs = {
        file: $.getSetIniDbBoolean('settings', 'log.file', true),
        event: $.getSetIniDbBoolean('settings', 'log.event', true),
        error: $.getSetIniDbBoolean('settings', 'log.error', true)
    },
            cmdLogEnabled = $.getSetIniDbBoolean('discordSettings', 'customCommandLogs', false),
            cmdDiscordLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./core/logging.js')) {
            cmdLogEnabled = $.getSetIniDbBoolean('discordSettings', 'customCommandLogs', false);
            cmdDiscordLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');
        }
    });

    /*
     * function reloadLogs()
     */
    function reloadLogs() {
        logs.file = $.getIniDbBoolean('settings', 'log.file');
        logs.event = $.getIniDbBoolean('settings', 'log.event');
        logs.error = $.getIniDbBoolean('settings', 'log.error');
    }

    /*
     * @function getLogDateString
     *
     * @export $.logging
     * @param  {Number} timeStamp
     * @return {String}
     */
    function getLogDateString(timeStamp) {
        var now = (timeStamp ? new Date(timeStamp) : new Date()),
                pad = function (i) {
                    return (i < 10 ? '0' + i : i);
                };

        return pad(now.getDate()) + '-' + pad(now.getMonth() + 1) + '-' + now.getFullYear();
    }

    /*
     * @function getLogTimeString
     *
     * @export $.logging
     * @param  {Number} timeStamp
     * @return {String}
     */
    function getLogTimeString(timeStamp) {
        if (timeStamp) {
            return (new Date(timeStamp)).toLocaleTimeString('en-GB').replace(' ', '_');
        } else {
            return (new Date()).toTimeString();
        }
    }

    /*
     * @function getLogEntryTimeDateString
     *
     * @export $.logging
     * @return {String}
     */
    function getLogEntryTimeDateString() {
        var dateFormat = new java.text.SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss.SSS z");

        dateFormat.setTimeZone(java.util.TimeZone.getTimeZone(($.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : 'GMT')));
        return dateFormat.format(new Date());
    }

    /*
     * @function logCustomCommand
     *
     * @param {object} info
     */
    function logCustomCommand(info) {
        var lines = Object.keys(info).map(function (key) {
            return '**' + $.lang.get('discord.customcommandlogs.' + key) + '**: ' + info[key];
        });
        $.log.file('customCommands', lines.join('\r\n'));
        if (!$.hasDiscordToken && cmdLogEnabled && cmdDiscordLogChannel) {
            $.discordAPI.sendMessageEmbed(cmdDiscordLogChannel, 'blue', lines.join('\r\n\r\n'));
        }
    }

    function invalidLocation(path) {
        return !Packages.com.gmt2001.PathValidator.isValidPathScript($.javaString(path));
    }

    function writeToFile(line, path, append) {
        if (invalidLocation(path)) {
            Packages.com.gmt2001.Console.err.printlnRhino('Failed to write to \'' + path + '\': Outside of valid paths');
            return;
        }

        try {
            Packages.com.gmt2001.JSFileSystem.WriteLineToFile($.javaString(path), $.javaString(line), append);
        } catch (e) {
            Packages.com.gmt2001.Console.err.printlnRhino('Failed to write to \'' + path + '\': ' + e);
        }
    }

    /*
     * @function logfile
     *
     * @export $
     * @param {String} filePrefix
     * @param {String} message
     * @param {String} sender
     */
    function logfile(filePrefix, message, sender) {
        if (logs.file === false || message.indexOf('.mods') !== -1) {
            return;
        }

        Packages.com.gmt2001.JSFileSystem.MakeDir($.javaString('./logs/' + filePrefix));

        writeToFile('[' + getLogEntryTimeDateString() + '] ' + message, './logs/' + filePrefix + '/' + getLogDateString() + '.txt', true);
    }

    /*
     * @function logEvent
     *
     * @export $
     * @param {string} message
     */
    function logEvent(message) {
        if (logs.event === false || message.indexOf('specialuser') !== -1) {
            return;
        }

        Packages.com.gmt2001.JSFileSystem.MakeDir($.javaString('./logs/event'));

        try {
            throw new Error('eventlog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        writeToFile('[' + getLogEntryTimeDateString() + '] [' + sourceFile.trim() + '] ' + message, './logs/event/' + getLogDateString() + '.txt', true);
    }

    /*
     * @function logError
     *
     * @export $
     * @param {String} message
     */
    function logError(message) {
        if (logs.error === false) {
            return;
        }

        Packages.com.gmt2001.JSFileSystem.MakeDir($.javaString('./logs/error'));

        try {
            throw new Error('errorlog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        writeToFile('[' + getLogEntryTimeDateString() + '] [' + sourceFile.trim() + '] ' + message, './logs/error/' + getLogDateString() + '.txt', true);
        Packages.com.gmt2001.Console.err.printlnRhino(java.util.Objects.toString('[' + sourceFile.trim() + '] ' + message));
    }

    /*
     * @function logWarning
     *
     * @export $
     * @param {String} message
     */
    function logWarning(message) {
        if (logs.error === false) {
            return;
        }

        Packages.com.gmt2001.JSFileSystem.MakeDir($.javaString('./logs/warning'));

        try {
            throw new Error('warninglog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        writeToFile('[' + getLogEntryTimeDateString() + '] [' + sourceFile.trim() + '] ' + message, './logs/warning/' + getLogDateString() + '.txt', true);
        Packages.com.gmt2001.Console.warn.printlnRhino(java.util.Objects.toString(message));
    }

    /*
     * @function logRotate
     */
    function logRotate() {
        var logFiles,
                idx,
                logFileDate,
                logDirs = ['chat', 'chatModerator', 'core', 'core-debug', 'core-error', 'error', 'event', 'patternDetector', 'pointSystem', 'private-messages'],
                logDirIdx,
                datefmt = new java.text.SimpleDateFormat('dd-MM-yyyy'),
                date,
                rotateDays = $.getIniDbNumber('settings', 'log_rotate_days') * 24 * 60 * 6e4,
                checkDate = $.systemTime() - rotateDays;

        if (rotateDays === 0) {
            return;
        }

        $.log.event('Starting Log Rotation');
        for (logDirIdx = 0; logDirIdx < logDirs.length; logDirIdx++) {
            logFiles = $.findFiles('./logs/' + logDirs[logDirIdx], 'txt');
            for (idx = 0; idx < logFiles.length; idx++) {
                logFileDate = logFiles[idx].match(/(\d{2}-\d{2}-\d{4})/)[1];
                date = datefmt.parse(logFileDate);
                if (date.getTime() < checkDate) {
                    $.log.event('Log Rotate: Deleted ./logs/' + logDirs[logDirIdx] + '/' + logFiles[idx]);
                    $.deleteFile('./logs/' + logDirs[logDirIdx] + '/' + logFiles[idx], true);
                }
            }
        }
        $.log.event('Finished Log Rotation');
    }

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        logfile('chat', '' + event.getSender() + ': ' + event.getMessage());
    });

    /*
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function (event) {
        var sender = event.getSender().toLowerCase(),
                message = event.getMessage().toLowerCase();

        if (message.startsWith('specialuser')) {
            return;
        }

        if (message.indexOf('the moderators if this room') === -1) {
            logfile('private-messages', '' + sender + ': ' + message);
        }

        if (sender.equalsIgnoreCase('jtv')) {
            if (message.equalsIgnoreCase('clearchat')) {
                logfile('private-messages', '' + $.lang.get('console.received.clearchat'));
            } else if (message.indexOf('clearchat') !== -1) {
                logEvent($.lang.get('console.received.purgetimeoutban', message.substring(10)));
            } else if (message.indexOf('now in slow mode') !== -1) {
                logfile('private-messages', '' + $.lang.get('console.received.slowmode.start', message.substring(message.indexOf('every') + 6)));
            } else if (message.indexOf('no longer in slow mode') !== -1) {
                logfile('private-messages', '' + $.lang.get('console.received.slowmode.end'));
            } else if (message.indexOf('now in subscribers-only') !== -1) {
                logfile('private-messages', '' + $.lang.get('console.received.subscriberonly.start'));
            } else if (message.indexOf('no longer in subscribers-only') !== -1) {
                logfile('private-messages', '' + $.lang.get('console.received.subscriberonly.end'));
            } else if (message.indexOf('now in r9k') !== -1) {
                logfile('private-messages', '' + $.lang.get('console.received.r9k.start'));
            } else if (message.indexOf('no longer in r9k') !== -1) {
                logfile('private-messages', '' + $.lang.get('console.received.r9k.end'));
            } else if (message.indexOf('hosting') !== -1) {
                var target = String(message).replace(/now hosting /ig, '').replace(/\./ig, '');

                if (target.equalsIgnoreCase('-')) {
                    $.bot.channelIsHosting = null;
                    logfile('private-messages', '' + $.lang.get('console.received.host.end'));
                } else {
                    $.bot.channelIsHosting = target;
                    logfile('private-messages', '' + $.lang.get('console.received.host.start', target));
                }
            } else {
                logfile('private-messages', '' + sender + ': ' + message);
            }
        }
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
        var command = event.getCommand(),
                sender = event.getSender(),
                args = event.getArgs(),
                action = args[0];

        if (command.equalsIgnoreCase('log')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('logging.usage'));
                return;
            }

            /**
             * @commandpath log rotatedays [days] - Display or set number of days to rotate the logs. 0 to disable log rotation.
             */
            if (action.equalsIgnoreCase('rotatedays')) {
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
            if (action.equalsIgnoreCase('files')) {
                logs.file = !logs.file;
                $.setIniDbBoolean('settings', 'log.file', logs.file);
                $.say($.whisperPrefix(sender) + (logs.file ? $.lang.get('logging.enabled.files') : $.lang.get('logging.disabled.files')));
                return;
            }

            /**
             * @commandpath log events - Toggle the logging of events
             */
            if (action.equalsIgnoreCase('events')) {
                logs.event = !logs.event;
                $.setIniDbBoolean('settings', 'log.event', logs.event);
                $.say($.whisperPrefix(sender) + (logs.event ? $.lang.get('logging.enabled.event') : $.lang.get('logging.disabled.event')));
                return;
            }

            /**
             * @commandpath log errors - Toggle the logging of errors
             */
            if (action.equalsIgnoreCase('errors')) {
                logs.error = !logs.error;
                $.setIniDbBoolean('settings', 'log.error', logs.error);
                $.say($.whisperPrefix(sender) + (logs.error ? $.lang.get('logging.enabled.error') : $.lang.get('logging.disabled.error')));
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
        $.registerChatCommand('./core/logging.js', 'log', 1);

        logRotate();
    });

    /* Export functions to API */
    $.logging = {
        getLogEntryTimeDateString: getLogEntryTimeDateString,
        getLogDateString: getLogDateString,
        getLogTimeString: getLogTimeString
    };

    $.log = {
        file: logfile,
        event: logEvent,
        error: logError,
        warn: logWarning
    };

    $.reloadLogs = reloadLogs;
    $.logCustomCommand = logCustomCommand;
})();
