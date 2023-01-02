/**
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
    var subMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'subscribeMessage', createDuoJson('(name) just subscribed at (plan)!', '(name) just subscribed with Twitch Prime!'))),
            reSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'reSubscribeMessage', createSingleJson('(name) just subscribed for (months) months in a row at (plan)!'))),
            giftSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'giftSubMessage', createSingleNPJson('(name) just gifted (recipient) a (plan) subscription!'))),
            giftAnonSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'giftAnonSubMessage', createSingleNPJson('An anonymous viewer gifted (recipient) a (plan) subscription!'))),
            massGiftSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'massGiftSubMessage', createSingleNPJson('(name) just gifted (amount) (plan) subscriptions to random users in the channel!'))),
            massAnonGiftSubMessage = JSON.parse($.getSetIniDbString('subscribeHandler', 'massAnonGiftSubMessage', createSingleNPJson('An anonymous viewer gifted (amount) (plan) subscriptions to random viewers!'))),
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
     * Converts a Twitch plan name (eg. 1000) into a tier name (eg. 1)
     *
     * Returns null if plan name is invalid, or if tier is prime when allowPrime is set to false
     */
    function planToTier(plan, allowPrime) {
        if (plan === undefined || plan === null) {
            return null;
        }

        plan = $.jsString(plan);

        switch (plan.toLowerCase()) {
            case '1000':
                return '1';
                break;
            case '2000':
                return '2';
                break;
            case '3000':
                return '3';
                break;
            case 'prime':
                if (allowPrime !== false) {
                    return 'Prime';
                } else {
                    return null;
                }
                break;
            default:
                return null;
                break;
        }
    }

    /*
     * Converts a Twitch tier number (eg. 1) into a plan name (eg. 1000)
     *
     * Returns null if tier number is invalid, or if tier is prime when allowPrime is set to false
     */
    function tierToPlan(tier, allowPrime) {
        if (tier === undefined || tier === null) {
            return null;
        }

        tier = $.jsString(tier);

        switch (tier.toLowerCase()) {
            case '1':
                return '1000';
                break;
            case '2':
                return '2000';
                break;
            case '3':
                return '3000';
                break;
            case 'prime':
                if (allowPrime !== false) {
                    return 'Prime';
                } else {
                    return null;
                }
                break;
            default:
                return null;
                break;
        }
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
        function amount(args) {
            return {
                result: args.event.getAmount(),
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
        function customemote(args) {
            var emotes = [];
            var emote = $.jsString(customEmote[args.event.getPlan()]);
            var num = null;

            try {
                num = args.event.getMonths();
            } catch (e) {
            }

            if (num === undefined || num === null) {
                try {
                    num = args.event.getAmount();
                } catch (e) {
                }
            }

            if (num === undefined || num === null || num <= 0) {
                num = 1;
            }

            num = Math.max(1, Math.min(12, num));

            for (var i = 0; i < num; i++) {
                emotes.push(emote);
            }

            return {
                result: emotes.join(' ').trim(),
                cache: true
            };
        }

        /*
         * @localtransformer giftmonths
         * @formula (giftmonths) '<Number of Months Gifted>'
         * @example Caster: !giftsubmessage 1000 (name) just gifted (giftmonths) months of (plan) to (recipient)! Thank you!
         * Twitch: User has just gifted a 6 month sub to OtherUser at Tier 1!
         * Bot: User just gifted 6 months of Tier 1 to OtherUser! Thank you!
         * @cached
         */
        function giftmonths(args) {
            return {
                result: args.event.getGiftedMonths(),
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
        function giftreward(args) {
            return {
                result: args.customArgs['giftreward'],
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
        function months(args) {
            return {
                result: args.event.getMonths(),
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
        function name(args) {
            return {
                result: args.event.getUsername(),
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
        function plan(args) {
            return {
                result: getPlanName(args.event.getPlan()),
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
        function recipient(args) {
            return {
                result: args.event.getRecipient(),
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
        function reward(args) {
            return {
                result: args.customArgs['reward'],
                cache: true
            };
        }

        transformers = {
            'customemote': customemote,
            'name': name,
            'plan': plan
        };

        if (type === types.MASSGIFT || type === types.MASSGIFTANON) {
            transformers['amount'] = amount;
        }

        if (type === types.GIFT || type === types.MASSGIFT) {
            transformers['giftreward'] = giftreward;
        }

        if (type === types.GIFT || type === types.GIFTANON) {
            transformers['giftmonths'] = giftmonths;
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
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchSubscriber', function (event) {
        if (subWelcomeToggle === true && announce === true) {
            var subscriber = event.getUsername(),
                    plan = event.getPlan(),
                    reward = subReward[plan],
                    message = $.jsString(subMessage[plan]);

            message = $.transformers.tags(event, message, ['twitch', 'noevent'], {localTransformers: transformers(types.SUB), customArgs: {'reward': reward}});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
            $.inidb.set('subplan', subscriber, plan);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }
        }
    });

    /*
     * @event twitchReSubscriber
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchReSubscriber', function (event) {
        if (reSubWelcomeToggle === true && announce === true) {
            var subscriber = event.getUsername(),
                    plan = event.getPlan(),
                    reward = reSubReward[plan],
                    message = $.jsString(reSubMessage[plan]);

            message = $.transformers.tags(event, message, ['twitch', 'noevent'], {localTransformers: transformers(types.RESUB), customArgs: {'reward': reward}});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestResub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.writeToFile(subscriber + ': ' + event.getMonths() + ' ', './addons/subscribeHandler/latestResub&Months.txt', false);
            $.inidb.set('streamInfo', 'lastReSub', subscriber);
            $.inidb.set('subplan', subscriber, plan);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }
        }
    });

    /*
     * @event twitchSubscriptionGift
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchSubscriptionGift', function (event) {
        if (giftSubWelcomeToggle === true && announce === true) {
            var subscriber = event.getRecipient(),
                    gifter = event.getUsername(),
                    plan = event.getPlan(),
                    reward = subReward[plan],
                    giftreward = giftSubReward[plan],
                    message = $.jsString(giftSubMessage[plan]);

            message = $.transformers.tags(event, message, ['twitch', 'noevent'], {localTransformers: transformers(types.GIFT), customArgs: {'reward': reward, 'giftreward': giftreward}});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
            $.inidb.set('subplan', subscriber, plan);

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
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchMassSubscriptionGifted', function (event) {
        if (massGiftSubWelcomeToggle === true && announce === true) {
            var gifter = event.getUsername(),
                    plan = event.getPlan(),
                    giftreward = massGiftSubReward[plan] * parseInt(event.getAmount()),
                    message = $.jsString(massGiftSubMessage[plan]);

            message = $.transformers.tags(event, message, ['twitch', 'noevent'], {localTransformers: transformers(types.MASSGIFT), customArgs: {'giftreward': giftreward}});

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
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchAnonymousSubscriptionGift', function (event) {
        if (giftAnonSubWelcomeToggle === true && announce === true) {
            var subscriber = event.getRecipient(),
                    plan = event.getPlan(),
                    reward = subReward[plan],
                    message = $.jsString(giftAnonSubMessage[plan]);

            message = $.transformers.tags(event, message, ['twitch', 'noevent'], {localTransformers: transformers(types.GIFTANON), customArgs: {'reward': reward}});

            if ($.jsString(message).trim() !== '') {
                $.say(message);
            }

            $.addSubUsersList(subscriber);
            $.restoreSubscriberStatus(subscriber);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestSub.txt', false);
            $.writeToFile(subscriber + ' ', './addons/subscribeHandler/latestOverallSub.txt', false);
            $.inidb.set('streamInfo', 'lastSub', subscriber);
            $.inidb.set('subplan', subscriber, plan);

            if (reward > 0) {
                $.inidb.incr('points', subscriber, reward);
            }
        }
    });

    /*
     * @event twitchMassAnonymousSubscriptionGifted
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchMassAnonymousSubscriptionGifted', function (event) {
        if (massAnonGiftSubWelcomeToggle === true && announce === true) {
            var message = $.jsString(massGiftSubMessage[event.getPlan()]);

            message = $.transformers.tags(event, message, ['twitch', 'noevent'], {localTransformers: transformers(types.MASSGIFTANON)});

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
         * @commandpath submessage [1|2|3|prime|all] [message] - Set a welcome message for new subscribers.
         */
        if (command.equalsIgnoreCase('submessage')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.usage'));
                return;
            }

            planId = tierToPlan(args[0]);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                subMessage = JSON.parse(createSingleJson(argsString));
            } else {
                subMessage[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'subscribeMessage', JSON.stringify(subMessage));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.msg.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath resubmessage [1|2|3|prime|all] [message] - Set a message for resubscribers.
         */
        if (command.equalsIgnoreCase('resubmessage')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.usage'));
                return;
            }

            planId = tierToPlan(args[0]);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                reSubMessage = JSON.parse(createSingleJson(argsString));
            } else {
                reSubMessage[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'reSubscribeMessage', JSON.stringify(reSubMessage));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.msg.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath giftsubmessage [1|2|3|all] [message] - Set a message for resubscribers.
         */
        if (command.equalsIgnoreCase('giftsubmessage')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.msg.usage'));
                return;
            }

            planId = tierToPlan(args[0], false);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                giftSubMessage = JSON.parse(createSingleNPJson(argsString));
            } else {
                giftSubMessage[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'giftSubMessage', JSON.stringify(giftSubMessage));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.msg.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath giftanonsubmessage [1|2|3|all] [message] - Set a message for anonymous gifting alerts.
         */
        if (command.equalsIgnoreCase('giftanonsubmessage')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftanonsub.msg.usage'));
                return;
            }

            planId = tierToPlan(args[0], false);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                giftAnonSubMessage = JSON.parse(createSingleNPJson(argsString));
            } else {
                giftAnonSubMessage[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'giftAnonSubMessage', JSON.stringify(giftAnonSubMessage));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftanonsub.msg.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath massgiftsubmessage [1|2|3|all] [message] - Set a message for gifting alerts.
         */
        if (command.equalsIgnoreCase('massgiftsubmessage')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.msg.usage'));
                return;
            }

            planId = tierToPlan(args[0], false);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                massGiftSubMessage = JSON.parse(createSingleNPJson(argsString));
            } else {
                massGiftSubMessage[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'massGiftSubMessage', JSON.stringify(massGiftSubMessage));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.msg.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath massanongiftsubmessage [1|2|3|all] [message] - Set a message for mass anonymous gifting alerts.
         */
        if (command.equalsIgnoreCase('massanongiftsubmessage')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.anonmassgiftsub.msg.usage'));
                return;
            }

            planId = tierToPlan(args[0], false);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                massAnonGiftSubMessage = JSON.parse(createSingleNPJson(argsString));
            } else {
                massAnonGiftSubMessage[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'massAnonGiftSubMessage', JSON.stringify(massAnonGiftSubMessage));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.anonmassgiftsub.msg.set', planId === null ? 'all tiers' : planId));
        }

        /**
         * @commandpath subscribereward [1|2|3|prime|all] [points] - Set an award for subscribers.
         */
        if (command.equalsIgnoreCase('subscribereward')) {
            if (args.length < 2 || isNaN(parseInt(args[1]))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.reward.usage'));
                return;
            }

            planId = tierToPlan(args[0]);
            argsString = parseInt(args[1]);
            if (planId === null) {
                subReward = JSON.parse(createSingleJson(argsString));
            } else {
                subReward[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'subscribeReward', JSON.stringify(subReward));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.sub.reward.set', planId === null ? 'all tiers' : planId));
        }

        /**
         * @commandpath resubscribereward [1|2|3|prime|all] [points] - Set an award for resubscribers.
         */
        if (command.equalsIgnoreCase('resubscribereward')) {
            if (args.length < 2 || isNaN(parseInt(args[1]))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.reward.usage'));
                return;
            }

            planId = tierToPlan(args[0]);
            argsString = parseInt(args[1]);
            if (planId === null) {
                reSubReward = JSON.parse(createSingleJson(argsString));
            } else {
                reSubReward[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'reSubscribeReward', JSON.stringify(reSubReward));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resub.reward.set', planId === null ? 'all tiers' : planId));
        }

        /**
         * @commandpath giftsubreward [1|2|3|all] [points] - Set an award for gifted subs.
         */
        if (command.equalsIgnoreCase('giftsubreward')) {
            if (args.length < 2 || isNaN(parseInt(args[1]))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.reward.usage'));
                return;
            }

            planId = tierToPlan(args[0], false);
            argsString = parseInt(args[1]);
            if (planId === null) {
                giftSubReward = JSON.parse(createSingleNPJson(argsString));
            } else {
                giftSubReward[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'giftSubReward', JSON.stringify(giftSubReward));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.giftsub.reward.set', planId === null ? 'all tiers' : planId));
        }

        /**
         * @commandpath massgiftsubreward [1|2|3|all] [points] - Set an award for mass subs. This is multiplied by the number of subs gifted.
         */
        if (command.equalsIgnoreCase('massgiftsubreward')) {
            if (args.length < 2 || isNaN(parseInt(args[1]))) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.reward.usage'));
                return;
            }

            planId = tierToPlan(args[0], false);
            argsString = parseInt(args[1]);
            if (planId === null) {
                massGiftSubReward = JSON.parse(createSingleNPJson(argsString));
            } else {
                massGiftSubReward[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'massGiftSubReward', JSON.stringify(massGiftSubReward));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.massgiftsub.reward.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath subemote [1|2|3|prime|all] [emote] - The (customemote) tag will be replace with these emotes.  The emotes will be added the amount of months the user subscribed for.
         */
        if (command.equalsIgnoreCase('subemote') || command.equalsIgnoreCase('resubemote')) {
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resubemote.usage'));
                return;
            }

            planId = tierToPlan(args[0]);
            argsString = args.splice(1).join(' ');
            if (planId === null) {
                customEmote = JSON.parse(createSingleJson(argsString));
            } else {
                customEmote[planId] = argsString;
            }
            $.setIniDbString('subscribeHandler', 'subEmote', JSON.stringify(customEmote));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.resubemote.set', planId === null ? 'all tiers' : planId));
        }

        /*
         * @commandpath namesubplan [1|2|3|prime] [name of plan] - Name a subscription plan for the (plan) tag, Twitch provides three tiers plus prime.
         */
        if (command.equalsIgnoreCase('namesubplan')) {
            planId = tierToPlan(args[0]);
            if (planId === null) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.usage'));
                return;
            }

            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.show', args[0], subPlans[planId]));
                return;
            }

            argsString = args.splice(1).join(' ');
            subPlans[planId] = argsString;
            $.setIniDbString('subscribeHandler', 'subPlans', JSON.stringify(subPlans));
            $.say($.whisperPrefix(sender) + $.lang.get('subscribehandler.namesubplan.set', args[0], argsString));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/subscribeHandler.js', 'subwelcometoggle', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'subemote', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubemote', $.PERMISSION.Admin); // @deprecated command name
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
        $.registerChatCommand('./handlers/subscribeHandler.js', 'resubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'giftanonsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massgiftsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'massanongiftsubmessage', $.PERMISSION.Admin);
        $.registerChatCommand('./handlers/subscribeHandler.js', 'namesubplan', $.PERMISSION.Admin);
        announce = true;
    });

    $.updateSubscribeConfig = updateSubscribeConfig;
    $.subscription = {
        planToTier: planToTier,
        tierToPlan: tierToPlan
    };
})();
