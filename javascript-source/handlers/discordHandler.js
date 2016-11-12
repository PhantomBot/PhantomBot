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
        commands = [],
        keywords = [];

    /**
     * @function loadCommands
     * @info used to push the commands into a object.
     *
     */
    function loadCommands() {
        var keys = $.inidb.GetKeyList('discordCommands', ''),
            i;

        for (i in keys) {
            commands[keys[i]] = $.inidb.get('discordCommands', keys[i]);
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
        if (commands[command] !== undefined) {
            $.discord.sendMessage(channel, String(commands[command]).replace(/\(sender\)/g, sender).replace(/\(@sender\)/g, userPrefix(mention)).replace(/\(touser\)/g, (args[1] !== undefined ? args[1] : '').replace(/\(#\)/g, String($.randRange(1, 100)))));
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
                commands[args[1].replace('!', '').toLowerCase()] = arguments.substring(args[1].length() + 1);
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
                commands[args[1].replace('!', '').toLowerCase()] = arguments.substring(args[1].length() + 1);
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

        $.consoleLn('[DISCORD] [#' + discordChannel + '] ' + discordUser + ': ' + discordMessage);

        if (discordMessage.startsWith('!')) {
            commandEvent(discordMessage.substring(1), event);
            return;
        }

        for (var i in Object.keys(keywords)) {
            if (discordMessage.match(Object.keys(keywords)[i])) {
                $.discord.sendMessage(discordChannel, String(keywords[Object.keys(keywords)[i]]).replace(/\(sender\)/g, discordUser).replace(/\(@sender\)/g, event.getDiscordUserMentionAs()));
                return;
            }
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

    // Load command and keywords here. 
    loadCommands();
    loadKeywords();
})();
