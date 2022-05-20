/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
(function () {
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
            /*array.sort(function (a, b) {
             var d1 = new Date(a.date);
             var d2 = new Date(b.date);
             return d1 - d2;
             });*/

            // Remove old events.
            array = array.slice(array.length - 50);
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
        $.inidb.set(table, key, JSON.stringify(object, function (key, value) {
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
        var streamUptimeMinutes = parseInt($.twitchcache.getStreamUptimeSeconds() / 60),
                hours = parseInt(streamUptimeMinutes / 60),
                minutes = (parseInt(streamUptimeMinutes % 60) < 10 ? '0' + parseInt(streamUptimeMinutes % 60) : parseInt(streamUptimeMinutes % 60)),
                timestamp = hours + ':' + minutes;

        return timestamp;
    }

    /*
     * @function updateStreamData
     */
    function updateStreamData() {
        if ($.twitchcache !== undefined) {
            saveObject('panelData', 'stream', {
                'views': $.twitchcache.getViews(),
                'followers': $.getFollows($.channelName),
                'viewers': $.twitchcache.getViewerCount(),
                'title': $.twitchcache.getStreamStatus(),
                'isLive': $.twitchcache.isStreamOnline(),
                'game': $.twitchcache.getGameTitle(),
                'uptime': getFormatedUptime(),
                'chatters': $.users.length
            });
        }
    }

    /*
     * @event twitchOnline
     */
    $.bind('twitchOnline', function () {
        updateStreamData();
    });

    /*
     * @event twitchOffline
     */
    $.bind('twitchOffline', function () {
        updateStreamData();
    });

    /*
     * @event twitchFollow
     */
    $.bind('twitchFollow', function (event) {
        addObjectToArray('panelData', 'data', 'Follower', {
            'username': event.getFollower(),
            'date': event.getFollowDate()
        });
    });

    /*
     * @event bits
     */
    $.bind('twitchBits', function (event) {
        addObjectToArray('panelData', 'data', 'Bits', {
            'username': event.getUsername(),
            'amount': event.getBits(),
            'date': $.systemTime(),
            'message': event.getMessage()
        });
    });

    /*
     * @event twitchHosted
     */
    $.bind('twitchHosted', function (event) {
        addObjectToArray('panelData', 'data', 'Host', {
            'username': event.getHoster(),
            'viewers': event.getUsers(),
            'date': $.systemTime(),
            'isAuto': false
        });
    });

    /*
     * @event twitchSubscriber
     */
    $.bind('twitchSubscriber', function (event) {
        addObjectToArray('panelData', 'data', 'Subscriber', {
            'username': event.getSubscriber(),
            'date': $.systemTime(),
            'isReSub': false,
            'months': 0,
            'tier': event.getPlan() / 1000,
            'message': event.getMessage()
        });
    });

    /*
     * @event twitchPrimeSubscriber
     */
    $.bind('twitchPrimeSubscriber', function (event) {
        addObjectToArray('panelData', 'data', 'Prime ' + (event.getMonths() > 1 ? 'Re' : '') + 'Subscriber', {
            'username': event.getSubscriber(),
            'date': $.systemTime(),
            'isReSub': false,
            'months': event.getMonths(),
            'tier': 1
        });
    });

    /*
     * @event twitchReSubscriber
     */
    $.bind('twitchReSubscriber', function (event) {
        addObjectToArray('panelData', 'data', 'ReSubscriber', {
            'username': event.getReSubscriber(),
            'months': event.getMonths(),
            'date': $.systemTime(),
            'isReSub': true,
            'tier': event.getPlan() / 1000,
            'message': event.getMessage()
        });
    });

    /*
     * @event twitchSubscriptionGift
     */
    $.bind('twitchSubscriptionGift', function (event) {
        addObjectToArray('panelData', 'data', 'Gifted Subscription', {
            'recipient': event.getRecipient(),
            'username': event.getUsername(),
            'months': event.getMonths(),
            'date': $.systemTime(),
            'isReSub': (parseInt(event.getMonths()) > 1),
            'tier': event.getPlan() / 1000
        });
    });

    /*
     * @event twitchMassSubscriptionGifted
     */
    $.bind('twitchMassSubscriptionGifted', function (event) {
        addObjectToArray('panelData', 'data', 'Mass Gifted Subscription', {
            'username': event.getUsername(),
            'amount': event.getAmount(),
            'date': $.systemTime(),
            'tier': event.getPlan() / 1000
        });
    });

    /*
     * @event twitchAnonymousSubscriptionGift
     */
    $.bind('twitchAnonymousSubscriptionGift', function (event) {
        addObjectToArray('panelData', 'data', 'Anonymous Gifted Subscription', {
            'recipient': event.getRecipient(),
            'months': event.getMonths(),
            'date': $.systemTime(),
            'isReSub': (parseInt(event.getMonths()) > 1),
            'tier': event.getPlan() / 1000
        });
    });

    /*
     * @event twitchMassAnonymousSubscriptionGifted
     */
    $.bind('twitchMassAnonymousSubscriptionGifted', function (event) {
        addObjectToArray('panelData', 'data', 'Anonymous Mass Gifted Subscription', {
            'amount': event.getAmount(),
            'date': $.systemTime(),
            'tier': event.getPlan() / 1000
        });
    });

    /*
     * @event twitchRaid
     */
    $.bind('twitchRaid', function (event) {
        addObjectToArray('panelData', 'data', 'Raid', {
            'username': event.getUsername(),
            'viewers': event.getViewers(),
            'date': $.systemTime()
        });
    });

    /*
     * @event tipeeeStreamDonation
     */
    $.bind('tipeeeStreamDonation', function (event) {
        var data = JSON.parse(event.getJsonString());
        addObjectToArray('panelData', 'data', 'Tip', {
            'username': data.parameters.username,
            'amount': data.parameters.amount.toFixed(2),
            'currency': data.parameters.currency,
            'date': $.systemTime(),
            'message': data.parameters.message
        });
    });

    /*
     * @event streamElementsDonation
     */
    $.bind('streamElementsDonation', function (event) {
        var data = JSON.parse(event.getJsonString());
        addObjectToArray('panelData', 'data', 'Tip', {
            'username': data.donation.user.username,
            'amount': data.donation.amount.toFixed(2),
            'currency': data.donation.currency,
            'date': $.systemTime(),
            'message': data.donation.message
        });
    });

    /*
     * @event streamLabsDonation
     */
    $.bind('streamLabsDonation', function (event) {
        var data = JSON.parse(event.getJsonString());
        addObjectToArray('panelData', 'data', 'Tip', {
            'username': data.name,
            'amount': parseFloat(data.amount).toFixed(2),
            'currency': data.currency,
            'date': $.systemTime(),
            'message': data.message
        });
    });

    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getId().equalsIgnoreCase('panelDataRefresh')) {
            updateStreamData();
        }
    });

    // Interval that updates stream data.
    setInterval(updateStreamData, 2e4);
})();
