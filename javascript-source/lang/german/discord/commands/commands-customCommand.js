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

$.lang.register('discord.customcommands.addcom.usage', 'Verwendung: !addcom [Befehl] [Ausgabe]');
$.lang.register('discord.customcommands.addcom.err', 'Der Befehl existiert schon.');
$.lang.register('discord.customcommands.addcom.success', 'Befehl !$1 wurde erstellt!');
$.lang.register('discord.customcommands.editcom.usage', 'Verwendung: !editcom [Befehl] [Befehl]');
$.lang.register('discord.customcommands.editcom.404', 'Dieser Befehl existiert nicht.');
$.lang.register('discord.customcommands.editcom.success', 'Befehl !$1 wurde bearbeitet!');
$.lang.register('discord.customcommands.delcom.usage', 'Verwendung: !delcom [Befehl] [Befehl]');
$.lang.register('discord.customcommands.delcom.404', 'Dieser Befehl existiert nicht.');
$.lang.register('discord.customcommands.delcom.success', 'Befehl !$1 wurde gelöscht!');
$.lang.register('discord.customcommands.permcom.usage', 'Verwendung: !permcom [Befehl] [permission]');
$.lang.register('discord.customcommands.permcom.404', 'Dieser Befehl existiert nicht.');
$.lang.register('discord.customcommands.permcom.syntax.error', 'Verwendung: !permcom [Befehl] [permission] - 0 = Jeder. 1 = Administratoren.');
$.lang.register('discord.customcommands.permcom.success', 'Berechtigung für Befehl !$1 wurde bearbeitet: $2');
$.lang.register('discord.customcommands.coolcom.usage', 'Verwendung: !coolcom [Befehl] [Zeit in Sekunden]');
$.lang.register('discord.customcommands.coolcom.404', 'Dieser Befehl existiert nicht.');
$.lang.register('discord.customcommands.coolcom.removed', 'Cooldown für Befehl !$1 wurde entfernt.');
$.lang.register('discord.customcommands.coolcom.success', 'Cooldown für Befehl !$1 geändert zu $2 sekunden.');
$.lang.register('discord.customcommands.channelcom.usage', 'Verwendung: !channelcom [Befehl] [channel / --global / --list] - trenne mehrere Kanäle mit einem Komma und einem Leerzeichen (kanal1, kanal2, ...).');
$.lang.register('discord.customcommands.channelcom.global', 'Befehl !$1 funktioniert ab jetzt in Jedem Kanal.');
$.lang.register('discord.customcommands.channelcom.success', 'Befehl !$1 funktioniert ab jetzt in folgenden Kanälen: #$2.');
$.lang.register('discord.customcommands.channelcom.404', 'für diesen Befehl wurden keine Kanäle festgelegt.');
$.lang.register('discord.customcommands.commands', 'Befehle: $1');
$.lang.register('discord.customcommands.bot.commands', 'Bot Befehle: $1');
$.lang.register('discord.customcommands.pricecom.usage', 'Verwendung: !pricecom [Befehl] [Kosten]');
$.lang.register('discord.customcommands.pricecom.success', 'Befehl !$1 kostet absofort $2.');
$.lang.register('discord.customcommands.aliascom.usage', 'Verwendung: !aliascom [alias] [Befehl]');
$.lang.register('discord.customcommands.aliascom.success', 'Befehl !$2 ragiert nun auf den Alias !$1');
$.lang.register('discord.customcommands.delalias.usage', 'Verwendung: !delalias [alias]');
$.lang.register('discord.customcommands.delalias.success', 'Alias !$1 wurde entfernt.');
$.lang.register('discord.customcommands.404', 'Dieser Befehl existiert nicht.');
$.lang.register('discord.customcommands.alias.404', 'Dieser Alias existiert nicht.');
$.lang.register('discord.customcommands.customapi.404', 'Befehl !$1 benötigt parameter.');
$.lang.register('discord.customcommands.customapijson.err', '!$1: Fehler beim verarbeiten der API.');