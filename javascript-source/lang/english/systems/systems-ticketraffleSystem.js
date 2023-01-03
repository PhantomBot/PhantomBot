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

$.lang.register('ticketrafflesystem.err.raffle.opened', 'A ticket raffle is already opened.');
$.lang.register('ticketrafflesystem.err.missing.syntax', 'Usage: !traffle open [max entries] [regulars ticket multiplier (default = 1)] [subscribers ticket multiplier (default = 1)] [cost] [-followers]');
$.lang.register('ticketrafflesystem.msg.need.to.be.following', 'You need to be following to enter.');
$.lang.register('ticketrafflesystem.raffle.opened', 'Ticket raffle is now open! Buy up to $1 tickets with !tickets - you can purchase multiple times. Tickets cost $2. $3');
$.lang.register('ticketrafflesystem.err.raffle.not.opened', 'There is no ticket raffle opened.');
$.lang.register('ticketrafflesystem.draw.usage', 'Usage: !traffle draw [amount (default=1)] [loyalty points prize (default = 0)]');
$.lang.register('ticketrafflesystem.err.already.drawn', 'Winners were already drawn.');
$.lang.register('ticketrafflesystem.raffle.closed', 'The ticket raffle is now closed. Use "!traffle draw" to draw a winner.');
$.lang.register('ticketrafflesystem.raffle.closed.and.draw', 'The ticket raffle is now closed.');
$.lang.register('ticketrafflesystem.raffle.close.err', 'The ticket raffle ended. No one entered.');
$.lang.register('ticketrafflesystem.winner.single', 'The winner of this ticket raffle is: $1! $2');
$.lang.register('ticketrafflesystem.winner.multiple', 'The winners of this ticket raffle are: $1!');
$.lang.register('ticketrafflesystem.winner.single.award', 'The winner has been awarded: $1!');
$.lang.register('ticketrafflesystem.winner.multiple.award', 'The winners have been awarded: $1 each!');
$.lang.register('ticketrafflesystem.only.buy.amount', 'You can only buy $1 ticket(s)');
$.lang.register('ticketrafflesystem.only.buy.amount.limiter', 'You can only buy $1 ticket(s) because you receive a bonus of $2 %');
$.lang.register('ticketrafflesystem.limit.hit', 'You\'re only allowed to buy a maximum of $1 ticket(s). You currently have $2 tickets.');
$.lang.register('ticketrafflesystem.limit.hit.limiter', 'You\'re only allowed to buy a maximum of $1 ticket(s) because you receive a bonus of $2 %. You currently have $3 tickets.');
$.lang.register('ticketrafflesystem.limit.hit.bonus', 'You\'re only allowed to buy a maximum of $1 ticket(s). You currently have $2 (+ $3 bonus) tickets.');
$.lang.register('ticketrafflesystem.limit.hit.limiter.bonus', 'You\'re only allowed to buy a maximum of $1 ticket(s) because the you receive a bonus of $2 %. You currently have $3 (+ $4 bonus) tickets.');
$.lang.register('ticketrafflesystem.settings.err.open', 'You cannot change this setting while a raffle is open!');
$.lang.register('ticketrafflesystem.err.not.following', 'You need to be following to enter.');
$.lang.register('ticketrafflesystem.err.points', 'You don\'t have enough $1 to enter.');
$.lang.register('ticketrafflesystem.err.not.enoughUsers', 'Not enough users have entered to draw $1 winners.');
$.lang.register('ticketrafflesystem.entered', '$1 entries added to the ticket raffle! ($2 tickets in total)');
$.lang.register('ticketrafflesystem.entered.bonus', '$1 (+ $2 bonus) entries added to the ticket raffle! ($3 (+ $4 bonus) tickets in total)');
$.lang.register('ticketrafflesystem.usage', 'Usage: !traffle open [max entries] [regulars ticket multiplier (default = 1)] [subscribers ticket multiplier (default = 1)] [cost] [-followers]');
$.lang.register('ticketrafflesystem.msg.enabled', 'Ticket raffle message\'s have been enabled.');
$.lang.register('ticketrafflesystem.msg.disabled', 'Ticket raffle message\'s have been disabled.');
$.lang.register('ticketrafflesystem.limiter.enabled', 'Ticket limiter enabled. Bonus tickets count towards the ticket limit!');
$.lang.register('ticketrafflesystem.limiter.disabled', 'Ticket limiter disabled. Bonus tickets do not count towards the ticket limit!');
$.lang.register('ticketrafflesystem.ticket.usage', 'Usage: !tickets (amount / max) - And you currently have $1 tickets.');
$.lang.register('ticketrafflesystem.ticket.usage.bonus', 'Usage: !tickets (amount / max) - And you currently have $1 (+ $2 bonus) tickets.');
$.lang.register('ticketrafflesystem.auto.msginterval.set', 'Message interval set to $1 minutes.');
$.lang.register('ticketrafflesystem.auto.msg.set', 'Message set to $1.');
$.lang.register('ticketrafflesystem.auto.msg.usage', 'Usage: !traffle autoannouncemessage [amount in minutes]');
$.lang.register('ticketrafflesystem.auto.msginterval.usage', 'Usage: !traffle autoannounceinterval [amount in minutes]');
$.lang.register('ticketrafflesystem.reset', 'The raffle has been reset.');
$.lang.register('ticketrafflesystem.opendraw.enable', 'Ticket raffles winners can be drawn without closing the raffle.');
$.lang.register('ticketrafflesystem.opendraw.disable', 'Ticket raffles will automatically close when drawing a winner.');
