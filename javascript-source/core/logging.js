/**
 * logging.js
 *
 * Provide and API for logging events and errors
 * Use the $ API for log functions
 * Use the $.logging API for getting log-like date and time strings
 */
(function() {
    var interval,
        logDays = $.getSetIniDbNumber('settings', 'log_rotate_days', 90);

    var logs = {
        file: $.getSetIniDbBoolean('settings', 'log.file', false),
        event: $.getSetIniDbBoolean('settings', 'log.event', true),
        error: $.getSetIniDbBoolean('settings', 'log.error', true),
    };

    /**
    * function reloadLogs()
    */
    function reloadLogs() {
        $.getIniDbNumber('settings', 'log_rotate_days');

        logs = {
            file: $.getIniDbBoolean('settings', 'log.file'),
            event: $.getIniDbBoolean('settings', 'log.event'),
            error: $.getIniDbBoolean('settings', 'log.error'),
        };
    };

    /**
     * @function getLogDateString
     * @export $.logging
     * @param {Number} [timeStamp]
     * @returns {string}
     */
    function getLogDateString(timeStamp) {
        var now = (timeStamp ? new Date(timeStamp) : new Date()),
            pad = function(i) {
                return (i < 10 ? '0' + i : i);
            };
        return pad(now.getDate()) + '-' + pad(now.getMonth() + 1) + '-' + now.getFullYear();
    };

    /**
     * @function getLogTimeString
     * @export $.logging
     * @param {Number} [timeStamp]
     * @returns {string}
     */
    function getLogTimeString(timeStamp) {
        if (timeStamp) {
            return (new Date(timeStamp)).toLocaleTimeString('en-GB').replace(' ', '_');
        } else {
            return (new Date()).toTimeString();
        }
    };

    /**
     * @function getLogEntryTimeDateString
     * @export $.logging
     * @param {Date}
     */
    function getLogEntryTimeDateString(now) {
        var timezone,
            timezoneMatch;

        timezoneMatch = now.toString().match(/\((\w+)\)/);
        if (timezoneMatch === null) {
            timezoneMatch = now.toString().match(/\((\w+-\d+)\)/);
            if (timezoneMatch === null) {
                timezone = '';
            } else {
                timezone = ' ' + timezoneMatch[1];
            }
        } else {
            timezone = ' ' + timezoneMatch[1];
        }

        var pad = function(i) {
                return (i < 10 ? '0' + i : i);
            }; 
            padms = function(i) {
                return (i < 10 ? '00' + i : i < 100 ? '0' + i : i);
            }; 
        return pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '-' + now.getFullYear() + ' @ ' +
                   pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':'  + pad(now.getSeconds()) + '.' + padms(now.getMilliseconds()) + 
                   timezone;
    }

    /**
     * @function logfile
     * @export $
     * @param {string} filePrefix
     * @param {string} message
     * @param {string} [sender]
     */
    function logfile(filePrefix, message, sender) {
        if (!logs.file || message.equalsIgnoreCase('.mods')) {
            return;
        }

        if (!$.isDirectory('./logs/' + filePrefix)) {
            $.mkDir('./logs/' + filePrefix);
        }

        var now = new Date();
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] ' + message,'./logs/' + filePrefix + '/' + getLogDateString() + '.txt', true);
    };

    /**
     * @function logEvent
     * @export $
     * @param {string} message
     */
    function logEvent(message) {
        if (!logs.event || message.indexOf('specialuser') != -1) {
            return;
        }

        if (!$.isDirectory('./logs/event')) {
            $.mkDir('./logs/event');
        }

        if (!$.fileExists('./logs/event/' + getLogDateString() + '.txt')) {
            $.touchFile('./logs/event/' + getLogDateString() + '.txt');
        }

        try {
            throw new Error('eventlog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        var now = new Date();
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] [' + sourceFile + '] ' + message,'./logs/event/' + getLogDateString() + '.txt', true);
    };

    /**
     * @function logError
     * @export $
     * @param {string} message
     */
    function logError(message) {
        if (!logs.error) {
            return;
        }

        if (!$.isDirectory('./logs/error')) {
            $.mkDir('./logs/error');
        }

        try {
            throw new Error('errorlog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        var now = new Date();
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] [' + sourceFile + '] ' + message,'./logs/error/' + getLogDateString() + '.txt', true);
        Packages.com.gmt2001.Console.err.printlnRhino(java.util.Objects.toString('[' + sourceFile + '] ' + message));
    };

    /**
     * @function logWarning
     * @export $
     * @param {string} message
     */
    function logWarning(message) {
        if (!logs.error) {// this will count as a error just not a bad error
            return;
        }

        if (!$.isDirectory('./logs/warning')) {
            $.mkDir('./logs/warning');
        }

        try {
            throw new Error('warninglog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        var now = new Date();
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] [' + sourceFile + '] ' + message,'./logs/warning/' + getLogDateString() + '.txt', true);
        Packages.com.gmt2001.Console.warn.printlnRhino(java.util.Objects.toString(message));
    };

    /**
     * @function logRotate
     */
    function logRotate() {
        var logFiles,
            idx,
            logFileDate,
            logDirs = [ 'chat', 'chatModerator', 'core', 'core-debug', 'core-error', 'error', 'event', 'patternDetector', 'pointSystem', 'private-messages' ],
            logDirIdx,
            datefmt = new java.text.SimpleDateFormat('dd-MM-yyyy'),
            date,
            rotateDays = $.getIniDbNumber('settings', 'log_rotate_days') * 24 * 60 * 6e4,
            checkDate = $.systemTime() - rotateDays;

        if (rotateDays === 0) {
            $.log.event('Log Rotation is Disabled');
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
    };

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        logfile('chat', '' + event.getSender() + ': ' + event.getMessage());
    });

    /**
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function(event) {
        var sender = event.getSender().toLowerCase(),
            message = event.getMessage().toLowerCase();

        if (message.startsWith('specialuser')) {
            return;
        }

        if (message.indexOf('the moderators if this room') == -1) {
            logfile('private-messages', '' + sender + ': ' + message);
        }

        if (sender.equalsIgnoreCase('jtv')) {
            if (message.equalsIgnoreCase('clearchat')) {
                logfile('private-messages', '' + $.lang.get('console.received.clearchat'));
            } else if (message.indexOf('clearchat') != -1) {
                logEvent($.lang.get('console.received.purgetimeoutban', message.substring(10)));
            } else if (message.indexOf('now in slow mode') != -1) {
                logfile('private-messages', '' + $.lang.get('console.received.slowmode.start', message.substring(message.indexOf('every') + 6)));
            } else if (message.indexOf('no longer in slow mode') != -1) {
                logfile('private-messages', '' + $.lang.get('console.received.slowmode.end'));
            } else if (message.indexOf('now in subscribers-only') != -1) {
                logfile('private-messages', '' + $.lang.get('console.received.subscriberonly.start'));
            } else if (message.indexOf('no longer in subscribers-only') != -1) {
                logfile('private-messages', '' + $.lang.get('console.received.subscriberonly.end'));
            } else if (message.indexOf('now in r9k') != -1) {
                logfile('private-messages', '' + $.lang.get('console.received.r9k.start'));
            } else if (message.indexOf('no longer in r9k') != -1) {
                logfile('private-messages', '' + $.lang.get('console.received.r9k.end'));
            } else if (message.indexOf('hosting') != -1) {
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

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            sender = event.getSender(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath log - Get current logging usage
         */
        if (command.equalsIgnoreCase('log')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
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
                if (logs.file) {
                    logs.file = false;
                } else {
                    logs.file = true;
                }
                $.setIniDbBoolean('settings', 'log.file', logs.file);
                logEvent(sender + ' toggled logging for files');
                $.say($.whisperPrefix(sender) + (logs.file ? $.lang.get('logging.enabled.files') : $.lang.get('logging.disabled.files')));
            }

            /**
             * @commandpath log events - Toggle the logging of events
             */
            if (action.equalsIgnoreCase('events')) {
                if (logs.event) {
                    logs.event = false;
                } else {
                    logs.event = true;
                }
                $.setIniDbBoolean('settings', 'log.event', logs.event);
                logEvent(sender + ' toggled logging for event');
                $.say($.whisperPrefix(sender) + (logs.event ? $.lang.get('logging.enabled.event') : $.lang.get('logging.disabled.event')));
            }

            /**
             * @commandpath log errors - Toggle the logging of errors
             */
            if (action.equalsIgnoreCase('errors')) {
                if (logs.error) {
                    logs.error = false;
                } else {
                    logs.error = true;
                }
                $.setIniDbBoolean('settings', 'log.error', logs.error);
                logEvent(sender + ' toggled logging for error');
                $.say($.whisperPrefix(sender) + (logs.error ? $.lang.get('logging.enabled.error') : $.lang.get('logging.disabled.error')));
            }
        }
    });

    interval = setInterval(function() { 
        logRotate(); 
    }, 24 * 60 * 6e4);

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/logging.js')) {
            $.registerChatCommand('./core/logging.js', 'log', 1);
            logRotate();
        }
    });

    /** Export functions to API */
    $.logging = {
        getLogDateString: getLogDateString,
        getLogTimeString: getLogTimeString,
    };

    $.log = {
        file: logfile,
        event: logEvent,
        error: logError,
        warn: logWarning,
    };

    $.reloadLogs = reloadLogs;
})();
