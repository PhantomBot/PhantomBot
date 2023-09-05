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

    /**
     * @class Cooldown
     *
     * @param {String}  command
     * @param {Number}  globalSec
     * @param {Number}  userSec
     * @param {Boolean}  modsSkip
     * @param {Boolean}  clearOnOnline
     */
    function Cooldown(command, globalSec, userSec, modsSkip, clearOnOnline) {
        this.command = command;
        this.globalSec = globalSec;
        this.userSec = userSec;
        this.userTimes = [];
        this.globalTime = 0;
        this.modsSkip = modsSkip;
        this.clearOnOnline = clearOnOnline;
    }

    /**
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
            modsSkip: command.modsSkip,
            clearOnOnline: command.clearOnOnline
        });
    }

    /**
     * @function loadCooldowns
     */
    function loadCooldowns() {
        let commands = $.inidb.GetKeyList('cooldown', '');

        _cooldownsLock.lock();
        try {
            for (let i in commands) {
                let json = JSON.parse($.getIniDbString('cooldown', commands[i]));
                cooldowns[$.jsString(commands[i]).toLowerCase()] = new Cooldown(json.command.toLowerCase(), json.globalSec, json.userSec, json.modsSkip, json.clearOnOnline);
            }
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /**
     * @function canIgnore
     *
     * @param  {String} username
     * @param  {Boolean} isMod
     * @return {Boolean}
     */
    function canIgnore(username, isMod) {
        return (!modCooldown && isMod) || $.checkUserPermission(username, undefined, $.PERMISSION.Admin);
    }

    /**
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

    /**
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

    /**
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
            add(command, Operation.UnChanged, Operation.UnChanged, null, null);
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

    /**
     * @function add
     *
     * @export $.coolDown
     * @param {String}  command
     * @param {Number}  globalSec
     * @param {Number}  userSec
     * @param {Boolean} modsSkip
     * @param {Boolean} clearOnOnline
     */
    function add(command, globalSec, userSec, modsSkip, clearOnOnline) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        _cooldownsLock.lock();
        try {
            if (cooldowns[command] === undefined) {
                cooldowns[command] = new Cooldown(command,
                                                (globalSec === Operation.UnChanged ? Operation.UnSet : globalSec),
                                                (userSec === Operation.UnChanged ? Operation.UnSet : userSec),
                                                (modsSkip === undefined || modsSkip === null ? false : modsSkip),
                                                (clearOnOnline === undefined || clearOnOnline === null ? false : clearOnOnline));
            } else {
                if (globalSec !== Operation.UnChanged) {
                    cooldowns[command].globalSec = globalSec;
                    if (globalSec === Operation.UnSet) {
                        cooldowns[command].globalTime = 0;
                    }
                }
                if (userSec !== Operation.UnChanged) {
                    cooldowns[command].userSec = userSec;
                    if (userSec === Operation.UnSet) {
                        cooldowns[command].userTimes = [];
                    }
                }
                if (modsSkip !== undefined && modsSkip !== null) {
                    cooldowns[command].modsSkip = modsSkip;
                }
                if (clearOnOnline !== undefined && clearOnOnline !== null) {
                    cooldowns[command].clearOnOnline = clearOnOnline;
                }
            }

            $.inidb.set('cooldown', command, toJSONString(cooldowns[command]));
        } finally {
            _cooldownsLock.unlock();
        }
    }

    /**
     * @function remove
     *
     * @export $.coolDown
     * @param {String} command
     */
    function remove(command) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        $.inidb.del('cooldown', command);
        _cooldownsLock.lock();
        _defaultCooldownsLock.lock();
        try {
            if (cooldowns[command] !== undefined) {
                delete cooldowns[command];
            }
            if (defaultCooldowns[command] !== undefined) {
                delete defaultCooldowns[command];
            }
        } finally {
            _defaultCooldownsLock.unlock();
            _cooldownsLock.unlock();
        }
    }

    /**
     * @function clear
     *
     * @export $.coolDown
     * @param {String} command
     */
    function clear(command) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        _cooldownsLock.lock();
        _defaultCooldownsLock.lock();
        try {
            if (cooldowns[command] !== undefined) {
                cooldowns[command].userTimes = [];
                cooldowns[command].globalTime = 0;
                $.inidb.set('cooldown', command, toJSONString(cooldowns[command]));
            }
            if (defaultCooldowns[command] !== undefined) {
                delete defaultCooldowns[command];
            }
        } finally {
            _defaultCooldownsLock.unlock();
            _cooldownsLock.unlock();
        }
    }

    /**
     * @function clearAll
     *
     * @export $.coolDown
     */
    function clearAll() {
        _cooldownsLock.lock();
        _defaultCooldownsLock.lock();
        try {
            for (let command in cooldowns) {
                clear(command);
            }
            for (let command in defaultCooldowns) {
                clear(command);
            }
        } finally {
            _defaultCooldownsLock.unlock();
            _cooldownsLock.unlock();
        }
    }

    /**
     * @function handleCoolCom
     *
     * @param {String}  sender
     * @param {String}  command
     * @param {String[]}  args
     */
    function handleCoolCom(sender, command, args) {
        command = (command !== undefined && command !== null ? $.jsString(command).toLowerCase() : null);
        sender = (sender !== undefined && sender !== null ? $.jsString(sender).toLowerCase() : null);

        let secsU = $.getArgFromArray(args, Type.User, Operation.UnChanged),
            secsG = $.getArgFromArray(args, Type.Global, Operation.UnChanged),
            modsSkip = $.stringToBoolean($.getArgFromArray(args, 'modsskip', null)),
            clearOnOnline = $.stringToBoolean($.getArgFromArray(args, 'clearOnOnline', null));

        if (secsU === Operation.UnChanged && secsG === Operation.UnChanged) {
            if (!isNaN(parseInt(args[0]))) {
                secsG = parseInt(args[0]); //Assume global cooldown as first parameter if no specific cooldown type is specified
            }
        }

        // Error handling
        if (secsU !== null && isNaN(parseInt(secsU))) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
            return;
        }
        if (secsG !== null && isNaN(parseInt(secsG))) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
            return;
        }
        if (secsG === Operation.UnChanged && secsU === Operation.UnChanged && modsSkip === null && clearOnOnline === null) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
            return;
        }

        // Handling
        if (secsG === Operation.UnSet && secsU === Operation.UnSet) {
            remove(command);
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.remove', command));
            return;
        }
        add(command, secsG, secsU, modsSkip, clearOnOnline);

        // Build the message
        let message;
        if (secsG === Operation.UnChanged && secsU === Operation.UnChanged) { // Cooldown times did not change only options changed
            message =  $.lang.get('cooldown.coolcom.setoptions', command);
        } else if (secsG !== Operation.UnChanged && secsU !== Operation.UnChanged) { // Both cooldown times changed
            message = $.lang.get('cooldown.coolcom.setCombo', command, secsG, secsU);
        } else { //Only one cooldown time changed
            let messageType = secsU === Operation.UnChanged ? 'cooldown.coolcom.setGlobal' : 'cooldown.coolcom.setUser';
            message =  $.lang.get(messageType, command, (secsU === Operation.UnChanged ? secsG : secsU));
        }

        if (modsSkip !== null) {
            message += " " + $.lang.get('cooldown.coolcom.ModSkipAddon');
        }
        if (clearOnOnline !== null) {
            message += " " + $.lang.get('cooldown.coolcom.OnlineClearAddon');
        }

        $.say($.whisperPrefix(sender) + message);
    }

    /**
     * @event twitchOnline
     */
    $.bind('twitchOnline', function () {
        _cooldownsLock.lock();
        try {
            for (let command in cooldowns) {
                if (cooldowns[command].clearOnOnline) {
                    clear(command);
                }
            }
        } finally {
            _cooldownsLock.unlock();
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath coolcom [command] [user=seconds] [global=seconds] [modsskip=false] [clearOnOnline=false] - Sets a cooldown for a command, default is global if no type and no secondary type is given. Using -1 for the seconds removes the cooldown. Specifying the 'modsskip' parameter with a value of 'true' enables moderators to ignore cooldowns for this command. Specifying the 'clearOnOnline' parameter with a value of 'true' clear the commands cooldowns when going online/live.
         * @commandpath coolcom [command] remove - Removes any command-specific cooldown that was set on the specified command.
         * @commandpath coolcom [command] clear - Clears all active cooldowns for the specified command.
         */
        if ($.equalsIgnoreCase(command, 'coolcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.extras.usage'));
                return;
            }

            if ($.equalsIgnoreCase(subAction, 'remove') || $.equalsIgnoreCase(subAction, 'clear')) {
                if (!exists(action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.command.err', action));
                    return;
                }
                if ($.equalsIgnoreCase(subAction, 'remove')) {
                    remove(action);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.remove', action));
                } else {
                    clear(action);
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.clear', action));
                }
                return;
            }

            handleCoolCom(sender, action, args.slice(1));
            return;
        }

        if ($.equalsIgnoreCase(command, 'cooldown')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.cooldown.usage'));
                return;
            }

            /**
             * @commandpath cooldown togglemoderators - Toggles if moderators ignore command cooldowns.
             */
            if ($.equalsIgnoreCase(action, 'togglemoderators')) {
                modCooldown = !modCooldown;
                $.setIniDbBoolean('cooldownSettings', 'modCooldown', modCooldown);
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.set.togglemodcooldown', (modCooldown ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                return;
            }

            /**
             * @commandpath cooldown setdefault [seconds] - Sets a default global cooldown for commands without a cooldown.
             */
            if ($.equalsIgnoreCase(action, 'setdefault')) {
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
                return;
            }

            /**
             * @commandpath cooldown clearall - Clears all active cooldowns
             */
            if ($.equalsIgnoreCase(action, 'clearall')) {
                clearAll();
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.clear.all'));
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/commandCoolDown.js', 'coolcom', $.PERMISSION.Admin);
        $.registerChatCommand('./core/commandCoolDown.js', 'cooldown', $.PERMISSION.Admin);
        $.registerChatSubcommand('cooldown', 'togglemoderators', $.PERMISSION.Admin);
        $.registerChatSubcommand('cooldown', 'setdefault', $.PERMISSION.Admin);
        $.registerChatSubcommand('cooldown', 'clearall', $.PERMISSION.Admin);
        loadCooldowns();
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if ($.equalsIgnoreCase(event.getScript(), './core/commandCoolDown.js')) {
            if ($.equalsIgnoreCase(event.getArgs()[0], 'add')) {
                add(event.getArgs()[1], parseInt(event.getArgs()[2]), parseInt(event.getArgs()[3]), $.jsString(event.getArgs()[4]) === '1', $.jsString(event.getArgs()[5]) === '1');
                let command = $.jsString(event.getArgs()[1]).trim(),
                    subCommand = null;
                if (command.indexOf(' ') !== -1) {
                    subCommand = command.split(' ')[1];
                    command = command.split(' ')[0];
                }
                $.setCommandRestriction(command, subCommand, $.getCommandRestrictionByName($.jsString(event.getArgs()[6])));
            } else if ($.equalsIgnoreCase(event.getArgs()[0], 'update')) {
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
