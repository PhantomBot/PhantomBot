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

$.lang.register('ranks.edit.usage', 'Usage: !rankedit [add [hours] [rankname] | del [hours] | custom [user] [rankname] | customdel [user] | settime [hours] | setcost [points]]');
$.lang.register('ranks.settime.usage', 'Usage: !rankedit settime [hours]');
$.lang.register('ranks.settime.success', 'Set time for users to create custom rank to $1 hours.');
$.lang.register('ranks.setcost.usage', 'Usage: !rankedit setcost [$1]');
$.lang.register('ranks.setcost.success', 'Set cost for users to create custom rank to $1 $2.');
$.lang.register('ranks.custom.usage', 'Usage: !rankedit custom [user] [rankname]');
$.lang.register('ranks.custom.404', 'Cannot find user to give a custom rank: $1');
$.lang.register('ranks.custom.success', '$1 has received a custom rank of: $2');
$.lang.register('ranks.customdel.usage', 'Usage: !rankedit customdel [user]');
$.lang.register('ranks.customdel.404', 'A custom rank does not exist for $1');
$.lang.register('ranks.customdel.success', 'Removed custom rank from $1');
$.lang.register('ranks.add.usage', 'Usage: !rankedit add [hour] [rankname]');
$.lang.register('ranks.add.success-new', 'Added new rank for hour $1 with name: $2');
$.lang.register('ranks.add.success-update', 'Updated rank for hour $1 with name: $2');
$.lang.register('ranks.del.usage', 'Usage: !rankedit del [hour]');
$.lang.register('ranks.del.404', 'Cannot find rank with hours value of $1');
$.lang.register('ranks.del.success', 'Deleted rank with hours value of $1');
$.lang.register('ranks.rank.404', 'There are no ranks defined!');
$.lang.register('ranks.rank.success', '$1 has reached the rank of $2 and is $3 hours away from rank $4!');
$.lang.register('ranks.rank.norank.success', '$1 does not yet have a rank but is $2 hours away from rank $3!');
$.lang.register('ranks.rank.maxsuccess', '$1 has reached the maximum rank of $2!');
$.lang.register('ranks.rank.customsuccess', '$1 has been designated the rank of $2!');
$.lang.register('ranks.set.usage', 'Usage: !rank set [rankname] Requires $1 hours in chat and $2 $3.');
$.lang.register('ranks.set.usage.nopoints', 'Usage: !rank set [rankname] Requires $1 hours in chat.');
$.lang.register('ranks.set.failure', 'Either not enough hours ($1) or $2 ($3) to set rank!');
$.lang.register('ranks.set.failure.nopoints', 'Not enough hours ($1) to set rank!');
$.lang.register('ranks.set.success', 'Set rank to: $1');
$.lang.register('ranks.delself.404', 'You do not have a custom rank.');
$.lang.register('ranks.delself.success', 'Deleted your custom rank.');
