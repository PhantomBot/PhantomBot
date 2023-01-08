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

$.lang.register('permissions.reloadbots', 'Reloaded list of bots and users to not accumulate time or points.');
$.lang.register('permissions.current.listtoolong', 'There are over $1 to list, I suggest checking the viewerslist in the Twitch chat.');
$.lang.register('permissions.current.mods', 'Mods in channel: $1');
$.lang.register('permissions.current.users', 'Users in channel: $1');
$.lang.register('permissions.group.self.current', 'You currently have $1 permissions.');
$.lang.register('permissions.group.other.current', '$1 currently has $2 permissions.');
$.lang.register('permissions.group.set.error.abovegroup', 'You must have higher permissions than the person you are trying to promote!');
$.lang.register('permissions.group.set.error.samegroup', 'You cannot promote others to the same permission as you.');
$.lang.register('permissions.group.set.success', 'Permission for $1 changed to $2!');
$.lang.register('permissions.group.usage', 'Usage: !permission, !permission [name] [permissionID]');
$.lang.register('permissions.grouppoints.usage', 'Usage: !permissionpoints [permission name] [online|offline] [points]. points of -1 uses !setgain, !setofflinegain values.');
$.lang.register('permissions.grouppoints.showgroup', 'Permission $1 gains $2 $3 online and $4 $5 offline.');
$.lang.register('permissions.grouppoints.showgroup.online', '$1 gains $2 $3 online.');
$.lang.register('permissions.grouppoints.showgroup.offline', '$1 gains $2 $3 offline.');
$.lang.register('permissions.grouppoints.set.online', 'Set permission $1 to gain $2 $3 online.');
$.lang.register('permissions.grouppoints.set.offline', 'Set permission $1 to gain $2 $3 offline.');
$.lang.register('permissions.grouppoints.set.sub.error', 'You cannot promote anyone to Subscriber, this status is from Twitch.');
$.lang.register('permissions.swapsubscribervip.normal', 'Subscribers are now set as higher than VIPs (default).');
$.lang.register('permissions.swapsubscribervip.swapped', 'VIPs are now set as higher than Subscribers.');
$.lang.register('ignorelist', 'Current Ignored Bots: $1');
$.lang.register('ignorelist.listtoolong', 'There are over $1 to list, I suggest checking the ./addons/ignorebots.txt');
$.lang.register('ignoreadd.usage', 'Usage: !ignoreadd [username], to add a channel to the ignore list.');
$.lang.register('ignoreadd.added', '$1 has been added to the ignorebots.txt file.');
$.lang.register('ignoreadd.nouser', '$1 is already in the ignorebots.txt file.');
$.lang.register('ignoreremove.usage', 'Usage: !ignoreremove [username], to remove a channel from the ignore list.');
$.lang.register('ignoreremove.removed', '$1 has been removed from the ignorebots.txt file.');
$.lang.register('ignoreremove.nouser', '$1 in not currently in the ignorebots.txt file.');