/**
 * timeSystem.js
 *
 * Keep track of users in the channel and log their time in the channel
 * Exports various time formatting functions
 * Use the $ API
 */
(function() {
    var levelWithTime = ($.inidb.exists('timeSettings', 'timeLevel') ? $.getIniDbBoolean('timeSettings', 'timeLevel') : false),
        keepTimeWhenOffline = ($.inidb.exists('timeSettings', 'keepTimeWhenOffline') ? $.getIniDbBoolean('timeSettings', 'keepTimeWhenOffline') : false),
        modTimePermToggle = ($.inidb.exists('timeSettings', 'modTimePermToggle') ? $.getIniDbBoolean('timeSettings', 'modTimePermToggle') : false),
        hoursForLevelUp = ($.inidb.exists('timeSettings', 'timePromoteHours') ? parseInt($.inidb.get('timeSettings', 'timePromoteHours')) : 50),
        regularsGroupId = 6;

    /**
     * @function hasPerm
     * @param {Object} event
     * @returns {boolean}
     */
    function hasPerm(event) {
        if (modTimePermToggle) {
            if (!$.isModv3(event.getSender().toLowerCase(), event.getTags())) {
                return false;
            }
        } else if (!$.isAdmin(event.getSender().toLowerCase())) {
            return false;
        }
        return true;
    };

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
            return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
        }
    };

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
            return floor(cHours) + 'hrs ';
        } else {
            return (time >= 60 ? (floor(cHours) + 'hrs ' + floor(~~cMins) + 'min ').replace(/^0hrs/, '') : floor(cMins % 1 * 60) + 'sec');
        }
    };

    /**
     * @function getUserTime
     * @export $
     * @param {string} username
     * @returns {number}
     */
    function getUserTime(username) {
        return ($.inidb.exists('time', username) ? $.inidb.get('time', username) : 0);
    };

    /**
     * @function getUserTimeString
     * @export $
     * @param {string} username
     * @returns {string}
     */
    function getUserTimeString(username) {
        return $.getTimeString($.getUserTime(username));
    };

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
            if (!hasPerm(event) || !action) {
                $.say($.whisperPrefix(sender) + $.lang.get("timesystem.get.other", $.resolveRank(sender), $.getUserTimeString(sender)));
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
                        $.say($.whisperPrefix(sender) + $.lang.get("timesystem.add.success",
                            $.getTimeString(timeArg), $.username.resolve(subject), $.getUserTimeString(subject)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', $.username.resolve(subject)));
                    }
                }

                /**
                 * @commandpath time take [user] [seconds] - Take seconds from a user's logged time (for correction purposes)
                 */
                if (action.equalsIgnoreCase('take')) {
                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get("timesystem.take.usage"));
                        return;
                    }

                    if ($.user.isKnown(sender)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', username));
                    }

                    if (timeArg > $.getUserTime(sender)) {
                        $.say($.whisperPrefix(sender) + $.lang.get("timesystem.take.error.toomuch", username));
                        return;
                    }

                    $.inidb.decr('time', subject, timeArg);
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.success',
                        $.getTimeString(timeArg), $.username.resolve(subject), $.getUserTimeString(sender)))
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


                    if ($.user.isKnown(subject.toLowerCase())) {
                        $.inidb.set('time', subject, timeArg);
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.success',
                            $.username.resolve(subject), $.getUserTimeString(subject.toLowerCase())));
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
                        $.say($.whisperPrefix(sender) + $.lang.get("timesystem.set.promotehours.error.negative", $.getGroupNameById(regularsGroupId).toLowerCase()));
                        return;
                    }

                    $.inidb.set('settings', 'timePromoteHours', args[1]);
                    hoursForLevelUp = parseInt($.inidb.get('settings', 'timePromoteHours'));

                    $.say($.whisperPrefix(sender) + $.lang.get("timesystem.set.promotehours.success",
                        $.getGroupNameById(regularsGroupId).toLowerCase(), hoursForLevelUp));
                }

                if (action.equalsIgnoreCase('autolevel')) {
                    levelWithTime = !levelWithTime;
                    $.setIniDbBoolean('timeSettings', 'timeLevel', levelWithTime);

                    if (levelWithTime) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.autolevel.enabled',
                            $.getGroupNameById(regularsGroupId).toLowerCase(), hoursForLevelUp));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.autolevel.disabled',
                            $.getGroupNameById(regularsGroupId).toLowerCase(), hoursForLevelUp));
                    }
                }


                /**
                 * @commandpath time offlinetime - Toggle logging a user's time when the channel is offline
                 */
                if (action.equalsIgnoreCase('offline') || action.equalsIgnoreCase('offlinetime')) {
                    keepTimeWhenOffline = !keepTimeWhenOffline;
                    $.setIniDbBoolean('timeSettings', 'keepTimeWhenOffline', keepTimeWhenOffline);

                    if (keepTimeWhenOffline) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.offlinetime.enabled'));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.offlinetime.disabled'));
                    }
                }

                /**
                 * @commandpath time modpermtoggle - Toggle permissions for changing user's logged time between admin/mod
                 */
                if (action.equalsIgnoreCase('modpermtoggle')) {
                    modTimePermToggle = !modTimePermToggle;
                    $.setIniDbBoolean('timeSettings', 'modTimePermToggle', modTimePermToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.modpermtoggle.success', (modTimePermToggle ? 'Moderator' : 'Administrator')));
                }

                if (action.equalsIgnoreCase('help')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.help'))
                }
            }
        }

        /**
         * @commandpath streamertime - Announce the caster's local time
         */
        if (command.equalsIgnoreCase('streamertime')) {
            $.say($.whisperPrefix(sender) + $.lang.get(
                'timesystem.streamertime',
                getCurLocalTimeString("MMMM dd', 'yyyy hh:mm:ss zzz '('Z')'"),
                $.username.resolve($.ownerName)
            ));
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
    setInterval(function() {
        var i;
        if (!$.bot.isModuleEnabled('./core/timeSystem.js')) {
            return;
        }

        if ($.isOnline($.channelName) || keepTimeWhenOffline) {
            for (i in $.users) {
                $.inidb.incr('time', $.users[i][0].toLowerCase(), 61);
            }
        }

        if (levelWithTime) {
            for (i in $.users) {
                var username = $.users[i][0].toLowerCase();
                if (!$.isMod(username) && !$.isAdmin(username) && $.inidb.exists('time', username) && Math.floor(parseInt($.inidb.get('time', username)) / 3600) >= hoursForLevelUp && parseInt($.getUserGroupId(username)) > regularsGroupId) {

                    $.setUserGroupById(username, regularsGroupId);

                    $.say($.whisperPrefix(username) + $.lang.get(
                        'timesystem.autolevel.promoted',
                        $.username.resolve(username),
                        $.getGroupNameById(regularsGroupId).toLowerCase(),
                        hoursForLevelUp
                    ));
                }
            }
        }
    }, 6e4);

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/timeSystem.js')) {
            $.registerChatCommand('./core/timeSystem.js', 'time');
            $.registerChatCommand('./core/timeSystem.js', 'streamertime');
            $.registerChatCommand('./core/timeSystem.js', 'timezone', 1);
        }
    });

    /** Export functions to API */
    $.dateToString = dateToString;
    $.getTimeString = getTimeString;
    $.getUserTime = getUserTime;
    $.getUserTimeString = getUserTimeString;
    $.getCurLocalTimeString = getCurLocalTimeString;
    $.getLocalTimeString = getLocalTimeString;
})();