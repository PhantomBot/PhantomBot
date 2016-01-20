/**
 * greetingSystem.js
 *
 * Enable users to set a greeting.
 * As soon as the bot notices their arrival it will post the greeting in the chat.
 * The channel owner can also set a default greeting. (beware the lurker callouts)
 *
 * Tags in greetings:
 * - (name) The username corresponding to the target user
 */
(function () {
  var autoGreetEnabled = ($.inidb.exists('greeting', 'autoGreetEnabled') ? $.getIniDbBoolean('greeting', 'autoGreetEnabled') : false),
      defaultJoinMessage = ($.inidb.exists('greeting', 'defaultJoin') ? $.inidb.get('greeting', 'defaultJoin') : ''),
      greetingCooldown = 21600000;

  /**
   * @event ircChannelJoin
   */
  $.bind('ircChannelJoin', function (event) {
    if ($.isOnline($.channelName)) {
      var sender = event.getUser().toLowerCase(),
          username = $.resolveRank(sender),
          message = ($.inidb.exists('greeting', sender) ? $.inidb.get('greeting', sender) : ''),
          lastUserGreeting = ($.inidb.exists('greetingCoolDown', sender) ? parseInt($.inidb.get('greetingCoolDown', sender)) : 0),
          now = $.systemTime();

      if (message && (lastUserGreeting + greetingCooldown < now)) {
        $.say(message);
        $.inidb.set('greetingCoolDown', sender, now);
      } else if (autoGreetEnabled) {
        $.say(defaultJoinMessage.replace('(name)', username));
      }
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        action = args[0],
        message;

    if (command.equalsIgnoreCase('greeting')) {
      if (!action) {
        if ($.isAdmin(sender)) {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.admin'));
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
        }
        return;
      }

      /**
       * @commandpath greeting toggledefault - Enable/disable the default greeting
       */
      if (action.equalsIgnoreCase('toggledefault')) {
        if (!$.isModv3(sender, event.getTags())) {
          $.say($.whisperPrefix(sender) + $.modMsg);
          return;
        }

        autoGreetEnabled = !autoGreetEnabled;
        $.setIniDbBoolean('greeting', 'autoGreetEnabled', autoGreetEnabled);
        if (autoGreetEnabled) {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.enabled', $.username.resolve($.botName)));
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.disabled', $.username.resolve($.botName)));
        }
      }

      /**
       * @commandpath greeting setdefault [message] - Set the default greeting
       */
      if (action.equalsIgnoreCase('setdefault')) {
        message = args.splice(1, args.length - 1).join(' ');
        if (!$.isModv3(sender, event.getTags())) {
          $.say($.whisperPrefix(sender) + $.modMsg);
          return;
        }

        if (!message) {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.usage'));
          return;
        }

        if (message.indexOf('(name)') < 0) {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.noname'));
          return;
        }

        $.inidb.set('greeting', 'defaultJoin', message);
        $.say($.whisperPrefix(sender) + $.lang.get(
                'greetingsystem.set.autogreet.success',
                message,
                (autoGreetEnabled ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))
            ));
      }

      /**
       * @commandpath greeting enable [message] - Set YOUR personal greeting (Regardless of default greeting being enabled)
       */
      if (action.equalsIgnoreCase('enable')) {
        message = args.splice(1, args.length - 1).join(' ');

        if (!message) {
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
          return;
        }

        $.inidb.set('greeting', sender, message);
        $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.personal.success', message));
      }

      /**
       * @commandpath greeting disable - Delete YOUR personal greeting
       */
      if (action.equalsIgnoreCase('disable')) {
        if ($.inidb.exists('greeting', sender)) {
          $.inidb.del('greeting', sender);
          $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.remove.personal.success'));
        }
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/greetingSystem.js')) {
      $.registerChatCommand('./systems/greetingSystem.js', 'greeting', 6);
    }
  });
})();