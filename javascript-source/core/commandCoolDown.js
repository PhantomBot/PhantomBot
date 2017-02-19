/**
 * commandCoolDown.js
 *
 * Manage cooldowns for commands
 * Cooldowns are kept per user.
 *
 * To use the cooldown in other scipts use the $.coolDown API
 */

(function() {
    /**
     * @function getAllCooldownTimes
     * @return object
     */
    function getAllCooldownTimes(){
        var cooldownTimes = [];
        var tableName = 'cooldown';
        var keyList = $.inidb.GetKeyList(tableName,'');
        var key;
        for (i in keyList) {
            key = keyList[i];
            cooldownTimes[key] = parseInt($.inidb.get(tableName,key));
        }
        return cooldownTimes;
    }
    
    /**
     * 
     * @function getAllCooldownTypes
     * @return object
     */
    function getAllCooldownTypes(){
        var cooldownTypes = [];
        var tableName = 'cooldownType';
        var keyList = $.inidb.GetKeyList(tableName,'');
        var key;
        for (i in keyList) {
            key = keyList[i];
            cooldownTypes[key] = parseInt($.inidb.get(tableName,key));
        }
        return cooldownTypes;
    }
    
    var globalCooldown = $.getSetIniDbBoolean('cooldown', 'globalCooldown', false),
        perUserCooldown = $.getSetIniDbBoolean('cooldown', 'perUserCooldown', false),
        globalCooldownTime = $.getSetIniDbNumber('cooldown', 'globalCooldownTime', 90),
        modCooldown = $.getSetIniDbBoolean('cooldown', 'modCooldown', false),
        cooldown = [],
        cooldowns = [],
        cooldownTypeEnum = ['default','per-user','global','none'],
        i,
        cooldownTypes = getAllCooldownTypes(),
        cooldownTimes = getAllCooldownTimes();
        
    for (i in cooldownTypeEnum) {
        i = parseInt(i);
        if(cooldownTypeEnum.hasOwnProperty(i)){
            cooldownTypeEnum[cooldownTypeEnum[i]] = i;
        }
    }
    
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
     * @param isMod
     * @return boolean
     */
    function permCheck(username, isMod) {
        return (!modCooldown && isMod) || $.isAdmin(username);
    };

     /**
     * @function commandCheck 
     * @param cmd
     * @return boolean
     */
    function commandCheck(cmd) {
        return (cmd.equals('bet') || cmd.equals('ticket') || cmd.equals('tickets') || cmd.equals('bid') || cmd.equals('adventure') || cmd.equals($.inidb.get('raffle', 'command')));
    };

    /**
     * @function getCooldown 
     * @param command
     * @return number
     */
    function getCooldown(command) {
        command = command.toLowerCase();
        if (cooldownTimes.hasOwnProperty(command)) {
            return cooldownTimes[command];
        }
        return 0;
    };
    
    /**
     * @function getCooldownType
     * @param command
     * @return number
     */
    function getCooldownType(command){
        command = command.toLowerCase();
        if (cooldownTypes.hasOwnProperty(command)) {
            return cooldownTypes[command];
        }
        return 0;
    }
    
    /**
     * @function getCooldownInfo
     * @param command
     * @returns number
     */
    function getCooldownInfo(command){
        command = command.toLowerCase();
        var commandHasGlobalCooldown = globalCooldown;
        var commandHasPerUserCooldown = perUserCooldown;
        var commandCooldownType = getCooldownType(command);
        var commandCooldownTypeOverriden = commandCooldownType !== 0;
        var commandHasNoCooldown = commandCooldownType === 3;
        if (commandCooldownTypeOverriden) {
            if(commandHasNoCooldown){
                commandHasGlobalCooldown = commandHasPerUserCooldown = false;
            }else{
                commandHasGlobalCooldown = !(commandHasPerUserCooldown = commandCooldownType === 1);
            }
        }else{
            commandHasGlobalCooldown = cooldownTimes.hasOwnProperty(command);
        }
        return [commandHasGlobalCooldown,commandHasPerUserCooldown,commandCooldownType,commandCooldownTypeOverriden,commandHasNoCooldown];
    }
    
    /**
     * @function setCooldownType
     * @param command
     * @param type
     * @return number
     */
    function setCooldownType(command,type){
        command = command.toLowerCase();
        var currentType = getCooldownType(command);
        if(currentType !== type){
            if(type === 0){
               delete cooldownTypes[command];
               $.inidb.del('cooldownType', command);
            }else{
                cooldownTypes[command] = type;
                $.inidb.set('cooldownType', command, type);
            }
        }
        return type;
    }

    /**
     * @function set 
     * @export $.coolDown
     * @param command
     * @param hasCooldown
     * @param time
     * @param username
     */
    function set(command, hasCooldown, time, username) {
        if (time === null || time === 0) {
            return;
        }

        time = ((time * 1000) + $.systemTime());
        command = command.toLowerCase();
        
        var cooldownInfo = getCooldownInfo(command),
            commandHasGlobalCooldown = cooldownInfo[0],
            commandHasPerUserCooldown = cooldownInfo[1],
            commandHasNoCooldown = cooldownInfo[4];
        
        if (commandHasNoCooldown) {
            $.consoleDebug('Did not push command !' + command + ' to cooldown because its cooldown type is set to none.');
        } else {
            if (!command.equals('adventure')) {
                if (commandHasGlobalCooldown && !hasCooldown) {
                    cooldown[command] = {time: time};
                    $.consoleDebug('Pushed command !' + command + ' to global cooldown.');
                    return;
                } else if (commandHasPerUserCooldown) {
                    cooldowns.push({username: username, time: time, command: command});
                    $.consoleDebug('Pushed command !' + command + ' to user cooldown with username: ' + username + '.');
                    return;
                }
            }

            cooldown[command] = {time: time};
            $.consoleDebug('Pushed command !' + command + ' to cooldown.');
        }
    };

     /**
     * @function get 
     * @export $.coolDown
     * @param command
     * @param username
     * @param isMod
     * @return number
     */
    function get(command, username, isMod) {
        command = command.toLowerCase();
        
        var hasCooldown = cooldownTimes.hasOwnProperty(command);
        
        var cooldownInfo = getCooldownInfo(command),
            commandHasGlobalCooldown = cooldownInfo[0],
            commandHasPerUserCooldown = cooldownInfo[1],
            commandHasNoCooldown = cooldownInfo[4];

        if (commandHasNoCooldown) {
            return 0;
        } else if (commandCheck(command)) {
            if (command.equals('adventure')) {
                if (cooldown[command] !== undefined) {
                    if (cooldown[command].time - $.systemTime() >= 0) {
                        return parseInt(cooldown[command].time - $.systemTime());
                    }
                }
            }
            return 0;
        } else if (commandHasGlobalCooldown && !hasCooldown) {
            if (cooldown[command] !== undefined){
                if (cooldown[command].time - $.systemTime() >= 0) {
                    if (permCheck(username, isMod)) return 0;
                    return parseInt(cooldown[command].time - $.systemTime());
                }
            }
            set(command, hasCooldown, globalCooldownTime); return 0;
        } else if (commandHasPerUserCooldown && hasCooldown) {
            for (i in cooldowns) {
                if (cooldowns[i].command.equals(command) && cooldowns[i].username.equals(username) && cooldowns[i].time - $.systemTime() >= 0) {
                    if (permCheck(username, isMod)) return 0;
                    return parseInt(cooldowns[i].time - $.systemTime());
                }
            }
            set(command, hasCooldown, getCooldown(command), username); return 0;
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
     * @param event
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            cmd = args[0],
            arg2 = args[1],
            time = parseInt(arg2),
            silent = false;

        /**
         * @commandpath coolcom [command] [seconds] - Sets a cooldown in seconds for a command. Use -1 for seconds to remove it. This also applies for the per-user cooldown.
         */
        if (command.equalsIgnoreCase('coolcom') || command.equalsIgnoreCase('cooldown') || (silent = command.equalsIgnoreCase('silentcooldown'))) {
            if (cmd === undefined || isNaN(time)) {
                if (!silent) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.usage'));
                }
                return;
            }

            if (cmd.startsWith('!')) {
                cmd = cmd.substring(1);
            }
            
            if (cmd.equalsIgnoreCase('adventure')) {
                if (time === -1) {
                    $.inidb.set('adventureSettings', 'coolDown', 0);
                    clear(cmd);
                    if (!silent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('cooldown.removed', cmd));
                    }
                } else {
                    $.inidb.set('adventureSettings', 'coolDown', time);
                    if (!silent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set', cmd, time));
                    }
                }
            } else {
                if (time === -1) {
                    $.inidb.del('cooldown', cmd.toLowerCase());
                    clear(cmd);
                    if (!silent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('cooldown.removed', cmd));
                    }
                } else {
                    clear(cmd);
                    $.inidb.set('cooldown', cmd.toLowerCase(), time);
                    if (!silent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set', cmd, time));
                    }
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
         * @commandpath cooltype [command] [default|per-user|global|none] - Set the cooldown type for a command
         */
         if (command.equalsIgnoreCase('cooltype') || (silent = command.equalsIgnoreCase('silentcooltype'))){
            if (cmd === undefined || arg2 === undefined || !isNaN(arg2) || !cooldownTypeEnum.hasOwnProperty(arg2 = arg2.toLowerCase())) {
                if (!silent) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.type.usage'));
                }
                return;
            }
            if ((cmd = cmd.toLowerCase()).startsWith('!')) {
                cmd = cmd.substring(1);
            }
            setCooldownType(cmd,cooldownTypeEnum[arg2]);
            if (!silent) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.type',cmd,arg2));
            }
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
            $.registerChatCommand('./core/commandCoolDown.js', 'cooltype', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'silentcooldown', 1);
            $.registerChatCommand('./core/commandCoolDown.js', 'silentcooltype', 1);
        }
    });
    
    /** EXPORT TO $. API*/
    $.coolDown = {
        set: set,
        get: get,
        clear: clear
    };
})();
