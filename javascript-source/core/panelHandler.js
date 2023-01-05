/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

/* global Packages, parseFloat */

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
                        case value instanceof Packages.java.lang.Number:
                            return parseInt(value);
                        case value instanceof Packages.java.lang.Boolean:
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
                'followers': $.getFollows($.channelName),
                'subs': $.getSubscriberCount(),
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
     * @event twitchSubscriber
     */
    $.bind('twitchSubscriber', function (event) {
        var tier = $.subscription.planToTier(event.getPlan(), false);
        if (tier === null) {
            return;
        }
        addObjectToArray('panelData', 'data', 'Subscriber', {
            'username': event.getUsername(),
            'date': $.systemTime(),
            'isReSub': false,
            'months': 0,
            'tier': tier,
            'message': event.getMessage()
        });
    });

    /*
     * @event twitchPrimeSubscriber
     */
    $.bind('twitchPrimeSubscriber', function (event) {
        addObjectToArray('panelData', 'data', 'Prime ' + (event.getMonths() > 1 ? 'Re' : '') + 'Subscriber', {
            'username': event.getUsername(),
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
            'username': event.getUsername(),
            'months': event.getMonths(),
            'date': $.systemTime(),
            'isReSub': true,
            'tier': $.subscription.planToTier(event.getPlan()),
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
            'tier': $.subscription.planToTier(event.getPlan())
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
            'tier': $.subscription.planToTier(event.getPlan())
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
            'tier': $.subscription.planToTier(event.getPlan())
        });
    });

    /*
     * @event twitchMassAnonymousSubscriptionGifted
     */
    $.bind('twitchMassAnonymousSubscriptionGifted', function (event) {
        addObjectToArray('panelData', 'data', 'Anonymous Mass Gifted Subscription', {
            'amount': event.getAmount(),
            'date': $.systemTime(),
            'tier': $.subscription.planToTier(event.getPlan())
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

    /**
     * Sends an ack response to a WS query
     *
     * @param {string} uniqueID The ID the callback is registered under, sent by the requester
     */
    var sendAck = function (uniqueID) {
        $.panelsocketserver.sendAck($.javaString(uniqueID));
    };

    /**
     * Sends an object response to a WS query
     *
     * @param {string} uniqueID The ID the callback is registered under, sent by the requester
     * @param {object} object A js object of key/value pairs to send
     */
    var sendObject = function (uniqueID, object) {
        var map = new Packages.java.util.HashMap();

        var x;
        for (x in object) {
            map.put(x, object[x]);
        }

        $.panelsocketserver.sendObject($.javaString(uniqueID), map);
    };

    /**
     * Sends an array response to a WS query
     *
     * @param {string} uniqueID The ID the callback is registered under, sent by the requester
     * @param {array} arr A js array of values to send
     */
    var sendArray = function (uniqueID, arr) {
        var array = new Packages.java.util.ArrayList();

        var x;
        for (x in arr) {
            array.add(arr[x]);
        }

        $.panelsocketserver.sendArray($.javaString(uniqueID), array);
    };

    $.panel = {
        /**
         * Sends an ack response to a WS query
         *
         * @param {string} uniqueID The ID the callback is registered under, sent by the requester
         */
        sendAck: sendAck,
        /**
         * Sends an object response to a WS query
         *
         * @param {string} uniqueID The ID the callback is registered under, sent by the requester
         * @param {object} object A js object of key/value pairs to send
         */
        sendObject: sendObject,
        /**
         * Sends an array response to a WS query
         *
         * @param {string} uniqueID The ID the callback is registered under, sent by the requester
         * @param {array} arr A js array of values to send
         */
        sendArray: sendArray
    };
})();
