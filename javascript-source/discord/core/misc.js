/**
 * Handles the main things for the Discord modules. This is like the core if you would like to call it that.
 *
 * Command permissions for the registerCommand function:
 *  - 1 means only administrators can access the command.
 *	- 0 means everyone can access the command.
 *	
 * Guidelines for merging thing on our repo for this module: 
 * 	- Please try not to call the $.discordAPI function out of this script, move all the main functions here and export the function to the $.discord API.
 * 	- To register command to our command list https://phantombot.tv/commands/discord please add a comment starting with @discordcommandpath before the command info.
 * 	- Make sure to comment on every function what their name is and the parameters they require and if they return something.
 */
(function() {
    var embedReg = new RegExp(/\(embed\s([\s\d\w]+),\s([\w\W]+)\)/),
        fileRegMsg = new RegExp(/\(file\s([\w\W]+),\s?([\r\n\w\W]*)\)/),
        fileReg = new RegExp(/\(file\s([\w\W]+)\)/);

    /**
     * @function userPrefix
     *
     * @export $.discord
     * @param  {string} username
     * @return {String}
     */
    function userPrefix(username) {
        return (username + ', ');
    }

    /**
     * @function getUserMention
     *
     * @export $.discord.username
     * @param  {string} username
     * @return {string}
     */
    function getUserMention(username) {
        return ($.discordAPI.getUser(username) != null ? $.discordAPI.getUser(username).mention() : username);
    }

    /**
     * @function getUserMentionOrChannel
     *
     * @export $.discord.resolve
     * @param  {string} argument
     * @return {string}
     */
    function getUserMentionOrChannel(argument) {
        if ($.discordAPI.getUser(username) != null) {
            return $.discordAPI.getUser(argument).mention();
        } else if ($.discordAPI.getChannel(argument) != null) {
            return $.discordAPI.getChannel(argument).mention();
        } else {
            return argument;
        }
    }

    /**
     * @function getRandomUser
     *
     * @export $.discord.username
     * @return {string}
     */
    function getRandomUser() {
        return ($.discordAPI.getUsers().get($.randRange(0, $.discordAPI.getUsers().size() - 1)).mention());
    }

    /**
     * @function say
     *
     * @export $.discord
     * @param {string} channel
     * @param {string} message
     */
    function say(channel, message) {
        if (embedReg.test(message)) {
            $.discordAPI.sendMessageEmbed(channel, message.match(embedReg)[1], message.match(embedReg)[2]);
        } else if (fileRegMsg.test(message)) {
            $.discordAPI.sendFile(channel, message.match(fileRegMsg)[2], message.match(fileRegMsg)[1]);
        } else if (fileReg.test(message)) {
            $.discordAPI.sendFile(channel, message.match(fileReg)[1]);
        } else {
            $.discordAPI.sendMessage(channel, message);
        }
    }

    /**
     * @function setGame
     *
     * @export $.discord
     * @param {string} game
     */
    function setGame(game) {
        $.discordAPI.setGame(game);
    }

    /**
     * @function setGame
     *
     * @export $.discord
     * @param {string} game
     * @param {string} url
     */
    function setStream(game, url) {
        $.discordAPI.setStream(game, url);
    }

    /**
     * @function removeGame
     *
     * @export $.discord
     */
    function removeGame() {
        $.discordAPI.removeGame();
    }

    /**
     * @function setRole
     *
     * @param {string} role
     * @param {string} username
     * @export $.discord
     */
    function setRole(role, username) {
        return $.discordAPI.addRole(role, username);
    }

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * @discordcommandpath module enable [path] - Enables any modules in the bot, it should only be used to enable discord modules though.
         */
        if (command.equalsIgnoreCase('module')) {
            if (action === undefined || (subAction === undefined && !action.equalsIgnoreCase('list'))) {
                say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.usage'));
                return;
            }

            if (action.equalsIgnoreCase('enable')) {
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

                        say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.enabled', module.getModuleName()));
                    } catch (ex) {
                        $.log.error('[DISCORD] Unable to call initReady for enabled module (' + module.scriptName + '): ' + ex.message);
                    }
                } else {
                    say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.404', subAction));
                }
            }

            /**
             * @discordcommandpath module disable [path] - Disables any modules in the bot, it should only be used to enable discord modules though.
             */
            if (action.equalsIgnoreCase('disable')) {
                var module = $.bot.getModule(subAction);

                if (module !== undefined) {
                    $.setIniDbBoolean('modules', module.scriptName, false);
                    $.bot.modules[module.scriptName].isEnabled = false;

                    say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.disabled', module.getModuleName()));
                } else {
                    say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.404', subAction));
                }
            }

            /**
             * @discordcommandpath module list - Lists all of the discord modules.
             */
            if (action.equalsIgnoreCase('list')) {
                var keys = Object.keys($.bot.modules),
                    modules = $.bot.modules,
                    list = [],
                    i;

                for (i in keys) {
                    if (!modules[keys[i]].scriptName.startsWith('./discord/core/') && modules[keys[i]].scriptName.startsWith('./discord/')) {
                        list.push(modules[keys[i]].scriptName + ' [' + (modules[keys[i]].isEnabled === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled')) + ']');
                    }
                }
                say(channel, userPrefix(mention) + $.lang.get('discord.misc.module.list', list.join('\r\n')));
            }
        }

        /**
         * @discordcommandpath setgame [game name] - Sets the bot game.
         */
        if (command.equalsIgnoreCase('setgame')) {
            if (action === undefined) {
                say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.set.usage'));
                return;
            }

            setGame(args.join(' '));
            say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.set', args.join(' ')));
        }

        /**
         * @discordcommandpath setstream [twitch url] [game name] - Sets the bot game and marks it as streaming.
         */
        if (command.equalsIgnoreCase('setstream')) {
            if (action === undefined) {
                say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.stream.set.usage'));
                return;
            }

            setStream(args.slice(1).join(' '), action);
            say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.stream.set', action, args.slice(1).join(' ')));
        }

        /**
         * @discordcommandpath removegame - Removes the bot's game and streaming status if set.
         */
        if (command.equalsIgnoreCase('removegame')) {
            removeGame();
            say(channel, userPrefix(mention) + $.lang.get('discord.misc.game.removed'));
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        if (command.equalsIgnoreCase('discord')) {
            if (action === undefined) {
                return;
            }

            /**
             * @commandpath discord reconnect - Attempts to reconnect the bot to discord
             */
            if (action.equalsIgnoreCase('reconnect')) {
                $.discordAPI.reconnect();

                $.say($.whisperPrefix(sender) + $.lang.get('discord.misc.reconnect'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/core/misc.js', 'module', 1);
        $.discord.registerCommand('./discord/core/misc.js', 'setgame', 1);
        $.discord.registerCommand('./discord/core/misc.js', 'setstream', 1);
        $.discord.registerCommand('./discord/core/misc.js', 'removegame', 1);
        $.discord.registerSubCommand('module', 'list', 1);
        $.discord.registerSubCommand('module', 'enable', 1);
        $.discord.registerSubCommand('module', 'disable', 1);
        $.registerChatCommand('./discord/core/misc.js', 'discord', 1);
        $.registerChatSubcommand('discord', 'reconnect', 1);
    });

    /* Export the function to the $.discord api. */
    /* There are the same functions twice in here - that's normal and wanted. */
    $.discord = {
        getUserMention: getUserMention,
        userMention: getUserMention,
        removeGame: removeGame,
        userPrefix: userPrefix,
        setStream: setStream,
        setGame: setGame,
        setRole: setRole,
        say: say,
        resolve: {
            global: getUserMentionOrChannel,
            getUserMentionOrChannel: getUserMentionOrChannel
        },
        username: {
            resolve: getUserMention,
            random: getRandomUser,
            getUserMention: getUserMention,
            getRandomUser: getRandomUser
        }
    };
})();