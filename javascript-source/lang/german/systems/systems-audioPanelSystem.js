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

$.lang.register('audiohook.usage', 'Verwendung: !audiohook [play / list / customcommand / togglemessages]');
$.lang.register('audiohook.play.usage', 'Verwendung: !audiohook play [audio_hook]');
$.lang.register('audiohook.play.404', 'Audiohook existiert nicht: $1');
$.lang.register('audiohook.play.success', 'Sende Audiohook: $1');
$.lang.register('audiohook.list', 'Audiohooks: $1');
$.lang.register('audiohook.list.total', 'Seiten Total: $1');
$.lang.register('audiohook.toggle', 'Audio-Meldungen wurden auf $1 gesetzt.');
$.lang.register('audiohook.customcommand.usage', 'Verwendung: !audiohook customcommand [add / remove] [Befehl] [Soundname]');
$.lang.register('audiohook.customcommand.add.usage', 'Verwendung: !audiohook customcommand add [Befehl] [Soundname]');
$.lang.register('audiohook.customcommand.add.error.exists', 'Dieser Befehl existiert bereits, oder wird als Alias verwendet.');
$.lang.register('audiohook.customcommand.add.list', 'Der Befehl, !$1, wird nun eine Liste aller Audio-Hook-Befehle ausgeben.');
$.lang.register('audiohook.customcommand.add.error.fx.null', 'Dieser Audio-Hook existiert nicht. Verwendung: "!audioHook list" um die Audioliste zu sehen.');
$.lang.register('audiohook.customcommand.add.success', 'Befehl, !$1, wird nun den Audio-Hook, $2, auslösen!');
$.lang.register('audiohook.customcommand.remove.usage', 'Verwendung: !audiohook customcommand remove [Befehl]');
$.lang.register('audiohook.customcommand.remove.error.404', 'Dieser Befehl existiert nicht!');
$.lang.register('audiohook.customcommand.remove.success', 'Befehl, !$1, wurde entfernt.');