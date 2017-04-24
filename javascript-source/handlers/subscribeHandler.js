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
        reSubReward = $.getSetIniDbNumber('subscribeHandler', 'reSubscribeReward', 0),
        customEmote = $.getSetIniDbString('subscribeHandler', 'resubEmote', ''),
        announce = false,
        emotes = [],
        i;

    /*
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
        reSubReward = $.getIniDbNumber('subscribeHandler', 'reSubscribeReward');
        customEmote = $.getSetIniDbString('subscribeHandler', 'resubEmote');
    }

    /*
     * @event newSubscriber
     */
    $.bind('newSubscriber', function(event) {
        var subscriber = event.getSubscriber(),
            message = subMessage;

        if (subWelcomeToggle === true && announce === true) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', subscriber);
            }

            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(subReward));
            }

            if (message.match(/\(plan\)/g)) {
                message = $.replace(message, '(plan)', event.getPlan());
            }
            $.say(message);
            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
            if (subReward > 0) {
                $.inidb.incr('points', subscriber, subReward);
            }
        }
    });

    /*
     * @event newPrimeSubscriber
     */
    $.bind('newPrimeSubscriber', function(event) {
        var subscriber = event.getSubscriber(),
            message = primeSubMessage;

        if (primeSubWelcomeToggle === true && announce === true) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', subscriber);
            }
            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(subReward));
            }
            $.say(message);
            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber, true);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
            if (subReward > 0) {
                $.inidb.incr('points', subscriber, subReward);
            }
        }
    });

    /*
     * @event newReSubscriber
     */
    $.bind('newReSubscriber', function(event) {
        var resubscriber = event.getReSubscriber(),
            months = event.getMonths(),
            message = reSubMessage,
            emotes = [];

        if (reSubWelcomeToggle === true && announce === true) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(reSubMessage, '(name)', resubscriber);
            }

            if (message.match(/\(months\)/g)) {
                message = $.replace(message, '(months)', months);
            }

            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(reSubReward));
            }

            if (message.match(/\(customemote\)/)) {
                for (i = 0; i < months; i++, emotes.push(customEmote));
                message = $.replace(message, '(customemote)', emotes.join(' '));
            }
            $.say(message);
            $.addSubUsersList(resubscriber);
            $.restoreSubscriberStatus(resubscriber, true);
            $.writeToFile(resubscriber + ' ', './addons/subscribeHandler/latestResub.txt', false);
            $.writeToFile(resubscriber + ': ' + months + ' ', './addons/subscribeHandler/latestResub&Months.txt', false);
            $.inidb.set('streamInfo', 'lastReSub', resubscriber);
            if (reSubReward > 0) {
                $.inidb.incr('points', resubscriber, reSubReward);
            }
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments(),
            args = event.getArgs(),
            action = args[0];
    
        /*
         * @commandpath subwelcometoggle - Enable or disable subscription alerts.
         */
        if (command.equalsIgnoreCase('subwelcometoggle')) {
            subWelcomeToggle = !subWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle', subWelcomeToggle);
            $.say($.whisperPrefix(sender) + (subWelcomeToggle ? $.lang.get('subscribehandler.new.sub.toggle.on') : $.lang.get('subscribehandler.new.sub.toggle.off')));
        }

        /*
         * @commandpath primesubwelcometoggle - Enable or disable Twitch Prime subscription alerts.
         */
        if (command.equalsIgnoreCase('primesubwelcometoggle')) {
            primeSubWelcomeToggle = !primeSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'primeSubscriberWelcomeToggle', primeSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (primeSubWelcomeToggle ? $.lang.get('subscribehandler.new.primesub.toggle.on') : $.lang.get('subscribehandler.new.primesub.toggle.off')));
        }

        /*
         * @commandpath resubwelcometoggle - Enable or disable resubsciption alerts.
         */
        if (command.equalsIgnoreCase('resubwelcometoggle')) {
            reSubWelcomeToggle = !reSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle', reSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (reSubWelcomeToggle ? $.lang.get('subscribehandler.resub.toggle.on') : $.lang.get('subscribehandler.resub.toggle.off')))
        }

        /*
         * @commandpath submessage [message] - Set a welcome message for new subscribers.
         */
        if (command.equalsIgnoreCase('submessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.usage'));
                return;
            }

            subMessage = argsString;
            $.setIniDbString('subscribeHandler', 'subscribeMessage', subMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.set'));
        }

        /*
         * @commandpath primesubmessage [message] - Set a welcome message for new Twitch Prime subscribers.
         */
        if (command.equalsIgnoreCase('primesubmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.primesub.msg.usage'));
                return;
            }

            primeSubMessage = argsString;
            $.setIniDbString('subscribeHandler', 'primeSubscribeMessage', primeSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.primesub.msg.set'));
        }

        /*
         * @commandpath resubmessage [message] - Set a message for resubscribers.
         */
        if (command.equalsIgnoreCase('resubmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.usage'));
                return;
            }

            reSubMessage = argsString ;
            $.setIniDbString('subscribeHandler', 'reSubscribeMessage', reSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.set'));
        }

        /**
         * @commandpath subscribereward [points] - Set an award for subscribers.
         */
        if (command.equalsIgnoreCase('subscribereward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.reward.usage'));
                return;
            }

            subReward = parseInt(action);
            $.setIniDbNumber('subscribeHandler', 'subscribeReward', subReward);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.reward.set'));

        }
        
        /**
         * @commandpath resubscribereward [points] - Set an award for resubscribers.
         */
        if (command.equalsIgnoreCase('resubscribereward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.reward.usage'));
                return;
            }
            
            reSubReward = parseInt(action);
            $.setIniDbNumber('subscribeHandler', 'reSubscribeReward', reSubReward);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.reward.set'));
        }

        /*
         * @commandpath resubemote [emote] - The (customemote) tag will be replace with that emote.  The emote will be added the amount of months the user subscribed for.
         */
        if (command.equalsIgnoreCase('resubemote')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resubemote.usage'));
                return;
            }

            customEmote = action;
            $.setIniDbString('subscribeHandler', 'resubEmote', customEmote);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resubemote.set'));
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
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubscribereward', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'submessage', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'primesubmessage', 1);
            $.registerChatCommand('./handlers/subscribehandler.js', 'resubmessage', 1);
            announce = true;
        }
    });

    $.updateSubscribeConfig = updateSubscribeConfig;
})();
