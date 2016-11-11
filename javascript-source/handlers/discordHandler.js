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
    var lastStreamOnlineSend = 0;

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
     * @function commandEvent
     * @info Used for commands.
     *
     * @param {object} event
     */
    function commandEvent(commandString, event) {
        var sender = event.getDiscordUser().toLowerCase(),
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
            command = message.substring(0, split).replace('!', '');
            arguments = message.substring(split + 1);
        } else {
            command = commandString;
        }

        args = message.split(' ');

        /* Handles custom commands. */
        if ($.inidb.exists('discordCommands', command)) {
            $.discord.sendMessage(channel, $.inidb.get('discordCommands', command).replace('(sender)', sender).replace('(@sender)', userPrefix(mention)));
            return;
        }

        /* Handles the other admin only commands. */
        if (command.equalsIgnoreCase('addcom')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.addcom.usage'));
                    return;
                }

                $.inidb.set('discordCommands', args[1].replace('!', '').toLowerCase(), arguments.substring(args[1].length()));
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.addcom.success', args[1].replace('!', '').toLowerCase()));
                return;
            }
        } else if (command.equalsIgnoreCase('editcom')) {
            if (event.isAdmin() == true) {
                if (args[1] === undefined) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editcom.usage'));
                    return;
                } else if (!$.inidb.exists('discordCommands', args[1].replace('!', '').toLowerCase())) {
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.editcom.404'));
                    return;
                }

                $.inidb.set('discordCommands', args[1].replace('!', '').toLowerCase(), arguments.substring(args[1].length()));
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
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.delcom.success', args[1].replace('!', '').toLowerCase()));
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
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.follower.enabled', args[1].toLowerCase()));
                    $.inidb.set('discordSettings', 'followerChannel', args[1].toLowerCase());
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
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.subscriber.enabled', args[1].toLowerCase()));
                    $.inidb.set('discordSettings', 'subscriberChannel', args[1].toLowerCase());
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
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.resubscriber.enabled', args[1].toLowerCase()));
                    $.inidb.set('discordSettings', 'resubscriberChannel', args[1].toLowerCase());
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
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.enabled', args[1].toLowerCase()));
                    $.inidb.set('discordSettings', 'tweetChannel', args[1].toLowerCase());
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
                    $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.announce.online.enabled', args[1].toLowerCase()));
                    $.inidb.set('discordSettings', 'onlineChannel', args[1].toLowerCase());
                }
                return;
            }
        } else if (command.equalsIgnoreCase('botcommands')) {
            if (event.isAdmin() == true) {
                $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.botcommands'));
                return;
            }
        } else if (command.equalsIgnoreCase('commands')) {
            var commands = [],
                keys = $.inidb.GetKeyList('discordCommands', ''),
                i;

            for (i in keys) {
                commands.push('!' + keys[i]);
            }
            $.discord.sendMessage(channel, userPrefix(mention) + $.lang.get('discord.commands', commands.join(', ')));
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

        $.consoleLn('[DISCORD] [#' + discordChannel + '] ' + discordUser + ': ' + discordMessage);

        if (discordMessage.startsWith('!')) {
            commandEvent(discordMessage.substring(1), event);
            return;
        }
    });

    /*
     * @event twitchOnline
     *
     * Send a message to a Discord Channel to indicate that the stream is online. 
     * Only send once every 8 hours because we get a crap load of online events.
     */
    $.bind('twitchOnline', function(event) {
        var now = $.systemTime();
        if ($.bot.isModuleEnabled('./handlers/discordHandler.js') && $.getIniDbString('discordSettings', 'onlineChannel', '') != '') {
            $.discord.jda().getAccountManager().setStreaming($.getStatus($.channelName), 'https://twitch.tv/' + $.channelName);
            if (now - lastStreamOnlineSend > (480 * 6e4)) {
                lastStreamOnlineSend = now;
                $.discord.sendMessage($.getIniDbString('discordSettings', 'onlineChannel', ''), $.lang.get('discord.streamonline', $.username.resolve($.channelName)));
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
})();
