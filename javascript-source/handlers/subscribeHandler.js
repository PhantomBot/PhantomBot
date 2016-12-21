/**
 * subscribehandler.js
 *
 * Register new subscribers and unsubscribers in the channel
 */
(function() {
    var subMessage = $.getSetIniDbString('subscribeHandler', 'subscribeMessage', '(name) just subscribed!'),
        primeSubMessage = $.getSetIniDbString('subscribeHandler', 'primeSubscribeMessage', '(name) just subscribed with Twitch Prime!'),
        reSubMessage = $.getSetIniDbString('subscribeHandler', 'reSubscribeMessage', '(name) just subscribed for (months) months in a row!'),
        subWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle', true),
        primeSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'primeSubscriberWelcomeToggle', true),
        reSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle', true),
        subReward = $.getSetIniDbNumber('subscribeHandler', 'subscribeReward', 0),
        customEmote = $.getSetIniDbString('subscribeHandler', 'resubEmote', ''),
        announce = false,
        emotes = [],
        i;
    /**
     * @function updateSubscribeConfig
     */
    function updateSubscribeConfig() {
        subMessage = $.getIniDbString('subscribeHandler', 'subscribeMessage');
        primeSubMessage = $.getIniDbString('subscribeHandler', 'primeSubscribeMessage');
        reSubMessage = $.getIniDbString('subscribeHandler', 'reSubscribeMessage');
        subWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle');
        primeSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'primeSubscriberWelcomeToggle');
        reSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle');
        subReward = $.getIniDbNumber('subscribeHandler', 'subscribeReward');
        customEmote = $.getSetIniDbString('subscribeHandler', 'resubEmote');
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
            if (subReward > 0 && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                $.inidb.incr('points', subscriber, subReward);
            }
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

    $.bind('newSubscriber', function(event) { // From twitchnotify
        var subscriber = event.getSubscriber(),
            message = subMessage;

        if (subWelcomeToggle && announce) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', subscriber);
            }
            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(subReward));
            }
            $.say(message);
            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
        }
    });

    $.bind('newPrimeSubscriber', function(event) { // From twitchnotify
        var subscriber = event.getSubscriber(),
            message = primeSubMessage;

        if (primeSubWelcomeToggle && announce) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', subscriber);
            }
            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(subReward));
            }
            $.say(message);
            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
        }
    });

    $.bind('newReSubscriber', function(event) { // From notice event
        var resubscriber = event.getReSubscriber(),
            months = event.getMonths(),
            message = reSubMessage,
            emotes = [];

        if (reSubWelcomeToggle && announce) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(reSubMessage, '(name)', resubscriber);
            }
            if (message.match(/\(months\)/g)) {
                message = $.replace(message, '(months)', months);
            }
            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(subReward));
            }
            if (message.match(/\(customemote\)/)) {
                for (i = 0; i < months; i++, emotes.push(customEmote));
                message = $.replace(message, '(customemote)', emotes.join(' '));
            }
            $.say(message);
            $.addSubUsersList(resubscriber);
            $.restoreSubscriberStatus(resubscriber, true);
            $.inidb.set('streamInfo', 'lastReSub', resubscriber);
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
         * @commandpath subwelcometoggle - Enable or disable subscription alerts.
         */
        if (command.equalsIgnoreCase('subwelcometoggle')) {
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
         * @commandpath primesubwelcometoggle - Enable or disable Twitch Prime subscription alerts.
         */
        if (command.equalsIgnoreCase('primesubwelcometoggle')) {
            if (primeSubWelcomeToggle) {
                $.inidb.set('subscribeHandler', 'primeSubscriberWelcomeToggle', false);
                primeSubWelcomeToggle = false;
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.new.primesub.toggle.off'));
                $.log.event(sender + ' disabled prime subscriber announcements');
                return;
            } else {
                $.inidb.set('subscribeHandler', 'primeSubscriberWelcomeToggle', true);
                primeSubWelcomeToggle = true;
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.new.primesub.toggle.on'));
                $.log.event(sender + ' enabled prime subscriber announcements');
                return;
            }
        }

        /**
         * @commandpath resubwelcometoggle - Eenable or disable resubsciption alerts.
         */
        if (command.equalsIgnoreCase('resubwelcometoggle')) {
            if (reSubWelcomeToggle) {
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
         * @commandpath submessage [message] - Set a welcome message for new subscribers.
         */
        if (command.equalsIgnoreCase('submessage')) {
            if (args.length === 0) {
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
         * @commandpath primesubmessage [message] - Set a welcome message for new Twitch Prime subscribers.
         */
        if (command.equalsIgnoreCase('primesubmessage')) {
            if (args.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.primesub.msg.usage'));
                return;
            }
            $.inidb.set('subscribeHandler', 'primeSubscribeMessage', argsString);
            primeSubMessage = argsString + '';
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.primesub.msg.set'));
            $.log.event(sender + ' changed the prime subscriber message to "' + primeSubMessage + '"');
            return;
        }

        /**
         * @commandpath resubmessage [message] - Set a message for resubscribers.
         */
        if (command.equalsIgnoreCase('resubmessage')) {
            if (args.length === 0) {
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
         * @commandpath subscribereward [points] - Set an award for subscribers.
         */
        if (command.equalsIgnoreCase('subscribereward')) {
            if (args.length === 0) {
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
         * @commandpath resubemote [emote] - The (customemote) tag will be replace with that emote.  The emote will be added the amount of months the user subscribed for.
         */
        if (command.equalsIgnoreCase('resubemote')) {
            if (args.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resubemote.usage'));
                return;
            }
            $.inidb.set('subscribeHandler', 'resubEmote', args[0]);
            customEmote = args[0];
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resubemote.set'));
            $.log.event(sender + ' changed the re-subscriber emote to ' + customEmote);
            return;
        }


        /**
         * @commandpath subscribers - Enables subscription only chat mode.
         */
        if (command.equalsIgnoreCase('subscribers')) {
            $.say('.subscribers');
            $.log.event(sender + ' enabled subscriber only mode');
        }

        /**
         * @commandpath subscribersoff - Disables subscription only chat mode.
         */
        if (command.equalsIgnoreCase('subscribersoff')) {
            $.say('.subscribersoff');
            $.log.event(sender + ' disabled subscriber only mode');
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/subscribehandler.js')) {
            $.registerChatCommand('./handlers/subscribehandler.js', 'subwelcometoggle', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubemote', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'primesubwelcometoggle', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubwelcometoggle', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribereward', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'submessage', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'primesubmessage', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubmessage', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribers', 2);
            $.registerChatCommand('./handlers/subscribehandler.js', 'subscribersoff', 2);
            announce = true;
        }
    });

    $.updateSubscribeConfig = updateSubscribeConfig;
})();
