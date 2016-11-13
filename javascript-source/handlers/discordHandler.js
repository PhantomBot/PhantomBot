/**
 * The discord event gets a message event from Discord. This event contains the name
 * of the text channel, the user that sent the message in the channel, and the message.
 *
 * This is provided as a simplistic framework. It is not advised to attempt to run 
 * commands from Discord or attempt to call any of the other modules in PhantomBot
 * as those commands are meant to interact specifically with Twitch. Feel free to 
 * access the database, language entries, and items such as that, but do not attempt
 * to utilize any of the commands directly.
 *
 * Messages may be sent back to Discord using the following method:
 *     $.discord.sendMessage({String} channelName, {String} message);
 *
 * Note that the API indicates that there is a rate limit of 10 messages in 10 seconds.
 * The sendMessage() method therefore is rate limited and will only send one message
 * once every second. No burst logic is provided. 
 *
 * If you wish to use Discord, you will need to follow the directions on the following
 * website to register for an application and create a token to place into botlogin.txt.
 *
 *     https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
 *
 */
(function() {
    var lastStreamOnlineSend = 0,
        globalCooldown = $.getSetIniDbNumber('discordSettings', 'globalCooldown', 10),
        lastRandom,
        commands = {},
        cooldown = {},
        keywords = [],
        games = {
            ball: 0,
            random: 0,
            rouletteWin: 0,
            rouletteLost: 0,
            killSelf: 0,
            killOther: 0
        };

    /**
     * @function registerCommand
     * @info used to push the command into a object.
     *
     */
    function registerCommand(command) {
        if (command.includes(',')) {
            command = command.split(', ');
            for (var i in command) {
                commands[command[i]] = {
                    cooldown: $.getIniDbNumber('discordCooldown', command[i], -1),
                    command: null
                };
            }
            return;
        }
        commands[command] = {
            cooldown: $.getIniDbNumber('discordCooldown', command, -1),
            command: null
        };
    }

    /**
     * @function loadCommands
     * @info used to push the commands into a object.
     *
     */
    function loadCommands() {
        var keys = $.inidb.GetKeyList('discordCommands', ''),
            i;

        for (i in keys) {
            commands[keys[i]] = {
                cooldown: $.getIniDbNumber('discordCooldown', keys[i], -1),
                command: $.inidb.get('discordCommands', keys[i])
            };
        }
    }

    /**
     * @function loadKeywords
     * @info used to push the keywords into a object.
     *
     */
    function loadKeywords() {
        var keys = $.inidb.GetKeyList('discordKeywords', ''),
            i;

        for (i in keys) {
            keywords[keys[i]] = $.inidb.get('discordKeywords', keys[i]);
        }
    }

    /**
     * @function load8Balls
     * @info used to load 8ball responses.
     *
     */
    function load8Balls() {
        for (var i = 1; $.lang.exists('8ball.answer.' + i); i++) {
            games.ball++;
        }
    }

    /**
     * @function loadRandoms
     * @info used to load random responses.
     *
     */
    function loadRandoms() {
        for (var i = 1; $.lang.exists('randomcommand.' + i); i++) {
            games.random++;
        }
    }

    /**
     * @function loadRoulette
     * @info used to load roulette responses.
     *
     */
    function loadRoulette() {
        for (var i = 1; $.lang.exists('roulette.win.' + i); i++) {
            games.rouletteWin++;
        }

        for (var i = 1; $.lang.exists('roulette.lost.' + i); i++) {
            games.rouletteLost++;
        }
    }

    /**
     * @function loadKills
     * @info used to load kill responses.
     *
     */
    function loadKills() {
        for (var i = 1; $.lang.exists('killcommand.self.' + i); i++) {
            games.killSelf++;
        }
        for (var i = 1; $.lang.exists('killcommand.other.' + i); i++) {
            games.killOther++;
        }
    }

    /**
     * @function userPrefix
     * @info Used to mention a user.
     *
     * @param {string} sender
     * @returns {string}
     */
    function userPrefix(sender) {
        return (sender + ', ');
    }

    /**
     * @function tags
     * @info Used for command tags
     *
     * @param {object} event
     * @param {array} args
     * @param {string} message
     * @returns {string}
     */
    function tags(event, args, message) {
        /**
         * @info Matched (sender) in the command, and replaces with a the sender's name.
         */
        if (message.match(/\(sender\)/g)) {
            message = $.replace(message, '(sender)', event.getDiscordUser());
        }

        /**
         * @info Matched (@sender) in the command, and replaces with a ping for that sender.
         */
        if (message.match(/\(@sender\)/g)) {
            message = $.replace(message, '(@sender)', userPrefix(event.getDiscordUserMentionAs()));
        }

        /**
         * @info Matched (touser) in the command, and replaces with either the sender, or the argument after the command.
         */
        if (message.match(/\(touser\)/g)) {
            message = $.replace(message, '(touser)', (args[1] ? args[1].toString() : event.getDiscordUser()));
        }

        /**
         * @info Matched (#) in the command, and replaces with a random number from 1-100
         */
        if (message.match(/\(#\)/g)) {
            message = $.replace(message, '(#)', $.randRange(1, 100).toString());
        }

        /**
         * @info Matched (status) in the command, and replaces with your Twitch title.
         */
        if (message.match(/\(status\)/g)) {
            message = $.replace(message, '(status)', $.getStatus($.channelName));
        }

        /**
         * @info Matched (game) in the command, and replaces with your Twitch game.
         */
        if (message.match(/\(game\)/g)) {
            message = $.replace(message, '(game)', $.getGame($.channelName));
        }

        /**
         * @info Matched (uptime) in the command, and replaces with your stream uptime if you're live.
         */
        if (message.match(/\(uptime\)/g)) {
            if ($.isOnline($.channelName)) {
                message = $.replace(message, '(uptime)', $.getStreamUptime($.channelName));
            } else {
                message = $.replace(message, '(uptime)', '0 seconds.');
            }
        }

        /**
         * @info Matched (echo) in the command, and replaces with anything said after the command.
         */
        if (message.match(/\(echo\)/g)) {
            if (args[1] !== undefined) {
                message = $.replace(message, '(echo)', event.getDiscordMessage().substring(event.getDiscordMessage().indexOf(args[0]) + args[0].length() + 1));
            }
        }

        /**
         * @info Matched (8ball) in the command, and replaces with the correct response.
         */
        if (message.match(/\(8ball\)/g)) {
            if (args[1] === undefined) {
                message = $.replace(message, '(8ball)', 'Ask me a question.');
            } else {
                message = $.replace(message, '(8ball)', $.lang.get('8ball.answer.' + $.randRange(1, games.ball)));
            }
        }

        /**
         * @info Matched (random) in the command, and replaces with the correct response.
         */
        if (message.match(/\(random\)/g)) {
            message = $.replace(message, '(random)', $.lang.get('randomcommand.' + $.randRange(1, games.random)));
        }

        /**
         * @info Matched (roulette) in the command, and replaces with the correct response.
         */
        if (message.match(/\(roulette\)/g)) {
            if ($.randRange(1, 2) == 1) {
                message = $.replace(message, '(roulette)', $.lang.get('roulette.win.' + $.randRange(1, games.rouletteWin), event.getDiscordUserMentionAs()));
            } else {
                message = $.replace(message, '(roulette)', $.lang.get('roulette.lost.' + $.randRange(1, games.rouletteLost), event.getDiscordUserMentionAs()));
            }
        }

        /**
         * @info Matched (kill) in the command, and replaces with the correct response.
         */
        if (message.match(/\(kill\)/g)) {
            if (args[1] === undefined) {
                message = $.replace(message, '(kill)', $.lang.get('killcommand.self.' + $.randRange(1, games.killSelf), event.getDiscordUserMentionAs()));
            } else {
                message = $.replace(message, '(kill)', $.lang.get('killcommand.other.' + $.randRange(1, games.killOther), event.getDiscordUserMentionAs(), args[1], 10, '<@' + $.discord.jda().getSelfInfo().getId() + '>').replace('(jail)', ''));
            }
        }

        /* Returns the message with the edits. */
        return message;
    }

    /**
     * @function cooldown
     * @info Used for command cooldowns.
     *
     * @param {object} event
     * @param {string} command
     * @returns {int} 0 or 1
     */
    function coolDown(event, command) {
        /* Checks if the user is a admin, if so he ignores the cooldown. return 0 */
        if (event.isAdmin() == true) {
            return 0;
        }


        /* Checks if the command is in the command object. */
        if (cooldown[command] === undefined) {
            if (commands[command].cooldown !== -1 && commands[command].cooldown !== 0) {
                cooldown[command] = ((commands[command].cooldown * 1000) + $.systemTime());
            } else if (commands[command].cooldown !== -1) {
                cooldown[command] = ((globalCooldown * 1000) + $.systemTime());
            }
        } else {
            /* Checks if the command is on cooldown still. */
            if ((cooldown[command] - $.systemTime()) >= 0) {
                return 1;
            } else {
                if (commands[command].cooldown !== -1 && commands[command].cooldown !== 0) {
                    cooldown[command] = ((commands[command].cooldown * 1000) + $.systemTime());
                } else if (commands[command].cooldown !== -1) {
                    cooldown[command] = ((globalCooldown * 1000) + $.systemTime());
                }
            }
        }
        /* the command is no longer on cooldown if it makes it here. so return 0 */
        return 0;
    }

    /**
     * @function commandEvent
     * @info Used for commands.
     *
     * @param {object} event
     */
    function commandEvent(commandString, event) {
        var sender = event.getDiscordUser(),
            mention = event.getDiscordUserMentionAs(),
            message = event.getDiscordMessage(),
            channel = event.getDiscordChannel(),
            arguments,
            command,
            split,
            args;

        /* Handles the argument parsing. */
        if (message.includes(' ')) {
            split = message.indexOf(' ');
            command = message.substring(0, split).replace('!', '').toLowerCase();
            arguments = message.substring(split + 1);
        } else {
            command = commandString.toLowerCase();
        }

        args = message.split(' ');

        /* Check if the command is on cooldown. */
        if (coolDown(event, command) === 1) {
            return;
        }

        /* Handles custom commands. */
        if (commands[command] !== undefined && commands[command].command !== null) {
            $.discord.sendMessage(channel, tags(event, args, commands[command].command));
            return;
        }

        /* Handles the other admin only commands. */
        if (command.equalsIgnoreCase('addcom')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined || args[2] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.addcom.usage'));
                    return;
                }

                $.inidb.set('discordCommands', args[1].replace('!', '').toLowerCase(), arguments.substring(args[1].length() + 1));
                loadCommands();
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.addcom.success', args[1].replace('!', '').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('editcom')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined || args[2] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editcom.usage'));
                    return;
                } else if (!$.inidb.exists('discordCommands', args[1].replace('!', '').toLowerCase())) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editcom.404'));
                    return;
                }

                $.inidb.set('discordCommands', args[1].replace('!', '').toLowerCase(), arguments.substring(args[1].length()));
                loadCommands();
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editcom.success', args[1].replace('!', '').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('delcom')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delcom.usage'));
                    return;
                } else if (!$.inidb.exists('discordCommands', args[1].replace('!', '').toLowerCase())) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delcom.404'));
                    return;
                }

                $.inidb.del('discordCommands', args[1].replace('!', '').toLowerCase());
                delete commands[args[1].replace('!', '').toLowerCase()];
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delcom.success', args[1].replace('!', '').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('coolcom')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined || args[2] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.coolcom.usage'));
                    return;
                } else if (!args[1].replace('!', '').toLowerCase().equalsIgnoreCase('global') && !$.inidb.exists('discordCommands', args[1].replace('!', '').toLowerCase())) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.coolcom.404'));
                    return;
                }

                if (args[1].equalsIgnoreCase('global')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.coolcom.global.success', args[2]));
                    globalCooldown = parseInt(args[2]);
                    $.inidb.set('discordSettings', 'globalCooldown', globalCooldown);
                    return;
                }

                commands[args[1].replace('!', '').toLowerCase()].cooldown = parseInt(args[2]);
                $.inidb.set('discordCooldown', args[1].replace('!', '').toLowerCase(), args[2]);
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.coolcom.success', args[1].replace('!', '').toLowerCase(), args[2]));
            }
        } else if (command.equalsIgnoreCase('addkey')) {
            if (event.isAdmin() == true || args[2] === undefined) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.addkey.usage'));
                    return;
                }

                $.inidb.set('discordKeywords', args[1].split('_').join(' ').toLowerCase(), arguments.substring(args[1].length() + 1));
                keywords[args[1].split('_').join(' ').toLowerCase()] = arguments.substring(args[1].length() + 1);
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.addkey.success', args[1].split('_').join(' ').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('editkey')) {
            if (event.isAdmin() == true || args[2] === undefined) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editkey.usage'));
                    return;
                } else if (!$.inidb.exists('discordKeywords', args[1].replace('!', '').toLowerCase())) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editkey.404'));
                    return;
                }

                $.inidb.set('discordKeywords', args[1].split('_').join(' ').toLowerCase(), arguments.substring(args[1].length() + 1));
                keywords[args[1].split('_').join(' ').toLowerCase()] = arguments.substring(args[1].length() + 1);
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editkey.success', args[1].replace('!', '').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('delkey')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delkey.usage'));
                    return;
                } else if (!$.inidb.exists('discordKeywords', args[1].split('_').join(' ').toLowerCase())) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delkey.404'));
                    return;
                }

                $.inidb.del('discordKeywords', args[1].replace('!', '').toLowerCase());
                delete keywords[args[1].replace('!', '').toLowerCase()];
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delkey.success', args[1].replace('!', '').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('announcetwitchfollowers')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.follower.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.follower.disabled'));
                    $.inidb.del('discordSettings', 'followerChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.follower.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'followerChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announcetwitchsubscribers')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.subscriber.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.subscriber.disabled'));
                    $.inidb.del('discordSettings', 'subscriberChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.subscriber.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'subscriberChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announcetwitchresubscribers')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.resubscriber.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.resubscriber.disabled'));
                    $.inidb.del('discordSettings', 'resubscriberChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.resubscriber.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'resubscriberChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announcetweets')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.tweets.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.tweets.disabled'));
                    $.inidb.del('discordSettings', 'tweetChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'tweetChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announceonline')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.online.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.online.disabled'));
                    $.inidb.del('discordSettings', 'onlineChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.online.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'onlineChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announcegamewispsubscribers')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.gamewisp.subscriber.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.gamewisp.subscriber.disabled'));
                    $.inidb.del('discordSettings', 'gamewispsubscriberChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.gamewisp.subscriber.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'gamewispsubscriberChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announcegamewispresubscribers')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.gamewisp.resubscriber.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.gamewisp.resubscriber.disabled'));
                    $.inidb.del('discordSettings', 'gamewispresubscriberChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.gamewisp.resubscriber.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'gamewispresubscriberChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        }  else if (command.equalsIgnoreCase('announcestreamtips')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.streamtip.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.streamtip.disabled'));
                    $.inidb.del('discordSettings', 'streamtipChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.streamtip.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'streamtipChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('announcestreamlabs')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.streamlabs.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('disable')) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.streamlabs.disabled'));
                    $.inidb.del('discordSettings', 'streamlabsChannel');
                } else {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.streamlabs.enabled', args[1].replace('#', '').toLowerCase()));
                    $.inidb.set('discordSettings', 'streamlabsChannel', args[1].replace('#', '').toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('botcommands')) {
            if (event.isAdmin() == true) {
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.botcommands'));
                return;
            }
        } else if (command.equalsIgnoreCase('commandtags')) {
            if (event.isAdmin() == true) {
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.command.tags'));
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.game.tags'));
                return;
            }
        } else if (command.equalsIgnoreCase('commands')) {
            var cmds = [],
                keys = $.inidb.GetKeyList('discordCommands', ''),
                i;

            for (i in keys) {
                cmds.push('!' + keys[i]);
            }
            if (cmds.length === 0) {
                return;
            }
            $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.commands', cmds.join(', ')));
            return;
        } else if (command.equalsIgnoreCase('keywords')) {
            var keyys = [],
                keys = $.inidb.GetKeyList('discordKeywords', ''),
                i;

            for (i in keys) {
                keyys.push(keys[i]);
            }
            if (keyys.length === 0) {
                return;
            }
            $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.keywords', keyys.join(', ')));
            return;
        }
    }

    /*
     * @event discord
     */
    $.bind('discord', function(event) {
        var discordChannel = event.getDiscordChannel(),
            discordUser = event.getDiscordUser(),
            discordMessage = event.getDiscordMessage();

        /* Don't read our own messages, this could create a loop. */
        if ($.discord.jda().getSelfInfo().getId() == event.getId()) {
            return;
        }

        /* Prints the discord message in the console. */
        $.consoleLn('[DISCORD] [#' + discordChannel + '] ' + discordUser + ': ' + discordMessage);

        /* Checks if the message is a command. */
        if (discordMessage.startsWith('!')) {
            commandEvent(discordMessage.substring(1), event);
            return;
        }

        /* Checks if the message has any keywords. Also works with regex.*/
        for (var i in Object.keys(keywords)) {
            if (discordMessage.match(Object.keys(keywords)[i])) {
                $.discord.sendMessage(discordChannel, String(keywords[Object.keys(keywords)[i]]).replace(/\(sender\)/g, discordUser).replace(/\(@sender\)/g, event.getDiscordUserMentionAs()));
                return;
            }
        }
    });

