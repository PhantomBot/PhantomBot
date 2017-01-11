/**
 * commandRegister.js
 *
 * Register and keep track of commands.
 * (previously known as commandList.js)
 *
 * NOTE: You will have to register ANY command you implement!
 * The commandEvent will not get fired to your module if the registry does not know about it!
 */
(function() {
    var commands = {},
        commandScriptTable = {},
        aliases = [];

    /**
     * @function getCommandScript
     * @export $
     * @param {string} command
     */
    function getCommandScript(command) {
        return commandScriptTable[command];
    };

    /**
     * @function registerChatSubcommand
     * @export $
     * @param {string} command
     * @param {string} subcommand
     * @param {string|Number} [groupId]
     */
    function registerChatSubcommand(command, subcommand, groupId) {
        groupId = (groupId ? groupId : 7);

        if (typeof groupId == 'string') {
            groupId = $.getGroupIdByName(groupId);
        }

        if (!commandExists(command)) {
            return;
        }

        if (subCommandExists(command, subcommand)) {
            return;
        }

        if ($.inidb.exists('permcom', command + " " + subcommand)) {
            var newGroupId = parseInt($.inidb.get('permcom', command + " " + subcommand));
            groupId = newGroupId;
        } else {
            $.inidb.set('permcom', command + " " + subcommand, groupId);
        }

        commands[command].subcommands[subcommand] = {
            groupId: groupId
        }
    };

    /**
     * @function registerChatCommand
     * @export $
     * @param {string} script
     * @param {string} command
     * @param {string|Number} [groupId]
     */
    function registerChatCommand(script, command, groupId) {
        script = script.replace('\\', '/').replace('./scripts/', '');
        groupId = (groupId ? groupId : 7);

        if (typeof groupId == 'string') {
            groupId = $.getGroupIdByName(groupId);
        }

        if ($.commandExists(command)) {
            $.log.error('Failed to register command as already registered: ' + command + ' Script: ' + script + ' Original Script: ' + commandScriptTable[command]);
            return;
        }

        if (groupId == 30) {
            if ($.inidb.exists('permcom', command)) {
                $.inidb.del('permcom', command);
            }
            commands[command] = {
                groupId: groupId,
                script: script,
                subcommands: {}
            };
            commandScriptTable[command] = script;
            return;
        }

        if ($.inidb.exists('disabledCommands', command)) {
            $.inidb.set('tempDisabledCommandScript', command, script);
            return;
        }

        if ($.inidb.exists('permcom', command)) {
            var newGroupId = parseInt($.inidb.get('permcom', command));
            groupId = newGroupId;
        } else {
            $.inidb.set('permcom', command, groupId);
        }

        commands[command] = {
            groupId: groupId,
            script: script,
            subcommands: {}
        };

        commandScriptTable[command] = script;
    };

    /**
     * @function registerChatAlias
     * @export $
     * @param {command} alias
     */

    function registerChatAlias(alias) {
        if (aliases[alias] === undefined) {
            aliases[alias] = true;
        }
    };

    /**
     * @function unregisterChatCommand
     * @export $
     * @param {string} command
     */
    function unregisterChatCommand(command) {
        if (commandExists(command)) {
            delete commands[command];
            delete commandScriptTable[command];
            delete aliases[command];
        }

        $.inidb.del('permcom', command);
        $.inidb.del('disabledCommands', command);
    };

    /**
     * @function tempUnRegisterChatCommand
     * @export $
     * @param {string} command
     */
    function tempUnRegisterChatCommand(command) {
        $.inidb.set('tempDisabledCommandScript', command, commands[command].script);
        if (commandExists(command)) {
            delete commands[command];
            delete commandScriptTable[command];
            delete aliases[command];
        }

        /** This is used for disablecom. */
        //$.inidb.del('permcom', command);
    };

    /**
     * @function unregisterChatSubcommand
     * @export $
     * @param {string} command
     * @param {string} subcommand
     */
    function unregisterChatSubcommand(command, subcommand) {
        if (commandExists(command)) {
            delete commands[command].subcommands[subcommand];
        }

        $.inidb.del('permcom', command + ' ' + subcommand);
    };

    /**
     * @function commandExists
     * @export $
     * @param {string} command
     * @returns {boolean}
     */
    function commandExists(command) {
        return (commands[command] ? true : false);
    };

    /**
     * @function aliasExists
     * @export $
     * @param {string} command
     */
    function aliasExists(alias) {
        return aliases[alias];
    };

    /**
     * @function subCommandExists
     * @export $
     * @param {string} command
     * @param {string} subcommand
     * @return {boolean}
     */
    function subCommandExists(command, subcommand) {
        if (commandExists(command)) {
            return (commands[command].subcommands[subcommand] ? true : false);
        }
        return false;
    };

    /**
     * @function getCommandGroup
     * @export $
     * @param command
     * @param name
     * @returns {Number}
     */
    function getCommandGroup(command, name) {
        if (commandExists(command)) {
            return commands[command].groupId;
        }
        return 7;
    };


    /**
     * @function getCommandGroupName
     * @export $
     * @param command
     * @returns {name}
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
                group = 'Hoster';
            } else if (commands[command].groupId == 6) {
                group = 'Regular';
            } else if (commands[command].groupId == 7) {
                group = 'Viewer';
            }
            return group;
        }
        return 'Viewer';
    };

    /**
     * @function getSubcommandGroup
     * @export $
     * @param command
     * @param subcommand
     * @param name
     * @returns {Number}
     */
    function getSubcommandGroup(command, subcommand, name) {
        if (commandExists(command)) {
            if (subCommandExists(command, subcommand)) {
                return commands[command].subcommands[subcommand].groupId;
            }
            return getCommandGroup(command, name);
        }
        return 7;
    };

    /**
     * @function getSubCommandGroupName
     * @export $
     * @param command
     * @param subcommand
     * @returns {String}
     *
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
                group = 'Hoster';
            } else if (commands[command].subcommands[subcommand].groupId == 6) {
                group = 'Regular';
            } else if (commands[command].subcommands[subcommand].groupId == 7) {
                group = 'Viewer';
            }
            return group;
        }
        return 'Viewer';
    };

    /**
     * @function updateCommandGroup
     * @export $
     * @param command
     * @param groupId
     */
    function updateCommandGroup(command, groupId) {
        if (commandExists(command)) {
            commands[command].groupId = groupId;
        }
    };

    /**
     * @function updateSubcommandGroup
     * @export $
     * @param command
     * @param sub
     * @param groupId
     */
    function updateSubcommandGroup(command, subcommand, groupId) {
        if (subCommandExists(command, subcommand)) {
            commands[command].subcommands[subcommand].groupId = groupId;
        }
    };

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
})();
