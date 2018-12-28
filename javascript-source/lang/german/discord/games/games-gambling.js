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

$.lang.register('discord.gambling.need.points', 'Du hast nicht genug $1.');
$.lang.register('discord.gambling.error.max', 'Du kannst maximal $1 Setzen.');
$.lang.register('discord.gambling.error.min', 'Du musst mindestens $1 Setzen.');
$.lang.register('discord.gambling.lost', '$1 Rollt eine $2 und verliert $3 von $4. $5'); // Use $4 for the points the user has remaining
$.lang.register('discord.gambling.won', '$1 Rollt eine $2 und gewinnt $3! $5'); // Use $4 for the points the user has remaining
$.lang.register('discord.gambling.usage', 'Verwendung: !gamble [menge]');
$.lang.register('discord.gambling.set.max.usage', 'Verwendung: !gambling setmax [menge]');
$.lang.register('discord.gambling.set.max', 'Maximalen einsatz geändert: $1!');
$.lang.register('discord.gambling.set.min.usage', 'Verwendung: !gambling setmin [menge]');
$.lang.register('discord.gambling.set.min', 'Minimalen einsatz geändert: $1!');
$.lang.register('discord.gambling.win.range.usage', 'Verwendung: !gambling setwinningrange [gewinnspanne]');
$.lang.register('discord.gambling.win.range', 'gewinnspanne geändert: $1-100 alles zwischen 1-$2 ist verloren');
$.lang.register('discord.gambling.percent.usage', 'Verwendung: !gambling setgainpercent [amount]');
$.lang.register('discord.gambling.percent', 'Prozentualer Gewinn geändert: $1%');
$.lang.register('discord.gambling.main.usage', 'Verwendung: !gambling [setmax / setmin / setwinningrange / setgainpercent]');