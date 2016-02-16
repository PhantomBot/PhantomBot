(function () {
  var whisperMode = ($.inidb.exists('settings', 'whisperMode') ? $.getIniDbBoolean('settings', 'whisperMode') : true);

  /**
   * @function whisperPrefix
   * @export $
   * @param {string} username
   * @param {boolean} [force]
   * @returns {string}
   */
  function whisperPrefix(username, force) {
    if (whisperMode || force) {
      if (username == $.botName) {
      return '/w ' + $.ownerName + ' ';
      } else {
      return '/w ' + username + ' ';
      }

    }
    return '@' + $.username.resolve(username) + ', ';
  };

  /**
   * @function getBotWhisperMode
   * @export $
   * @returns {boolean}
   */
  function getBotWhisperMode() {
    return whisperMode;
  }

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand();

    /**
     * @commandpath togglewhispermode - Toggle whisper mode
     */
    if (command.equalsIgnoreCase('togglewhispermode')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender, true) + $.lang.get('cmd.adminonly'));
        return;
      }

      if (whisperMode) {
        $.inidb.set('settings', 'whisperMode', 'false');
        whisperMode = false;
        $.say($.whisperPrefix(sender) + $.lang.get('whisper.whispers.disabled'));
      } else {
        $.inidb.set('settings', 'whisperMode', 'true');
        whisperMode = true;
        $.say($.whisperPrefix(sender) + $.lang.get('whisper.whispers.enabled'));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    $.registerChatCommand('./core/whisper.js', 'togglewhispermode', 1);
  });

  /** Export functions to API */
  $.whisperPrefix = whisperPrefix;
  $.getBotWhisperMode = getBotWhisperMode;
})();
