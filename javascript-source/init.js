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
        hooks = [];

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
        Packages.com.gmt2001.Console.debug.println(java.util.Objects.toString(message));
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
                    $.logError('init.js', 70, '(loadScript, ' + scriptFile + ') ' + e);
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
                    $.logError('init.js', 265, '(hook.call, ' + hook + ', ' + hooks[i].scriptFile + ') ' + e);
                }
            }
        } else {
            for (i in hooks) {
                if (hooks[i].hook.equalsIgnoreCase(hook) && (isModuleEnabled(hooks[i].scriptFile) || alwaysRun)) {
                    try {
                        hooks[i].handler(event);
                    } catch (e) {
                        $.logError('init.js', 274, '(hook.call, ' + hook + ', ' + hooks[i].scriptFile + ') ' + e);
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
            args = event.getArgs(),
            action = args[0],
            pointsRelatedModules = [],
            temp,
            index;

        /**
         * @commandpath reconnect - Tell the bot to reconnect to Twitch chat and the various APIs
         */
        if (command.equalsIgnoreCase('reconnect')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            $.logEvent('init.js', 354, username + ' requested a reconnect!');
            $.connmgr.reconnectSession($.hostname);
            $.say($.lang.get('init.reconnect'));
        }

        /**
         * @commandpath module - Display the usage for !module
         */
        if (command.equalsIgnoreCase('module')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

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
                var lstr = '';
                for (index in modules) {
                    if (modules[index].scriptFile.indexOf('./core/') != -1 || modules[index].scriptFile.indexOf('./lang/') != -1) {
                        continue;
                    }
                    lstr += ' - ';
                    lstr += modules[index].scriptFile + ' (';
                    if (modules[index].enabled) {
                        lstr += 'enabled';
                    } else {
                        lstr += 'disabled';
                    }
                    lstr += ')';
                }
                $.say($.whisperPrefix(sender) + lstr);
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
                    $.logEvent('init.js', 393, username + ' enabled module "' + modules[index].scriptFile + '"');
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
                        $.logError('init.js', 394, 'Unable to call initReady for enabled module (' + modules[index].scriptFile +'): ' + e);
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.error', modules[index].getModuleName()));
                    }

                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
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
                    $.logEvent('init.js', 393, username + ' disabled module "' + modules[index].scriptFile + '"');
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
                                $.logEvent('init.js', 393, username + ' auto-disabled module "' + modules[index].scriptFile + '"');
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
         */
        if (command.equalsIgnoreCase('chat')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }
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
        loadScript('./core/gameMessages.js');
        loadScript('./core/patternDetector.js');
        loadScript('./core/permissions.js');
        loadScript('./core/streamInfo.js');
        loadScript('./core/timeSystem.js');

        $.logEvent('init.js', 285, 'Core loaded, initializing bot...');

        // Load all other modules
        loadScriptRecursive('.');

        // Bind all $api events
        /**
         * @event api-ircChannelMessage
         */
        $api.on($script, 'ircChannelMessage', function(event) {
            consoleLn($.username.resolve(event.getSender().toLowerCase(), event.getTags()) + ': ' + event.getMessage());

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
        });

        /**
         * @event api-ircChannelUserMode
         */
        $api.on($script, 'ircChannelUserMode', function(event) {
            if (!connected) {
                return;
            }
            if (event.getChannel().getName().equalsIgnoreCase($.channel.getName())) {
                if (event.getUser().equalsIgnoreCase($.botName) && event.getMode().equalsIgnoreCase('o')) {
                    if (event.getAdd()) {
                        if (!modeO) {
                            consoleLn($.username.resolve($.botName) + ' ready!');
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
            var sender = event.getSender(),
                args = event.getArgs(),
                origCommand = event.getCommand(),
                command,
                subCommand,
                cooldown,
                permComCheck;

            if (!$.isModv3(sender, event.getTags()) && $.commandPause.isPaused()) {
                consoleDebug($.lang.get('commandpause.isactive'))
                return;
            }

            if ($.inidb.exists('aliases', origCommand)) {
                event.setCommand($.inidb.get('aliases', origCommand));
            }

            command = event.getCommand().toLowerCase();
            if (!$.commandExists(command)) {
                consoleDebug('[ERROR] Command: !' + command + ' does not exists.');
                return;
            }

            if ($.inidb.exists('disabledCommands', command)) {
                if ($.getIniDbBoolean('disabledCommands', command)) {
                    consoleDebug('[DISABLED COMMAND] Command: !' + command + ' was not sent because its disabled.');
                    return;
                }
            }
            
            if (!$.isAdmin(sender)) {
                if (parseInt($.coolDown.get(command, sender)) > 0) {
                    consoleLn('[COOLDOWN] Command: !' + command + ' was not sent because it is still on a cooldown.');
                    return;
                }
            }

            subCommand = (args[0] ? args[0] : '');
            if ((permComCheck = $.permCom(sender, command, subCommand)) != 0) {
                if (permComCheck == 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getCommandGroupName(command)));
                } else {
                    if ($.subCommandExists(command, subCommand)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getSubCommandGroupName(command, subCommand)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getCommandGroupName(command)));
                    }
                }
                return;
            }

            if (isModuleEnabled('./systems/pointSystem.js') && !$.isModv3(sender, event.getTags()) && $.inidb.exists('pricecom', command)) {
                if ($.getUserPoints(sender) < $.getCommandPrice(command)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.needpoints', $.getPointsString($.inidb.get('pricecom', command))));
                    return;
                }
                if (parseInt($.inidb.get('pricecom', command)) > 0) {
                    $.inidb.decr('points', sender, $.inidb.get('pricecom', command));
                }
            }
            callHook('command', event, false);
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
         * @event api-ircChannelUserMode
         */
        $api.on($script, 'ircChannelUserMode', function(event) {
            callHook('ircChannelUserMode', event, true);
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

        $.logEvent('init.js', 553, 'Bot locked & loaded!');
        consoleDebug('Bot locked & loaded!');
        consoleLn('');

        /**
         * @event initReady
         */
        $.registerChatCommand('./init.js', 'chat', 1);
        $.registerChatCommand('./init.js', 'module', 1);
        $.registerChatCommand('./init.js', 'reconnect', 1);

        // emit initReady event
        callHook('initReady', null, true);
    }

    /** Export functions to API */
    $.consoleLn = consoleLn;
    $.consoleDebug = consoleDebug;
    $.bind = addHook;
    $.unbind = removeHook;

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
