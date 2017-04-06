/**
 * Betting system, a system use to bet about thing to win or lose points in Twitch chat.
 * bettingSystem.js
 *
 */
(function() {
	var bets = {},
	    timeout,
	    gain = $.getSetIniDbNumber('bettingSettings', 'gain', 40),
	    saveBets = $.getSetIniDbBoolean('bettingSettings', 'save', true),
	    saveFormat = $.getSetIniDbString('bettingSettings', 'format', 'yyyy.M.dd'),
	    warningMessages = $.getSetIniDbBoolean('bettingSettings', 'warningMessages', false),
	    bet = { status: false, opened: false, entries: 0, total: 0, minimum: 0, maximum: 0, timer: 0, pointsWon: 0, title: '', winners: '', options: {}, opt: [] };

	/**
	 * @function reloadBet
	 * @info Used to update the bet settings from the panel.
	 */
	function reloadBet() {
		gain = $.getIniDbNumber('bettingSettings', 'gain');
	    saveBets = $.getIniDbNumber('bettingSettings', 'save');
	    saveFormat = $.getIniDbNumber('bettingSettings', 'format');
	}

	/**
	 * @function open
	 * @info Used to open bets.
	 *
	 * @param {string} sender
	 * @param {string} title
	 * @param {string} options
	 * @param {int} minimum
	 * @param {int} maximum
	 * @param {int} timer
	 */
	function open(sender, title, options, minimum, maximum, timer) {
		if (title === undefined || options === undefined || isNaN(parseInt(minimum)) || isNaN(parseInt(maximum))) {
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.open.usage'));
			return;
		} else if (bet.status === true && bet.opened === false) {
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.open.error'));
			return;
		} else if (bet.status === true) {
			if (sender == $.botName) return;
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.open.error.opened'));
			return;
		} else if (!options.includes(', ')) {
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.open.usage'));
			return;
		}

		bet.title = title;
		bet.minimum = parseInt(minimum);
		bet.maximum = parseInt(maximum);
		bet.status = true;
		bet.opened = true;
		
		if (timer !== undefined && !isNaN(parseInt(timer)) && timer > 0) {
			bet.timer = timer;
			setTimeout(function() {
				stop();
			}, timer * 6e4);
		}

		var split = options.split(', ');

		for (var i = 0; i < split.length; i++) {
			bet.options[split[i].toLowerCase()] = { bets: 0, total: 0 };
			bet.opt.push(split[i].toLowerCase());
		}

		$.say($.lang.get('bettingsystem.open.success', title, options));
	}

	/**
	 * @function close
	 * @info Used to close bets.
	 *
	 * @param {string} sender.
	 * @param {string} winning option.
	 */
	function close(sender, option) {
		if (option === undefined && bet.opened === true) {
			bet.opened = false;
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.close.error.usage'));
			return;
		} else if (option === undefined) {
			if (sender == $.botName) return;
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.close.usage'));
			return;
		} else if (bet.options[option] === undefined) {
			$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.bet.null'));
			return;
		}

		clearInterval(timeout);

		bet.status = false;
		bet.opened = false;

		var winners = [],
		    total = 0,
		    give = 0,
		    i;

		$.say($.lang.get('bettingsystem.close.success', option));

		$.inidb.setAutoCommit(false);
		for (i in bets) {
			if (bets[i].option.equalsIgnoreCase(option)) {
				winners.push(i.toLowerCase());
				give = ((bet.total * parseFloat(gain / 100)) + parseInt(bets[i].amount));
				total += give;
				$.inidb.incr('points', i.toLowerCase(), Math.floor(give));
			}
		}
		$.inidb.setAutoCommit(true);

		bet.winners = winners.join(', ');
		bet.pointsWon = total;

		$.say($.lang.get('bettingsystem.close.success.winners', winners.length, $.getPointsString(Math.floor(total)), option));
		$.inidb.set('bettingSettings', 'lastBet', winners.length + '___' + $.getPointsString(Math.floor(total)));
		clear();
	}

	/**
	 * @function stop
	 * @info Used to stop entries in the bet.
	 *
	 */
	function stop() {
		bet.opened = false;
		$.say($.lang.get('bettingsystem.close.semi.success'));
	}

	/**
	 * @function save
	 * @info Used to save old bet results if the user wants too.
	 *
	 */
	function save() {
		if (saveBets) {
			var dateFormat = new java.text.SimpleDateFormat(saveFormat),
			    date = dateFormat.format(new Date());
			if (!$.inidb.exists('bettingResults', date)) {
			    $.inidb.set('bettingResults', date, $.lang.get('bettingsystem.save.format', bet.title, bet.opt.join(', '), bet.total, bet.entries, bet.pointsWon));
			} else {
				var keys = $.inidb.GetKeyList('bettingResults', ''),
				    a = 1,
				    i;
				for (i in keys) {
					if (keys[i].includes(date)) {
						a++;
					}
				}
				$.inidb.set('bettingResults', (date + '_' + a), $.lang.get('bettingsystem.save.format', bet.title, bet.opt.join(', '), bet.total, bet.entries, bet.pointsWon));
			}
		}
	}

	/**
	 * @function clear
	 * @info Used to clear the bet results after a bet.
	 *
	 */
	function clear() {
		save();
		bets = {};
	    bet = { status: false, opened: false, entries: 0, total: 0, minimum: 0, maximum: 0, timer: 0, pointsWon: 0, title: '', winners: '', options: {}, opt: [] };
	}

	/**
	 * @function message
	 * @info used to send messages
	 *
	 * @param {string} sender
	 * @param {string} message
	 */
	function message(sender, message) {
		if (warningMessages) {
			$.say($.whisperPrefix(sender) + message);
		}
	}

	/**
	 * @function bet
	 * @info Used to place a bet on a option.
	 *
	 * @param {string} sender
	 * @param {int} amount
	 * @param {string} option
	 */
	function vote(sender, amount, option) {
		if (bet.status === false || bet.opened === false) {
			// $.say($.whisperPrefix(sender) + 'There\'s no bet opened.');
			return;
		} else if (isNaN(parseInt(amount)) || option.length === 0) {
			message(sender, $.lang.get('bettingsystem.bet.usage'));
			return;
		} else if (amount < 1) {
			message(sender, $.lang.get('bettingsystem.bet.error.neg', $.pointNameMultiple));
			return;
		} else if (bet.minimum > amount) {
			message(sender, $.lang.get('bettingsystem.bet.error.min', bet.minimum));
			return;
		} else if (bet.maximum < amount && bet.maximum !== 0) {
			message(sender, $.lang.get('bettingsystem.bet.error.max', bet.maximum));
			return;
		} else if ($.getUserPoints(sender) < amount) {
			message(sender, $.lang.get('bettingsystem.bet.error.points', $.pointNameMultiple));
			return;
		} else if (bets[sender] !== undefined) {
			message(sender, $.lang.get('bettingsystem.bet.betplaced', $.getPointsString(bets[sender].amount), bets[sender].option))
			return;
		} else if (bet.options[option] === undefined) {
			message(sender, $.lang.get('bettingsystem.bet.null'));
			return;
		}

		bet.entries++;
		bet.total += parseInt(amount);
		bet.options[option].bets++;
		bet.options[option].total += parseInt(amount);
		bets[sender] = { option: option, amount: amount };
		$.inidb.decr('points', sender, amount);
	}

	/**
	 * @event command
	 * @info Used for commands. 
	 *
	 * @param {object} event
	 */
	$.bind('command', function(event) {
		var sender = event.getSender(),
		    command = event.getCommand(),
		    args = event.getArgs(),
		    action = args[0],
		    subAction = args[1];

		if (command.equalsIgnoreCase('bet')) {
			if (action === undefined) {
				$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.global.usage'));
				return;
			}

			/**
			 * @commandpath bet open ["title"] ["option1, option2, option3"] [minimum bet] [maximum bet] [close timer] - Opens a bet with those options. 
			 */
			if (action.equalsIgnoreCase('open')) {
				open(sender, args[1], args[2], args[3], args[4], args[5]);
				return;

			/**
			 * @commandpath bet close ["winning option"] - Closes the current bet.
			 */
			} else if (action.equalsIgnoreCase('close')) {
				close(sender, args.slice(1).join(' ').toLowerCase());
				return;

			/**
			 * @commandpath bet save - Toggle if bet results get saved or not after closing one.
			 */
			} else if (action.equalsIgnoreCase('save')) {
				saveBets = !saveBets;
				$.inidb.set('bettingSettings', 'save', saveBets);
				$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.toggle.save', (save === true ? $.lang.get('bettingsystem.now') : $.lang.get('bettingsystem.not'))));
				return;

			/**
			 * @commandpath bet togglemessages - Toggles bet warning messages on or off.
			 */
			} else if (action.equalsIgnoreCase('togglemessages')) {
				warningMessages = !warningMessages;
				$.inidb.set('bettingSettings', 'warningMessages', warningMessages);
				$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.warning.messages', (warningMessages === true ? $.lang.get('bettingsystem.now') : $.lang.get('bettingsystem.not'))));
				return;

		    /**
			 * @commandpath bet saveformat [date format] - Changes the date format past bets are saved in default is yyyy.mm.dd
			 */
			} else if (action.equalsIgnoreCase('saveformat')) {
				if (subAction === undefined) {
					$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.saveformat.usage'));
					return;
				}
				saveFormat = subAction;
				$.inidb.set('bettingSettings', 'format', saveFormat);
				$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.saveformat.set', saveFormat));
				return;

			/**
			 * @commandpath bet gain [percent] - Changes the point gain percent users get when they win a bet.
			 */
			} else if (action.equalsIgnoreCase('gain')) {
				if (subAction === undefined) {
					$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.gain.usage'));
					return;
				}
				gain = subAction
				$.inidb.set('bettingSettings', 'gain', gain);
				$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.gain.set', gain));
				return;

			/**
			 * @commandpath bet lookup [date] - Displays the results of a bet made on that day. If you made multiple bets you will have to add "_#" to specify the bet.
			 */
			} else if (action.equalsIgnoreCase('lookup')) {
				if (subAction === undefined) {
					$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.lookup.usage', saveFormat));
					return;
				}
				if (saveBets) {
					if ($.inidb.exists('bettingResults', subAction)) {
						$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.lookup.show', subAction, $.inidb.get('bettingResults', subAction)));
					} else {
						$.say($.whisperPrefix(sender) + $.lang.get('bettingsystem.lookup.null'));
					}
				}
				return;

			/**
			 * @commandpath bet current - Shows current bet stats.
			 */
			} else if (action.equalsIgnoreCase('current')) {
				if (bet.status === true) {
					$.say($.lang.get('bettingsystem.results', bet.title, bet.opt.join(', '), bet.total, bet.entries));
				}
				return;

			/**
			 * @commandpath bet [amount] [option] - Bets on the option.
			 */
			} else {
				vote(sender, args[0], args.splice(1).join(' ').toLowerCase());
			}
		}
	});

	/**
	 * @event initReady
	 */
	$.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/bettingSystem.js')) {
            $.registerChatCommand('./systems/bettingSystem.js', 'bet', 7);
            $.registerChatSubcommand('bet', 'current', 7);
            $.registerChatSubcommand('bet', 'results', 7);
            $.registerChatSubcommand('bet', 'open', 2);
            $.registerChatSubcommand('bet', 'close', 2);
            $.registerChatSubcommand('bet', 'save', 1);
            $.registerChatSubcommand('bet', 'saveformat', 1);
            $.registerChatSubcommand('bet', 'gain', 1);
        }
    });

    /* export to the $ api */
    $.reloadBet = reloadBet;
})();
