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

$.lang.register('welcomesystem.set.autowelcome.enabled', 'Auto welcoming enabled. $1 will now welcome new chatters.');
$.lang.register('welcomesystem.set.autowelcome.disabled', 'Auto welcoming disabled.');
$.lang.register('welcomesystem.set.message.empty', '$1 will only welcome first time chatters.');
$.lang.register('welcomesystem.set.message.success', '$1 will welcome new chatters with "$2".');
$.lang.register('welcomesystem.set.firstmessage.empty', '$1 will welcome first time chatters with the default message.');
$.lang.register('welcomesystem.set.firstmessage.success', '$1 will welcome first time chatters with "$2".');
$.lang.register('welcomesystem.set.cooldown.show', 'Current cooldown: $1 hours. Use: !welcome cooldown hours to change it.');
$.lang.register('welcomesystem.set.cooldown.usage', 'Usege: !welcome cooldown [hours]. E.g. !welcome cooldown 6');
$.lang.register('welcomesystem.set.cooldown.success', 'Welcome cooldown set to $1 hours.');
$.lang.register('welcomesystem.set.disableuser.usage', 'Usage: !welcome disable user.');
$.lang.register('welcomesystem.set.disableuser.fail', 'Welcoming $1 is already disabled.');
$.lang.register('welcomesystem.set.disableuser.success', '$1 will not welcome $2.');
$.lang.register('welcomesystem.set.enableuser.usage', 'Usage: !welcome enable user.');
$.lang.register('welcomesystem.set.enableuser.fail', 'Welcoming  is already enabled.');
$.lang.register('welcomesystem.set.enableuser.success', '$1 will welcome $2.');
$.lang.register('welcomesystem.generalusage', 'Usage: !welcome [toggle | setmessage text | setfirstmessage text | disable user | enable user]. Tags for message text: (names), (1 text for one name), (2 for two), (3 for three or more names)');
$.lang.register('welcomesystem.names.join1', ', ');
$.lang.register('welcomesystem.names.join2', ', and ');
$.lang.register('welcomesystem.names.join3', ' and ');
