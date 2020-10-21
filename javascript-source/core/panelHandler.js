/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
		if (array.length > 50) {
			// Sort for newer events
			array.sort(function(a, b) {
				return b.date - a.date;
			});

			// Remove old events.
			array = array.slice(0, 50);
		}

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
    	addObjectToArray('panelData', 'data', 'Auto-Host', {
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
    	addObjectToArray('panelData', 'data', 'Host', {
			'username': event.getHoster(),
			'viewers' : event.getUsers(),
			'date'    : $.systemTime(),
			'isAuto'  : false
		});
    });

    /*
     * @event twitchSubscriber
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
     * @event twitchPrimeSubscriber
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
     * @event twitchReSubscriber
     */
    $.bind('twitchReSubscriber', function(event) {
    	addObjectToArray('panelData', 'data', 'ReSubscriber', {
			'username': event.getReSubscriber(),
			'months'  : event.getMonths(),
			'date'    : $.systemTime(),
			'isReSub' : true
		});
    });

    /*
     * @event twitchSubscriptionGift
     */
    $.bind('twitchSubscriptionGift', function(event) {
    	addObjectToArray('panelData', 'data', 'Gifted Subscription', {
			'recipient': event.getRecipient(),
			'username' : event.getUsername(),
			'months'   : event.getMonths(),
			'date'     : $.systemTime(),
			'isReSub'  : (parseInt(event.getMonths()) > 1)
		});
    });

    /*
     * @event twitchRaid
     */
    $.bind('twitchRaid', function(event) {
    	addObjectToArray('panelData', 'data', 'Raid', {
			'username' : event.getUsername(),
			'viewers'  : event.getViewers(),
			'date'     : $.systemTime()
		});
    });

    // Interval that updates stream data.
    setInterval(updateStreamData, 2e4);
})();
