(function() {
	var winGainPercent = $.getSetIniDbNumber('discordGambling', 'winGainPercent', 30),
	    winRange = $.getSetIniDbNumber('discordGambling', 'winRange', 50),
	    max = $.getSetIniDbNumber('discordGambling', 'max', 100),
	    min = $.getSetIniDbNumber('discordGambling', 'min', 5),
	    gain = Math.abs(winGainPercent / 100);

	/**
	 * @function reloadGamble
	 */
	function reloadGamble() {
	 	winGainPercent = $.getIniDbNumber('discordGambling', 'winGainPercent');
	    winRange = $.getIniDbNumber('discordGambling', 'winRange');
	    max = $.getIniDbNumber('discordGambling', 'max');
	    min = $.getIniDbNumber('discordGambling', 'min');
	    gain = Math.abs(winGainPercent / 100);
	}

	/**
	 * @function gamble
	 *
	 * @param {int amout}
	 * @param {string} sender
	 */
	function gamble(channel, sender, mention, username, amount) {
		var winnings = 0,
		    winSpot = 0,
		    range = $.randRange(1, 100);

		if ($.getUserPoints(sender) < amount) {
			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.need.points', $.pointNameMultiple));
			return;
		}

		if (max < amount) {
			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.error.max', $.getPointsString(max)));
			return;
		}

		if (min > amount) {
			$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.error.min', $.getPointsString(min)));
			return;
		}

		if (range <= winRange) {
			$.discord.say(channel, $.lang.get('discord.gambling.lost', $.discord.userPrefix(mention), range, $.getPointsString(amount), $.getPointsString($.getUserPoints(sender) - amount), $.gameMessages.getLose(username, 'gamble')));
			$.inidb.decr('points', sender, amount);
		} else {
			winSpot = (range - winRange + 1); 
            winnings = Math.floor(amount + ((amount + winSpot) * gain));
			$.discord.say(channel, $.lang.get('discord.gambling.won', $.discord.userPrefix(mention), range, $.getPointsString(winnings), $.getPointsString($.getUserPoints(sender) + (winnings - amount)), $.gameMessages.getWin(username, 'gamble')));
			$.inidb.decr('points', sender, amount);
			$.inidb.incr('points', sender, winnings);
		}
	}

	/**
     * @event discordCommand
     */
    $.bind('discordCommand', function(event) {
    	var sender = event.getSender(),
    		channel = event.getChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
		 * @discordcommandpath gamble [amount] - Gamble your points.
		 */
        if (command.equalsIgnoreCase('gamble')) {
        	if (isNaN(parseInt(action))) {
				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.usage'));
			} else {
				var twitchName = $.discord.resolveTwitchName(event.getSenderId());
				if (twitchName !== null) {
					gamble(channel, twitchName, mention, sender, parseInt(action));
				} else {
					$.discord.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
				}
			}
        }

        if (command.equalsIgnoreCase('gambling')) {
        	if (action === undefined) {
        		$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.main.usage'));
        		return;
        	}

        	/**
		 	 * @discordcommandpath gambling setmax [amount] - Set how many points people can gamble.
		 	 */
        	if (action.equalsIgnoreCase('setmax')) {
        		if (isNaN(parseInt(subAction))) {
					$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.set.max.usage'));
					return;
				}
				max = parseInt(subAction);
				$.inidb.set('discordGambling', 'max', max);
				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.set.max', $.getPointsString(max)));
        	}

        	/**
		 	 * @discordcommandpath gambling setmin [amount] - Set the minimum amount of points people can gamble.
		 	 */
        	if (action.equalsIgnoreCase('setmin')) {
        		if (isNaN(parseInt(subAction))) {
					$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.set.min.usage'));
					return;
				}
				min = parseInt(subAction);
				$.inidb.set('discordGambling', 'min', min);
				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.set.min', $.getPointsString(min)));
        	}

        	/**
		 	 * @discordcommandpath gambling setwinningrange [range] - Set the winning range from 0-100. The higher the less of a chance people have at winning.
		 	 */
			if (action.equalsIgnoreCase('setwinningrange')) {
				if (isNaN(parseInt(subAction))) {
					$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.win.range.usage'));
					return;
				}
				winRange = parseInt(subAction);
				$.inidb.set('discordGambling', 'winRange', winRange);
				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.win.range', parseInt(winRange) + 1, winRange));
			}

			/**
		 	 * @discordcommandpath gambling setgainpercent [amount in percent] - Set the winning gain percent.
		 	 */
			if (action.equalsIgnoreCase('setgainpercent')) {
				if (isNaN(parseInt(subAction))) {
					$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.percent.usage'));
					return;
				}
				winGainPercent = parseInt(subAction);
				$.inidb.set('discordGambling', 'winGainPercent', winGainPercent);
				$.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.gambling.percent', winGainPercent));
			}
        }
    });
	
	/**
     * @event initReady
     */
	$.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/games/gambling.js')) {
        	$.discord.registerCommand('./games/gambling.js', 'gamble', 0);
        	$.discord.registerCommand('./games/gambling.js', 'gambling', 1);
			$.discord.registerSubCommand('gambling', 'setmax', 1);
			$.discord.registerSubCommand('gambling', 'setmin', 1);
			$.discord.registerSubCommand('gambling', 'setwinningrange', 1);
			$.discord.registerSubCommand('gambling', 'setgainpercent', 1);
        }
    });

	/**
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
    	if (event.getScript().equalsIgnoreCase('./discord/games/gambling.js')) {
    		reloadGamble();
    	}
    });
})();
