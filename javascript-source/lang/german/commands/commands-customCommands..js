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

$.lang.register('customcommands.add.commandtag.invalid', '(command) Tag Befehl existiert nicht: $1');
$.lang.register('customcommands.delete.usage', 'Verwendung: !delcom (Befehl)');
$.lang.register('customcommands.enable.success', 'Der Befehl !$1 wurde reaktiviert.');
$.lang.register('customcommands.alias.success', 'Alias !$2 wurde erfolgreich für Befehl !$1 erstellt!');
$.lang.register('customcommands.set.price.success', 'Der Preis für !$1 wurde auf $2 $3 festgelegt.');
$.lang.register('customcommands.disable.success', 'Der Befehl !$1 wurde deaktiviert.');
$.lang.register('customcommands.botcommands', 'Befehle: $1');
$.lang.register('customcommands.add.commandtag.notfirst', '(command) -Tag muss am Anfang eines benutzerdefinierten Befehls stehen, wenn es verwendet werden soll.');
$.lang.register('customcommands.add.usage', 'Verwendung: !addcom (Befehl) (Nachricht)');
$.lang.register('customcommands.set.price.error.invalid', 'Gib bitte einen gültigen Preis von 0 oder höher ein.');
$.lang.register('customcommands.customapijson.err', '! $1: Bei der Verarbeitung der API ist ein Fehler aufgetreten.');
$.lang.register('customcommands.set.pay.error.404', 'Bitte wähle einen Befehl der existiert und für Nicht-Mods zur Verfügung steht!');
$.lang.register('customcommands.add.success', 'Befehl !$1 wurde erstellt!');
$.lang.register('customcommands.set.pay.usage', 'Verwendung: !paycom (Befehl) (Preis)');
$.lang.register('customcommands.enable.err', 'Dieser Befehl ist nicht deaktiviert.');
$.lang.register('customcommands.set.perm.404', 'Der Befehl $1 wurde nicht gefunden');
$.lang.register('customcommands.edit.editcom.alias', 'Sie können einen Alias nicht bearbeiten, verwenden Sie bitte Folgendes: !editcom !$1 $2');
$.lang.register('customcommands.botcommands.total', 'Seiten gesamt: $1 [Siehe auch: https://phantombot.tv/commands]');
$.lang.register('customcommands.set.price.error.404', 'Bitte wähle einen Befehl der existiert und für Nicht-Mods zur Verfügung steht!');
$.lang.register('customcommands.edit.success', 'Befehl !$1 wurde geändert!');
$.lang.register('customcommands.alias.delete.success', 'Der Alias !$1 wurde erfolgreich gelöscht!');
$.lang.register('customcommands.set.perm.unset.success', 'Alle rekursiven Berechtigungen für den Befehl $1 und alle zugehörigen Aliase wurden entfernt.');
$.lang.register('customcommands.add.disabled', 'Dieser Befehl ist aktuell deaktiviert. Lösche ihn um einen neuen hinzuzufügen oder reaktiviere ihn.');
$.lang.register('customcommands.set.perm.error.target404', 'Der Befehl !$1 existiert nicht!');
$.lang.register('customcommands.add.error', 'Dieser Befehl existiert bereits.');
$.lang.register('customcommands.reset.change.success', 'Der Zähler für $1 wurde auf $2 gesetzt.');
$.lang.register('customcommands.set.perm.success', 'Berechtigungen für Befehl: $1 gesetzt für Gruppe: $2 und höher.');
$.lang.register('customcommands.token.success', 'Token für Befehl gesetzt! $1! Stellen Sie sicher, dass Sie ein (Token) Subtag in die customapi-URL für diesen Befehl an der Stelle einfügen, an der er angezeigt werden soll.');
$.lang.register('customcommands.404.no.commands', 'Es gibt keine benutzerdefinierten Befehle, fügen Sie eins mit !addcom');
$.lang.register('customcommands.set.price.usage', 'Verwendung: !pricecom (Befehl) [Unterbefehl] [Unteraktion] (Preis). Optional: Unterbefehl und Unteraktion');
$.lang.register('customcommands.alias.error', 'Für "!$1", existiert bereits ein Alias. Lösche ihn vorher.');
$.lang.register('customcommands.edit.usage', 'Verwendung: !editcom (Befehl) (Nachricht)');
$.lang.register('customcommands.disable.err', 'Dieser Befehl ist bereits deaktiviert!');
$.lang.register('customcommands.reset.success', 'Der Zähler für !$1 wurde zurückgesetzt.');
$.lang.register('customcommands.alias.usage', 'Verwendung: !aliascom (Aliasname) (existierender Befehl) [Optionale Parameter]');
$.lang.register('customcommands.botcommands.error', 'Gib eine Zahl ein um eine Seite zu finden.');
$.lang.register('customcommands.enable.usage', 'Verwendung: !enablecom (Befehl)');
$.lang.register('customcommands.alias.error.target404', 'Der Ziel-Befehl existiert nicht!');
$.lang.register('customcommands.reset.change.fail', 'Ungültiger Zählerwert: $1');
$.lang.register('customcommands.edit.404', 'Du kannst einen Standardbefehl nicht überschreiben!');
$.lang.register('customcommands.delete.success', 'Der Befehl !$1 wurde gelöscht!');
$.lang.register('customcommands.set.pay.success', 'Die Vergütung für !$1 wurde auf $2 $3 festgelegt.');
$.lang.register('customcommands.set.pay.error.invalid', 'Bitte gib eine gültige Vergütung 0 oder höher ein!');
$.lang.register('customcommands.enable.404', 'Dieser Befehl existiert nicht!');
$.lang.register('customcommands.alias.error.exists', 'Für den Befehl gibt es schon einen Alias.');
$.lang.register('customcommands.set.perm.usage', 'Verwendung: !permcom (Befehlsname) (Gruppen-ID/Name). Beschränkt die Verwendung eines Befehls auf Zuschauer mit einer bestimmten Berechtigungsstufe.');
$.lang.register('customcommands.alias.delete.usage', 'Verwendung: !delalias (Aliasname)');
$.lang.register('customcommands.disable.404', 'Dieser Befehl existiert nicht!');
$.lang.register('customcommands.alias.delete.error.alias.404', 'Alias existiert nicht: !$1');
$.lang.register('customcommands.customapi.404', 'Der Befehl !$1 erfordert weitere Parameter.');
$.lang.register('customcommands.cmds', 'Aktuelle, benutzerdefinierte, Befehle: $1');
$.lang.register('customcommands.touser.offline', 'Es tut uns leid, aber $1 scheint offline zu sein!');
$.lang.register('customcommands.disable.usage', 'Verwendung: !disablecom (Befehl)');
$.lang.register('customcommands.token.usage', 'Verwendung:! tokencom (command) (token) — WARNUNG: Dies sollte über die Bot-Konsole oder Web-Panel erfolgen. Wenn Sie dies im Chat ausführen, kann jeder, der den Chat ansieht, Ihre Informationen kopieren!');
$.lang.register('customcommands.reset.usage', 'Verwendung: !resetcom (Befehl) (count). Wenn no (count), dann auf 0 zurücksetzen.');
