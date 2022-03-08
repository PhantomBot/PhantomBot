/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
     * @param {JSON} permission
     */
    function setCommandPermission(command, permission) {
        if (command.includes(' ')) {
            if (subCommandExists(command.split(' ')[0], command.split(' ')[1])) {
                commands[command.split(' ')[0]].subCommand[command.split(' ')[1]].permission = getJSONCommandPermission(command, permission);
            }
        } else {
            if (commandExists(command)) {
                commands[command].permission = getJSONCommandPermission(command, permission);
            }
        }
    }

    /*
     * @function getCommandPermission
     *
     * @info Gets the json for the command permission
     */
    function getJSONCommandPermission(commandStr, permission) {
        // Already JSON return.
        if (permission.toString().startsWith('{')) {
            return permission;
        }

        // The script sometimes load before discord, so add this.
        while (!$.inidb.exists('discordPermsObj', 'obj')) {
            try {
                java.lang.Thread.sleep(1000);
            } catch (ex) {
                $.log.error('Failed to set permission on Discord command as Discord is not connected. Please restart PhantomBot.');
                return;
            }
        }

        // Build a new json object for the permissions of this command.
        var everyoneRoleID = 0;
        var discordRoles = $.discordAPI.getGuildRoles();
        var permissionsObj = {
            'roles': [],
            'permissions': []
        };

        for (var i = 0; i < discordRoles.size(); i++) {
            if (discordRoles.get(i).getName().equalsIgnoreCase('@everyone')) {
                everyoneRoleID = discordRoles.get(i).getId().asString();
                break;
            }
        }

        if ((permission + '').equals('0')) {
            permissionsObj.roles.push(everyoneRoleID + '');
        }

        permissionsObj.permissions.push({
            'name': 'Administrator',
            'selected': ((permission + '').equals('1') + '')
        });

        return JSON.stringify(permissionsObj);
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
            return JSON.parse(commands[command].permission);
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
            return JSON.parse(commands[command].subCommand[subCommand].permission);
        }
        return 0;
    }

    function updateCommandChannel(command) {
        if (commandExists(command)) {
            commands[command].channels = ($.inidb.exists('discordChannelcom', command) ? $.inidb.get('discordChannelcom', command) : '');
        }
    }

    /**
     * @function getCommandChannelAllowed
     *
     * @export $.discord
     * @param {string} command
     * @param {string} channelName
     * @param {string} channelId
     * @return {string}
     */
    function getCommandChannelAllowed(command, channelName, channelId) {
        if (commandExists(command) && commands[command].channels !== '') {
            var channels = commands[command].channels;
            var found = channels.indexOf(channelName + ',') === 0 || channels.indexOf(',' + channelName + ',') >= 0
                    || (channels.indexOf(channelName) === channels.lastIndexOf(',') + 1 && channels.endsWith(channelName))
                    || channels.indexOf(channelId + ',') === 0 || channels.indexOf(',' + channelId + ',') >= 0
                    || (channels.indexOf(channelId) === channels.lastIndexOf(',') + 1 && channels.endsWith(channelId));
            return found;

        }

        return true;
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
            if ($.inidb.exists('discordPermcom', command)) {
                permission = $.getIniDbString('discordPermcom', command);
            } else {
                permission = $.getSetIniDbString('discordPermcom', command, getJSONCommandPermission(command, permission));
            }

            commands[command] = {
                permission: getJSONCommandPermission(command, permission),
                cost: ($.inidb.exists('discordPricecom', command) ? $.inidb.get('discordPricecom', command) : 0),
                alias: ($.inidb.exists('discordAliascom', command) ? $.inidb.get('discordAliascom', command) : ''),
                channels: ($.inidb.exists('discordChannelcom', command) ? $.inidb.get('discordChannelcom', command) : ''),
                scriptFile: scriptFile,
                subCommand: {}
            };


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
            if ($.inidb.exists('discordPermcom', command)) {
                permission = $.getIniDbString('discordPermcom', command);
            } else {
                permission = $.getSetIniDbString('discordPermcom', command, getJSONCommandPermission(command, permission));
            }

            commands[command].subCommand[subCommand] = {
                permission: getJSONCommandPermission((command + ' ' + subCommand), permission)
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
    $.discord.getCommandChannelAllowed = getCommandChannelAllowed;
    $.discord.updateCommandChannel = updateCommandChannel;
    $.discord.setCommandCost = setCommandCost;
    $.discord.getCommandCost = getCommandCost;
    $.discord.getCommandAlias = getCommandAlias;
    $.discord.setCommandAlias = setCommandAlias;
    $.discord.aliasExists = aliasExists;
    $.discord.removeAlias = removeAlias;
})();
