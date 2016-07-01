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
        cooldown = [];

    function reloadCooldown () {
        globalCooldown = $.getIniDbBoolean('cooldown', 'globalCooldown');
        perUserCooldown = $.getIniDbBoolean('cooldown', 'perUserCooldown');
        modCooldown = $.getIniDbBoolean('cooldown', 'modCooldown');
        globalCooldownTime = $.getIniDbNumber('cooldown', 'globalCooldownTime');
    };

    function set(command, time, user) {
        if (time == null || time == 0 || time == 1 || isNaN(time)) {
            return;
        }

        time = (time * 1000) + $.systemTime();

        if (!command.equalsIgnoreCase('adventure')) {
            if (globalCooldown && !$.inidb.exists('cooldown', command)) {
                cooldown.push({
                    command: command,
                    time: time,
                });
                $.consoleDebug('Pushed command !' + command + ' to global cooldown.');
                return;
            }
    
            if (perUserCooldown && $.inidb.exists('cooldown', command)) {
                cooldown.push({
                    command: command,
                    time: time,
                    user: user,
                });
                $.consoleDebug('Pushed command !' + command + ' to user cooldown.');
                return;
            }
        }

        if ($.inidb.exists('cooldown', command) || command.equalsIgnoreCase('adventure')) {
            cooldown.push({
                command: command,
                time: time,
            });
            $.consoleDebug('Pushed command !' + command + ' to cooldown.');
        }
    };

    function get(command, user) {
        var coolDownExists = $.inidb.exists('cooldown', command),
            cool,
            i;

        if (command.equalsIgnoreCase('bet') || command.equalsIgnoreCase('ticket') || command.equalsIgnoreCase('tickets') 
            || command.equalsIgnoreCase('bid') || command.equalsIgnoreCase($.inidb.get('raffle', 'command'))) {
            return;
        }

        if (globalCooldown && !coolDownExists) {
            for (i in cooldown) {
                if (cooldown[i].command.equalsIgnoreCase(command)) {
                    cool = cooldown[i].time - $.systemTime();
                    if (cool > 0) {
                        if ((!modCooldown && $.isMod(user)) || $.isAdmin(user)) {
                            return 0;
                        }
                        return parseInt(cool);
                    } else {
                        cooldown.splice(i, 1);
                    }
                }
            }
            if (!command.equalsIgnoreCase('adventure')) {
                set(command, globalCooldownTime);
            }
            return;
        }

        if (perUserCooldown && coolDownExists) {
            for (i in cooldown) {
                if (cooldown[i].command.equalsIgnoreCase(command) && cooldown[i].user.equalsIgnoreCase(user)) {
                    cool = cooldown[i].time - $.systemTime();
                     if (cool > 0) {
                        if ((!modCooldown && $.isMod(user)) || $.isAdmin(user)) {
                            return 0;
                        } 
                        return parseInt(cool);
                    } else {
                        cooldown.splice(i, 1);
                    }
                }
            }
            if (!command.equalsIgnoreCase('adventure')) {
                set(command, parseInt($.inidb.get('cooldown', command)), user);
            }
            return;
        }

        for (i in cooldown) {
            if (cooldown[i].command.equalsIgnoreCase(command)) {
                cool = cooldown[i].time - $.systemTime();
                if (cool > 0) {
                    if ((!modCooldown && $.isMod(user)) || $.isAdmin(user)) {
                        return 0;
                    }
                    return parseInt(cool);
                } else {
                    cooldown.splice(i, 1);
                }
            }
        }
        if (coolDownExists) {
            set(command, parseInt($.inidb.get('cooldown', command)));
        }
    };

    function clear(command) {
        var i;
        for (i in cooldown) {
            if (cooldown[i].command.equalsIgnoreCase(command)) {
                cooldown.splice(i, 1);
                return;
            }
        }
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            cmd = args[0],
            time = parseInt(args[1]);

        /**
         * @commandpath coolcom [command or keyword] [seconds] - Sets a cooldown in seconds for a command or a keyword. Use -1 for seconds to remove it. This also applies for the per-user cooldown.
         */
        if (command.equalsIgnoreCase('coolcom') || command.equalsIgnoreCase('cooldown')) {
            if (!cmd || !time) {
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
                    $.inidb.del('cooldown', cmd);
                    clear(cmd);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.removed', cmd));
                } else {
                    $.inidb.set('cooldown', cmd, time);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set', cmd, time));
                }
            }
        }

        /**
         * @commandpath toggleglobalcooldown - Enables/Disables the global command cooldown.
         */
        if (command.equalsIgnoreCase('toggleglobalcooldown')) {
            globalCooldown = !globalCooldown;
            $.setIniDbBoolean('cooldown', 'globalCooldown', globalCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.global.toggle', (globalCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /**
         * @commandpath toggleperusercooldown - Enables/Disables the per-user command cooldown.
         */
        if (command.equalsIgnoreCase('toggleperusercooldown')) {
            perUserCooldown = !perUserCooldown;
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

            $.inidb.set('cooldown', 'globalCooldownTime', parseInt(cmd));
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.global.set', cmd));
        }

        /**
         * @commandpath togglemodcooldown - Enable/Disable mods being affected by cooldowns
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
    };
})();
