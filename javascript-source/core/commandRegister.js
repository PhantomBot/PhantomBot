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
        commandScriptTable = {};

    /**
     * @function getCommandScript
     * @export $
     * @param {string} command
     */
    function getCommandScript(command) {
        return commandScriptTable[command];
    }

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

        if (!$.commandExists(command)) {
            return;
        }

        if (subCommandExists(command, subcommand)) {
            return;
        }

        if ($.inidb.exists('permcom', command + " " + subcommand)) {
            var newGroupId = parseInt($.inidb.get('permcom', command + " " + subcommand));
            groupId = newGroupId;
        }

        commands[command].subcommands[subcommand] = {
            groupId: groupId
        }
    }

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
            return;
        }

        if ($.inidb.exists('permcom', command)) {
            var newGroupId = parseInt($.inidb.get('permcom', command));
            groupId = newGroupId;
        }

        commands[command] = {
            groupId: groupId,
            script: script,
            subcommands: {}
        };

        commandScriptTable[command] = script;
    };

    /**
     * @function unregisterChatCommand
     * @export $
     * @param {string} command
     */
    function unregisterChatCommand(command) {
        delete commands[command];
        delete commandScriptTable[command];
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
    }

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
    }

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
     * @function getCommandGroup
     * @export $
     * @param command
     * @returns {name}
     */
    function getCommandGroupName(command) {
        var group = '';

        if (commandExists(command)) {
            if (commands[command].groupId == 1) {
                group = 'Administartor';
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
     * @function updateCommandGroup
     * @export $
     * @param command
     * @param groupId
     */
    function updateCommandGroup(command, groupId) {
        if (commandExists(command)) {
            commands[command].groupId = groupId;
        }
    }

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
    $.updateCommandGroup = updateCommandGroup;
    $.updateSubcommandGroup = updateSubcommandGroup;
    $.getCommandScript = getCommandScript;
})();