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

$.lang.register('discord.accountlink.usage.nolink', 'Um dieses Modul verwenden zu können muss der Bot die Erlaubnis haben Ptivate Nachrichten zu versenden.\nUm Discord und twitch account zu Synchronisieren benutze **!account link**');
$.lang.register('discord.accountlink.usage.link', 'Dein Discord account ist synchronisiert mit: **https://twitch.tv/$1**.\nUm einen anderen Account zu Synchronisieren benutze **!account link** oder deysnchronisiere ihn komplett mit **!account remove**');
$.lang.register('discord.accountlink.link', '**WARNUNG: Token wird ungültig in 10 Minuten**.\nUm die Synchronisierung zwischen Discord und Twitch abzuschließen gehe auf **https://twitch.tv/$1** und benutze den Befehl **!account link $2**');
$.lang.register('discord.accountlink.link.relink', 'WARNUNG: Token wird ungültig in 10 Minuten**.\nUm die Synchronisierung zwischen Discord und dem neuen Twitch Account abzuschließen gehe auf **https://twitch.tv/$1** und benutze den Befehl **!account link $2**');
$.lang.register('discord.accountlink.link.success', 'Dein Discord Account wurde erfolgreich mit **https://twitch.tv/$1** synchronisiert.\nwenn sich dein Twitch Name ändert musst du ihn erneut Synchronisieren.');
$.lang.register('discord.accountlink.link.fail', 'Sorry, das Token ist ungültig! bist du sicher, dass du das komplette token richtig hast? Fass ja, starte den sync. Prozess erneut von einem anderen Text Channel');
$.lang.register('discord.accountlink.link.remove', 'Dein Discord Account ist nun von allen Twitch Accounts getrennt.\nUm Discord und twitch account zu Synchronisieren benutze **!account link** in einem Text Kanal des Discord Servers');
$.lang.register('discord.accountlink.linkrequired', 'Sorry, dieser Befehl funktioniert erst nachdem du twitch und Discord synchronisiert hast mit dem Discord Befehl **!account**');