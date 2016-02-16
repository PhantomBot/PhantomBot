/**
 * subscribehandler.js
 *
 * Register new subscribers and unsubscribers in the channel
 */
(function () {
  var subMessage = ($.inidb.exists('subscribeHandler', 'subscribeMessage') ? $.inidb.get('subscribeHandler', 'subscribeMessage') : '(name) just subscribed!'),
      reSubMessage = ($.inidb.exists('subscribeHandler', 'reSubscribeMessage') ? $.inidb.get('subscribeHandler', 'reSubscribeMessage') : '(name) just subscribed for (months) months in a row!'),
      subWelcomeToggle = ($.inidb.exists('subscribeHandler', 'subscriberWelcomeToggle') ? $.getIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle') : true),
      reSubWelcomeToggle = ($.inidb.exists('subscribeHandler', 'reSubscriberWelcomeToggle') ? $.getIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle') : true),
      subReward = (parseInt($.inidb.exists('subscribeHandler', 'subscribeReward')) ? parseInt($.inidb.get('subscribeHandler', 'subscribeReward')) : 0);

  /**
   * @event twitchSubscribeInitialized
   */
  $.bind('twitchSubscribesInitialized', function () {
    if (!$.bot.isModuleEnabled('./handlers/subsribeHandler.js')) {
      return;
    }

    $.consoleLn('>> Enabling subscriber announcements');
  });

  /**
   * @event twitchSubscribe
   */
  $.bind('twitchSubscribe', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/subsribeHandler.js')) {
      return;
    }

    var subscriber = event.getSubscriber();

    if (!$.inidb.exists('subscribed', subscriber)) {
      $.inidb.set('subscribed', subscriber, 'true');
    } else if (subReward > 0 && $.bot.isModuleEnabled('./core/pointSystem.js')) {
      $.inidb.incr('points', subscriber, subReward);
    }
  });

  /**
   * @event twitchUnSubscribe
   */
  $.bind('twitchUnsubscribe', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/subsribeHandler.js')) {
      return;
    }

    var subscriber = event.getSubscriber();

    if ($.inidb.exists('subscribed', subscriber)) {
      $.inidb.del('subscribed', subscriber);
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender(),
        command = event.getCommand(),
        argsString = event.getArguments().trim(),
        args = event.getArgs();

    /**
     * @commandpath subwelcometoggle - enable or disable sub alerts
     */
    if (command.equalsIgnoreCase('subwelcometoggle')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (subWelcomeToggle) {
        $.inidb.set('subscribeHandler', 'subscriberWelcomeToggle', false);
        subWelcomeToggle = false;
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.new.sub.toggle.off'));
        return;
      } else {
        $.inidb.set('subscribeHandler', 'subscriberWelcomeToggle', true);
        subWelcomeToggle = true;
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.new.sub.toggle.on'));
        return;
      }
    }

    /**
     * @commandpath resubwelcometoggle - enable or disable resub alerts
     */
    if (command.equalsIgnoreCase('resubwelcometoggle')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }
      if (subWelcomeToggle) {
        $.inidb.set('subscribeHandler', 'reSubscriberWelcomeToggle', false);
        subWelcomeToggle = false;
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.toggle.off'));
        return;
      } else {
        $.inidb.set('subscribeHandler', 'reSubscriberWelcomeToggle', true);
        subWelcomeToggle = true;
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.toggle.on'));
        return;
      }
    }

    /**
     * @commandpath submessae [message] - set a sub welcome message
     */
    if (command.equalsIgnoreCase('submessage')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      } else if (args.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.usage'));
        return;
      }
      $.inidb.set('subscribeHandler', 'subscribeMessage', argsString);
      subMessage = argsString;
      $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.set'));
      return;
    }

    /**
     * @commandpath resubmessage - set a resub message
     */
    if (command.equalsIgnoreCase('resubmessage')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      } else if (args.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.usage'));
        return;
      }
      $.inidb.set('subscribeHandler', 'reSubscribeMessage', argsString);
      reSubMessage = argsString;
      $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.set'));
      return;
    }

    /**
     * @commandpath subscribereward - set a sub reward
     */
    if (command.equalsIgnoreCase('subscribereward')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      } else if (args.length == 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.reward.usage'));
        return;
      }
      $.inidb.set('subscribeHandler', 'subscribeReward', parseInt(args[0]));
      subReward = parseInt(args[0]);
      $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.reward.set'));
      return;
    }

    /**
     * @commandpath subscribercount - see how many subs there are
     */
    if (command.equalsIgnoreCase('subscribercount')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      var keys = $.inidb.GetKeyList('subscribed', ''),
          subs = 0,
          i;

      for (i = 0; i < keys.length; i++) {
        subs++;
      }
      $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.count', subs));
    }
    
    /**
     * @commandpath subscribers - puts chat in sub mode
     */
    if (command.equalsIgnoreCase('subscribers')) {
        if (!$.isModv3(sender, event.getTags())) {
            $.say($.whisperPrefix(sender) + $.modMsg);
            return;
        }
        $.say('.subscribers');
    }
    
    /**
     * @commandpath subscribersoff - removes chat from sub mode
     */
    if (command.equalsIgnoreCase('subscribersoff')) {
        if (!$.isModv3(sender, event.getTags())) {
            $.say($.whisperPrefix(sender) + $.modMsg);
            return;
        }
        $.say('.subscribersoff');
    }
  });

  /**
   * @event ircPrivateMessage
   */
  $.bind('ircPrivateMessage', function (event) {
    var sender = event.getSender(),
        message = event.getMessage(),
        s = subMessage,
        r = reSubMessage,
        sub = message.substring(0, message.indexOf(' ', 1)).toString();

    if (sender.equalsIgnoreCase('twitchnotify')) {
      if (message.contains('just subscribed!') && subWelcomeToggle) {
        s = s.replace(/\(name\)/ig, sub);
        s = s.replace('/\(reward\)/ig', subReward);
        $.say(s);
        return;
      }

      if (message.contains('months in a row!') && message.contains('subscribed for') && reSubWelcomeToggle) {
        var months = message.substring(message.indexOf('months') - 3, message.indexOf('months') - 1).toString();
        r = r.replace('/\(name\)/ig', sub);
        r = r.replace('/\(months\)/ig', months);
        r = r.replace('/\(reward\)/ig', subReward);
        $.say(r);
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./handlers/subscribehandler.js')) {
      $.registerChatCommand('./handlers/subscribehandler.js', 'subwelcometoggle', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'resubwelcometoggle', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'subscribereward', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'subscribercount', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'submessage', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'resubmessage', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'subscribers', 2);
      $.registerChatCommand('./handlers/subscribehandler.js', 'subscribersoff', 2);
    }
  });
})();
