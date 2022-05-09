/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

(function() {
    var defaultCooldownTime = $.getSetIniDbNumber('cooldownSettings', 'defaultCooldownTime', 5),
        modCooldown = $.getSetIniDbBoolean('cooldownSettings', 'modCooldown', false),
        defaultCooldowns = {},
        cooldowns = {};

    $.raffleCommand = null;

    const   Type = {
                User: 'user',
                Global: 'global'
            },
            Operation = {
                UnSet: -1,
                UnChanged: 0
            };

    /*
     * @class Cooldown
     *
     * @param {String}  command
     * @param {Number}  globalSec
     * @param {Number}  userSec
     */
    function Cooldown(command, globalSec, userSec) {
            this.command = command;
            this.globalSec = globalSec;
            this.userSec = userSec;
            this.userTimes = [];
            this.globalTime = 0;
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
            userSec: command.userSec
        });
    }

    /*
     * @function loadCooldowns
     */
    function loadCooldowns() {
        var commands = $.inidb.GetKeyList('cooldown', ''),
            json,
            i;

        for (i in commands) {
            json = JSON.parse($.inidb.get('cooldown', commands[i]));
            cooldowns[commands[i]] = new Cooldown(json.command, json.globalSec, json.userSec);
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
        return (!modCooldown && isMod) || $.isAdmin(username);
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
               command === $.raffleCommand;
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
        var isGlobal = false,
            maxCoolDown = 0;


        if(canIgnore(username, isMod)) {
            return [maxCoolDown, isGlobal];
        }

        if (isSpecial(command)) {
            if (command.equalsIgnoreCase('adventure') && defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
                maxCoolDown = getTimeDif(defaultCooldowns[command]);
                isGlobal = true;
            }
            return [maxCoolDown, isGlobal];
        }

        var cooldown = cooldowns[command],
            useDefault = false;

        if (cooldown !== undefined) {
            var hasCooldown = false;

            if (cooldown.globalSec !== Operation.UnSet) {
                hasCooldown = true;
                isGlobal = true;
                if (cooldown.globalTime > $.systemTime()) {
                    maxCoolDown = getTimeDif(cooldown.globalTime);
                } else if(cooldown.userTimes[username] === undefined || (cooldown.userTimes[username] !== undefined && cooldown.userTimes[username] < $.systemTime())){ //Only set a cooldown timer if the user can actually use the command
                    set(command, useDefault, cooldown.globalSec, undefined);
                }
            }

            if (cooldown.userSec !== Operation.UnSet) {
                hasCooldown = true;
                if (cooldown.userTimes[username] !== undefined && cooldown.userTimes[username] > $.systemTime()) {
                    var userCoolDown = getTimeDif(cooldown.userTimes[username]);
                    if(userCoolDown > maxCoolDown) {
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

        if (defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
            maxCoolDown = getTimeDif(defaultCooldowns[command]);
        } else {
            useDefault  = true;
            set(command, useDefault, defaultCooldownTime, undefined);
        }

        return [maxCoolDown, isGlobal];
    }

    function getTimeDif(cooldownSec) {
        return (cooldownSec - $.systemTime() > 1000 ? Math.ceil(((cooldownSec - $.systemTime()) / 1000)) : 1);
    }

    function exists(command) {
        return defaultCooldowns[command] !== undefined || cooldowns[command] !== undefined;
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
        var finishTime = (duration > 0 ? ((parseInt(duration) * 1e3) + $.systemTime()) : 0);

        if (useDefault) {
            defaultCooldowns[command] = finishTime;
            return;
        }

        if (!exists(command)) {
            add(command, Operation.UnChanged, Operation.UnChanged);
        }

        if (username === undefined) {
            cooldowns[command].globalTime = finishTime;
        } else {
            cooldowns[command].userTimes[username] = finishTime;
        }
    }

    /*
     * @function add
     *
     * @export $.coolDown
     * @param {String}  command
     * @param {Number}  globalSec
     * @param {Number}  userSec
     */
    function add(command, globalSec, userSec) {
        if (cooldowns[command] === undefined) {
            cooldowns[command] = new Cooldown(command,
                                             (globalSec === Operation.UnChanged ? Operation.UnSet : globalSec),
                                             (userSec === Operation.UnChanged ? Operation.UnSet : userSec));
        } else {
            if (globalSec !== Operation.UnChanged) {
                cooldowns[command].globalSec = globalSec;
            }
            if (userSec !== Operation.UnChanged) {
                cooldowns[command].userSec = userSec;
            }
        }

        $.inidb.set('cooldown', command, toJSONString(cooldowns[command]));
    }

    /*
     * @function remove
     *
     * @export $.coolDown
     * @param {String}  command
     */
    function remove(command) {
        $.inidb.del('cooldown', command);
        if (cooldowns[command] !== undefined) {
            delete cooldowns[command];
        }
    }

    /*
     * @function clear
     *
     * @export $.coolDown
     * @param {String}  command
     */
    function clear(command) {
        if (cooldowns[command] !== undefined) {
            cooldowns[command].globalTime = 0;
            cooldowns[command].userTimes = [];
        }
    }

    /*
     * @function handleCoolCom
     *
     * @param {String}  sender
     * @param {String}  command
     * @param {String}  first
     * @param {String}  second
     */
    function handleCoolCom(sender, command, first, second) {
        var action1 = first.split("="),
            type1   = action1[0],
            secsG   = Operation.UnChanged,
            secsU   = Operation.UnChanged;

        if(!isNaN(parseInt(type1)) && second === undefined) { //Only assume this is global if no secondary action is present
            secsG = parseInt(type1);
            type1 = Type.Global;
        } else if ((!type1.equalsIgnoreCase(Type.Global) && !type1.equalsIgnoreCase(Type.User)) || isNaN(parseInt(action1[1]))) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
            return;
        } else {
            secsG = type1.equalsIgnoreCase(Type.Global) ? parseInt(action1[1]) : secsG;
            secsU = type1.equalsIgnoreCase(Type.User) ? parseInt(action1[1]) : secsU;
        }


        if (second !== undefined){
            var action2 = second.split("="),
                type2   = action2[0];

            if ((!type2.equalsIgnoreCase(Type.Global) && !type2.equalsIgnoreCase(Type.User)) || isNaN(parseInt(action2[1])) || type2.equalsIgnoreCase(type1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
                return;
            }

            secsG = type2.equalsIgnoreCase(Type.Global) ? parseInt(action2[1]) : secsG;
            secsU = type2.equalsIgnoreCase(Type.User) ? parseInt(action2[1]) : secsU;
        }

        if (secsG === Operation.UnSet && secsU === Operation.UnSet) {
            remove(command);
        } else {
            add(command, secsG, secsU);
            clear(command);
        }

        if(action2 !== undefined) {
            $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.setCombo', command, secsG, secsU));
        } else {
            var messageType = type1.equalsIgnoreCase(Type.Global) ? "cooldown.coolcom.setGlobal" : "cooldown.coolcom.setUser";
            $.say($.whisperPrefix(sender) + $.lang.get(messageType, command, (secsG === Operation.UnChanged ? secsU : secsG)));
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
         * @commandpath coolcom [command] [user=seconds] [global=seconds] - Sets a cooldown for a command, default is global if no type and no secondary type is given. Using -1 for the seconds removes the cooldown.
         */
        if (command.equalsIgnoreCase('coolcom')) {
            if(action === undefined || isNaN(parseInt(subAction))) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
                return;
            }
            handleCoolCom(sender, action, subAction, actionArgs);
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
                    $.say($.whisperPrefix(sender) + $.lang.get('cooldown.default.usage'));
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
        $.registerChatCommand('./core/commandCoolDown.js', 'coolcom', 1);

        $.registerChatCommand('./core/commandCoolDown.js', 'cooldown', 1);
        $.registerChatSubcommand('cooldown', 'togglemoderators', 1);
        $.registerChatSubcommand('cooldown', 'setdefault', 1);
        loadCooldowns();
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./core/commandCoolDown.js')) {
            if (event.getArgs()[0].equalsIgnoreCase('add')) {
                add(event.getArgs()[1], parseInt(event.getArgs()[2]), parseInt(event.getArgs()[3]));
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
