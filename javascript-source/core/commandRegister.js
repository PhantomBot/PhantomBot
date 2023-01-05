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
        aliases = {},
        _aliasesLock = new Packages.java.util.concurrent.locks.ReentrantLock(),
        _commandsLock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /*
     * @function registerChatCommand
     *
     * @param {String} script
     * @param {String} command
     * @param {Number} groupId
     */
    function registerChatCommand(script, command, groupId) {
        command = $.jsString(command).toLowerCase();
        // If groupId is undefined set it to 7 (viewer).
        groupId = (groupId === undefined ? $.PERMISSION.Viewer : groupId);

        if (commandExists(command)) {
            return;
        }

        // This is for the panel commands.
        if (groupId === $.PERMISSION.Panel) {
            if ($.inidb.exists('permcom', command)) {
                $.inidb.del('permcom', command);
            }

            _commandsLock.lock();
            try {
                commands[command] = {
                    groupId: groupId,
                    script: script,
                    subcommands: {}
                };
            } finally {
                _commandsLock.unlock();
            }

            return;
        }

        // Handle disabled commands.
        if ($.inidb.exists('disabledCommands', command)) {
            $.inidb.set('tempDisabledCommandScript', command, script);
            return;
        }

        $.inidb.del('tempDisabledCommandScript', command);

        // Get and set the command permission.
        groupId = $.getSetIniDbNumber('permcom', command, groupId);

        _commandsLock.lock();
        try {
            commands[command] = {
                groupId: groupId,
                script: script,
                subcommands: {}
            };
        } finally {
            _commandsLock.unlock();
        }
    }

    /*
     * @function registerChatSubcommand
     *
     * @param {String} command
     * @param {String} subcommand
     * @param {Number} groupId
     */
    function registerChatSubcommand(command, subcommand, groupId) {
        command = $.jsString(command).toLowerCase();
        subcommand = $.jsString(subcommand).toLowerCase();
        // If groupId is undefined set it to 7 (viewer).
        groupId = (groupId === undefined ? $.PERMISSION.Viewer : groupId);

        if (!commandExists(command) || subCommandExists(command, subcommand)) {
            return;
        }

        // Get and set the command permission.
        groupId = $.getSetIniDbNumber('permcom', (command + ' ' + subcommand), groupId);

        _commandsLock.lock();
        try {
            commands[command].subcommands[subcommand] = {
                groupId: groupId
            };
        } finally {
            _commandsLock.unlock();
        }
    }

    /*
     * @function registerChatAlias
     *
     * @param {String} alias
     */
    function registerChatAlias(alias) {
        alias = $.jsString(alias).toLowerCase();
        _aliasesLock.lock();
        try {
            if (!aliasExists(alias)) {
                aliases[alias] = true;
            }
        } finally {
            _aliasesLock.unlock();
        }
    }

    /*
     * @function unregisterChatCommand
     *
     * @param {String} command
     */
    function unregisterChatCommand(command) {
        command = $.jsString(command).toLowerCase();
        if (commandExists(command)) {
            _commandsLock.lock();
            try {
                delete commands[command];
            } finally {
                _commandsLock.unlock();
            }

            _aliasesLock.lock();
            try {
                delete aliases[command];
            } finally {
                _aliasesLock.unlock();
            }
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
        command = $.jsString(command).toLowerCase();
        _commandsLock.lock();
        try {
            $.inidb.set('tempDisabledCommandScript', command, commands[command].script);
        } finally {
            _commandsLock.unlock();
        }

        if (commandExists(command)) {
            _commandsLock.lock();
            try {
                delete commands[command];
            } finally {
                _commandsLock.unlock();
            }

        } else if (aliasExists(command)) {
            _aliasesLock.lock();
            try {
                delete aliases[command];
            } finally {
                _aliasesLock.unlock();
            }
        }
    }

    /*
     * @function unregisterChatSubcommand
     *
     * @param {String} command
     * @param {String} subcommand
     */
    function unregisterChatSubcommand(command, subcommand) {
        command = $.jsString(command).toLowerCase();
        subcommand = $.jsString(subcommand).toLowerCase();

        _commandsLock.lock();
        try {
            if (subCommandExists(command, subcommand)) {
                delete commands[command].subcommands[subcommand];
            }
        } finally {
            _commandsLock.unlock();
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
        command = $.jsString(command).toLowerCase();
        _commandsLock.lock();
        try {
            if (commands[command] === undefined) {
                return "Undefined";
            }

            return commands[command].script;
        } finally {
            _commandsLock.unlock();
        }
    }

    /*
     * @function commandExists
     *
     * @param  {String} command
     * @return {Boolean}
     */
    function commandExists(command) {
        command = $.jsString(command).toLowerCase();
        _commandsLock.lock();
        try {
            return (commands[command] !== undefined);
        } finally {
            _commandsLock.unlock();
        }
    }

    /*
     * @function aliasExists
     *
     * @param {String} command
     */
    function aliasExists(alias) {
        alias = $.jsString(alias).toLowerCase();
        _aliasesLock.lock();
        try {
            return (aliases[alias] !== undefined);
        } finally {
            _aliasesLock.unlock();
        }
    }

    /*
     * @function subCommandExists
     *
     * @param  {String} command
     * @param  {String} subcommand
     * @return {Boolean}
     */
    function subCommandExists(command, subcommand) {
        command = $.jsString(command).toLowerCase();
        subcommand = $.jsString(subcommand).toLowerCase();
        _commandsLock.lock();
        try {
            if (commandExists(command)) {
                return (commands[command].subcommands[subcommand] !== undefined);
            }
        } finally {
            _commandsLock.unlock();
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
        command = $.jsString(command).toLowerCase();
        var groupid = $.PERMISSION.Viewer;

        _commandsLock.lock();
        try {
            if (commandExists(command)) {
                groupid = commands[command].groupId;
            }
        } finally {
            _commandsLock.unlock();
        }

        return groupid;
    }

    /*
     * @function getCommandGroupName
     *
     * @param  {String} command
     * @return {String}
     */
    function getCommandGroupName(command) {
        command = $.jsString(command).toLowerCase();
        var group = '';
        _commandsLock.lock();
        try {
            if (commandExists(command)) {
                if (commands[command].groupId === $.PERMISSION.Caster) {
                    group = 'Caster';
                } else if (commands[command].groupId === $.PERMISSION.Admin) {
                    group = 'Administrator';
                } else if (commands[command].groupId === $.PERMISSION.Mod) {
                    group = 'Moderator';
                } else if (commands[command].groupId === $.PERMISSION.Sub) {
                    group = 'Subscriber';
                } else if (commands[command].groupId === $.PERMISSION.Donator) {
                    group = 'Donator';
                } else if (commands[command].groupId === $.PERMISSION.VIP) {
                    group = 'VIP';
                } else if (commands[command].groupId === $.PERMISSION.Regular) {
                    group = 'Regular';
                } else if (commands[command].groupId === $.PERMISSION.Viewer) {
                    group = 'Viewer';
                }

                return group;
            }
        } finally {
            _commandsLock.unlock();
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
        command = $.jsString(command).toLowerCase();
        subcommand = $.jsString(subcommand).toLowerCase();
        _commandsLock.lock();
        try {
            if (commandExists(command)) {
                if (subCommandExists(command, subcommand)) {
                    return commands[command].subcommands[subcommand].groupId;
                }
                return getCommandGroup(command);
            }
        } finally {
            _commandsLock.unlock();
        }

        return $.PERMISSION.Viewer;
    }

    /*
     * @function getSubCommandGroupName
     *
     * @param  {String} command
     * @param  {String} subcommand
     * @return {String}
     */
    function getSubCommandGroupName(command, subcommand) {
        command = $.jsString(command).toLowerCase();
        subcommand = $.jsString(subcommand).toLowerCase();
        var group = '';

        _commandsLock.lock();
        try {
            if (subCommandExists(command, subcommand)) {
                if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Caster) {
                    group = 'Caster';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Admin) {
                    group = 'Administrator';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Mod) {
                    group = 'Moderator';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Sub) {
                    group = 'Subscriber';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Donator) {
                    group = 'Donator';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.VIP) {
                    group = 'VIP';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Regular) {
                    group = 'Regular';
                } else if (commands[command].subcommands[subcommand].groupId === $.PERMISSION.Viewer) {
                    group = 'Viewer';
                }
                return group;
            }
        } finally {
            _commandsLock.unlock();
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
        command = $.jsString(command).toLowerCase();
        _commandsLock.lock();
        try {
            if (commandExists(command)) {
                commands[command].groupId = groupId;
            }
        } finally {
            _commandsLock.unlock();
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
        command = $.jsString(command).toLowerCase();
        subcommand = $.jsString(subcommand).toLowerCase();
        _commandsLock.lock();
        try {
            if (subCommandExists(command, subcommand)) {
                commands[command].subcommands[subcommand].groupId = groupId;
            }
        } finally {
            _commandsLock.unlock();
        }
    }

    /*
     * @function getSubCommandFromArguments
     *
     * @param {String}   command
     * @param {String[]} args
     */
    function getSubCommandFromArguments(command, args) {
        command = $.jsString(command).toLowerCase();
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

    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./core/commandRegister.js')) {
            var args = event.getArgs(),
                eventName = args[0] + '',
                command = args[1] + '',
                commandLower = command.toLowerCase() + '';
            if (eventName === 'enable') {
                if ($.inidb.exists('tempDisabledCommandScript', commandLower)) {
                    $.registerChatCommand($.inidb.get('tempDisabledCommandScript', commandLower), commandLower);
                }
            } else if (eventName === 'disable') {
                if (commandExists(commandLower)) {
                    tempUnRegisterChatCommand(commandLower);
                }
            }
        }
    });
})();