/* Load these hooks last (7 sec delay), I want the Twitch modules to have the event sent first. */
setTimeout(function() {
    /*
     * @event twitchOnline
     *
     * Send a message to a Discord Channel to indicate that the stream is online. 
     * Only send once every 8 hours because we get a crap load of online events.
     */
    $.bind('twitchOnline', function(event) {
        var now = $.systemTime();
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'onlineChannel', '') != '') {
            $.discord.jda().getAccountManager().setStreaming($.getStatus($.channelName), 'https://www.twitch.tv/' + $.channelName);
            if (now - lastStreamOnlineSend > (480 * 6e4)) {//8 hour delay here, because Twitch always sends a lot of online events.
                lastStreamOnlineSend = now;
                $.discord.sendMessage($.getIniDbString('discordSettings', 'onlineChannel', ''), $.lang.get('discord.streamonline', $.channelName, $.getGame($.channelName), $.getStatus($.channelName)));
            }
        }
    });

    /*
     * @event twitchOffline
     *
     * Sets the stream as offline.
     */
    $.bind('twitchOffline', function(event) {
        $.discord.jda().getAccountManager().setStreaming('', '');
    });

    /*
     * @event twitchFollow
     *
     * Announces new Twitch followers in a specific channel if the user enables it. 
     */
    $.bind('twitchFollow', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.announceFollows && $.getIniDbString('discordSettings', 'followerChannel', '') != '') {
            $.discord.sendMessage($.getIniDbString('discordSettings', 'followerChannel', ''), $.lang.get('discord.newfollow', event.getFollower(), $.channelName));
        }
    });

    /*
     * @event NewSubscriber
     *
     * Announces new Twitch subscribers in a specific channel if the user enables it. 
     */
    $.bind('NewSubscriber', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'subscriberChannel', '') != '') {
            $.discord.sendMessage($.getIniDbString('discordSettings', 'subscriberChannel', ''), $.lang.get('discord.newsub', event.getSub(), $.channelName));
        }
    });

    /*
     * @event NewReSubscriber
     *
     * Announces new Twitch resubscribers in a specific channel if the user enables it. 
     */
    $.bind('NewReSubscriber', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'resubscriberChannel', '') != '') {
            $.discord.sendMessage($.getIniDbString('discordSettings', 'resubscriberChannel', ''), $.lang.get('discord.newresub', event.getReSub(), event.getReSubMonths(), $.channelName));
        }
    });

    /*
     * @event twitter
     *
     * Announces new Tweets retweets and mentions.
     */
    $.bind('twitter', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'tweetChannel', '') != '') {
            if (event.getMentionUser() != null) {
                $.discord.sendMessage($.getIniDbString('discordSettings', 'tweetChannel', ''), $.lang.get('discord.tweet.mention', event.getMentionUser(), event.getTweet()).replace('(twitterid)', $.twitter.getUsername() + ''));
            } else {
                $.discord.sendMessage($.getIniDbString('discordSettings', 'tweetChannel', ''), $.lang.get('discord.tweet', event.getTweet()).replace('(twitterid)', $.twitter.getUsername() + ''));
            }
        }
    });

    /*
     * @event gameWispSubscribe
     *
     * Announces new gamewisp subs.
     */
    $.bind('gameWispSubscribe', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'gamewispsubscriberChannel', '') != '') {
            $.discord.sendMessage($.getIniDbString('discordSettings', 'gamewispsubscriberChannel', ''), $.lang.get('discord.gamewisp.newsub', event.getUsername(), $.channelName));
        }
    });

    /*
     * @event gameWispSubscribe
     *
     * Announces new gamewisp resubs.
     */
    $.bind('gameWispAnniversary', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'gamewispresubscriberChannel', '') != '') {
            $.discord.sendMessage($.getIniDbString('discordSettings', 'gamewispresubscriberChannel', ''), $.lang.get('discord.gamewisp.renewsub', event.getUsername(), event.getMonths(), $.channelName));
        }
    });

    /*
     * @event twitchAlertsDonation
     *
     * Announces donations from streamlabs
     */
    $.bind('twitchAlertsDonation', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'streamlabsChannel', '') != '') {
            var donationJsonStr = event.getJsonString(),
                JSONObject = Packages.org.json.JSONObject,
                donationJson = new JSONObject(donationJsonStr);

            /** Make the json into variables that we can then use tags with */
            var donationID = donationJson.getString("donation_id"),
                donationCreatedAt = donationJson.getString("created_at"),
                donationCurrency = donationJson.getString("currency"),
                donationAmount = parseFloat(donationJson.getString("amount")),
                donationUsername = donationJson.getString("name"),
                donationMsg = donationJson.getString("message");

            if ($.inidb.exists('discordDonations', 'streamlabs' + donationID)) {
                return;
            } else {
                $.inidb.set('discordDonations', 'streamlabs' + donationID, 'true');
            }

            $.discord.sendMessage($.getIniDbString('discordSettings', 'streamlabsChannel', ''), $.lang.get('discord.streamlabs', donationCurrency, donationAmount, donationUsername, donationMsg, $.channelName));
        }
    });

    /*
     * @event streamTipDonation
     *
     * Announces donations from streamtip
     */
    $.bind('streamTipDonation', function(event) {
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'streamtipChannel', '') != '') {
            var donationJsonStr = event.getJsonString(),
                JSONObject = Packages.org.json.JSONObject,
                donationJson = new JSONObject(donationJsonStr);

            /** Make the json into variables that we can then use tags with */
            var donationID = donationJson.getString("_id"),
                donationCreatedAt = donationJson.getString("date"),
                donationCurrency = donationJson.getString("currencyCode"),
                donationCurrencySymbol = donationJson.getString("currencySymbol"),
                donationAmount = parseFloat(donationJson.getString("amount")),
                donationUsername = donationJson.getString("username"),
                donationMsg = donationJson.getString("note");

            if ($.inidb.exists('discordDonations', 'streamtip' + donationID)) {
                return;
            } else {
                $.inidb.set('discordDonations', 'streamtip' + donationID, 'true');
            }

            $.discord.sendMessage($.getIniDbString('discordSettings', 'streamtipChannel', ''), $.lang.get('discord.streamtip', donationCurrency, donationAmount, donationCurrencySymbol, donationUsername, donationMsg, $.channelName));
        }
    });
}, 7000);

    // cool things here.
    loadCommands();
    loadKeywords();
    load8Balls();
    loadRandoms();
    loadRoulette();
    loadKills();

    /* Registers the default commands. */
    registerCommand('addcom, editcom, delcom, coolcom, addkey, editkey, delkey, commands, keywords, botcommands, commandtags, announcetwitchfollowers, announcetwitchsubscribers, announcetwitchresubscribers, announcetweets, announceonline, announcegamewispsubscribers, announcegamewispresubscribers, announcestreamlabs, announcestreamtip');
})();
