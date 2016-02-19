(function () {
	var cost = 0,
	    entries = [],
        keyword = '',
	    followers = false,
	    raffleStatus = false,
        msgToggle = ($.inidb.exists('settings', 'raffleMSGToggle') ? $.getIniDbBoolean('settings', 'raffleMSGToggle') : false),
        a = '';

    function checkArgs (user, key, price, followersOnly) {
    	if (raffleStatus) {
    		$.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.opened'));
    		return;
    	}

        if (!key) {
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
    	openRaffle(key, followers, cost);
    };

    function openRaffle (key, followers, cost) {
        $.say($.lang.get('rafflesystem.raffle.opened', $.getPointsString(cost), key, a));
        $.registerChatCommand('./systems/raffleSystem.js', key, 7);
        entries = [];
    	raffleStatus = true;
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
        * @commandPath raffle [option] - Give's you the usage.
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
            * @commandPath raffle open (keyword) (cost) (-followers) - Open's a  raffle. -followers is optional.
            */
    		if (action.equalsIgnoreCase('open')) {
    			checkArgs(sender, args[1], args[2], args[3]);
            }

            /**
            * @commandPath raffle close - closes a  raffle.
            */
    		if (action.equalsIgnoreCase('close')) {
    			closeRaffle(sender);
    		}

            /**
            * @commandPath raffle repick - Picks a new winner for the  raffle
            */
            if (action.equalsIgnoreCase('repick')) {
                winner(true);
            }

            /**
            * @commandPath raffle messagetoggle - Toggles on and off the entering message.
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
