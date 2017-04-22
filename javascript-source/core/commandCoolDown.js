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
        defaultCooldowns = [],
        cooldowns = [];

    $.raffleCommand = null;

    /*
     * @class Cooldown
     *
     * @param {String}  command
     * @param {Number}  seconds
     * @param {Boolean} isGlobal
     */
    function Cooldown(command, seconds, isGlobal) {
        this.isGlobal = isGlobal;
        this.command = command;
        this.seconds = seconds;
        this.cooldowns = [];
        this.time = 0;
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

            cooldowns[commands[i]] = new Cooldown(json.command, json.seconds, (json.isGlobal == true));
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
        return command == 'bet' || command == 'tickets' || command == 'bid' || command == 'adventure' || command == $.raffleCommand;
    }

    /*
     * @function get 
     *
     * @export $.coolDown
     * @param  {String}  command
     * @param  {String}  username
     * @param  {Boolean} isMod
     * @return {Number}
     */
    function get(command, username, isMod) {
        var cooldown = cooldowns[command];

        if (isSpecial(command)) {
            if (command == 'adventure' && defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
                return defaultCooldowns[command];
            } else {
                return 0;
            }
        } else {
            if (cooldown !== undefined) {
                if (cooldown.isGlobal) {
                    if (cooldown.time > $.systemTime()) {
                        return (canIgnore(username, isMod) ? 0 : cooldown.time);
                    } else {
                        return set(command, true, cooldown.seconds, isMod);
                    }
                } else {
                    if (cooldown.cooldowns[username] !== undefined && cooldown.cooldowns[username] > $.systemTime()) {
                        return (canIgnore(username, isMod) ? 0 : cooldown.cooldowns[username]);
                    } else {
                        return set(command, true, cooldown.seconds, isMod, username);
                    }
                }
            } else {
                if (defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
                    return (canIgnore(username, isMod) ? 0 : defaultCooldowns[command]);
                } else {
                    return set(command, false, defaultCooldownTime, isMod);
                }
            }
        }
    }

    /*
     * @function set 
     *
     * @export $.coolDown
     * @param  {String}  command
     * @param  {Boolean} hasCooldown
     * @param  {Number}  seconds
     * @param  {Boolean} isMod
     * @param  {String}  username
     * @return {Number}
     */
    function set(command, hasCooldown, seconds, isMod, username) {
        seconds = ((parseInt(seconds) * 1e3) + $.systemTime());

        if (hasCooldown) {
            if (username === undefined) {
                cooldowns[command].time = seconds;
            } else {
                cooldowns[command].cooldowns[username] = seconds;
            }
        } else {
            defaultCooldowns[command] = seconds;
        }
        return 0;
    }

    /*
     * @function add
     *
     * @export $.coolDown
     * @param {String}  command
     * @param {Number}  seconds
     * @param {Boolean} isGlobal
     */
    function add(command, seconds, isGlobal) {
        if (cooldowns[command] === undefined) {
            cooldowns[command] = new Cooldown(command, seconds, isGlobal);
            $.inidb.set('cooldown', command, JSON.stringify({command: String(command), seconds: String(seconds), isGlobal: String(isGlobal)}));
        } else {
            cooldowns[command].isGlobal = isGlobal;
            cooldowns[command].seconds = seconds;
            $.inidb.set('cooldown', command, JSON.stringify({command: String(command), seconds: String(seconds), isGlobal: String(isGlobal)}));
        }
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
            cooldowns[command].time = 0;
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
         * @commandpath coolcom [command] [seconds] [type (global / user)] - Sets a cooldown for a command, default is global. Using -1 for the seconds removes the cooldown.
         */
        if (command.equalsIgnoreCase('coolcom')) {
            if (action === undefined || isNaN(parseInt(subAction))) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.usage'));
                return;
            }

            actionArgs = (actionArgs !== undefined && actionArgs == 'user' ? false : true);
            action = action.replace('!', '').toLowerCase();
            subAction = parseInt(subAction);

            if (subAction > -1) {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.set', action, subAction)); 
                add(action, subAction, actionArgs);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('cooldown.coolcom.remove', action));
                remove(action);
            }
            clear(command);
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
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./core/commandCoolDown.js')) {
            if (event.getArgs()[0] == 'add') {
                add(event.getArgs()[1], event.getArgs()[2], event.getArgs()[3].equals('true'));
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
        set: set,
        add: add
    };
})();
