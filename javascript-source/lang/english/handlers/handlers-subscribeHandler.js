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

$.lang.register('subscribehandler.auto.sub.mode.interval.set', 'Auto submode interval set! This will only work while the stream is online.');
$.lang.register('subscribehandler.auto.submode.timer.404', 'The minimum auto submode interval allowed is 30 minutes.');
$.lang.register('subscribehandler.auto.submode.timer.off', 'Automated subs only mode enabled!');
$.lang.register('subscribehandler.auto.submode.timer.usage', 'Usage: !autosubmodetimer (interval) - set the interval to 0 to disable.');
$.lang.register('subscribehandler.new.sub.toggle.off', 'New Subscribers will no longer be welcomed upon subscribing.');
$.lang.register('subscribehandler.new.sub.toggle.on', 'New Subscribers will now be welcomed upon subscribing.');
$.lang.register('subscribehandler.new.primesub.toggle.off', 'New Twitch Prime subscribers will no longer be welcomed upon subscribing.');
$.lang.register('subscribehandler.new.primesub.toggle.on', 'New Twitch Prime subscribers will now be welcomed upon subscribing.');
$.lang.register('subscribehandler.resub.msg.set', 'Resubscriber welcome message set!');
$.lang.register('subscribehandler.giftsub.msg.set', 'Subscriber gift welcome message set!');
$.lang.register('subscribehandler.giftanonsub.msg.set', 'Anonymous Subscriber gift welcome message set!');
$.lang.register('subscribehandler.massgiftsub.msg.set', 'Mass Subscriber gift welcome message set!');
$.lang.register('subscribehandler.anonmassgiftsub.msg.set', 'Anonymous Mass Subscriber gift welcome message set!');
$.lang.register('subscribehandler.resub.msg.usage', 'Usage: !resubmessage (message) - Tags: (name), (months), (reward) and (plan)');
$.lang.register('subscribehandler.giftsub.msg.usage', 'Usage: !giftsubmessage (message) - Tags: (name), (recipient), (months), (reward) and (plan)');
$.lang.register('subscribehandler.giftanonsub.msg.usage', 'Usage: !giftanonsubmessage (message) - Tags: (name), (recipient), (months), (reward) and (plan)');
$.lang.register('subscribehandler.massgiftsub.msg.usage', 'Usage: !massgiftsubmessage (message) - Tags: (name), (amount), (reward) and (plan)');
$.lang.register('subscribehandler.anonmassgiftsub.msg.usage', 'Usage: !massanongiftsubmessage (message) - Tags: (name), (amount) and (plan)');
$.lang.register('subscribehandler.resub.msg.noreward.set', 'Resubscriber welcome message set for no rewards!');
$.lang.register('subscribehandler.giftsub.msg.noreward.set', 'Subscriber gift welcome message set for no rewards!');
$.lang.register('subscribehandler.resub.msg.noreward.usage', 'Usage: !resubmessage (message) - Tags: (name) (months)');
$.lang.register('subscribehandler.giftsub.msg.noreward.usage', 'Usage: !giftsubmessage (message) - Tags: (name) (months)');
$.lang.register('subscribehandler.resub.toggle.off', 'Resubscribers will no longer be welcomed upon resubscribing.');
$.lang.register('subscribehandler.giftsub.toggle.off', 'Subscriber gift will no longer be welcomed upon subscribing.');
$.lang.register('subscribehandler.massgiftsub.toggle.off', 'Mass Subscriber gift will no longer be welcomed upon subscribing.');
$.lang.register('subscribehandler.anongiftsub.toggle.off', 'Anonymous Subscriber gift will no longer be welcomed upon subscribing..');
$.lang.register('subscribehandler.anonmassgiftsub.toggle.off', 'Anonymous Mass Subscriber gift will no longer be welcomed upon subscribing.');
$.lang.register('subscribehandler.resub.toggle.on', 'Resubscribers will now be welcomed upon resubscribing.');
$.lang.register('subscribehandler.giftsub.toggle.on', 'Subscriber gift will now be welcomed upon subscribing.');
$.lang.register('subscribehandler.massgiftsub.toggle.on', 'Mass Subscriber gift will now be welcomed upon subscribing.');
$.lang.register('subscribehandler.anongiftsub.toggle.on', 'Anonymous Subscriber gift will now be welcomed upon subscribing.');
$.lang.register('subscribehandler.anonmassgiftsub.toggle.on', 'Anonymous Mass Subscriber gift will now be welcomed upon subscribing.');
$.lang.register('subscribehandler.sub.reward.set', 'Reward for subscribing set!');
$.lang.register('subscribehandler.sub.reward.usage', 'Usage: !subscribereward (amount)');
$.lang.register('subscribehandler.resub.reward.set', 'Reward for resubscribing set!');
$.lang.register('subscribehandler.giftsub.reward.set', 'Reward for resubscribing set!');
$.lang.register('subscribehandler.resub.reward.usage', 'Usage: !resubscribereward (amount)');
$.lang.register('subscribehandler.giftsub.reward.usage', 'Usage: !giftsubreward (amount)');
$.lang.register('subscribehandler.sub.count', 'There are currently $1 subscribers!');
$.lang.register('subscribehandler.sub.msg.set', 'New subscriber welcome message set!');
$.lang.register('subscribehandler.primesub.msg.set', 'New Twitch Prime subscriber welcome message set!');
$.lang.register('subscribehandler.sub.msg.usage', 'Usage: !submessage (message) - Tags: (name) and (reward)');
$.lang.register('subscribehandler.primesub.msg.usage', 'Usage: !primesubmessage (message) - Tags: (name) and (reward)');
$.lang.register('subscribehandler.sub.msg.noreward.set', 'New subscriber welcome message set for no rewards!');
$.lang.register('subscribehandler.sub.msg.noreward.usage', 'Usage: !submessage (message) - Tag: (name)');
$.lang.register('subscribehandler.resubemote.set', 'New resubscriber emote set!');
$.lang.register('subscribehandler.resubemote.usage', 'Usage: !resubemote (emote name)');
$.lang.register('subscribehandler.namesubplan.usage', 'Usage: !namesubplan [1|2|3|prime] (name of plan)');
$.lang.register('subscribehandler.namesubplan.show', 'The current name for subscription tier $1 is: $2');
$.lang.register('subscribehandler.namesubplan.set', 'The name for subscription tier $1 was changed to: $2');
