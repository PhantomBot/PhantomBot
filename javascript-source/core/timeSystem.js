/**
 * timeSystem.js
 *
 * Keep track of users in the channel and log their time in the channel
 * Exports various time formatting functions
 * Use the $ API
 */
(function() {
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
    function updateTimeSettings () {
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
            cHours = time / 3600,
            cMins = cHours % 1 * 60;

        if (hoursOnly) {
            return floor(cHours) + $.lang.get('common.hours3');
        } else {
            if (floor(cHours) > 0) {
                return ((floor(cHours) + $.lang.get('common.hours') + floor(~~cMins) + $.lang.get('common.minutes') + floor(cMins % 1 * 60) + $.lang.get('common.seconds')));
            } else {
                return (floor(~~cMins) + $.lang.get('common.minutes') + floor(cMins % 1 * 60) + $.lang.get('common.seconds'));
            }
        }
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
    $.bind('command', function(event) {
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

                    subject = subject.toLowerCase();

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

                    subject = subject.toLowerCase();
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


                    subject = subject.toLowerCase();
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
                if (command.equalsIgnoreCase('autolevelnotification')) {
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
    interval = setInterval(function() {
        var username, 
            i;

        if ($.isOnline($.channelName) || keepTimeWhenOffline) {
            $.inidb.setAutoCommit(false);
            for (i in $.users) {
                username = $.users[i][0].toLowerCase();
                $.inidb.incr('time', username, 61);
            }
            $.inidb.setAutoCommit(true);
        }
    }, 6e4);

    // Interval for auto level to regular
    inter = setInterval(function() {
        var username, 
            i;
            
        if (levelWithTime) {
            for (i in $.users) {
                username = $.users[i][0].toLowerCase();
                if (!$.isMod(username) && !$.isAdmin(username) && !$.isSub(username) && $.inidb.exists('time', username) && Math.floor(parseInt($.inidb.get('time', username)) / 3600) >= hoursForLevelUp &&  parseInt($.getUserGroupId(username)) > regularsGroupId) {
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
    }, 9e5);

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/timeSystem.js')) {
            $.registerChatCommand('./core/timeSystem.js', 'streamertime');
            $.registerChatCommand('./core/timeSystem.js', 'timezone', 1);
            $.registerChatCommand('./core/timeSystem.js', 'time');
            $.registerChatSubcommand('time', 'add', 1);
            $.registerChatSubcommand('time', 'take', 1);
            $.registerChatSubcommand('time', 'set', 1);
            $.registerChatSubcommand('time', 'autolevel', 1);
            $.registerChatSubcommand('time', 'promotehours', 1);
            $.registerChatSubcommand('time', 'autolevelnotification', 1);
        }
    });

    /** Export functions to API */
    $.dateToString = dateToString;
    $.getTimeString = getTimeString;
    $.getUserTime = getUserTime;
    $.getUserTimeString = getUserTimeString;
    $.getCurLocalTimeString = getCurLocalTimeString;
    $.getLocalTimeString = getLocalTimeString;
    $.getTimeStringMinutes = getTimeStringMinutes;
    $.updateTimeSettings = updateTimeSettings;
    $.getCurrentLocalTimeString = getCurrentLocalTimeString;
})();
