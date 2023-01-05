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

$.lang.register('rafflesystem.open.error.opened', 'A raffle is currently in progress.');
$.lang.register('rafflesystem.open.usage', 'Usage: !raffle open [-usetime minutes | -usepoints entry_fee] [keyword] [close timer minutes] [-followers | -subscribers]. [keyword] required.');
$.lang.register('rafflesystem.open.time', 'A raffle is now opened! Type $1 to enter. You need to have been in chat for $2 minutes $3 to enter. $4');
$.lang.register('rafflesystem.open.points', 'A raffle is now opened! Type $1 to enter. Entering cost $2! $3');
$.lang.register('rafflesystem.open', 'A raffle is now opened! Type $1 to enter$2! $3');
$.lang.register('rafflesystem.close.error.closed', 'There is no raffle in progress.');
$.lang.register('rafflesystem.close.success', 'The raffle is now closed! No more entries will be counted. Use "!raffle draw" to pick a winner!');
$.lang.register('rafflesystem.winner.single', 'The winner of this raffle is $1! $2');
$.lang.register('rafflesystem.winner.multiple', 'The winners of this raffle are $1!');
$.lang.register('rafflesystem.winner.single.award', 'The winner has been awarded: $1!');
$.lang.register('rafflesystem.winner.multiple.award', 'The winners have been awarded: $1 each!');
$.lang.register('rafflesystem.whisper.winner', 'You won the raffle in channel $1!');
$.lang.register('rafflesystem.repick.error', 'There are no more users in the raffle list.');
$.lang.register('rafflesystem.enter.404', 'You already entered this raffle.');
$.lang.register('rafflesystem.enter.following', 'You need to be following to enter this raffle.');
$.lang.register('rafflesystem.enter.subscriber', 'You need to be subscribed to enter this raffle.');
$.lang.register('rafflesystem.enter.points', 'You don\'t have enough $1 to enter this raffle.');
$.lang.register('rafflesystem.enter.time', 'You have not been in the channel long enough to enter this raffle.');
$.lang.register('rafflesystem.usage', 'Usage: !raffle [open / close / draw / reset / lastWinners / results / subscriberbonus / regularbonus / whisperwinner / toggleopendraw / togglewarningmessages / togglerepicks / message / messagetimer]');
$.lang.register('rafflesystem.draw.usage', 'Usage: !raffle draw [amount (default = 1)] [prize points (default = 0)]');
$.lang.register('rafflesystem.results', 'A raffle is still opened! Keyword: $1 - Total entries: $2');
$.lang.register('rafflesystem.fee', ' - Entry fee: $1');
$.lang.register('rafflesystem.subbonus.usage', 'Usage: !raffle subscriberbonus [1-10]');
$.lang.register('rafflesystem.subbonus.set', 'Subscriber bonus luck set to $1!');
$.lang.register('rafflesystem.regbonus.usage', 'Usage: !raffle regularbonus [1-10]');
$.lang.register('rafflesystem.regbonus.set', 'Regular bonus luck set to $1!');
$.lang.register('rafflesystem.whisper.winner.toggle', 'Raffle winners will $1 be whispered.');
$.lang.register('rafflesystem.raffle.repick.toggle1', 'Raffle winners will no longer be repicked.');
$.lang.register('rafflesystem.raffle.repick.toggle2', 'Raffle winners will now be able to get repicked.');
$.lang.register('rafflesystem.message.usage', 'Usage: !raffle message [message]');
$.lang.register('rafflesystem.message.set', 'Raffle message has been set to: "$1".');
$.lang.register('rafflesystem.timer.usage', 'Usage: !raffle messagetimer [minutes]');
$.lang.register('rafflesystem.timer.set', 'Raffle message timer has been set to $1 minutes.');
$.lang.register('rafflesystem.common.following', 'You need to be following the channel');
$.lang.register('rafflesystem.common.timer', 'The raffle will close in $1 minutes.');
$.lang.register('rafflesystem.common.message', 'no longer');
$.lang.register('rafflesystem.open.keyword-exists', 'Keyword cannot be an existing command: $1');
$.lang.register('rafflesystem.winner.404', 'Could not pick a winner. No one entered this raffle.');
$.lang.register('rafflesystem.winner.none', 'No data about the last raffle found.');
$.lang.register('rafflesystem.isfollowing', '[Follower]');
$.lang.register('rafflesystem.isnotfollowing', '[Not a follower]');
$.lang.register('rafflesystem.reset', 'The raffle has been reset.');
$.lang.register('rafflesystem.opendraw.enable', 'Raffles winners can be drawn without closing the raffle.');
$.lang.register('rafflesystem.opendraw.disable', 'Raffles will automatically close when drawing a winner.');
