(function () {
	var auction = {
		increments: 0,
		minimum: 0,
		topUser: 0,
		topPoints: 0,
		timer: 0,
		status: false,
	};

	function openAuction(user, increments, minimum, timer) {
		if (auction.status) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.opened'));
			return;
		}

		if (!increments || !minimum) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.usage'));
			return;
		}

		if (increments) {
			auction.increments = parseInt(increments);
		}

		if (minimum) {
			auction.minimum = parseInt(minimum);
		}

		if (timer) {
			auction.timer = parseInt(timer);
		}

		auction.status = true;

		$.say($.lang.get('auctionsystem.opened', $.getPointsString(increments), $.getPointsString(minimum)));

		if (timer > 0) {
			$.say($.lang.get('auctionsystem.auto.timer.msg', timer));
			var a = setInterval(function () {
				warnAuction(true);
				clearInterval(a);
			}, (timer / 2) * 1000);
			var b = setInterval(function () {
				closeAuction();
				clearInterval(b);
			}, timer * 1000);
		}
	};

	function closeAuction(user) {
		if (!auction.status) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
			return;
		}

		if (!auction.topUser) {
			auction.status = false;
			$.say($.lang.get('auctionsystem.err.no.bids'));
			return;
		}

		auction.status = false;
		$.inidb.decr('points', auction.topUser, auction.topPoints);
		$.say($.lang.get('auctionsystem.closed', auction.topUser, $.getPointsString(auction.topPoints)));
	};

	function warnAuction(force) {
		if (!auction.status) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
			return;
		}

		if (force) {
			$.say($.lang.get('auctionsystem.warn.force', auction.topUser, $.getPointsString(auction.topPoints), $.getPointsString((auction.topPoints + auction.increments))));
		} else {
			$.say($.lang.get('auctionsystem.warn', auction.topUser, $.getPointsString(auction.topPoints)));
		}
	};

	function bid(user, amount) {
		if (!auction.status) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
			return;
		}

		if (!amount) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.bid.usage'));
			return;
		} else if (amount < auction.minimum) {
			$.say($.lang.get('auctionsystem.err.bid.minimum', $.getPointsString(auction.topPoints)));
			return;
		} else if (amount > $.getUserPoints(user)) {
			$.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.points', $.pointNameMultiple));
			return;
		} else if (amount < (auction.topPoints + auction.increments)) {
			$.say($.lang.get('auctionsystem.err.increments', $.getPointsString(auction.increments)));
			return;
		}

		auction.topUser = user;
		auction.topPoints = parseInt(amount);

		$.say($.lang.get('auctionsystem.bid', user, $.getPointsString(amount), $.getPointsString(auction.topPoints + auction.increments)))
	};

	$.bind('command', function (event) {
		var sender = event.getSender(),
		    command = event.getCommand(),
		    args = event.getArgs(),
		    action = args[0];

		if (command.equalsIgnoreCase('auction')) {
			if (!$.isModv3(sender, event.getTags())) {
                $.say($.getWhisperString(sender) + $.modMsg);
                return;
            }

            if (!action) {
            	$.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.usage'));
            	return;
            }

            if (action.equalsIgnoreCase('open')) {
            	openAuction(sender, args[1], args[2], args[3]);
            }

            if (action.equalsIgnoreCase('close')) {
            	closeAuction(sender);
            }

            if (action.equalsIgnoreCase('warn')) {
            	warnAuction();
            }
		}

		if (command.equalsIgnoreCase('bid')) {
			bid(sender, action);
		}
	});

	$.bind('initReady', function () {
    	if ($.bot.isModuleEnabled('./systems/auctionSystem.js')) {
    		$.registerChatCommand('./systems/auctionSystem.js', 'auction', 2);
    		$.registerChatCommand('./systems/auctionSystem.js', 'bid', 7);
    	}
    });
})();
