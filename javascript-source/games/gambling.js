(function() {

	var winGainPercent = $.getSetIniDbNumber('gambling', 'winGainPercent', 30),
	    winRange = $.getSetIniDbNumber('gambling', 'winRange', 50),
	    max = $.getSetIniDbNumber('gambling', 'max', 100),
	    min = $.getSetIniDbNumber('gambling', 'min', 5),
	    gain = Math.abs(winGainPercent / 100);

	function reloadGamble() {
	 	winGainPercent = $.getIniDbNumber('gambling', 'winGainPercent');
	    winRange = $.getIniDbNumber('gambling', 'winRange');
	    max = $.getIniDbNumber('gambling', 'max');
	    min = $.getIniDbNumber('gambling', 'min');
	    gain = Math.abs(winGainPercent / 100);
	};

	function gamble(sender, amount) {
		var winnings = 0,
		    winSpot = 0,
		    range = $.randRange(0, 100);

		if ($.getUserPoints(sender) < amount) {
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.need.points', $.pointNameMultiple));
			return;
		}

		if (max < amount) {
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.error.max', $.getPointsString(max)));
			return;
		}

		if (min > amount) {
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.error.min', $.getPointsString(min)));
			return;
		}

		if (range <= winRange) {
			$.say($.lang.get('gambling.lost', $.userPrefix(sender), range, $.getPointsString(amount), $.getPointsString($.getUserPoints(sender))));
			$.inidb.decr('points', sender, amount);
		} else {
			winSpot = (range - winRange + 1); 
            winnings = Math.floor(amount + ((amount + winSpot) * gain));
			$.say($.lang.get('gambling.won', $.userPrefix(sender), range, $.getPointsString(winnings - amount), $.getPointsString($.getUserPoints(sender))));
			$.inidb.decr('points', sender, amount);
			$.inidb.incr('points', sender, winnings);
		}
	};

	$.bind('command', function(event) {
		var sender = event.getSender(),
		    command = event.getCommand(),
		    args = event.getArgs(),
		    action = args[0];

		 /**
		 * @commandpath gamble [amount] - Gamble your points.
		 */
		if (command.equalsIgnoreCase('gamble')) {
			if (!parseInt(action)) {
				$.say($.whisperPrefix(sender) + $.lang.get('gambling.usage'));
				return;
			}

			gamble(sender, parseInt(action));
		}

		/**
		 * @commandpath gamblesetmax [amount] - Set how many points people can gamble.
		 */
		if (command.equalsIgnoreCase('gamblesetmax')) {
			if (!action) {
				$.say($.whisperPrefix(sender) + $.lang.get('gambling.set.max.usage'));
				return;
			}
			max = action;
			$.inidb.set('gambling', 'max', max);
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.set.max', $.getPointsString(max)));
		}

		/**
		 * @commandpath gamblesetmin [amount] - Set the minumum amount of points people can gamble.
		 */
		if (command.equalsIgnoreCase('gamblesetmin')) {
			if (!action) {
				$.say($.whisperPrefix(sender) + $.lang.get('gambling.set.min.usage'));
				return;
			}
			min = action;
			$.inidb.set('gambling', 'min', min);
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.set.min', $.getPointsString(min)));
		}

		/**
		 * @commandpath gamblesetwinningrange [range] - Set the winning range from 0-100.
		 */
		if (command.equalsIgnoreCase('gamblesetwinningrange')) {
			if (!action || action.contains('-')) {
				$.say($.whisperPrefix(sender) + $.lang.get('gambling.win.range.usage'));
				return;
			}
			winRange = action;
			$.inidb.set('gambling', 'winRange', winRange);
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.win.range', winRange, (winRange - 1)));
		}

		/**
		 * @commandpath gamblesetgainpercent [amount in percent] - Set the winning gain percent.
		 */
		if (command.equalsIgnoreCase('gamblesetgainpercent')) {
			if (!action) {
				$.say($.whisperPrefix(sender) + $.lang.get('gambling.percent.usage'));
				return;
			}
			winGainPercent = action;
			$.inidb.set('gambling', 'winGainPercent', winGainPercent);
			$.say($.whisperPrefix(sender) + $.lang.get('gambling.percent', winGainPercent));
		}

		/**
		* Used for the panel
		*/
		if (command.equalsIgnoreCase('reloadgamble')) {
			reloadGamble();
		}
	});

	$.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/gambling.js')) {
        	$.registerChatCommand('./games/gambling.js', 'gamble', 7);
        	$.registerChatCommand('./games/gambling.js', 'gamblesetmax', 1);
        	$.registerChatCommand('./games/gambling.js', 'gamblesetmin', 1);
        	$.registerChatCommand('./games/gambling.js', 'gamblesetwinningrange', 1);
        	$.registerChatCommand('./games/gambling.js', 'gamblesetgainpercent', 1);
        	$.registerChatCommand('./games/gambling.js', 'reloadgamble', 1);
        }
    });
})();
