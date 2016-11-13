/**
 * init.js
 *
 * Initialize the bot (loadscripts, register commands and modules etc.)
 * Use the $ API
 * Use the $.bot API
 *
 * use "$.bind('initReady', FUNCTION);" to execute code after loading all scripts (like registering commands)
 */
(function() {
    var connected = false,
        modeO = false,
        modules = [],
        hooks = [],
        lastRecon = 0,
        pricecomMods = ($.inidb.exists('settings', 'pricecomMods') && $.inidb.get('settings', 'pricecomMods').equals('true') ? true : false),
        coolDownMsgEnabled = ($.inidb.exists('settings', 'coolDownMsgEnabled') && $.inidb.get('settings', 'coolDownMsgEnabled').equals('true') ? true : false),
        permComMsgEnabled = ($.inidb.exists('settings', 'permComMsgEnabled') && $.inidb.get('settings', 'permComMsgEnabled').equals('true') ? true : false);

    /* Make these null to start */
    $.session = null;
    $.channel = null;

    /* Reloads the init vars */
    function reloadInit() {
        pricecomMods = ($.inidb.exists('settings', 'pricecomMods') && $.inidb.get('settings', 'pricecomMods').equals('true') ? true : false);
        coolDownMsgEnabled = ($.inidb.exists('settings', 'coolDownMsgEnabled') && $.inidb.get('settings', 'coolDownMsgEnabled').equals('true') ? true : false);
        permComMsgEnabled = ($.inidb.exists('settings', 'permComMsgEnabled') && $.inidb.get('settings', 'permComMsgEnabled').equals('true') ? true : false);
    }

    /**
     * @class
     * @param {string} scriptFile
     * @param {string} script
     * @param {string} enabled
     */
    function Module(scriptFile, script, enabled) {
        this.scriptFile = scriptFile;
        this.script = script;
        this.enabled = enabled;

        if (scriptFile.indexOf('./core/') > -1) {
            this.enabled = true;
        }

        this.getModuleName = function() {
            return this.scriptFile.replace(/([a-z]+)\.js$/i, '$1');
        }
    }

    /**
     * @class
     * @param {string} scriptFile
     * @param {string} hook
     * @param {Function} handler
     */
    function Hook(scriptFile, hook, handler) {
        this.scriptFile = scriptFile;
        this.hook = hook;
        this.handler = handler;
    }

    /**
     * @function consoleLn
     * @export $
     * @param {string} message
     */
    function consoleLn(message) {
        Packages.com.gmt2001.Console.out.println(java.util.Objects.toString(message));
    };

    /**
     * @function consoleDebug
     * @export $
     * @param {string} message
     */
    function consoleDebug(message) {
        if (Packages.me.mast3rplan.phantombot.PhantomBot.enableDebugging) {
            try {
                throw new Error('debug');
            } catch (e) {
                var stackData = e.stack.split('\n')[1];
                Packages.com.gmt2001.Console.debug.printlnRhino(java.util.Objects.toString('[' + stackData + '] ' + message));
            }
        }
    };

    /**
     * @function generateJavaTrampolines
     */
    function generateJavaTrampolines() {
        var name,
            isJavaProperty = function(name) {
                var blacklist = ['getClass', 'equals', 'notify', 'class', 'hashCode', 'toString', 'wait', 'notifyAll'],
                    i;
                for (i in blacklist) {
                    if (blacklist[i] == name) {
                        return true;
                    }
                }
                return false;
            },
            generateTrampoline = function(obj, name) {
                return function() {
                    var args = [$script];
                    for (var i = 0; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }
                    obj[name].save(obj, args);
                };
            };

        for (name in $api) {
            if (isJavaProperty(name)) {
                continue;
            }
            if (typeof $api[name] == 'function') {
                $[name] = generateTrampoline($api, name);
            } else {
                $[name] = $api[name];
            }
        }
    }

    /**
     * @function loadScript
     * @export $.bot
     * @param {string} scriptFile
     * @param {boolean} [force]
     * @param {boolean} [silent]
     */
    function loadScript(scriptFile, force, silent) {
        if (!isModuleLoaded(scriptFile) || force) {

            if (!scriptFile.endsWith(".js")) {
                return;
            }

            try {
                var script = $api.loadScriptR($script, scriptFile),
                    enabled;

                if (!$.inidb.exists('modules', scriptFile)) {
                    enabled = true;
                    $.setIniDbBoolean('modules', scriptFile, enabled);
                } else {
                    enabled = $.getIniDbBoolean('modules', scriptFile);
                }

                modules.push(new Module(scriptFile, script, enabled));
                if (!silent) {
                    consoleLn('Loaded module: ' + scriptFile.replace(/\.\//g, '') + ' (' + (enabled ? 'Enabled' : 'Disabled') + ')');
                }
            } catch (e) {
                consoleLn('Failed loading "' + scriptFile + '": ' + e);
                if (isModuleLoaded('./core/logging.js')) {
                    $.log.error('(loadScript, ' + scriptFile + ') ' + e);
                }
            }
        }
    };

    /**
     * @function loadScriptRecursive
     * @export $.bot
     * @param {string} path
     * @param {boolean} [silent]
     */
    function loadScriptRecursive(path, silent) {
        if (path.substring($.strlen(path) - 1).equalsIgnoreCase('/')) {
            path = path.substring(0, $.strlen(path) - 1);
        }
        var list = $.findFiles('./scripts/' + path, ''),
            i;
        for (i = 0; i < list.length; i++) {
            if (path.equalsIgnoreCase('.')) {
                if (list[i].equalsIgnoreCase('util') || list[i].equalsIgnoreCase('lang') || list[i].equalsIgnoreCase('init.js') || list[i].equalsIgnoreCase('dev')) {
                    continue;
                }
            }
            if ($.isDirectory('./scripts/' + path + '/' + list[i])) {
                loadScriptRecursive(path + '/' + list[i], silent);
            } else {
                loadScript(path + '/' + list[i], false, silent);
            }
        }
    };

    /**
     * @function getModuleIndex
     * @param {string} scriptFile
     * @returns {Number}
     */
    function getModuleIndex(scriptFile) {
        var i;
        for (i in modules) {
            if (modules[i].scriptFile.equalsIgnoreCase(scriptFile)) {
                return i;
            }
        }
        return -1;
    };

    /**
     * @function isModuleEnabled
     * @export $.bot
     * @param {string} scriptFile
     * @returns {boolean}
     */
    function isModuleEnabled(scriptFile) {
        var i = getModuleIndex(scriptFile);
        if (i > -1) {
            return modules[i].enabled;
        }
        return false;
    };

    /**
     * @function isModuleLoaded
     * @export $.bot
     * @param {string} scriptFile
     * @returns {boolean}
     */
    function isModuleLoaded(scriptFile) {
        return (getModuleIndex(scriptFile) > -1);
    };

    /**
     * @function getModule
     * @param {string} scriptFile
     * @returns {Module}
     */
    function getModule(scriptFile) {
        var i = getModuleIndex(scriptFile);
        if (i > -1) {
            return modules[i];
        }
        return null;
    };

    /**
     * @function getHookIndex
     * @param {string} scriptFile
     * @param {string} hook
     * @returns {Number}
     */
    function getHookIndex(scriptFile, hook) {
        var i;
        for (i in hooks) {
            if (hooks[i].scriptFile.equalsIgnoreCase(scriptFile) && hooks[i].hook.equalsIgnoreCase(hook)) {
                return i;
            }
        }
        return -1;
    };

    /**
     * @function addHook
     * @export $ as bind
     * @param {string} hook
     * @param {Function} handler
     */
    function addHook(hook, handler) {
        var scriptFile = $script.getPath().replace('\\', '/').replace('./scripts/', ''),
            i = getHookIndex(scriptFile, hook);
        if (i > -1) {
            hooks[i].handler = handler;
        } else {
            hooks.push(new Hook(scriptFile, hook, handler));
        }
    };

    /**
     * @function removeHook
     * @export $ as unbind
     * @param {string} hook
     */
    function removeHook(hook) {
        var scriptFile = $script.getPath().replace('\\', '/').replace('./scripts/', ''),
            i = getHookIndex(scriptFile, hook);
        if (i > -1) {
            hooks.splice(i, 1);
        }
    };

    /**
     * @function callHook
     * @param {string} hook
     * @param {Object} event
     * @param {boolean} [alwaysRun]
     */
    function callHook(hook, event, alwaysRun) {
        var i;

        // Lookup the JS file that contains the command, this removes the need to cycle through all files.
        if (hook == 'command') {
            var i = getHookIndex(getCommandScript(event.getCommand()), hook);
            if (i == -1) // Do not handle init.js commands here.
                return;
            if (isModuleEnabled(hooks[i].scriptFile) || alwaysRun) {
                try {
                    hooks[i].handler(event);
                } catch (e) {
                    $.log.error('(hook.call, ' + hook + ', ' + hooks[i].scriptFile + ') ' + e);
                }
            }
        } else {
            for (i in hooks) {
                if (hooks[i].hook.equalsIgnoreCase(hook) && (isModuleEnabled(hooks[i].scriptFile) || alwaysRun)) {
                    try {
                        hooks[i].handler(event);
                    } catch (e) {
                        $.log.error('(hook.call, ' + hook + ', ' + hooks[i].scriptFile + ') ' + e);
                    }
                }
            }
        }
    };


    /**
     * @function handleInitCommands
     * @param event
     */
    function handleInitCommands(event) {
        var sender = event.getSender().toLowerCase(),
            username = $.username.resolve(sender, event.getTags()),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2],
            pointsRelatedModules = [],
            temp,
            index;

        /**
         * @commandpath YourBotName reconnect - Makes the bot reconnect to Twitches servers.
         * @commandpath YourBotName disconnect - Makes the bot leave your channel and disconnects it from Twitch.
         * @commandpath YourBotName moderate - Trys to detect the bots moderator status. This is useful if you unmod and remod the bot while its on.
         * @commandpath YourBotName connectmessage [message] - Sets a message that will be said when the bot joins the channel.
         * @commandpath YourBotName removeconnectmessage - Removes the connect message if one has been set.
         * @commandpath YourBotName blacklist [add / remove] [username] - Adds or Removes a user from the bot blacklist.
         * @commandpath YourBotName togglepricecommods - Toggles if mods pay for commands.
         * @commandpath YourBotName togglepermcommessage - Toggles the no permission message.
         * @commandpath YourBotName togglecooldownmessage - Toggles the on command cooldown message.
         */
         if (command.equalsIgnoreCase($.botName.toLowerCase())) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.usage', $.botName.toLowerCase()));
                return;
            }

            if (action.equalsIgnoreCase('rejoin') || action.equalsIgnoreCase('reconnect')) {
                /* Added a cooldown to this so people can spam it and cause errors. */
                if (lastRecon + 10000 >= $.systemTime()) {
                    return;
                }

                lastRecon = $.systemTime();
                $.say($.whisperPrefix(sender) + $.lang.get('init.reconnect', 'irc-ws.chat.twitch.tv'));
                $.log.event(username + ' requested a reconnect!');
                setTimeout(function () { $.session.close(); }, 100);
                setTimeout(function () { $.say($.whisperPrefix(sender) + $.getIniDbString('settings', 'connectedMsg', $.botName + ' successfully rejoined!')) }, 5000);
                return;
            }

            if (action.equalsIgnoreCase('disconnect') || action.equalsIgnoreCase('remove')) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.disconnect', 'irc-ws.chat.twitch.tv'));
                $.log.event(username + ' removed the bot from chat!');
                setTimeout(function () { java.lang.System.exit(0); }, 100);
                return;
            }

            if (action.equalsIgnoreCase('moderate')) {
                /* Have a cooldown here because saySilent does not go through the core cooldown. */
                if (lastRecon + 9000 >= $.systemTime()) {
                   return;
                }
                lastRecon = $.systemTime();
                $.session.saySilent('.mods');
                $.consoleLn('[INFO] Trying to detect moderator status for ' + $.botName + '.');
                return;
            }

            if (action.equalsIgnoreCase('connectmessage') || action.equalsIgnoreCase('setconnectmessage')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.connected.msg.usage', $.botName.toLowerCase()));
                    return;
                }

                var msg = argsString.replace(action, '').trim();
                $.inidb.set('settings', 'connectedMsg', msg);
                $.say($.whisperPrefix(sender) + $.lang.get('init.connected.msg', msg));
                $.log.event(sender + ' set a connect message!');
                return;
            }

            if (action.equalsIgnoreCase('removeconnectmessage')) {
                $.inidb.del('settings', 'connectedMsg');
                $.say($.whisperPrefix(sender) + $.lang.get('init.connected.msg.removed'));
                $.log.event(sender + ' removed the connect message!');
                return;
            }

            if (action.equalsIgnoreCase('blacklist')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.blacklist.usage', $.botName.toLowerCase()));
                    return;
                }

                if (subAction.equalsIgnoreCase('add')) {
                    if (!actionArgs) {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.blacklist.add.usage', $.botName.toLowerCase()));
                        return;
                    }

                    $.inidb.set('botBlackList', actionArgs.toLowerCase(), 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('init.blacklist.added', actionArgs));
                    $.log.event(sender + ' added ' + actionArgs + ' to the bot blacklist.');
                }

                if (subAction.equalsIgnoreCase('remove')) {
                    if (!actionArgs) {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.blacklist.remove.usage', $.botName.toLowerCase()));
                        return;
                    } else if (!$.inidb.exists('botBlackList', actionArgs.toLowerCase())) {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.blacklist.err'));
                        return;
                    }

                    $.inidb.del('botBlackList', actionArgs.toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('init.blacklist.removed', actionArgs));
                    $.log.event(sender + ' removed ' + actionArgs + ' to the bot blacklist.');
                }
            }

            if (action.equalsIgnoreCase('togglepricecommods')) {
                if (pricecomMods) {
                    pricecomMods = false;
                    $.inidb.set('settings', 'pricecomMods', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.mod.toggle.off.pay'));
                } else {
                    pricecomMods = true;
                    $.inidb.set('settings', 'pricecomMods', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.mod.toggle.on.pay'));
                }
            }

            if (action.equalsIgnoreCase('togglepermcommessage')) {
                if (permComMsgEnabled) {
                    permComMsgEnabled = false;
                    $.inidb.set('settings', 'permComMsgEnabled', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.mod.toggle.perm.msg.off'));
                } else {
                    permComMsgEnabled = true;
                    $.inidb.set('settings', 'permComMsgEnabled', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.mod.toggle.perm.msg.on'));
                }
            }

            if (action.equalsIgnoreCase('togglecooldownmessage')) {
                if (coolDownMsgEnabled) {
                    coolDownMsgEnabled = false;
                    $.inidb.set('settings', 'coolDownMsgEnabled', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.toggle.cooldown.msg.off'));
                } else {
                    coolDownMsgEnabled = true;
                    $.inidb.set('settings', 'coolDownMsgEnabled', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.toggle.cooldown.msg.on'));
                }
            }
        }

        /* Used for the panel, no command path needed*/
        if (command.equalsIgnoreCase('reconnect')) {
            if (!$.isBot(sender)) {
                return;
            }
            if (lastRecon + 10000 >= $.systemTime()) {
                return;
            }
            lastRecon = $.systemTime();
            $.log.event(username + ' requested a reconnect!');
            $.session.close();
        }

        /* Used for the panel, no command path needed*/
        if (command.equalsIgnoreCase('disconnect')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.log.event(username + ' removed the bot from chat!');
            java.lang.System.exit(0);
        }

        /**
         * @commandpath module - Display the usage for !module
         */
        if (command.equalsIgnoreCase('module')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
                return;
            }

            /**
             * @commandpath module list - List all known modules
             */
            if (action.equalsIgnoreCase('list')) {
                var lstr = '',
                    modulesList = [],
                    totalPages;

                for (index in modules) {
                    if (modules[index].scriptFile.indexOf('./core/') != -1 || modules[index].scriptFile.indexOf('./lang/') != -1) {
                        continue;
                    }
                    modulesList.push(modules[index].scriptFile + (modules[index].enabled ? '' : ' (*)'));
                }
                if (args[1] === undefined) {
                    totalPages = $.paginateArray(modulesList, 'init.module.list', ', ', true, sender, 1);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.list.total', totalPages));
                    return;
                }
                if (!isNaN(args[1])) {
                    totalPages = $.paginateArray(modulesList, 'init.module.list', ', ', true, sender, parseInt(args[1]));
                    return;
                }
            }

            /**
             * @commandpath module enable [./path/module] - Enable a module using the path and name of the module
             */
            if (action.equalsIgnoreCase('enable')) {
                temp = args[1];

                if (!temp) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
                    return;
                }

                if (temp.indexOf('./core/') > -1 || temp.indexOf('./lang/') > -1) {
                    return;
                }

                index = getModuleIndex(temp);

                if (index > -1) {
                    $.log.event(username + ' enabled module "' + modules[index].scriptFile + '"');
                    modules[index].enabled = true;
                    $.setIniDbBoolean('modules', modules[index].scriptFile, true);
                    loadScript(modules[index].scriptFile);

                    var hookIdx = getHookIndex(modules[index].scriptFile, 'initReady');
                    try {
                        if (hookIdx !== -1) {
                            hooks[hookIdx].handler(null);
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.enabled', modules[index].getModuleName()));
                    } catch (e) {
                        $.log.error('Unable to call initReady for enabled module (' + modules[index].scriptFile +'): ' + e);
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.error', modules[index].getModuleName()));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
                }
            }

            /** Used for the panel */
            if (action.equalsIgnoreCase('enablesilent')) {
                temp = args[1];

                if (temp.indexOf('./core/') > -1 || temp.indexOf('./lang/') > -1) {
                    return;
                }

                index = getModuleIndex(temp);

                if (index > -1) {
                    $.log.event(username + ' enabled module "' + modules[index].scriptFile + '"');
                    modules[index].enabled = true;
                    $.setIniDbBoolean('modules', modules[index].scriptFile, true);
                    loadScript(modules[index].scriptFile);

                    var hookIdx = getHookIndex(modules[index].scriptFile, 'initReady');
                    try {
                        if (hookIdx !== -1) {
                            hooks[hookIdx].handler(null);
                        }
                    } catch (e) {
                        $.log.error('Unable to call initReady for enabled module (' + modules[index].scriptFile +'): ' + e);
                    }
                }
            }

            /**
             * @commandpath module disable [./path/module] - Disable a module using the path and name of the module
             */
            if (action.equalsIgnoreCase('disable')) {
                temp = args[1];

                if (!temp) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
                    return;
                }

                if (temp.indexOf('./core/') > -1 || temp.indexOf('./lang/') > -1) {
                    return;
                }

                index = getModuleIndex(temp);

                if (index > -1) {
                    $.log.event(username + ' disabled module "' + modules[index].scriptFile + '"');
                    modules[index].enabled = false;
                    $.setIniDbBoolean('modules', modules[index].scriptFile, false);
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.disabled', modules[index].getModuleName()));

                    if (modules[index].scriptFile == './systems/pointSystem.js') {
                        pointsRelatedModules.push('./games/adventureSystem.js');
                        pointsRelatedModules.push('./games/roll.js');
                        pointsRelatedModules.push('./games/slotMachine.js');
                        pointsRelatedModules.push('./systems/ticketRaffleSystem.js');
                        pointsRelatedModules.push('./systems/raffleSystem.js');

                        for (var i = 0; i < pointsRelatedModules.length; i++) {
                            index = getModuleIndex(pointsRelatedModules[i]);
                            if (index > -1) {
                                $.log.event(username + ' auto-disabled module "' + modules[index].scriptFile + '"');
                                modules[index].enabled = false;
                                $.setIniDbBoolean('modules', modules[index].scriptFile, false);
                            }
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.auto-disabled'));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
                }
            }

            /** Used for the panel */
            if (action.equalsIgnoreCase('disablesilent')) {
                temp = args[1];

                if (temp.indexOf('./core/') > -1 || temp.indexOf('./lang/') > -1) {
                    return;
                }

                index = getModuleIndex(temp);

                if (index > -1) {
                    $.log.event(username + ' disabled module "' + modules[index].scriptFile + '"');
                    modules[index].enabled = false;
                    $.setIniDbBoolean('modules', modules[index].scriptFile, false);

                    if (modules[index].scriptFile == './systems/pointSystem.js') {
                        pointsRelatedModules.push('./games/adventureSystem.js');
                        pointsRelatedModules.push('./games/roll.js');
                        pointsRelatedModules.push('./games/slotMachine.js');
                        pointsRelatedModules.push('./systems/ticketRaffleSystem.js');
                        pointsRelatedModules.push('./systems/raffleSystem.js');

                        for (var i = 0; i < pointsRelatedModules.length; i++) {
                            index = getModuleIndex(pointsRelatedModules[i]);
                            if (index > -1) {
                                $.log.event(username + ' auto-disabled module "' + modules[index].scriptFile + '"');
                                modules[index].enabled = false;
                                $.setIniDbBoolean('modules', modules[index].scriptFile, false);
                            }
                        }
                    }
                }
            }

            /**
             * @commandpath module status [./path/module] - Retrieve the current status (enabled/disabled) of the given module
             */
            if (action.equalsIgnoreCase('status')) {
                temp = args[1];

                if (!temp) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
                    return;
                }

                index = getModuleIndex(temp);

                if (index > 1) {
                    if (modules[index].enabled) {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.check.enabled', modules[index].getModuleName()))
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.check.disabled', modules[index].getModuleName()))
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
                }
            }
        }

        /**
         * @commandpath chat [message] - In the console, can be used to chat as the bot. Also used by the webpanel to communicate with chat
         * @commandpath echo [message] - In the console, can be used to chat as the bot. Also used by the webpanel to communicate with chat
         */
        if (command.equalsIgnoreCase('chat') || command.equalsIgnoreCase('echo')) {
            $.say(event.getArguments());
        }
    }


    /**
     * Load her up!
     */

    function startInit() {
        // Generate JavaScript trampolines for Java functions
        generateJavaTrampolines();

        // Load core scripts
        loadScript('./core/misc.js');
        loadScript('./core/jsTimers.js');
        loadScript('./core/chatModerator.js');
        loadScript('./core/updates.js');
        loadScript('./core/fileSystem.js');
        loadScript('./core/lang.js');
        loadScript('./core/logging.js');
        loadScript('./core/commandRegister.js');
        loadScript('./core/whisper.js');
        loadScript('./core/commandCoolDown.js');
        loadScript('./core/keywordCoolDown.js');
        loadScript('./core/gameMessages.js');
        loadScript('./core/patternDetector.js');
        loadScript('./core/permissions.js');
        loadScript('./core/streamInfo.js');
        loadScript('./core/timeSystem.js');
        loadScript('./core/panelCommands.js');

        $.log.event('Core loaded, initializing bot...');

        // Load all other modules
        loadScriptRecursive('.');

        // Register custom commands and aliases.
        $.addComRegisterCommands();
        $.addComRegisterAliases();

        // Bind all $api events

        /**
         * @event api-ircModeration
         */
        $api.on($script, 'ircModeration', function(event) {
            $.performModeration(event);
        });

        /**
         * @event api-ircChannelMessage
         */
        $api.on($script, 'ircChannelMessage', function(event) {
            if (event.getSender().equalsIgnoreCase('jtv') || event.getSender().equalsIgnoreCase('twitchnotify')) {
                callHook('ircPrivateMessage', event, false);
            } else {
                callHook('ircChannelMessage', event, false);

                if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
                    $.panelDB.updateChatLinesDB(event.getSender().toLowerCase());
                }
            }
        });

        /**
         * @event api-ircJoinComplete
         */
        $api.on($script, 'ircJoinComplete', function(event) {
            connected = true;
            $.channel = event.getChannel();
            $.session = event.getSession();
            connectedMsg = false;
        });

        /**
         * @event api-ircChannelUserMode
         */
        $api.on($script, 'ircChannelUserMode', function(event) {
            callHook('ircChannelUserMode', event, true);
            if (!connected) {
                return;
            }

            if (event.getChannel().getName().equalsIgnoreCase($.channel.getName())) {
                if (event.getUser().equalsIgnoreCase($.botName) && event.getMode().equalsIgnoreCase('o')) {
                    if (event.getAdd().toString().equals('true')) {
                        if (!modeO && !$.inidb.exists('settings', 'connectedMsg')) {
                            consoleLn($.username.resolve($.botName) + ' ready!');
                        } else {
                            if (!modeO && !connectedMsg && $.inidb.exists('settings', 'connectedMsg')) {
                                $.say($.inidb.get('settings', 'connectedMsg'));
                                connectedMsg = true;
                            }
                        }
                        modeO = true;
                    }
                }
            }
        });

        /**
         * @event api-command
         */
        $api.on($script, 'command', function(event) {
            var sender = event.getSender().toLowerCase(),
                command = event.getCommand().toLowerCase(),
                args = event.getArgs(),
                subCommand = (args[0] ? args[0] : ''),
                subCommandAction = (args[1] ? args[1] : ''),
                commandCost = 0,
                isModv3 = $.isModv3(sender, event.getTags());

            if ($.inidb.exists('botBlackList', sender) || ($.commandPause.isPaused() && !isModv3) || !$.commandExists(command)) {
                return;
            }

            if ($.aliasExists(command) !== undefined) {
                var ScriptEventManager = Packages.me.mast3rplan.phantombot.script.ScriptEventManager,
                    CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent,
                    alias = $.getIniDbString('aliases', command),
                    aliasCmd,
                    aliasParams;

                if (alias.indexOf(';') === -1) {
                    aliasCmd = alias.split(' ')[0];
                    if (alias.split(' ').length > 1) {
                        aliasParams = alias.substring(alias.indexOf(' ') + 1);
                    } else {
                        aliasParams = ' ';
                    }
                    ScriptEventManager.instance().runDirect(new CommandEvent(sender, aliasCmd, aliasParams + ' ' + args.join(' ')));
                } else {
                    var aliasList = alias.split(';');
                    for (var idx in aliasList) {
                        aliasCmd = aliasList[idx].split(' ')[0];
                        if (aliasList[idx].split(' ').length > 1) {
                            aliasParams = aliasList[idx].substring(aliasList[idx].indexOf(' ') + 1);
                        } else {
                            aliasParams = ' ';
                        }
                        if (idx == (aliasList.length - 1)) {
                            ScriptEventManager.instance().runDirect(new CommandEvent(sender, aliasCmd, aliasParams + ' ' + args.join(' ')));
                        } else {
                            ScriptEventManager.instance().runDirect(new CommandEvent(sender, aliasCmd, aliasParams));
                        }
                    }
                }
                return;
            }

            if ($.coolDown.get(command, sender, isModv3) > 0) {
                if (coolDownMsgEnabled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.cooldown.msg', command, Math.floor($.coolDown.get(command, sender) / 1000)));
                }
                return;
            }

            if ($.permCom(sender, command, subCommand) !== 0) {
                if (permComMsgEnabled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', (!$.subCommandExists(command, subCommand) ? $.getCommandGroupName(command).toLowerCase() : $.getSubCommandGroupName(command, subCommand).toLowerCase())));
                }
                return;
            }

            if (($.inidb.exists('pricecom', command) || $.inidb.exists('pricecom', command + ' ' + subCommand) || $.inidb.exists('pricecom', (command + ' ' + subCommand + ' ' + subCommandAction)))) {
                if ((((isModv3 && pricecomMods && !$.isBot(sender)) || !isModv3))) {
                    if (isModuleEnabled('./systems/pointSystem.js')) {
                        commandCost = $.getCommandPrice(command, subCommand, subCommandAction);
                        if ($.getUserPoints(sender) < commandCost) {
                            $.say($.whisperPrefix(sender) + $.lang.get('cmd.needpoints', $.getPointsString(commandCost)));
                            return;
                        }
                    }
                }
            }

            callHook('command', event, false);

            if (isModuleEnabled('./systems/pointSystem.js')) {
                if (parseInt($.inidb.get('paycom', command)) > 0) {
                    $.inidb.incr('points', sender, $.inidb.get('paycom', command));
                }
                if (commandCost > 0 && (((isModv3 && pricecomMods && !$.isBot(sender)) || !isModv3))) {
                    $.inidb.decr('points', sender, commandCost);
                }
            }
            handleInitCommands(event);
        });

        /**
         * @event api-consoleInput
         */
        $api.on($script, 'consoleInput', function(event) {
            callHook('consoleInput', event, true);
        });

        /**
         * @event api-twitchFollow
         */
        $api.on($script, 'twitchFollow', function(event) {
            callHook('twitchFollow', event, true);
        });

        /**
         * @event api-twitchUnFollow
         */
        $api.on($script, 'twitchUnfollow', function(event) {
            callHook('twitchUnfollow', event, true);
        });

        /**
         * @event api-twitchFollowsInitialized
         */
        $api.on($script, 'twitchFollowsInitialized', function(event) {
            callHook('twitchFollowsInitialized', event, true);
        });

        /**
         * @event api-twitchHosted
         */
        $api.on($script, 'twitchHosted', function(event) {
            callHook('twitchHosted', event, true);
        });

        /**
         * @event api-twitchUnhosted
         */
        $api.on($script, 'twitchUnhosted', function(event) {
            callHook('twitchUnhosted', event, true);
        });

        /**
         * @event api-twitchHostsInitialized
         */
        $api.on($script, 'twitchHostsInitialized', function(event) {
            callHook('twitchHostsInitialized', event, true);
        });

        /**
         * @event api-twitchSubscribe
         */
        $api.on($script, 'twitchSubscribe', function(event) {
            callHook('twitchSubscribe', event, true);
        });

        /**
         * @event api-twitchUnsubscribe
         */
        $api.on($script, 'twitchUnsubscribe', function(event) {
            callHook('twitchUnsubscribe', event, true);
        });

        /**
         * @event api-twitchSubscribesInitialized
         */
        $api.on($script, 'twitchSubscribesInitialized', function(event) {
            callHook('twitchSubscribesInitialized', event, true);
        });

        /**
         * @event api-ircChannelJoin
         */
        $api.on($script, 'ircChannelJoin', function(event) {
            callHook('ircChannelJoin', event, true);
        });

        /**
         * @event api-ircChannelLeave
         */
        $api.on($script, 'ircChannelLeave', function(event) {
            callHook('ircChannelLeave', event, true);
        });

        /**
         * @event api-ircConnectComplete
         */
        $api.on($script, 'ircConnectComplete', function(event) {
            callHook('ircConnectComplete', event, true);
        });

        /**
         * @event api-ircJoinComplete
         */
        $api.on($script, 'ircJoinComplete', function(event) {
            callHook('ircJoinComplete', event, true);
        });

        /**
         * @event api-ircPrivateMessage
         */
        $api.on($script, 'ircPrivateMessage', function(event) {
            callHook('ircPrivateMessage', event, false);
        });

        /**
         * @event api-ircClearchat
         */
        $api.on($script, 'ircClearchat', function(event) {
            callHook('ircClearchat', event, false);
        });

        /**
         * @event api-musicPlayerConnect
         */
        $api.on($script, 'musicPlayerConnect', function(event) {
            callHook('musicPlayerConnect', event, false);
        });

        /**
         * @event api-musicPlayerCurrentId
         */
        $api.on($script, 'musicPlayerCurrentId', function(event) {
            callHook('musicPlayerCurrentId', event, false);
        });

        /**
         * @event api-musicPlayerCurrentVolume
         */
        $api.on($script, 'musicPlayerCurrentVolume', function(event) {
            callHook('musicPlayerCurrentVolume', event, false);
        });

        /**
         * @event api-musicPlayerDisconnect
         */
        $api.on($script, 'musicPlayerDisconnect', function(event) {
            callHook('musicPlayerDisconnect', event, false);
        });

        /**
         * @event api-musicPlayerState
         */
        $api.on($script, 'musicPlayerState', function(event) {
            callHook('musicPlayerState', event, false);
        });

        /**
         * @event api-twitchAlertsDonation
         */
        $api.on($script, 'twitchAlertsDonation', function(event) {
            callHook('twitchAlertsDonation', event, true);
        });

        /**
         * @event api-twitchAlertsDonationInitialized
         */
        $api.on($script, 'twitchAlertsDonationInitialized', function(event) {
            callHook('twitchAlertsDonationInitialized', event, true);
        });

        /**
         * @event api-streamTipDonation
         */
        $api.on($script, 'streamTipDonation', function(event) {
            callHook('streamTipDonation', event, true);
        });

        /**
         * @event api-streamTipDonationInitialized
         */
        $api.on($script, 'streamTipDonationInitialized', function(event) {
            callHook('streamTipDonationInitialized', event, true);
        });

        /**
         * @event api-getEmotes
         */
        $api.on($script, 'emotesGet', function(event) {
            callHook('emotesGet', event, true);
        });

        /**
         * @event api-ircChannelJoinUpdate
         */
        $api.on($script, 'ircChannelJoinUpdate', function(event) {
            callHook('ircChannelJoinUpdate', event, true);
        });

        /**
         * @event api-yTPlayerConnect
         */
        $api.on($script, 'yTPlayerConnect', function(event) {
            callHook('yTPlayerConnect', event, false);
        });

        /**
         * @event api-yTPlayerDisconnect
         */
        $api.on($script, 'yTPlayerDisconnect', function(event) {
            callHook('yTPlayerDisconnect', event, false);
        });

        /**
         * @event api-yTPlayerState
         */
        $api.on($script, 'yTPlayerState', function(event) {
            callHook('yTPlayerState', event, false);
        });

        /**
         * @event api-yTPlayeCurrentId
         */
        $api.on($script, 'yTPlayerCurrentId', function(event) {
            callHook('yTPlayerCurrentId', event, false);
        });

        /**
         * @event api-yTPlayerRequestSonglist
         */
        $api.on($script, 'yTPlayerRequestSonglist', function(event) {
            callHook('yTPlayerRequestSonglist', event, false);
        });

        /**
         * @event api-yTPlayerRequestPlaylist
         */
        $api.on($script, 'yTPlayerRequestPlaylist', function(event) {
            callHook('yTPlayerRequestPlaylist', event, false);
        });

        /**
         * @event api-yTPlayerDeleteSREvent
         */
        $api.on($script, 'yTPlayerDeleteSR', function(event) {
            callHook('yTPlayerDeleteSR', event, false);
        });

        /**
         * @event api-yTPlayerVolumeEvent
         */
        $api.on($script, 'yTPlayerVolume', function(event) {
            callHook('yTPlayerVolume', event, false);
        });

        /**
         * @event api-yTPlayerSkipSongEvent
         */
        $api.on($script, 'yTPlayerSkipSong', function(event) {
            callHook('yTPlayerSkipSong', event, false);
        });

        /**
         * @event api-yTPlayerStealSongEvent
         */
        $api.on($script, 'yTPlayerStealSong', function(event) {
            callHook('yTPlayerStealSong', event, false);
        });

        /**
         * @event api-YTPlayerSongRequestEvent
         */
        $api.on($script, 'yTPlayerSongRequest', function(event) {
            callHook('yTPlayerSongRequest', event, false);
        });

        /**
         * @event api-yTPlayerDeletePlaylistByIDEvent
         */
        $api.on($script, 'yTPlayerDeletePlaylistByID', function(event) {
            callHook('yTPlayerDeletePlaylistByID', event, false);
        });

        /**
         * @event api-yTPlayerRequestCurrentSongEvent
         */
        $api.on($script, 'yTPlayerRequestCurrentSong', function(event) {
            callHook('yTPlayerRequestCurrentSong', event, false);
        });

        /**
         * @event api-yTPlayerRandomizeEvent
         */
        $api.on($script, 'yTPlayerRandomize', function(event) {
            callHook('yTPlayerRandomize', event, false);
        });

        /**
         * @event api-gameWispChangeEvent
         */
        $api.on($script, 'gameWispChange', function(event) {
            callHook('gameWispChange', event, false);
        });

        /**
         * @event api-gameWispBenefitsEvent
         */
        $api.on($script, 'gameWispBenefits', function(event) {
            callHook('gameWispBenefits', event, false);
        });

        /**
         * @event api-gameWispSubscribeEvent
         */
        $api.on($script, 'gameWispSubscribe', function(event) {
            callHook('gameWispSubscribe', event, false);
        });

        /**
         * @event api-gameWispAnniversaryEvent
         */
        $api.on($script, 'gameWispAnniversary', function(event) {
            callHook('gameWispAnniversary', event, false);
        }); 

        /**
         * @event api-twitterEvent
         */
        $api.on($script, 'twitter', function(event) {
            callHook('twitter', event, false);
        });

        /**
         * @event api-twitchOnlineEvent
         */
        $api.on($script, 'twitchOnline', function(event) {
            callHook('twitchOnline', event, false);
        });

        /**
         * @event api-twitchOfflineEvent
         */
        $api.on($script, 'twitchOffline', function(event) {
            callHook('twitchOffline', event, false);
        });

        /**
         * @event api-twitchGameChangeEvent
         */
        $api.on($script, 'twitchGameChange', function(event) {
            callHook('twitchGameChange', event, false);
        });

        /**
         * @event api-NewSubscriberEvent
         */
        $api.on($script, 'NewSubscriber', function(event) {
            callHook('NewSubscriber', event, false);
        });

        /**
         * @event api-NewReSubscriberEvent
         */
        $api.on($script, 'NewReSubscriber', function(event) {
            callHook('NewReSubscriber', event, false);
        });

        /**
         * @event api-BitsEvent
         */
        $api.on($script, 'Bits', function(event) {
            callHook('Bits', event, false);
        });

        /**
         * @event api-DeveloperCommandEvent
         */
        $api.on($script, 'DeveloperCommand', function(event) {
            callHook('command', event, false);
            handleInitCommands(event);
        });

        /**
         * @event api-DiscordEvent
         */
        $api.on($script, 'discord', function(event) {
            callHook('discord', event, false);
        });

        $.log.event('init.js api\'s loaded.');
        consoleDebug('init.js api\'s loaded.');
        consoleLn('');

        /**
         * @event initReady
         */
        $.registerChatCommand('./init.js', 'chat', 1);
        $.registerChatCommand('./init.js', 'module', 1);
        $.registerChatCommand('./init.js', 'echo', 1);
        $.registerChatCommand('./init.js', 'reconnect', 1);
        $.registerChatCommand('./init.js', 'disconnect', 1);
        $.registerChatCommand('./init.js', $.botName.toLowerCase(), 1);
        $.registerChatSubcommand($.botName.toLowerCase(), 'disconnect', 1);
        $.registerChatSubcommand($.botName.toLowerCase(), 'reconnect', 1);
        $.registerChatSubcommand($.botName.toLowerCase(), 'moderate', 2);

        // emit initReady event
        callHook('initReady', null, true);

        if ($.isNightly) {
            consoleLn('PhantomBot Nightly Build - No Support is Provided');
            consoleLn('Please report bugs including the date of the Nightly Build and Repo Version to:');
            consoleLn('https://community.phantombot.tv/category/23/bug-reports');
        } else {
            consoleLn('For support please visit: https://community.phantombot.tv');
        }
        consoleLn('');
    }

    /** Export functions to API */
    $.consoleLn = consoleLn;
    $.consoleDebug = consoleDebug;
    $.bind = addHook;
    $.unbind = removeHook;
    $.reloadInit = reloadInit;

    $.bot = {
        loadScript: loadScript,
        loadScriptRecursive: loadScriptRecursive,
        isModuleLoaded: isModuleLoaded,
        isModuleEnabled: isModuleEnabled,
        getModule: getModule,
    };

    // Start init
    startInit();
})();
