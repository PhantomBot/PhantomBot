(function() {
	var queue = [],
	    queueStatus = false,
	    queueSize = $.getSetIniDbNumber('settings', 'queueSize', 100);

	function joinQueue(user, gamertag) {
		if (!queueStatus) {
			$.say($.whisperPrefix(user) + $.lang.get('queuesystem.queue.closed'));
			return;
		}

		if (!gamertag) {
			$.say($.whisperPrefix(user) + $.lang.get('queuesystem.err.missing.tag'));
			return;
		}

		var i,
		    j = 1;

		for (i in queue) {
			if (queue[i].user.equalsIgnoreCase(user)) {
				$.say($.whisperPrefix(user) + $.lang.get('queuesystem.err.in.queue'));
				return;
			}

			if (queue[i].user) {
				j++;
			}
		}

		if (j >= queueSize) {
			$.say($.whisperPrefix(user) + $.lang.get('queuesystem.err.queue.full'));
			return;
		}

		queue.push({user: user, gamertag: gamertag});
        $.inidb.set('queueList', user, 'true');
		$.say($.whisperPrefix(user) + $.lang.get('queuesystem.added.queue'));
	};

	function clearQueue(user, notify) {
		queue = [];
        $.inidb.RemoveFile('queueList');
		if (notify) {
		    $.say($.whisperPrefix(user) + $.lang.get('queuesystem.queue.cleared'));
		}
	};

	function getPlayers(user, amount) {
		if (amount == null) {
			amount = 1;
		}

		var list,
		    i,
		    t = 1,
		    queueList = [],
		    temp = [];

		for (i in queue) {
			queueList.push({
				player: queue[i].user,
				gamertag: queue[i].gamertag,
			});
		}

		queue.splice(0, amount);
		list = queueList.splice(0, amount);

        /**Can't lang this because it gets pushed to a array. */
		for (i in list) {
			temp.push('#' + t + ' Player: ' + list[i].player + ' GamerTag: ' + list[i].gamertag);
			t++;
		}

		return temp.join(', ');
	};

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath joinqueue [gamertag] - Adds you to the current queue
         */
        if (command.equalsIgnoreCase('joinqueue')) {
        	joinQueue($.username.resolve(sender), action);
        }

        if (command.equalsIgnoreCase('queue')) {
        	if (!action) {
        		$.say($.whisperPrefix(sender) + $.lang.get('queuesystem.queue.usage'));
        		return;
        	}

        	/**
             * @commandpath queue open - Opens and clears the previous queue
             */
        	if (action.equalsIgnoreCase('open')) {
        		if (queueStatus) {
        			$.say($.whisperPrefix(sender) + $.lang.get('queuesystem.err.queue.opened'));
        			return;
        		}
        		queueStatus = true;
        		clearQueue(sender, false);
        		$.say($.lang.get('queuesystem.queue.opened'));
        		return;
        	}

        	/**
             * @commandpath queue close - Closes the current queue, but does not clear it
             */
        	if (action.equalsIgnoreCase('close')) {
        		if (!queueStatus) {
        			$.say($.whisperPrefix(sender) + 'there is no queue opened.');
        			return;
        		}
        		queueStatus = false;
        		$.say($.lang.get('queuesystem.err.queue.closed'));
        		return;
        	}

        	/**
             * @commandpath queue clear - Clears the queue
             */
        	if (action.equalsIgnoreCase('clear')) {
        		clearQueue(sender, true);
        		return;
        	}

        	/**
             * @commandpath queue next [amount] - Gives you the next players up
             */
        	if (action.equalsIgnoreCase('next')) {
        		$.say('Selected Players: ' + getPlayers(sender, subAction));
        		return;
        	}

        	/**
             * @commandpath queue maxsize [amount] - Sets the queue max size
             */
        	if (action.equalsIgnoreCase('maxsize')) {
        		if (!subAction) {
        			$.say($.whisperPrefix(sender) + $.lang.get('queuesystem.queue.size.usage'));
        			return;
        		}

        		queueSize = parseInt(subAction);
        		$.inidb.set('settings', 'queueSize', queueSize);
        		$.say($.whisperPrefix(sender) + $.lang.get('queuesystem.queue.size.set', queueSize));
        	}
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/queueSystem.js')) {
            $.registerChatCommand('./systems/queueSystem.js', 'queue', 2);
            $.registerChatCommand('./systems/queueSystem.js', 'joinqueue', 7);
        }
    });
})();
