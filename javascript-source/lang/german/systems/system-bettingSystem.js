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

$.lang.register('bettingsystem.open.usage', 'Verwendung: !bet open ["Titel"] ["Option1, Option2, etc."] [Mindesteinsatz] [Höchsteinsatz] [Laufzeit in Minuten] - Die Anführungszeichen müssen für den Titel und die Optionen mit angegeben werden.');
$.lang.register('bettingsystem.open.error', 'Du musst erst eine Gewinnoption für die letzte Wette angeben, bevor du eine Neue eröffnen kannst. !bet close [Option]');
$.lang.register('bettingsystem.open.error.opened', 'Eine Wette ist bereits eröffnet.');
$.lang.register('bettingsystem.open.success', 'Eine Wette ist gerade eröffnet worden! "$1". Wettoptionen: "$2". Wette mit: !bet [Einsatz] [Option]');
$.lang.register('bettingsystem.close.error.usage', 'Die Wette ist nun geschlossen! Warte auf Gewinnresultat. !bet close [Gewinnoption]');
$.lang.register('bettingsystem.close.usage', 'Verwendung: !bet close [Gewinnoption]');
$.lang.register('bettingsystem.close.success', 'Die Wette ist nun geschlossen! Kalkuliere Resultate und zahle die Gewinne aus!');
$.lang.register('bettingsystem.close.semi.success', 'Die Wette ist nun geschlossen! Warte auf Gewinnoption.');
$.lang.register('bettingsystem.close.success.winners', 'Es haben $1 SpielerInnen die Wette gewonnen! Eine Gesamtsumme von $2 wurde ausgezahlt!');
$.lang.register('bettingsystem.save.format', 'Titel: "$1", Optionen: "$2", Gesamt platzierte Wetteinsätze: $3, Gesamt platzierte Wetten: $4, Gewonnene Punkte: $5.');
$.lang.register('bettingsystem.results', 'Aktuelle Wette: Titel: "$1", Optionen: "$2", Gesamtpunkte: $3, Gesamte Teilnehmer: $4');
$.lang.register('bettingsystem.global.usage', 'Verwendung: !bet [open / close / save / saveformat / lookup / results / togglemessages / gain]');
$.lang.register('bettingsystem.bet.usage', 'Verwendung: !bet [Wetteinsatz] [Option]');
$.lang.register('bettingsystem.bet.error.neg', 'Du kannst keinen negativen Wetteinsatz, $1, angeben!');
$.lang.register('bettingsystem.bet.error.min', 'Der Mindesteinsatz beträgt $1.');
$.lang.register('bettingsystem.bet.error.max', 'Der Maximaleinsatz beträgt $1.');
$.lang.register('bettingsystem.bet.error.points', 'Du hast nicht genug $1, um so viel einzusetzen.');
$.lang.register('bettingsystem.bet.betplaced', 'Du hast eine Wette in der Höhe von $1, auf die Option $2, platziert.');
$.lang.register('bettingsystem.bet.null', 'Das ist keine gültige Wettoption.');
$.lang.register('bettingsystem.toggle.save', 'Wettresultate werden $1 nach Abschluß gespeichert.');
$.lang.register('bettingsystem.warning.messages', 'Warnhinweise werden $1 im Chat angezeigt.');
$.lang.register('bettingsystem.saveformat.usage', 'Verwendung: !bet saveformat [Datumsformat] - Standard ist yy.M.dd');
$.lang.register('bettingsystem.saveformat.set', 'Speicherformat geändert zu $1.');
$.lang.register('bettingsystem.gain.usage', 'Verwendung: !bet gain [Prozent]');
$.lang.register('bettingsystem.gain.set', 'Gewinnausschüttung auf $1% festgelegt.');
$.lang.register('bettingsystem.lookup.usage', 'Verwendung: !bet lookup [$1] - nutze _# nach dem Dateum wenn du mehrere Gewinnespiele am Tag machst.');
$.lang.register('bettingsystem.lookup.show', 'Wette von [$1] $2');
$.lang.register('bettingsystem.lookup.null', 'An diesem Tag wurden keine Wetten abgegeben.');
$.lang.register('bettingsystem.now', 'jetzt');
$.lang.register('bettingsystem.not', 'nicht');