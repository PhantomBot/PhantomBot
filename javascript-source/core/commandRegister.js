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

/**
 * commandRegister.js
 *
 * Register and keep track of commands.
 *
 * NOTE: You will have to register ANY command you implement!
 * The commandEvent will not get fired to your module if the registry does not know about it!
 */
(function() {
    var commands = {},
        aliases = {};

    /*
     * @function registerChatCommand
     *
     * @param {String} script
     * @param {String} command
     * @param {String} groupId
     */
    function registerChatCommand(script, command, groupId) {
        // If groupId is undefined set it to 7 (viewer).
        groupId = (groupId === undefined ? 7 : groupId);

        if (commandExists(command)) {
            return;
        }

        // This is for the panel commands.
        if (groupId == 30) {
            if ($.inidb.exists('permcom', command)) {
                $.inidb.del('permcom', command);
            }
            commands[command] = {
                groupId: groupId,
                script: script,
                subcommands: {}
            };
            return;
        }

        // Handle disabled commands.
        if ($.inidb.exists('disabledCommands', command)) {
            $.inidb.set('tempDisabledCommandScript', command, script);
            return;
        }

        // Get and set the command permission.
        groupId = $.getSetIniDbNumber('permcom', command, groupId);

        commands[command] = {
            groupId: groupId,
            script: script,
            subcommands: {}
        };
    }

    /*
     * @function registerChatSubcommand
     *
     * @param {String} command
     * @param {String} subcommand
     * @param {String} groupId
     */
    function registerChatSubcommand(command, subcommand, groupId) {
        // If groupId is undefined set it to 7 (viewer).
        groupId = (groupId === undefined ? 7 : groupId);

        if (!commandExists(command) || subCommandExists(command, subcommand)) {
            return;
        }

        // Get and set the command permission.
        groupId = $.getSetIniDbNumber('permcom', (command + ' ' + subcommand), groupId);

        commands[command].subcommands[subcommand] = {
            groupId: groupId
        }
    }

    /*
     * @function registerChatAlias
     *
     * @param {String} alias
     */
    function registerChatAlias(alias) {
        if (!aliasExists(alias)) {
            aliases[alias] = true;
        }
    }

    /*
     * @function unregisterChatCommand
     *
     * @param {String} command
     */
    function unregisterChatCommand(command) {
        if (commandExists(command)) {
            delete commands[command];
            delete aliases[command];
        }

        $.inidb.del('permcom', command);
        $.inidb.del('pricecom', command);
        $.inidb.del('cooldown', command);
        $.inidb.del('paycom', command);
        $.inidb.del('disabledCommands', command);
    }

    /*
     * @function tempUnRegisterChatCommand
     *
     * @param {String} command
     */
    function tempUnRegisterChatCommand(command) {
        $.inidb.set('tempDisabledCommandScript', command, commands[command].script);
        if (commandExists(command)) {
            delete commands[command];
            delete aliases[command];
        }
    }

    /*
     * @function unregisterChatSubcommand
     *
     * @param {String} command
     * @param {String} subcommand
     */
    function unregisterChatSubcommand(command, subcommand) {
        if (subCommandExists(command, subcommand)) {
            delete commands[command].subcommands[subcommand];
        }

        $.inidb.del('permcom', command + ' ' + subcommand);
        $.inidb.del('pricecom', command + ' ' + subcommand);
    }

    /*
     * @function getCommandScript
     *
     * @param  {String} command
     * @return {String}
     */
    function getCommandScript(command) {
        return commands[command].script;
    }

    /*
     * @function commandExists
     *
     * @param  {String} command
     * @return {Boolean}
     */
    function commandExists(command) {
        return (commands[command] !== undefined);
    }

    /*
     * @function aliasExists
     *
     * @param {String} command
     */
    function aliasExists(alias) {
        return (aliases[alias] !== undefined);
    }

    /*
     * @function subCommandExists
     *
     * @param  {String} command
     * @param  {String} subcommand
     * @return {Boolean}
     */
    function subCommandExists(command, subcommand) {
        if (commandExists(command)) {
            return (commands[command].subcommands[subcommand] !== undefined);
        }
        return false;
    }

    /*
     * @function getCommandGroup
     *
     * @param  {String} command
     * @return {Number}
     */
    function getCommandGroup(command) {
        if (commandExists(command)) {
            return commands[command].groupId;
        }
        return 7;
    }

    /*
     * @function getCommandGroupName
     *
     * @param  {String} command
     * @return {String}
     */
    function getCommandGroupName(command) {
        var group = '';

        if (commandExists(command)) {
            if (commands[command].groupId == 0) {
                group = 'Caster';
            } else if (commands[command].groupId == 1) {
                group = 'Administrator';
            } else if (commands[command].groupId == 2) {
                group = 'Moderator';
            } else if (commands[command].groupId == 3) {
                group = 'Subscriber';
            } else if (commands[command].groupId == 4) {
                group = 'Donator';
            } else if (commands[command].groupId == 5) {
                group = 'VIP';
            } else if (commands[command].groupId == 6) {
                group = 'Regular';
            } else if (commands[command].groupId == 7) {
                group = 'Viewer';
            }
            return group;
        }
        return 'Viewer';
    }

    /*
     * @function getSubcommandGroup
     *
     * @param  {String} command
     * @param  {String} subcommand
     * @return {Number}
     */
    function getSubcommandGroup(command, subcommand) {
        if (commandExists(command)) {
            if (subCommandExists(command, subcommand)) {
                return commands[command].subcommands[subcommand].groupId;
            }
            return getCommandGroup(command);
        }
        return 7;
    }

    /*
     * @function getSubCommandGroupName
     *
     * @param  {String} command
     * @param  {String} subcommand
     * @return {String}
     */
    function getSubCommandGroupName(command, subcommand) {
        var group = '';

        if (subCommandExists(command, subcommand)) {
            if (commands[command].subcommands[subcommand].groupId == 0) {
                group = 'Caster';
            } else if (commands[command].subcommands[subcommand].groupId == 1) {
                group = 'Administrator';
            } else if (commands[command].subcommands[subcommand].groupId == 2) {
                group = 'Moderator';
            } else if (commands[command].subcommands[subcommand].groupId == 3) {
                group = 'Subscriber';
            } else if (commands[command].subcommands[subcommand].groupId == 4) {
                group = 'Donator';
            } else if (commands[command].subcommands[subcommand].groupId == 5) {
                group = 'VIP';
            } else if (commands[command].subcommands[subcommand].groupId == 6) {
                group = 'Regular';
            } else if (commands[command].subcommands[subcommand].groupId == 7) {
                group = 'Viewer';
            }
            return group;
        }
        return 'Viewer';
    }

    /*
     * @function updateCommandGroup
     *
     * @param {String} command
     * @param {Number} groupId
     */
    function updateCommandGroup(command, groupId) {
        if (commandExists(command)) {
            commands[command].groupId = groupId;
        }
    }

    /*
     * @function updateSubcommandGroup
     *
     * @param {String} command
     * @param {String} subcommand
     * @param {Number} groupId
     */
    function updateSubcommandGroup(command, subcommand, groupId) {
        if (subCommandExists(command, subcommand)) {
            commands[command].subcommands[subcommand].groupId = groupId;
        }
    }

    /*
     * @function getSubCommandFromArguments
     *
     * @param {String}   command
     * @param {String[]} args
     */
    function getSubCommandFromArguments(command, args) {
        if (!commandExists(command) || args[0] === undefined) {
            return '';
        } else {
            var subCommand = args[0].toLowerCase();

            if (subCommandExists(command, subCommand)) {
                return subCommand;
            }
            return '';
        }
    }

    /** Export functions to API */
    $.registerChatCommand = registerChatCommand;
    $.registerChatSubcommand = registerChatSubcommand;
    $.unregisterChatCommand = unregisterChatCommand;
    $.unregisterChatSubcommand = unregisterChatSubcommand;
    $.commandExists = commandExists;
    $.subCommandExists = subCommandExists;
    $.getCommandGroup = getCommandGroup;
    $.getCommandGroupName = getCommandGroupName;
    $.getSubcommandGroup = getSubcommandGroup;
    $.getSubCommandGroupName = getSubCommandGroupName;
    $.updateCommandGroup = updateCommandGroup;
    $.updateSubcommandGroup = updateSubcommandGroup;
    $.getCommandScript = getCommandScript;
    $.aliasExists = aliasExists;
    $.registerChatAlias = registerChatAlias;
    $.tempUnRegisterChatCommand = tempUnRegisterChatCommand;
    $.getSubCommandFromArguments = getSubCommandFromArguments;
})();
