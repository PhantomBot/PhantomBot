/*
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

$.lang.register('donationhandler.donation.new', 'Thank you very much (name) for the tip of $(amount) (currency)!');
$.lang.register('donationhandler.donation.newreward', 'Thank you very much (name) for the tip of $(amount) (currency)! Here are (points) (pointname)!');
$.lang.register('donationhandler.lastdonation.no-donations', 'There are presently no tips.');
$.lang.register('donationhandler.lastdonation.404', 'Cannot find last tip!');
$.lang.register('donationhandler.lastdonation.success', 'The last tip was from (name) in the amount of $(amount) (currency).');
$.lang.register('donationhandler.donations.usage', 'Usage: !streamlabs (announce | rewardmultiplier n.n | message | lastmessage | currencycode)');
$.lang.register('donationhandler.donations.announce.disable', 'Tips will no longer be announced.');
$.lang.register('donationhandler.donations.announce.enable', 'Tips will now be announced.');
$.lang.register('donationhandler.donations.reward.usage', 'Usage: !streamlabs rewardmultiplier [n.n]  Set to 0 to disable');
$.lang.register('donationhandler.donations.reward.success', 'The reward for tips has been set to $1 $2 per whole amount of currency donated.');
$.lang.register('donationhandler.donations.message.usage', 'Usage: !streamlabs message [message] Tags: (name) (amount) (currency) (message)');
$.lang.register('donationhandler.donations.rewardmessage.usage', 'Usage: !streamlabs rewardmessage [message] Tags: (name) (amount) (currency) (points) (pointname) (message)');
$.lang.register('donationhandler.donations.message.no-name', 'A (name) tag was not provided, at a minimum provide the (name) tag. Tags: (name) (amount) (currency) (message)');
$.lang.register('donationhandler.donations.rewardmessage.no-name', 'A (name) tag was not provided, at a minimum provide the (name) tag. Tags: (name) (amount) (currency) (points) (pointname) (message)');
$.lang.register('donationhandler.donations.message.success', 'Updated the message for tips when rewards are disabled.');
$.lang.register('donationhandler.donations.rewardmessage.success', 'Updated the message for tips with rewards enabled.');
$.lang.register('donationhandler.enabled.donators', 'The donators group has been enabled.');
$.lang.register('donationhandler.disabled.donators', 'The donators group has been disabled.');
$.lang.register('donationhandler.donators.min', 'The minimum before being promoted to a Donator was set to $1');
$.lang.register('donationhandler.donators.min.usage', 'Usage: !streamlabs minmumbeforepromotion [amount]');
$.lang.register('donationhandler.streamlabs.currencycode.usage', 'Usage: !streamlabs currencycode [code] - You can find a valid list here: https://twitchalerts.readme.io/v1.0/docs/currency-codes');
$.lang.register('donationhandler.streamlabs.currencycode.success', 'The currency code for Streamlabs donations is now set to: $1');
$.lang.register('donationhandler.streamlabs.currencycode.success-erase', 'The currency code for Streamlabs donations has been removed, all donations will now appear in their original currency');
