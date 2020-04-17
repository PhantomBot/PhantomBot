/*
 * Copyright (C) 2016-2019 phantombot.tv
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

// Main stuff.
$(function() {
    var webSocket = new ReconnectingWebSocket((getProtocol() === 'https://' || window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/panel', null, { reconnectInterval: 500 }),
        localConfigs = getQueryMap(),
        chart;

    /*
     * @function Gets a map of the URL query
     */
    function getQueryMap() {
        let queryString = window.location.search, // Query string that starts with ?
            queryParts = queryString.substr(1).split('&'), // Split at each &, which is a new query.
            queryMap = new Map(); // Create a new map for save our keys and values.

        for (let i = 0; i < queryParts.length; i++) {
            let key = queryParts[i].substr(0, queryParts[i].indexOf('=')),
                value = queryParts[i].substr(queryParts[i].indexOf('=') + 1, queryParts[i].length);

            if (key.length > 0 && value.length > 0) {
                queryMap.set(key.toLowerCase(), value);
            }
        }

        return queryMap;
    }

    /*
     * @function Used to send messages to the socket. This should be private to this script.
     *
     * @param {Object} message
     */
    const sendToSocket = function(message) {
        try {
            let json = JSON.stringify(message);

            webSocket.send(json);

            // Make sure to not show the user's token.
            if (json.indexOf('authenticate') !== -1) {
                logSuccess('sendToSocket:: ' + json.substring(0, json.length - 20) + '.."}');
            } else {
                logSuccess('sendToSocket:: ' + json);
            }
        } catch (e) {
            logError('Failed to send message to socket: ' + e.message);
        }
    };

    /*
     * @function Checks if the query map has the option, if not, returns default.
     *
     * @param  {String} option
     * @param  {String} def
     * @return {String}
     */
    const getOptionSetting = function(option, def) {
        option = option.toLowerCase();

        if (localConfigs.has(option)) {
            return localConfigs.get(option);
        } else {
            return def;
        }
    };

    /*
     * @function Used to log things in the console.
     */
    const logSuccess = function(message) {
        console.log('%c[PhantomBot Log]', 'color: #6441a5; font-weight: 900;', message);
    };

    /*
     * @function Used to log things in the console.
     */
    const logError = function(message) {
        console.log('%c[PhantomBot Error]', 'color: red; font-weight: 900;', message);
    };

    /*
     * @function Gets a random RGB color.
     *
     * @see Thanks: https://stackoverflow.com/a/10020716/8005692
     */
    const getRandomRGB = function() {
        let maximum = 255,
            minimum = 100,
            range = (maximum - minimum),
            red = (Math.floor(Math.random() * range) + minimum),
            green = (Math.floor(Math.random() * range) + minimum),
            blue = (Math.floor(Math.random() * range) + minimum);

        return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
    };

    /*
     * @function Functions that creates our chart.
     *
     * @param obj The object of data
     * @param slideFrom The option where to slide it from, left, right, top, bottom.
     */
    const createChart = function(obj, slideFrom = 'right') {
        const poll = $('.poll'),
            height = $(window).height(),
            width = $(window).width();

        // Update height and stuff.
        poll.height(height);
        poll.width(width);

        $('.container').css({
            'margin-left': -(width / 2),
            'margin-top': -(height / 2)
        });

        // Show the chart.
        poll.toggle('slide', {
            'direction': slideFrom
        }, 1e3);

        // Make the chart.
        chart = new Chart(poll.get(0).getContext('2d'), getChartConfig(obj));

        chart.update();
    };

    /*
     * @function Functions that deletes our chart.
     *
     * @param slideFrom The option where to slide it from, left, right, top, bottom.
     */
    const disposeChart = function(slideFrom = 'right') {
        $('.poll').toggle('slide', {
            'direction': slideFrom
        }, 1e3, () => window.location.reload());
    };

    /*
     * @function Updates our chart.
     *
     * @param obj The object of data
     */
    const updateChart = function(obj) {
        const config = getChartConfig(obj, false);

        chart.data.datasets[0].data = config.data.datasets[0].data;

        chart.update();
    };

    /*
     * @function Function that gets data for our chart.
     *
     * @param obj The object of data
     * @param updateColor If the chart colors should be updated.
     * @return The config.
     */
    const getChartConfig = function(obj, updateColor = true) {
        const config = {
            'type': 'pie',
            'data': {
                'datasets': [{
                    'data': [],
                    'backgroundColor': []
                }],
                'labels': [],
            },
            'options': {
                'responsive': true,
                'tooltips': {
                    'enabled': true
                },
                'legend': {
                    'labels': {
                        'fontSize': 25,
                        'fontColor': 'black',
                        'padding': 25
                    },
                    'position': 'top',
                },
                'title': {
                    'display': true,
                    'fontSize': 35,
                    'fontColor': 'black',
                    'text': '!vote [#]'
                },
                'plugins': {
                    'datalabels': {
                        'color': '#000',
                        'font': {
                            'size': 50
                        },
                        'formatter': (value, ctx) => {
                            let sum = 0,
                                dataArr = ctx.chart.data.datasets[0].data;

                            dataArr.map(data => {
                                sum += data
                            });

                            if (value > 0) {
                                return ((value * 100 / sum).toFixed(0) + '%');
                            } else {
                                return '';
                            }
                        }
                    }
                }
            }
        };

        let idx = 1;

        // Add the data.
        JSON.parse(obj.data).map(json => {
            config.data.labels.push(json.label + ' (#' + idx++ + ')');
            config.data.datasets[0].data.push(parseInt(json.votes));

            if (updateColor)
                config.data.datasets[0].backgroundColor.push(getRandomRGB());
        });

        return config;
    };

    // WebSocket events.

    /*
     * @function Called when the socket opens.
     */
    webSocket.onopen = function() {
        logSuccess('Connection established with the websocket.');

        // Auth with the socket.
        sendToSocket({
            authenticate: getAuth()
        });
    };

    /*
     * @function Socket calls when it closes
     */
    webSocket.onclose = function() {
        logError('Connection lost with the websocket.');
    };

    /*
     * @function Called when we get a message.
     *
     * @param {Object} e
     */
    webSocket.onmessage = function(e) {
        try {
            // Handle PING/PONG
            if (e.data == 'PING') {
                webSocket.send('PONG');
                return;
            }

            let rawMessage = e.data,
                message = JSON.parse(rawMessage);

            if (!message.hasOwnProperty('query_id')) {
                // Check for our auth result.
                if (message.hasOwnProperty('authresult')) {
                    if (message.authresult === 'true') {
                        logSuccess('Successfully authenticated with the socket.');
                    } else {
                        logError('Failed to authenticate with the socket.');
                    }
                } else {
                    // Handle our stats.
                    if (message.hasOwnProperty('start_poll')) { // New poll handle it.
                        createChart(message, getOptionSetting('slideFromOpen', 'right'));
                    } else if (message.hasOwnProperty('new_vote')) { // New vote, handle it.
                        updateChart(message);
                    } else {
                        if (message.hasOwnProperty('end_poll')) { // End poll handle it.
                            disposeChart(getOptionSetting('slideFromClose', 'right'));
                        }
                    }
                }
            }
        } catch (ex) {
            logError('Error while parsing socket message: ' + ex.message);
            logError('Message: ' + e.data);
        }
    };
});
