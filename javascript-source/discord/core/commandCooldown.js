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

/**
 * this module is made to handle command cooldowns for discord.
 *
 */
(function() {
    var defaultCooldownTime = $.getSetIniDbNumber('discordCooldownSettings', 'defaultCooldownTime', 5),
        defaultCooldowns = [],
        cooldowns = [];

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
        var commands = $.inidb.GetKeyList('discordCooldown', ''),
            json,
            i;

        for (i in commands) {
            json = JSON.parse($.inidb.get('discordCooldown', commands[i]));

            cooldowns[commands[i]] = new Cooldown(json.command, json.globalSec, json.userSec);
        }
    }

    /*
     * @function get
     *
     * @export $.discord.coolDown
     * @param  {String}  command
     * @param  {String}  username
     * @return {Number}
     */
    function get(command, username) {
        var isGlobal = false,
            maxCoolDown = 0,
            cooldown = cooldowns[command],
            useDefault = false;

    if (cooldown !== undefined) {

        if (cooldown.globalSec !== Operation.UnSet) {
            isGlobal = true;
            if (cooldown.globalTime > $.systemTime()) {
                maxCoolDown = getTimeDif(cooldown.globalTime);
            } else if(cooldown.userTimes[username] === undefined || (cooldown.userTimes[username] !== undefined && cooldown.userTimes[username] < $.systemTime())){ //Only set a cooldown timer if the user can actually use the command
                set(command, useDefault, cooldown.globalSec, undefined);
            }
        }

        if (cooldown.userSec !== Operation.UnSet) {
            if (cooldown.userTimes[username] !== undefined && cooldown.userTimes[username] > $.systemTime()) {
                userCoolDown = getTimeDif(cooldown.userTimes[username]);
                if(userCoolDown > maxCoolDown) {
                    isGlobal = false;
                    maxCoolDown = userCoolDown;
                }
            } else if (maxCoolDown === 0){ //Global cooldown got set ... also set user cooldown or only per-user cooldown is activated
                set(command, useDefault, cooldown.userSec, username);
            }
        }
        return [maxCoolDown, isGlobal];
    }


    if (defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
        maxCoolDown = getTimeDif(defaultCooldowns[command]);
    } else {
        useDefault  = true;
        set(command, useDefault, defaultCooldownTime, undefined);
    }

    return [maxCoolDown, isGlobal];
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
        finishTime = (duration > 0 ? ((parseInt(duration) * 1e3) + $.systemTime()) : 0);

        if (useDefault) {
            defaultCooldowns[command] = finishTime;
            return;
        }

        if (username === undefined) {
            cooldowns[command].globalTime = finishTime;
        } else {
            cooldowns[command].userTimes[username] = finishTime;
        }
    }

    function getTimeDif(cooldownSec) {
        return (cooldownSec - $.systemTime() > 1000 ? Math.ceil(((cooldownSec - $.systemTime()) / 1000)) : 1);
    }


    function exists(command) {
        return defaultCooldowns[command] !== undefined || cooldowns[command] !== undefined;
    }

    /*
     * @function add
     *
     * @export $.discord.coolDown
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
        $.inidb.set('discordCooldown', command, toJSONString(cooldowns[command]));
    }

    /*
     * @function remove
     *
     * @export $.discord.coolDown
     * @param {String}  command
     */
    function remove(command) {
        $.inidb.del('discordCooldown', command);
        if (cooldowns[command] !== undefined) {
            delete cooldowns[command];
        }
    }

    /*
     * @function clear
     *
     * @export $.discord.coolDown
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
     * @param {String}  channel
     * @param {String}  command
     * @param {String}  first
     * @param {String}  second
     */
    function handleCoolCom(mention, channel, command, first, second) {
        var action1 = first.split("="),
            type1   = action1[0],
            secsG   = Operation.UnChanged,
            secsU   = Operation.UnChanged;

        if (type1.equalsIgnoreCase('remove')) {
            remove(command);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.remove', command));
            return;
        }

        if(!isNaN(parseInt(type1)) && second === undefined) { //Only assume this is global if no secondary action is present
            type1 = Type.Global;
            secsG = ParseInt(type1);
        } else if (!type1.equalsIgnoreCase(Type.Global) && !type1.equalsIgnoreCase(Type.User) || isNaN(parseInt(action1[1]))) {
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.usage'));
            return;
        } else {
            secsG = type1.equalsIgnoreCase(Type.Global) ? parseInt(action1[1]) : secsG;
            secsU = type1.equalsIgnoreCase(Type.User) ? parseInt(action1[1]) : secsU;
        }

        if (second !== undefined){
            var action2 = second.split("="),
                type2   = action2[0];

            if (!type2.equalsIgnoreCase(Type.Global) && !type2.equalsIgnoreCase(Type.User) || isNaN(parseInt(action2[1])) || type2.equalsIgnoreCase(type1)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.usage'));
                return;
            } else {
                secsG = type2.equalsIgnoreCase(Type.Global) ? parseInt(action2[1]) : secsG;
                secsU = type2.equalsIgnoreCase(Type.User) ? parseInt(action2[1]) : secsU;
            }
        }

        if (secsG === Operation.UnSet && secsU === Operation.UnSet) {
            remove(command);
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.remove', command));
            return;
        } else {
            add(command, secsG, secsU);
            clear(command);
        }

        if(action2 !== undefined) {
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.setCombo', command, secsG, secsU));
        } else {
            messageType = type1.equalsIgnoreCase(Type.Global) ? "discord.cooldown.coolcom.setGlobal" : "discord.cooldown.coolcom.setUser";
            $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get(messageType, command, (secsG === Operation.UnChanged ? secsU : secsG)));
        }
    }

    /*
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            channel = event.getDiscordChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2];

        /*
         * @discordcommandpath coolcom [command] [user=seconds] [global=seconds] - Sets a cooldown for a command, default is global if no type and no secondary type is given. Using -1 for the seconds removes the cooldown.
         * @discordcommandpath coolcom [command] remove
         */
        if (command.equalsIgnoreCase('coolcom')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.usage'));
                return;
            }

            handleCoolCom(mention, channel, action, subAction, actionArgs);
            return;
        }

        if (command.equalsIgnoreCase('cooldown')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.cooldown.usage'));
                return;
            }

            /*
             * @discordcommandpath cooldown setdefault [seconds] - Sets a default global cooldown for commands without a cooldown.
             */
            if (action.equalsIgnoreCase('setdefault')) {
                if (isNaN(parseInt(subAction))) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.default.usage'));
                    return;
                }

                defaultCooldownTime = parseInt(subAction);
                $.setIniDbNumber('discordCooldownSettings', 'defaultCooldownTime', defaultCooldownTime);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.default.set', defaultCooldownTime));
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/core/commandCoolDown.js', 'coolcom', 1);

        $.discord.registerCommand('./discord/core/commandCoolDown.js', 'cooldown', 1);
        $.discord.registerSubCommand('cooldown', 'setdefault', 1);
        loadCooldowns();
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/core/commandCoolDown.js')) {
            if (event.getArgs()[0] === 'add') {
                add(event.getArgs()[1], event.getArgs()[2], event.getArgs()[3]);
            } else if (event.getArgs()[0] === 'update') {
                defaultCooldownTime = $.getIniDbNumber('discordCooldownSettings', 'defaultCooldownTime', 5);
            } else {
                remove(event.getArgs()[1]);
            }
        }
    });

    /* Export to the $. API */
    $.discord.cooldown = {
        remove: remove,
        clear: clear,
        exists: exists,
        get: get,
        set: set,
        add: add
    };
})();
