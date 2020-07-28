/*
 * Copyright (C) 2016-2020 phantom.bot
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

$.lang.register('auctionsystem.usage', 'Usage: !auction open (increments) (minimum bid) (auto close timer)');
$.lang.register('auctionsystem.err.opened', 'An auction is already running.');
$.lang.register('auctionsystem.opened', 'Auction is now opened! You can bid in increments of at least $1. Minimum bid allowed is $2! Start bidding with !bid (amount)');
$.lang.register('auctionsystem.auto.timer.msg', 'Auction will auto close in $1 seconds!');
$.lang.register('auctionsystem.err.closed', 'There is no auction currently running.');
$.lang.register('auctionsystem.err.no.bids', 'Auction closed! No one placed a bid.');
$.lang.register('auctionsystem.closed', 'Auction closed! Winner of this auction is $1 with $2!');
$.lang.register('auctionsystem.warn.force', 'The auction is about to close! Current top bidder is $1 with $2! Do we have $3?');
$.lang.register('auctionsystem.warn', 'Current top bidder is $1 with $2!');
$.lang.register('auctionsystem.bid.usage', 'Usage: !bid (amount)');
$.lang.register('auctionsystem.err.bid.minimum', 'You can not bid under $1!');
$.lang.register('auctionsystem.err.points', 'You don\'t have that many $1 to auction.');
$.lang.register('auctionsystem.err.increments', 'This auction is in increments of $1!');
$.lang.register('auctionsystem.bid', '$1 just bid $2! Do we have $3?');
