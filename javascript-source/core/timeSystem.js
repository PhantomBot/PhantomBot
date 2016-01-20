/**
 * timeSystem.js
 *
 * Keep track of users in the channel and log their time in the channel
 * Exports various time formatting functions
 * Use the $ API
 */
(function () {
  var levelWithTime = ($.inidb.exists('timeSettings', 'timeLevel') ? $.getIniDbBoolean('timeSettings', 'timeLevel') : false),
      keepTimeWhenOffline = ($.inidb.exists('timeSettings', 'keepTimeWhenOffline') ? $.getIniDbBoolean('timeSettings', 'keepTimeWhenOffline') : false),
      modTimePermToggle = ($.inidb.exists('timeSettings', 'modTimePermToggle') ? $.getIniDbBoolean('timeSettings', 'modTimePermToggle') : false),
      hoursForLevelUp = ($.inidb.exists('timeSettings', 'timePromoteHours') ? parseInt($.inidb.get('timeSettings', 'timePromoteHours')) : 50),
      timeZone = ($.inidb.exists('timeSettings', 'timeZone') ? $.inidb.get('timeSettings', 'timeZone') : 'Europe/Amsterdam'),
      regularsGroupId = 6;

  /**
   * @function validateTimeZone
   * @param {string} timeZoneCode
   * @returns {boolean}
   */
  function validateTimeZone(timeZoneCode) {
    var validTZ = java.util.TimeZone.getAvailableIDs(),
        i;

    for (i in validTZ) {
      if (validTZ[i] != null && validTZ[i].toLowerCase() == timeZoneCode.toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  /**
   * @function setTimeZone
   * @param {string} timeZoneCode
   * @returns {boolean}
   */
  function setTimeZone(timeZoneCode) {
    if (validateTimeZone(timeZoneCode)) {
      timeZone = timeZoneCode;
      $.inidb.set('timeSettings', 'timeZone');
      return true;
    }
    return false;
  };

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
      return (time > 60 ? (floor(cHours) + 'hrs ' + floor(~~cMins) + 'min ').replace(/^0hrs/, '') : floor(cMins % 1 * 60) + 'sec');
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
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        username = $.username.resolve(sender),
        command = event.getCommand(),
        args = event.getArgs(),
        action = args[0],
        subject,
        timeArg;

    /**
     * @commandpath time - Announce YOUR logged time in the channel
     */
    if (command.equalsIgnoreCase('time')) {
      if (!hasPerm(event) || !action) {
        $.say($.whisperPrefix(sender) + $.lang.get("timesystem.get.other", $.resolveRank(sender), $.getUserTimeString(sender)));
      } else {
        subject = args[1];
        timeArg = parseInt(args[2]);

        /**
         * @commandpath time add [seconds] - Add seconds to an user's logged time (for correction purposes)
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
         * @commandpath time take [seconds] - Take seconds from an user's logged time (for correction purposes)
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
      var cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone(timeZone)),
          now = cal.getTime(),
          datefmt = new java.text.SimpleDateFormat("EEEE MMMM d, yyyy @ h:mm a z");
      datefmt.setTimeZone(java.util.TimeZone.getTimeZone(timeZone));

      $.say($.whisperPrefix(sender) + $.lang.get('timesystem.streamertime', datefmt.format(now), $.username.resolve($.ownerName)));
    }
  });

  // Set an interval for increasing all current users logged time
  setInterval(function () {
    var i;
    if (!$.bot.isModuleEnabled('./core/timeSystem.js')) {
      return;
    }

    if ($.isOnline($.channelName) || keepTimeWhenOffline) {
      for (i in $.users) {
        $.inidb.incr('time', $.users[i][0].toLowerCase(), 60);
      }
    }

    if (levelWithTime) {
      for (i in $.users) {
        var username = $.users[i][0].toLowerCase();
        if (!$.isMod(username)
            && $.inidb.exists('time', username)
            && parseInt($.inidb.get('time', username)) * 60 > hoursForLevelUp
            && parseInt($.getUserGroupId(username) > regularsGroupId)) {

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
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./core/timeSystem.js')) {
      $.registerChatCommand('./core/timeSystem.js', 'time');
      $.registerChatCommand('./core/timeSystem.js', 'streamertime');
    }
  });

  /** Export functions to API */
  $.dateToString = dateToString;
  $.getTimeString = getTimeString;
  $.getUserTime = getUserTime;
  $.getUserTimeString = getUserTimeString;
})();