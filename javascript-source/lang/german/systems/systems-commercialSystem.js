/*
 * Copyright (C) 2016-2020 phantombot.dev
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

$.lang.register('commercialsystem.autotimer.status-off', 'Werbespot Autotimer ist ausgeschaltet. Aktivieren: !commercial autotimer (interval_mins:8 oder höher) (length_secs:30,60,90,120,150,180) [Nachricht]');
$.lang.register('commercialsystem.autotimer.status-on-msg', 'Die Nachricht, die gesendet wird, wenn ein Auto Werbespot startet: $1');
$.lang.register('commercialsystem.autotimer.msg-set', 'Nachricht geändert, die gesendet wird, wenn ein Auto-Werbespot beginnt zu: $1');
$.lang.register('commercialsystem.usage', 'Verwendung: !commercial (length_secs:30,60,90,120,150,180) [silent] --oder-- !commercial autotimer');
$.lang.register('commercialsystem.run', 'Ausführen eines $1 Sekunden Werbespots');
$.lang.register('commercialsystem.autotimer.bad-parm', 'Fehler beim Festlegen des Autotimers. Der Intervall muss mindestens 8 Minuten betragen und die Länge muss eine von den folgenden sein: 30, 60, 90, 120, 150, 180');
$.lang.register('commercialsystem.autotimer.status-on-nomsg', 'Es wird keine Nachricht gesendet, wenn ein Auto-Werbespot gestartet wird');
$.lang.register('commercialsystem.autotimer.msg-del', 'Sende keine Nachricht mehr, wenn ein Auto-Werbespot gestartet wird');
$.lang.register('commercialsystem.autotimer.status-on', 'Werbespot Autotimer ist aktiviert. $1 Sekunden Werbespots alle $2 Minuten. Deaktivieren: !commercial autotimer off --oder-- Zum einfügen/ändern der Nachricht: !commercial autotimer message (Nachricht) --oder-- Zum entfernen der Nachricht: !commercial autotimer nomessage');
$.lang.register('commercialsystem.422', 'Werbespots können nur auf Kanälen Twitch-Partnern ausgeführt werden, einmal pro 8 Minuten, wenn der Stream live ist, für eine der folgenden Längen: 30, 60, 90, 120, 150, 180');
