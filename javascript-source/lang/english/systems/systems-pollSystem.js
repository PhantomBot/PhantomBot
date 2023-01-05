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

$.lang.register('pollsystem.vote.nopoll', 'There is currently no poll running.');
$.lang.register('pollsystem.vote.already', 'You have already voted!');
$.lang.register('pollsystem.vote.invalid', '"$1" is not a valid option!');
$.lang.register('pollsystem.vote.success', 'You have voted "$1" on "$2".');
$.lang.register('pollsystem.poll.started', '$1 started a poll for $2 seconds (minimum votes: $3): $4! Use "!vote [option]" to vote. Options: $5');
$.lang.register('pollsystem.poll.started.nottime', '$1 started a poll (minimum votes: $2): $3! Use "!vote [option]" to vote. Options: $4');
$.lang.register('pollsystem.poll.running', 'There is a poll running for "$1". Use "!vote [option]" to vote. The options are "$2".');
$.lang.register('pollsystem.poll.usage', 'Usage: !poll [open | results | close]');
$.lang.register('pollsystem.results.lastpoll', '[Last Poll]  - [Question: "$1"] - [Total Votes: $2] - [Result: "$3"] - [Options: "$4"] [Votes: $5]');
$.lang.register('pollsystem.results.running', 'A poll is currently running!');
$.lang.register('pollsystem.results.404', 'There is no latest poll to retrieve results from!');
$.lang.register('pollsystem.open.usage', 'Usage: !poll open "question" "option1, option2, ..." [seconds] [min votes].  If seconds is 0, defaults to 60.');
$.lang.register('pollsystem.open.moreoptions', 'More than one option is required for a poll.');
$.lang.register('pollsystem.runpoll.novotes', 'The poll on "$1" has ended! Not enough votes were cast!');
$.lang.register('pollsystem.runpoll.winner', 'The poll on "$1" has ended! The winner is "$2"!');
$.lang.register('pollsystem.runpoll.tie', 'The poll on "$1" has ended in a tie! Check !poll results.');
$.lang.register('pollsystem.runpoll.started', 'Poll started! Use "!poll close" to end the poll manually');
$.lang.register('pollsystem.close.nopoll', 'There is currently no poll running.');
