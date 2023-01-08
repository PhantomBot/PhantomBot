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

$.lang.register('pointsystem.add.all.success', '$1 have been sent to everybody in the channel!');
$.lang.register('pointsystem.add.all.usage', 'Usage: !points all [amount]');
$.lang.register('pointsystem.take.all.success', '$1 have been removed from everybody in the channel!');
$.lang.register('pointsystem.take.all.usage', 'Usage: !points takeall [amount]');
$.lang.register('pointsystem.add.error.negative', 'You can not give negative $1.');
$.lang.register('pointsystem.take.error.negative', 'You can not take negative $1.');
$.lang.register('pointsystem.add.success', 'Sent $1 to $2. New balance is $3.');
$.lang.register('pointsystem.add.usage', 'Usage: !points add [name] [amount]');
$.lang.register('pointsystem.user.success', '$1 currently has $2.');
$.lang.register('pointsystem.makeitrain.error.invalid', 'Sorry, but it\'s not possible to rain $1 at the moment.');
$.lang.register('pointsystem.makeitrain.error.needpoints', 'You can not afford to make it rain $1.');
$.lang.register('pointsystem.makeitrain.error.negative', 'You can not make it rain negative $1.');
$.lang.register('pointsystem.makeitrain.success', 'A rainstorm\'s incoming! Thanks to $1, everyone gets a bonus of up to $2 $3!');
$.lang.register('pointsystem.makeitrain.usage', 'Usage: !makeitrain [amount]');
$.lang.register('pointsystem.set.bonus.error.negative', 'You can not set the bonus per group level to negative $1.');
$.lang.register('pointsystem.set.bonus.success', 'Set the $1 bonus to $2 per group level.');
$.lang.register('pointsystem.set.bonus.usage', 'Usage: !points bonus [amount]');
$.lang.register('pointsystem.set.gain.error.negative', 'You can not set the amount of $1 gained to a negative number.');
$.lang.register('pointsystem.set.gain.offline.success', 'Set the $1 earnings to $2 every $3 minute(s) while the stream is offline.');
$.lang.register('pointsystem.set.gain.offline.usage', 'Usage: !points setofflinegain [amount], if you have !permissionpoints set, it will override this!');
$.lang.register('pointsystem.set.gain.success', 'Set the $1 earnings to $2 every $3 minute(s) while the stream is online.');
$.lang.register('pointsystem.set.gain.usage', 'Usage: !points setgain [amount], if you have !permissionpoints set, it will override this!');
$.lang.register('pointsystem.set.interval.error.negative', 'You can not set the $1 payout interval to negative minutes.');
$.lang.register('pointsystem.set.interval.offline.success', 'Set the $1 payout interval to $2 minute(s) when the stream is offline.');
$.lang.register('pointsystem.set.interval.offline.usage', 'Usage: !points setofflineinterval [amount]');
$.lang.register('pointsystem.set.interval.success', 'Set the $1 payout interval to $2 minute(s) when the stream is online.');
$.lang.register('pointsystem.set.interval.usage', 'Usage: !points setinterval [amount]');
$.lang.register('pointsystem.set.name.both.success', 'The name of the points have now been changed from "$1" to "$2". Set the name for a single $2 using !points setname single [name].');
$.lang.register('pointsystem.set.name.multiple.success', 'Name of multiple points successfully changed from "$1" to "$2". To set the name for a single $2 use !points setname single [name].');
$.lang.register('pointsystem.set.name.single.success', 'Name of a single point successfully changed from "$1" to "$2". To set the name for multiple $2 use !points setname multiple [name].');
$.lang.register('pointsystem.set.name.usage', 'Usage: !points setname [single | multiple | delete] [name].  Sets the single or multiple name for chat points or deletes the values.');
$.lang.register('pointsystem.set.name.delete', 'Removed custom point names.');
$.lang.register('pointsystem.set.name.duplicate', 'That is the current name of the custom point command.');
$.lang.register('pointsystem.setbalance.error.negative', 'You can not set a balance to negative $1.');
$.lang.register('pointsystem.setbalance.success', 'Set the $1 balance of $2 to $3.');
$.lang.register('pointsystem.setbalance.usage', 'Usage: !points set [name] [amount]');
$.lang.register('pointsystem.take.error.toomuch', 'You can not take more than what $1 has in $2.');
$.lang.register('pointsystem.take.success', 'Took $1 from $2. New balance is $3.');
$.lang.register('pointsystem.take.usage', 'Usage: !points take [name] [amount]');
$.lang.register('pointsystem.gift.usage', 'Usage: !gift [user] [amount]');
$.lang.register('pointsystem.gift.shortpoints', 'Sorry! You do not have enough points to send that gift!');
$.lang.register('pointsystem.gift.404', 'Sorry! That user does not seem to be registered with the chat yet!');
$.lang.register('pointsystem.gift.success', '$1 has sent a gift of $2 to $3.');
$.lang.register('pointsystem.usage.invalid', 'Invalid option passed to $1 command');
$.lang.register('pointsystem.err.negative', 'You can not gift less then 0 $1');
$.lang.register('pointsystem.err.penalty', 'Usage: !penalty [user] [time in minutes]');
$.lang.register('pointsystem.penalty.set', 'User: $1 will not gain points for the next $2.');
$.lang.register('pointsystem.reset.all', 'All points were deleted.');
$.lang.register('pointsystem.message.usage', 'Usage: !points setmessage [message] - Tags: (userprefix), (user), (points), (pointsname), (pointsstring), (time), and (rank)');
$.lang.register('pointsystem.message.set', 'Points message set to: $1');
$.lang.register('pointsystem.active.bonus.usage', 'Usage: !points setactivebonus [amount]');
$.lang.register('pointsystem.active.bonus.set', 'Active bonus set to $1');
$.lang.register('pointsystem.bonus.usage', 'Usage: !points bonus [amount] [for time]');
$.lang.register('pointsystem.bonus.say', 'For the next $1 I will be giving out $2 extra $3 at each payouts!');
