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

$.lang.register('auctionsystem.usage', 'Verwendung: !auction open (Wieviele Gebote) (Minimalstes Gebot) (Timer für automatisches Schließen)');
$.lang.register('auctionsystem.err.opened', 'Es läuft bereits eine Auktion!');
$.lang.register('auctionsystem.opened', 'Die Auktion ist nun eröffnet! Du kannst Gebote in Schritten von $1 abgeben. Kleinstes, erlaubtes Gebot sind $2! Gib Gebote mit !bid (Höhe) ab.');
$.lang.register('auctionsystem.auto.timer.msg', 'Auktion endet automatisch in $1 Sekunden!');
$.lang.register('auctionsystem.err.closed', 'Derzeit gibt es kein Gebot');
$.lang.register('auctionsystem.err.no.bids', 'Auktion geschlossen! Niemand hat geboten.');
$.lang.register('auctionsystem.closed', 'Auktion geschlossen! GewinnerIn der Auktion ist $1 mit einem Gebot von $2!');
$.lang.register('auctionsystem.warn.force', 'Die Autkion steht kurz vor dem Ende! Aktuelle/r Höchstbietende/r ist $1 mit einem Gebot von $2! Haben wir vielleicht noch $3?');
$.lang.register('auctionsystem.warn', 'Aktuelle/r HöchstbieterIn ist $1 mit einem Gebot von $2!');
$.lang.register('auctionsystem.bid.usage', 'Verwendung: !bid (Gebot)');
$.lang.register('auctionsystem.err.bid.minimum', 'Du kannst nicht weniger als $1 bieten!');
$.lang.register('auctionsystem.err.points', 'Du hast nicht genug $1 um zu bieten.');
$.lang.register('auctionsystem.err.increments', 'Diese Auktion läuft in Schritten von $1!');
$.lang.register('auctionsystem.bid', '$1 bot gerade $2! Haben wir $3?');