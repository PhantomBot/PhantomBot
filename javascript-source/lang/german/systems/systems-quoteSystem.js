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

$.lang.register('quotesystem.add.usage1', 'Verwendung: !addquote [Zitat]');
$.lang.register('quotesystem.add.usage2', 'Verwendung: !addquote [Benutzer] [Zitat]');
$.lang.register('quotesystem.add.offline', 'Nur Moderatoren können Zitate hinzufügen, während der Stream offline ist.');
$.lang.register('quotesystem.add.success', 'Neues Zitat von $1, mit der ID #$2, hizugefügt.');
$.lang.register('quotesystem.del.usage', 'Verwedung: !delquote [Zitat ID]');
$.lang.register('quotesystem.del.success', 'Zitat $1 gelöscht. Es sind noch $2 Zitate vorhanden.');
$.lang.register('quotesystem.del.404', 'Konnte Zitat, $1, nicht löschen... Bist du sicher, dass es existiert?');
$.lang.register('quotesystem.get.success', '[(id)] "(quote)", von (user) ((date))'); // Tags = (id) (quote) (user) (game) (date) //
$.lang.register('quotesystem.get.404', 'Kann Zitat, $1, nicht finden... Bist du sicher, dass es existiert?');
$.lang.register('quotesystem.edit.usage', 'Verwendung: !editquote [Zitat ID] [user|game|quote] Text...]');
$.lang.register('quotesystem.edit.user.success', 'Benutzername in Zitat von $1, zu $2 geändert.');
$.lang.register('quotesystem.edit.game.success', 'Spiel in Zitat von $1, zu $2 geändert.');
$.lang.register('quotesystem.edit.quote.success', 'Zitat in Zitat von $1, zu $2 geändert.');
$.lang.register('quotesystem.edit.404', 'Kann Zitat $1 nicht finden... Bist du sicher, dass es existiert?');
$.lang.register('quotesystem.quotemessage.usage', 'Verwendung: !quotemessage [Nachricht] (Tags: (id) (quote) (user) (game) (date))');
$.lang.register('quotesystem.quotemessage.success', 'Nachricht zur Verwendung mit Zitaten geändert.');
$.lang.register('quotesystem.searchquote.usage', 'Verwendung: !searchquote [Text] (Muss eine Mindestlänge von 5 Zeichen haben.)');
$.lang.register('quotesystem.searchquote.404', 'Es konnten keine Übereinstimmungen gefunden werden!');
$.lang.register('quotesystem.searchquote.found', 'Zitat ID\'s mit Übereinstimmungen: $1');