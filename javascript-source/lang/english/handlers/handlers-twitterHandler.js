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

$.lang.register('twitter.tweet', '[Twitter Feed From @(twitterid)] $1');
$.lang.register('twitter.tweet.mention', '[Twitter Feed From @(twitterid)] @$1: $2');
$.lang.register('twitter.reward.announcement', 'Retweets from $1! Reward of $2 given!');
$.lang.register('twitter.usage', 'usage: !twitter [lasttweet | lastmention | lastretweet | set | post | id]');
$.lang.register('twitter.id', '$1 is on Twitter @$2: twitter.com/$2');
$.lang.register('twitter.usage.id', '(!twitter usage for usage)');
$.lang.register('twitter.set.usage', 'usage: !twitter set [message | polldelay | poll | post | updatetimer | reward]');
$.lang.register('twitter.set.polldelay.usage', 'usage: !twitter set polldelay [mentions | retweets | hometimeline | usertimeline]');
$.lang.register('twitter.set.polldelay.minerror', 'Too small of a poll delay, minimum is $1 for this setting.');
$.lang.register('twitter.set.polldelay.mentions.usage', 'usage: !twitter set polldelay mentions [seconds]. Minimum is 60. Currently $1.');
$.lang.register('twitter.set.polldelay.retweets.usage', 'usage: !twitter set polldelay rewteets [seconds]. Minimum is 60. Currently $1.');
$.lang.register('twitter.set.polldelay.hometimeline.usage', 'usage: !twitter set polldelay hometimeline [seconds]. Minimum is 60. Currently $1.');
$.lang.register('twitter.set.polldelay.usertimeline.usage', 'usage: !twitter set polldelay usertimeline [seconds]. Minimum is 15. Currently $1.');
$.lang.register('twitter.set.polldelay.mentions.success', 'Set Twitter polldelay mentions to $1 seconds.');
$.lang.register('twitter.set.polldelay.retweets.success', 'Set Twitter polldelay retweets to $1 seconds.');
$.lang.register('twitter.set.polldelay.hometimeline.success', 'Set Twitter polldelay hometimeline to $1 seconds.');
$.lang.register('twitter.set.polldelay.usertimeline.success', 'Set Twitter polldelay usertimeline to $1 seconds.');
$.lang.register('twitter.set.poll.usage', 'usage: !twitter set poll [mentions | retweets | hometimeline | usertimeline]');
$.lang.register('twitter.set.poll.mentions.usage', 'usage: !twitter set poll mentions [on/off]. Currently $1. Polls @mentions from Twitter.');
$.lang.register('twitter.set.poll.retweets.usage', 'usage: !twitter set poll retweets [on/off]. Currently $1. Polls your Retweets from Twitter.');
$.lang.register('twitter.set.poll.hometimeline.usage', 'usage: !twitter set poll hometimeline [on/off]. Currently $1. Polls your entire timeline on Twitter, includes all Tweets on your timeline from others. Disables all other polling.');
$.lang.register('twitter.set.poll.usertimeline.usage', 'usage: !twitter set poll usertimeline [on/off]. Currently $1. Polls your Tweets from Twitter.');
$.lang.register('twitter.set.poll.mentions.success', 'Set Twitter poll mentions to $1.');
$.lang.register('twitter.set.poll.retweets.success', 'Set Twitter poll retweets to $1.');
$.lang.register('twitter.set.poll.hometimeline.success', 'Set Twitter poll hometimeline to $1. Core will no longer poll anything else.');
$.lang.register('twitter.set.poll.usertimeline.success', 'Set Twitter poll usertimeline to $1.');
$.lang.register('twitter.set.post.usage', 'usage: !twitter set post [online | gamechange | update]');
$.lang.register('twitter.set.post.online.usage', 'usage: !twitter set post online [on/off]. Currently $1.');
$.lang.register('twitter.set.post.gamechange.usage', 'usage: !twitter set post gamechange [on/off]. Currently $1.');
$.lang.register('twitter.set.post.update.usage', 'usage: !twitter set post update [on/off]. Currently $1.');
$.lang.register('twitter.set.post.online.success', 'Set Twitter post online to $1.');
$.lang.register('twitter.set.post.gamechange.success', 'Set Twitter post gamechange to $1.');
$.lang.register('twitter.set.post.update.success', 'Set Twitter post update to $1.');
$.lang.register('twitter.set.message.usage', 'usage; !twitter set message [online | gamechange]');
$.lang.register('twitter.set.message.online.usage', 'usage: !twitter set message online [message]. Tags: (game) (twitchurl). Currently: $1');
$.lang.register('twitter.set.message.online.success', 'Set Twitter auto-post online message to $1');
$.lang.register('twitter.set.message.gamechange.usage', 'usage: !twitter set message gamechange [message]. Tags: (game) (twitchurl). Currently: $1');
$.lang.register('twitter.set.message.gamechange.success', 'Set Twitter auto-post game change message to $1');
$.lang.register('twitter.set.message.update.usage', 'usage: !twitter set message update [message]. Tags: (game) (twitchurl) (uptime). Currently: $1');
$.lang.register('twitter.set.message.update.success', 'Set Twitter auto-post update message to $1');
$.lang.register('twitter.set.updatetimer.usage', 'usage: !twitter set updatetimer [minutes]. Minimum allowed is 60 minutes to attempt to offset duplicate post rejection from Twitter.');
$.lang.register('twitter.set.updatetimer.toosmall', 'The minimum allowed value is 180 minutes to attempt to offset duplicate post rejection from Twitter.');
$.lang.register('twitter.set.updatetimer.success', 'Set Twitter updatetimer to $1 minutes.');
$.lang.register('twitter.set.reward.usage', 'usage: !twitter set reward [toggle | points | cooldown | announce]');
$.lang.register('twitter.set.reward.toggle.usage', 'usage: !twitter set reward toggle [on/off]. Currently $1. Toggle rewards for retweets.');
$.lang.register('twitter.set.reward.toggle.success', 'Set Twitter retweet rewards to $1.');
$.lang.register('twitter.set.reward.points.usage', 'usage: !twitter set reward points [points]. Currently $1. Set reward amount for rewtweets.');
$.lang.register('twitter.set.reward.points.success', 'Set Twitter retweet reward amount to $1.');
$.lang.register('twitter.set.reward.cooldown.usage', 'usage: !twitter set reward cooldown [hours]. Currently $1. Hours that user must wait between rewards.');
$.lang.register('twitter.set.reward.cooldown.success', 'Set Twitter retweet reward cooldown to $1 hours.');
$.lang.register('twitter.set.reward.announce.usage', 'usage: !twitter set reward announce [on/off]. Currently $1. Toggle announcing rewards for retweets.');
$.lang.register('twitter.set.reward.announce.success', 'Set Twitter retweet reward announcements to $1.');
$.lang.register('twitter.post.usage', 'usage: !twitter post [message]');
$.lang.register('twitter.post.sent', 'Sent to Twitter: $1');
$.lang.register('twitter.post.failed', 'Failed to send message to Twitter.');
$.lang.register('twitter.lasttweet', 'Last Tweet: $1');
$.lang.register('twitter.lasttweet.disabled', 'Not polling Tweets from home or user timeline.');
$.lang.register('twitter.lastmention', 'Last Mention: $1');
$.lang.register('twitter.lastmention.disabled', 'Not polling mentions.');
$.lang.register('twitter.lastretweet', 'Last Retweet: $1');
$.lang.register('twitter.lastretweet.disabled', 'Not polling retweets.');
$.lang.register('twitter.register.usage', 'usage: !twitter register [twitter_id]. Currently $1. Register/change your Twitter ID.');
$.lang.register('twitter.register.success', 'Registered your Twitter ID as $1. To unregister, run !twitter unregister.');
$.lang.register('twitter.register.notregistered', 'no ID is registered');
$.lang.register('twitter.register.inuse', 'Twitter ID is already registered: $1');
$.lang.register('twitter.unregister', 'Unregistered your Twitter ID.');
