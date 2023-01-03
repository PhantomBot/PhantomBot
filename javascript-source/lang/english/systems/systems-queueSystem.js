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

$.lang.register('queuesystem.open.error.opened', 'A queue is already opened.');
$.lang.register('queuesystem.open.error.usage', 'Usage: !queue open [size] [title] - Make the size zero if you want it to be unlimited.');
$.lang.register('queuesystem.open.usage', 'Usage: !queue open [size] [title]');
$.lang.register('queuesystem.open.error.clear', 'The previous queue was not cleared. Use "!queue clear" to clear it.');
$.lang.register('queuesystem.open.normal', 'The queue is now opened! Use !joinqueue [optional gamertag] to join it! $1');
$.lang.register('queuesystem.open.limit', 'The queue is now opened! Max entries are $1 users. Use !joinqueue [optional gamertag] to join it! $2');
$.lang.register('queuesystem.close.error', 'There is no queue opened.');
$.lang.register('queuesystem.close.success', 'The queue is now closed!');
$.lang.register('queuesystem.clear.success', 'The queue has been reset and cleared.');
$.lang.register('queuesystem.join.error.joined', 'You are already in the queue.');
$.lang.register('queuesystem.join.error.full', 'The queue is currently full.');
$.lang.register('queuesystem.remove.usage', 'Usage: !queue remove [username]');
$.lang.register('queuesystem.remove.404', 'That user does not seem to be in the queue.');
$.lang.register('queuesystem.remove.removed', 'User $1 has been removed from the queue!');
$.lang.register('queuesystem.info.success', 'Current queue informaton: Title: [$1], Users: [$2], Max Size: [$3], Opened At: [$4]');
$.lang.register('queuesystem.time.info', '($1 ago)');
$.lang.register('queuesystem.position.self', 'You are currently position #$1 in the queue and you joined at: $2');
$.lang.register('queuesystem.position.self.error', 'You are currently not in the queue.');
$.lang.register('queuesystem.position.other', '$1 is currently position #$2 in the queue and joined at: $3');
$.lang.register('queuesystem.position.other.error', '$1 is currently not in the queue.');
$.lang.register('queuesystem.queue.list', 'Current queue list: $1.');
$.lang.register('queuesystem.queue.list.limited', 'Current queue list: $1. (anti-spam +$2)');
$.lang.register('queuesystem.queue.list.empty', 'No users are in the queue.');
$.lang.register('queuesystem.queue.next', 'Users to be picked next are: $1.');
$.lang.register('queuesystem.gamertag', '(GamerTag: $1)');
$.lang.register('queuesystem.pick', 'Users picked: $1.');
$.lang.register('queuesystem.usage', 'Usage: !queue [open / close / clear / next / list / pick / random / position / info]');
