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

$.lang.register('customcommands.add.error', 'Dieser Befehl existiert bereits!');
$.lang.register('customcommands.add.success', 'Befehl !$1 wurde erstellt!');
$.lang.register('customcommands.add.usage', 'Verwendung: !addcom (Befehl) (Nachricht)');
$.lang.register('customcommands.add.commandtag.notfirst', 'Der (command) Tag muss am Beginn eines benutzerdefinierten Befehls stehen, wenn verwendet.');
$.lang.register('customcommands.add.commandtag.invalid', '(command) Tag command existiert nicht: $1');
$.lang.register('customcommands.alias.delete.error.alias.404', 'Alias existiert nicht: !$1');
$.lang.register('customcommands.alias.delete.success', 'Der Alias, !$1, wurde erfolgreich gelöscht!');
$.lang.register('customcommands.alias.delete.usage', 'Verwendung: !delalias (Aliasname)');
$.lang.register('customcommands.alias.error', 'Für, !$1, existiert bereits ein Alias. Lösche ihn vorher.');
$.lang.register('customcommands.alias.error.target404', 'Der Ziel-Befehl existiert nicht!');
$.lang.register('customcommands.alias.error.exists', 'Für den Befehl gibt es schon einen Alias.');
$.lang.register('customcommands.add.disabled', 'Dieser Befehl ist aktuell deaktiviert. Lösche ihn um einen neuen hinzuzufügen oder reaktiviere ihn.');
$.lang.register('customcommands.alias.success', 'Alias !$2 wurde erfolgreich für Befehl, !$1, erstellt!');
$.lang.register('customcommands.alias.usage', 'Verwendung: !aliascom (Aliasname) (existierender Befehl) [Optionale Parameter]');
$.lang.register('customcommands.delete.success', 'Der Befehl, !$1, wurde gelöscht!');
$.lang.register('customcommands.delete.usage', 'Verwendung: !delcom (Befehl)');
$.lang.register('customcommands.edit.404', 'Du kannst einen Standardbefehl nicht überschreiben!');
$.lang.register('customcommands.set.perm.error.target404', 'Der Befehl, !$1, existiert nicht!');
$.lang.register('customcommands.set.perm.success', 'Berechtigungen für Befehl, $1, zu Gruppe, $2, und höher vergeben.');
$.lang.register('customcommands.set.perm.unset.success', 'Alle rekursiven Berechtigungen für den Befehl, $1, und all seinen Aliassen wurden entfernt.');
$.lang.register('customcommands.set.perm.usage', 'Verwendung: !permcom (Befehlsname) (Gruppen-ID/Name). Beschränkt die Verwendung eines Befehls auf die Zuschauer einer bestimmten Berechtigungsstufe.');
$.lang.register('customcommands.set.perm.404', 'Der Befehl, $1, scheint nicht zu existieren!');
$.lang.register('customcommands.set.price.error.404', 'Bitte wähle einen Befehl der existiert und für Nicht-Mods zur Verfügung steht!');
$.lang.register('customcommands.set.price.error.invalid', 'Bitte gib einen gültigen Preis, 0, oder höher, ein!');
$.lang.register('customcommands.set.price.success', 'Der Preis für, !$1, wurde auf, $2 $3, festgelegt.');
$.lang.register('customcommands.set.price.usage', 'Verwendung: !pricecom (Befehl) [Unterbefehl] [Unteraktion] (Preis). Optional: Unterbefehl und Unteraktion');
$.lang.register('customcommands.set.pay.error.404', 'Bitte wähle einen Befehl der existiert und für Nicht-Mods zur Verfügung steht!');
$.lang.register('customcommands.set.pay.error.invalid', 'Bitte gib eine gültige Vergütung, 0, oder höher, ein!');
$.lang.register('customcommands.set.pay.success', 'Die Vergütung für, !$1, wurde auf, $2 $3, festgelegt.');
$.lang.register('customcommands.set.pay.usage', 'Verwendung: !paycom (Befehl) (Preis)');
$.lang.register('customcommands.404.no.commands', 'Es sind keine benutzerdefinierten Befehle verfügbar, füge einen mit !addcom hinzu.');
$.lang.register('customcommands.cmds', 'Aktuelle, benutzerdefinierte, Befehle: $1');
$.lang.register('customcommands.edit.usage', 'Verwendung: !editcom (Befehl) (Nachricht)');
$.lang.register('customcommands.edit.success', 'Befehl, !$1, wurde geändert!');
$.lang.register('customcommands.touser.offline', 'Sorry, aber $1 scheint offline zu sein!');
$.lang.register('customcommands.customapi.404', 'Der Befehl, !$1, erfordert weitere Parameter.');
$.lang.register('customcommands.customapijson.err', '!$1: In der API-Verarbeitung ist ein Fehler aufgetreten!');
$.lang.register('customcommands.disable.usage', 'Verwendung: !disablecom (Befehl)');
$.lang.register('customcommands.disable.404', 'Dieser Befehl existiert nicht!');
$.lang.register('customcommands.disable.err', 'Dieser Befehl ist bereits deaktiviert!');
$.lang.register('customcommands.disable.success', 'Der Befehl, !$1, wurde deaktiviert.');
$.lang.register('customcommands.enable.usage', 'Verwendung: !enablecom (Befehl)');
$.lang.register('customcommands.enable.404', 'Dieser Befehl existiert nicht!');
$.lang.register('customcommands.enable.err', 'Dieser Befehl ist bereits aktiviert!');
$.lang.register('customcommands.enable.success', 'Der Befehl, !$1, wurde reaktiviert.');
$.lang.register('customcommands.reset.usage', 'Verwendung: !resetcom (command) (count). If no (count) then reset to 0.');
$.lang.register('customcommands.reset.success', 'Der Zähler für !$1 wurde zurückgesetzt.');
$.lang.register('customcommands.reset.change.fail', 'Ungültiger Zählerwert: $1');
$.lang.register('customcommands.reset.change.success', 'Der zähler für !$1 wurde auf $2 gesetzt.');
$.lang.register('customcommands.botcommands', 'Befehle: $1');
$.lang.register('customcommands.botcommands.error', 'Gib eine Zahl ein um eine Seite zu finden.');
$.lang.register('customcommands.botcommands.total', 'Seiten gesamt: $1 [Siehe auch: https://phantombot.tv/commands]');
