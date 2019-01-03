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

$.lang.register('streamelements.donation.new', 'Vielen Dank (name) für deine Spende von $(amount)!');
$.lang.register('streamelements.donation.newreward', 'Vielen Dank (name) ffür deine Spende von $(amount) (currency)! Hier sind (points) (pointname) als Dankeschön!');
$.lang.register('streamelements.donations.usage', 'Verwendung: !streamelements (announce | rewardmultiplier n.n | message | lastmessage)');
$.lang.register('streamelements.donations.announce.disable', 'Spenden werden nicht mehr länger ausgegeben.');
$.lang.register('streamelements.donations.announce.enable', 'Spenden werden ab jetzt im Chat ausgegeben.');
$.lang.register('streamelements.donations.reward.usage', 'Verwendung: !streamelements rewardmultiplier n.n  Setze es auf 0 um es zu deaktivieren.');
$.lang.register('streamelements.donations.reward.success', 'Die Belohnung für Spenden wurde auf $1 $2 je runden Geldbetrag der gespendet wurde.');
$.lang.register('streamelements.donations.message.usage', 'Verwendung: !streamelements message [Nachricht...] Tags: (name) (amount) (currency) (currencysymbol) (message) (formattedamount)');
$.lang.register('streamelements.donations.rewardmessage.usage', 'Verwendung: !streamelements rewardmessage [Nachricht...] Tags: (name) (amount) (currency) (reward) (message)');
$.lang.register('streamelements.donations.message.no-name', 'Ein (name) Tag wurde nicht übergeben, gib minestens den (name) Tag in deiner Nachricht an. Tags: (name) (amount) (currency) (message)');
$.lang.register('streamelements.donations.rewardmessage.no-name', 'Ein (name) Tag wurde nicht übergeben, gib minestens den (name) Tag in deiner Nachricht an. Tags: (name) (amount) (currency) (reward) (message)');
$.lang.register('streamelements.donations.message.success', 'Die Nachricht für Spenden wurde aktualisiert, wenn Belohnungen deaktiviert sind.');
$.lang.register('streamelements.donations.rewardmessage.success', 'Die Nachricht für Spenden wurde aktualisiert, wenn Belohnungen aktiviert sind.');
$.lang.register('streamelements.donations.lastmessage.success', 'Nachricht für den !lasttip Befehl aktualisiert.');
$.lang.register('streamelements.enabled.donators', 'Die Spendergruppe wurde aktiviert.');
$.lang.register('streamelements.disabled.donators', 'Die Spendergruppe wurde deaktiviert.');
$.lang.register('streamelements.donators.min', 'Das Minimum für den Aufstieg zum Rang Spender wurde auf 1$ gesetzt');
$.lang.register('streamelements.donators.min.usage', 'Verwendung: !streamelements minmumbeforepromotion (Höhe)');