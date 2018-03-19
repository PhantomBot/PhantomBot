// Only tracks data for now.
(function() {
	/*
	 * @function addObjectToArray
	 *
	 * @param {String} table
	 * @param {String} key
	 * @param {String} type
	 * @param {Object} object
	 */
	function addObjectToArray(table, key, type, object) {
		var array = ($.inidb.exists(table, key) ? JSON.parse($.inidb.get(table, key)) : []);

		// Make sure it is an array.
		if (object.type === undefined) {
			object.type = type;
		}
		// Add the object to the array.
		array.push(object);
		// Only keep 50 objects in the array.
		array = array.slice(0, 50);
		// Save it.
		saveObject(table, key, array);
	}

	/*
	 * @function saveObject
	 *
	 * @param {String} table
	 * @param {String} key
	 * @param {Object} object
	 */
	function saveObject(table, key, object) {
		$.inidb.set(table, key, JSON.stringify(object, function(key, value) {
			try {
				if (value.getClass() !== null) {
					switch (value) {
						case value instanceof java.lang.Number:
							return parseInt(value);
						case value instanceof java.lang.Boolean:
							return value.booleanValue();
						default:
							return (value + '');
					}
				}
			} catch (e) {
				// Ignore
			}
			return value;
		}));
	}

	/*
	 * @function getFormatedUptime
	 */
	function getFormatedUptime() {
		var streamUptimeMinutes = parseInt($.getStreamUptimeSeconds($.channelName) / 60),
            hours = parseInt(streamUptimeMinutes / 60),
            minutes = (parseInt(streamUptimeMinutes % 60) < 10 ? '0' + parseInt(streamUptimeMinutes % 60) : parseInt(streamUptimeMinutes % 60)),
            timestamp = hours + ':' + minutes;

        return timestamp;
	}

	/*
     * @function updateStreamData
	 */
	function updateStreamData() {
		saveObject('panelData', 'stream', {
			'communities': $.twitchcache.getCommunities().join(','),
			'views'      : $.twitchcache.getViews() + '',
			'followers'  : $.getFollows($.channelName),
			'viewers'    : $.getViewers($.channelName),
			'title'      : $.getStatus($.channelName),
			'isLive'     : $.isOnline($.channelName),
			'game'       : $.getGame($.channelName),
			'uptime'     : getFormatedUptime(),
			'chatters'   : $.users.length,
		});
	}

	/*
	 * @event twitchOnline
	 */
	$.bind('twitchOnline', function() {
		updateStreamData();
	});

	/*
	 * @event twitchOffline
	 */
	$.bind('twitchOffline', function() {
		updateStreamData();
	});

	/*
	 * @event twitchFollow
	 */
	$.bind('twitchFollow', function(event) {
		addObjectToArray('panelData', 'data', 'Follower', {
			'username': event.getFollower(),
			'date'    : $.systemTime()
		});
	});

	/*
	 * @event bits
	 */
	$.bind('twitchBits', function(event) {
		addObjectToArray('panelData', 'data', 'Bits', {
			'username': event.getUsername(),
			'amount'  : event.getBits(),
			'date'    : $.systemTime()
		});
	});

	/*
     * @event twitchAutoHosted
     */
    $.bind('twitchAutoHosted', function(event) {
    	addObjectToArray('panelData', 'data', 'Host', {
			'username': event.getHoster(),
			'viewers' : event.getUsers(),
			'date'    : $.systemTime(),
			'isAuto'  : true
		});
    });

    /*
     * @event twitchHosted
     */
    $.bind('twitchHosted', function(event) {
    	addObjectToArray('panelData', 'data', 'Auto-Host', {
			'username': event.getHoster(),
			'viewers' : event.getUsers(),
			'date'    : $.systemTime(),
			'isAuto'  : false
		});
    });

    /*
     * @event subscriber
     */
    $.bind('twitchSubscriber', function(event) {
    	addObjectToArray('panelData', 'data', 'Subscriber', {
			'username': event.getSubscriber(),
			'date'    : $.systemTime(),
			'isReSub' : false,
			'months'  : 0
		});
    });

    /*
     * @event primeSubscriber
     */
    $.bind('twitchPrimeSubscriber', function(event) {
    	addObjectToArray('panelData', 'data', 'Prime Subscriber', {
			'username': event.getSubscriber(),
			'date'    : $.systemTime(),
			'isReSub' : false,
			'months'  : 0
		});
    });

    /*
     * @event reSubscriber
     */
    $.bind('twitchReSubscriber', function(event) {
    	addObjectToArray('panelData', 'data', 'ReSubscriber', {
			'username': event.getReSubscriber(),
			'months'  : event.getMonths(),
			'date'    : $.systemTime(),
			'isReSub' : true
		});
    });

    // Interval that updates stream data.
    setInterval(updateStreamData, 2e4);
})();
