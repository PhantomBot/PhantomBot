/**
 * logging.js
 *
 * Provide and API for logging events and errors
 * Use the $ API for log functions
 * Use the $.logging API for getting log-like date and time strings
 */
(function() {
    var loggingEnabled = $.getIniDbBoolean('settings', 'loggingEnabled', false);

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
        var timezone = now.toString().match(/\((\w+)\)/)[1],
            pad = function(i) {
                return (i < 10 ? '0' + i : i);
            }; 
            padms = function(i) {
                return (i < 10 ? '00' + i : i < 100 ? '0' + i : i);
            }; 
        return pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '-' + now.getFullYear() + ' @ ' +
                   pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':'  + pad(now.getSeconds()) + '.' + padms(now.getMilliseconds()) + 
                   ' ' + timezone;
    }

    /**
     * @function logfile
     * @export $
     * @param {string} filePrefix
     * @param {string} message
     * @param {string} [sender]
     */
    function logfile(filePrefix, message, sender) {
        if (!$.bot.isModuleEnabled('./core/fileSystem.js') || !loggingEnabled || (sender && sender.equalsIgnoreCase($.botName)) || message.equalsIgnoreCase('.mods')) {
            return;
        }

        if (!$.isDirectory('./logs/' + filePrefix)) {
            $.mkDir('./logs/' + filePrefix);
        }

        var now = new Date();
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] ' + message,
                          './logs/' + filePrefix + '/' + getLogDateString() + '.txt', true);
    };

    /**
     * @function logEvent
     * @export $
     * @param {string} message
     */
    function logEvent(message) {
        if (!$.bot.isModuleEnabled('./core/fileSystem.js') || !loggingEnabled) {
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
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] [' + sourceFile + '] ' + message,
                          './logs/event/' + getLogDateString() + '.txt', true);
    };

    /**
     * @function logError
     * @export $
     * @param {string} message
     */
    function logError(message) {
        if (!$.bot.isModuleEnabled('./core/fileSystem.js')) {
            return;
        }

        if (!$.isDirectory('./logs/error')) {
            $.mkDir('./logs/error');
        }

        try {
            throw new Error('eventlog');
        } catch (e) {
            sourceFile = e.stack.split('\n')[1].split('@')[1];
        }

        var now = new Date();
        $.writeToFile('[' + getLogEntryTimeDateString(now) + '] [' + sourceFile + '] ' + message,
                          './logs/error/' + getLogDateString() + '.txt', true);
    };

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        $.log.file('chat', '' + event.getSender() + ': ' + event.getMessage());
    });

    /**
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function(event) {
        var sender = event.getSender().toLowerCase(),
            message = event.getMessage();

        if (message.toLowerCase().indexOf('moderators if this room') == -1) {
            $.log.event('privMsg ' + ' ' + $.username.resolve(sender) + ': ' + message + ' ' + sender);
        }
        $.consoleDebug($.lang.get('console.received.irsprivmsg', sender, message));

        message = message.toLowerCase();
        if (sender.equalsIgnoreCase('jtv')) {
            if (message.equalsIgnoreCase('clearchat')) {
                $.log.event($.lang.get('console.received.clearchat'));
            } else if (message.indexOf('clearchat') != -1) {
                $.log.event($.lang.get('console.received.purgetimeoutban', message.substring(10)));
            }

            if (message.indexOf('now in slow mode') != -1) {
                $.log.event($.lang.get('console.received.slowmode.start', message.substring(message.indexOf('every') + 6)));
            }

            if (message.indexOf('no longer in slow mode') != -1) {
                $.log.event($.lang.get('console.received.slowmode.end'));
            }

            if (message.indexOf('now in subscribers-only') != -1) {
                $.log.event($.lang.get('console.received.subscriberonly.start'));
            }

            if (message.indexOf('no longer in subscribers-only') != -1) {
                $.log.event($.lang.get('console.received.subscriberonly.end'));
            }

            if (message.indexOf('now in r9k') != -1) {
                $.log.event($.lang.get('console.received.r9k.start'));
            }

            if (message.indexOf('no longer in r9k') != -1) {
                $.log.event($.lang.get('console.received.r9k.end'));
            }

            if (message.indexOf('hosting') != -1) {
                var target = message.substring(11, message.indexOf('.', 12)).trim();

                if (target.equalsIgnoreCase('-')) {
                    $.bot.channelIsHosting = null;
                    $.log.event($.lang.get('console.received.host.end'));
                } else {
                    $.bot.channelIsHosting = target;
                    $.log.event($.lang.get('console.received.host.start', target));
                }
            }
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            sender = event.getSender().toLowerCase(),
            username = $.username.resolve(sender),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath log - Get current logging status
         */
        if (command.equalsIgnoreCase('log')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                if (loggingEnabled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('logging.enabled'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('logging.disabled'));
                }
                return;
            }

            /**
             * @commandpath log enable - Enable logging
             */
            if (action.equalsIgnoreCase('enable')) {
                loggingEnabled = true;
                $.setIniDbBoolean('settings', 'loggingEnabled', loggingEnabled);
                $.logEvent(username + ' enabled logging');
                $.say($.whisperPrefix(sender) + $.lang.get('logging.enabled'));
            }

            /**
             * @commandpath log disable - Disable logging
             */
            if (action.equalsIgnoreCase('disable')) {
                loggingEnabled = false;
                $.setIniDbBoolean('settings', 'loggingEnabled', loggingEnabled);
                $.logEvent(username + ' disabled logging');
                $.say($.whisperPrefix(sender) + $.lang.get('logging.disabled'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/logging.js')) {
            $.consoleDebug($.lang.get('console.loggingstatus', (loggingEnabled ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
            $.registerChatCommand('./core/logging.js', 'log', 1);
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
    };
})();
