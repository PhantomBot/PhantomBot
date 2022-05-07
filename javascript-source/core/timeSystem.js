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
 * timeSystem.js
 *
 * Keep track of users in the channel and log their time in the channel
 * Exports various time formatting functions
 * Use the $ API
 */
(function () {
    var levelWithTime = $.getSetIniDbBoolean('timeSettings', 'timeLevel', false),
            timeLevelWarning = $.getSetIniDbBoolean('timeSettings', 'timeLevelWarning', true),
            keepTimeWhenOffline = $.getSetIniDbBoolean('timeSettings', 'keepTimeWhenOffline', true),
            hoursForLevelUp = $.getSetIniDbNumber('timeSettings', 'timePromoteHours', 50),
            regularsGroupId = 6,
            interval,
            inter;

    /**
     * @function updateTimeSettings
     */
    function updateTimeSettings() {
        levelWithTime = $.getIniDbBoolean('timeSettings', 'timeLevel');
        keepTimeWhenOffline = $.getIniDbBoolean('timeSettings', 'keepTimeWhenOffline');
        hoursForLevelUp = $.getIniDbNumber('timeSettings', 'timePromoteHours');
        timeLevelWarning = $.getIniDbBoolean('timeSettings', 'timeLevelWarning');
    }

    /**
     * @function getCurLocalTimeString
     * @export $
     * @param {String} timeformat
     * @returns {String}
     *
     * timeformat = java.text.SimpleDateFormat allowed formats:
     *   Letter   Date or Time Component   Presentation        Examples
     *   G        Era designator           Text                AD
     *   y        Year                     Year                1996; 96
     *   M        Month in year            Month               July; Jul; 07
     *   w        Week in year             Number              27
     *   W        Week in month            Number              2
     *   D        Day in year              Number              189
     *   d        Day in month             Number              9
     *   F        Day of week in month     Number              2
     *   E        Day in week              Text                Tuesday; Tue
     *   a        AM/PM marker             Text                PM
     *   H        Hour in day (0-23)       Number              0
     *   k        Hour in day (1-24)       Number              24
     *   K        Hour in am/pm (0-11)     Number              0
     *   h        Hour in am/pm (1-12)     Number              12
     *   m        Minute in hour           Number              30
     *   s        Second in minute         Number              55
     *   S        Millisecond              Number              978
     *   z        Time zone                General time zone   Pacific Standard Time; PST; GMT-08:00
     *   Z        Time zone                RFC 822 time zone   -0800
     *
     * Note that fixed strings must be encapsulated with quotes.  For example, the below inserts a comma
     * and paranthesis into the returned time string:
     *
     *     getCurLocalTimeString("MMMM dd', 'yyyy hh:mm:ss zzz '('Z')'");
     */
    function getCurLocalTimeString(format) {
        var dateFormat = new java.text.SimpleDateFormat(format);
        dateFormat.setTimeZone(java.util.TimeZone.getTimeZone(($.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : "GMT")));
        return dateFormat.format(new java.util.Date());
    }

    /**
     * @function getLocalTimeString
     * @export $
     * @param {String} timeformat
     * @param {Number} utc_seconds
     * @return {String}
     */
    function getLocalTimeString(format, utc_secs) {
        var dateFormat = new java.text.SimpleDateFormat(format);
        dateFormat.setTimeZone(java.util.TimeZone.getTimeZone(($.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : "GMT")));
        return dateFormat.format(new java.util.Date(utc_secs));
    }

    /**
     * @function getCurrentLocalTimeString
     * @export $
     * @param {String} timeformat
     * @param {String} timeZone
     * @return {String}
     */
    function getCurrentLocalTimeString(format, timeZone) {
        var dateFormat = new java.text.SimpleDateFormat(format);
        dateFormat.setTimeZone(java.util.TimeZone.getTimeZone(timeZone));
        return dateFormat.format(new java.util.Date());
    }

    /**
     * @function getLocalTime
     * @export $
     * @param {String} timeformat
     * @param {String} timeZone
     * @return {String}
     */
    function getLocalTime() {
        var dateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");
        dateFormat.setTimeZone(java.util.TimeZone.getTimeZone(($.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : "GMT")));
        return dateFormat.format(new java.util.Date());
    }

    /**
     * @function dateToString
     * @export $
     * @param {Date} date
     * @param {boolean} [timeOnly]
     * @returns {string}
     */
    function dateToString(date, timeOnly) {
        var year = date.getFullYear(),
                month = date.getMonth() + 1,
                day = date.getDate(),
                hours = date.getHours(),
                minutes = date.getMinutes();

        if (timeOnly) {
            return hours + ':' + minutes;
        } else {
            return day + '-' + month + '-' + year + ' @ ' + hours + ':' + minutes;
        }
    }

    /**
     * @function getTimeString
     * @export $
     * @param {Number} time
     * @param {boolean} [hoursOnly]
     * @returns {string}
     */
    function getTimeString(time, hoursOnly) {
        var floor = Math.floor,
                months = (time / 2628000);
        days = ((months % 1) * 30.42),
                hours = ((days % 1) * 24),
                minutes = ((hours % 1) * 60),
                seconds = ((minutes % 1) * 60);

        if (hoursOnly) {
            return floor(time / 3600) + $.lang.get('common.hours3');
        } else {
            var timeStringParts = [],
                    timeString = '';

            // Append months if greater than one.
            if (months >= 1) {
                timeStringParts.push(floor(months) + ' ' + (months < 2 ? $.lang.get('common.time.month') : $.lang.get('common.time.months')));
            }

            // Append days if greater than one.
            if (days >= 1) {
                timeStringParts.push(floor(days) + ' ' + (days < 2 ? $.lang.get('common.time.day') : $.lang.get('common.time.days')));
            }

            // Append hours if greater than one.
            if (hours >= 1) {
                timeStringParts.push(floor(hours) + ' ' + (hours < 2 ? $.lang.get('common.time.hour') : $.lang.get('common.time.hours')));
            }

            // Append minutes if greater than one.
            if (minutes >= 1) {
                timeStringParts.push(floor(minutes) + ' ' + (minutes < 2 ? $.lang.get('common.time.minute') : $.lang.get('common.time.minutes')));
            }

            // Append seconds if greater than one.
            if (seconds >= 1) {
                timeStringParts.push(floor(seconds) + ' ' + (seconds < 2 ? $.lang.get('common.time.second') : $.lang.get('common.time.seconds')));
            }

            // If the array is empty, return 0 seconds.
            if (timeStringParts.length === 0) {
                return ('0 ' + $.lang.get('common.time.seconds'));
            }

            // Join the array to make a string.
            timeString = timeStringParts.join(', ');

            // Replace last comma with ", and".
            if (timeString.indexOf(',') !== -1) {
                timeString = (timeString.slice(0, timeString.lastIndexOf(',')) + $.lang.get('common.time.and') + timeString.slice(timeString.lastIndexOf(',') + 2));
            }
            return timeString;
        }
    }

    /**
     * @function getCountString
     * @export $
     * @param {Number} time
     * @param {boolean} [countUp]
     * @returns {string}
     */
    function getCountString(time, countUp) {
        var floor = Math.floor,
                months = (time / 2628000);
        days = ((months % 1) * 30.42),
                hours = ((days % 1) * 24),
                minutes = ((hours % 1) * 60),
                seconds = ((minutes % 1) * 60);

        var timeStringParts = [],
                timeString = '';

        // Append months if greater than one.
        if (months >= 1) {
            timeStringParts.push(floor(months) + ' ' + (months < 2 ? $.lang.get('common.time.month') : $.lang.get('common.time.months')));
        }

        // Append days if greater than one.
        if (days >= 1) {
            timeStringParts.push(floor(days) + ' ' + (days < 2 ? $.lang.get('common.time.day') : $.lang.get('common.time.days')));
        }

        // Append hours if greater than one.
        if (hours >= 1) {
            timeStringParts.push(floor(hours) + ' ' + (hours < 2 ? $.lang.get('common.time.hour') : $.lang.get('common.time.hours')));
        }

        // Append minutes if greater than one.
        if (minutes >= 1) {
            timeStringParts.push(floor(minutes) + ' ' + (minutes < 2 ? $.lang.get('common.time.minute') : $.lang.get('common.time.minutes')));
        }

        // Append seconds if greater than one.
        if (seconds >= 1) {
            timeStringParts.push(floor(seconds) + ' ' + (seconds < 2 ? $.lang.get('common.time.second') : $.lang.get('common.time.seconds')));
        }

        // If the array is empty, return 0 seconds.
        if (timeStringParts.length === 0) {
            if (countUp) {
                return ($.lang.get('common.time.nostart'));
            } else {
                return ($.lang.get('common.time.expired'));
            }
        }

        // Join the array to make a string.
        timeString = timeStringParts.join(', ');

        // Replace last comma with ", and".
        if (timeString.indexOf(',') !== -1) {
            timeString = (timeString.slice(0, timeString.lastIndexOf(',')) + $.lang.get('common.time.and') + timeString.slice(timeString.lastIndexOf(',') + 2));
        }
        return timeString;
    }

    /**
     * @function getTimeStringMinutes
     * @export $
     * @param {Number} time
     * @param {boolean} [hoursOnly]
     * @returns {string}
     */
    function getTimeStringMinutes(time) {
        var floor = Math.floor,
                cHours = time / 3600,
                cMins = cHours % 1 * 60;

        if (cHours == 0 || cHours < 1) {
            return (floor(~~cMins) + $.lang.get('common.minutes2'));
        } else {
            return (floor(cHours) + $.lang.get('common.hours2') + floor(~~cMins) + $.lang.get('common.minutes2'));
        }
    }

    /**
     * @function getUserTime
     * @export $
     * @param {string} username
     * @returns {number}
     */
    function getUserTime(username) {
        return ($.inidb.exists('time', username.toLowerCase()) ? $.inidb.get('time', username.toLowerCase()) : 0);
    }

    /**
     * @function getUserTimeString
     * @export $
     * @param {string} username
     * @returns {string}
     */
    function getUserTimeString(username) {
        var floor = Math.floor,
                time = $.getUserTime(username.toLowerCase()),
                cHours = time / 3600,
                cMins = cHours % 1 * 60;

        if (floor(cHours) > 0) {
            return ($.lang.get('user.time.string.hours', floor(cHours), floor(~~cMins)));
        } else {
            return ($.lang.get('user.time.string.minutes', floor(~~cMins)));
        }
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
                username = $.username.resolve(sender),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0],
                subject,
                timeArg;

        /**
         * @commandpath time - Announce amount of time spent in channel
         */
        if (command.equalsIgnoreCase('time')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get("timesystem.get.self", $.resolveRank(sender), getUserTimeString(sender)));
            } else if (action && $.inidb.exists('time', action.toLowerCase())) {
                $.say($.whisperPrefix(sender) + $.lang.get("timesystem.get.other", $.username.resolve(action), getUserTimeString(action)));
            } else {
                subject = args[1];
                timeArg = parseInt(args[2]);

                /**
                 * @commandpath time add [user] [seconds] - Add seconds to a user's logged time (for correction purposes)
                 */
                if (action.equalsIgnoreCase('add')) {

                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.add.usage'));
                        return;
                    }

                    subject = $.user.sanitize(subject);

                    if (timeArg < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.add.error.negative'));
                        return;
                    }

                    if ($.user.isKnown(subject)) {
                        $.inidb.incr('time', subject, timeArg);
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.add.success', getTimeString(timeArg), $.username.resolve(subject), getUserTimeString(subject)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', $.username.resolve(subject)));
                    }
                }

                /**
                 * @commandpath time take [user] [seconds] - Take seconds from a user's logged time
                 */
                if (action.equalsIgnoreCase('take')) {
                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.usage'));
                        return;
                    }

                    subject = $.user.sanitize(subject);
                    if (!$.user.isKnown(subject)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', subject));
                    }

                    if (timeArg > $.getUserTime(subject)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.error.toomuch', subject));
                        return;
                    }

                    $.inidb.decr('time', subject, timeArg);
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.success', $.getTimeString(timeArg), $.username.resolve(subject), getUserTimeString(subject)))
                }

                if (action.equalsIgnoreCase('set')) {
                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.usage'));
                        return;
                    }

                    if (timeArg < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.error.negative'));
                        return;
                    }


                    subject = $.user.sanitize(subject);
                    if ($.user.isKnown(subject)) {
                        $.inidb.set('time', subject, timeArg);
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.success', $.username.resolve(subject), $.getUserTimeString(subject)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', subject));
                    }
                }

                /**
                 * @commandpath time promotehours [hours] - Set the amount of hours a user has to be logged to automatically become a regular
                 */
                if (action.equalsIgnoreCase('promotehours')) {
                    if (isNaN(subject)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.promotehours.usage'));
                        return;
                    }

                    if (subject < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.promotehours.error.negative', $.getGroupNameById(regularsGroupId)));
                        return;
                    }

                    hoursForLevelUp = parseInt(subject);
                    $.inidb.set('timeSettings', 'timePromoteHours', hoursForLevelUp);
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.promotehours.success', $.getGroupNameById(regularsGroupId), hoursForLevelUp));
                }

                /**
                 * @commandpath time autolevel - Auto levels a user to regular after hitting 50 hours.
                 */
                if (action.equalsIgnoreCase('autolevel')) {
                    levelWithTime = !levelWithTime;
                    $.setIniDbBoolean('timeSettings', 'timeLevel', levelWithTime);
                    $.say($.whisperPrefix(sender) + (levelWithTime ? $.lang.get('timesystem.autolevel.enabled', $.getGroupNameById(regularsGroupId), hoursForLevelUp) : $.lang.get('timesystem.autolevel.disabled', $.getGroupNameById(regularsGroupId), hoursForLevelUp)));
                }

                /**
                 * @commandpath time autolevelnotification - Toggles if a chat announcement is made when a user is promoted to a regular.
                 */
                if (action.equalsIgnoreCase('autolevelnotification')) {
                    timeLevelWarning = !timeLevelWarning;
                    $.setIniDbBoolean('timeSettings', 'timeLevelWarning', timeLevelWarning);
                    $.say($.whisperPrefix(sender) + (timeLevelWarning ? $.lang.get('timesystem.autolevel.chat.enabled') : $.lang.get('timesystem.autolevel.chat.disabled')));
                }

                /**
                 * @commandpath time offlinetime - Toggle logging a user's time when the channel is offline
                 */
                if (action.equalsIgnoreCase('offlinetime')) {
                    keepTimeWhenOffline = !keepTimeWhenOffline;
                    $.setIniDbBoolean('timeSettings', 'keepTimeWhenOffline', keepTimeWhenOffline);
                    $.say($.whisperPrefix(sender) + (keepTimeWhenOffline ? $.lang.get('timesystem.offlinetime.enabled') : $.lang.get('timesystem.offlinetime.disabled')));
                }
            }
        }

        /**
         * @commandpath streamertime - Announce the caster's local time
         */
        if (command.equalsIgnoreCase('streamertime')) {
            $.say($.whisperPrefix(sender) + $.lang.get('timesystem.streamertime', getCurLocalTimeString("MMMM dd', 'yyyy hh:mm:ss a zzz '('Z')'"), $.username.resolve($.ownerName)));
        }

        /**
         * @commandpath timezone [timezone name] - Show configured timezone or optionally set the timezone. See List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
         */
        if (command.equalsIgnoreCase('timezone')) {
            var tzData;

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.timezone.usage', ($.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : "GMT")));
                return;
            }

            tzData = java.util.TimeZone.getTimeZone(action);
            if (tzData.getID().equals("GMT") && !action.equals("GMT")) {
                $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.timezone.invalid', action));
                return;
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.timezone.success', tzData.getID(), tzData.observesDaylightTime()));
                $.inidb.set('settings', 'timezone', tzData.getID());
            }
        }
    });

    // Set an interval for increasing all current users logged time
    interval = setInterval(function () {
        var username,
                i;

        if ($.isOnline($.channelName) || keepTimeWhenOffline) {
            $.inidb.IncreaseBatchString('time', '', $.users, '60');
        }
    }, 6e4, 'scripts::systems::timeSystem.js#1');

    // Interval for auto level to regular
    inter = setInterval(function () {
        var username,
                i;

        if (levelWithTime) {
            for (i in $.users) {
                if ($.users[i] !== null) {
                    username = $.users[i].toLowerCase();
                    if (!$.isMod(username) && !$.isAdmin(username) && !$.isSub(username) && !$.isVIP(username) && $.inidb.exists('time', username) && Math.floor(parseInt($.inidb.get('time', username)) / 3600) >= hoursForLevelUp && parseInt($.getUserGroupId(username)) > regularsGroupId) {
                        if (!$.hasModList(username)) { // Added a second check here to be 100% sure the user is not a mod.
                            $.setUserGroupById(username, regularsGroupId);
                            if (timeLevelWarning) {
                                $.say($.lang.get(
                                        'timesystem.autolevel.promoted',
                                        $.username.resolve(username),
                                        $.getGroupNameById(regularsGroupId).toLowerCase(),
                                        hoursForLevelUp
                                        )); //No whisper mode needed here.
                            }
                        }
                    }
                }
            }
        }
    }, 9e5, 'scripts::systems::timeSystem.js#2');

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./core/timeSystem.js', 'streamertime');
        $.registerChatCommand('./core/timeSystem.js', 'timezone', 1);
        $.registerChatCommand('./core/timeSystem.js', 'time');

        $.registerChatSubcommand('time', 'add', 1);
        $.registerChatSubcommand('time', 'take', 1);
        $.registerChatSubcommand('time', 'set', 1);
        $.registerChatSubcommand('time', 'autolevel', 1);
        $.registerChatSubcommand('time', 'promotehours', 1);
        $.registerChatSubcommand('time', 'autolevelnotification', 1);
    });

    /** Export functions to API */
    $.dateToString = dateToString;
    $.getTimeString = getTimeString;
    $.getCountString = getCountString;
    $.getUserTime = getUserTime;
    $.getUserTimeString = getUserTimeString;
    $.getCurLocalTimeString = getCurLocalTimeString;
    $.getLocalTimeString = getLocalTimeString;
    $.getTimeStringMinutes = getTimeStringMinutes;
    $.updateTimeSettings = updateTimeSettings;
    $.getCurrentLocalTimeString = getCurrentLocalTimeString;
    $.getLocalTime = getLocalTime;
})();
