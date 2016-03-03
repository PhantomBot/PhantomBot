(function () {
	var cost = 0,
	    entries = [],
        keyword = '',
	    followers = false,
	    raffleStatus = false,
        msgToggle = ($.inidb.exists('settings', 'raffleMSGToggle') ? $.getIniDbBoolean('settings', 'raffleMSGToggle') : false),
        timer = 0,
        a = '';

    function checkArgs (user, key, price, followersOnly, t) {
    	if (raffleStatus) {
    		$.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.opened'));
    		return;
    	}

        if (!key || !price) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.missing.syntax'));
            return;
        }

        if (key.contains('!')) {
            key = key.replace('!', '');
        }

        if (key) {
            keyword = key;
        }

        if (price) {
            cost = parseInt(price);
        }

    	if (followersOnly && followersOnly.equalsIgnoreCase('-followers')) {
    		followers = true;
            a = $.lang.get('rafflesystem.msg.need.to.be.follwing');
    	}

        if (t) {
            timer = parseInt(t);
        }
    	openRaffle(key, followers, cost, timer);
    };

    function openRaffle (key, followers, cost, timer) {
        $.say($.lang.get('rafflesystem.raffle.opened', $.getPointsString(cost), key, a));
        $.registerChatCommand('./systems/raffleSystem.js', key, 7);
        entries = [];
    	raffleStatus = true;

        if (timer > 0) {
            var a = setInterval(function () {
                $.say($.lang.get('rafflesystem.warn', key));
                clearInterval(a);
            }, (timer / 2) * 1000);
            var b = setInterval(function () {
                closeRaffle();
                clearInterval(b);
            }, timer * 1000);
        }
    };

    function closeRaffle (user) {
    	if (!raffleStatus) {
    		$.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.not.opened'));
    		return;
    	}

        raffleStatus = false;
        followers = false;
        keyword = '';
        cost = 0;
        a = '';

    	$.say($.lang.get('rafflesystem.raffle.closed'));
    	winner();
    };

    function winner (force) {
    	if (entries.length == 0) {
    		$.say($.lang.get('rafflesystem.raffle.close.err'));
    		return;
    	}

    	if (force) {
            $.say($.lang.get('rafflesystem.raffle.repick', $.username.resolve($.randElement(entries))));
    		return;
    	}

    	winner = $.randElement(entries);
        $.say($.lang.get('rafflesystem.winner', $.username.resolve(winner)));
    };

    function enterRaffle (user, cost) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.not.opened'));
            return;
        }

    	if (followers) {
    		if (!$.user.isFollower(user)) {
    			$.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.not.following'));
    			return;
    		}
    	}

        if ($.list.contains(entries, user)) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.enter.error.alreadyentered'));
            return;
        }

    	if (cost > 0) {
            $.inidb.decr('points', user, cost);
    		if (cost > $.getUserPoints(user)) {
                $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.points', $.pointNameMultiple));
    			return;
    		}
    	}

        if (msgToggle) {
            $.say($.lang.get('rafflesystem.entered', $.username.resolve(user)));
        }

    	entries.push(user);
    };

    /**
    * @event command
    */
    $.bind('command', function (event) {
    	var sender = event.getSender(),
    	    command = event.getCommand(),
    	    argString = event.getArguments(),
    	    args = event.getArgs(),
    	    action = args[0];

        /**
        * @commandpath raffle - Displays the usage of the raffle command
        */
    	if (command.equalsIgnoreCase('raffle')) {
    		if (!$.isModv3(sender, event.getTags())) {
    			$.say($.whisperPrefix(sender) + $.modMsg);
    			return;
            }

    		if (!action) {
    			$.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.usage'));
    			return;
            }

            /**
            * @commandpath raffle open [keyword] [cost] [-followers] [timer] - Opens a raffle. -followers and timer are optional
            */
    		if (action.equalsIgnoreCase('open')) {
    			checkArgs(sender, args[1], args[2], args[3]);
            }

            /**
            * @commandpath raffle close - Closes a raffle.
            */
    		if (action.equalsIgnoreCase('close')) {
    			closeRaffle(sender);
    		}

            /**
            * @commandpath raffle repick - Picks a new winner for the raffle
            */
            if (action.equalsIgnoreCase('repick')) {
                winner(true);
            }

            /**
            * @commandpath raffle messagetoggle - Toggles on and off a message when entering a raffle
            */
            if (action.equalsIgnoreCase('messagetoggle')) {
                if (msgToggle) {
                    msgToggle = false;
                    $.inidb.set('settings', 'raffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.msg.disabled'));
                } else {
                    msgToggle = true;
                    $.inidb.set('settings', 'raffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.msg.enabled'));
                }
            }
    	}

        if (command.equalsIgnoreCase(keyword)) {
            enterRaffle(sender, cost);
        }
    });

    /**
    * @event initReady
    */
    $.bind('initReady', function () {
    	if ($.bot.isModuleEnabled('./systems/raffleSystem.js')) {
    		$.registerChatCommand('./systems/raffleSystem.js', 'raffle', 2);
    	}
    });
})();
