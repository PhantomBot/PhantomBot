/**
 * audioPanelSystem.js
 *
 * Play audio on the PhantomBot Control Panel Audio Panel
 */
(function() {
    var messageToggle = $.getSetIniDbBoolean('settings', 'audiohookmessages', false);

    /**
     * @function updateAudioHookDB
     */
    function updateAudioHookDB() {
        var audioHookFiles = $.findFiles('./web/panel/js/ion-sound/sounds', ''),
            audioHookNames = {},
            dbAudioHookNames,
            reFileExt = new RegExp(/\.mp3$|\.ogg$|\.aac$/);

        for (var i in audioHookFiles) {
            var fileName = audioHookFiles[i] + '';
            audioHookNames[fileName.replace(reFileExt, '')] = fileName.replace(reFileExt, '');
        }

        for (var i in audioHookNames) {
            if (!$.inidb.exists('audio_hooks', audioHookNames[i])) {
                $.inidb.set('audio_hooks', audioHookNames[i], audioHookNames[i]);
            }
        }

        dbAudioHookNames = $.inidb.GetKeyList('audio_hooks', '');
        for (i in dbAudioHookNames) {
            if (audioHookNames[dbAudioHookNames[i]] === undefined) {
                $.inidb.del('audio_hooks', dbAudioHookNames[i]);
            }
        }
        
        $.panelsocketserver.doAudioHooksUpdate();
    };

    /**
     * @function audioHookExists
     * @param {string} hook
     */
    function audioHookExists(hook) {
        var keys = $.inidb.GetKeyList('audio_hooks', ''),
            hookList = [],
            i;

        for (i in keys) {
            if (keys[i].equalsIgnoreCase(hook)) {
                return true;
            }
        }

        return false;
    };

    /**
     * @function getAudioHookCommands
     */
    function getAudioHookCommands() {
        var keys = $.inidb.GetKeyList('audioCommands', ''),
            hooks = [],
            i;

        for (i in keys) {
            hooks.push('!' + keys[i]);
        }

        return hooks;
    };

    /**
     * @function loadAudioHookCommands
     */
    function loadAudioHookCommands() {
        if ($.bot.isModuleEnabled('./systems/audioPanelSystem.js')) {
            var commands = $.inidb.GetKeyList('audioCommands', ''),
                i;
                
            for (i in commands) {
                if (!$.commandExists(commands[i])) {
                    $.registerChatCommand('./systems/audioPanelSystem.js', commands[i], 7);
                } else {
                    $.log.error('Cannot add custom command audio hook, command already exists: ' + commands[i]);
                }
            }
        }
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            subCommand = args[0],
            action = args[1],
            subAction = args[2],
            actionArgs = args[3],
            audioHook = args[1],
            audioHookListStr,
            isModv3 = $.isModv3(sender, event.getTags());

        /* Control Panel call to update the Audio Hooks DB. */
        if (command.equalsIgnoreCase('reloadaudiopanelhooks')) {
            if (!$.isBot(sender)) {
                return;
            }
            updateAudioHookDB();
        }

        /**
         * Checks if the command is an audio hook 
         */
        if ($.inidb.exists('audioCommands', command)) {
            if ($.inidb.get('audioCommands', command).match(/\(list\)/g)) {
                $.paginateArray(getAudioHookCommands(), 'audiohook.list', ', ', true, sender);
                return;
            }
            if (messageToggle) {
                $.say($.whisperPrefix(sender) + $.lang.get('audiohook.play.success', $.inidb.get('audioCommands', command)));
            }
            $.panelsocketserver.triggerAudioPanel($.inidb.get('audioCommands', command));
            return;
        }

        /**
         * @commandpath audiohook [play | list] - Base command for audio hooks.
         * @commandpath audiohook play [audio_hook] - Sends the audio_hook request to the Panel. 
         * @commandpath audiohook list - Lists the audio hooks.
         * @commandpath audiohook togglemessages - Enables the success message once a sfx is sent.
         * @commandpath audiohook customcommand [add / remove] [command] [sound] - Adds a custom command that will trigger that sound. Use tag "(list)" to display all the commands.
         */
        if (command.equalsIgnoreCase('audiohook')) {
            var hookKeys = $.inidb.GetKeyList('audio_hooks', ''),
                hookList = [],
                idx;

            for (idx in hookKeys) {
                hookList[hookKeys[idx]] = hookKeys[idx];
            }

            if (subCommand === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('audiohook.usage'));
                $.returnCommandCost(sender, command, $.isModv3(sender, event.getTags()));
                return;
            }

            if (subCommand.equalsIgnoreCase('play')) {
                if (audioHook === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.play.usage'));
                    $.returnCommandCost(sender, command, $.isModv3(sender, event.getTags()));
                    return;
                }

                if (!audioHookExists(audioHook)) {
                    $.returnCommandCost(sender, command, $.isModv3(sender, event.getTags()));
                    return;
                }

                // Moved this from init since only this command can have three commands. Why slow down all of the command with 
                // 3 db calls just for this?
                if ((((isModv3 && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(sender)) || !isModv3)) && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                    var commandCost = $.getCommandPrice(command, subCommand, action);
                    if ($.getUserPoints(sender) < commandCost) {
                        $.say($.whisperPrefix(sender) + $.lang.get('cmd.needpoints', $.getPointsString(commandCost)));
                        return;
                    } else {
                        $.inidb.decr('points', sender, commandCost);
                    }
                }

                if (messageToggle) {
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.play.success', audioHook));
                }
                $.panelsocketserver.triggerAudioPanel(audioHook);
            }

            if (subCommand.equalsIgnoreCase('togglemessages')) {
                if (messageToggle) {
                    messageToggle = false;
                    $.inidb.set('settings', 'audiohookmessages', messageToggle);
                } else {
                    messageToggle = true;
                    $.inidb.set('settings', 'audiohookmessages', messageToggle);
                }
                $.say($.whisperPrefix(sender) + $.lang.get('audiohook.toggle', messageToggle));
                return;
            }

            if (subCommand.equalsIgnoreCase('list')) {
                if (args[1] === undefined) {
                    var totalPages = $.paginateArray(hookKeys, 'audiohook.list', ', ', true, sender, 1);
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.list.total', totalPages));
                } else if (isNaN(args[1])) {
                    var totalPages = $.paginateArray(hookKeys, 'audiohook.list', ', ', true, sender, 1);
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.list.total', totalPages));
                } else {
                    $.paginateArray(hookKeys, 'audiohook.list', ', ', true, sender, parseInt(args[1]));
                }
                return;
            }

            if (subCommand.equalsIgnoreCase('customcommand')) {
                if (action === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.usage'));
                    return;
                }

                if (action.equalsIgnoreCase('add')) {
                    if (subAction === undefined || actionArgs === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.add.usage'));
                        return;
                    }

                    subAction = subAction.replace('!', '');

                    if ($.commandExists(subAction.toLowerCase()) || $.aliasExists(subAction.toLowerCase()) || $.inidb.exists('audioCommands', subAction.toLowerCase())) {
                        $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.add.error.exists'));
                        return;
                    }

                    if (actionArgs.equalsIgnoreCase('(list)')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.add.list', subAction));
                        $.inidb.set('audioCommands', subAction.toLowerCase(), actionArgs);
                        $.registerChatCommand('./systems/audioPanelSystem.js', subAction.toLowerCase(), 7);
                        return;
                    }

                    if (!audioHookExists(actionArgs)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.add.error.fx.null'));
                        return;
                    }

                    $.inidb.set('audioCommands', subAction.toLowerCase(), actionArgs);
                    $.registerChatCommand('./systems/audioPanelSystem.js', subAction.toLowerCase(), 7);
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.add.success', subAction, actionArgs));
                    return;
                }

                if (action.equalsIgnoreCase('remove')) {
                    if (subAction === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.remove.usage'));
                        return;
                    }

                    subAction = subAction.replace('!', '');

                    if (!$.inidb.exists('audioCommands', subAction.toLowerCase())) {
                        $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.remove.error.404'));
                        return;
                    }

                    $.inidb.del('audioCommands', subAction.toLowerCase());
                    $.unregisterChatCommand(subAction.toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('audiohook.customcommand.remove.success', subAction));
                    return;
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/audioPanelSystem.js')) {
            $.registerChatCommand('./systems/audioPanelSystem.js', 'reloadaudiopanelhooks', 30);
            $.registerChatCommand('./systems/audioPanelSystem.js', 'audiohook', 1);
            $.registerChatSubcommand('audiohook', 'play', 1);
            $.registerChatSubcommand('audiohook', 'list', 1);
            $.registerChatSubcommand('audiohook', 'togglemessages', 1);
            $.registerChatSubcommand('audiohook', 'customcommand', 1);
            loadAudioHookCommands();
            updateAudioHookDB();
        }
    });

    $.loadAudioHookCommands = loadAudioHookCommands;
    $.audioHookExists = audioHookExists;
})();
