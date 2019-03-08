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

$.lang.register('subscribehandler.auto.sub.mode.interval.set', 'Auto-Abonnentenmodus-Intervall festgelegt! Funktioniert nur, wenn der Stream online ist.');
$.lang.register('subscribehandler.auto.submode.timer.404', 'Der minimal erlaubte Auto-Abonnentenmodus-Intervall beträgt 30 Minuten.');
$.lang.register('subscribehandler.auto.submode.timer.off', 'Automatischer Nur-Abonnenten-Modus aktiviert!');
$.lang.register('subscribehandler.auto.submode.timer.usage', 'Verwendung: !autosubmodetimer (Intervall) - Setze den Intervall auf 0 um ihn zu deaktivieren.');
$.lang.register('subscribehandler.new.sub.toggle.off', 'Neue Abonnenten werden, nach ihrer Abonnierung, nicht mehr willkommen geheißen.');
$.lang.register('subscribehandler.new.sub.toggle.on', 'Neue Abonnenten werden, nach ihrem Abonnement, willkommen geheißen.');
$.lang.register('subscribehandler.new.primesub.toggle.off', 'Neue Twitch Prime Abonnenten werden nicht mehr länger bei ihrem Abonnement begrüßt.');
$.lang.register('subscribehandler.new.primesub.toggle.on', 'Neue Twitch Prime Abonnenten werden nun bei Ihrem Abonnement begrüßt.');
$.lang.register('subscribehandler.resub.msg.set', 'Reabonnenten-Willkommensnachricht festgelegt!');
$.lang.register('subscribehandler.giftsub.msg.set', 'Geschenk-Abonnenten Willkommensnachricht gesetzt!');
$.lang.register('subscribehandler.giftanonsub.msg.set', 'Anonymes Abonnenten-Geschenk Willkommensnachricht gesetzt!');
$.lang.register('subscribehandler.massgiftsub.msg.set', 'Massenabonnent Geschenk Willkommensnachricht gesetzt!');
$.lang.register('subscribehandler.anonmassgiftsub.msg.set', 'Anonymes Massenabonnement Geschenk Willkommensnachricht gesetzt!');
$.lang.register('subscribehandler.resub.msg.usage', 'Verwendung: !resubmessage (Nachricht) - Tags: (name), (months), (reward) und (plan)');
$.lang.register('subscribehandler.giftsub.msg.usage', 'Verwendung: !giftsubmessage (Nachricht) - Tags: (name), (recipient), (months), (reward) und (plan)');
$.lang.register('subscribehandler.giftanonsub.msg.usage', 'Verwendung: !giftanonsubmessage (Nachricht) - Tags: (name), (recipient), (months), (reward) and (plan)');
$.lang.register('subscribehandler.massgiftsub.msg.usage', 'Verwendung: !massgiftsubmessage (Nachricht) - Tags: (name), (amount), (reward) and (plan)');
$.lang.register('subscribehandler.anonmassgiftsub.msg.usage', 'Verwendung: !massanongiftsubmessage (Nachricht) - Tags: (name), (amount) and (plan)');
$.lang.register('subscribehandler.resub.msg.noreward.set', 'Re-Abonnenten Begrüßungsnachricht für keine Belohnungen festgelegt!');
$.lang.register('subscribehandler.giftsub.msg.noreward.set', 'Verschenkte Abonnements für keine Belohnung festgelegt!');
$.lang.register('subscribehandler.resub.msg.noreward.usage', 'Verwendung: !resubmessage (Nachricht) - Tags: (name) (months)');
$.lang.register('subscribehandler.giftsub.msg.noreward.usage', 'Verwendung: !giftsubmessage (Nachricht) - Tags: (name) (months)');
$.lang.register('subscribehandler.resub.toggle.off', 'Re-Abonnenten werden beim re-abonnieren nicht mehr begrüßt.');
$.lang.register('subscribehandler.giftsub.toggle.off', 'Geschenkte Abonnements werden nicht mehr begrüßt.');
$.lang.register('subscribehandler.massgiftsub.toggle.off', 'Massenabonnenten-Geschenke werden nicht mehr begrüßt.');
$.lang.register('subscribehandler.anongiftsub.toggle.off', 'Anonyme Abonnentengeschenke werden nicht mehr begrüßt..');
$.lang.register('subscribehandler.anonmassgiftsub.toggle.off', 'Anonyme Massenabonnentengeschenke werden nicht mehr begrüßt.');
$.lang.register('subscribehandler.resub.toggle.on', 'Re-Abonnenten werden beim re-abonnieren begrüßt.');
$.lang.register('subscribehandler.giftsub.toggle.on', 'Geschenkte Abonnements werden nun im Chat begrüßt.');
$.lang.register('subscribehandler.massgiftsub.toggle.on', 'Massenabonnenten-Geschenk wird nun im Chat begrüßt.');
$.lang.register('subscribehandler.anongiftsub.toggle.on', 'Anonyme Abonnentengeschenke werden nun im Chat begrüßt.');
$.lang.register('subscribehandler.anonmassgiftsub.toggle.on', 'Anonyme Massenabonnentengeschenke werden nun im Chat begrüßt.');
$.lang.register('subscribehandler.sub.reward.set', 'Belohunung für Abonnement festgelegt!');
$.lang.register('subscribehandler.sub.reward.usage', 'Verwendung: !subscribereward (Höhe)');
$.lang.register('subscribehandler.resub.reward.set', 'Belohnung für Re-Abonnement festgelegt!');
$.lang.register('subscribehandler.giftsub.reward.set', 'Belohnung für Re-Abonnement geändert!');
$.lang.register('subscribehandler.resub.reward.usage', 'Verwendung: !resubscribereward (Belohnung)');
$.lang.register('subscribehandler.giftsub.reward.usage', 'Verwendung: !giftsubreward (Punktzahl)');
$.lang.register('subscribehandler.sub.count', 'Derzeit hast du $1 Abonnenten!');
$.lang.register('subscribehandler.sub.msg.set', 'Neue Abonnenten-Begrüßung festgelegt!');
$.lang.register('subscribehandler.primesub.msg.set', 'Neue Twitch Prime Abonnenten-Willkommensnachricht festgelegt!');
$.lang.register('subscribehandler.sub.msg.usage', 'Verwendung: !submessage (Nachricht) - Tags: (name) and (reward)');
$.lang.register('subscribehandler.primesub.msg.usage', 'Verwendung: !primesubmessage (Nachricht) - Tags: (name) and (reward)');
$.lang.register('subscribehandler.sub.msg.noreward.set', 'Neue Abonnement-Willkommensnachricht, ohne Belohnung, festgelegt!');
$.lang.register('subscribehandler.sub.msg.noreward.usage', 'Verwendung: !submessage (Nachricht) - Tag: (name)');
$.lang.register('subscribehandler.resubemote.set', 'Neues Abonneneten-Emote festgelegt!');
$.lang.register('subscribehandler.resubemote.usage', 'Verwendung: !resubemote (Emotename)');
