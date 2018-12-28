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

$.lang.register('donationhandler.donation.new', 'Vielen Dank (name) für die Spende von $(amount) (currency)!');
$.lang.register('donationhandler.donation.newreward', 'Vielen Dank (name) für die Spende von $(amount) (currency)! Hier sind (points) (pointname) als Dankeschön!');
$.lang.register('donationhandler.lastdonation.no-donations', 'Derzeit gibt es keine Spenden.');
$.lang.register('donationhandler.lastdonation.404', 'Kann die letzte Spende nicht finden!');
$.lang.register('donationhandler.lastdonation.success', 'Die letzte Spende kam von (name) und betrug $(amount) (currency).');
$.lang.register('donationhandler.donations.usage', 'Verwendung: !streamlabs (announce | rewardmultiplier n.n | message | lastmessage | currencycode)');
$.lang.register('donationhandler.donations.announce.disable', 'Spenden werden nicht mehr länger angekündigt.');
$.lang.register('donationhandler.donations.announce.enable', 'Spenden werden nun angekündigt.');
$.lang.register('donationhandler.donations.reward.usage', 'Verwendung: !streamlabs rewardmultiplier n.n  Verwende 0 zur Deaktivierung.');
$.lang.register('donationhandler.donations.reward.success', 'Die Blohnung für Spenden wurde auf $1 $2, für den Gesamtbetrag festgelegt.');
$.lang.register('donationhandler.donations.message.usage', 'Verwendung: !streamlabs message [Nachricht...] Tags: (name) (amount) (currency) (message)');
$.lang.register('donationhandler.donations.rewardmessage.usage', 'Verwendung: !streamlabs rewardmessage [Nachricht...] Tags: (name) (amount) (currency) (points) (pointname) (message)');
$.lang.register('donationhandler.donations.message.no-name', 'Ein (name) Tag wurde nicht angegeben, verwende mindestens den (name) Tag. Tags: (name) (amount) (currency) (message)');
$.lang.register('donationhandler.donations.rewardmessage.no-name', 'Ein (name) Tag wurde nicht angegeben, verwende mindestens den (name) Tag. Tags: (name) (amount) (currency) (points) (pointname) (message)');
$.lang.register('donationhandler.donations.message.success', 'Nachricht für Spenden, wenn Belohnungen deaktiviert sind, aktualisiert.');
$.lang.register('donationhandler.donations.rewardmessage.success', 'Nachrichten für Spenden mit Belohnung aktualisiert.');
$.lang.register('donationhandler.enabled.donators', 'Die Spendergruppe wurde aktiviert.');
$.lang.register('donationhandler.disabled.donators', 'Die Spendergruppe wurde deaktiviert.');
$.lang.register('donationhandler.donators.min', 'Das Minimum vor einer Beförderung zum Spender wurde auf $1 festgelegt.');
$.lang.register('donationhandler.donators.min.usage', 'Verwendung: !streamlabs minmumbeforepromotion (Höhe)');
$.lang.register('donationhandler.streamlabs.currencycode.usage', 'Verwendung: !streamlabs currencycode [Code] - Du findest eine gültige Liste hier: https://twitchalerts.readme.io/v1.0/docs/currency-codes');
$.lang.register('donationhandler.streamlabs.currencycode.success', 'Der Währungscode für StreamLabs Spenden wurde festgelegt zu: $1');
$.lang.register('donationhandler.streamlabs.currencycode.success-erase', 'Der Währungscode für Streamlabs Spenden wurde entfernt, alle Spenden werden nun in ihrer tatsächlichen Währung angezeigt.');