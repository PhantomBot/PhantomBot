/*
 * Copyright (C) 2016-2018 phantombot.tv
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

//ignore command
$.lang.register('ignore.usage', '!ignorelist, to check the list of current bots to ignore. !ignoreadd, to add a new bot to the bot ignore list. !ignoreremove, to remove a bot from the current bot list.');

//ignorelist command
$.lang.register('ignorelist', 'Current Ignored Bots: $1');

//ignoreadd command
$.lang.register('ignoreadd.usage', 'Usage: !ignoreadd [username], to add a channel to the ignore list.');
$.lang.register('ignoreadd.added', '$1 has been added to the ignorebots.txt file.');
$.lang.register('ignoreadd.nouser', '$1 is already in the ignorebots.txt file.');

//ignoreremove command
$.lang.register('ignoreremove.usage', 'Usage: !ignoreremove [username], to remove a channel from the ignore list.');
$.lang.register('ignoreremove.removed', '$1 has been removed from the ignorebots.txt file.');
$.lang.register('ignoreremove.nouser', '$1 in not currently in the ignorebots.txt file.');