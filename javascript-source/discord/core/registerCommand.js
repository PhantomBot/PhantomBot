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

/**
 * This script is made to register discord commands.
 *
 */
(function() {
    var commands = {},
        aliases = {};

    /**
     * @function commandExists
     *
     * @export $.discord
     * @param {string} command
     * @return {boolean}
     */
    function commandExists(command) {
        return (commands[command] !== undefined);
    }

    /**
     * @function aliasExists
     *
     * @export $.discord
     * @param {string} command
     * @return {boolean}
     */
    function aliasExists(command) {
        return (aliases[command] !== undefined && aliases[command] !== '');
    }

    /**
     * @function subCommandExists
     *
     * @export $.discord
     * @param {string} command
     * @param {string} subCommand
     * @return {boolean}
     */
    function subCommandExists(command, subCommand) {
        return (commands[command] !== undefined && commands[command].subCommand[subCommand] !== undefined);
    }

    /**
     * @function setCommandPermission
     *
     * @export $.discord
     * @param {string} command
     * @param {int} permmission
     */
    function setCommandPermission(command, permission) {
        if (command.includes(' ')) {
            if (subCommandExists(command.split(' ')[0], command.split(' ')[1])) {
                commands[command.split(' ')[0]].subCommand[command.split(' ')[1]].permission = parseInt(permission);
            }
        } else {
            if (commandExists(command)) {
                commands[command].permission = parseInt(permission);
            }
        }
    }

    /**
     * @function setCommandChannel
     *
     * @export $.discord
     * @param {string} command
     * @param {string} channel
     * @param {boolean} isToRemove
     */
    function setCommandChannel(command, channel, isToRemove) {
        if (commandExists(command)) {
            if (isToRemove === true) {
                delete commands[command].channel[channel];
            } else {
                commands[command].channel[channel] = channel;
            }
        }
    }

    /**
     * @function clearChannelCommands
     */
    function clearChannelCommands(command) {
        commands[command].channel = [];
    }

    /**
     * @function setCommandCost
     *
     * @export $.discord
     * @param {string} command
     * @param {int}    cost
     */
    function setCommandCost(command, cost) {
        if (commandExists(command)) {
            commands[command].cost = parseInt(cost);
        }
    }

    /**
     * @function setCommandAlias
     *
     * @export $.discord
     * @param {string} command
     * @param {string} alias
     */
    function setCommandAlias(command, alias) {
        if (commandExists(command)) {
            commands[command].alias = alias.toLowerCase();
            aliases[commands[command].alias] = command.toLowerCase();
        }
    }

    /**
     * @function removeAlias
     *
     * @export $.discord
     * @param {string} command
     * @param {string} alias
     */
    function removeAlias(command, alias) {
        if (commandExists(command)) {
            delete aliases[commands[command].alias];
            commands[command].alias = '';
        }
    }

    /**
     * @function getCommandCost
     *
     * @export $.discord
     * @param {string} command
     * @return {int}
     */
    function getCommandCost(command) {
        if (commandExists(command)) {
            return commands[command].cost;
        }
        return 0;
    }

    /**
     * @function getCommandPermission
     *
     * @export $.discord
     * @param {string} command
     * @return {int}
     */
    function getCommandPermission(command) {
        if (commandExists(command)) {
            return commands[command].permission;
        }
        return 0;
    }

    /**
     * @function getCommandPermission
     *
     * @export $.discord
     * @param {string} command
     * @param {string} subCommand
     * @return {int}
     */
    function getSubCommandPermission(command, subCommand) {
        if (commandExists(command) && subCommandExists(command, subCommand)) {
            return commands[command].subCommand[subCommand].permission;
        }
        return 0;
    }

    /**
     * @function getCommandChannel
     *
     * @export $.discord
     * @param {string} command
     * @return {string}
     */
    function getCommandChannel(command, channelObj) {
        if (commandExists(command)) {
            if (typeof channelObj === 'object') {
                if (commands[command].channel[channelObj.getName()] === undefined) {
                    return commands[command].channel[channelObj.getStringID()]
                } else {
                    return commands[command].channel[channelObj.getName()];
                }
            } else {
                return commands[command].channel[channelObj];
            }

        }
        return undefined;
    }

    /**
     * @function getCommandAlias
     *
     * @export $.discord
     * @param {string} command
     * @return {string}
     */
    function getCommandAlias(command) {
        if (aliasExists(command)) {
            return aliases[command];
        }
        return '';
    }

    /**
     * @function registerCommand
     *
     * @export $.discord
     * @param {string} scriptFile
     * @param {string} command
     * @param {int} permission
     */
    function registerCommand(scriptFile, command, permission) {
        if (!commandExists(command)) {

            commands[command] = {
                permission: $.getSetIniDbNumber('discordPermcom', command, permission),
                cost: ($.inidb.exists('discordPricecom', command) ? $.inidb.get('discordPricecom', command) : 0),
                alias: ($.inidb.exists('discordAliascom', command) ? $.inidb.get('discordAliascom', command) : ''),
                channel: [],
                scriptFile: scriptFile,
                subCommand: {}
            };

            if ($.inidb.exists('discordChannelcom', command)) {
                var keys = $.inidb.get('discordChannelcom', command).split(', '),
                    i;

                for (i in keys) {
                    commands[command].channel[keys[i]] = keys[i];
                }
            } else {
                commands[command].channel['_default_global_'] = '';
            }


            if (commands[command].alias !== '') {
                aliases[commands[command].alias] = command;
            }
        }
    }

    /**
     * @function registerSubCommand
     *
     * @export $.discord
     * @param {string} command
     * @param {string} subCommand
     * @param {int} permission
     */
    function registerSubCommand(command, subCommand, permission) {
        if (commandExists(command) && !subCommandExists(command, subCommand)) {

            commands[command].subCommand[subCommand] = {
                permission: $.getSetIniDbNumber('discordPermcom', (command + ' ' + subCommand), permission)
            };
        }
    }

    /**
     * @function unregisterSubCommand
     *
     * @export $.discord
     * @param {string} command
     * @param {string} subCommand
     */
    function unregisterSubCommand(command, subCommand) {
        if (commandExists(command) && subCommandExists(command, subCommand)) {
            delete commands[command].subCommand[subCommand];
        }
    }

    /**
     * @function unregisterCommand
     *
     * @export $.discord
     * @param {string} command
     */
    function unregisterCommand(command) {
        if (commandExists(command)) {
            if (commands[command].alias !== '') {
                delete aliases[commands[command].alias];
            }
            delete commands[command];
        }
    }

    /* Export the function to the $.discord api. */
    $.discord.commands = commands;
    $.discord.commandExists = commandExists;
    $.discord.subCommandExists = subCommandExists;
    $.discord.getCommandPermission = getCommandPermission;
    $.discord.getSubCommandPermission = getSubCommandPermission;
    $.discord.registerCommand = registerCommand;
    $.discord.registerSubCommand = registerSubCommand;
    $.discord.unregisterCommand = unregisterCommand;
    $.discord.unregisterSubCommand = unregisterSubCommand;
    $.discord.setCommandPermission = setCommandPermission;
    $.discord.getCommandChannel = getCommandChannel;
    $.discord.setCommandChannel = setCommandChannel;
    $.discord.setCommandCost = setCommandCost;
    $.discord.getCommandCost = getCommandCost;
    $.discord.getCommandAlias = getCommandAlias;
    $.discord.setCommandAlias = setCommandAlias;
    $.discord.aliasExists = aliasExists;
    $.discord.removeAlias = removeAlias;
    $.discord.clearChannelCommands = clearChannelCommands;
})();