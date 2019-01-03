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

$.lang.register('raidhandler.usage', 'Verwendung: !raid [username] | !raid [toggle / lookup / setreward / setincomingmessage / setnewincomingmessage / setoutgoingmessage / setoutgoingmessagespam]');
$.lang.register('raidhandler.toggle.enabled', 'Raid Nachricht wurde Aktiviert.');
$.lang.register('raidhandler.toggle.disabled', 'Raid Nachricht wurde Deaktiviert.');
$.lang.register('raidhandler.reward.usage', 'Verwendung: !raid setreward [Punktzahl]');
$.lang.register('raidhandler.reward.set', 'Raidbelohnung geändert zu: $1.');
$.lang.register('raidhandler.inc.message.usage', 'Usage: !raid setincomingmessage [Nachricht] - Variables: (username), (viewers), (url), (times) and (game)');
$.lang.register('raidhandler.inc.message.set', 'Nachricht für eingehende Raids geändert!');
$.lang.register('raidhandler.new.inc.message.usage', 'Verwendung: !raid setnewincomingmessage [Nachricht] - Variablen: (username), (viewers), (url), and (game)');
$.lang.register('raidhandler.new.inc.message.set', 'Nachricht für neuen eingehenden Raid geändert!');
$.lang.register('raidhandler.out.message.usage', 'Verwendung: !raid setoutgoingmessage [Nachricht] - Variablen: (username) & (url)');
$.lang.register('raidhandler.out.message.set', 'Nachricht für ausgehenden Raid geändert!');
$.lang.register('raidhandler.spam.amount.usage', 'Verwendung: !raid setoutgoingmessagespam [Menge] - Maximum ist 10 mal.');
$.lang.register('raidhandler.spam.amount.set', 'Anzahl an Spam Nachrichten für ausgehenden Raid geändert!');
$.lang.register('raidhandler.lookup.usage', 'Verwendung: !raid lookup [Benutzername]');
$.lang.register('raidhandler.lookup.user', '$1 hat den Kanal schon $2 mal geraidet. Zuletz am $3 mit $4 Zuschauern.');
$.lang.register('raidhandler.lookup.user.404', '$1 hat diesen Kanal noch nie geraidet.');
