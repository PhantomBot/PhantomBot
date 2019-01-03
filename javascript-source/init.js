/*
 * Copyright (C) 2016-2018 phantombot.tv
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
(function() {
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

        this.getModuleName = function() {
            return this.scriptName.match(/((\w+)\.js)$/)[2];
        }
    }

    /*
     * @class Hook
     *
     * @param {String}   scriptName
     * @param {String}   hookName
     * @param {Function} handler
     */
    function Hook(scriptName, hookName, handler) {
        this.scriptName = scriptName;
        this.hookName = hookName;
        this.handler = handler;
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
        if (Packages.tv.phantombot.PhantomBot.enableDebugging) {
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
            isJavaProperty = function(name) {
                var blacklist = ['getClass', 'equals', 'notify', 'class', 'hashCode', 'toString', 'wait', 'notifyAll'];

                return (blacklist[name] !== undefined);
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
                        consoleLn('Modul geladen: ' + scriptName.replace(/\.\//g, '') + ' (' + (enabled ? 'Aktiviert' : 'Deaktiviert') + ')');
                    }
                } catch (ex) {
                    consoleLn('Fehler beim laden "' + scriptName + '": ' + ex);
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
            if (path === '.') {
                if (files[i] == 'core' || files[i] == 'lang' || files[i] == 'discord' || files[i] == 'init.js') {
                    continue;
                }
            } else if (path === './discord') {
                if (files[i] == 'core') {
                    continue;
                }
            }

            if ($.isDirectory('./scripts/' + path + '/' + files[i])) {
                loadScriptRecursive(path + '/' + files[i], silent, (force ? force : false));
            } else {
                loadScript(path + '/' + files[i], (force ? force : false), silent);
            }
        }
    }

    /*
     * @function getModuleIndex
     *
     * @param  {String} scriptName
     * @return {Number}
     */
    function getModuleIndex(scriptName) {
        return modules.indexOf(scriptName);
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
        var scriptName = $script.getPath().replace('\\', '/').replace('./scripts/', ''),
            i = getHookIndex(scriptName, hookName);

        if (hookName !== 'initReady' && $api.exists(hookName) == false) {
            Packages.com.gmt2001.Console.err.printlnRhino('[addHook()@init.js:254] Failed to register hook "' + hookName + '" since there is no such event.');
        } else if (i !== -1) {
            hooks[hookName].handlers[i].handler = handler;
        } else {
            if (hooks[hookName] === undefined) {
                hooks[hookName] = new HookHandler(hookName);
            }
            hooks[hookName].handlers.push(new Hook(scriptName, hookName, handler));
        }
    }

    /*
     * @function hookName
     *
     * @param {String} hookName
     */
    function removeHook(hookName) {
        var scriptName = $script.getPath().replace('\\', '/').replace('./scripts/', ''),
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
                $.log.error('(hook.call, ' + hookName + ', ' + hook.handlers[i].scriptName + ') ' + ex);
            }
        } else {
            for (i in hook.handlers) {
                if (isModuleEnabled(hook.handlers[i].scriptName) || force) {
                    try {
                        hook.handlers[i].handler(event);
                    } catch (ex) {
                        $.log.error('(hook.call, ' + hookName + ', ' + hook.handlers[i].scriptName + ') ' + ex);
                    }
                }
            }
        }
    }

    /*
     * @function init - Loads everything for the scripts.
     */
    function init() {
        // Generate JavaScript trampolines for Java functions.
        generateJavaTrampolines();
        // Register events.
        events();

        // Load all core modules.
        loadScript('./core/misc.js');
        loadScript('./core/jsTimers.js');
        loadScript('./core/updates.js');
        loadScript('./core/chatModerator.js');
        loadScript('./core/fileSystem.js');
        loadScript('./core/lang.js');
        loadScript('./core/commandPause.js');
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
        loadScript('./core/initCommands.js');
        loadScript('./core/panelCommands.js');

        // Load all the other modules.
        loadScriptRecursive('.');

        // Load Discord modules if need be.
        if (!$.hasDiscordToken) {
            loadScript('./discord/core/misc.js');
            loadScript('./discord/core/accountLink.js');
            loadScript('./discord/core/patternDetector.js');
            loadScript('./discord/core/moderation.js');
            loadScript('./discord/core/registerCommand.js');
            loadScript('./discord/core/accountLink.js');
            loadScript('./discord/core/commandCooldown.js');
            loadScript('./discord/core/roleManager.js');

            // Load the other discord modules
            loadScriptRecursive('./discord');
            // Mark that we are using Discord.
            // This is used by the new panel.
            $.inidb.set('panelData', 'hasDiscord', 'true');
        } else {
            $.inidb.set('panelData', 'hasDiscord', 'false');
        }

        // Load new panel handler.
        loadScript('./core/panelHandler.js', false, true);

        $.log.event('Bot Module geladen. Initialisiere Hauptfunktionen...');

        // Register custom commands.
        $.addComRegisterCommands();
        $.addComRegisterAliases();

        consoleLn('');

        if ($.isNightly) {
            consoleLn('PhantomBotDE Nightly Build - Ohne Support.');
            consoleLn('Bitte melden Sie Fehler, einschließlich des Datums des Nightly Builds und der Repo Version, an:');
            consoleLn('https://community.phantombot.tv/t/phantombotde-vollubersetzung-complete-translation/3872');
        } else if ($.isPrerelease) {
            consoleLn('PhantomBot Pre-Release Build - Bitte melden Sie gefundene Fehler und Probleme');
            consoleLn('Wenn Sie Fehler oder Probleme melden, denken Sie bitte daran, zu sagen, dass es sich um einen Pre-Release Build handelt.');
        } else {
            consoleLn('Für Support besuche: https://community.phantombot.tv/t/phantombotde-vollubersetzung-complete-translation/3872');
        }
        consoleLn('');
    }

    /*
     * @function events - registers all events with the core.
     */
    function events() {
        // Load all API events.

        /*
         * @event ircModeration
         */
        $api.on($script, 'ircModeration', function(event) {
            $.performModeration(event);
        });

        /*
         * @event ircChannelMessage
         */
        $api.on($script, 'ircChannelMessage', function(event) {
            callHook('ircChannelMessage', event, false);

            if (isModuleEnabled('./handlers/panelHandler.js')) {
                $.panelDB.updateChatLinesDB(event.getSender());
            }
        });

        /*
         * @event ircChannelUserMode
         */
        $api.on($script, 'ircChannelUserMode', function(event) {
            callHook('ircChannelUserMode', event, false);

            if (event.getUser().equalsIgnoreCase($.botName) && event.getMode().equalsIgnoreCase('O')) {
                if (event.getAdd().toString().equals('true')) {
                    if (isReady === false) {
                        // Bot is now ready.
                        consoleLn($.botName + ' ready!');
                        // Call the initReady event.
                        callHook('initReady', null, false);
                    }
                    isReady = true;
                }
            }
        });

        /*
         * @event command
         */
        $api.on($script, 'command', function(event) {
            var sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                subCommand = $.getSubCommandFromArguments(command, args),
                isMod = $.isModv3(sender, event.getTags());

            // Check if the command exists or if the module is disabled.
            if (!$.commandExists(command) || !isModuleEnabled($.getCommandScript(command))) {
                return;
            } else

            // Check if the command has an alias.
            if ($.aliasExists(command)) {
                var alias = $.getIniDbString('aliases', command),
                    aliasArguments = '';

                if (alias.indexOf(';') === -1) {
                    var parts = alias.split(' ', 2);

                    $.command.run(sender, parts[0], ((parts[1] !== undefined ? parts[1] : '') + ' ' + args.join(' ')), event.getTags());
                } else {
                    var parts = alias.split(';');

                    for (var i = 0; i < parts.length; i++) {
                        command = parts[i].split(' ');

                        $.command.run(sender, command[0], ((command[1] !== undefined ? command[1] : '') + ' ' + args.join(' ')), event.getTags());
                    }
                }
                return;
            } else

            // Check the command permission.
            if ($.permCom(sender, command, subCommand) !== 0) {
                $.sayWithTimeout($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', (!$.subCommandExists(command, subCommand) ? $.getCommandGroupName(command) : $.getSubCommandGroupName(command, subCommand))), $.getIniDbBoolean('settings', 'permComMsgEnabled', false));
                consoleDebug('Befehl !' + command + ' wurde nicht gesendet, da der Nutzer nicht genug Rechte für ihn hat.');
                return;
            } else

            // Check the command cooldown.
            if ($.coolDown.get(command, sender, isMod) !== 0) {
                $.sayWithTimeout($.whisperPrefix(sender) + $.lang.get('init.cooldown.msg', command, $.coolDown.getSecs(sender, command)), $.getIniDbBoolean('settings', 'coolDownMsgEnabled', false));
                consoleDebug('Befehl !' + command + ' wurde nicht gesendet, da er noch in der Abklingzeit ist.');
                return;
            } else

            // Check the command cost.
            if ($.priceCom(sender, command, subCommand, isMod) === 1) {
                $.sayWithTimeout($.whisperPrefix(sender) + $.lang.get('cmd.needpoints', $.getPointsString($.getCommandPrice(command, subCommand, ''))), $.getIniDbBoolean('settings', 'priceComMsgEnabled', false));
                consoleDebug('Befehl !' + command + ' wurde nicht gesendet, da der Nutzer nicht genug Punkte hat.');
                return;
            }

            // Call the command function.
            callHook('command', event, false);

            // Decrease or add points after the command is sent to not slow anything down.
            if ($.priceCom(sender, command, subCommand, isMod) === 0) {
                $.inidb.decr('points', sender, $.getCommandPrice(command, subCommand, ''));
            } else if ($.payCom(command) === 0) {
                $.inidb.incr('points', sender, $.getCommandPay(command));
            }
        });

        /*
         * @event discordChannelCommand
         */
        $api.on($script, 'discordChannelCommand', function(event) {
            var username = event.getUsername(),
                command = event.getCommand(),
                channel = event.getDiscordChannel(),
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

            if (isAdmin == false && $.discord.permCom(command, (args[0] !== undefined && $.discord.subCommandExists(command, args[0].toLowerCase()) ? args[0].toLowerCase() : '')) !== 0) {
                return;
            }

            if (isAdmin == false && $.discord.cooldown.get(command, senderId) !== 0) {
                return;
            }

            if ($.discord.getCommandCost(command) > 0 && $.discord.getUserPoints(senderId) < $.discord.getCommandCost(command)) {
                return;
            }

            if ($.discord.getCommandChannel(command, channel) === undefined && $.discord.getCommandChannel(command, '_default_global_') === undefined) {
                return;
            } else {
                if (($.discord.getCommandChannel(command, channel) !== undefined && (!$.discord.getCommandChannel(command, channel).equalsIgnoreCase(channelName) && !$.discord.getCommandChannel(command, channel).equalsIgnoreCase(channelId))) && $.discord.getCommandChannel(command, '_default_global_') != '') {
                    return;
                }
            }

            callHook('discordChannelCommand', event, false);

            // Do this last to not slow down the command hook.
            if ($.discord.getCommandCost(command) > 0) {
                $.discord.decrUserPoints(senderId, $.discord.getCommandCost(command));
            }
        });

        /*
         * @event consoleInput
         */
        $api.on($script, 'consoleInput', function(event) {
            callHook('consoleInput', event, false);
        });

        /*
         * @event twitchFollow
         */
        $api.on($script, 'twitchFollow', function(event) {
            callHook('twitchFollow', event, false);
        });

        /*
         * @event twitchUnFollow
         */
        $api.on($script, 'twitchUnfollow', function(event) {
            callHook('twitchUnfollow', event, false);
        });

        /*
         * @event twitchFollowsInitialized
         */
        $api.on($script, 'twitchFollowsInitialized', function(event) {
            callHook('twitchFollowsInitialized', event, false);
        });

        /*
         * @event twitchHosted
         */
        $api.on($script, 'twitchHosted', function(event) {
            callHook('twitchHosted', event, false);
        });

        /*
         * @event twitchAutoHosted
         */
        $api.on($script, 'twitchAutoHosted', function(event) {
            callHook('twitchAutoHosted', event, false);
        });

        /*
         * @event twitchHostsInitialized
         */
        $api.on($script, 'twitchHostsInitialized', function(event) {
            callHook('twitchHostsInitialized', event, false);
        });

        /*
         * @event twitchClip
         */
        $api.on($script, 'twitchClip', function(event) {
            callHook('twitchClip', event, false);
        });

        /*
         * @event ircChannelJoin
         */
        $api.on($script, 'ircChannelJoin', function(event) {
            callHook('ircChannelJoin', event, false);
        });

        /*
         * @event ircChannelUsersUpdate
         */
        $api.on($script, 'ircChannelUsersUpdate', function(event) {
            callHook('ircChannelUsersUpdate', event, false);
        });

        /*
         * @event ircChannelLeave
         */
        $api.on($script, 'ircChannelLeave', function(event) {
            callHook('ircChannelLeave', event, false);
        });

        /*
         * @event ircJoinComplete
         */
        $api.on($script, 'ircJoinComplete', function(event) {
            callHook('ircJoinComplete', event, false);
        });

        /*
         * @event ircConnectComplete
         */
        $api.on($script, 'ircConnectComplete', function(event) {
            callHook('ircConnectComplete', event, false);
        });

        /*
         * @event ircPrivateMessage
         */
        $api.on($script, 'ircPrivateMessage', function(event) {
            callHook('ircPrivateMessage', event, false);
        });

        /*
         * @event ircClearchat
         */
        $api.on($script, 'ircClearchat', function(event) {
            callHook('ircClearchat', event, false);
        });

        /*
         * @event streamLabsDonation
         */
        $api.on($script, 'streamLabsDonation', function(event) {
            callHook('streamLabsDonation', event, false);
        });

        /*
         * @event streamLabsDonationInitialized
         */
        $api.on($script, 'streamLabsDonationInitialized', function(event) {
            callHook('streamLabsDonationInitialized', event, false);
        });

        /*
         * @event tipeeeStreamDonationInitialized
         */
        $api.on($script, 'tipeeeStreamDonationInitialized', function(event) {
            callHook('tipeeeStreamDonationInitialized', event, false);
        });

        /*
         * @event tipeeeStreamDonation
         */
        $api.on($script, 'tipeeeStreamDonation', function(event) {
            callHook('tipeeeStreamDonation', event, false);
        });

        /*
         * @event streamElementsDonationInitialized
         */
        $api.on($script, 'streamElementsDonationInitialized', function(event) {
            callHook('streamElementsDonationInitialized', event, false);
        });

        /*
         * @event streamElementsDonation
         */
        $api.on($script, 'streamElementsDonation', function(event) {
            callHook('streamElementsDonation', event, false);
        });

        /*
         * @event getEmotes
         */
        $api.on($script, 'emotesGet', function(event) {
            callHook('emotesGet', event, false);
        });

        /*
         * @event yTPlayerConnect
         */
        $api.on($script, 'yTPlayerConnect', function(event) {
            callHook('yTPlayerConnect', event, false);
        });

        /*
         * @event yTPlayerLoadPlaylistEvent
         */
        $api.on($script, 'yTPlayerLoadPlaylist', function(event) {
            callHook('yTPlayerLoadPlaylist', event, false);
        });

        /*
         * @event yTPlayerDisconnect
         */
        $api.on($script, 'yTPlayerDisconnect', function(event) {
            callHook('yTPlayerDisconnect', event, false);
        });

        /*
         * @event yTPlayerState
         */
        $api.on($script, 'yTPlayerState', function(event) {
            callHook('yTPlayerState', event, false);
        });

        /*
         * @event yTPlayeCurrentId
         */
        $api.on($script, 'yTPlayerCurrentId', function(event) {
            callHook('yTPlayerCurrentId', event, false);
        });

        /*
         * @event yTPlayerRequestSonglist
         */
        $api.on($script, 'yTPlayerRequestSonglist', function(event) {
            callHook('yTPlayerRequestSonglist', event, false);
        });

        /*
         * @event yTPlayerRequestPlaylist
         */
        $api.on($script, 'yTPlayerRequestPlaylist', function(event) {
            callHook('yTPlayerRequestPlaylist', event, false);
        });

        /*
         * @event yTPlayerDeleteSREvent
         */
        $api.on($script, 'yTPlayerDeleteSR', function(event) {
            callHook('yTPlayerDeleteSR', event, false);
        });

        /*
         * @event yTPlayerVolumeEvent
         */
        $api.on($script, 'yTPlayerVolume', function(event) {
            callHook('yTPlayerVolume', event, false);
        });

        /*
         * @event yTPlayerSkipSongEvent
         */
        $api.on($script, 'yTPlayerSkipSong', function(event) {
            callHook('yTPlayerSkipSong', event, false);
        });

        /*
         * @event yTPlayerStealSongEvent
         */
        $api.on($script, 'yTPlayerStealSong', function(event) {
            callHook('yTPlayerStealSong', event, false);
        });

        /*
         * @event yTPlayerSongRequestEvent
         */
        $api.on($script, 'yTPlayerSongRequest', function(event) {
            callHook('yTPlayerSongRequest', event, false);
        });

        /*
         * @event yTPlayerDeletePlaylistByIDEvent
         */
        $api.on($script, 'yTPlayerDeletePlaylistByID', function(event) {
            callHook('yTPlayerDeletePlaylistByID', event, false);
        });

        /*
         * @event yTPlayerRequestCurrentSongEvent
         */
        $api.on($script, 'yTPlayerRequestCurrentSong', function(event) {
            callHook('yTPlayerRequestCurrentSong', event, false);
        });

        /*
         * @event yTPlayerRandomizeEvent
         */
        $api.on($script, 'yTPlayerRandomize', function(event) {
            callHook('yTPlayerRandomize', event, false);
        });

        /*
         * @event yTPlayerDeleteCurrentEvent
         */
        $api.on($script, 'yTPlayerDeleteCurrent', function(event) {
            callHook('yTPlayerDeleteCurrent', event, false);
        });

        /*
         * @event gameWispChangeEvent
         */
        $api.on($script, 'gameWispChange', function(event) {
            callHook('gameWispChange', event, false);
        });

        /*
         * @event gameWispBenefitsEvent
         */
        $api.on($script, 'gameWispBenefits', function(event) {
            callHook('gameWispBenefits', event, false);
        });

        /*
         * @event gameWispSubscribeEvent
         */
        $api.on($script, 'gameWispSubscribe', function(event) {
            callHook('gameWispSubscribe', event, false);
        });

        /*
         * @event gameWispAnniversaryEvent
         */
        $api.on($script, 'gameWispAnniversary', function(event) {
            callHook('gameWispAnniversary', event, false);
        });

        /*
         * @event twitterEvent
         */
        $api.on($script, 'twitter', function(event) {
            callHook('twitter', event, false);
        });

        /*
         * @event twitterRetweetEvent
         */
        $api.on($script, 'twitterRetweet', function(event) {
            callHook('twitterRetweet', event, false);
        });

        /*
         * @event twitchOnlineEvent
         */
        $api.on($script, 'twitchOnline', function(event) {
            callHook('twitchOnline', event, false);
        });

        /*
         * @event twitchOfflineEvent
         */
        $api.on($script, 'twitchOffline', function(event) {
            callHook('twitchOffline', event, false);
        });

        /*
         * @event twitchGameChangeEvent
         */
        $api.on($script, 'twitchGameChange', function(event) {
            callHook('twitchGameChange', event, false);
        });

        /*
         * @event twitchTitleChangeEvent
         */
        $api.on($script, 'twitchTitleChange', function(event) {
            callHook('twitchTitleChange', event, false);
        });

        /*
         * @event twitchSubscriber
         */
        $api.on($script, 'twitchSubscriber', function(event) {
            callHook('twitchSubscriber', event, false);
        });

        /*
         * @event twitchPrimeSubscriber
         */
        $api.on($script, 'twitchPrimeSubscriber', function(event) {
            callHook('twitchPrimeSubscriber', event, false);
        });

        /*
         * @event reSubscriber
         */
        $api.on($script, 'twitchReSubscriber', function(event) {
            callHook('twitchReSubscriber', event, false);
        });

        /*
         * @event twitchSubscriptionGift
         */
        $api.on($script, 'twitchSubscriptionGift', function(event) {
            callHook('twitchSubscriptionGift', event, false);
        });

        /*
         * @event twitchMassSubscriptionGifted
         */
        $api.on($script, 'twitchMassSubscriptionGifted', function(event) {
            callHook('twitchMassSubscriptionGifted', event, false);
        });

        /*
         * @event twitchBits
         */
        $api.on($script, 'twitchBits', function(event) {
            callHook('twitchBits', event, false);
        });

        /*
         * @event twitchRaid
         */
        $api.on($script, 'twitchRaid', function(event) {
            callHook('twitchRaid', event, false);
        });

        /*
         * @event discordChannelMessage
         */
        $api.on($script, 'discordChannelMessage', function(event) {
            callHook('discordChannelMessage', event, false);
        });

        /*
         * @event discordChannelJoin
         */
        $api.on($script, 'discordChannelJoin', function(event) {
            callHook('discordChannelJoin', event, false);
        });

        /*
         * @event discordChannelPart
         */
        $api.on($script, 'discordChannelPart', function(event) {
            callHook('discordChannelPart', event, false);
        });

        /*
         * @event webPanelSocketUpdate
         */
        $api.on($script, 'webPanelSocketUpdate', function(event) {
            callHook('webPanelSocketUpdate', event, false);
        });

        /*
         * @event PubSubModerationTimeout
         */
        $api.on($script, 'PubSubModerationTimeout', function(event) {
            callHook('PubSubModerationTimeout', event, false);
        });

        /*
         * @event PubSubModerationUnTimeout
         */
        $api.on($script, 'PubSubModerationUnTimeout', function(event) {
            callHook('PubSubModerationUnTimeout', event, false);
        });

        /*
         * @event PubSubModerationBan
         */
        $api.on($script, 'PubSubModerationBan', function(event) {
            callHook('PubSubModerationBan', event, false);
        });

        /*
         * @event PubSubModerationUnBan
         */
        $api.on($script, 'PubSubModerationUnBan', function(event) {
            callHook('PubSubModerationUnBan', event, false);
        });
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
        getModuleIndex: getModuleIndex,
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
