/**
 * This module is to handle bits notifications.
 */
(function() {
	var toggle = $.getSetIniDbBoolean('discordSettings', 'bitsToggle', false),
	    message = $.getSetIniDbString('discordSettings', 'bitsMessage', '(name) just cheered (amount) bits!'),
	    channelName = $.getSetIniDbString('discordSettings', 'bitsChannel', ''),
	    announce = false;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/bitsHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'bitsToggle', false);
            message = $.getIniDbString('discordSettings', 'bitsMessage', '(name) just cheered (amount) bits!');
            channelName = $.getIniDbString('discordSettings', 'bitsChannel', '');
        }
    });

	/**
	 * @event bits
	 */
	$.bind('bits', function(event) {
		var username = event.getUsername(),
		    bits = event.getBits(),
		    s = message;

		if (announce === false || toggle === false || channelName == '') {
			return;
		}

		if (s.match(/\(name\)/g)) {
			s = $.replace(s, '(name)', username);
		}

		if (s.match(/\(amount\)/g)) {
			s = $.replace(s, '(amount)', bits);
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

        if (command.equalsIgnoreCase('bitshandler')) {
        	if (action === undefined) {
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.usage'));
        		return;
        	}

        	/**
        	 * @discordcommandpath bitshandler toggle - Toggles bit announcements.
        	 */
        	if (action.equalsIgnoreCase('toggle')) {
        		toggle = !toggle;
        		$.inidb.set('discordSettings', 'bitsToggle', toggle);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
        	}

        	/**
        	 * @discordcommandpath bitshandler message [message] - Sets the bit announcement message.
        	 */
        	if (action.equalsIgnoreCase('message')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.message.usage'));
        			return;
        		}

        		message = args.slice(1).join(' ');
        		$.inidb.set('discordSettings', 'bitsMessage', message);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.message.set', message));
        	}

        	/**
        	 * @discordcommandpath bitshandler channel [channel name] - Sets the channel bit announcements will be made in.
        	 */
        	if (action.equalsIgnoreCase('channel')) {
        		if (subAction === undefined) {
        			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.channel.usage'));
        			return;
        		}

        		channelName = subAction.replace('#', '').toLowerCase();
        		$.inidb.set('discordSettings', 'bitsChannel', channelName);
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.bitshandler.bits.channel.set', channelName));
        	}
        }
	});

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/bitsHandler.js')) {
            $.discord.registerCommand('./discord/handlers/bitsHandler.js', 'bitshandler', 1);
            $.discord.registerSubCommand('bitshandler', 'toggle', 1);
            $.discord.registerSubCommand('bitshandler', 'message', 1);
            $.discord.registerSubCommand('bitshandler', 'channel', 1);

            announce = true;
            // $.unbind('initReady'); Needed or not?
        }
    });
})();
