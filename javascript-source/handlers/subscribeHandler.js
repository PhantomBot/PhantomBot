/**
 * subscribehandler.js
 *
 * Register new subscribers and unsubscribers in the channel
 */
(function() {
    var subMessage = ($.inidb.exists('subscribeHandler', 'subscribeMessage') ? $.inidb.get('subscribeHandler', 'subscribeMessage') : '(name) just subscribed!'),
        reSubMessage = ($.inidb.exists('subscribeHandler', 'reSubscribeMessage') ? $.inidb.get('subscribeHandler', 'reSubscribeMessage') : '(name) just subscribed for (months) months in a row!'),
        subMessageNoReward = ($.inidb.exists('subscribeHandler', 'subscribeMessageNoReward') ? $.inidb.get('subscribeHandler', 'subscribeMessageNoReward') : '(name) just subscribed!'),
        reSubMessageNoReward = ($.inidb.exists('subscribeHandler', 'reSubscribeMessageNoReward') ? $.inidb.get('subscribeHandler', 'reSubscribeMessageNoReward') : '(name) just subscribed for (months) months in a row!'),
        subWelcomeToggle = ($.inidb.exists('subscribeHandler', 'subscriberWelcomeToggle') ? $.getIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle') : true),
        reSubWelcomeToggle = ($.inidb.exists('subscribeHandler', 'reSubscriberWelcomeToggle') ? $.getIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle') : true),
        subReward = (parseInt($.inidb.exists('subscribeHandler', 'subscribeReward')) ? parseInt($.inidb.get('subscribeHandler', 'subscribeReward')) : 0);

    /**
     * @event twitchSubscribeInitialized
     */
    $.bind('twitchSubscribesInitialized', function() {
        if (!$.bot.isModuleEnabled('./handlers/subscribeHandler.js')) {
            return;
        }

        $.consoleLn('>> Enabling subscriber announcements');
        $.logEvent('subscribehandler.js', 24, 'Subscriber announcements enabled');
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
                $.logEvent('subscribehandler.js', 83, sender + ' disabled subscriber announcements');
                return;
            } else {
                $.inidb.set('subscribeHandler', 'subscriberWelcomeToggle', true);
                subWelcomeToggle = true;
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.new.sub.toggle.on'));
                $.logEvent('subscribehandler.js', 89, sender + ' enabled subscriber announcements');
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
                $.logEvent('subscribehandler.js', 106, sender + ' disabled re-subscriber announcements');
                return;
            } else {
                $.inidb.set('subscribeHandler', 'reSubscriberWelcomeToggle', true);
                subWelcomeToggle = true;
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.toggle.on'));
                $.logEvent('subscribehandler.js', 112, sender + ' enabled re-subscriber announcements');
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
            $.logEvent('subscribehandler.js', 131, sender + ' changed the subscriber message to "' + subMessage + '"');
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
            $.logEvent('subscribehandler.js', 149, sender + ' changed the re-subscriber message to "' + reSubMessage + '"');
            return;
        }

        /**
         * @commandpath submessagenoreward [message] - Set a welcome message for new subscribers when no reward is given
         */
        if (command.equalsIgnoreCase('submessagenoreward')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            } else if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.usage'));
                return;
            }
            $.inidb.set('subscribeHandler', 'subscribeMessageNoReward', argsString);
            subMessageNoReward = argsString + '';
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.set'));
            $.logEvent('subscribehandler.js', 167, sender + ' changed the subscriber (no reward) message to "' + subMessageNoReward + '"');
            return;
        }

        /**
         * @commandpath resubmessagenoreward [message] - Set a message for resubscribers when no reward is given
         */
        if (command.equalsIgnoreCase('resubmessagenoreward')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            } else if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.noreward.usage'));
                return;
            }
            $.inidb.set('subscribeHandler', 'reSubscribeMessageNoReward', argsString);
            reSubMessageNoReward = argsString + '';
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.noreward.set'));
            $.logEvent('subscribehandler.js', 185, sender + ' changed the re-subscriber (no reward) message to "' + reSubMessageNoReward + '"');
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
            $.logEvent('subscribehandler.js', 204, sender + ' changed the subscriber reward to ' + subReward);
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
            $.logEvent('subscribehandler.js', 236, sender + ' enabled subscriber only mode');
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
            $.logEvent('subscribehandler.js', 236, sender + ' disabled subscriber only mode');
        }
    });

    /**
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function(event) {
        var sender = event.getSender(),
            message = event.getMessage(),
            s,
            r,
            sub = message.substring(0, message.indexOf(' ', 1)).toString();

        s = (subReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js') ? subMessage : subMessageNoReward) + '';
        r = (subReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js') ? reSubMessage : reSubMessageNoReward) + '';

        if (sender.equalsIgnoreCase('twitchnotify')) {
            if (message.contains('just subscribed!') && subWelcomeToggle) {
                s = s.replace(/\(name\)/ig, sub);
                if (subReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                    s = s.replace(/\(reward\)/ig, subReward.toString());
                }
                $.say(s);

                $.addSubUsersList(sub);
                $.restoreSubscriberStatus(sub, true);

                return;
            }

            if (message.contains('months in a row!') && message.contains('subscribed for') && reSubWelcomeToggle) {
                var months = message.substring(message.indexOf('months') - 3, message.indexOf('months') - 1).toString();
                r = r.replace(/\(name\)/ig, sub);
                r = r.replace(/\(months\)/ig, months);
                if (subReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                    r = r.replace(/\(reward\)/ig, subReward.toString());
                }
                $.say(r);
            }
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
            $.registerChatCommand('./handlers/subscribehandler.js', 'submessagenoreward', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubmessage', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubmessagenoreward', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribers', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribersoff', 2);
        }
    });
})();
