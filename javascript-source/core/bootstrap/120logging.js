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
 * Provide and API for logging events and errors
 * Use the $ API for log functions
 * Use the $.logging API for getting log-like date and time strings
 */
(function () {
    let logs = {
        file: $.getSetIniDbBoolean('settings', 'log.file', true),
        event: $.getSetIniDbBoolean('settings', 'log.event', true),
        error: $.getSetIniDbBoolean('settings', 'log.error', true)
    };

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
        return Packages.com.illusionaryone.Logger.instance().logFileTimestamp();
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
        return Packages.com.illusionaryone.Logger.instance().logTimestamp();
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
     */
    function logfile(filePrefix, message) {
        if (logs.file === false) {
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
})();