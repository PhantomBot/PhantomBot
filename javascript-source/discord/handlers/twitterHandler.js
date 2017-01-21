/**
 * This module is to handle Twitter notifications.
 */
(function() {
	var toggle = $.getSetIniDbBoolean('discordSettings', 'twitterToggle', false),
	    channelName = $.getSetIniDbString('discordSettings', 'twitterChannel', ''),
	    announce = false;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/twitterHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'twitterToggle', false);
            channelName = $.getIniDbString('discordSettings', 'twitterChannel', '');
        }
    });

	/**
     * @event twitter
     */
    $.bind('twitter', function(event) {
    	if (toggle === false || announce === false || channelName == '') {
    		return;
    	}

    	if (event.getMentionUser() != null) {
            $.discord.say(channelName, $.lang.get('twitter.tweet.mention', event.getMentionUser(), event.getTweet()).replace('(twitterid)', $.twitter.getUsername() + ''));
        } else {
            $.discord.say(channelName, $.lang.get('twitter.tweet', event.getTweet()).replace('(twitterid)', $.twitter.getUsername() + ''));
        }
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

        if (command.equalsIgnoreCase('twitterhandler')) {
        	if (action === undefined) {
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.usage'));
        		return;
        	}

        	/**
        	 * @discordcommandpath twitterhandler toggle - Toggles Twitter announcements. Note this module will use settings from the main Twitter module.
        	 */
        	if (action.equalsIgnoreCase('toggle')) {
        		toggle = !toggle;
        		$.inidb.set('discordSettings', 'twitterToggle', toggle);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        	}

        	/**
        	 * @discordcommandpath twitterhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
        	 */
        	if (action.equalsIgnoreCase('channel')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.channel.usage'));
        			return;
        		}

        		channelName = subAction.replace('#', '').toLowerCase();
        		$.inidb.set('discordSettings', 'twitterChannel', channelName);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.twitterhandler.channel.set', channelName));
        	}
        }
    });

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/twitterHandler.js')) {
            $.discord.registerCommand('./discord/handlers/twitterHandler.js', 'twitterhandler', 1);
            $.discord.registerSubCommand('twitterhandler', 'toggle', 1);
            $.discord.registerSubCommand('twitterhandler', 'channel', 1);

            announce = true;
            // $.unbind('initReady'); Needed or not?
        }
    });
})();