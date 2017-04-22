/**
 * this module is made to handle command cooldowns for discord.
 *
 */
(function() {
    var defaultCooldownTime = $.getSetIniDbNumber('discordCooldownSettings', 'defaultCooldownTime', 5),
        defaultCooldowns = [],
        cooldowns = [];

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
        var commands = $.inidb.GetKeyList('discordCooldown', ''),
            json,
            i;

        for (i in commands) {
            json = JSON.parse($.inidb.get('discordCooldown', commands[i]));

            cooldowns[commands[i]] = new Cooldown(json.command, json.seconds, (json.isGlobal == true));
        }
    }

    /*
     * @function get 
     *
     * @export $.coolDown
     * @param  {String}  command
     * @param  {String}  username
     * @return {Number}
     */
    function get(command, username) {
        var cooldown = cooldowns[command];

        if (cooldown !== undefined) {
            if (cooldown.isGlobal) {
                if (cooldown.time > $.systemTime()) {
                    return cooldown.time;
                } else {
                    return set(command, true, cooldown.seconds);
                }
            } else {
                if (cooldown.cooldowns[username] !== undefined && cooldown.cooldowns[username] > $.systemTime()) {
                    return cooldown.cooldowns[username];
                } else {
                    return set(command, true, cooldown.seconds, username);
                }
            }
        } else {
            if (defaultCooldowns[command] !== undefined && defaultCooldowns[command] > $.systemTime()) {
                return defaultCooldowns[command];
            } else {
                return set(command, false, defaultCooldownTime);
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
     * @param  {String}  username
     * @return {Number}
     */
    function set(command, hasCooldown, seconds, username) {
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
            $.inidb.set('discordCooldown', command, JSON.stringify({command: String(command), seconds: String(seconds), isGlobal: String(isGlobal)}));
        } else {
            cooldowns[command].isGlobal = isGlobal;
            cooldowns[command].seconds = seconds;
            $.inidb.set('discordCooldown', command, JSON.stringify({command: String(command), seconds: String(seconds), isGlobal: String(isGlobal)}));
        }
    }

    /*
     * @function remove
     *
     * @export $.coolDown
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
     * @export $.coolDown
     * @param {String}  command
     */
    function clear(command) {
        if (cooldowns[command] !== undefined) {
            cooldowns[command].time = 0;
        }
    }

    /*
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            channel = event.getChannel(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2];

        /*
         * @commandpath coolcom [command] [seconds] [type (global / user)] - Sets a cooldown for a command, default is global. Using -1 for the seconds removes the cooldown.
         */
        if (command.equalsIgnoreCase('coolcom')) {
            if (action === undefined || isNaN(parseInt(subAction))) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.usage'));
                return;
            }

            actionArgs = (actionArgs !== undefined && actionArgs == 'user' ? false : true);
            action = action.replace('!', '').toLowerCase();
            subAction = parseInt(subAction);

            if (subAction > -1) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.set', action, subAction)); 
                add(action, subAction, actionArgs);
            } else {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.cooldown.coolcom.remove', action));
                remove(action);
            }
            clear(command);
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
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/core/commandCoolDown.js')) {
            if (event.getArgs()[0] == 'add') {
                add(event.getArgs()[1], event.getArgs()[2], event.getArgs()[3].equals('true'));
            } else {
                remove(event.getArgs()[1]);
            }
        }
    });

    /* Export to the $. API */
    $.discord.cooldown = {
        remove: remove,
        clear: clear,
        get: get,
        set: set,
        add: add
    };
})();
