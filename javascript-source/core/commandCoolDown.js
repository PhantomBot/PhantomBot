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

    function set(command, time, user) {
        if (time == null || time == 0 || isNaN(time)) {
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
        var cool,
            i;

        if (globalCooldown && !$.inidb.exists('cooldown', command)) {
            for (i in cooldown) {
                if (cooldown[i].command.equalsIgnoreCase(command)) {
                    cool = cooldown[i].time - $.systemTime();
                    if (cool > 0) {
                        if (!modCooldown && $.isMod(user)) {
                            return 0;
                        }
                        return parseInt(cool);
                    } else {
                        cooldown.splice(i, 1);
                    }
                }
            }
            set(command, globalCooldownTime);
            return;
        }

        if (perUserCooldown && $.inidb.exists('cooldown', command)) {
            for (i in cooldown) {
                if (cooldown[i].command.equalsIgnoreCase(command) && cooldown[i].user.equalsIgnoreCase(user)) {
                    cool = cooldown[i].time - $.systemTime();
                     if (cool > 0) {
                        if (!modCooldown && $.isMod(user)) {
                            return 0;
                        } 
                        return parseInt(cool);
                    } else {
                        cooldown.splice(i, 1);
                    }
                }
            }
            set(command, parseInt($.inidb.get('cooldown', command)), user);
            return;
        }

        for (i in cooldown) {
            if (cooldown[i].command.equalsIgnoreCase(command)) {
                cool = cooldown[i].time - $.systemTime();
                if (cool > 0) {
                    if (!modCooldown && $.isMod(user)) {
                        return 0;
                    }
                    return parseInt(cool);
                } else {
                    cooldown.splice(i, 1);
                }
            }
        }
        set(command, parseInt($.inidb.get('cooldown', command)));
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
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!cmd || !time) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.usage'));
                return;
            }

            if (time == -1) {
                $.inidb.del('cooldown', cmd);
                clear(cmd);
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.removed', cmd));
                return;
            } else {
                $.inidb.set('cooldown', cmd, time);
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set', cmd, time));
                return;
            }
        }

        /**
         * @commandpath toggleglobalcooldown - Enables/Disables the global command cooldown.
         */
        if (command.equalsIgnoreCase('toggleglobalcooldown')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            globalCooldown = !globalCooldown;
            $.setIniDbBoolean('cooldown', 'globalCooldown', globalCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.global.toggle', (globalCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /**
         * @commandpath toggleperusercooldown - Enables/Disables the per-user command cooldown.
         */
        if (command.equalsIgnoreCase('toggleperusercooldown')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            perUserCooldown = !perUserCooldown;
            $.setIniDbBoolean('cooldown', 'perUserCooldown', perUserCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.per.user.toggle', (perUserCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        }

        /**
         * @commandpath globalcooldowntime [seconds] - Sets the global cooldown time in seconds.
         */
        if (command.equalsIgnoreCase('globalcooldowntime')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

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
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            modCooldown = !modCooldown;
            $.setIniDbBoolean('cooldown', 'modCooldown', modCooldown);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.togglemodcooldown', (modCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
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
        }
    });
    /** EXPORT TO $. API*/
    $.coolDown = {
        set: set,
        get: get,
    };
})();
