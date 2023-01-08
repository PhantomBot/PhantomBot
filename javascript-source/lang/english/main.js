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

$.lang.register('cmd.404', 'command !$1 does not exist or is not registered.');
$.lang.register('cmd.adminonly', 'Only an Administrator has access to that command!');
$.lang.register('cmd.casteronly', 'Only a Caster has access to that command!');
$.lang.register('cmd.modonly', 'Only a Moderator has access to that command!');
$.lang.register('cmd.useronly', 'Only $1 has access to that command!');
$.lang.register('cmd.needpoints', 'That command costs $1, which you don\'t have.');
$.lang.register('cmd.perm.404', 'you do not have access to that command. Only $1 or higher can access it.');
$.lang.register('commandlist.commands', 'Commands (page $1 of $2): $3');
$.lang.register('commandlist.more', ' >> Type "!commands $1" for more');
$.lang.register('commandlist.nocommands', 'There are currently no commands available to you');
$.lang.register('commandlist.nopage', 'page $1 does not exist!');
$.lang.register('commandlist.progress', 'Exporting commands... $1%');
$.lang.register('common.disabled', 'disabled');
$.lang.register('common.enabled', 'enabled');
$.lang.register('common.user-error', 'You must specify a user to target with this command');
$.lang.register('common.user.404', 'The user "$1" has not visited this channel yet.');
$.lang.register('common.game.change', 'Changed the current game to: $1');
$.lang.register('common.communities.change', 'Communities have been updated!');
$.lang.register('common.title.change', 'Changed the current title to: $1');
$.lang.register('common.twitch.no.status', 'not sure, neither is Twitch');
$.lang.register('common.twitch.no.game', 'not sure, neither is Twitch');
$.lang.register('console.received.clearchat', 'Received a clear chat notification from jtv');
$.lang.register('console.received.irsprivmsg', 'Received a PM from $1: $2');
$.lang.register('console.received.purgetimeoutban', 'Received a purge/timeout/ban notification on user $1 from jtv');
$.lang.register('console.received.r9k.end', 'Received an end r9k mode notification from jtv');
$.lang.register('console.received.r9k.start', 'Received a start r9k mode notification from jtv');
$.lang.register('console.received.slowmode.end', 'Received an end slow mode notification from jtv');
$.lang.register('console.received.slowmode.start', 'Received a start slow mode ($1) notification from jtv');
$.lang.register('console.received.subscriberonly.end', 'Received an end subscribers-only mode notification from jtv');
$.lang.register('console.received.subscriberonly.start', 'Received a start subscribers-only mode notification from jtv');
$.lang.register('init.cmsgset', 'Connected message set!');
$.lang.register('init.module.404', 'That module does not exist or is not loaded!');
$.lang.register('init.module.check.disabled', 'Module $1 is currently disabled!');
$.lang.register('init.module.check.enabled', 'Module $1 is currently enabled!');
$.lang.register('init.module.auto-disabled', 'Modules related to the points system have been disabled.');
$.lang.register('init.module.disabled', 'Module "$1" disabled!');
$.lang.register('init.module.enabled', 'Module "$1" enabled!');
$.lang.register('init.module.error', 'Module "$1" enabled but did not initialize! Check error logs!');
$.lang.register('init.module.list', 'Modules: $1');
$.lang.register('init.module.list.total', 'Total Pages: $1');
$.lang.register('init.module.usage', 'Usage: !module [list / enabled / delete / status / reload]');
$.lang.register('init.module.usage.disable', 'Usage: !module disable [module path]');
$.lang.register('init.module.usage.status', 'Usage: !module status [module path]');
$.lang.register('init.module.usage.enable', 'Usage: !module enable [module path]');
$.lang.register('init.module.delete.usage', 'Usage: !module delete [module_name] - Deletes entry from DB! Use for modules removed from disk!');
$.lang.register('init.module.delete.success', 'Module deleted from DB: $1');
$.lang.register('init.module.delete.404', 'Module not found in DB: $1');
$.lang.register('init.module.reload.usage', 'Usage: !module reload [all / module path] - Force reload all or a single module!');
$.lang.register('init.module.reload.all', 'All modules reloaded!');
$.lang.register('init.module.reload', 'Module $1 reloaded!');
$.lang.register('init.module.reload.404', 'Module not found in DB: $1');
$.lang.register('init.reconnect', 'Reconnecting to TMI and PubSub');
$.lang.register('init.disconnect', 'Shutting down');
$.lang.register('init.usage', '!$1 [reconnect / disconnect]');
$.lang.register('init.forceonline', 'Forcing status to online');
$.lang.register('init.forceoffline', 'Forcing status to offline');
$.lang.register('init.connected.msg', 'Connect message set to: $1');
$.lang.register('init.connected.msg.usage', '!$1 connectmessage [message]');
$.lang.register('init.connected.msg.removed', 'Connect message removed!');
$.lang.register('init.blacklist.usage', 'Usage: !$1 blacklist [add / remove]');
$.lang.register('init.blacklist.add.usage', 'Usage: !$1 blacklist add (username)');
$.lang.register('init.blacklist.added', 'added $1 to the bot blacklist!');
$.lang.register('init.blacklist.remove.usage', 'Usage: !$1 blacklist remove (username)');
$.lang.register('init.blacklist.err', 'that user is not in the blacklist.');
$.lang.register('init.blacklist.removed', 'removed $1 from the bot blacklist!');
$.lang.register('init.mod.toggle.on.pay', 'moderators+ will now pay for commands.');
$.lang.register('init.mod.toggle.off.pay', 'moderators+ will no longer pay for commands.');
$.lang.register('init.mod.toggle.perm.msg.off', 'No permission messages have been disabled.');
$.lang.register('init.mod.toggle.perm.msg.on', 'No permission messages have been enabled.');
$.lang.register('init.mod.toggle.price.msg.off', 'The price message has been disabled.');
$.lang.register('init.mod.toggle.price.msg.on', 'The price message has been enabled.');
$.lang.register('init.toggle.cooldown.msg.on', 'The cooldown message has been enabled.');
$.lang.register('init.toggle.cooldown.msg.off', 'The cooldown message has been disabled.');
$.lang.register('init.cooldown.msg.global', 'command !$1 is still on a global cooldown. ($2 seconds left)');
$.lang.register('init.cooldown.msg.user', 'command !$1 is still on cooldown for you. ($2 seconds left)');
$.lang.register('whisper.whispers.disabled', '[Whisper Mode] has been disabled.');
$.lang.register('whisper.whispers.enabled', '[Whisper Mode] has been enabled.');
$.lang.register('common.hours', ' hours, ');
$.lang.register('common.hours2', ' hours, ');
$.lang.register('common.hours3', ' hours');
$.lang.register('common.minutes', ' minutes and ');
$.lang.register('common.minutes2', ' minutes.');
$.lang.register('common.seconds', ' seconds');
$.lang.register('common.get.age.days', '$1 $2 has been on Twitch since $3. (Joined $4 days ago)');
$.lang.register('common.get.age', '$1 $2 has been on Twitch since $3.');
$.lang.register('channel.age.user.404', 'That user is not on Twitch.');
$.lang.register('main.donation.last.tip.message', 'Last tip from: $1 ($2 $3)');
$.lang.register('common.time.month', 'month');
$.lang.register('common.time.months', 'months');
$.lang.register('common.time.day', 'day');
$.lang.register('common.time.days', 'days');
$.lang.register('common.time.hour', 'hour');
$.lang.register('common.time.hours', 'hours');
$.lang.register('common.time.minute', 'minute');
$.lang.register('common.time.minutes', 'minutes');
$.lang.register('common.time.second', 'second');
$.lang.register('common.time.seconds', 'seconds');
$.lang.register('common.time.and', ', and ');
$.lang.register('common.time.nostart', 'looks like that has not started');
$.lang.register('common.time.expired', 'looks like that has expired');
