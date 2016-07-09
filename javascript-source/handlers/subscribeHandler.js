/**
 * subscribehandler.js
 *
 * Register new subscribers and unsubscribers in the channel
 */
(function() {
    var subMessage = $.getSetIniDbString('subscribeHandler', 'subscribeMessage', '(name) just subscribed!'),
        reSubMessage = $.getSetIniDbString('subscribeHandler', 'reSubscribeMessage', '(name) just subscribed for (months) months in a row!'),
        subWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle', true),
        reSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle', true),
        subReward = $.getSetIniDbNumber('subscribeHandler', 'subscribeReward', 0),
        announce = false;
    /**
     * @function updateSubscribeConfig
     */
    function updateSubscribeConfig() {
        subMessage = $.getIniDbString('subscribeHandler', 'subscribeMessage');
        reSubMessage = $.getIniDbString('subscribeHandler', 'reSubscribeMessage');
        subWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle');
        reSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle');
        subReward = $.getIniDbNumber('subscribeHandler', 'subscribeReward');
    }

    /**
     * @event twitchSubscribeInitialized
     */
    $.bind('twitchSubscribesInitialized', function() {
        if (!$.bot.isModuleEnabled('./handlers/subscribeHandler.js')) {
            return;
        }

        $.consoleLn('>> Enabling subscriber announcements');
        $.log.event('Subscriber announcements enabled');
    });

    /**
     * @event twitchSubscribe
     */
    $.bind('twitchSubscribe', function(event) { // from twitch api
        if (!$.bot.isModuleEnabled('./handlers/subscribeHandler.js')) {
            return;
        }

        var subscriber = event.getSubscriber();

        if (!$.inidb.exists('subscribed', subscriber)) {
            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
        } else if (subReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
            $.inidb.incr('points', subscriber, subReward);
        }
    });

    /**
     * @event twitchUnSubscribe
     */
    $.bind('twitchUnsubscribe', function(event) { // from twitch api
        if (!$.bot.isModuleEnabled('./handlers/subscribeHandler.js')) {
            return;
        }

        var subscriber = event.getSubscriber();

        if ($.inidb.exists('subscribed', subscriber)) {
            $.delSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
        }
    });

    $.bind('NewSubscriber', function(event) { // From twitchnotify
        var subscriber = event.getSub(),
            message = subMessage;

        if (subWelcomeToggle && announce) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', $.username.resolve(subscriber));
            }
            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', subReward);
            }
            $.say(message);
            $.addSubUsersList(subscriber);
            $.inidb.set('streamInfo', 'lastSub', $.username.resolve(subscriber));
        }
    });

    $.bind('NewReSubscriber', function(event) { // From notice event
        var resubscriber = event.getReSub(),
            months = event.getReSubMonths(),
            message = reSubMessage;

        if (reSubWelcomeToggle && announce) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(reSubMessage, '(name)', $.username.resolve(resubscriber));
            }
            if (message.match(/\(months\)/g)) {
                message = $.replace(message, '(months)', months);
            }
            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', subReward);
            }
            $.say(message);
            $.restoreSubscriberStatus(resubscriber, true);
            $.inidb.set('streamInfo', 'lastReSub', $.username.resolve(resubscriber));
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs();

        /* Do not show command in command list, for the panel only. */
        if (command.equalsIgnoreCase('subscribepanelupdate')) {
            updateSubscribeConfig();
        }
    
        /**
         * @commandpath subwelcometoggle - Enable or disable subscription alerts
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
                $.log.event(sender + ' disabled subscriber announcements');
                return;
            } else {
                $.inidb.set('subscribeHandler', 'subscriberWelcomeToggle', true);
                subWelcomeToggle = true;
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.new.sub.toggle.on'));
                $.log.event(sender + ' enabled subscriber announcements');
                return;
            }
        }

        /**
         * @commandpath resubwelcometoggle - Eenable or disable resubsciption alerts
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
                $.log.event(sender + ' disabled re-subscriber announcements');
                return;
            } else {
                $.inidb.set('subscribeHandler', 'reSubscriberWelcomeToggle', true);
                subWelcomeToggle = true;
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.toggle.on'));
                $.log.event(sender + ' enabled re-subscriber announcements');
                return;
            }
        }

        /**
         * @commandpath submessage [message] - Set a welcome message for new subscribers when a reward is given
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
            subMessage = argsString + '';
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.set'));
            $.log.event(sender + ' changed the subscriber message to "' + subMessage + '"');
            return;
        }

        /**
         * @commandpath resubmessage [message] - Set a message for resubscribers when a reward is given
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
            reSubMessage = argsString + '';
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.set'));
            $.log.event(sender + ' changed the re-subscriber message to "' + reSubMessage + '"');
            return;
        }

        /**
         * @commandpath subscribereward [points] - Set an award for subscribers
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
            $.log.event(sender + ' changed the subscriber reward to ' + subReward);
            return;
        }

        /**
         * @commandpath subscribercount - Provide the number of subscribers
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
         * @commandpath subscribers - Enables subscription only chat mode
         */
        if (command.equalsIgnoreCase('subscribers')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }
            $.say('.subscribers');
            $.log.event(sender + ' enabled subscriber only mode');
        }

        /**
         * @commandpath subscribersoff - Disables subscription only chat mode
         */
        if (command.equalsIgnoreCase('subscribersoff')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }
            $.say('.subscribersoff');
            $.log.event(sender + ' disabled subscriber only mode');
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/subscribehandler.js')) {
            $.registerChatCommand('./handlers/subscribehandler.js', 'subwelcometoggle', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubwelcometoggle', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribereward', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribercount', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'submessage', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubmessage', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribers', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribersoff', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribepanelupdate', 1);
            announce = true;
        }
    });
})();
