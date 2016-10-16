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
    var commands = {};

    /**
     * @function registerChatCommand
     * @info Used to register chat commands.
     *
     * @export $
     * @param {string} script - can be null
     * @param {string} command
     * @param {int} groupId
     * @param {string} subCommand - can be null
     */
    function registerChatCommand(script, command, groupId, subCommand) {
        /* Checks if the group is is a string. */
        if (typeof groupId === 'string') {
            groupId = $.getGroupIdByName(groupId);
        }

        /* Checks the group id */
        groupId = (groupId ? groupId : 7);

        /* Checks if the command already exists */
        if (commandExists(command) && script !== null) {
            $.log.warn('Failed to register chat command !' + command + ' because it is already registered in script: ' + getCommandScript(command) + '.');
            return;
        }

        /* Checks if the command is a panel command */
        if (groupId === 30) {
            if ($.inidb.exists('permcom', command)) {
                $.inidb.del('permcom', command);
            }
            commands[command] = {
                groupId: groupId,
                script: script,
                price: 0,
                cooldown: -1,
                alias: null,
                subCommand: {}
            };
            return;
        }

        /* Checks if the command is disabled */
        if ($.inidb.exists('disabledCommands', command) || (subCommand !== undefined && $.inidb.exists('disabledCommands', command + ' ' + subCommand))) {
            if (subCommand !== undefined) {
                commands[command].subCommand[subCommand] = {
                    isDisabled: true,
                };
            }
            $.consoleDebug('Failed to register chat command !' + command + ' because it is disabled.');
            return;
        }

        /* Checks if the script is null, this is for custom command aliases */
        if (script === null) {
            commands[command].subCommand[subCommand] = {
                groupId: groupId,
                price: $.getIniDbNumber('pricecom', command + ' ' + subCommand, 0),
                script: commands[command].script,
                cooldown: $.getIniDbNumber('cooldown', command + ' ' + subCommand, -1),
                isDisabled: false
            };
            return;
        }

        /* Checks for the command permission */
        if ($.inidb.exists('permcom', command)) {
            groupId = parseInt($.inidb.get('permcom', command));
        } else {
            $.inidb.set('permcom', command, groupId);
        }

        /* Registers the command */
        commands[command] = {
            groupId: groupId,
            price: $.getIniDbNumber('pricecom', command, 0),
            script: script,
            alias: null,
            cooldown: $.getIniDbNumber('cooldown', command, -1),
            subCommand: {}
        };
    }

    /**
     * @function registerChatSubcommand
     * @info Used to register chat sub commands.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {int} groupId
     */
    function registerChatSubcommand(command, subCommand, groupId) {
        /* Checks if the group is is a string. */
        if (typeof groupId === 'string') {
            groupId = $.getGroupIdByName(groupId);
        }

        /* Checks the group id */
        groupId = (groupId ? groupId : 7);

        /* Checks if the command exists */
        if (!commandExists(command)) {
            $.log.warn('Failed to register chat sub command !' + command + ' ' + subCommand + ' because command !' + command + ' does not exist.');
            return;
        }

        /* Checks if the sub command exists */
        if (subCommandExists(command, subCommand) && !subCommandIsDisabled(command, subCommand)) {
            $.log.warn('Failed to register chat sub command !' + command + ' ' + subCommand + ' because it is already registered in script: ' + getCommandScript(command) + '.');
            return;
        }

        /* Checks for the command permission */
        if ($.inidb.exists('permcom', command + ' ' + subCommand)) {
            groupId = parseInt($.inidb.get('permcom', command + ' ' + subCommand));
        } else {
            $.inidb.set('permcom', command + ' ' + subCommand, groupId);
        }

        /* Registers the sub command. */
        registerChatCommand(null, command, groupId, subCommand);
    }

    /**
     * @function registerChatAlias
     * @info Used to regiser chat aliases.
     *
     * @export $
     * @param {string} script
     * @param {string} alias
     * @param {int} groupId
     */
    function registerChatAlias(script, alias, groupId) {
        /* Checks if the group is is a string. */
        if (typeof groupId === 'string') {
            groupId = $.getGroupIdByName(groupId);
        }

        /* Checks the group id */
        groupId = (groupId ? groupId : 7);

        /* Checks if the default command is disabled or not */
        if ($.inidb.exists('disabledCommands', $.inidb.get('aliases', alias))) {
            $.log.warn('Failed to register chat custom alias !' + alias + ' because the default command is disabled !' + $.inidb.get('command', $.inidb.get('aliases', alias)));
            return;
        }

        /* Registers the alias */
        registerChatCommand(script, alias, groupId);
        commands[alias].alias = $.inidb.get('aliases', alias);
    }

    /**
     * @function unregisterChatCommand
     * @info Used to unregiser chat commands.
     *
     * @export $
     * @param {string} command
     */
    function unregisterChatCommand(command) {
        if (commandExists(command)) {
            $.inidb.del('permcom', command);
            $.inidb.del('cooldown', command);
            $.inidb.del('pricecom', command);
            $.inidb.del('rewardcom', command);
            $.inidb.del('disabledCommands', command);
            delete commands[command];
        }
    }

    /**
     * @function unregisterChatSubcommand
     * @info Used to unregiser chat sub commands.
     *
     * @export $
     * @param {string} command
     */
    function unregisterChatSubcommand(command, subCommand) {
        if (commandExists(command)) {
            $.inidb.del('permcom', command + ' ' + subCommand);
            $.inidb.del('cooldown', command + ' ' + subCommand);
            $.inidb.del('pricecom', command + ' ' + subCommand);
            $.inidb.del('rewardcom', command + ' ' + subCommand);
            $.inidb.del('disabledCommands', command + ' ' + subCommand);
            delete commands[command].subCommand[subCommand];
        }
    }

    /**
     * @function disableChatCommand
     * @info Used to temp unregiser chat commands.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     */
    function disableChatCommand(command, subCommand) {
        if (subCommand === '') {
            if (commandExists(command)) {
                delete commands[command];
            }
            if ($.inidb.exists('aliases', command)) {
                delete commands[$.inidb.get('aliases', command)];
            }
        } else {
            if (subCommandExists(command, subCommand)) {
                commands[command].subCommand[subCommand] = {
                    isDisabled: true,
                };
            }
        }
    }

    /**
     * @function commandExists
     * @info Used to check if the sub command is disabled.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {boolean}
     */
    function subCommandIsDisabled(command, subCommand) {
        return (subCommandExists(command, subCommand) && commands[command].subCommand[subCommand].isDisabled === true);
    }

    /**
     * @function commandExists
     * @info Used to check if the command exists.
     *
     * @export $
     * @param {string} command
     * @returns {boolean}
     */
    function commandExists(command) {
        return (commands[command] !== undefined);
    }

    /**
     * @function aliasExists
     * @info Used to check if the alias exists.
     *
     * @export $
     * @param {string} alias
     * @returns {boolean}
     */
    function aliasExists(alias) {
        return (commands[alias].alias !== null);
    }

    /**
     * @function subCommandExists
     * @info Used to check if the sub command exists.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {boolean}
     */
    function subCommandExists(command, subCommand) {
        return (commands[command] !== undefined && commands[command].subCommand[subCommand] !== undefined);
    }

    /**
     * @function getCommandCost
     * @info Used to get the command cost.
     *
     * @export $
     * @param {string} command
     * @returns {int}
     */
    function getCommandCost(command) {
        return (commands[command] ? commands[command].price : 0);
    }

    /**
     * @function getSubCommandCost
     * @info Used to get the sub command cost.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {int}
     */
    function getSubCommandCost(command, subCommand) {
        return (subCommandExists(command, subCommand) ? commands[command].subCommand[subCommand].price : 0);
    }

    /**
     * @function getCommandFromAlias
     * @info Used to get the default command
     *
     * @export $
     * @param {string} command
     * @returns {string}
     */
    function getCommandFromAlias(alias) {
        return (commands[alias].alias ? commands[alias].alias : null);
    }

    /**
     * @function getCommandGroup
     * @info Used to get the command group id.
     *
     * @export $
     * @param {string} command
     * @returns {int}
     */
    function getCommandGroup(command) {
        return (commands[command].groupId ? commands[command].groupId : 7);
    }

    /**
     * @function getSubCommandGroup
     * @info Used to get the sub command group id.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {int}
     */
    function getSubCommandGroup(command, subCommand) {
        return (subCommandExists(command, subCommand) ? commands[command].subCommand[subCommand].groupId : 7);
    }

    /**
     * @function getCommandScript
     * @info Used to get the command script.
     *
     * @export $
     * @param {string} command
     * @returns {string}
     */
    function getCommandScript(command) {
        return (commands[command] ? commands[command].script : '');
    }

    /**
     * @function getCommandCooldown
     * @info Used to get the command cooldown.
     *
     * @export $
     * @param {string} command
     * @returns {int}
     */
    function getCommandCooldown(command) {
        return (commands[command] ? commands[command].cooldown : 0);
    }

    /**
     * @function cooldownExists
     * @info Used to get the command cooldown.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {boolean}
     */
    function cooldownExists(command, subCommand) {
        if (subCommand === '') {
            return (commands[command] !== undefined && commands[command].cooldown !== -1);
        } else {
            return (subCommandExists(command, subCommand) && commands[command].subCommand[subCommand].cooldown !== -1);
        }
    }

    /**
     * @function getSubCommandCooldown
     * @info Used to get the sub command cooldown.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {int}
     */
    function getSubCommandCooldown(command, subCommand) {
        return (subCommandExists(command, subCommand) ? commands[command].subCommand[subCommand].cooldown : 0);
    }

    /**
     * @function getCommandObject
     * @info Used to get the command object.
     *
     * @export $
     * @param {string} command
     * @returns {object}
     */
    function getCommandObject(command) {
        return (commands[command] ? commands[command] : {});
    }

    /**
     * @function getSubCommandObject
     * @info Used to get the sub command object.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @returns {object}
     */
    function getSubCommandObject(command, subCommand) {
        return (subCommandExists(command, subCommand) ? commands[command].subCommand[subCommand] : {});
    }

    /**
     * @function updateCommandGroup
     * @info Used to update the command permission.
     *
     * @export $
     * @param {string} command
     * @param {int} groupId
     */
    function updateCommandGroup(command, groupId) {
        if (commandExists(command)) {
            commands[command].groupId = (groupId ? groupId : 7);
        }
    }

    /**
     * @function updateSubCommandGroup
     * @info Used to update the sub command permission.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {int} groupId
     */
    function updateSubCommandGroup(command, subCommand, groupId) {
        if (subCommandExists(command, subCommand)) {
            commands[command].subCommand[subCommand].groupId = (groupId ? groupId : 7);
        }
    }

    /**
     * @function updateCommandCooldown
     * @info Used to update the command cooldown.
     *
     * @export $
     * @param {string} command
     * @param {int} cooldown
     */
    function updateCommandCooldown(command, cooldown) {
        if (commandExists(command)) {
            commands[command].cooldown = (cooldown ? cooldown : -1);
        }
    }

    /**
     * @function updateSubCommandCooldown
     * @info Used to update the sub command cooldown.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {int} cooldown
     */
    function updateSubCommandCooldown(command, subCommand, cooldown) {
        if (subCommandExists(command, subCommand)) {
            commands[command].subCommand[subCommand].cooldown = (cooldown ? cooldown : -1);
        }
    }


    /**
     * @function updateCommandCost
     * @info Used to update the command cost.
     *
     * @export $
     * @param {string} command
     * @param {int} cost
     */
    function updateCommandCost(command, cost) {
        if (commandExists(command)) {
            commands[command].price = (cost ? cost : 0);
        }
    }

    /**
     * @function updateSubCommandCost
     * @info Used to update the sub command cost.
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {int} cost
     */
    function updateSubCommandCost(command, subCommand, cost) {
        if (subCommandExists(command, subCommand)) {
            commands[command].subCommand[subCommand].price = (cost ? cost : 0);
        }
    }

    /**
     * @function getCommandGroupName
     * @info Used to get the command group name.
     *
     * @export $
     * @param {string} command
     * @returns {string}
     */
    function getCommandGroupName(command, subCommand) {
        if (subCommand === '') {
            if (commandExists(command)) {
                if (commands[command].groupId === 0) {
                    return 'Caster';
                } else if (commands[command].groupId === 1) {
                    return 'Administrator';
                } else if (commands[command].groupId === 2) {
                    return 'Moderator';
                } else if (commands[command].groupId === 3) {
                    return 'Subscriber';
                } else if (commands[command].groupId === 4) {
                    return 'Donator';
                } else if (commands[command].groupId === 5) {
                    return 'Hoster';
                } else if (commands[command].groupId === 6) {
                    return 'Regular';
                } else {
                    return 'Viewer';
                }
            }
        } else {
            if (subCommandExists(command, subCommand)) {
                if (commands[command].subCommand[subCommand].groupId === 0) {
                    return 'Caster';
                } else if (commands[command].subCommand[subCommand].groupId === 1) {
                    return 'Administrator';
                } else if (commands[command].subCommand[subCommand].groupId === 2) {
                    return 'Moderator';
                } else if (commands[command].subCommand[subCommand].groupId === 3) {
                    return 'Subscriber';
                } else if (commands[command].subCommand[subCommand].groupId === 4) {
                    return 'Donator';
                } else if (commands[command].subCommand[subCommand].groupId === 5) {
                    return 'Hoster';
                } else if (commands[command].subCommand[subCommand].groupId === 6) {
                    return 'Regular';
                } else {
                    return 'Viewer';
                }
            }
        }
        return 'Viewer';
    }

    /* Exports the function to the $ api.*/
    $.registerChatCommand = registerChatCommand;
    $.registerChatSubcommand = registerChatSubcommand;
    $.registerChatAlias = registerChatAlias;
    $.unregisterChatCommand = unregisterChatCommand;
    $.unregisterChatSubcommand = unregisterChatSubcommand;
    $.disableChatCommand = disableChatCommand;
    $.commandExists = commandExists;
    $.aliasExists = aliasExists;
    $.subCommandExists = subCommandExists;
    $.getCommandFromAlias = getCommandFromAlias;
    $.getCommandGroup = getCommandGroup;
    $.getSubCommandGroup = getSubCommandGroup;
    $.getCommandScript = getCommandScript;
    $.getCommandCooldown = getCommandCooldown;
    $.getSubCommandCooldown = getSubCommandCooldown;
    $.getCommandObject = getCommandObject;
    $.getSubCommandObject = getSubCommandObject;
    $.updateCommandGroup = updateCommandGroup;
    $.updateSubCommandGroup = updateSubCommandGroup;
    $.updateCommandCooldown = updateCommandCooldown;
    $.updateSubCommandCooldown = updateSubCommandCooldown;
    $.getCommandGroupName = getCommandGroupName;
    $.cooldownExists = cooldownExists;
    $.getCommandCost = getCommandCost;
    $.getSubCommandCost = getSubCommandCost;
    $.updateCommandCost = updateCommandCost;
    $.updateSubCommandCost = updateSubCommandCost;
    $.subCommandIsDisabled = subCommandIsDisabled;
})();
