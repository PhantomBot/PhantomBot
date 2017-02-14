/**
 * This module is to handle hosts notifications.
 */
(function() {
	var toggle = $.getSetIniDbBoolean('discordSettings', 'hostToggle', false),
	  	hostMessage = $.getSetIniDbString('discordSettings', 'hostMessage', '(name) just hosted!'),
	  	autoHostMessage = $.getSetIniDbString('discordSettings', 'autohostMessage', '(name) just auto-hosted!'),
	  	channelName = $.getSetIniDbString('discordSettings', 'hostChannel', ''),
	  	hosters = {},
	  	announce = false;

    /**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/handlers/hostHandler.js')) {
            toggle = $.getIniDbBoolean('discordSettings', 'hostToggle', false);
            hostMessage = $.getIniDbString('discordSettings', 'hostMessage', '(name) just hosted!');
            autoHostMessage = $.getIniDbString('discordSettings', 'autohostMessage', '(name) just auto-hosted!');
            channelName = $.getIniDbString('discordSettings', 'hostChannel', '');
        }
    });
    
 	/**
 	 * @event twitchHostsInitialized
 	 */
	$.bind('twitchHostsInitialized', function(event) { 
		announce = true;
	});

	/**
     * @event twitchAutoHosted
     */
	$.bind('twitchAutoHosted', function(event) {
		var hoster = event.getHoster(),
		    viewers = event.getUsers(),
		    now = $.systemTime(),
		    s = autoHostMessage;

		if (toggle === false || announce === false || channelName == '') {
			return;
		}

		if (hosters[hoster] !== undefined) {
			if (hosters[hoster].time > now) {
				return;
			}
			hosters[hoster].time = now + 216e5;
		} else {
			hosters[hoster].time = now + 216e5;
		}

		if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', hoster);
        }

        if (s.match(/\(viewers\)/g)) {
            s = $.replace(s, '(viewers)', viewers);
        }

        $.discord.say(channelName, s);
    });

    /**
     * @event twitchHosted
     */
	$.bind('twitchHosted', function(event) {
		var hoster = event.getHoster(),
		    viewers = event.getUsers(),
		    now = $.systemTime(),
		    s = hostMessage;

		if (toggle === false || announce === false || channelName == '') {
			return;
		}

		if (hosters[hoster] !== undefined) {
			if (hosters[hoster].time > now) {
				return;
			}
			hosters[hoster].time = now + 216e5;
		} else {
			hosters[hoster].time = now + 216e5;
		}

		if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', hoster);
        }

        if (s.match(/\(viewers\)/g)) {
            s = $.replace(s, '(viewers)', viewers);
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

        if (command.equalsIgnoreCase('hosthandler')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.usage'));
                return;
            }

            /**
             * @discordcommandpath hosthandler toggle - Toggles the hosts announcements.
             */
            if (action.equalsIgnoreCase('toggle')) {
                toggle = !toggle;
                $.inidb.set('discordSettings', 'hostToggle', toggle);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.host.toggle', (toggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled')))); 
            }

            /**
             * @discordcommandpath hosthandler hostmessage [message] - Sets the host announcement message.
             */
            if (action.equalsIgnoreCase('hostmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.host.message.usage'));
                    return;
                }

                hostMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'hostMessage', hostMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.host.message.set', hostMessage));
            }

            /**
             * @discordcommandpath hosthandler hostmessage [message] - Sets the auto-host announcement message.
             */
            if (action.equalsIgnoreCase('autohostmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.autohost.message.usage'));
                    return;
                }

                autoHostMessage = args.slice(1).join(' ');
                $.inidb.set('discordSettings', 'autohostMessage', autohostMessage);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.autohost.message.set', autoHostMessage));
            }

            /**
             * @discordcommandpath hosthandler channel [channel name] - Sets the channel that announcements from this module will be said in.
             */
            if (action.equalsIgnoreCase('channel')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.channel.usage'));
                    return;
                }

                channelName = subAction.replace('#', '').toLowerCase();
                $.inidb.set('discordSettings', 'hostChannel', channelName);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.hosthandler.channel.set', channelName));
            }
        }
    });

	/**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/handlers/hostHandler.js')) {
            $.discord.registerCommand('./discord/handlers/hostHandler.js', 'hosthandler', 1);
            $.discord.registerSubCommand('hosthandler', 'toggle', 1);
            $.discord.registerSubCommand('hosthandler', 'hostmessage', 1);
            $.discord.registerSubCommand('hosthandler', 'autohostmessage', 1);
            $.discord.registerSubCommand('hosthandler', 'channel', 1);

            // $.unbind('initReady'); Needed or not?
        }
    });
})();
