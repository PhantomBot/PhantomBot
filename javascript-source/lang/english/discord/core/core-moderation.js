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

$.lang.register('moderation.usage', 'Usage: !moderation [links / caps / spam / blacklist / whitelist / cleanup / logs]');
$.lang.register('moderation.links.usage', 'Usage: !moderation links [toggle / permittime]');
$.lang.register('moderation.links.toggle', 'Link moderation has been $1.');
$.lang.register('moderation.links.permit.time.usage', 'Usage: !moderation links permittime [seconds]');
$.lang.register('moderation.links.permit.time.set', 'Permit time has been set to $1 seconds!');
$.lang.register('moderation.caps.usage', 'Usage: !moderation caps [toggle / triggerlength / limitpercent]');
$.lang.register('moderation.caps.toggle', 'Cap moderation has been $1.');
$.lang.register('moderation.caps.trigger.usage', 'Usage: !moderation caps triggerlength [characters]');
$.lang.register('moderation.caps.trigger.set', 'Caps trigger limit has been set to $1%');
$.lang.register('moderation.caps.limit.usage', 'Usage: !moderation caps limitpercent [percent]');
$.lang.register('moderation.caps.limit.set', 'Caps limit has been set to $1%');
$.lang.register('moderation.long.message.usage', 'Usage: !moderation longmessage [toggle / limit]');
$.lang.register('moderation.long.message.toggle', 'Message length moderation has been $1.');
$.lang.register('moderation.long.message.limit.usage', 'Usage: !moderation longmessage limit [characters]');
$.lang.register('moderation.long.message.limit.set', 'Long message limit has been set to $1 characters!');
$.lang.register('moderation.spam.usage', 'Usage: !moderation spam [toggle / limit]');
$.lang.register('moderation.spam.toggle', 'Spam moderation has been $1.');
$.lang.register('moderation.spam.limit.usage', 'Usage: !moderation spam limit [messages]');
$.lang.register('moderation.spam.limit.set', 'Spam limit has been set to $1 messages!');
$.lang.register('moderation.blacklist.usage', 'Usage: !moderation blacklist [add / remove / list]');
$.lang.register('moderation.blacklist.add.usage', 'Usage: !moderation blacklist add [phrase]');
$.lang.register('moderation.blacklist.add.success', 'Phrase added the to the blacklist!');
$.lang.register('moderation.blacklist.remove.usage', 'Usage: !moderation blacklist remove [phrase]');
$.lang.register('moderation.blacklist.remove.404', 'That phrase is not in the blacklist.');
$.lang.register('moderation.blacklist.remove.success', 'Phrase removed from the blacklist!');
$.lang.register('moderation.blacklist.list.404', 'The blacklist is empty.');
$.lang.register('moderation.blacklist.list', 'Blacklist: ```$1```');
$.lang.register('moderation.whitelist.usage', 'Usage: !moderation whitelist [add / remove / list]');
$.lang.register('moderation.whitelist.add.usage', 'Usage: !moderation whitelist add [phrase or username#discriminator]');
$.lang.register('moderation.whitelist.add.success', 'Phrase or username added the to the whitelist!');
$.lang.register('moderation.whitelist.remove.usage', 'Usage: !moderation whitelist remove [phrase or username#discriminator]');
$.lang.register('moderation.whitelist.remove.404', 'That phrase or username is not in the whitelist.');
$.lang.register('moderation.whitelist.remove.success', 'Phrase or username removed from the whitelist!');
$.lang.register('moderation.whitelist.list.404', 'The whitelist is empty.');
$.lang.register('moderation.whitelist.list', 'Whitelist: ```$1```');
$.lang.register('moderation.cleanup.usage', 'Usage: !moderation cleanup [channel] [amount]');
$.lang.register('moderation.cleanup.err.amount', 'You can only delete 2 to 10000 messages.');
$.lang.register('moderation.cleanup.err.unknownchannel', 'Unknown channel: $1. Try discord\'s auto-completion.');
$.lang.register('moderation.cleanup.failed', 'Failed to perform bulk message deletion: Currently deleting messages.');
$.lang.register('moderation.cleanup.failed.err', 'Failed to perform bulk message deletion.');
$.lang.register('moderation.cleanup.done', 'Deleted $1 messages!');
$.lang.register('moderation.logs.toggle.usage', 'Usage: !moderation logs [toggle / channel] - Will toggle Twitch moderation logs being posted in Discord.');
$.lang.register('moderation.logs.toggle', 'Twitch moderation logs have been $1. **[Requires bot restart]**');
$.lang.register('moderation.logs.channel.usage', 'Usage: !moderation logs channel [channel name]');
$.lang.register('moderation.logs.channel.set', 'Twitch moderation log announcements will now be made in channel $1');
