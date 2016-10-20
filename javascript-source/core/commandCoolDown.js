/**
 * commandCoolDown.js
 *
 * Manage cooldowns for commands
 * Cooldowns are kept per user.
 *
 * To use the cooldown in other scipts use the $.coolDown API
 */

(function() {
    var globalCooldown = $.getSetIniDbBoolean('cooldown', 'globalCooldown', false),
        perUserCooldown = $.getSetIniDbBoolean('cooldown', 'perUserCooldown', false),
        globalCooldownTime = $.getSetIniDbNumber('cooldown', 'globalCooldownTime', 90),
        modCooldown = $.getSetIniDbBoolean('cooldown', 'modCooldown', false),
        cooldown = {},
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
                return Math.floor((cooldown[username].command[command].subCommand[subCommand].time - $.systemTime()) / 1000);
            }
        } else {
            if (subCommand === '') {
                return Math.floor((cooldown[command].time - $.systemTime()) / 1000);
            } else {
                return Math.floor((cooldown[command].subCommand[subCommand].time) - $.systemTime() / 1000);
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
        if (time === -1 || time === 0) {
            return 0;
        }

        time = ((time * 1000) + $.systemTime());

        /* Checks if the command is adventure since it has a sepcial cooldown */
        if (command == 'adventure') {
            cooldown[command] = {
                time: time
            };
            return;
        }

        if (subCommand === '') {
            if (globalCooldown && !hasCooldown) {
                cooldown[command] = {
                    time: time,
                    subCommand: {}
                };
                return 0;
            } else if (perUserCooldown && hasCooldown) {
                if (cooldown[username] === undefined) {
                    cooldown[username] = {
                        command: {}
                    };
                }
                cooldown[username].command[command] = {
                    time: time,
                    subCommand: {}
                };
                return 0;
            } else {
                cooldown[command] = {
                    time: time,
                    subCommand: {}
                };
                return 0;
            }
        } else {
            if (globalCooldown && !hasCooldown) {
                if (cooldown[command] === undefined) {
                    cooldown[command] = {
                        subCommand: {}
                    };
                }
                cooldown[command].subCommand[subCommand] = {
                    time: time
                };
                return 0;
            } else if (perUserCooldown && hasCooldown) {
                if (cooldown[username] === undefined) {
                    cooldown[username] = {
                        command: {}
                    };
                }
                if (cooldown[username].command[command] === undefined) {
                    cooldown[username].command[command] = {
                        subCommand: {}
                    };
                }
                cooldown[username].command[command].subCommand[subCommand] = {
                    time: time
                };
                return 0;
            } else {
                if (cooldown[command] === undefined) {
                    cooldown[command] = {
                        subCommand: {},
                    };
                }
                cooldown[command].subCommand[subCommand] = {
                    time: time
                };
                return 0;
            }
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
        /* Checks if the command is adventure, since that command can have a cooldown */
        if (command == 'adventure' && cooldown[command] !== undefined && cooldown[command].time - $.systemTime() >= 0) {
            return (cooldown[command].time - $.systemTime());
        }

        hasCooldown = $.cooldownExists(command, subCommand);

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
        } else {
            if (globalCooldown && !hasCooldown) {
                if (cooldown[command] !== undefined && cooldown[command].subCommand[subCommand].time - $.systemTime() >= 0) {
                    if (permission(username, isMod)) return 0;
                    return 1;
                } else {
                    return set(username, command, subCommand, hasCooldown, globalCooldownTime);
                }
            } else if (perUserCooldown && hasCooldown) {
                if (cooldown[username] !== undefined && cooldown[username].command[command] !== undefined && cooldown[username].command[command].subCommand[subCommand].time - $.systemTime() >= 0) {
                    if (permission(username, isMod)) return 0;
                    return 1;
                } else {
                    return set(username, command, subCommand, hasCooldown, $.getSubCommandCooldown(command, subCommand));
                }
            } else {
                if (cooldown[command] !== undefined && cooldown[command].subCommand[subCommand].time - $.systemTime() >= 0) {
                    if (permission(username, isMod)) return 0;
                    return 1;
                } else {
                    return set(username, command, subCommand, hasCooldown, $.getSubCommandCooldown(command, subCommand));
                }
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
            args = event.getArgs();
    });

    /**
     * @event initready
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/commandCoolDown.js')) {
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
