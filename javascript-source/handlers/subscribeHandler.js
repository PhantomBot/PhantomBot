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
        subReward = $.getSetIniDbNumber('subscribeHandler', 'subscribeReward', 0);

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
    $.bind('twitchSubscribe', function(event) {
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
    $.bind('twitchUnsubscribe', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/subscribeHandler.js')) {
            return;
        }

        var subscriber = event.getSubscriber();

        if ($.inidb.exists('subscribed', subscriber)) {
            $.delSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
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

    function checkForSubs(event) {
        subMessage = $.getIniDbString('subscribeHandler', 'subscribeMessage');
        if (event.getSender().equalsIgnoreCase('twitchnotify')) {
            if (subWelcomeToggle && event.getMessage().match(/just subscribed!/g)) {
                if (subMessage.match(/\(name\)/g)) {
                    subMessage = $.replace(subMessage, '(name)', String(event.getMessage().substring(0, event.getMessage().indexOf(' ', 1))));
                }

                if (subMessage.match(/\(reward\)/g)) {
                    subMessage = $.replace(subMessage, '(reward)', String(subReward));
                }

                $.say(subMessage);
                var sub = String(event.getMessage().substring(0, event.getMessage().indexOf(' ', 1)));
                $.addSubUsersList(sub);
                return;
            }

            reSubMessage = $.getIniDbString('subscribeHandler', 'reSubscribeMessage');

            if (reSubWelcomeToggle && event.getMessage().match(/subscribed for/g)) {
                if (reSubMessage.match(/\(name\)/g)) {
                    reSubMessage = $.replace(reSubMessage, '(name)', String(event.getMessage().substring(0, event.getMessage().indexOf(' ', 1))));
                }

                if (reSubMessage.match(/\(months\)/g)) {
                    reSubMessage = $.replace(reSubMessage, '(months)', String(event.getMessage().substring(event.getMessage().indexOf('months') - 3, event.getMessage().indexOf('months') - 1)));
                }

                if (reSubMessage.match(/\(reward\)/g)) {
                    reSubMessage = $.replace(reSubMessage, '(reward)', String(subReward));
                }

                $.say(reSubMessage);
                var sub = String(event.getMessage().substring(0, event.getMessage().indexOf(' ', 1)));
                $.restoreSubscriberStatus(sub, true);
            }
        }
    };

    $.checkForSubs = checkForSubs;

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
        }
    });
})();
