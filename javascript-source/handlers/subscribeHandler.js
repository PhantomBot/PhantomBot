/**
 * subscribehandler.js
 *
 * Register new subscribers and unsubscribers in the channel
 */
(function() {
    var subMessage = $.getSetIniDbString('subscribeHandler', 'subscribeMessage', '(name) just subscribed!'),
        primeSubMessage = $.getSetIniDbString('subscribeHandler', 'primeSubscribeMessage', '(name) just subscribed with Twitch Prime!'),
        reSubMessage = $.getSetIniDbString('subscribeHandler', 'reSubscribeMessage', '(name) just subscribed for (months) months in a row!'),
        giftSubMessage = $.getSetIniDbString('subscribeHandler', 'giftSubMessage', '(name) just gifted (recipient) a subscription!'),
        subWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle', true),
        primeSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'primeSubscriberWelcomeToggle', true),
        reSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle', true),
        giftSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle', true),
        subReward = $.getSetIniDbNumber('subscribeHandler', 'subscribeReward', 0),
        reSubReward = $.getSetIniDbNumber('subscribeHandler', 'reSubscribeReward', 0),
        giftSubReward = $.getSetIniDbNumber('subscribeHandler', 'giftSubReward', 0),
        customEmote = $.getSetIniDbString('subscribeHandler', 'resubEmote', ''),
        subPlan1000 = $.getSetIniDbString('subscribeHandler', 'subPlan1000', 'Tier 1'),
        subPlan2000 = $.getSetIniDbString('subscribeHandler', 'subPlan2000', 'Tier 2'),
        subPlan3000 = $.getSetIniDbString('subscribeHandler', 'subPlan3000', 'Tier 3'),
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
        giftSubMessage = $.getIniDbString('subscribeHandler', 'giftSubMessage');
        subWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle');
        primeSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'primeSubscriberWelcomeToggle');
        reSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle');
        giftSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle');
        subReward = $.getIniDbNumber('subscribeHandler', 'subscribeReward');
        reSubReward = $.getIniDbNumber('subscribeHandler', 'reSubscribeReward');
        giftSubReward = $.getIniDbNumber('subscribeHandler', 'giftSubReward');
        customEmote = $.getIniDbString('subscribeHandler', 'resubEmote');
        subPlan1000 = $.getIniDbString('subscribeHandler', 'subPlan1000');
        subPlan2000 = $.getIniDbString('subscribeHandler', 'subPlan2000');
        subPlan3000 = $.getIniDbString('subscribeHandler', 'subPlan3000');
    }

    /*
     * @function getPlanName
     */
    function getPlanName(plan) {
        if (plan.equals('1000')) {
            return subPlan1000;
        } else if (plan.equals('2000')) {
            return subPlan2000;
        } else if (plan.equals('3000')) {
            return subPlan3000;
        } else if (plan.equals('Prime')) {
            return 'Prime';
        }

        return 'Unknown Tier';
    }

    /*
     * @event twitchSubscriber
     */
    $.bind('twitchSubscriber', function(event) {
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
                message = $.replace(message, '(plan)', getPlanName(event.getPlan()));
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
     * @event twitchPrimeSubscriber
     */
    $.bind('twitchPrimeSubscriber', function(event) {
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
     * @event twitchReSubscriber
     */
    $.bind('twitchReSubscriber', function(event) {
        var resubscriber = event.getReSubscriber(),
            months = event.getMonths(),
            message = reSubMessage,
            emotes = [];

        if (reSubWelcomeToggle === true && announce === true) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', resubscriber);
            }

            if (message.match(/\(months\)/g)) {
                message = $.replace(message, '(months)', months);
            }

            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(reSubReward));
            }

            if (message.match(/\(plan\)/g)) {
                message = $.replace(message, '(plan)', getPlanName(event.getPlan()));
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
     * @event twitchSubscriptionGift
     */
    $.bind('twitchSubscriptionGift', function(event) {
        var gifter = event.getUsername(),
            recipient = event.getRecipient(),
            months = event.getMonths(),
            tier = event.getPlan(),
            message = giftSubMessage;

        if (giftSubWelcomeToggle === true && announce === true) {
            if (message.match(/\(name\)/g)) {
                message = $.replace(message, '(name)', gifter);
            }

            if (message.match(/\(recipient\)/g)) {
                message = $.replace(message, '(recipient)', recipient);
            }

            if (message.match(/\(months\)/g)) {
                message = $.replace(message, '(months)', months);
            }

            if (message.match(/\(reward\)/g)) {
                message = $.replace(message, '(reward)', String(subReward));
            }

            if (message.match(/\(plan\)/g)) {
                message = $.replace(message, '(plan)', getPlanName(event.getPlan()));
            }

            if (message.match(/\(customemote\)/)) {
                for (i = 0; i < months; i++, emotes.push(customEmote));
                message = $.replace(message, '(customemote)', emotes.join(' '));
            }
            $.say(message);
            $.addSubUsersList(recipient);
            $.restoreSubscriberStatus(recipient, true);
            $.writeToFile(recipient + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', recipient);
            if (subReward > 0) {
                $.inidb.incr('points', recipient, subReward);
            }
            if (giftSubReward > 0) {
                $.inidb.incr('points', gifter, giftSubReward);
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
            action = args[0],
            planId;

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
         * @commandpath giftsubwelcometoggle - Enable or disable subgifting alerts.
         */
        if (command.equalsIgnoreCase('giftsubwelcometoggle')) {
            giftSubWelcomeToggle = !giftSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle', giftSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (giftSubWelcomeToggle ? $.lang.get('subscribehandler.giftsub.toggle.on') : $.lang.get('subscribehandler.giftsub.toggle.off')))
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

            reSubMessage = argsString;
            $.setIniDbString('subscribeHandler', 'reSubscribeMessage', reSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.set'));
        }

        /*
         * @commandpath giftsubmessage [message] - Set a message for resubscribers.
         */
        if (command.equalsIgnoreCase('giftsubmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.msg.usage'));
                return;
            }

            giftSubMessage = argsString;
            $.setIniDbString('subscribeHandler', 'giftSubMessage', giftSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.msg.set'));
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

        /**
         * @commandpath giftsubreward [points] - Set an award for resubscribers.
         */
        if (command.equalsIgnoreCase('giftsubreward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.reward.usage'));
                return;
            }

            giftSubReward = parseInt(action);
            $.setIniDbNumber('subscribeHandler', 'giftSubReward', giftSubReward);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.reward.set'));
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

        /*
         * @commandpath namesubplan [1|2|3] [name of plan] - Name a subscription plan, Twitch provides three tiers.
         */
        if (command.equalsIgnoreCase('namesubplan')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.usage'));
                return;
            }

            if (!action.equals('1') && !action.equals('2') && !action.equals('3')) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.usage'));
                return;
            }

            if (action.equals('1')) {
                planId = 'subPlan1000';
            } else if (action.equals('2')) {
                planId = 'subPlan2000';
            } else if (action.equals('3')) {
                planId = 'subPlan3000';
            }

            if (args[1] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.show', action, $.getIniDbString('subscribeHandler', planId)));
                return;
            }

            argsString = args.splice(1).join(' ');
            if (planId.equals('subPlan1000')) {
                subPlan1000 = argsString;
            } else if (planId.equals('subPlan2000')) {
                subPlan2000 = argsString;
            } else if (planId.equals('subPlan3000')) {
                subPlan3000 = argsString;
            }
            $.setIniDbString('subscribeHandler', planId, argsString);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.set', action, argsString));
            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/subscribeHandler.js', 'subwelcometoggle', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubemote', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'primesubwelcometoggle', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubwelcometoggle', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubwelcometoggle', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'subscribereward', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubscribereward', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubreward', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'submessage', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'primesubmessage', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubmessage', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubmessage', 1);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'namesubplan', 1);
        announce = true;
    });

    $.updateSubscribeConfig = updateSubscribeConfig;
})();