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

$.lang.register('raidhandler.usage', 'Usage: !raid [username] | !raid [toggle / lookup / setreward / setincomingmessage / setnewincomingmessage / setoutgoingmessage / setoutgoingmessagespam]');
$.lang.register('raidhandler.toggle.enabled', 'Raid alerts have successfully been enabled.');
$.lang.register('raidhandler.toggle.disabled', 'Raid alerts have successfully been disabled.');
$.lang.register('raidhandler.reward.usage', 'Usage: !raid setreward [amount]');
$.lang.register('raidhandler.reward.set', 'Successfully set the raid reward to $1.');
$.lang.register('raidhandler.inc.message.usage', 'Usage: !raid setincomingmessage [message] - Variables: (username), (viewers), (url), (times) and (game)');
$.lang.register('raidhandler.inc.message.set', 'Successfully updated the incoming raid message!');
$.lang.register('raidhandler.new.inc.message.usage', 'Usage: !raid setnewincomingmessage [message] - Variables: (username), (viewers), (url), and (game)');
$.lang.register('raidhandler.new.inc.message.set', 'Successfully updated the new incoming raid message!');
$.lang.register('raidhandler.out.message.usage', 'Usage: !raid setoutgoingmessage [message] - Variables (username) and (url)');
$.lang.register('raidhandler.out.message.set', 'Successfully updated the outgoing raid message!');
$.lang.register('raidhandler.spam.amount.usage', 'Usage: !raid setoutgoingmessagespam [amount] - Maximum is 10 times.');
$.lang.register('raidhandler.spam.amount.set', 'Successfully updated the outgoing raid spam amount!');
$.lang.register('raidhandler.lookup.usage', 'Usage: !raid lookup [username]');
$.lang.register('raidhandler.lookup.user', '$1 has raided this channel a total of $2 time(s). Their last raid was on $3 with $4 viewers.');
$.lang.register('raidhandler.lookup.user.404', '$1 has never raided this channel.');
