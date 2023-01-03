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

$.lang.register('discord.customcommands.addcom.usage', 'Usage: !addcom [command] [response]');
$.lang.register('discord.customcommands.addcom.err', 'That command already exists.');
$.lang.register('discord.customcommands.addcom.success', 'Command !$1 has been added!');
$.lang.register('discord.customcommands.editcom.usage', 'Usage: !editcom [command] [response]');
$.lang.register('discord.customcommands.editcom.404', 'That command does not exist.');
$.lang.register('discord.customcommands.editcom.success', 'Command !$1 has been edited!');
$.lang.register('discord.customcommands.delcom.usage', 'Usage: !delcom [command] [response]');
$.lang.register('discord.customcommands.delcom.404', 'That command does not exist.');
$.lang.register('discord.customcommands.delcom.success', 'Command !$1 has been removed!');
$.lang.register('discord.customcommands.permcom.usage', 'Usage: !permcom [command] [permission]');
$.lang.register('discord.customcommands.permcom.404', 'That command does not exist.');
$.lang.register('discord.customcommands.permcom.syntax.error', 'Usage: !permcom [command] [permission] - Either 0 which is everyone or 1 is administrators.');
$.lang.register('discord.customcommands.permcom.success', 'Permission for command !$1 has been set to permission $2');
$.lang.register('discord.customcommands.coolcom.usage', 'Usage: !coolcom [command] [time in seconds]');
$.lang.register('discord.customcommands.coolcom.404', 'That command does not exist.');
$.lang.register('discord.customcommands.coolcom.removed', 'Cooldown for command !$1 has been removed.');
$.lang.register('discord.customcommands.coolcom.success', 'Cooldown for command !$1 has been set to $2 seconds.');
$.lang.register('discord.customcommands.channelcom.usage', 'Usage: !channelcom [command] [channel / --global / --list] - Separate the channels with commas (no spaces) for multiple.');
$.lang.register('discord.customcommands.channelcom.global', 'Command !$1 will now work in every channel.');
$.lang.register('discord.customcommands.channelcom.success', 'Command !$1 will now only work in channel(s): $2.');
$.lang.register('discord.customcommands.channelcom.404', 'No channels are set on that command.');
$.lang.register('discord.customcommands.commands', 'Commands: $1');
$.lang.register('discord.customcommands.bot.commands', 'Bot Commands: $1');
$.lang.register('discord.customcommands.pricecom.usage', 'Usage: !pricecom [command] [amount]');
$.lang.register('discord.customcommands.pricecom.success', 'Cost for command !$1 has been set to $2.');
$.lang.register('discord.customcommands.aliascom.usage', 'Usage: !aliascom [alias] [command]');
$.lang.register('discord.customcommands.aliascom.success', 'Command !$2 has been aliased to !$1');
$.lang.register('discord.customcommands.delalias.usage', 'Usage: !delalias [alias]');
$.lang.register('discord.customcommands.delalias.success', 'Alias !$1 has been removed.');
$.lang.register('discord.customcommands.404', 'That command does not exist.');
$.lang.register('discord.customcommands.alias.404', 'That alias does not exist.');
$.lang.register('discord.customcommands.customapi.404', 'The !$1 command requires parameters.');
$.lang.register('discord.customcommands.customapijson.err', '!$1: An error occurred processing the API.');
