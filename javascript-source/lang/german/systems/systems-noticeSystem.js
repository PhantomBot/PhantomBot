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

$.lang.register('noticehandler.notice-config', 'Hinweis Einstellungen - [Hinweise umschalten: $1 / Intervall: $2 / Meldungsauslöser: $3 / Menge: $4 / Hinweis auch im Offline-Chat anzeigen: $5]');
$.lang.register('noticehandler.notice-usage', 'Verwendung: !notice [add / get / remove / edit / config / interval / req / toggle / toggleoffline]');
$.lang.register('noticehandler.notice-get-usage', 'Verwendung: !notice get (Hinweis-ID) - Hinweis-ID\'s gehen von 0 bis $1.');
$.lang.register('noticehandler.notice-error-notice-404', 'Dieser Hinweis existiert nicht.');
$.lang.register('noticehandler.notice-edit-usage', 'Verwendung: !notice edit (Hinweis-ID) (Nachricht) - Hinweis-ID\'s gehen von 0 bis $1.');
$.lang.register('noticehandler.notice-remove-usage', 'Verwendung: !notice remove (Hinweis-ID) - Hinweis-ID\'s gehen von 0 bis $1.');
$.lang.register('noticehandler.notice-edit-success', 'Hinweis geändert!');
$.lang.register('noticehandler.notice-remove-success', 'Hinweis gelöscht!');
$.lang.register('noticehandler.notice-add-success', 'Hinweis hinzugefügt!');
$.lang.register('noticehandler.notice-add-usage', 'Verwendung: !notice add (Nachricht)');
$.lang.register('noticehandler.notice-interval-usage', 'Verwendung: !notice interval (Intervall)');
$.lang.register('noticehandler.notice-interval-404', 'Der Hinweis-Intervall muss mehr als 2 Minuten betragen.');
$.lang.register('noticehandler.notice-inteval-success', 'Hinweis-Intervall gesetzt!');
$.lang.register('noticehandler.notice-req-success', 'Benötigte Nachrichten für Hinweis gesetzt!');
$.lang.register('noticehandler.notice-req-usage', 'Verwendung: !notice req (Benötigte Nachrichten)');
$.lang.register('noticehandler.notice-req-404', 'Benötigte Nachricht/en für Hinweis muss mindestens 1 sein.');
$.lang.register('noticehandler.notice-enabled', 'Hinweise wurden aktiviert!');
$.lang.register('noticehandler.notice-disabled', 'Hinweise wurden deaktiviert.');
$.lang.register('noticehandler.notice-enabled.offline', 'Hinweise werden nun auch im Offline-Chat gezeigt.');
$.lang.register('noticehandler.notice-disabled.offline', 'Hinweise werden nun nicht mehr im Offline-Chat angezeigt.');