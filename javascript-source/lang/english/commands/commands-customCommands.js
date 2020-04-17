/*
 * Copyright (C) 2016-2019 phantombot.tv
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

$.lang.register('customcommands.add.error', 'That command already exists');
$.lang.register('customcommands.add.success', 'Command !$1 has been created!');
$.lang.register('customcommands.add.usage', 'Usage: !addcom (command) (message)');
$.lang.register('customcommands.add.commandtag.notfirst', '(command) tag must be at the start of a custom command when used.');
$.lang.register('customcommands.add.commandtag.invalid', '(command) tag command does not exist: $1');
$.lang.register('customcommands.alias.delete.error.alias.404', 'Alias does not exist: !$1');
$.lang.register('customcommands.alias.delete.success', 'The alias !$1 was successfully deleted!');
$.lang.register('customcommands.alias.delete.usage', 'Usage: !delalias (alias name)');
$.lang.register('customcommands.alias.error', 'An alias already exists for !$1. Delete it first.');
$.lang.register('customcommands.alias.error.target404', 'The target command does not exist!');
$.lang.register('customcommands.alias.error.exists', 'The command you want to alias to already exists.');
$.lang.register('customcommands.add.disabled', 'That command is currently disabled. Re-enable the command or delete it to add a new command with that name.');
$.lang.register('customcommands.alias.success', 'The command !$1 was successfully aliased to !$2');
$.lang.register('customcommands.alias.usage', 'Usage: !aliascom (alias name) (existing command) [optional parameters]');
$.lang.register('customcommands.delete.success', 'Command !$1 has been removed!');
$.lang.register('customcommands.delete.usage', 'Usage: !delcom (command)');
$.lang.register('customcommands.edit.404', 'You cannot overwrite a default command.');
$.lang.register('customcommands.edit.editcom.alias', 'You cannot edit an alias, please use the following: !editcom !$1 $2');
$.lang.register('customcommands.set.perm.error.target404', 'The command !$1 does not exist!');
$.lang.register('customcommands.set.perm.success', 'Permissions for command: $1 set for group: $2 and higher.');
$.lang.register('customcommands.set.perm.unset.success', 'All recursive permissions for the command: $1 and any of its aliases have been removed.');
$.lang.register('customcommands.set.perm.usage', 'Usage: !permcom (command name) (group id/name). Restricts usage of a command to viewers with a certain permission level.');
$.lang.register('customcommands.set.perm.404', 'Command could not be found: $1');
$.lang.register('customcommands.set.price.error.404', 'Please select a command that exists and is available to non-mods.');
$.lang.register('customcommands.set.price.error.invalid', 'Please enter a valid price of 0 or greater.');
$.lang.register('customcommands.set.price.success', 'The price for !$1 has been set to $2 $3.');
$.lang.register('customcommands.set.price.usage', 'Usage: !pricecom (command) [subcommand] [subaction] (price). Optional: subcommand and subaction');
$.lang.register('customcommands.set.pay.error.404', 'Please select a command that exists and is available to non-mods.');
$.lang.register('customcommands.set.pay.error.invalid', 'Please enter a valid payment of 0 or greater.');
$.lang.register('customcommands.set.pay.success', 'The payment for !$1 has been set to $2 $3.');
$.lang.register('customcommands.set.pay.usage', 'Usage: !paycom (command) (price)');
$.lang.register('customcommands.404.no.commands', 'There are no custom commands, add one with !addcom');
$.lang.register('customcommands.cmds', 'Current custom commands: $1');
$.lang.register('customcommands.edit.usage', 'Usage: !editcom (command) (message)');
$.lang.register('customcommands.edit.success', 'Command !$1 has been edited!');
$.lang.register('customcommands.token.usage', 'Usage: !tokencom (command) (token) -- WARNING: This should be done from the bot console or web panel, if you run this from chat, anyone watching chat can copy your info!');
$.lang.register('customcommands.token.success', 'Token set for command !$1! Make sure you put a (token) subtag in the customapi url for this command in the spot you want it to appear');
$.lang.register('customcommands.touser.offline', 'Sorry, but $1 appears to be offline!');
$.lang.register('customcommands.customapi.404', 'The !$1 command requires parameters.');
$.lang.register('customcommands.customapijson.err', '!$1: An error occurred processing the API.');
$.lang.register('customcommands.disable.usage', 'Usage: !disablecom (command)');
$.lang.register('customcommands.disable.404', 'That command does not exist.');
$.lang.register('customcommands.disable.err', 'That command is already disabled.');
$.lang.register('customcommands.disable.success', 'Command !$1 has been disabled.');
$.lang.register('customcommands.enable.usage', 'Usage: !enablecom (command)');
$.lang.register('customcommands.enable.404', 'That command does not exist.');
$.lang.register('customcommands.enable.err', 'That command is not disabled.');
$.lang.register('customcommands.enable.success', 'Command !$1 has been re-enabled.');
$.lang.register('customcommands.reset.usage', 'Usage: !resetcom (command) (count). If no (count) then reset to 0.');
$.lang.register('customcommands.reset.success', 'The counter for !$1 has been reset.');
$.lang.register('customcommands.reset.change.fail', 'Invalid counter value: $1');
$.lang.register('customcommands.reset.change.success', 'The counter for !$1 has been set to $2.');
$.lang.register('customcommands.botcommands', 'Commands: $1');
$.lang.register('customcommands.botcommands.error', 'Provide a number to find a page.');
$.lang.register('customcommands.botcommands.total', 'Total Pages: $1 [See also: https://phantombot.tv/commands]');
