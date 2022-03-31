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

$.lang.register('auctionsystem.usage', 'Usage: !auction open (increments) (minimum bid) [Optional parameters: (auto close timer) (nopoints)]');
$.lang.register('auctionsystem.set.usage', 'Usage: !auction set (extension timer). A maximum of 29 and a minimum of 6 is allowed');
$.lang.register('auctionsystem.set', 'Successfully set extension time to $1');
$.lang.register('auctionsystem.err.opened', 'An auction is already running.');
$.lang.register('auctionsystem.opened', 'Auction is now opened! You can bid in increments of at least $1. Minimum bid allowed is $2! Start bidding with !bid (amount)');
$.lang.register('auctionsystem.auto.timer.msg', 'Auction will auto close in $1 seconds!');
$.lang.register('auctionsystem.err.closed', 'There is no auction currently running.');
$.lang.register('auctionsystem.err.no.bids', 'Auction closed! No one placed a bid.');
$.lang.register('auctionsystem.closed', 'Auction closed! Winner of this auction is $1 with $2! Congratulations!');
$.lang.register('auctionsystem.warnTime.force', 'The auction closes in $1 seconds! Current top bidder is $2 with $3! Do we have $4?');
$.lang.register('auctionsystem.warnTime.newBid', 'New highest bidder is $2 with $3! The auction stays open for another $1 seconds! Do we have $4?');
$.lang.register('auctionsystem.warnTime', 'The auction closes in $1 seconds! Current top bidder is $2 with $3!');
$.lang.register('auctionsystem.warn.force', 'The auction is about to close! Current top bidder is $1 with $2! Do we have $3?');
$.lang.register('auctionsystem.warn', 'Current top bidder is $1 with $2!');
$.lang.register('auctionsystem.bid.usage', 'Usage: !bid (amount)');
$.lang.register('auctionsystem.err.bid.minimum', 'You can not bid under $1!');
$.lang.register('auctionsystem.err.points', 'You don\'t have enough $1 to bid. Your balance is $2');
$.lang.register('auctionsystem.err.increments', 'This auction is in increments of $1! Next bid is $2');
$.lang.register('auctionsystem.bid', '$1 just bid $2! Do we have $3?');
$.lang.register('auctionsystem.lastWinner.err', 'No auction has yet been completed! No winner to show.');
$.lang.register('auctionsystem.lastWinner', 'The last auctions\' winning bid was $2 from $1! Congratulations!');