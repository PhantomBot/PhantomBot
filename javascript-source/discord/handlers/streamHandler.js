/**
 * This module is to handle online and offline events from Twitch.
 */
(function() {
	var onlineToggle = $.getSetIniDbBoolean('discordSettings', 'onlineToggle', false),
	    onlineMessage = $.getSetIniDbString('discordSettings', 'onlineMessage', '(name) just went online on Twitch with (game)! (url)'),
	    gameToggle = $.getSetIniDbBoolean('discordSettings', 'gameToggle', false),
	    gameMessage = $.getSetIniDbString('discordSettings', 'gameMessage', '(name) just changed game on Twitch to (game)! (url)'),
        botGameToggle = $.getSetIniDbBoolean('discordSettings', 'botGameToggle', true),
	    channelName = $.getSetIniDbString('discordSettings', 'onlineChannel', ''),
	    timeout = (300 * 6e4),
	    lastEvent = 0;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/streamHandler.js')) {
            onlineToggle = $.getIniDbBoolean('discordSettings', 'onlineToggle', false);
            onlineMessage = $.getIniDbString('discordSettings', 'onlineMessage', '(name) just went online on Twitch with (game)! (url)');
            gameToggle = $.getIniDbBoolean('discordSettings', 'gameToggle', false);
            gameMessage = $.getIniDbString('discordSettings', 'gameMessage', '(name) just changed game on Twitch to (game)! (url)');
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

			if (s.match(/\(url\)/)) {
				s = $.replace(s, '(url)', ('https://twitch.tv/' + $.channelName));
			}

			if (s.match(/\(game\)/)) {
				s = $.replace(s, '(game)', $.getGame($.channelName));
			}

			if (s.match(/\(title\)/)) {
				s = $.replace(s, '(title)', $.getStatus($.channelName));
			}

            if (s.match(/\(follows\)/)) {
                s = $.replace(s, '(follows)', $.getFollows($.channelName).toString());
            }

			$.discord.say(channelName, s);
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

		if (s.match(/\(url\)/)) {
			s = $.replace(s, '(url)', ('https://twitch.tv/' + $.channelName));
		}

		if (s.match(/\(game\)/)) {
			s = $.replace(s, '(game)', $.getGame($.channelName));
		}

		if (s.match(/\(title\)/)) {
			s = $.replace(s, '(title)', $.getStatus($.channelName));
		}

		if (s.match(/\(uptime\)/)) {
			s = $.replace(s, '(uptime)', $.getStreamUptime($.channelName).toString());
		}

        if (s.match(/\(follows\)/)) {
            s = $.replace(s, '(follows)', $.getFollows($.channelName).toString());
        }

        if (s.match(/\(viewers\)/)) {
            s = $.replace(s, '(viewers)', $.getViewers($.channelName).toString());
        }

		$.discord.say(channelName, s);
	});

	/**
	 * @event discordCommand
	 */
	$.bind('discordCommand', function(event) {
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

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
