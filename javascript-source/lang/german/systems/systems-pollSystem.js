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

$.lang.register('pollsystem.vote.nopoll', 'Derzeit ist keine Umfrage aktiv.');
$.lang.register('pollsystem.vote.already', 'Du hast schon abgestimmt.');
$.lang.register('pollsystem.vote.invalid', '"$1" ist keine gültige Option!');
$.lang.register('pollsystem.vote.success', 'Du hast "$1" an "$2" gewählt.');
$.lang.register('pollsystem.poll.started', '$1 hat für $2 Sekunden eine Umfrage gestartet (Minimal abgegebene Stimmen: $3): $4! Verwende "!vote [Option]" zum abstimmen. Optionen: $5');
$.lang.register('pollsystem.poll.started.notime', '$1 hat eine Umfrage gestartet (Minimale Stimmen: $2): $3! Verwende "!vote [Option]" um abzustimmen. Optionen: $4');
$.lang.register('pollsystem.poll.running', 'Es läuft gerade für "$1" eine Umfrage. Verwende "!vote [Option]" zum abstimmen. Die Optionen sind "$2".');
$.lang.register('pollsystem.poll.usage', 'Verwendung: !poll [open | results | close]');
$.lang.register('pollsystem.results.lastpoll', '[Letzte Umfrage]  - [Frage: "$1"] - [Stimmen gesamt: $2] - [Ergebnis: "$3"] - [Optionen: "$4"] [Stimmen: $5]');
$.lang.register('pollsystem.results.running', 'Es läuft bereits eine Umfrage!');
$.lang.register('pollsystem.results.404', 'Es ist keine vorangegangenene Umfrage vorhanden um Ergebnisse anzuzeigen!');
$.lang.register('pollsystem.open.usage', 'Verwendung: !poll open "Frage" "Option1, Option2, ..." [Sekunden] [Min. Stimmen]. Wenn Sekunden 0 sind werden automatisch 60 eingesetzt.');
$.lang.register('pollsystem.open.moreoptions', 'Für eine Umfrage sind mehr als 1 Option notwendig.');
$.lang.register('pollsystem.runpoll.novotes', 'Die Umfrage für "$1" ist beeendet! Es wurden nicht genügend Stimmen abgegeben!');
$.lang.register('pollsystem.runpoll.winner', 'Die Umfrage für "$1" ist beendet! Der/Die GewinnerIn ist "$2"!');
$.lang.register('pollsystem.runpoll.tie', 'Die Umfrage für "$1" endete in einem Unentschieden! Prüfe !poll results.');
$.lang.register('pollsystem.runpoll.started', 'Umfrage gestartet! Verwende "!poll close" um die Umfrage manuell zu beenden.');
$.lang.register('pollsystem.close.nopoll', 'Derzeit ist keine Umfrage aktiv.');