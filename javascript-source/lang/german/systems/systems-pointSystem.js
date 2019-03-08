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

$.lang.register('pointsystem.add.all.success', '$1 wurden an alle im Kanal gesendet!');
$.lang.register('pointsystem.add.all.usage', 'Verwendung: !points all [Menge]');
$.lang.register('pointsystem.take.all.success', '$1 wurden von jedem im Kanal entfernt!');
$.lang.register('pointsystem.take.all.usage', 'Verwendung: !points takeall [Menge]');
$.lang.register('pointsystem.add.error.negative', 'Du kannst keine negativen $1 vergeben.');
$.lang.register('pointsystem.take.error.negative', 'Du kannst keine negativen $1 nehmen.');
$.lang.register('pointsystem.add.success', '$1 an $2 gesendet. Neuer Kontostand $3.');
$.lang.register('pointsystem.add.usage', 'Verwendung: "!points add [Benutzername] [Menge]"');
$.lang.register('pointsystem.user.success', ' $1 hat aktuell $2.');
$.lang.register('pointsystem.makeitrain.error.invalid', 'Entschuldigung, aber es ist derzeit nicht möglich, $1 regnen zu lassen.');
$.lang.register('pointsystem.makeitrain.error.needpoints', 'Du kannst es dir derzeit nicht leisten, es $1 regnen zu lassen.');
$.lang.register('pointsystem.makeitrain.error.negative', 'Du kannst keine negativen $1 regnen lassen.');
$.lang.register('pointsystem.makeitrain.success', 'Ein Gewittersturm zieht auf! $1 warf insgesamt $2 $3 in die Luft!');
$.lang.register('pointsystem.makeitrain.usage', 'Verwendung: !makeitrain [Menge]');
$.lang.register('pointsystem.set.bonus.error.negative', 'Du kannst den Bonus-per-Gruppe nicht auf negativ $1 setzen.');
$.lang.register('pointsystem.set.bonus.success', 'Setzt den $1 Bonus auf $2 pro Gruppenlevel.');
$.lang.register('pointsystem.set.bonus.usage', 'Verwendung: !points bonus [Menge]');
$.lang.register('pointsystem.set.gain.error.negative', 'Du kannst die Menge von verdienten $1 nicht auf eine negative Zahl setzen.');
$.lang.register('pointsystem.set.gain.offline.success', '$1 Verdienste auf $2 jede/alle $3 Minute(n), während der Stream offline ist, gesetzt.');
$.lang.register('pointsystem.set.gain.offline.usage', 'Verwendung: !points setofflinegain [Menge], wenn du !grouppoints set verwendest, wird dies überschrieben!');
$.lang.register('pointsystem.set.gain.success', '$1 Verdienste auf $2 jede/alle $3 Minute(n), während der Stream online ist, gesetzt.');
$.lang.register('pointsystem.set.gain.usage', 'Verwendung: !points setgain [Menge], wenn du !grouppoints set verwendest, wird dies überschrieben!');
$.lang.register('pointsystem.set.interval.error.negative', 'Du kannst den $1 Auszahlungsintervall nicht auf negative Minuten setzen.');
$.lang.register('pointsystem.set.interval.offline.success', '$1 Auszahlungsintervall auf $2 Minute(n), wenn der Stream offline ist, gesetzt.');
$.lang.register('pointsystem.set.interval.offline.usage', 'Verwendung: !points setofflineinterval [Menge]');
$.lang.register('pointsystem.set.interval.success', '$1 Auszahlungsintervall auf $2 Minute(n), wenn der Stream online ist, gesetzt..');
$.lang.register('pointsystem.set.interval.usage', 'Verwendung: !points setinterval [Menge]');
$.lang.register('pointsystem.set.name.both.success', 'Der Name der Punkte wurde von "$1" zu "$2" geändert. Setze den Namen für ein(e)(n) $2 mit !points setname single [Name].');
$.lang.register('pointsystem.set.name.multiple.success', 'Name der Mehrzahl erfolgreich von "$1" zu "$2" geändert. Setze den Namen für mehrere $2 mit !points setname multiple [Name].');
$.lang.register('pointsystem.set.name.single.success', 'Name der Einzahl erfolgreich von "$1" zu "$2" geändert. Setze den Namen für ein(e)(n) $2 mit !points setname single [Name].');
$.lang.register('pointsystem.set.name.usage', 'Verwendung: !points setname [single | multiple | delete] [Name]. Setzt die Namen für einzelne oder mehrere Punkte, oder löscht die Werte.');
$.lang.register('pointsystem.set.name.delete', 'Benutzerdefinierte Punktenamen entfernt.');
$.lang.register('pointsystem.set.name.duplicate', 'Dies ist der aktuelle Name des benutzerdefinierten Punkte Befehls.');
$.lang.register('pointsystem.setbalance.error.negative', 'Du kannst den Kontostand nicht auf negative $1 setzen.');
$.lang.register('pointsystem.setbalance.success', '$1 Kontostand von $2 zu $3 geändert.');
$.lang.register('pointsystem.setbalance.usage', 'Verwendung: !points set [Benutzername] [Menge]');
$.lang.register('pointsystem.take.error.toomuch', 'Du kannst nicht mehr nehmen, als $1 in seinem/ihrem $2 hat.');
$.lang.register('pointsystem.take.success', '$1 von $2 genommen. Neuer Kontostand beträgt $3.');
$.lang.register('pointsystem.take.usage', 'Verwendung: !points take [Benutzername] [Menge]');
$.lang.register('pointsystem.gift.usage', 'Verwendung: !gift [Benutzername] [Menge]');
$.lang.register('pointsystem.gift.shortpoints', 'Tut mit leid, aber du hast nicht genügend Guthaben um dieses Geschenk zu senden!');
$.lang.register('pointsystem.gift.404', 'Es tut mir leid, aber es sieht so aus, als wäre der Benutzer nicht in diesem Chat registriert!');
$.lang.register('pointsystem.gift.success', '$1 hat ein Geschenk über $2 an $3 gesendet.');
$.lang.register('pointsystem.usage.invalid', 'Ungültige Option an Befehl $1 übergeben!');
$.lang.register('pointsystem.err.negative', 'Du kannst nicht weniger als 0 $1 schenken!');
$.lang.register('pointsystem.err.penalty', 'Verwendung: !penalty (Benutzer) (Zeit in Minuten)');
$.lang.register('pointsystem.penalty.set', 'Benutzer: $1 wird für die nächsten $2 keine Punkte erwerben.');
$.lang.register('pointsystem.reset.all', 'Alle Punkte gelöscht.');
$.lang.register('pointsystem.message.usage', 'Verwendung: !points setmessage [Nachricht] - Tags: (userprefix), (user), (points), (pointsname), (pointsstring), (time), and (rank)');
$.lang.register('pointsystem.message.set', 'Punktenachricht festgelegt zu: $1');
$.lang.register('pointsystem.active.bonus.usage', 'Verwendung: !points setactivebonus [Höhe]');
$.lang.register('pointsystem.active.bonus.set', 'Aktivitätsbonus auf $1 festgelegt.');
$.lang.register('pointsystem.bonus.usage', 'Verwendung: !points bonus (Höhe) (für Zeit)');
$.lang.register('pointsystem.bonus.say', 'Für die nächsten $1 gebe ich dir $2 Extra-$3 bei jeder Auszahlung!');
