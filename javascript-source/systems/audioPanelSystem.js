/**
 * audioPanelSystem.js
 *
 * Play audio on the PhantomBot Control Panel Audio Panel
 */
(function() {
    var messageToggle = $.getSetIniDbBoolean('settings', 'audiohookmessages', false);

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
            audioHookListStr;

        /**
         * Checks if the command is a adio hook 
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

                if (audioHookExists(audioHook) === undefined) {
                    $.returnCommandCost(sender, command, $.isModv3(sender, event.getTags()));
                    return;
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
            $.registerChatCommand('./systems/audioPanelSystem.js', 'audiohook', 1);
            $.registerChatSubcommand('audiohook', 'play', 1);
            $.registerChatSubcommand('audiohook', 'list', 1);
            $.registerChatSubcommand('audiohook', 'togglemessages', 1);
            $.registerChatSubcommand('audiohook', 'customcommand', 1);
            loadAudioHookCommands();
        }
    });

    $.loadAudioHookCommands = loadAudioHookCommands;
})();
