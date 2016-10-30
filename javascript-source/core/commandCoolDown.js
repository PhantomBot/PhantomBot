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
        cooldown = [],
        cooldowns = [],
        i;

    /**
     * @function reloadCooldown 
     */
    function reloadCooldown () {
        globalCooldown = $.getIniDbBoolean('cooldown', 'globalCooldown');
        perUserCooldown = $.getIniDbBoolean('cooldown', 'perUserCooldown');
        modCooldown = $.getIniDbBoolean('cooldown', 'modCooldown');
        globalCooldownTime = $.getIniDbNumber('cooldown', 'globalCooldownTime');
    };

    /**
     * @function permCheck 
     * @param username
     * @return boolean
     */
    function permCheck(username, isMod) {
        return (!modCooldown && isMod) || $.isAdmin(username);
    };

     /**
     * @function commandCheck 
     * @param command
     * @return boolean
     */
    function commandCheck(cmd) {
        return (cmd.equals('bet') || cmd.equals('ticket') || cmd.equals('tickets') || cmd.equals('bid') || cmd.equals($.inidb.get('raffle', 'command')) || cmd.equals('adventure'));
    };

    /**
     * @function getCooldown 
     * @param command
     * @return number
     */
    function getCooldown(command) {
        if ($.inidb.exists('cooldown', command.toLowerCase())) {
            return parseInt($.inidb.get('cooldown', command.toLowerCase()));
        }
        return 0;
    };

    /**
     * @function set 
     * @export $.coolDown
     * @param command
     * @param time
     * @param username
     */
    function set(command, hasCooldown, time, username) {
        if (time === null || time === 0) {
            return;
        }

        time = ((time * 1000) + $.systemTime());
        command = command.toLowerCase();

        if (!command.equals('adventure')) {
            if (globalCooldown && !hasCooldown) {
                cooldown[command] = {time: time};
                $.consoleDebug('Pushed command !' + command + ' to global cooldown.');
                return;
            } else {
                if (perUserCooldown) {
                    cooldowns.push({username: username, time: time, command: command});
                    $.consoleDebug('Pushed command !' + command + ' to user cooldown with username: ' + username + '.');
                    return;
                }
            }
        }

        cooldown[command] = {time: time};
        $.consoleDebug('Pushed command !' + command + ' to cooldown.');
    };

     /**
     * @function get 
     * @export $.coolDown
     * @param command
     * @param username
     * @return number
     */
    function get(command, username, isMod) {
        var hasCooldown = $.inidb.exists('cooldown', command.toLowerCase());

        if (commandCheck(command.toLowerCase())) {
            if (command.equals('adventure')) {
                if (cooldown[command] !== undefined) {
                    if (cooldown[command].time - $.systemTime() >= 0) {
                        return parseInt(cooldown[command].time - $.systemTime());
                    }
                }
            }
            return 0;
        }

        if (globalCooldown && !hasCooldown) {
            if (cooldown[command] !== undefined) {
                if (cooldown[command].time - $.systemTime() >= 0) {
                    if (permCheck(username, isMod)) return 0;
                    return parseInt(cooldown[command].time - $.systemTime());
                }
            }
            set(command, hasCooldown, globalCooldownTime); return 0;
        } else {
            if (perUserCooldown && hasCooldown) {
                for (i in cooldowns) {
                    if (cooldowns[i].command.equals(command) && cooldowns[i].username.equals(username) && cooldowns[i].time - $.systemTime() >= 0) {
                        if (permCheck(username, isMod)) return 0;
                        return parseInt(cooldowns[i].time - $.systemTime());
                    }
                }
                set(command, hasCooldown, getCooldown(command), username); return 0;
            }
        }

        if (cooldown[command] !== undefined) {
            if (cooldown[command].time - $.systemTime() >= 0) {
                if (permCheck(username, isMod)) return 0;
                return parseInt(cooldown[command].time - $.systemTime());
            }
        }
        set(command, hasCooldown, getCooldown(command)); return 0;
    };

    /**
     * @function clear 
     * @export $.coolDown
     * @param command
     */
    function clear(command) {
        delete cooldown[command];
    };

    /**
     * @function clearAll
     */
    function clearAll() {
        cooldown = [];
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            cmd = args[0],
            time = parseInt(args[1]);

        /**
         * @commandpath coolcom [command] [seconds] - Sets a cooldown in seconds for a command. Use -1 for seconds to remove it. This also applies for the per-user cooldown.
         */
        if (command.equalsIgnoreCase('coolcom') || command.equalsIgnoreCase('cooldown')) {
            if (cmd === undefined || isNaN(time)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.usage'));
                return;
            }

            if (cmd.startsWith('!')) {
                cmd = cmd.substring(1);
            }
            
            if (cmd.equalsIgnoreCase('adventure')) {
                if (time == -1) {
                    $.inidb.set('adventureSettings', 'coolDown', 0);
                    clear(cmd);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.removed', cmd));
                } else {
                    $.inidb.set('adventureSettings', 'coolDown', time);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set', cmd, time));
                }
            } else {
                if (time == -1) {
                    $.inidb.del('cooldown', cmd.toLowerCase());
                    clear(cmd);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.removed', cmd));
                } else {
                    clear(cmd);
                    $.inidb.set('cooldown', cmd.toLowerCase(), time);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set', cmd, time));
                }
            }
        }

        /**
         * @commandpath toggleglobalcooldown - Enables or Disables the global command cooldown.
         */
        if (command.equalsIgnoreCase('toggleglobalcooldown')) {
            globalCooldown = !globalCooldown;
            clearAll();
            $.setIniDbBoolean('cooldown', 'globalCooldown', globalCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.global.toggle', (globalCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /**
         * @commandpath toggleperusercooldown - Enables or Disables the per-user command cooldown.
         */
        if (command.equalsIgnoreCase('toggleperusercooldown')) {
            perUserCooldown = !perUserCooldown;
            clearAll();
            $.setIniDbBoolean('cooldown', 'perUserCooldown', perUserCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.per.user.toggle', (perUserCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /**
         * @commandpath globalcooldowntime [seconds] - Sets the global cooldown time in seconds.
         */
        if (command.equalsIgnoreCase('globalcooldowntime')) {
            if (!cmd) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.global.usage'));
                return;
            }
            clearAll();
            $.inidb.set('cooldown', 'globalCooldownTime', parseInt(cmd));
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.global.set', cmd));
        }

        /**
         * @commandpath togglemodcooldown - Enable or Disable mods being affected by cooldowns
         */
        if (command.equalsIgnoreCase('togglemodcooldown')) {
            modCooldown = !modCooldown;
            $.setIniDbBoolean('cooldown', 'modCooldown', modCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.togglemodcooldown', (modCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /**
        * Used for the panel
        */
        if (command.equalsIgnoreCase('reloadcooldown')) {
            reloadCooldown();
        }
    });

    /**
     * @event initready
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/commandCoolDown.js')) {
            $.registerChatCommand('./core/commandCoolDown.js', 'coolcom', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'cooldown', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'globalcooldowntime', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'toggleglobalcooldown', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'toggleperusercooldown', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'togglemodcooldown', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'reloadcooldown', 1);
        }
    });
    
    /** EXPORT TO $. API*/
    $.coolDown = {
        set: set,
        get: get,
        clear: clear,
    };
})();
