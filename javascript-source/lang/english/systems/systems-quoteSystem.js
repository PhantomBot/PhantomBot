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

$.lang.register('quotesystem.add.usage1', 'Usage: !addquote [quote]');
$.lang.register('quotesystem.add.usage2', 'Usage: !addquote [user] [quote]');
$.lang.register('quotesystem.add.offline', 'Only moderators may add quotes when the stream is offline.');
$.lang.register('quotesystem.add.success', 'Added new quote from $1 with id #$2.');
$.lang.register('quotesystem.del.usage', 'Usage: !delquote [quote id]');
$.lang.register('quotesystem.del.success', 'Deleted quote $1. There are $2 quotes now.');
$.lang.register('quotesystem.del.404', 'Could not delete quote $1... Are you sure it exists?');
$.lang.register('quotesystem.get.success', '[(id)] "(quote)", by (user) ((date))'); // Tags = (id) (quote) (user) (userrank) (game) (date) //
$.lang.register('quotesystem.get.404', 'Could not find quote $1... Are you sure it exists?');
$.lang.register('quotesystem.edit.usage', 'Usage: !editquote [quote id] [user|game|quote] text...]');
$.lang.register('quotesystem.edit.user.success', 'Updated user on quote $1 to $2.');
$.lang.register('quotesystem.edit.game.success', 'Updated game on quote $1 to $2.');
$.lang.register('quotesystem.edit.quote.success', 'Updated quote on quote $1 to $2.');
$.lang.register('quotesystem.edit.404', 'Could not find quote $1... Are you sure it exists?');
$.lang.register('quotesystem.quotemessage.usage', 'Usage: !quotemessage [message] (Tags: (id) (quote) (user) (userrank) (game) (date))');
$.lang.register('quotesystem.quotemessage.success', 'Changed the message used for quotes.');
$.lang.register('quotesystem.quotedateformat.usage', 'Usage: !quotedateformat [format] - Lookup SimpleDateFormat in the Java 11 documentation for format info. Current format: $1');
$.lang.register('quotesystem.quotedateformat.success', 'Changed the date format used for quotes.');
$.lang.register('quotesystem.searchquote.usage', 'Usage: !searchquote [text] (Must provide at least 5 characters)');
$.lang.register('quotesystem.searchquote.404', 'No matching quotes found.');
$.lang.register('quotesystem.searchquote.found', 'Quote IDs with matches: $1');
$.lang.register('quotesystem.twitchnames-disabled', 'Usernames for quotes won\'t be validated');
$.lang.register('quotesystem.twitchnames-enabled', 'Usernames for quotes will validated against users who have been in chat.');