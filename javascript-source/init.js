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
 * init.js
 * This scripts handles all events and most things for the scripts.
 */
(function () {
    var isReady = false,
            modules = [],
            hooks = [];

    /*
     * @class Module
     *
     * @param {String}  scriptName
     * @param {Object}  script
     * @param {Boolean} isEnabled
     */
    function Module(scriptName, script, isEnabled) {
        this.scriptName = scriptName;
        this.isEnabled = isEnabled;
        this.script = script;

        this.getModuleName = function () {
            return this.scriptName.match(/((\w+)\.js)$/)[2];
        };
    }

    /*
     * @class Hook
     *
     * @param {String}   scriptName
     * @param {String}   hookName
     * @param {Function} handler
     */
    function Hook(scriptName, hookName, handler, scriptPath) {
        hookName = $api.formatEventName(hookName) + '';
        this.scriptName = scriptName;
        this.hookName = hookName;
        this.handler = handler;
        this.scriptPath = scriptPath;
    }

    /*
     * @class HookHandler
     *
     * @param {String} hookName
     */
    function HookHandler(hookName) {
        this.hookName = hookName;
        this.handlers = [];
    }

    /*
     * @function consoleLn
     *
     * @param {String} message
     */
    function consoleLn(message) {
        Packages.com.gmt2001.Console.out.println(java.util.Objects.toString(message));
    }

    /*
     * @function consoleDebug
     *
     * @param {String} message
     */
    function consoleDebug(message) {
        if (Packages.tv.phantombot.PhantomBot.getEnableDebugging()) {
            try {
                throw new Error();
            } catch (ex) {
                Packages.com.gmt2001.Console.debug.printlnRhino(java.util.Objects.toString('[' + ex.stack.split('\n')[1].trim() + '] ' + message));
            }
        }
    }

    /*
     * @function generateJavaTrampolines
     */
    function generateJavaTrampolines() {
        var name,
                isJavaProperty = function (name) {
                    var blacklist = ['getClass', 'equals', 'notify', 'class', 'hashCode', 'toString', 'wait', 'notifyAll'];

                    return (blacklist[name] !== undefined);
                },
                generateTrampoline = function (obj, name) {
                    return function () {
                        var args = [$script];

                        for (var i = 0; i < arguments.length; i++) {
                            args.push(arguments[i]);
                        }

                        obj[name].save(obj, args);
                    };
                };

        for (name in $api) {
            if (!isJavaProperty(name)) {
                if (typeof $api[name] === 'function') {
                    $[name] = generateTrampoline($api, name);
                } else {
                    $[name] = $api[name];
                }
            }
        }
    }

    /*
     * @function loadScript
     *
     * @param {String}  scriptName
     * @param {Boolean} force
     * @param {Boolean} silent
     */
    function loadScript(scriptName, force, silent) {
        if (!isModuleLoaded(scriptName) || force) {
            if (scriptName.endsWith('.js')) {
                try {
                    var enabled,
                            script;

                    if ($api.getScript($script, scriptName) != null) {
                        script = $api.reloadScriptR($script, scriptName);
                    } else {
                        script = $api.loadScriptR($script, scriptName);
                    }

                    enabled = $.getSetIniDbBoolean('modules', scriptName, true);

                    modules[scriptName] = new Module(scriptName, script, enabled);

                    if (!silent) {
                        consoleLn('Loaded module: ' + scriptName.replace(/\.\//g, '') + ' (' + (enabled ? 'Enabled' : 'Disabled') + ')');
                    }
                } catch (ex) {
                    consoleLn('Failed loading "' + scriptName + '": ' + ex);
                }
            }
        }
    }

    /*
     * @function loadScriptRecursive
     *
     * @param {String}  path
     * @param {Boolean} silent
     * @param {Boolean} force
     */
    function loadScriptRecursive(path, silent, force) {
        var files = $.findFiles('./scripts/' + path, ''),
                i;

        for (i in files) {
            files[i] = $.jsString(files[i]);
            if (path === '.') {
                if (files[i] === 'lang' || files[i] === 'discord' || files[i] === 'init.js') {
                    continue;
                }
            }

            if ($.isDirectory('./scripts/' + path + '/' + files[i])) {
                loadScriptRecursive(path + '/' + files[i], silent, (force && path !== './core' && path !== './discord/core' ? force : false));
            } else {
                loadScript(path + '/' + files[i], (force && path !== './core' && path !== './discord/core' ? force : false), silent);
            }
        }
    }


    /*
     * @function isModuleEnabled
     *
     * @param  {String} scriptName
     * @return {Boolean}
     */
    function isModuleEnabled(scriptName) {
        return (modules[scriptName] !== undefined ? modules[scriptName].isEnabled : false);
    }

    /*
     * @function isModuleLoaded
     *
     * @param  {String} scriptName
     * @return {Boolean}
     */
    function isModuleLoaded(scriptName) {
        return (modules[scriptName] !== undefined);
    }

    /*
     * @function getModule
     *
     * @param  {String} scriptName
     * @return {Object}
     */
    function getModule(scriptName) {
        return modules[scriptName];
    }

    /*
     * @function getHook
     *
     * @param  {String} scriptName
     * @param  {String} hookName
     * @return {Object}
     */
    function getHook(scriptName, hookName) {
        hookName = $api.formatEventName(hookName) + '';
        return (hooks[hookName] !== undefined ? hooks[hookName].handlers[getHookIndex(scriptName, hookName)] : null);
    }

    /*
     * @function getHookIndex
     *
     * @param  {String} scriptName
     * @param  {String} hookName
     * @return {Number}
     */
    function getHookIndex(scriptName, hookName) {
        hookName = $api.formatEventName(hookName) + '';
        var hook = hooks[hookName],
                i;

        if (hook !== undefined) {
            for (i in hook.handlers) {
                if (hook.handlers[i].scriptName.equalsIgnoreCase(scriptName)) {
                    return i;
                }
            }
        }
        return -1;
    }

    /*
     * @function addHook
     *
     * @param {String}   hookName
     * @param {Function} handler
     */
    function addHook(hookName, handler) {
        hookName = $api.formatEventName(hookName) + '';
        var scriptName = $.replace($.replace($script.getPath(), '\\', '/'), './scripts/', ''),
                i = getHookIndex(scriptName, hookName);

        if (hookName !== 'initReady' && $api.exists(hookName) == false) {
            Packages.com.gmt2001.Console.err.printlnRhino('[addHook()@init.js:254] Failed to register hook "' + hookName + '" since there is no such event.');
        } else if (i !== -1) {
            hooks[hookName].handlers[i].handler = handler;
        } else {
            if (hooks[hookName] === undefined) {
                hooks[hookName] = new HookHandler(hookName);
            }
            hooks[hookName].handlers.push(new Hook(scriptName, hookName, handler, $script.getRealFileName()));
        }
    }

    /*
     * @function hookName
     *
     * @param {String} hookName
     */
    function removeHook(hookName) {
        hookName = $api.formatEventName(hookName) + '';
        var scriptName = $.replace($.replace($script.getPath(), '\\', '/'), './scripts/', ''),
                i = getHookIndex(scriptName, hookName);

        if (hooks[hookName] !== undefined) {
            hooks[hookName].handlers.splice(i, 1);
        }
    }

    /*
     * @function callHook
     *
     * @param {String}  hookName
     * @param {Object}  event
     * @param {Boolean} force
     */
    function callHook(hookName, event, force) {
        hookName = $api.formatEventName(hookName) + '';
        var hook = hooks[hookName],
                i;

        if (hook === undefined) {
            return;
        }

        if (hookName === 'command') {
            i = getHookIndex($.getCommandScript(event.getCommand()), hookName);

            try {
                hook.handlers[i].handler(event);
            } catch (ex) {
                var errmsg;
                try {
                    errmsg = 'Error with Event Handler [' + hookName + '] Script [' + hook.handlers[i].scriptPath + '] Stacktrace [' + ex.stack.trim().replace(/\r/g, '').split('\n').join(' > ').replace(/anonymous\(\)@|callHook\(\)@/g, '') + '] Exception [' + ex + ']';
                } catch (ex2) {
                    errmsg = 'Error with Event Handler [' + hookName + '] Script [' + hook.handlers[i].scriptPath + ']';
                }
                $.log.error(errmsg);
                if (ex.javaException !== undefined) {
                    $.consoleLn("Sending stack trace to error log...");
                    Packages.com.gmt2001.Console.err.printStackTrace(ex.javaException, errmsg);
                } else {
                    try {
                        Packages.com.gmt2001.Console.err.printStackTrace(ex, errmsg);
                    } catch (ex3) {
                    }
                }
            }
        } else {
            for (i in hook.handlers) {
                if (isModuleEnabled(hook.handlers[i].scriptName) || force) {
                    try {
                        hook.handlers[i].handler(event);
                    } catch (ex) {
                        var errmsg;
                        try {
                            errmsg = 'Error with Event Handler [' + hookName + '] Script [' + hook.handlers[i].scriptPath + '] Stacktrace [' + ex.stack.trim().replace(/\r/g, '').split('\n').join(' > ').replace(/anonymous\(\)@|callHook\(\)@/g, '') + '] Exception [' + ex + ']'
                        } catch (ex2) {
                            errmsg = 'Error with Event Handler [' + hookName + '] Script [' + hook.handlers[i].scriptPath + ']';
                        }
                        $.log.error(errmsg);
                        if (ex.javaException !== undefined) {
                            $.consoleLn("Sending stack trace to error log...");
                            Packages.com.gmt2001.Console.err.printStackTrace(ex.javaException, errmsg);
                        } else {
                            try {
                                Packages.com.gmt2001.Console.err.printStackTrace(ex, errmsg);
                            } catch (ex3) {
                            }
                        }
                    }
                }
            }
        }
    }

    /*
     * @function init - Loads everything for the scripts.
     */
    function init() {
        // Do not print a line to the console for each module (script) that is loaded.
        var silentScriptsLoad = Packages.tv.phantombot.PhantomBot.getSilentScriptsLoad().toString().equals('true');

        // Generate JavaScript trampolines for Java functions.
        generateJavaTrampolines();
        // Register events.
        events();

        if (silentScriptsLoad) {
            consoleLn('Loading modules...');
        }

        // Load all core modules.
        loadScript('./core/misc.js', false, silentScriptsLoad);
        loadScript('./core/jsTimers.js', false, silentScriptsLoad);
        loadScript('./core/updates.js', false, silentScriptsLoad);
        loadScript('./core/commandTags.js', false, silentScriptsLoad);
        loadScript('./core/chatModerator.js', false, silentScriptsLoad);
        loadScript('./core/fileSystem.js', false, silentScriptsLoad);
        loadScript('./core/lang.js', false, silentScriptsLoad);
        loadScript('./core/commandPause.js', false, silentScriptsLoad);
        loadScript('./core/logging.js', false, silentScriptsLoad);
        loadScript('./core/commandRegister.js', false, silentScriptsLoad);
        loadScript('./core/whisper.js', false, silentScriptsLoad);
        loadScript('./core/commandCoolDown.js', false, silentScriptsLoad);
        loadScript('./core/keywordCoolDown.js', false, silentScriptsLoad);
        loadScript('./core/patternDetector.js', false, silentScriptsLoad);
        loadScript('./core/permissions.js', false, silentScriptsLoad);

        // Load all the other modules.
        loadScriptRecursive('.', silentScriptsLoad);

        // Load Discord modules if need be.
        if (!$.hasDiscordToken) {
            loadScript('./discord/core/misc.js', false, silentScriptsLoad);
            loadScript('./discord/core/accountLink.js', false, silentScriptsLoad);
            loadScript('./discord/core/patternDetector.js', false, silentScriptsLoad);
            loadScript('./discord/core/moderation.js', false, silentScriptsLoad);
            loadScript('./discord/core/registerCommand.js', false, silentScriptsLoad);
            loadScript('./discord/core/accountLink.js', false, silentScriptsLoad);
            loadScript('./discord/core/commandCooldown.js', false, silentScriptsLoad);

            // Load the other discord modules
            loadScriptRecursive('./discord', silentScriptsLoad);
            // Mark that we are using Discord.
            // This is used by the new panel.
            $.inidb.set('panelData', 'hasDiscord', 'true');
        } else {
            $.inidb.set('panelData', 'hasDiscord', 'false');
        }

        if (silentScriptsLoad) {
            consoleLn('Modules have been loaded.');
        }
        $.log.event('Bot modules loaded. Initializing main functions...');

        // Register custom commands.
        $.addComRegisterCommands();
        $.addComRegisterAliases();

        consoleLn('');

        if ($.isNightly) {
            consoleLn('PhantomBot Nightly Build - No Support is Provided');
            consoleLn('Please report bugs including the date of the Nightly Build and Repo Version to:');
            consoleLn('https://discord.gg/YKvMd78');
        } else if ($.isPrerelease) {
            consoleLn('PhantomBot Pre-Release Build - Please Report Bugs and Issues Found');
            consoleLn('When reporting bugs or issues, please remember to say that this is a pre-release build.');
        } else {
            consoleLn('For support please visit: https://discord.gg/YKvMd78');
        }
        consoleLn('');
    }

    /*
     * @function events - registers all events with the core.
     */
    function events() {
        // Load all API events.

        var loadedHooks = [];
        /*
         * @event ircModeration
         */
        $api.on($script, 'ircModeration', function (event) {
            $.performModeration(event);
        });
        loadedHooks.push('ircModeration');

        /*
         * @event ircChannelUserMode
         */
        $api.on($script, 'ircChannelUserMode', function (event) {
            callHook('ircChannelUserMode', event, false);

            if (event.getUser().equalsIgnoreCase($.botName) && event.getMode().equalsIgnoreCase('O')) {
                if (event.getAdd().toString().equals('true')) {
                    if (isReady === false) {
                        isReady = true;
                        // Bot is now ready.
                        consoleLn($.botName + ' ready!');
                        // Call the initReady event.
                        callHook('initReady', null, false);
                    }
                }
            }
        });
        loadedHooks.push('ircChannelUserMode');

        /*
         * @event command
         */
        $api.on($script, 'command', function (event) {
            var sender = event.getSender(),
                    command = event.getCommand(),
                    args = event.getArgs(),
                    subCommand = $.getSubCommandFromArguments(command, args),
                    isMod = $.isModv3(sender, event.getTags());

            if (isReady === false && command.equalsIgnoreCase($.botName) && args[0].equalsIgnoreCase('moderate')) {
                Packages.tv.phantombot.PhantomBot.instance().getSession().getModerationStatus();
            }

            // Check if the command exists or if the module is disabled.
            if (!$.commandExists(command) || !isModuleEnabled($.getCommandScript(command))) {
                return;
            }

            // Check if the command has an alias.
            if ($.aliasExists(command)) {
                var alias = $.getIniDbString('aliases', command),
                        aliasCommand,
                        aliasArguments,
                        subcmd,
                        parts;

                if (alias.indexOf(';') === -1) {
                    parts = alias.split(' ');
                    aliasCommand = parts.shift();
                    aliasArguments = parts.join(' ');

                    $.command.run(sender, aliasCommand, aliasArguments + ' ' + args.join(' '), event.getTags());
                } else {
                    parts = alias.split(';');

                    for (var i = 0; i < parts.length; i++) {
                        subcmd = parts[i].split(' ');
                        aliasCommand = subcmd.shift();
                        aliasArguments = subcmd.join(' ');

                        $.command.run(sender, aliasCommand, aliasArguments + ' ' + args.join(' '), event.getTags());
                    }
                }
                return;
            }

            // Check the command permission.
            if ($.permCom(sender, command, subCommand, event.getTags()) !== 0) {
                $.sayWithTimeout($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', (!$.subCommandExists(command, subCommand) ? $.getCommandGroupName(command) : $.getSubCommandGroupName(command, subCommand))), $.getIniDbBoolean('settings', 'permComMsgEnabled', false));
                consoleDebug('Command !' + command + ' was not sent due to the user not having permission for it.');
                return;
            }

            // Check the command cost.
            if ($.priceCom(sender, command, subCommand, isMod) === 1) {
                $.sayWithTimeout($.whisperPrefix(sender) + $.lang.get('cmd.needpoints', $.getPointsString($.getCommandPrice(command, subCommand, ''))), $.getIniDbBoolean('settings', 'priceComMsgEnabled', false));
                consoleDebug('Command !' + command + ' was not sent due to the user not having enough points.');
                return;
            }

            // Check the command cooldown.
            var cooldownDuration,
                isGlobalCooldown,
                cooldownCommand = command;

            if (args.length === 1 && $.coolDown.exists(cooldownCommand + ' ' + args[0])) {
                cooldownCommand += ' ' + args[0];
            }
            if (args.length > 1 && $.coolDown.exists(cooldownCommand + ' ' + args[1])) {
                cooldownCommand += ' ' + args[1];
            } 

            [cooldownDuration, isGlobalCooldown] = $.coolDown.get(cooldownCommand, sender, isMod);

            if (cooldownDuration > 0) {
                consoleDebug('Command ! ' + command + ' was not sent due to it being on cooldown ' + (isGlobalCooldown ? 'globally' : 'for user' + sender) + '.');
                if ($.getIniDbBoolean('settings', 'coolDownMsgEnabled')) {
                    if (isGlobalCooldown) {
                        $.sayWithTimeout($.whisperPrefix(sender) + $.lang.get('init.cooldown.msg.global', command, cooldownDuration), true);
                        
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.cooldown.msg.user', command, cooldownDuration));
                    }
                }
                return;
            }

            // Call the command function.
            callHook('command', event, false);

            // Decrease or add points after the command is sent to not slow anything down.
            if ($.priceCom(sender, command, subCommand, isMod) === 0) {
                $.inidb.decr('points', sender, $.getCommandPrice(command, subCommand, ''));
            }

            if ($.payCom(command) === 0) {
                $.inidb.incr('points', sender, $.getCommandPay(command));
            }
        });
        loadedHooks.push('command');

        /*
         * @event discordChannelCommand
         */
        $api.on($script, 'discordChannelCommand', function (event) {
            var username = event.getUsername(),
                    command = event.getCommand(),
                    user = event.getDiscordUser(),
                    channelName = event.getChannel(),
                    channelId = event.getChannelId(),
                    isAdmin = event.isAdmin(),
                    senderId = event.getSenderId(),
                    args = event.getArgs();

            if ($.discord.commandExists(command) === false && ($.discord.aliasExists(command) === false || $.discord.aliasExists(command) === true && $.discord.commandExists($.discord.getCommandAlias(command)) === false)) {
                return;
            }

            if ($.discord.aliasExists(command) === true) {
                command = event.setCommand($.discord.getCommandAlias(command));
            }

            // Check permissions.
            var perm = $.discord.permCom(command, (args[0] !== undefined && $.discord.subCommandExists(command, args[0].toLowerCase()) ? args[0].toLowerCase() : ''));
            var hasPerms = false;

            // If more permissions are added, we'll have to use a loop here.
            if (perm.permissions.length > 0 && perm.permissions[0].selected.equals('true') && isAdmin == true) {
                hasPerms = true;
            } else if (perm.roles.length > 0 && (perm.roles[0].indexOf('0') !== -1 || perm.roles[0].indexOf($.discordAPI.getGuild().getId().asString()) !== -1)) {
                hasPerms = true;
            } else {
                for (var i = 0; i < perm.roles.length; i++) {
                    if (user.getRoleIds().contains($.discordAPI.getRoleByID(perm.roles[i]).getId()) == true) {
                        hasPerms = true;
                        break;
                    }
                }
            }

            // No permissions, return.
            if (!hasPerms) {
                return;
            }

            // Check the command cooldown.
            var cooldownDuration,
                isGlobalCooldown,
                cooldownCommand = command;

            if (args.length === 1 && $.discord.cooldown.exists(cooldownCommand + ' ' + args[0])) {
                cooldownCommand += ' ' + args[0];
            }
            if (args.length > 1 && $.discord.cooldown.exists(cooldownCommand + ' ' + args[1])) {
                cooldownCommand += ' ' + args[1];
            } 

            [cooldownDuration, isGlobalCooldown] = $.discord.cooldown.get(cooldownCommand, senderId);

            if (isAdmin === false && cooldownDuration > 0) {
                if ($.getIniDbBoolean('discordCooldownSettings', 'coolDownMsgEnabled')) {
                    consoleDebug('Discord command ! ' + command + ' was not sent due to it being on cooldown ' + (isGlobalCooldown ? 'globally' : 'for user' + username) + '.');
                    if (isGlobalCooldown) {
                        $.discord.say(channelId, $.discord.userPrefix(username) + $.lang.get('init.cooldown.msg.global', command, cooldownDuration));
                    } else {
                        $.discord.say(channelId, $.discord.userPrefix(username) + $.lang.get('init.cooldown.msg.user', command, cooldownDuration));
                    }
                }
                return;
            }

            if ($.discord.getCommandCost(command) > 0 && $.discord.getUserPoints(senderId) < $.discord.getCommandCost(command)) {
                return;
            }

            if (!$.discord.getCommandChannelAllowed(command, channelName, channelId)) {
                $.consoleLn('[Discord] Not processing command ' + command + ' due to !channelcom');
                return;
            }

            callHook('discordChannelCommand', event, false);

            // Do this last to not slow down the command hook.
            if ($.discord.getCommandCost(command) > 0) {
                $.discord.decrUserPoints(senderId, $.discord.getCommandCost(command));
            }
        });
        loadedHooks.push('discordChannelCommand');

        /*
         * @event discordGuildCreate
         */
        $api.on($script, 'discordGuildCreate', function (event) {
            var roles = $.discordAPI.getGuildRoles();
            var perms = {
                roles: []
            };

            for (var i = 0; i < roles.size(); i++) {
                perms.roles.push({
                    'name': roles.get(i).getName() + '',
                    '_id': roles.get(i).getId().asString() + '',
                    'selected': 'false'
                });
            }

            $.inidb.set('discordPermsObj', 'obj', JSON.stringify(perms));

            callHook('discordGuildCreate', event, false);
        });
        loadedHooks.push('discordGuildCreate');

        var hookNames = $api.getEventNames();
        for (var i = 0; i < hookNames.size(); i++) {
            var hookName = String(hookNames.get(i) + '');
            if (!loadedHooks.includes(hookName)) {
                $api.on($script, hookName, function (event) {
                    var hookname = String($api.formatEventName(event.getClass().getSimpleName()) + '');
                    callHook(hookname, event, false);
                });
                loadedHooks.push(hookName);
            }
        }
    }

    // Export functions to API
    $.consoleLn = consoleLn;
    $.consoleDebug = consoleDebug;
    $.bind = addHook;
    $.unbind = removeHook;
    $.bot = {
        loadScriptRecursive: loadScriptRecursive,
        isModuleEnabled: isModuleEnabled,
        isModuleLoaded: isModuleLoaded,
        getHookIndex: getHookIndex,
        loadScript: loadScript,
        getModule: getModule,
        getHook: getHook,
        modules: modules,
        hooks: hooks
    };

    // Load init.js
    init();
})();
