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

/*
 * commandCoolDown.js
 *
 * Manage cooldowns for commands
 *
 * To use the cooldown in other scipts use the $.coolDown API
 */

/* global Packages */

(function() {
    var defaultCooldownTime = $.getSetIniDbNumber('cooldownSettings', 'defaultCooldownTime', 5),
            modCooldown = $.getSetIniDbBoolean('cooldownSettings', 'modCooldown', false),
            defaultCooldowns = {},
            cooldowns = {},
            _cooldownsLock = new Packages.java.util.concurrent.locks.ReentrantLock(),
            _defaultCooldownsLock = new Packages.java.util.concurrent.locks.ReentrantLock();

    $.raffleCommand = null;

    const   Type = {
                User: 'user',
                Global: 'global'
            },
            Operation = {
                UnSet: -1,
                UnChanged: -2
            };

    /*
     * @class Cooldown
     *
     * @param {String}  command
     * @param {Number}  globalSec
     * @param {Number}  userSec
     * @param {Boolean}  modsSkip
     */
    function Cooldown(command, globalSec, userSec, modsSkip) {
        this.command = command;
        this.globalSec = globalSec;
        this.userSec = userSec;
        this.userTimes = [];
        this.globalTime = 0;
        this.modsSkip = modsSkip;
    }

    /*
     * @function toJSONString
     *
     * @param {String}  command
     * @return {JSON String}
     */
    function toJSONString(command) {
        return JSON.stringify({
            command: String(command.command),
            globalSec: command.globalSec,
            userSec: command.userSec,
            modsSkip: command.modsSkip
        });
    }

    /*
     * @function loadCooldowns
     */
    function loadCooldowns() {
        var commands = $.inidb.GetKeyList('cooldown', ''),
            json,
            i;

        _cooldownsLock.lock();
        try {
            for (i in commands) {
                json = JSON.parse($.inidb.get('cooldown', commands[i]));
                cooldowns[$.jsString(commands[i]).toLowerCase()] = new Cooldown(json.command.toLowerCase(), json.globalSec, json.userSec, json.modsSkip);
            }
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /*
     * @function canIgnore
     *
     * @param  {String} username
     * @param  {Boolean} isMod
     * @return {Boolean}
     */
    function canIgnore(username, isMod) {
        return (!modCooldown && isMod) || $.checkUserPermission(username, undefined, $.PERMISSION.Admin);
    }

    /*
     * @function isSpecial
     *
     * @param  {String} command
     * @return {Boolean}
     */
    function isSpecial(command) {
        return command === 'bet' ||
               command === 'tickets' ||
               command === 'bid' ||
               command === 'adventure' ||
               command === 'vote' ||
               command === 'joinqueue' ||
               ($.raffleCommand !== undefined && $.raffleCommand !== null && command === $.jsString($.raffleCommand).toLowerCase());
    }

    /*
     * @function get
     *
     * @export $.coolDown
     * @param  {String}  command
     * @param  {String}  username
     * @param  {Boolean} isMod
     * @return {[Number, bool]}
     */
    function get(command, username, isMod) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        username = (username !== undefined && username !== null ? $.jsString(username).toLowerCase() : null);
        var isGlobal = false,
            maxCoolDown = 0;


        if (canIgnore(username, isMod)) {
            return [maxCoolDown, isGlobal];
        }

        if (isSpecial(command)) {
            _defaultCooldownsLock.lock();
            try {
                if (command === 'adventure' && defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
                    maxCoolDown = getTimeDif(defaultCooldowns[command]);
                    isGlobal = true;
                }
            } finally {
                _defaultCooldownsLock.unlock();
            }

            return [maxCoolDown, isGlobal];
        }

        _cooldownsLock.lock();
        try {
            var cooldown = cooldowns[command],
                useDefault = false;
        } finally {
            _cooldownsLock.unlock();
        }

        if (cooldown !== undefined) {
            var hasCooldown = false;

            if (cooldown.modsSkip && isMod) {
                return [maxCoolDown, isGlobal];
            }

            if (cooldown.globalSec !== Operation.UnSet) {
                hasCooldown = true;
                isGlobal = true;
                if (cooldown.globalTime > $.systemTime()) {
                    maxCoolDown = getTimeDif(cooldown.globalTime);
                } else if (cooldown.userTimes[username] === undefined || (cooldown.userTimes[username] !== undefined && cooldown.userTimes[username] < $.systemTime())){ //Only set a cooldown timer if the user can actually use the command
                    set(command, useDefault, cooldown.globalSec, undefined);
                }
            }

            if (cooldown.userSec !== Operation.UnSet) {
                hasCooldown = true;
                if (cooldown.userTimes[username] !== undefined && cooldown.userTimes[username] > $.systemTime()) {
                    var userCoolDown = getTimeDif(cooldown.userTimes[username]);
                    if (userCoolDown > maxCoolDown) {
                        isGlobal = false;
                        maxCoolDown = userCoolDown;
                    }
                } else if (maxCoolDown === 0){ //Global cooldown got set ... also set user cooldown or only per-user cooldown is activated
                    set(command, useDefault, cooldown.userSec, username);
                }
            }

            if (hasCooldown) {
                return [maxCoolDown, isGlobal];
            }
        }

        _defaultCooldownsLock.lock();
        var cmdCD;
        try {
            cmdCD = defaultCooldowns[command];
        } finally {
            _defaultCooldownsLock.unlock();
        }

        if (cmdCD !== undefined && cmdCD > $.systemTime()) {
            maxCoolDown = getTimeDif(cmdCD);
            isGlobal = true;
        } else {
            useDefault = true;
            set(command, useDefault, defaultCooldownTime, undefined);
        }

        return [maxCoolDown, isGlobal];
    }

    function getTimeDif(cooldownSec) {
        return (cooldownSec - $.systemTime() > 1000 ? Math.ceil(((cooldownSec - $.systemTime()) / 1000)) : 1);
    }

    function exists(command) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        _defaultCooldownsLock.lock();
        _cooldownsLock.lock();
        try {
            return defaultCooldowns[command] !== undefined || cooldowns[command] !== undefined;
        } finally {
            _defaultCooldownsLock.unlock();
            _cooldownsLock.unlock();
        }
    }

    /*
     * @function set
     *
     * @export $.coolDown
     * @param  {String}  command
     * @param  {Boolean} useDefault
     * @param  {Number}  duration
     * @param  {String}  username
     */
    function set(command, useDefault, duration, username) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        username = (username !== undefined && username !== null ? $.jsString(username).toLowerCase() : null);
        var finishTime = (duration > 0 ? ((parseInt(duration) * 1e3) + $.systemTime()) : 0);

        if (useDefault) {
            _defaultCooldownsLock.lock();
            try {
                defaultCooldowns[command] = finishTime;
                return;
            } finally {
                _defaultCooldownsLock.unlock();
            }
        }

        if (!exists(command)) {
            add(command, Operation.UnChanged, Operation.UnChanged, null);
        }

        _cooldownsLock.lock();
        try {
            if (username === null) {
                cooldowns[command].globalTime = finishTime;
            } else {
                cooldowns[command].userTimes[username] = finishTime;
            }
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /*
     * @function add
     *
     * @export $.coolDown
     * @param {String}  command
     * @param {Number}  globalSec
     * @param {Number}  userSec
     * @param {Boolean} modsSkip
     */
    function add(command, globalSec, userSec, modsSkip) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        _cooldownsLock.lock();
        try {
            if (cooldowns[command] === undefined) {
                cooldowns[command] = new Cooldown(command,
                                                (globalSec === Operation.UnChanged ? Operation.UnSet : globalSec),
                                                (userSec === Operation.UnChanged ? Operation.UnSet : userSec),
                                                modsSkip === undefined || modsSkip === null ? false : modsSkip);
            } else {
                if (globalSec !== Operation.UnChanged) {
                    cooldowns[command].globalSec = globalSec;
                }
                if (userSec !== Operation.UnChanged) {
                    cooldowns[command].userSec = userSec;
                }
                if (modsSkip !== undefined && modsSkip !== null) {
                    cooldowns[command].modsSkip = modsSkip;
                }
            }

            $.inidb.set('cooldown', command, toJSONString(cooldowns[command]));
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /*
     * @function remove
     *
     * @export $.coolDown
     * @param {String}  command
     */
    function remove(command) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        $.inidb.del('cooldown', command);
        _cooldownsLock.lock();
        try {
            if (cooldowns[command] !== undefined) {
                delete cooldowns[command];
            }
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /*
     * @function clear
     *
     * @export $.coolDown
     * @param {String}  command
     */
    function clear(command) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        _cooldownsLock.lock();
        try {
            if (cooldowns[command] !== undefined) {
                cooldowns[command].globalTime = 0;
                cooldowns[command].userTimes = [];
            }
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /*
     * @function handleCoolCom
     *
     * @param {String}  sender
     * @param {String}  command
     * @param {String}  first
     * @param {String}  second
     * @param {Boolean} modsSkipIn
     */
    function handleCoolCom(sender, command, first, second, modsSkipIn) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        sender = (sender !== undefined && sender !== null ? $.jsString(sender).toLowerCase() : null);
        var action1 = first === undefined || first === null ? null : first.split("="),
            type1   = action1 === null ? null : action1[0],
            secsG   = Operation.UnChanged,
            secsU   = Operation.UnChanged;

        if (action1 === null) {
            if (cooldowns[command] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.remove', command));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.setCombo' + (cooldowns[command].modsSkip ? 'ModsSkip' : ''), command, cooldowns[command].globalSec, cooldowns[command].userSec));
            }
            return;
        }

        if (modsSkipIn === undefined) {
            modsSkipIn = null;
        }

        if (type1.equalsIgnoreCase('remove')) {
            remove(command);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.remove', command));
            return;
        }

        if (!isNaN(parseInt(type1)) && second === undefined) { //Only assume this is global if no secondary action is present
            secsG = parseInt(type1);
            type1 = Type.Global;
        } else if ((!type1.equalsIgnoreCase(Type.Global) && !type1.equalsIgnoreCase(Type.User) && !type1.equalsIgnoreCase('modsskip')) || isNaN(parseInt(action1[1]))) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
            return;
        } else {
            secsG = type1.equalsIgnoreCase(Type.Global) ? parseInt(action1[1]) : secsG;
            secsU = type1.equalsIgnoreCase(Type.User) ? parseInt(action1[1]) : secsU;
            modsSkipIn = modsSkipIn === null && type1.equalsIgnoreCase('modsskip') ? action1[1] : modsSkipIn;
        }

        if (second !== undefined){
            var action2 = second.split("="),
                type2   = action2[0];

            if ((!type2.equalsIgnoreCase(Type.Global) && !type2.equalsIgnoreCase(Type.User) && !type2.equalsIgnoreCase('modsskip')) || isNaN(parseInt(action2[1])) || type2.equalsIgnoreCase(type1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
                return;
            }

            secsG = type2.equalsIgnoreCase(Type.Global) ? parseInt(action2[1]) : secsG;
            secsU = type2.equalsIgnoreCase(Type.User) ? parseInt(action2[1]) : secsU;
            modsSkipIn = modsSkipIn === null && type2.equalsIgnoreCase('modsskip') ? action2[1] : modsSkipIn;
        }

        var modsSkip = null;

        if (modsSkipIn !== null) {
            modsSkipIn = $.jsString(modsSkipIn).toLowerCase().trim();
            modsSkip = modsSkipIn === 'true' || modsSkipIn === '1' || modsSkipIn === 'modsskip=true' || modsSkipIn === 'modsskip=1';
        }

        if (secsG === Operation.UnSet && secsU === Operation.UnSet && modsSkip !== true) {
            remove(command);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.remove', command));
            return;
        }

        add(command, secsG, secsU, modsSkip);
        clear(command);

        if (modsSkip) {
            modsSkip = 'ModsSkip';
        } else {
            modsSkip = '';
        }

        if (action2 !== undefined) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.setCombo' + modsSkip, command, secsG, secsU));
        } else {
            var messageType = type1.equalsIgnoreCase(Type.Global) ? "cooldown.coolcom.setGlobal" : "cooldown.coolcom.setUser";
            $.say($.whisperPrefix(sender) + $.lang.get(messageType + modsSkip, command, (secsG === Operation.UnChanged ? secsU : secsG)));
        }
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2];

        /*
         * @commandpath coolcom [command] [user=seconds] [global=seconds] [modsskip=true] - Sets a cooldown for a command, default is global if no type and no secondary type is given. Using -1 for the seconds removes the cooldown. Specifying the 'modsskip' parameter with a value of 'true' enables moderators to ignore cooldowns for this command.
         * @commandpath coolcom [command] remove - Removes any command-specific cooldown that was set on the specified command.
         */
        if (command.equalsIgnoreCase('coolcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
                return;
            }

            handleCoolCom(sender, action, subAction, actionArgs, args[3]);
            return;
        }

        if (command.equalsIgnoreCase('cooldown')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.cooldown.usage'));
                return;
            }

            /*
             * @commandpath cooldown togglemoderators - Toggles if moderators ignore command cooldowns.
             */
            if (action.equalsIgnoreCase('togglemoderators')) {
                modCooldown = !modCooldown;
                $.setIniDbBoolean('cooldownSettings', 'modCooldown', modCooldown);
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.togglemodcooldown', (modCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                return;
            }

            /*
             * @commandpath cooldown setdefault [seconds] - Sets a default global cooldown for commands without a cooldown.
             */
            if (action.equalsIgnoreCase('setdefault')) {
                if (isNaN(parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.default.usage', defaultCooldownTime));
                    return;
                }

                if (parseInt(subAction) < 5) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.err'));
                    return;
                }

                defaultCooldownTime = parseInt(subAction);
                $.setIniDbNumber('cooldownSettings', 'defaultCooldownTime', defaultCooldownTime);
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.default.set', defaultCooldownTime));
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/commandCoolDown.js', 'coolcom', $.PERMISSION.Admin);
        $.registerChatCommand('./core/commandCoolDown.js', 'cooldown', $.PERMISSION.Admin);
        $.registerChatSubcommand('cooldown', 'togglemoderators', $.PERMISSION.Admin);
        $.registerChatSubcommand('cooldown', 'setdefault', $.PERMISSION.Admin);
        loadCooldowns();
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./core/commandCoolDown.js')) {
            if (event.getArgs()[0].equalsIgnoreCase('add')) {
                add(event.getArgs()[1], parseInt(event.getArgs()[2]), parseInt(event.getArgs()[3]), $.jsString(event.getArgs()[4]) === '1');
            } else if (event.getArgs()[0].equalsIgnoreCase('update')) {
                defaultCooldownTime = $.getIniDbNumber('cooldownSettings', 'defaultCooldownTime', 5);
                modCooldown = $.getIniDbBoolean('cooldownSettings', 'modCooldown', false);
            } else {
                remove(event.getArgs()[1]);
            }
        }
    });

    /* Export to the $. API */
    $.coolDown = {
        remove: remove,
        clear: clear,
        get: get,
        exists: exists,
        set: set,
        add: add
    };
})();
