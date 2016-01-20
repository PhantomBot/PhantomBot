/**
 * logging.js
 *
 * Provide and API for logging events and errors
 * Use the $ API for log functions
 * Use the $.logging API for getting log-like date and time strings
 */
(function () {
  var loggingEnabled = $.getIniDbBoolean('settings', 'loggingEnabled', true);

  /**
   * @function getLogDateString
   * @export $.logging
   * @param {Number} [timeStamp]
   * @returns {string}
   */
  function getLogDateString(timeStamp) {
    var now = (timeStamp ? new Date(timeStamp) : new Date()),
        pad = function (i) {
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
   * @function log
   * @export $
   * @param {string} filePrefix
   * @param {string} message
   * @param {string} [sender]
   */
  function log(filePrefix, message, sender) {
    if (!$.bot.isModuleEnabled('./core/fileSystem.js') || !loggingEnabled || (sender && sender.equalsIgnoreCase($.botName)) || message.equalsIgnoreCase('.mods')) {
      return;
    }

    if (!$.isDirectory('./logs/' + filePrefix)) {
      $.mkDir('./logs/' + filePrefix);
    }

    $.writeToFile(getLogTimeString() + ' > ' + message, './logs/' + filePrefix + '/' + getLogDateString() + '.txt', true);
  };

  /**
   * @function logEvent
   * @export $
   * @param {string} sourceFile
   * @param {Number} lineNumber
   * @param {string} message
   */
  function logEvent(sourceFile, lineNumber, message) {
    if (!$.bot.isModuleEnabled('./core/fileSystem.js') || !loggingEnabled) {
      return;
    }

    if (!$.isDirectory('./logs/event')) {
      $.mkDir('./logs/event');
    }

    var now = new Date();
    $.writeToFile(now.toDateString() + ' ' + now.toTimeString() + '[' + sourceFile + '#' + lineNumber + '] ' + message,
        './logs/event/' + getLogDateString() + '.txt', true);
  };

  /**
   * @function logError
   * @export $
   * @param {string} sourceFile
   * @param {Number} lineNumber
   * @param {string} message
   */
  function logError(sourceFile, lineNumber, message) {
    if (!$.bot.isModuleEnabled('./core/fileSystem.js') || !loggingEnabled) {
      return;
    }

    if (!$.isDirectory('./logs/error')) {
      $.mkDir('./logs/error');
    }

    var now = new Date();
    $.writeToFile(now.toDateString() + ' ' + now.toTimeString() + '[' + sourceFile + '#' + lineNumber + '] ' + message,
        './logs/error/' + getLogDateString() + '.txt', true);
  };

  /**
   * @event ircChannelMessage
   */
  $.bind('ircChannelMessage', function (event) {
    $.log('chat', '' + event.getSender() + ': ' + event.getMessage());
  });

  /**
   * @event ircPrivateMessage
   */
  $.bind('ircPrivateMessage', function (event) {
    var sender = event.getSender().toLowerCase(),
        message = event.getMessage();

    if (message.toLowerCase().indexOf('moderators if this room') == -1) {
      $.log('privMsg', $.username.resolve(sender) + ': ' + message, sender);
    }
    $.consoleLn($.lang.get('console.received.irsprivmsg', sender, message));

    message = message.toLowerCase();
    if (sender.equalsIgnoreCase('jtv')) {
      if (message.equalsIgnoreCase('clearchat')) {
        $.logEvent('misc.js', 333, $.lang.get('console.received.clearchat'));
      } else if (message.indexOf('clearchat') != -1) {
        $.logEvent('misc.js', 335, $.lang.get('console.received.purgetimeoutban', message.substring(10)));
      }

      if (message.indexOf('now in slow mode') != -1) {
        $.logEvent('misc.js', 339, $.lang.get('console.received.slowmode.start', message.substring(message.indexOf('every') + 6)));
      }

      if (message.indexOf('no longer in slow mode') != -1) {
        $.logEvent('misc.js', 343, $.lang.get('console.received.slowmode.end'));
      }

      if (message.indexOf('now in subscribers-only') != -1) {
        $.logEvent('misc.js', 347, $.lang.get('console.received.subscriberonly.start'));
      }

      if (message.indexOf('no longer in subscribers-only') != -1) {
        $.logEvent('misc.js', 351, $.lang.get('console.received.subscriberonly.end'));
      }

      if (message.indexOf('now in r9k') != -1) {
        $.logEvent('misc.js', 355, $.lang.get('console.received.r9k.start'));
      }

      if (message.indexOf('no longer in r9k') != -1) {
        $.logEvent('misc.js', 359, $.lang.get('console.received.r9k.end'));
      }

      if (message.indexOf('hosting') != -1) {
        var target = message.substring(11, message.indexOf('.', 12)).trim();

        if (target.equalsIgnoreCase('-')) {
          $.bot.channelIsHosting = null;
          $.logEvent('misc.js', 366, $.lang.get('console.received.host.end'));
        } else {
          $.bot.channelIsHosting = target;
          $.logEvent('misc.js', 368, $.lang.get('console.received.host.start', target));
        }
      }
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
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
        $.logEvent('misc.js', 84, username + ' enabled logging');
        $.say($.whisperPrefix(sender) + $.lang.get('logging.enabled'));
      }

      /**
       * @commandpath log disable - Disable logging
       */
      if (action.equalsIgnoreCase('disable')) {
        loggingEnabled = false;
        $.setIniDbBoolean('settings', 'loggingEnabled', loggingEnabled);
        $.logEvent('misc.js', 91, username + ' disabled logging');
        $.say($.whisperPrefix(sender) + $.lang.get('logging.disabled'));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./core/logging.js')) {
      $.consoleLn($.lang.get('console.loggingstatus', (loggingEnabled ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
      $.registerChatCommand('./core/logging.js', 'log', 1);
    }
  });

  /** Export functions to API */
  $.logging = {
    getLogDateString: getLogDateString,
    getLogTimeString: getLogTimeString,
  };

  $.log = log;
  $.logEvent = logEvent;
  $.logError = logError;
})();