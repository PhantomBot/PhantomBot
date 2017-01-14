/**
 * This module is to handle follower announcements.
 */
(function() {
	var toggle = $.getSetIniDbBoolean('discordSettings', 'followToggle', false),
	    message = $.getSetIniDbString('discordSettings', 'followMessage', '(name) just followed!'),
	    channelName = $.getSetIniDbString('discordSettings', 'followChannel', ''),
	    announce = false;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/followHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'followToggle', false);
            message = $.getIniDbString('discordSettings', 'followMessage', '(name) just followed!');
            channelName = $.getIniDbString('discordSettings', 'followChannel', '');
        }
    });

    /**
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function(event) {
        announce = true;
    });

	/**
	 * @event twitchFollow
	 */
	$.bind('twitchFollow', function(event) {
		var follower = event.getFollower(),
            s = message;

        if (toggle === false || announce === false || channelName == '') {
        	return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', follower);
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

        if (command.equalsIgnoreCase('followhandler')) {
        	if (action === undefined) {
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.usage'));
        		return;
        	}

        	/**
        	 * @discordcommandpath followhandler toggle - Toggles the follower announcements.
        	 */
        	if (action.equalsIgnoreCase('toggle')) {
        		toggle = !toggle;
        		$.inidb.set('discordSettings', 'followToggle', toggle);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        	}

        	/**
        	 * @discordcommandpath followhandler message [message] - Sets the follower announcement message.
        	 */
        	if (action.equalsIgnoreCase('message')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.message.usage'));
        			return;
        		}

        		message = args.slice(1).join(' ');
        		$.inidb.set('discordSettings', 'followMessage', message);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.message.set', message));
        	}

        	/**
        	 * @discordcommandpath followhandler channel [channel name] - Sets the channel that announcements from this module will be said in.
        	 */
        	if (action.equalsIgnoreCase('channel')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.channel.usage'));
        			return;
        		}

        		channelName = subAction.replace('#', '').toLowerCase();
        		$.inidb.set('discordSettings', 'followChannel', channelName);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.followhandler.follow.channel.set', channelName));
        	}
        }
    });

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/followHandler.js')) {
            $.discord.registerCommand('./discord/handlers/followHandler.js', 'followhandler', 1);
            $.discord.registerSubCommand('followhandler', 'toggle', 1);
            $.discord.registerSubCommand('followhandler', 'message', 1);
            $.discord.registerSubCommand('followhandler', 'channel', 1);

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
