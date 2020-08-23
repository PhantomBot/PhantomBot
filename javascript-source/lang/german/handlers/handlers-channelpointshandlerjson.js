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

$.lang.register('channelpointshandler.giveall.usage', 'Verwendung: !channelpoints giveall [usage / config / amount / toggle]');
$.lang.register('channelpointshandler.transfer.amount.message', 'Channel-Punkte Einlösungstransfer fügt $1 Punkte zum Benutzer hinzu, der die Prämie eingelöst hat.');
$.lang.register('channelpointshandler.giveall.config.complete', 'Kanalpunkte giveall config abgeschlossen. Giveall ist jetzt registriert, um $1 zu belohnen.');
$.lang.register('channelpointshandler.transfer.current', 'Transfereinlöse werden auf $1 registriert und der Benutzer erhält $2 Punkte für jede Einlösung. Zum ändern, benutze bitte "!channelpoints transfer [config / amount]"');
$.lang.register('channelpointshandler.transfer.config.complete', 'Kanalpunkte Transfer Konfiguration abgeschlossen. Transfer ist jetzt registriert, um $1 zu belohnen.');
$.lang.register('channelpointshandler.emoteonly.duration.notset', 'Kanalpunkte Belohnung, Emoteonly-Dauer wurde nicht festgelegt. Verwende "!channelpoints emoteonly duration [Dauer in Sekunden]" um dies festzulegen.');
$.lang.register('channelpointshandler.nan', 'Eingabe muss eine Zahl sein, bitte versuche es erneut.');
$.lang.register('channelpointshandler.giveall.config.start', 'Kanalpunkte giveall config aktiv. Bitte lösen Sie die gewünschte Prämie ein.');
$.lang.register('channelpointshandler.timeout.config.start', 'Kanalpunkte Timeout-Konfiguration aktiv. Bitte löse die gewünschte Prämie ein.');
$.lang.register('channelpointshandler.emoteonly.info', 'Emoteonly ist nicht aktiviert. Wenn eine Emoteonly-Einlösung beansprucht wird, wird der Chat für eine festgelegte Dauer im Modus "Nur Emote" platziert. Zur Konfiguration verwende bitte "!channelpoints emoteonly config" oder für weitere Informationen verwende bitte "!channelpoints emoteonly usage"');
$.lang.register('channelpointshandler.giveall.info', 'giveall ist nicht aktiviert. Wenn ein Giveall Einlösung beansprucht wird, erhalten alle Nutzer im Chat eine bestimmte Anzahl von Punkten. Zur Konfiguration verwende bitte "!channelpoints giveall config" oder für weitere Informationen verwende bitte "!channelpoints giveall usage"');
$.lang.register('channelpointshandler.emoteonly.duration.usage', 'Kanalpunkte Belohnung, Emoteonly Dauer auf $1 gesetzt. Verwende "!channelpoints emoteonly duration [Dauer in Sekunden]" um dies zu ändern.');
$.lang.register('channelpointshandler.current', 'Kanalpunkteautomatisierung derzeit für $1 aktiviert. Verwende bitte "!channelpoints useage" für die Verwendung von Befehlen oder "!channelpoints info" um Informationen darüber zu erhalten, was PhantomBot mit Kanalpunkten tun kann.');
$.lang.register('channelpointshandler.transfer.info', 'Transfer ist nicht aktiviert. Wenn eine Transfer Einlösung beansprucht wird, erhält der Benutzer eine bestimmte Anzahl von Punkten. Zur Konfiguration verwende bitte "!channelpoints transfer config" oder für weitere Informationen verwende bitte "!channelpoints transfer usage"');
$.lang.register('channelpointshandler.notenabled', 'Derzeit sind keine Kanalpunktfunktionen aktiviert. Bitte benutze "!channelpoints info" für Informationen darüber, was PhantomBotDE mit Kanalpunkten machen kann oder "!channelpoints usage" für die Verwendung');
$.lang.register('channelpointshandler.giveall.toggle.amount', 'Giveall kann nicht aktiviert werden, da kein Betrag festgelegt wurde. Bitte benutze "!channelpoints giveall amount [Anzahl der Punkte, die der Bot vergeben wird]".');
$.lang.register('channelpointshandler.emoteonly.duration.message', 'Kanalpunkte Einlösung Emoteonly stellt den Chat für $1 Sekunden um in den Modus "Nur Emote".');
$.lang.register('channelpointshandler.emoteonly.enabled', 'Kanalpunkte Einlösung Emoteonly für Belohnung $1 aktiviert.');
$.lang.register('channelpointshandler.timeout.config.complete', 'Kanalpunkte Timeout-Konfiguration abgeschlossen. Timeout ist jetzt registriert, um $1 zu belohnen.');
$.lang.register('channelpointshandler.timeout.toggle.duration', 'Timeout kann nicht aktiviert werden, da keine Dauer festgelegt wurde. Bitte benutze "!channelpoints timeout duration [Dauer in Sekunden]" zum setzen.');
$.lang.register('channelpointshandler.giveall.enabled', 'Kanalpunkte Einlösung giveall aktiviert für Belohnung $1.');
$.lang.register('channelpointshandler.timeout.duration.usage', 'Kanalpunktebelohnung, Timeout-Dauer auf $1 festgelegt. Verwende "!channelpoints timeout duration [Dauer in Sekunden]" zum ändern.');
$.lang.register('channelpointshandler.emoteonly.current', 'Emoteonly Einlösungen werden auf $1 registriert und der Chat wird für $2 Sekunden im Modus "Nur emote" platziert. Um diese zu ändern, benutze bitte "!channelpoints emoteonly [config/duration]"');
$.lang.register('channelpointshandler.timeout.usage', 'Verwendung: !channelpoints timeout [usage / config / duration / toggle]');
$.lang.register('channelpointshandler.info', 'PhantomBotDE kann so konfiguriert werden, dass Kanalpunkteinlösungen für mehrere Funktionen automatisiert werden. Transfer: Benutzer erhält Bot-Währung. Giveall: Jeder im Chat erhält Bot-Währung. Emoteonly: Setzt den Chat für eine bestimmte Zeit in den Emote Only Modus. Timeout: Timeout für einen bestimmten Benutzer für einen bestimmten Zeitraum.');
$.lang.register('channelpointshandler.timeout.duration.notset', 'Kanalpunktebelohnung, Timeout-Dauer wurde nicht festgelegt. Verwenden Sie „!channelpoints Zeitüberschreitungsdauer [Dauer in Sekunden]“ zu setzen.');
$.lang.register('channelpointshandler.timeout.nouserinput', 'Die eingelöste Kanalpunktbelohnung hat keine Benutzereingabe, daher kann sie nicht für Timeout verwendet werden. Bitte richten Sie eine Belohnung mit Benutzereingabe ein und versuchen Sie es erneut.');
$.lang.register('channelpointshandler.giveall.toggle.id', 'Giveall kann nicht aktiviert werden, da keine gültige Belohnungs-ID gefunden wurde. Bitte benutze "!channelpoints giveall config", um die Belohnung zu setzen.');
$.lang.register('channelpointshandler.giveall.amount.notset', 'Kanalpunktebelohnung, giveall Betrag wurde nicht festgelegt. Verwende "!channelpoints giveall amount [Anzahl der Punkte, die der Bot vergeben wird]".');
$.lang.register('channelpointshandler.timeout.info', 'Timeout ist nicht aktiviert. Wenn eine Timeout-Einlösung beansprucht wird, wird der angegebene Benutzer für eine festgelegte Dauer in einen Timeout gesetzt. Zur Konfiguration verwende bitte "!channelpoints timeout config" oder für weitere Informationen verwende bitte "!channelpoints timeout usage"');
$.lang.register('channelpointshandler.giveall.current', 'giveall Einlöse sind auf $1 registriert und Benutzer erhalten $2 Punkte für jede Einlösung. Zum ändern, benutze bitte "!channelpoints giveall [config / Menge]"');
$.lang.register('channelpointshandler.emoteonly.disabled', 'Kanalpunkte Einlösung Emoteonly deaktiviert.');
$.lang.register('channelpointshandler.timeout.toggle.id', 'Timeout kann nicht aktiviert werden, da keine gültige Belohnungs-ID gefunden wurde. Bitte benutze "!channelpoints timeout config", um die Belohnung zu setzen.');
$.lang.register('channelpointshandler.emoteonly.usage', 'Nutzung: !channelpoints emoteonly [usage / config / duration / toggle]');
$.lang.register('channelpointshandler.transfer.disabled', 'Kanalpunkte Einlösungstransfer deaktiviert.');
$.lang.register('channelpointshandler.transfer.amount.usage', 'Kanalpunkte Belohnung, Transferbetrag auf $1 gesetzt. Verwende "!channelpoints transfer amount [Anzahl der Punkte, die der Bot vergeben wird]“ zum ändern.');
$.lang.register('channelpointshandler.transfer.toggle.amount', 'Der Transfer kann nicht aktiviert werden, da kein Betrag festgelegt wurde. Bitte benutze „!channelpoints transfer [Menge der Punkte, die Bot vergeben wird]“ zum setzen.');
$.lang.register('channelpointshandler.transfer.toggle.id', 'Der Transfer kann nicht aktiviert werden, da keine gültige Belohnungs-ID gefunden wurde. Bitte benutze „!channelpoints transfer config“, um die Belohnung zu setzen.');
$.lang.register('channelpointshandler.emoteonly.toggle.id', 'Emote only kann nicht aktiviert werden, da keine gültige Reward-ID gefunden wurde. Bitte benutzen Sie "!channelpoints emoteonly config", um die Belohnung zu setzen.');
$.lang.register('channelpointshandler.transfer.usage', 'Verwendung: !channelpoints transfer [usage / config / amount / toggle]');
$.lang.register('channelpointshandler.giveall.disabled', 'Kanalpunkte Einlösung giveall deaktiviert.');
$.lang.register('channelpointshandler.timeout.current', 'Timeout-Einlöse werden auf $1 registriert und der angegebene Benutzer wird für $2 Sekunden getimeouted. Zum ändern, benutze bitte "!channelpoints timeout [config / duration]"');
$.lang.register('channelpointshandler.timeout.duration.message', 'Kanalpunktebelohnungs-Timeout wird angegeben Benutzer für $1 Sekunden.');
$.lang.register('channelpointshandler.timeout.enabled', 'Timeout für die Einlösung von Kanalpunkten für Belohnung $1 aktiviert.');
$.lang.register('channelpointshandler.transfer.amount.notset', 'Kanalpunktebelohnung, Transferbetrag wurde nicht festgelegt. Verwende "!channelpoints transfer amount [Anzahl der Punkte, die der Bot vergeben wird]" zum setzen.');
$.lang.register('channelpointshandler.emoteonly.config.complete', 'Kanalpunkte Emoteonly-Konfiguration abgeschlossen. Emoteonly ist jetzt registriert, um $1 zu bekommen.');
$.lang.register('channelpointshandler.emoteonly.toggle.duration', 'Emote only kann nicht aktiviert werden, da keine Dauer festgelegt wurde. Bitte benutzen Sie "!channelpoints emoteonly duration [Dauer in Sekunden]" zum festlegen..');
$.lang.register('channelpointshandler.config.failed', 'Es wurde keine Kanalpunkt-Einlösung erkannt. Bitte versuche es erneut. Wenn du Probleme hast, besuche bitte den PhantomBotDE Discord https://discord.com/invite/YKVMD78');
$.lang.register('channelpointshandler.transfer.config.start', 'Kanalpunkte Transfer Konfiguration aktiv. Bitte löse die gewünschte Prämie ein.');
$.lang.register('channelpointshandler.usage', 'Verwendung: !channelpoints [info / usage / transfer / giveall / emoteonly / timeout]');
$.lang.register('channelpointshandler.emoteonly.config.start', 'Kanalpunkte Emoteonly config aktiv. Bitte löse die gewünschte Prämie ein.');
$.lang.register('channelpointshandler.transfer.enabled', 'Kanalpunkte Einlösungstransfer für Belohnung $1 aktiviert.');
$.lang.register('channelpointshandler.giveall.amount.usage', 'Kanalpunktebelohnung, giveall Betrag auf $1 gesetzt. Verwende "!channelpoints giveall amount [Anzahl der Punkte, die der Bot vergeben wird]" zum ändern.');
$.lang.register('channelpointshandler.giveall.amount.message', 'Kanalpunkte Einlösung giveall fügt $1 Punkte für alle Benutzer im Chat hinzu.');
$.lang.register('channelpointshandler.timeout.disabled', 'Timeout für die Einlösung von Kanalpunkten deaktiviert.');
