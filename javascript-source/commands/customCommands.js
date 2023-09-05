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

/* global Packages */

(function () {
    // Pre-build regular expressions.z
    var reCommandTag = new RegExp(/\(command\s([\w]+)\)/),
            customCommands = [],
            ScriptEventManager = Packages.tv.phantombot.script.ScriptEventManager,
            CommandEvent = Packages.tv.phantombot.event.command.CommandEvent,
            _lock = new Packages.java.util.concurrent.locks.ReentrantLock(),
            disablecomBlocked = ['disablecom', 'enablecom'];

    /*
     * @function runCommand
     *
     * @param {string} username
     * @param {string} command
     * @param {string} args
     */
    function runCommand(username, command, args, tags) {
        if (tags !== undefined) {
            ScriptEventManager.instance().onEvent(new CommandEvent(username, command, args, tags));
        } else {
            ScriptEventManager.instance().onEvent(new CommandEvent(username, command, args));
        }
    }

    /*
     * @function returnCommandCost
     *
     * @export $
     * @param {string} sender
     * @param {string} command
     */
    function returnCommandCost(sender, command, isMod) {
        sender = sender.toLowerCase();
        command = command.toLowerCase();

        let cost = $.getIniDbNumber('pricecom', command, 0);

        if (cost <= 0) {
            return;
        }

        if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(sender)) || !isMod))) {
            $.inidb.incr('points', sender, cost);
        }
    }

    /*
     * @function priceCom
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {sub} subcommand
     * @param {bool} isMod
     * @returns 1 | 0 - Not a boolean
     */
    function priceCom(username, command, subCommand, isMod) {
        if ((subCommand !== '' && $.inidb.exists('pricecom', command + ' ' + subCommand)) || $.inidb.exists('pricecom', command)) {
            if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(username)) || !isMod)) && $.bot.isModuleEnabled('./systems/pointSystem.js')) {
                if ($.getUserPoints(username) < getCommandPrice(command, subCommand, '')) {
                    return 1;
                }
                return 0;
            }
        }
        return -1;
    }

    /*
     * @function payCom
     *
     * @export $
     * @param {string} command
     * @returns 1 | 0 - Not a boolean
     */
    function payCom(command) {
        return ($.inidb.exists('paycom', command) ? 0 : 1);
    }

    /*
     * @function getCommandPrice
     *
     * @export $
     * @param {string} command
     * @param {string} subCommand
     * @param {string} subCommandAction
     * @returns {Number}
     */
    function getCommandPrice(command, subCommand, subCommandAction) {
        command = command.toLowerCase();
        subCommand = subCommand.toLowerCase();
        subCommandAction = subCommandAction.toLowerCase();

        let cost = $.optIniDbNumber('pricecom', command + ' ' + subCommand + ' ' + subCommandAction);
        if (cost.isPresent()) {
            return cost.get();
        }

        cost = $.optIniDbNumber('pricecom', command + ' ' + subCommand);
        if (cost.isPresent()) {
            return cost.get();
        }

        cost = $.optIniDbNumber('pricecom', command);
        if (cost.isPresent()) {
            return cost.get();
        }
        return 0;
    }

    /*
     * @function getCommandPay
     *
     * @export $
     * @param {string} command
     * @returns {Number}
     */
    function getCommandPay(command) {
        return $.getIniDbNumber('paycom', command, 0);
    }

    /*
     * @function addComRegisterCommands
     */
    function addComRegisterCommands() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var commands = $.inidb.GetKeyList('command', ''),
                    i;
            for (i in commands) {
                if (!$.commandExists(commands[i])) {
                    _lock.lock();
                    try {
                        customCommands[commands[i]] = $.getIniDbString('command', commands[i]);
                    } finally {
                        _lock.unlock();
                    }
                    $.registerChatCommand('./commands/customCommands.js', commands[i], $.PERMISSION.Viewer);
                }
            }
        }
    }

    /*
     * @function addComRegisterAliases
     */
    function addComRegisterAliases() {
        if ($.bot.isModuleEnabled('./commands/customCommands.js')) {
            var aliases = $.inidb.GetKeyList('aliases', ''),
                    i;
            for (i in aliases) {
                if (!$.commandExists(aliases[i])) {
                    $.registerChatCommand('./commands/customCommands.js', aliases[i], $.getIniDbNumber('permcom', aliases[i], $.PERMISSION.Viewer));
                    $.registerChatAlias(aliases[i]);
                }
            }
        }
    }

    /*
     * @event command
     * @usestransformers global twitch commandevent noevent
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                argsString = event.getArguments(),
                args = event.getArgs(),
                action = args[0],
                subAction = args[1];

        /*
         * This handles custom commands, no command path is needed.
         */
        _lock.lock();
        try {
            if (customCommands[command] !== undefined
                    && !$.inidb.exists('disabledCommands', command)) {
                var tag = $.transformers.tags(event, customCommands[command], ['twitch', ['commandevent', 'noevent']], {atEnabled: $.getIniDbBoolean('settings', 'customCommandAtEnabled', true)});
                if (tag !== null) {
                    $.say(tag);
                }
                return;
            }
        } finally {
            _lock.unlock();
        }

        /*
         * @commandpath addcom [command] [command response] - Adds a custom command
         */
        if ($.equalsIgnoreCase(command, 'addcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            if ($.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.error'));
                return;
            } else if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.disabled'));
                return;
            } else if (argsString.indexOf('(command ') !== -1) {
                if (argsString.indexOf('(command ') !== 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.notfirst'));
                    return;
                } else {
                    if (!$.commandExists(argsString.match(reCommandTag)[1])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.commandtag.invalid', argsString.match(reCommandTag)[1]));
                        return;
                    }
                }
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.add.success', action));
            $.logCustomCommand({
                'add.command': '!' + action,
                'add.response': argsString,
                'sender': sender
            });
            $.registerChatCommand('./commands/customCommands.js', action);
            $.inidb.set('command', action, argsString);
            _lock.lock();
            try {
                customCommands[action] = argsString;
            } finally {
                _lock.unlock();
            }

            return;
        }

        /*
         * @commandpath editcom [command] [command response] - Edits the current response of that command
         */
        if ($.equalsIgnoreCase(command, 'editcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            let commandAction = $.optIniDbString('command', action);
            if ($.commandExists(action) && !commandAction.isPresent()) {
                let commandAlias = $.optIniDbString('aliases', action);
                if (commandAlias.isPresent()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.editcom.alias', commandAlias.get(), argsString));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.404'));
                }
                return;
            }
            if (commandAction.get().match(/\(adminonlyedit\)/) && !$.checkUserPermission(sender, event.getTags(), $.PERMISSION.Admin)) {
                if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getGroupNameById($.PERMISSION.Admin)));
                }
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.edit.success', action));
            $.logCustomCommand({
                'edit.command': '!' + action,
                'edit.response': argsString,
                'sender': sender
            });
            $.registerChatCommand('./commands/customCommands.js', action, $.PERMISSION.Viewer);
            $.inidb.set('command', action, argsString);
            _lock.lock();
            try {
                customCommands[action] = argsString;
            } finally {
                _lock.unlock();
            }

            return;
        }

        /*
         * @commandpath tokencom [command] [token] - Stores a user/pass or API key to be replaced into a (customapi) tag. WARNING: This should be done from the bot console or web panel, if you run this from chat, anyone watching chat can copy your info!
         */
        if ($.equalsIgnoreCase(command, 'tokencom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.token.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            argsString = args.slice(1).join(' ');

            var silent = false;
            if (action.startsWith('silent@')) {
                silent = true;
                action = action.slice(7);
            }

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            } else if ($.getIniDbString('command', action).match(/\(adminonlyedit\)/) && !$.checkUserPermission(sender, event.getTags(), $.PERMISSION.Admin)) {
                if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('cmd.perm.404', $.getGroupNameById($.PERMISSION.Admin)));
                }
                return;
            }

            if (!silent) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.token.success', action));
            }

            if (argsString.length === 0) {
                $.inidb.RemoveKey('commandtoken', '', action);
            } else {
                $.inidb.SetString('commandtoken', '', action, argsString);
            }
            return;
        }

        /*
         * @commandpath delcom [command] - Delete that custom command
         */
        if ($.equalsIgnoreCase(command, 'delcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('command', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.delete.success', action));
            $.logCustomCommand({
                'delete.command': '!' + action,
                'sender': sender
            });
            $.inidb.del('command', action);
            $.inidb.del('permcom', action);
            $.inidb.del('pricecom', action);
            $.inidb.del('aliases', action);
            $.inidb.del('disabledCommands', action);
            $.inidb.del('hiddenCommands', action);
            $.inidb.del('commandtoken', action);
            $.unregisterChatCommand(action);
            _lock.lock();
            try {
                delete customCommands[action];
            } finally {
                _lock.unlock();
            }

            return;
        }

        /*
         * @commandpath aliascom [alias name] [existing command] - Create an alias to any command
         */
        if ($.equalsIgnoreCase(command, 'aliascom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.usage'));
                return;
            }

            if (action.startsWith('!')) {
                action = action.substring(1);
            }

            action = action.toLowerCase();
            subAction = args.slice(1).join(' ');

            if (subAction.startsWith('!')) {
                subAction = action.substring(1);
            }

            subAction = subAction.toLowerCase();

            if ($.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.exists'));
                return;
            } else if (!$.commandExists(subAction.split(' ')[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error.target404'));
                return;
            } else if ($.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.error', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.success', subAction, action));
            $.logCustomCommand({
                'alias.command': '!' + action,
                'alias.target': '!' + subAction,
                'sender': sender
            });
            $.registerChatCommand('./commands/customCommands.js', action);
            $.inidb.set('aliases', action, subAction);
            $.registerChatAlias(action);
            return;
        }

        /*
         * @commandpath delalias [alias] - Delete that alias
         */
        if ($.equalsIgnoreCase(command, 'delalias')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('aliases', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.error.alias.404', action));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.alias.delete.success', action));
            $.logCustomCommand({
                'alias.delete.command': '!' + action,
                'sender': sender
            });
            $.unregisterChatCommand(action);
            $.inidb.del('aliases', action);
            return;
        }

        /*
         * @commandpath permcom [command] [groupId] - Set the permissions for any command
         */
        if ($.equalsIgnoreCase(command, 'permcom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();
            var group = 7;

            if (args.length === 2) {
                group = args[1];

                if (!$.commandExists(action)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action));
                    return;
                }

                if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                } else {
                    group = parseInt(group);
                }

                var groupname = $.getGroupNameById(group);

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action, groupname));
                $.logCustomCommand({
                    'set.perm.command': '!' + action,
                    'set.perm.group': groupname,
                    'sender': sender
                });

                var list = $.inidb.GetKeyList('aliases', ''),
                        i;

                for (i in list) {
                    if ($.equalsIgnoreCase(list[i], action)) {
                        $.inidb.set('permcom', $.getIniDbString('aliases', list[i]), group);
                        $.updateCommandGroup($.getIniDbString('aliases', list[i]), group);
                    }
                }

                $.inidb.set('permcom', action, group);
                $.updateCommandGroup(action, group);
            } else {
                group = args[2];

                if (!$.subCommandExists(action, subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.404', action + ' ' + subAction));
                    return;
                }

                if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                } else {
                    group = parseInt(group);
                }

                var groupname = $.getGroupNameById(group);

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.perm.success', action + ' ' + subAction, groupname));
                $.logCustomCommand({
                    'set.perm.command': '!' + action + ' ' + subAction,
                    'set.perm.group': groupname,
                    'sender': sender
                });
                $.inidb.set('permcom', action + ' ' + subAction, group);
                $.updateSubcommandGroup(action, subAction, group);
            }
            return;
        }

        /*
         * @commandpath pricecom [command] [amount] - Set the amount of points a command should cost
         */
        if ($.equalsIgnoreCase(command, 'pricecom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.404'));
                return;
            }

            if (args.length === 2) {
                if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action, subAction, $.pointNameMultiple));
                $.logCustomCommand({
                    'set.price.command': '!' + action,
                    'set.price.amount': subAction,
                    'sender': sender
                });
                $.inidb.set('pricecom', action, subAction);

                var list = $.inidb.GetKeyList('aliases', ''),
                        i;

                for (i in list) {
                    if ($.equalsIgnoreCase(list[i], action)) {
                        $.inidb.set('pricecom', $.getIniDbString('aliases', list[i]), parseInt(subAction));
                    }
                    if ($.getIniDbString('aliases', list[i]).includes(action)) {
                        $.inidb.set('pricecom', list[i], parseInt(subAction));
                    }
                }
            } else if (args.length === 3) {
                if (isNaN(parseInt(args[2])) || parseInt(args[2]) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction, args[2], $.pointNameMultiple));
                $.logCustomCommand({
                    'set.price.command': '!' + action + ' ' + subAction,
                    'set.price.amount': args[2],
                    'sender': sender
                });
                $.inidb.set('pricecom', action + ' ' + subAction, args[2]);
            } else {
                if (args.length === 4) {
                    if (isNaN(parseInt(args[3])) || parseInt(args[3]) < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.error.invalid'));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.price.success', action + ' ' + subAction + ' ' + args[2], args[3], $.pointNameMultiple));
                    $.logCustomCommand({
                        'set.price.command': '!' + action + ' ' + subAction + ' ' + args[2],
                        'set.price.amount': args[3],
                        'sender': sender
                    });
                    $.inidb.set('pricecom', action + ' ' + subAction + ' ' + args[2], args[3]);
                }
            }
            return;
        }

        /*
         * @commandpath paycom [command] [amount] - Set the amount of points a command should reward a viewer
         */
        if ($.equalsIgnoreCase(command, 'paycom')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.error.404'));
                return;
            } else if (isNaN(parseInt(subAction)) || parseInt(subAction) < 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.error.invalid'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.set.pay.success', action, subAction, $.pointNameMultiple));
            $.logCustomCommand({
                'set.pay.command': '!' + action,
                'set.pay.amount': subAction,
                'sender': sender
            });
            $.inidb.set('paycom', action, subAction);

            var list = $.inidb.GetKeyList('aliases', ''),
                    i;

            for (i in list) {
                if ($.equalsIgnoreCase(list[i], action)) {
                    $.inidb.set('paycom', $.getIniDbString('aliases', list[i]), subAction);
                }
                if ($.getIniDbString('aliases', list[i]).includes(action)) {
                    $.inidb.set('paycom', list[i], subAction);
                }
            }
            return;
        }

        /*
         * @commandpath commands - Provides a list of all available custom commands.
         */
        if ($.equalsIgnoreCase(command, 'commands')) {
            var cmds = $.inidb.GetKeyList('command', ''),
                    aliases = $.inidb.GetKeyList('aliases', ''),
                    externalCommands = $.inidb.GetKeyList('externalCommands', ''),
                    cmdList = [];

            for (idx in cmds) {
                if (!$.inidb.exists('disabledCommands', cmds[idx])
                        && !$.inidb.exists('hiddenCommands', cmds[idx])
                        && $.permCom(sender, cmds[idx], '') === 0) {
                    cmdList.push('!' + cmds[idx]);
                }
            }

            for (idx in aliases) {
                var aliasCmd = $.getIniDbString('aliases', aliases[idx]);

                if (!$.inidb.exists('disabledCommands', aliases[idx])
                        && !$.inidb.exists('hiddenCommands', aliases[idx])
                        && $.permCom(sender, aliasCmd, '') === 0) {
                    cmdList.push('!' + aliases[idx]);
                }
            }

            for (idx in externalCommands) {
                cmdList.push('!' + externalCommands[idx]);
            }

            if (cmdList.length > 0) {
                $.paginateArray(cmdList, 'customcommands.cmds', ', ', true, sender);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.404.no.commands'));
            }
            return;
        }

        /*
         * @commandpath botcommands - Will show you all of the bots commands
         */
        if ($.equalsIgnoreCase(command, 'botcommands')) {
            var cmds = $.inidb.GetKeyList('permcom', ''),
                    idx,
                    totalPages,
                    cmdList = [];

            for (idx in cmds) {
                if (cmds[idx].indexOf(' ') !== -1) {
                    continue;
                }
                if ($.permCom(sender, cmds[idx], '') === 0) {
                    cmdList.push('!' + cmds[idx]);
                }
            }

            if (action === undefined) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, 1);
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.total', totalPages));
                return;
            } else if (!isNaN(action)) {
                totalPages = $.paginateArray(cmdList, 'customcommands.botcommands', ', ', true, sender, parseInt(action));
                return;
            }
            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.botcommands.error'));
            return;
        }

        /*
         * @commandpath disablecom [command] - Disable a command from being used in chat
         */
        if ($.equalsIgnoreCase(command, 'disablecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.usage'));
                return;
            }

            action = $.jsString(action.replace('!', '').toLowerCase());

            if ($.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.err'));
                return;
            } else if ((!$.commandExists(action) && action !== '@all') || disablecomBlocked.includes(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.404'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.disable.success', action));
            if (action === '@all') {
                let commands = $.listCommands();

                $.logCustomCommand({
                    'disable.command': action,
                    'sender': sender
                });

                for (let x in commands) {
                    if (!disablecomBlocked.includes(commands[x]) && customCommands[commands[x]] === undefined) {
                        $.inidb.set('disabledCommands', commands[x], true);
                        $.tempUnRegisterChatCommand(commands[x]);
                    }
                }
            } else {
                $.logCustomCommand({
                    'disable.command': '!' + action,
                    'sender': sender
                });
                $.inidb.set('disabledCommands', action, true);
                $.tempUnRegisterChatCommand(action);
            }
            return;
        }

        /*
         * @commandpath enablecom [command] - Enable a command thats been disabled from being used in chat
         */
        if ($.equalsIgnoreCase(command, 'enablecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.usage'));
                return;
            }

            action = $.jsString(action.replace('!', '').toLowerCase());

            if (action !== '@all' && !$.inidb.exists('disabledCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.enable.success', action));

            let tempDisabled;

            if (action === '@all') {
                let commands = $.listCommands();

                $.logCustomCommand({
                    'enable.command': action,
                    'sender': sender
                });

                for (let x in commands) {
                    if (customCommands[commands[x]] === undefined) {
                        $.inidb.del('disabledCommands', commands[x]);
                        $.registerChatCommand($.getIniDbString('tempDisabledCommandScript', commands[x], './commands/customCommands.js'), commands[x]);
                    }
                }
            } else {
                $.logCustomCommand({
                    'enable.command': '!' + action,
                    'sender': sender
                });
                $.inidb.del('disabledCommands', action);
                $.registerChatCommand($.getIniDbString('tempDisabledCommandScript', action, './commands/customCommands.js'), action);
            }
            return;
        }

        /*
         * @commandpath hidecom [command] - Hide a command in the !commands list
         */
        if ($.equalsIgnoreCase(command, 'hidecom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.hide.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.commandExists(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.hide.404'));
                return;
            } else if ($.inidb.exists('hiddenCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.hide.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.hide.success', action));
            $.logCustomCommand({
                'hide.command': '!' + action,
                'sender': sender
            });
            $.inidb.set('hiddenCommands', action, true);
            return;
        }

        /*
         * @commandpath showcom [command] - Adds a command that's been hidden back to the !commands list
         */
        if ($.equalsIgnoreCase(command, 'showcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.show.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('hiddenCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.show.err'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.show.success', action));
            $.logCustomCommand({
                'show.command': '!' + action,
                'sender': sender
            });
            $.inidb.del('hiddenCommands', action);
            return;
        }

        /*
         * @commandpath addextcom [command] - Adds a external command (only added to !commands list)
         */
        if ($.equalsIgnoreCase(command, 'addextcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.external.add.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if ($.inidb.exists('externalCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.external.add.error'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.external.add.success', action));
            $.logCustomCommand({
                'external.add.command': '!' + action,
                'sender': sender
            });
            $.inidb.set('externalCommands', action, true);
            return;
        }

        /*
         * @commandpath delextcom [command] - Delete that external command
         */
        if ($.equalsIgnoreCase(command, 'delextcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.external.delete.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (!$.inidb.exists('externalCommands', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.external.delete.error'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('customcommands.external.delete.success', action));
            $.logCustomCommand({
                'external.delete.command': '!' + action,
                'sender': sender
            });
            $.inidb.del('externalCommands', action);
            return;
        }

        /*
         * @commandpath resetcom [command] [count] - Resets the counter to zero, for a command that uses the (count) tag or optionally set to a specific value.
         */
        if ($.equalsIgnoreCase(command, 'resetcom')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.usage'));
                return;
            }

            action = action.replace('!', '').toLowerCase();

            if (args.length === 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.success', action));
                $.logCustomCommand({
                    'reset.command': '!' + action,
                    'reset.count': 0,
                    'sender': sender
                });
                $.inidb.del('commandCount', action);
            } else {
                if (isNaN(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.change.fail', subAction));
                } else {
                    $.inidb.set('commandCount', action, subAction);
                    $.say($.whisperPrefix(sender) + $.lang.get('customcommands.reset.change.success', action, subAction));
                    $.logCustomCommand({
                        'reset.command': '!' + action,
                        'reset.count': subAction,
                        'sender': sender
                    });
                }
            }
            return;
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./commands/customCommands.js', 'addcom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'pricecom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'paycom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'aliascom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'delalias', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'delcom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'editcom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'tokencom', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'permcom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'commands', $.PERMISSION.Viewer);
        $.registerChatCommand('./commands/customCommands.js', 'disablecom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'enablecom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'hidecom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'showcom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'addextcom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'delextcom', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/customCommands.js', 'botcommands', $.PERMISSION.Mod);
        $.registerChatCommand('./commands/customCommands.js', 'resetcom', $.PERMISSION.Mod);
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        var handleExtraDisabled = function (commandLower, extra) {
            if (extra.disabled !== null) {
                if (extra.disabled) {
                    $.tempUnRegisterChatCommand(commandLower);
                } else {
                    $.registerChatCommand($.getIniDbString('tempDisabledCommandScript', commandLower, './commands/customCommands.js'), commandLower);
                }
            }
        };

        if ($.equalsIgnoreCase(event.getScript(), './commands/customCommands.js')) {
            var args = event.getArgs(),
                    eventName = args[0] + '',
                    command = args[1] + '',
                    commandLower = command.toLowerCase() + '',
                    extra = (args[3] === null || args[3] === undefined) ? {} : JSON.parse(args[3]);
            if (eventName === 'remove') {
                _lock.lock();
                try {
                    if (customCommands[commandLower] !== undefined) {
                        delete customCommands[commandLower];
                        $.unregisterChatCommand(commandLower);
                        $.coolDown.remove(commandLower);
                    }
                } finally {
                    _lock.unlock();
                }
            } else if (eventName === 'add') {
                _lock.lock();
                try {
                    customCommands[commandLower] = args[2];
                } finally {
                    _lock.unlock();
                }

                $.registerChatCommand('./commands/customCommands.js', commandLower);
            } else if (eventName === 'edit') {
                _lock.lock();
                try {
                    customCommands[commandLower] = args[2];
                } finally {
                    _lock.unlock();
                }

                handleExtraDisabled(commandLower, extra);
            } else if (eventName === 'removeAlias') {
                $.unregisterChatCommand(commandLower);
                $.coolDown.remove(commandLower);
            } else if (eventName === 'addAlias') {
                $.registerChatCommand('./commands/customCommands.js', commandLower);
                $.registerChatAlias(commandLower);
            } else if (eventName === 'editAlias') {
                $.registerChatCommand('./commands/customCommands.js', commandLower);
                $.registerChatAlias(commandLower);
                handleExtraDisabled(commandLower, extra);
            }
        }
    });

    /*
     * Export functions to API
     */
    $.addComRegisterCommands = addComRegisterCommands;
    $.addComRegisterAliases = addComRegisterAliases;
    $.returnCommandCost = returnCommandCost;
    $.priceCom = priceCom;
    $.getCommandPrice = getCommandPrice;
    $.getCommandPay = getCommandPay;
    $.payCom = payCom;
    $.command = {
        run: runCommand
    };
})();
