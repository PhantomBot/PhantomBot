/**
 * This module is to handle online and offline events from Twitch.
 */
(function() {
	var onlineToggle = $.getSetIniDbBoolean('discordSettings', 'onlineToggle', false),
	    onlineMessage = $.getSetIniDbString('discordSettings', 'onlineMessage', '(name) just went online on Twitch!'),
	    offlineToggle = $.getSetIniDbBoolean('discordSettings', 'offlineToggle', false),
	    offlineMessage = $.getSetIniDbString('discordSettings', 'offlineMessage', '(name) is now offline.'),
	    gameToggle = $.getSetIniDbBoolean('discordSettings', 'gameToggle', false),
	    gameMessage = $.getSetIniDbString('discordSettings', 'gameMessage', '(name) just changed game on Twitch!'),
        botGameToggle = $.getSetIniDbBoolean('discordSettings', 'botGameToggle', true),
	    channelName = $.getSetIniDbString('discordSettings', 'onlineChannel', ''),
	    timeout = (300 * 6e4),
	    lastEvent = 0;

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/streamHandler.js')) {
            onlineToggle = $.getIniDbBoolean('discordSettings', 'onlineToggle', false);
            onlineMessage = $.getIniDbString('discordSettings', 'onlineMessage', '(name) just went online on Twitch!');
            offlineToggle = $.getIniDbBoolean('discordSettings', 'offlineToggle', false);
            offlineMessage = $.getIniDbString('discordSettings', 'offlineMessage', '(name) is now offline.');
            gameToggle = $.getIniDbBoolean('discordSettings', 'gameToggle', false);
            gameMessage = $.getIniDbString('discordSettings', 'gameMessage', '(name) just changed game on Twitch!');
            channelName = $.getIniDbString('discordSettings', 'onlineChannel', '');
            botGameToggle = $.getIniDbBoolean('discordSettings', 'botGameToggle', true);
        }
    });

    /**
     * @event twitchOffline
     */  
    $.bind('twitchOffline', function(event) {
        if (botGameToggle === true) {
            $.discord.removeGame();
        }

        // Make sure the channel is really offline before deleting and posting the data. Wait a minute and do another check.
        setTimeout(function() {
        	if (!$.isOnline($.channelName) && offlineToggle === true) {
        		var keys = $.inidb.GetKeyList('discordStreamStats', ''),
        			chatters = [],
        			viewers = [],
        			i;

        		// Get our data.
        		for (i in keys) {
        			switch (true) {
        				case keys[i].indexOf('chatters_') !== -1:
        					chatters.push($.getIniDbNumber('discordStreamStats', keys[i]));
        				case keys[i].indexOf('viewers_') !== -1:
        					viewers.push($.getIniDbNumber('discordStreamStats', keys[i]));
        			}
        		}

        		// Get average viewers.
        		var avgViewers = Math.round(viewers.reduce(function(a, b) {
        			return (a + b);
        		}) / (viewers.length < 1 ? 1 : viewers.length));

        		// Get average chatters.
        		var avgChatters = Math.round(chatters.reduce(function(a, b) {
        			return (a + b);
        		}) / (chatters.length < 1 ? 1 : chatters.length));

        		// Get new follows.
        		var follows = ($.getFollows($.channelName) - $.getIniDbNumber('discordStreamStats', 'followers', 0));

        		// Get max viewers.
        		var maxViewers = Math.max.apply(null, viewers);

        		// Get max chatters.
        		var maxChatters = Math.max.apply(null, chatters);

        		// Send the message as an embed.
        		$.discordAPI.sendMessageEmbed(channelName, new Packages.sx.blah.discord.util.EmbedBuilder()
        			.withColor(100, 65, 164)
        			.withThumbnail($.twitchcache.getLogoLink())
        			.withTitle(offlineMessage.replace('\(name\)', $.channelName))
        			.appendField($.lang.get('discord.streamhandler.offline.game'), $.getGame($.channelName), true)
        			.appendField($.lang.get('discord.streamhandler.offline.viewers'), $.lang.get('discord.streamhandler.offline.viewers.stat', avgViewers, maxViewers), true)
        			.appendField($.lang.get('discord.streamhandler.offline.chatters'), $.lang.get('discord.streamhandler.offline.chatters.stat', avgChatters, maxChatters), true)
        			.appendField($.lang.get('discord.streamhandler.offline.followers'), $.lang.get('discord.streamhandler.offline.followers.stat', follows, $.getFollows($.channelName)), true)
        			.withUrl('https://twitch.tv/' + $.channelName).bulid());

                $.inidb.RemoveFile('discordStreamStats');
        	}
        }, 6e4);
    });

	/**
	 * @event twitchOnline
	 */  
	$.bind('twitchOnline', function(event) {
		if (onlineToggle === false || channelName == '') {
			return;
		}

		if ($.systemTime() - $.getIniDbNumber('discordSettings', 'lastOnlineEvent', 0) >= timeout) {
			var s = onlineMessage;

			if (s.match(/\(name\)/)) {
				s = $.replace(s, '(name)', $.username.resolve($.channelName));
			}

			$.discordAPI.sendMessageEmbed(channelName, new Packages.sx.blah.discord.util.EmbedBuilder()
        		.withColor(100, 65, 164)
        		.withThumbnail($.twitchcache.getLogoLink())
        		.withTitle(s)
        		.appendField($.lang.get('discord.streamhandler.common.game'), $.getGame($.channelName), false)
        		.appendField($.lang.get('discord.streamhandler.common.title'), $.getStatus($.channelName), false)
        		.withUrl('https://twitch.tv/' + $.channelName)
        		.withImage($.twitchcache.getPreviewLink()).build());

            $.setIniDbNumber('discordSettings', 'lastOnlineEvent', $.systemTime());
		}
        if (botGameToggle === true) {
            $.discord.setStream($.getStatus($.channelName), ('https://twitch.tv/' + $.channelName));
        }
	});

	/**
	 * @event twitchGameChange
	 */  
	$.bind('twitchGameChange', function(event) {
		if (gameToggle === false || channelName == '' || $.isOnline($.channelName) == false) {
			return;
		}

		var s = gameMessage;

		if (s.match(/\(name\)/)) {
			s = $.replace(s, '(name)', $.username.resolve($.channelName));
		}

		$.discordAPI.sendMessageEmbed(channelName, new Packages.sx.blah.discord.util.EmbedBuilder()
        	.withColor(100, 65, 164)
        	.withThumbnail($.twitchcache.getLogoLink())
        	.withTitle(s)
        	.appendField($.lang.get('discord.streamhandler.common.game'), $.getGame($.channelName), false)
        	.appendField($.lang.get('discord.streamhandler.common.title'), $.getStatus($.channelName), false)
        	.appendField($.lang.get('discord.streamhandler.common.uptime'), $.getStreamUptime($.channelName).toString(), false)
        	.withUrl('https://twitch.tv/' + $.channelName)
        	.withImage($.twitchcache.getPreviewLink()).build());
	});

	/**
	 * @event discordChannelCommand
	 */
	$.bind('discordChannelCommand', function(event) {
		var sender = event.getSender(),
            channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('streamhandler')) {
        	if (action === undefined) {
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.usage'));
        		return;
        	}

        	/**
        	 * @discordcommandpath streamhandler toggleonline - Toggles the stream online announcements.
        	 */
        	if (action.equalsIgnoreCase('toggleonline')) {
        		onlineToggle = !onlineToggle;
        		$.inidb.set('discordSettings', 'onlineToggle', onlineToggle);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.toggle', (onlineToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        	}

        	/**
        	 * @discordcommandpath streamhandler onlinemessage [message] - Sets the stream online announcement message.
        	 */
        	if (action.equalsIgnoreCase('onlinemessage')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.message.usage'));
        			return;
        		}

        		onlineMessage = args.slice(1).join(' ');
        		$.inidb.set('discordSettings', 'onlineMessage', onlineMessage);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.online.message.set', onlineMessage));
        	}

        	/**
        	 * @discordcommandpath streamhandler toggleoffline - Toggles the stream offline announcements.
        	 */
        	if (action.equalsIgnoreCase('toggleoffline')) {
        		offlineToggle = !offlineToggle;
        		$.inidb.set('discordSettings', 'offlineToggle', offlineToggle);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.toggle', (offlineToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        	}

        	/**
        	 * @discordcommandpath streamhandler offlinemessage [message] - Sets the stream offline announcement message.
        	 */
        	if (action.equalsIgnoreCase('offlinemessage')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.message.usage'));
        			return;
        		}

        		offlineMessage = args.slice(1).join(' ');
        		$.inidb.set('discordSettings', 'offlineMessage', offlineMessage);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.offline.message.set', offlineMessage));
        	}

        	/**
        	 * @discordcommandpath streamhandler togglegame - Toggles the stream game change announcements.
        	 */
        	if (action.equalsIgnoreCase('togglegame')) {
        		gameToggle = !gameToggle;
        		$.inidb.set('discordSettings', 'gameToggle', gameToggle);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.toggle', (gameToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled')))); 
        	}

        	/**
        	 * @discordcommandpath streamhandler gamemessage [message] - Sets the stream game change announcement message.
        	 */
        	if (action.equalsIgnoreCase('gamemessage')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.message.usage'));
        			return;
        		}

        		gameMessage = args.slice(1).join(' ');
        		$.inidb.set('discordSettings', 'gameMessage', gameMessage);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.game.message.set', gameMessage));
        	}

            /**
             * @discordcommandpath streamhandler togglebotstatus - If enabled the bot will be marked as streaming with your Twitch title when you go live.
             */
            if (action.equalsIgnoreCase('togglebotstatus')) {
                botGameToggle = !botGameToggle;
                $.inidb.set('discordSettings', 'botGameToggle', botGameToggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.bot.game.toggle', (botGameToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled')))); 
            }

        	/**
        	 * @discordcommandpath streamhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
        	 */
        	if (action.equalsIgnoreCase('channel')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.channel.usage'));
        			return;
        		}

        		channelName = subAction.replace('#', '').toLowerCase();
        		$.inidb.set('discordSettings', 'onlineChannel', channelName);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.streamhandler.channel.set', channelName));
        	}
        }
	});

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/streamHandler.js')) {
            $.discord.registerCommand('./discord/handlers/streamHandler.js', 'streamhandler', 1);
            $.discord.registerSubCommand('streamhandler', 'toggleonline', 1);
            $.discord.registerSubCommand('streamhandler', 'onlinemessage', 1);
            $.discord.registerSubCommand('streamhandler', 'togglegame', 1);
            $.discord.registerSubCommand('streamhandler', 'gamemessage', 1);
            $.discord.registerSubCommand('streamhandler', 'channel', 1);

            // Get our viewer and follower count every 30 minutes.
            // Not the most accurate way, but it will work.
            var interval = setInterval(function() {
            	if ($.isOnline($.channelName)) {
            		var now = $.systemTime();

            		// Save this every time to make an average.
            		$.setIniDbNumber('discordStreamStats', 'chatters_' + now, $.users.length);
            		// Save this every time to make an average.
            		$.setIniDbNumber('discordStreamStats', 'viewers_' + now, $.getViewers($.channelName));
            		// Only set this one to get the difference at the end.
            		$.getSetIniDbNumber('discordStreamStats', 'followers', $.getFollows($.channelName));
            	}
            }, 18e5);
        }
    });
})();
