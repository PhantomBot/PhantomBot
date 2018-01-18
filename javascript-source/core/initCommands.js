(function() {
    var bot = $.botName.toLowerCase();

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase(bot)) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.usage', bot));
                return;
            }

            /*
             * @commandpath botName disconnect - Removes the bot from your channel.
             */
            if (action.equalsIgnoreCase('disconnect')) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.disconnect', 'irc-ws.chat.twitch.tv'));

                setTimeout(function() {
                    java.lang.System.exit(0);
                }, 1000);
            }

            /*
             * @commandpath botName moderate - Forces the bot to detect its moderator status.
             */
            if (action.equalsIgnoreCase('moderate')) {
                $.session.getModerationStatus();
            }

            /*
             * @commandpath botName setconnectmessage [message] - Sets a message that will be said once the bot joins the channel.
             */
            if (action.equalsIgnoreCase('setconnectmessage')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.connected.msg.usage', bot));
                    return;
                }

                var message = args.slice(1).join(' ');

                $.setIniDbString('settings', 'connectedMsg', message);
                $.say($.whisperPrefix(sender) + $.lang.get('init.connected.msg', message));
            }

            /*
             * @commandpath botName removeconnectmessage - Removes the message said when the bot joins the channel.
             */
            if (action.equalsIgnoreCase('removeconnectmessage')) {
                $.inidb.del('settings', 'connectedMsg');
                $.say($.whisperPrefix(sender) + $.lang.get('init.connected.msg.removed'));
            }

            /*
             * @commandpath botName togglepricecommods - Toggles if moderators and higher pay for commands.
             */
            if (action.equalsIgnoreCase('togglepricecommods')) {
                var toggle = !$.getIniDbBoolean('settings', 'pricecomMods', false);

                $.setIniDbBoolean('settings', 'pricecomMods', toggle);
                $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('init.mod.toggle.on.pay') : $.lang.get('init.mod.toggle.off.pay')));
            }

            /*
             * @commandpath botName togglepermcommessage - Toggles if the no permission message is said in the chat.
             */
            if (action.equalsIgnoreCase('togglepermcommessage')) {
                var toggle = !$.getIniDbBoolean('settings', 'permComMsgEnabled', false);

                $.setIniDbBoolean('settings', 'permComMsgEnabled', toggle);
                $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('init.mod.toggle.perm.msg.on') : $.lang.get('init.mod.toggle.perm.msg.off')));
            }

            /*
             * @commandpath botName togglepricecommessage - Toggles if the cost message is said in the chat.
             */
            if (action.equalsIgnoreCase('togglepricecommessage')) {
                var toggle = !$.getIniDbBoolean('settings', 'priceComMsgEnabled', false);

                $.setIniDbBoolean('settings', 'priceComMsgEnabled', toggle);
                $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('init.mod.toggle.price.msg.on') : $.lang.get('init.mod.toggle.price.msg.off')));
            }

            /*
             * @commandpath botName togglecooldownmessage - Toggles if the cooldown message is said in the chat.
             */
            if (action.equalsIgnoreCase('togglecooldownmessage')) {
                var toggle = !$.getIniDbBoolean('settings', 'coolDownMsgEnabled', false);

                $.setIniDbBoolean('settings', 'coolDownMsgEnabled', toggle);
                $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('init.toggle.cooldown.msg.on') : $.lang.get('init.toggle.cooldown.msg.off')));
            }
        }

        if (command.equalsIgnoreCase('module')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
                return;
            }

            /*
             * @commandpath module delete [path] - Removes a module from the modules list. This does not remove the module itself.
             */
            if (action.equalsIgnoreCase('delete')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.delete.usage'));
                    return;
                } else if ($.getIniDbString('modules', subAction, undefined) === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.delete.404', subAction));
                    return;
                }

                $.inidb.del('modules', subAction);
                $.say($.whisperPrefix(sender) + $.lang.get('init.module.delete.success', subAction));
            }

            /*
             * @commandpath module list - Gives a list of all the modules with their current status.
             */
            if (action.equalsIgnoreCase('list')) {
                var keys = Object.keys($.bot.modules),
                    modules = $.bot.modules,
                    temp = [],
                    i;

                for (i in keys) {
                    if (modules[keys[i]].scriptName.indexOf('./core') !== -1 || modules[keys[i]].scriptName.indexOf('./lang') !== -1) {
                        continue;
                    }

                    temp.push(modules[keys[i]].scriptName + (modules[keys[i]].isEnabled ? ' (' + $.lang.get('common.enabled') + ')' : ' (' + $.lang.get('common.disabled') + ')'));
                }

                var totalPages = $.paginateArray(temp, 'init.module.list', ', ', true, sender, (isNaN(parseInt(subAction)) ? 1 : parseInt(subAction)));

                if (totalPages > 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.list.total', totalPages));
                }
            }

            /*
             * @commandpath module status [module path] - Retrieve the current status (enabled/disabled) of the given module
             */
            if (action.equalsIgnoreCase('status')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage.status'));
                    return;
                }

                var module = $.bot.getModule(subAction);

                if (module !== undefined) {
                    if (module.isEnabled) {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.check.enabled', module.getModuleName()));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.check.disabled', module.getModuleName()));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
                }
            }

            /*
             * @commandpath module enable [module path] - Enable a module using the path and name of the module
             */
            if (action.equalsIgnoreCase('enable')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage.enable'));
                    return;
                }

                if (subAction.indexOf('./core') !== -1 || subAction.indexOf('./lang') !== -1) {
                    return;
                }

                var module = $.bot.getModule(subAction);

                if (module !== undefined) {
                    $.setIniDbBoolean('modules', module.scriptName, true);
                    $.bot.loadScript(module.scriptName);
                    $.bot.modules[module.scriptName].isEnabled = true;

                    var hookIndex = $.bot.getHookIndex($.bot.modules[module.scriptName].scriptName, 'initReady');

                    try {
                        if (hookIndex !== -1) {
                            $.bot.getHook(module.scriptName, 'initReady').handler();
                        }

                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.enabled', module.getModuleName()));
                    } catch (ex) {
                        $.log.error('Unable to call initReady for enabled module (' + module.scriptName + '): ' + ex);
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
                }
            }

            /*
             * @commandpath module disable [module path] - Disable a module using the path and name of the module
             */
            if (action.equalsIgnoreCase('disable')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage.disable'));
                    return;
                }

                if (subAction.indexOf('./core') !== -1 || subAction.indexOf('./lang') !== -1) {
                    return;
                }

                var module = $.bot.getModule(subAction);

                if (module !== undefined) {
                    $.setIniDbBoolean('modules', module.scriptName, false);
                    $.bot.modules[module.scriptName].isEnabled = false;

                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.disabled', module.getModuleName()));

                    if (module.scriptName.equalsIgnoreCase('./systems/pointSystem.js')) {
                        var modules = ['./games/adventureSystem.js', './games/roll.js', './games/slotMachine.js', './systems/ticketRaffleSystem.js', './systems/raffleSystem.js', './games/gambling.js'],
                            i;

                        for (i in modules) {
                            module = $.bot.getModule(modules[i]);

                            $.bot.modules[modules[i]].isEnabled = false;
                            $.setIniDbBoolean('modules', module.scriptName, false);
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('init.module.auto-disabled'));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
                }
            }

            /*
             * Panel command.
             */
            if (action.equalsIgnoreCase('enablesilent')) {
                if (subAction === undefined) {
                    return;
                }

                if (subAction.indexOf('./core') !== -1 || subAction.indexOf('./lang') !== -1) {
                    return;
                }

                var module = $.bot.getModule(subAction);

                if (module !== undefined) {
                    $.setIniDbBoolean('modules', module.scriptName, true);
                    $.bot.loadScript(module.scriptName);
                    $.bot.modules[module.scriptName].isEnabled = true;

                    var hookIndex = $.bot.getHookIndex(module.scriptName, 'initReady');

                    try {
                        if (hookIndex !== -1) {
                            $.bot.getHook(module.scriptName, 'initReady').handler();
                        }
                    } catch (ex) {
                        $.log.error('Unable to call initReady for enabled module (' + module.scriptName + '): ' + ex);
                    }
                }
            }

            /*
             * Panel command.
             */
            if (action.equalsIgnoreCase('disablesilent')) {
                if (subAction === undefined) {
                    return;
                }

                if (subAction.indexOf('./core') !== -1 || subAction.indexOf('./lang') !== -1) {
                    return;
                }

                var module = $.bot.getModule(subAction);

                if (module !== undefined) {
                    $.setIniDbBoolean('modules', module.scriptName, false);
                    $.bot.modules[module.scriptName].isEnabled = false;

                    if (module.scriptName.equalsIgnoreCase('./systems/pointSystem.js')) {
                        var modules = ['./games/adventureSystem.js', './games/roll.js', './games/slotMachine.js', './systems/ticketRaffleSystem.js', './systems/raffleSystem.js', './games/gambling.js'],
                            i;

                        for (i in modules) {
                            module = $.bot.getModule(modules[i]);

                            $.bot.modules[module.scriptName].isEnabled = false;
                            $.setIniDbBoolean('modules', module.scriptName, false);
                        }
                    }
                }
            }
        }

        /*
         * Panel command.
         */
        if (command.equalsIgnoreCase('reconnect')) {
            if ($.isBot(sender)) {
                $.session.getSocket().close();
            }
        }

        /*
         * Panel command.
         */
        if (command.equalsIgnoreCase('disconnect')) {
            if ($.isBot(sender)) {
                java.lang.System.exit(0);
            }
        }

        /*
         * @commandpath echo [message] - Send a message as the bot.
         */
        if (command.equalsIgnoreCase('chat') || command.equalsIgnoreCase('echo')) {
            if (argsString.length() > 0) {
                $.say(argsString);
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/initCommands.js', 'chat', 1);
        $.registerChatCommand('./core/initCommands.js', 'module', 1);
        $.registerChatCommand('./core/initCommands.js', 'echo', 1);
        $.registerChatCommand('./core/initCommands.js', 'reconnect', 1);
        $.registerChatCommand('./core/initCommands.js', 'disconnect', 1);
        $.registerChatCommand('./core/initCommands.js', bot, 2);
        $.registerChatSubcommand(bot, 'disconnect', 1);
        $.registerChatSubcommand(bot, 'reconnect', 1);
        $.registerChatSubcommand(bot, 'moderate', 2);
    });
})();