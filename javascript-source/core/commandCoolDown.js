/**
 * commandCoolDown.js
 *
 * Manage cooldowns for commands
 * Cooldowns are kept per user.
 *!command 
 * To use the cooldown in other scipts use the $.coolDown API
 */
(function() {
    var globalCooldown = $.getSetIniDbBoolean('cooldown', 'globalCooldown', true),
        perUserCooldown = $.getSetIniDbBoolean('cooldown', 'perUserCooldown', false),
        globalCooldownTime = $.getSetIniDbNumber('cooldown', 'globalCooldownTime', 90),
        modCooldown = $.getSetIniDbBoolean('cooldown', 'modCooldown', false),
        cooldown = {},
        subCooldown = {},
        hasCooldown,
        i;

    /**
     * @function reloadCooldown 
     */
    function reloadCooldown() {
        globalCooldown = $.getIniDbBoolean('cooldown', 'globalCooldown');
        perUserCooldown = $.getIniDbBoolean('cooldown', 'perUserCooldown');
        modCooldown = $.getIniDbBoolean('cooldown', 'modCooldown');
        globalCooldownTime = $.getIniDbNumber('cooldown', 'globalCooldownTime');
    }

    /**
     * @function permCheck 
     *
     * @param {string} username
     * @param {boolean} isMod
     * @return boolean
     */
    function permission(username, isMod) {
        return (!modCooldown && isMod) || $.isAdmin(username);
    }

    /**
     * @function getTime
     * @info Used to get the cooldown time on a command.
     *
     * @export $.coolDown
     * @param {string} username
     * @param {string} command
     * @param {string} subCommand
     */
    function getTime(username, command, subCommand) {
        if (perUserCooldown) {
            if (subCommand === '') {
                return Math.floor((cooldown[username].command[command].time - $.systemTime()) / 1000);
            } else {
                return Math.floor((subCooldown[username].command[command].subCommand[subCommand].time - $.systemTime()) / 1000);
            }
        } else {
            if (subCommand === '') {
                return Math.floor((cooldown[command].time - $.systemTime()) / 1000);
            } else {
                return Math.floor((subCooldown[command].subCommand[subCommand].time - $.systemTime()) / 1000);
            }
        }
    }

    /**
     * @function set 
     * @export $.coolDown
     *
     * @param {string} command
     * @param {int} time
     * @param {username} username
     * @param {boolean} hasCooldown
     */
    function set(username, command, subCommand, hasCooldown, time) {
        /* Checks to see if the cooldown is a valid number */
        if (time === 0) {
            return 0;
        }

        time = ((time * 1000) + $.systemTime());

        /* Checks if the command is adventure since it has a sepcial cooldown */
        if (command == 'adventure') {
            cooldown[command] = {
                time: time
            };
            return 0;
        }

        /* commands with no sub commands */
        if (subCommand === '') {
            if (globalCooldown && !hasCooldown) {
                cooldown[command] = { time: time };
                return 0;
            } else if (perUserCooldown && hasCooldown) {
                if (cooldown[username] === undefined) {
                    cooldown[username] = { command: {} };
                }

                cooldown[username].command[command] = { time: time };
                return 0;
            } else {
                cooldown[command] = { time: time };
                return 0;
            }
        }

        /* Commands with sub commands */
        if (globalCooldown && !hasCooldown) {
            if (subCooldown[command] === undefined) {
                subCooldown[command] = { subCommand: {} };
            }
            subCooldown[command].subCommand[subCommand] = {
                time: time
            };
            return 0;
        } else if (perUserCooldown && hasCooldown) {
            if (subCooldown[username] === undefined) {
                subCooldown[username] = { command: {} };
            } else if (subCooldown[username].command[command] === undefined) {
                subCooldown[username].command[command] = { subCommand: {} };
            }
            subCooldown[username].command[command].subCommand[subCommand] = { time: time };
            return 0;
        } else {
            if (subCooldown[command] === undefined) {
                subCooldown[command] = { subCommand: {} };
            }
            subCooldown[command].subCommand[subCommand] = { time: time };
            return 0;
        }
    }

     /**
      * @function get
      * @info Used to get the command cooldown then set it if needed.
      *
      * @export $
      * @param {string} username
      * @param {string} command
      * @param {string} subCommand
      * @param {boolean} isMod
      * @returns {int}
      */
    function get(username, command, subCommand, isMod) {
        /* Checks if the command is adventure, since that command can have a special cooldown */
        if (command == 'adventure' && cooldown[command] !== undefined && cooldown[command].time - $.systemTime() >= 0) {
            return 1;
        }

        hasCooldown = $.cooldownExists(command, subCommand);

        /* Cooldown with no sub commands */
        if (subCommand === '') {
            if (globalCooldown && !hasCooldown) {
                if (cooldown[command] !== undefined && cooldown[command].time - $.systemTime() >= 0) {
                    if (permission(username, isMod)) return 0;
                    return 1;
                } else {
                    return set(username, command, subCommand, hasCooldown, globalCooldownTime);
                }
            } else if (perUserCooldown && hasCooldown) { 
                if (cooldown[username] !== undefined && cooldown[username].command[command] !== undefined && cooldown[username].command[command].time - $.systemTime() >= 0) {
                    if (permission(username, isMod)) return 0;
                    return 1;
                } else {
                    return set(username, command, subCommand, hasCooldown, $.getCommandCooldown(command, subCommand));
                }
            } else {
                if (cooldown[command] !== undefined && cooldown[command].time - $.systemTime() >= 0) {
                    if (permission(username, isMod)) return 0;
                    return 1;
                } else {
                    return set(username, command, subCommand, hasCooldown, $.getCommandCooldown(command, subCommand));
                }
            }
            return 0;
        }

        /* Cooldown with sub commands */
        if (globalCooldown && !hasCooldown) {
            if (subCooldown[command] !== undefined && subCooldown[command].subCommand[subCommand] !== undefined && subCooldown[command].subCommand[subCommand].time - $.systemTime() >= 0) {
                if (permission(username, isMod)) return 0;
                return 1;
            } else {
                return set(username, command, subCommand, hasCooldown, globalCooldownTime);
            }
        } else if (perUserCooldown && hasCooldown) {
            if (subCooldown[username] !== undefined && subCooldown[username].command[command] !== undefined && subCooldown[username].command[command].subCommand[subCommand] !== undefined && subCooldown[username].command[command].subCommand[subCommand].time - $.systemTime() >= 0) {
                if (permission(username, isMod)) return 0;
                return 1;
            } else {
                return set(username, command, subCommand, hasCooldown, $.getSubCommandCooldown(command, subCommand));
            }
        } else {
            if (subCooldown[command] !== undefined && subCooldown[command].subCommand[subCommand] !== undefined && subCooldown[command].subCommand[subCommand].time - $.systemTime() >= 0) {
                if (permission(username, isMod)) return 0;
                return 1;
            } else {
                return set(username, command, subCommand, hasCooldown, $.getSubCommandCooldown(command, subCommand));
            }
        }
        return 0;
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('cooldown')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.usage'));
                return;
            }

            if (action.equalsIgnoreCase('toggle')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.toggle.usage'));
                    return;
                }

                /* commandpath cooldown toggle global - Toggles the global cooldown. */
                if (subAction.equalsIgnoreCase('global')) {
                    globalCooldown = !globalCooldown;
                    $.inidb.set('cooldown', 'globalCooldown', globalCooldown);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.toggle.global', (globalCooldown === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                    return;
                }

                /* commandpath cooldown toggle peruser - Toggles the per-user cooldown. */
                if (subAction.equalsIgnoreCase('peruser')) {
                    perUserCooldown = !perUserCooldown;
                    $.inidb.set('cooldown', 'perUserCooldown', perUserCooldown);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.toggle.per.user', (perUserCooldown === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                    return;
                }

                /* commandpath cooldown toggle modcooldown - Toggles if moderators ignore the cooldown or not. */
                if (subAction.equalsIgnoreCase('modcooldown')) {
                    modCooldown = !modCooldown;
                    $.inidb.set('cooldown', 'modCooldown', modCooldown);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.toggle.mod.cooldown', (modCooldown === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.toggle.usage'));
                return;
            }

            if (action.equalsIgnoreCase('set')) {
                if (subAction === undefined || args[2] === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.usage'));
                    return;
                }

                /* commandpath cooldown set globaltime - Sets the global cooldown time in seconds. */
                if (subAction.equalsIgnoreCase('globaltime')) {
                    globalCooldownTime = parseInt(args[2]);
                    $.inidb.set('cooldown', 'globalCooldownTime', globalCooldownTime);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.global', globalCooldownTime));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.usage'));
                return;
            }
        }
    });

    /**
     * @event initready
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/commandCoolDown.js')) {
            $.registerChatCommand('./core/commandCoolDown.js', 'cooldown', 1);
            $.registerChatSubcommand('cooldown', 'toggle', 1);
            $.registerChatSubcommand('cooldown', 'set', 1);
        }
    });
    
    /** EXPORT TO $. API*/
    $.coolDown = {
        set: set,
        get: get,
        getTime: getTime
    };

    $.reloadCooldown = reloadCooldown;
})();
