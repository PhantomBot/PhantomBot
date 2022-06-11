/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * subscribehandler.js
 *
 * Register new subscribers and unsubscribers in the channel
 */
(function () {
    var subMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'subscribeMessage', createDuoJson('(name) just subscribed!', '(name) just subscribed with Twitch Prime!'))),
            reSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'reSubscribeMessage', createSingleJson('(name) just subscribed for (months) months in a row!'))),
            giftSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'giftSubMessage', createSingleNPJson('(name) just gifted (recipient) a subscription!'))),
            giftAnonSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'giftAnonSubMessage', createSingleNPJson('An anonymous viewer gifted (recipient) a subscription!'))),
            massGiftSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'massGiftSubMessage', createSingleNPJson('(name) just gifted (amount) subscriptions to random users in the channel!'))),
            massAnonGiftSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'massAnonGiftSubMessage', createSingleNPJson('An anonymous viewer gifted (amount) subscriptions to random viewers!'))),
            subWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle', true),
            reSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle', true),
            giftSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle', true),
            giftAnonSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'giftAnonSubWelcomeToggle', true),
            massGiftSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'massGiftSubWelcomeToggle', true),
            massAnonGiftSubWelcomeToggle = $.getSetIniDbBoolean('subscribeHandler', 'massAnonGiftSubWelcomeToggle', true),
            subReward = JSON.parse($.getSetIniDbString('subscribeHandler', 'subscribeReward', createSingleJson(0))),
            reSubReward = JSON.parse($.getSetIniDbString('subscribeHandler', 'reSubscribeReward', createSingleJson(0))),
            giftSubReward = JSON.parse($.getSetIniDbString('subscribeHandler', 'giftSubReward', createSingleNPJson(0))),
            massGiftSubReward = JSON.parse($.getSetIniDbString('subscribeHandler', 'massGiftSubReward', createSingleNPJson(0))),
            customEmote = JSON.parse($.getSetIniDbString('subscribeHandler', 'subEmote', createSingleJson(''))),
            subPlans = JSON.parse($.getSetIniDbString('subscribeHandler', 'subPlans', createMultiJson('Tier 1', 'Tier 2', 'Tier 3', 'Prime'))),
            announce = false,
            types = {SUB: 0, RESUB: 1, GIFT: 2, GIFTANON: 3, MASSGIFT: 4, MASSGIFTANON: 5};

    /*
     * @function updateSubscribeConfig
     */
    function updateSubscribeConfig() {
        subMessage = JSON.parse($.getIniDbString('subscribeHandler', 'subscribeMessage'));
        reSubMessage = JSON.parse($.getIniDbString('subscribeHandler', 'reSubscribeMessage'));
        giftSubMessage = JSON.parse($.getIniDbString('subscribeHandler', 'giftSubMessage'));
        giftAnonSubMessage = JSON.parse($.getIniDbString('subscribeHandler', 'giftAnonSubMessage'));
        massGiftSubMessage = JSON.parse($.getIniDbString('subscribeHandler', 'massGiftSubMessage'));
        massAnonGiftSubMessage = JSON.parse($.getIniDbString('subscribeHandler', 'massAnonGiftSubMessage'));
        subWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'subscriberWelcomeToggle');
        reSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'reSubscriberWelcomeToggle');
        giftSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle');
        giftAnonSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'giftAnonSubWelcomeToggle');
        massGiftSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'massGiftSubWelcomeToggle');
        massAnonGiftSubWelcomeToggle = $.getIniDbBoolean('subscribeHandler', 'massAnonGiftSubWelcomeToggle');
        subReward = JSON.parse($.getIniDbString('subscribeHandler', 'subscribeReward'));
        reSubReward = JSON.parse($.getIniDbString('subscribeHandler', 'reSubscribeReward'));
        giftSubReward = JSON.parse($.getIniDbString('subscribeHandler', 'giftSubReward'));
        massGiftSubReward = JSON.parse($.getIniDbString('subscribeHandler', 'massGiftSubReward'));
        customEmote = JSON.parse($.getIniDbString('subscribeHandler', 'subEmote'));
        subPlans = JSON.parse($.getIniDbString('subscribeHandler', 'subPlans'));
    }

    function createSingleJson(val) {
        return JSON.stringify({
            '1000': val,
            '2000': val,
            '3000': val,
            'Prime': val
        });
    }

    function createSingleNPJson(val) {
        return JSON.stringify({
            '1000': val,
            '2000': val,
            '3000': val
        });
    }

    function createDuoJson(val, vPrime) {
        return JSON.stringify({
            '1000': val,
            '2000': val,
            '3000': val,
            'Prime': vPrime
        });
    }

    function createMultiJson(v1000, v2000, v3000, vPrime) {
        return JSON.stringify({
            '1000': v1000,
            '2000': v2000,
            '3000': v3000,
            'Prime': vPrime
        });
    }

    /*
     * @function getPlanName
     */
    function getPlanName(plan) {
        plan = $.jsString(plan);

        if (subPlans.hasOwnProperty(plan)) {
            return subPlans[plan];
        }

        return 'Unknown Tier';
    }

    var transformers = function (type) {
        var transformers;

        /*
         * @localtransformer amount
         * @formula (amount) The number of subs given by a mass-giftsub event
         * @example Caster: !massgiftsubmessage 1000 (name) just gave away (amount) subs! Thank you!
         * Twitch: User has just gifted 20 subs at Tier 1 to the community!
         * Bot: User just gave away 20 subs! Thank you!
         * @cached
         */
        function amount(args, event) {
            return {
                result: $.jsString(event.getMonths()),
                cache: true
            };
        }

        /*
         * @localtransformer customemote
         * @formula (customemote) '<The Emote, Repeated Months Times (Max 12)>'
         * @example Caster: !resubmessage 1000 (name) just subscribed! They have been subscribed for (months) months! Thank you! (customemote)
         * Caster: !subemote 1000 BloodTrail
         * Twitch: User has just subscriber at Tier 1! They have been subscribed for 3 months!
         * Bot: User just subscribed! They have been subscribed for 3 months! Thank you! BloodTrail BloodTrail BloodTrail
         * @cached
         */
        function customemote(args, event) {
            var emotes = [];
            var emote = customEmote[event.getPlan()];

            for (var i = 0; i < event.getMonths(); i++) {
                emotes.push(emote);
            }

            return {
                result: $.jsString(emotes).join(' ').trim(),
                cache: true
            };
        }

        /*
         * @localtransformer giftreward
         * @formula (giftreward) '<Points Reward>'
         * @customarg (giftreward:int) The number of points awarded to the gifter for gifting a sub to someone else
         * @example Caster: !giftsubmessage 1000 (recipient) just received a sub from (name)! (name) gets (giftreward) points! Thank you!
         * @example Caster: !giftsubreward 1000 25
         * Twitch: User has just gifted a sub to OtherUser at Tier 1!
         * Bot: OtherUser just received a sub from User! User gets 25 points! Thank you!
         * @cached
         */
        function giftreward(args, event, customArgs) {
            return {
                result: $.jsString(customArgs['giftreward']),
                cache: true
            };
        }

        /*
         * @localtransformer months
         * @formula (months) '<Total Months Subscribed>'
         * @example Caster: !resubmessage 1000 (name) just subscribed! They have been subscribed for (months) months! Thank you!
         * Twitch: User has just subscriber at Tier 1! They have been subscribed for 12 months!
         * Bot: User just subscribed! They have been subscribed for 12 months! Thank you!
         * @cached
         */
        function months(args, event) {
            return {
                result: $.jsString(event.getMonths()),
                cache: true
            };
        }

        /*
         * @localtransformer name
         * @formula (name) For subs/resubs, the subscriber's name. For gift subs, the name of the person gifting the sub
         * @example Caster: !submessage 1000 (name) just subscribed at Tier 1! Thank you!
         * Twitch: User has just subscriber at Tier 1!
         * Bot: User just subscribed at Tier 1! Thank you!
         * @cached
         */
        function name(args, event) {
            return {
                result: event.getUsername(),
                cache: true
            };
        }

        /*
         * @localtransformer plan
         * @formula (plan) '<Subscription Tier>'
         * @example Caster: !submessage 1000 (name) just subscribed at (plan)! Thank you!
         * Caster: !namesubplan 1000 Friendo Tier
         * Twitch: User has just subscriber at Tier 1!
         * Bot: User just subscribed at Friendo Tier! Thank you!
         * @cached
         */
        function plan(args, event) {
            return {
                result: getPlanName(event.getPlan()),
                cache: true
            };
        }

        /*
         * @localtransformer recipient
         * @formula (recipient) The name of the recipient of a gift sub
         * @example Caster: !giftsubmessage 1000 (recipient) just received a sub from (name)! Thank you!
         * Twitch: User has just gifted a sub to OtherUser at Tier 1!
         * Bot: OtherUser just received a sub from User! Thank you!
         * @cached
         */
        function recipient(args, event) {
            return {
                result: event.getRecipient(),
                cache: true
            };
        }

        /*
         * @localtransformer reward
         * @formula (reward) '<Points Reward>'
         * @customarg (reward:int) The number of points awarded for the sub
         * @example Caster: !submessage 1000 (name) just subscribed at Tier 1! They get (reward) points! Thank you!
         * Twitch: User has just subscriber at Tier 1!
         * Bot: User just subscribed at Tier 1! They get 100 points! Thank you!
         * @cached
         */
        function reward(args, event, customArgs) {
            return {
                result: $.jsString(customArgs['reward']),
                cache: true
            };
        }

        transformers = {
            'alert': $.getGlobalTransformer('alert'),
            'customemote': customemote,
            'name': name,
            'plan': plan,
            'playsound': $.getGlobalTransformer('playsound')
        };

        if (type === types.MASSGIFT || type === types.MASSGIFTANON) {
            transformers['amount'] = amount;
        }

        if (type === types.GIFT || type === types.MASSGIFT) {
            transformers['giftreward'] = giftreward;
        }

        if (type === types.GIFT || type === types.GIFTANON) {
            transformers['recipient'] = recipient;
        }

        if (type === types.RESUB || type === types.GIFT || type === types.GIFTANON) {
            transformers['months'] = months;
        }

        if (type !== types.MASSGIFT && type !== types.MASSGIFTANON) {
            transformers['reward'] = reward;
        }

        return transformers;
    };

    /*
     * @event twitchSubscriber
     * @usestransformers local
     */
    $.bind('twitchSubscriber', function (event) {
        if (subWelcomeToggle === true && announce === true) {
            var subscriber = event.getUsername(),
                    plan = event.getPlan(),
                    reward = subReward[plan],
                    message = $.jsString(subMessage[plan]);

            message = $.tags(event, message, false, transformers(types.SUB), true, {'reward': reward});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }
        }
    });

    /*
     * @event twitchReSubscriber
     * @usestransformers local
     */
    $.bind('twitchReSubscriber', function (event) {
        if (reSubWelcomeToggle === true && announce === true) {
            var subscriber = event.getUsername(),
                    plan = event.getPlan(),
                    reward = reSubReward[plan],
                    message = $.jsString(reSubMessage[plan]);

            message = $.tags(event, message, false, transformers(types.RESUB), true, {'reward': reward});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestResub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.writeToFile(subscriber + ': ' + event.getMonths() + ' ', './addons/subscribeHandler/latestResub&Months.txt', false);
            $.inidb.set('streamInfo', 'lastReSub', subscriber);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }
        }
    });

    /*
     * @event twitchSubscriptionGift
     * @usestransformers local
     */
    $.bind('twitchSubscriptionGift', function (event) {
        if (giftSubWelcomeToggle === true && announce === true) {
            var subscriber = event.getRecipient(),
                    gifter = event.getUsername(),
                    plan = event.getPlan(),
                    reward = subReward[plan],
                    giftreward = giftSubReward[plan],
                    message = $.jsString(giftSubMessage[plan]);

            message = $.tags(event, message, false, transformers(types.GIFT), true, {'reward': reward, 'giftreward': giftreward});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }

            if (giftreward > 0) {
                $.inidb.incr('points', gifter, giftreward);
            }
        }
    });

    /*
     * @event twitchMassSubscriptionGifted
     * @usestransformers local
     */
    $.bind('twitchMassSubscriptionGifted', function (event) {
        if (massGiftSubWelcomeToggle === true && announce === true) {
            var gifter = event.getUsername(),
                    plan = event.getPlan(),
                    giftreward = massGiftSubReward[plan] * parseInt(event.getAmount()),
                    message = $.jsString(massGiftSubMessage[plan]);

            message = $.tags(event, message, false, transformers(types.MASSGIFT), true, {'giftreward': giftreward});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            if (giftreward > 0) {
                $.inidb.incr('points', gifter, giftreward);
            }
        }
    });

    /*
     * @event twitchAnonymousSubscriptionGift
     * @usestransformers local
     */
    $.bind('twitchAnonymousSubscriptionGift', function (event) {
        if (giftAnonSubWelcomeToggle === true && announce === true) {
            var subscriber = event.getRecipient(),
                    plan = event.getPlan(),
                    reward = subReward[plan],
                    message = $.jsString(giftAnonSubMessage[plan]);

            message = $.tags(event, message, false, transformers(types.GIFTANON), true, {'reward': reward});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }
        }
    });

    /*
     * @event twitchMassAnonymousSubscriptionGifted
     * @usestransformers local
     */
    $.bind('twitchMassAnonymousSubscriptionGifted', function (event) {
        if (massAnonGiftSubWelcomeToggle === true && announce === true) {
            var message = $.jsString(massGiftSubMessage[event.getPlan()]);

            message = $.tags(event, message, false, transformers(types.MASSGIFTANON), true);

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }
        }
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
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
            $.say($.whisperPrefix(sender) + (reSubWelcomeToggle ? $.lang.get('subscribehandler.resub.toggle.on') : $.lang.get('subscribehandler.resub.toggle.off')));
        }

        /*
         * @commandpath giftsubwelcometoggle - Enable or disable subgifting alerts.
         */
        if (command.equalsIgnoreCase('giftsubwelcometoggle')) {
            giftSubWelcomeToggle = !giftSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'giftSubWelcomeToggle', giftSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (giftSubWelcomeToggle ? $.lang.get('subscribehandler.giftsub.toggle.on') : $.lang.get('subscribehandler.giftsub.toggle.off')));
        }

        /*
         * @commandpath giftanonsubwelcometoggle - Enable or disable anonymous subgifting alerts.
         */
        if (command.equalsIgnoreCase('giftanonsubwelcometoggle')) {
            giftAnonSubWelcomeToggle = !giftAnonSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'giftAnonSubWelcomeToggle', giftAnonSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (giftAnonSubWelcomeToggle ? $.lang.get('subscribehandler.anongiftsub.toggle.on') : $.lang.get('subscribehandler.anongiftsub.toggle.off')));
        }

        /*
         * @commandpath massgiftsubwelcometoggle - Enable or disable subgifting alerts.
         */
        if (command.equalsIgnoreCase('massgiftsubwelcometoggle')) {
            massGiftSubWelcomeToggle = !massGiftSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'massGiftSubWelcomeToggle', massGiftSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (massGiftSubWelcomeToggle ? $.lang.get('subscribehandler.massgiftsub.toggle.on') : $.lang.get('subscribehandler.massgiftsub.toggle.off')));
        }

        /*
         * @commandpath massanongiftsubwelcometoggle - Enable or disable mass anonymous subgifting alerts.
         */
        if (command.equalsIgnoreCase('massanongiftsubwelcometoggle')) {
            massAnonGiftSubWelcomeToggle = !massAnonGiftSubWelcomeToggle;
            $.setIniDbBoolean('subscribeHandler', 'massAnonGiftSubWelcomeToggle', massAnonGiftSubWelcomeToggle);
            $.say($.whisperPrefix(sender) + (massAnonGiftSubWelcomeToggle ? $.lang.get('subscribehandler.anonmassgiftsub.toggle.on') : $.lang.get('subscribehandler.anonmassgiftsub.toggle.off')));
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

        /*
         * @commandpath giftanonsubmessage[message] - Set a message for anonymous gifting alerts.
         */
        if (command.equalsIgnoreCase('giftanonsubmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftanonsub.msg.usage'));
                return;
            }

            giftAnonSubMessage = argsString;
            $.setIniDbString('subscribeHandler', 'giftAnonSubMessage', giftAnonSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftanonsub.msg.set'));
        }

        /*
         * @commandpath massgiftsubmessage [message] - Set a message for gifting alerts.
         */
        if (command.equalsIgnoreCase('massgiftsubmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.msg.usage'));
                return;
            }

            massGiftSubMessage = argsString;
            $.setIniDbString('subscribeHandler', 'massGiftSubMessage', massGiftSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.msg.set'));
        }

        /*
         * @commandpath massanongiftsubmessage [message] - Set a message for mass anonymous gifting alerts.
         */
        if (command.equalsIgnoreCase('massanongiftsubmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.anonmassgiftsub.msg.usage'));
                return;
            }

            massAnonGiftSubMessage = argsString;
            $.setIniDbString('subscribeHandler', 'massAnonGiftSubMessage', massAnonGiftSubMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.anonmassgiftsub.msg.set'));
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
         * @commandpath giftsubreward [points] - Set an award for gifted subs.
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

        /**
         * @commandpath massgiftsubreward [points] - Set an award for mass subs. This is a multiplier.
         */
        if (command.equalsIgnoreCase('massgiftsubreward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.reward.usage'));
                return;
            }

            massGiftSubReward = parseInt(action);
            $.setIniDbNumber('subscribeHandler', 'massGiftSubReward', massGiftSubReward);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.reward.set'));
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
         * @commandpath namesubplan [1|2|3|prime] [name of plan] - Name a subscription plan, Twitch provides three tiers.
         */
        if (command.equalsIgnoreCase('namesubplan')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.usage'));
                return;
            }

            action = $.javaString(action);

            if (!action.equals('1') && !action.equals('2') && !action.equals('3') && !action.equalsIgnoreCase('prime')) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.usage'));
                return;
            }

            if (action.equals('1')) {
                planId = 'subPlan1000';
            } else if (action.equals('2')) {
                planId = 'subPlan2000';
            } else if (action.equals('3')) {
                planId = 'subPlan3000';
            } else if (action.equalsIgnoreCase('prime')) {
                planId = 'subPlanPrime';
            }

            if (args[1] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.show', action, $.getIniDbString('subscribeHandler', planId)));
                return;
            }

            argsString = args.splice(1).join(' ');
            planId = $.javaString(planId);
            if (planId.equals('subPlan1000')) {
                subPlan1000 = argsString;
            } else if (planId.equals('subPlan2000')) {
                subPlan2000 = argsString;
            } else if (planId.equals('subPlan3000')) {
                subPlan3000 = argsString;
            } else if (planId.equals('subPlanPrime')) {
                subPlanPrime = argsString;
            }
            $.setIniDbString('subscribeHandler', planId, argsString);
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.set', action, argsString));
            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/subscribeHandler.js', 'subwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubemote', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'primesubwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftanonsubwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massgiftsubwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massanongiftsubwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'subscribereward', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubscribereward', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubreward', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massgiftsubreward', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'submessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'primesubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftanonsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massgiftsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massanongiftsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'namesubplan', $.PERMISSION.Admin);
        announce = true;
    });

    $.updateSubscribeConfig = updateSubscribeConfig;
})();
