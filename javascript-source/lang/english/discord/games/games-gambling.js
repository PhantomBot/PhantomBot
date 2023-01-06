/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

$.lang.register('discord.gambling.need.points', 'You don\'t have that many $1.');
$.lang.register('discord.gambling.error.max', 'You\'re only allowed to gamble a maximum of $1.');
$.lang.register('discord.gambling.error.min', 'You\'re only allowed to gamble a minimum of $1.');
$.lang.register('discord.gambling.lost', '$1 rolled $2 and lost $3. $5'); // Use $4 for the points the user has remaining
$.lang.register('discord.gambling.won', '$1 rolled $2 and won $3! $5'); // Use $4 for the points the user has remaining
$.lang.register('discord.gambling.usage', 'Usage: !gamble [amount / all / half]');
$.lang.register('discord.gambling.set.max.usage', 'Usage: !gambling setmax [amount]');
$.lang.register('discord.gambling.set.max', 'Set max gambling to $1!');
$.lang.register('discord.gambling.set.min.usage', 'Usage: !gambling setmin [amount]');
$.lang.register('discord.gambling.set.min', 'Set minimum gambling to $1!');
$.lang.register('discord.gambling.win.range.usage', 'Usage: !gambling setwinningrange [range]');
$.lang.register('discord.gambling.win.range', 'Set gambling win range to $1-100 lose range to 1-$2');
$.lang.register('discord.gambling.percent.usage', 'Usage: !gambling setgainpercent [amount]');
$.lang.register('discord.gambling.percent', 'Set gambling gain percent to $1%');
$.lang.register('discord.gambling.main.usage', 'Usage: !gambling [setmax / setmin / setwinningrange / setgainpercent]');
