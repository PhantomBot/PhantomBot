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

$.lang.register('ranks.edit.usage', 'Verwendung: !rankedit [add [Stunden] [Rangname] | del [Stunden] | custom [BenutzerInnenname] [Rangname] | customdel [Benutzername] | settime [Stunden] | setcost [Punkte]]');
$.lang.register('ranks.settime.usage', 'Verwendung: !rankedit settime [Stunden]');
$.lang.register('ranks.settime.success', 'Zeit für BenutzerIn zur Erstellung eines benutzerdefinierten Ranges auf $1 Stunden geändert.');
$.lang.register('ranks.setcost.usage', 'Verwendung: !rankedit setcost [$1]');
$.lang.register('ranks.setcost.success', 'Kosten für benutzerdefinierten Rang auf $1 $2 festgelegt.');
$.lang.register('ranks.custom.usage', 'Verwendung: !rankedit custom [BenutzerInnenname] [Rangname]');
$.lang.register('ranks.custom.404', 'Kann BenutzerIn für benutzerdefinierten Rang nicht finden: $1.');
$.lang.register('ranks.custom.success', '$1 erhielt den benutzerdefinierten Rang: $2.');
$.lang.register('ranks.customdel.usage', 'Verwendung: !rankedit customdel [BenutzerInnenname]');
$.lang.register('ranks.customdel.404', 'Für $1 existiert kein benutzerdefinierter Rang.');
$.lang.register('ranks.customdel.success', 'Benutzerdefinierten Rang von $1 entfernt.');
$.lang.register('ranks.add.usage', 'Verwendung: !rankedit add [Stunden] [Rangname]');
$.lang.register('ranks.add.success-new', 'Neuer Rang, $2, für $1 Stunden hinzugefügt.');
$.lang.register('ranks.add.success-update', 'Rang, $2, für $1 Stunden aktualisiert.');
$.lang.register('ranks.del.usage', 'Verwendung: !rankedit del [Stunden]');
$.lang.register('ranks.del.404', 'Kann Rang mit Stundenwert $1 nicht finden!');
$.lang.register('ranks.del.success', 'Rang mit Stundenwert $1 erfolgreich gelöscht.');
$.lang.register('ranks.rank.404', 'Es sind keine Ränge definiert!');
$.lang.register('ranks.rank.success', '$1 hat den Rang $2 erreicht und ist noch $3 Stunden von Rang $4 entfernt!');
$.lang.register('ranks.rank.norank.success', '$1 hat aktuell noch keinen Rang, ist aber nur noch $2 Stunden von Rang $3 entfernt!');
$.lang.register('ranks.rank.maxsuccess', '$1 hat den höchstmöglichen Rang, $2, erreicht! Gratulation!');
$.lang.register('ranks.rank.customsuccess', '$1 hat sich den Rang $2 gegeben!');
$.lang.register('ranks.set.usage', 'Verwendung: !rank set [Rangname] Erfordert $1 Stunden im Chat und $2 $3.');
$.lang.register('ranks.set.usage.nopoints', 'Verwendung: !rank set [Rangname] Erfordert $1 Stunden im Chat.');
$.lang.register('ranks.set.failure', 'Entweder nicht genug Stunden ($1), oder $2 ($3) um den Rang festzulegen!');
$.lang.register('ranks.set.failure.nopoints', 'Nicht genug Stunden ($1) um den Rang festzulegen!');
$.lang.register('ranks.set.success', 'Setzte Rang zu: $1');
$.lang.register('ranks.delself.404', 'Du hast keinen benutzerdefinierten Rang.');
$.lang.register('ranks.delself.success', 'Dein benutzerdefinierter Rang wurde erfolgreich gelöscht.');