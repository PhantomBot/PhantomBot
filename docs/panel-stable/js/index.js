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

// Main socket and functions.
$(function () {
    if (!helpers.isLocalPanel()) {
        $.ajax(
                {
                    type: 'GET',
                    url: 'https://' + helpers.getBotHost() + '/sslcheck',
                    crossDomain: true,
                    dataType: 'text',
                    async: false,
                    success: function (data) {
                        if (data === 'false') {
                            window.location = window.location.origin + window.location.pathname + 'login/#sslFail=true';
                        }
                    },
                    error: function () {
                        window.location = window.location.origin + window.location.pathname + 'login/#sslFail=true';
                    }
                }
        );
    }
    var webSocket = new ReconnectingWebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + helpers.getBotHost() + '/ws/panel?target=' + helpers.getBotHost(), null, {reconnectInterval: 500}),
            callbacks = [],
            listeners = [],
            socket = {};

    /*
     * @function Used to send messages to the socket. This should be private to this script.
     *
     * @param {Object} message
     */
    var sendToSocket = function (message) {
        try {
            let json = JSON.stringify(message);

            webSocket.send(json);

            // Make sure to not show the user's token.
            if (json.indexOf('authenticate') !== -1) {
                helpers.log('sendToSocket:: ' + json.substring(0, json.length - 20) + '.."}', helpers.LOG_TYPE.DEBUG);
            } else {
                helpers.log('sendToSocket:: ' + json, helpers.LOG_TYPE.DEBUG);
            }
        } catch (e) {
            helpers.logError('Failed to send message to socket: ' + e.message, helpers.LOG_TYPE.DEBUG);
        }
    };

    /*
     * @function Generates a callback
     *
     * @param {String}   id
     * @param {Array}    tables
     * @param {Boolean}  isUpdate
     * @param {Function} callback
     * @param {Boolean}  storeKey
     */
    var generateCallBack = function (id, tables, isUpdate, isArray, callback, storeKey) {
        if (callbacks[id] !== undefined) {
            helpers.logError('Callback with id "' + id + '" exists already. Aborting update.', helpers.LOG_TYPE.FORCE);
        } else {
            helpers.log('Created callback with id ' + id, helpers.LOG_TYPE.DEBUG);

            callbacks[id] = {
                await: (tables.length === 0 ? 1 : tables.length),
                isUpdate: isUpdate,
                isArray: isArray,
                func: function (e) {
                    try {
                        callback(e);
                    } catch (ex) {
                        // Line number won't be accurate, function will by anonymous, but we get the stack so it should be fine.
                        helpers.logError('Failed to run callback: (' + ex.name + ') ' + ex.message + ' >> ' + ex.stack, helpers.LOG_TYPE.FORCE);
                    }
                },
                storeKey: storeKey,
                queryData: []
            };
        }
    };

    /*
     * @function Adds a listener for the socket.
     *
     * @param {String}   listener_id
     * @param {Function} callback
     */
    socket.addListener = function (listener_id, callback) {
        if (listeners[listener_id] === undefined) {
            helpers.log('Added listener with id ' + listener_id);
            listeners[listener_id] = function (e) {
                try {
                    callback(e);
                } catch (ex) {
                    // Line number won't be accurate, function will by anonymous, but we get the stack so it should be fine.
                    helpers.logError('Failed to run listener: (' + ex.name + ') ' + ex.message + ' >> ' + ex.stack, helpers.LOG_TYPE.FORCE);
                }
            };
        }
    };

    /*
     * @function Removes a listener from the socket.
     *
     * @param {String}   listener_id
     */
    socket.removeListener = function (listener_id) {
        if (listeners[listener_id] !== undefined) {
            delete listeners[listener_id];
        }
    };

    /*
     * @function Runs a bot commands as the bot in async, thus returning right away.
     *
     * @param {String}   callback_id
     * @param {String}   command
     * @param {Function} callback
     */
    socket.sendCommand = function (callback_id, command, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Send the command.
        sendToSocket({
            command: String(command),
            query_id: callback_id
        });
    };

    /*
     * @function Sends a raw request to the socket.
     *
     * @param {String}   callback_id
     * @param {Function} callback
     */
    socket.getBotVersion = function (callback_id, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Send the request.
        sendToSocket({
            version: callback_id
        });
    };

    /*
     * @function Runs a bot commands as the bot.
     *
     * @param {String}   callback_id
     * @param {String}   command
     * @param {Function} callback
     */
    socket.sendCommandSync = function (callback_id, command, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Send the command.
        sendToSocket({
            command_sync: String(command),
            query_id: callback_id
        });
    };

    /*
     * @function Sends the websocket event.
     *
     * @param {String}   callback_id
     * @param {String}   script
     * @param {String}   argsString
     * @param {Array}    args
     * @param {Function} callback
     */
    socket.wsEvent = function (callback_id, script, argsString, args, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Send event.
        sendToSocket({
            socket_event: callback_id,
            script: script,
            args: {
                arguments: String(argsString),
                args: args
            }
        });
    };

    socket.getDiscordChannelList = function (callback_id, callback) {
        // Genetate a callback.
        socket.addListener(callback_id, callback);

        // Send event.
        sendToSocket({
            discordchannellist: callback_id
        });
    };

    /*
     * @function Updates a value in the database of the bot.
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {String}   key
     * @param {String}   value
     * @param {Function} callback
     */
    socket.updateDBValue = function (callback_id, table, key, value, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Update the value.
        sendToSocket({
            dbupdate: callback_id,
            update: {
                table: String(table),
                key: String(key),
                value: String(value)
            }
        });
    };

    /*
     * @function Updates values in the database of the bot.
     *
     * @param {String}   callback_id
     * @param {Object}   dataObj {tables: [], keys: [], values: }
     * @param {Function} callback
     */
    socket.updateDBValues = function (callback_id, dataObj, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, dataObj.tables, true, false, callback);

        // Start sending the updates to the socket.
        for (let i = 0; i < dataObj.tables.length; i++) {
            sendToSocket({
                dbupdate: callback_id,
                update: {
                    table: String(dataObj.tables[i]),
                    key: String(dataObj.keys[i]),
                    value: String(dataObj.values[i])
                }
            });
        }
    };

    /*
     * @function Increases a value in the database.
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {String}   key
     * @param {String}   value
     * @param {Function} callback
     */
    socket.incrDBValue = function (callback_id, table, key, value, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Update the value.
        sendToSocket({
            dbincr: callback_id,
            incr: {
                table: table,
                key: key,
                value: value
            }
        });
    };

    /*
     * @function Decreases a value in the database.
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {String}   key
     * @param {String}   value
     * @param {Function} callback
     */
    socket.decrDBValue = function (callback_id, table, key, value, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], true, false, callback);

        // Update the value.
        sendToSocket({
            dbdecr: callback_id,
            decr: {
                table: table,
                key: key,
                value: value
            }
        });
    };

    /*
     * @function Gets a value from the database
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {String}   key
     * @param {Function} callback
     */
    socket.getDBValue = function (callback_id, table, key, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, false, callback);

        // Query database.
        sendToSocket({
            dbquery: callback_id,
            query: {
                table: String(table),
                key: String(key)
            }
        });
    };

    /*
     * @function Gets values from the database
     *
     * @param {String}   callback_id
     * @param {Object}   dataObj {tables: [], keys: []}
     * @param {Function} callback
     * @param {Boolean}  storeKey - Store the value with the key name from the DB. Default stores it as the table, thus making it only possible to query the table once.
     */
    socket.getDBValues = function (callback_id, dataObj, storeKey, callback) {
        callback = (callback === undefined ? storeKey : callback);

        // Genetate a callback.
        generateCallBack(callback_id, dataObj.tables, false, false, callback, (typeof storeKey !== 'function'));

        // Start sending the updates to the socket.
        for (let i = 0; i < dataObj.tables.length; i++) {
            sendToSocket({
                dbquery: callback_id,
                query: {
                    table: String(dataObj.tables[i]),
                    key: String(dataObj.keys[i])
                }
            });
        }
    };

    /*
     * @function Gets values from the database by an order.
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {Number}   limit
     * @param {Number}   offset
     * @param {String}   order
     * @param {Function} callback
     */
    socket.getDBTableValuesByOrder = function (callback_id, table, limit, offset, order, isNumber, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            dbvaluesbyorder: callback_id,
            query: {
                table: table,
                limit: String(limit),
                offset: String(offset),
                order: order,
                number: String(isNumber)
            }
        });
    };

    /*
     * @function Gets all keys and values from a database table.
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {Function} callback
     */
    socket.getDBTableValues = function (callback_id, table, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            dbkeys: callback_id,
            query: {
                table: String(table)
            }
        });
    };

    /*
     * @function Gets all keys and values from multiple database table.
     *
     * @param {String}       callback_id
     * @param {Array Object} tables [{table: 'a'}, {table: 'b'}]
     * @param {Function}     callback
     */
    socket.getDBTablesValues = function (callback_id, tables, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            dbkeyslist: callback_id,
            query: tables
        });
    };

    /*
     * @function Removes the data from the database.
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {String}   key
     * @param {Function} callback
     */
    socket.removeDBValue = function (callback_id, table, key, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Send the event.
        sendToSocket({
            dbdelkey: callback_id,
            delkey: {
                table: String(table),
                key: String(key)
            }
        });
    };

    /*
     * @function Removes the data from the database.
     *
     * @param {String}   callback_id
     * @param {Object}   dataObj {tables: [], keys: []}
     * @param {Function} callback
     */
    socket.removeDBValues = function (callback_id, dataObj, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, dataObj.tables, false, true, callback);

        for (let i = 0; i < dataObj.tables.length; i++) {
            // Send the event.
            sendToSocket({
                dbdelkey: callback_id,
                delkey: {
                    table: String(dataObj.tables[i]),
                    key: String(dataObj.keys[i])
                }
            });
        }
    };

    /*
     * @function Sends a remote panel query.
     *
     * @param {String}   query_id
     * @param {String}   query
     * @param {Object}   params
     * @param {Function} callback
     */
    socket.doRemote = function (query_id, query, params, callback) {
        generateCallBack(query_id, [], false, true, callback);

        sendToSocket({
            remote: true,
            id: query_id,
            query: query,
            params: params
        });
    };

    socket.close = function () {
        webSocket.close(1000);
    };

    // WebSocket events.

    /*
     * @function Called when the socket opens.
     */
    webSocket.onopen = function () {
        helpers.log('Connection established with the websocket.', helpers.LOG_TYPE.FORCE);
        // Restart Pace.
        Pace.restart();
        // Remove all alerts.
        toastr.remove();
        // Auth with the socket.
        sendToSocket({
            authenticate: getAuth()
        });
    };

    /*
     * @function Socket calls when it closes
     */
    webSocket.onclose = function () {
        helpers.logError('Connection lost with the websocket.', helpers.LOG_TYPE.FORCE);
        // Add error toast.
        toastr.error('Connection lost with the websocket.', '', {timeOut: 0});
    };

    /*
     * @function Socket calls when it gets message.
     */
    webSocket.onmessage = function (e) {
        try {
            helpers.log('Message from socket: ' + e.data, helpers.LOG_TYPE.DEBUG);

            if (e.data === 'PING') {
                helpers.log('Sending PONG', helpers.LOG_TYPE.DEBUG);
                webSocket.send('PONG');
                return;
            }

            let message = JSON.parse(e.data);

            // Check this message here before doing anything else.
            if (message.authresult !== undefined) {
                if (message.authresult === 'false') {
                    helpers.logError('Failed to auth with the socket.', helpers.LOG_TYPE.FORCE);
                    toastr.error('Failed to auth with the socket.', '', {timeOut: 0});
                } else {
                    // This is to stop a reconnect loading the main page.
                    if (helpers.isAuth === true) {
                        helpers.log('Found reconnect auth', helpers.LOG_TYPE.DEBUG);
                        return;
                    }

                    sendToSocket({
                        remote: true,
                        id: 'initLoad.panelSettings',
                        query: 'panelSettings'
                    });
                }
                helpers.log('Auth success', helpers.LOG_TYPE.DEBUG);
                return;
            }

            if (message.id !== undefined) {
                if (message.id === 'initLoad.panelSettings') {
                    helpers.isAuth = true;
                    window.panelSettings.channelName = message.channelName;
                    window.panelSettings.botName = message.botName;
                    window.panelSettings.displayName = message.displayName;
                    $.loadPage('dashboard', 'dashboard.html');
                    helpers.getUserLogo();
                }
            }

            // Make sure this isn't a version request.
            if (message.versionresult !== undefined) {
                helpers.log('Got version result...', helpers.LOG_TYPE.DEBUG);
                // Call the callback.
                callbacks[message.versionresult].func(message);
                // Delete the callback.
                delete callbacks[message.versionresult];
                helpers.log('Callback complete', helpers.LOG_TYPE.DEBUG);
            } else {
                helpers.log('Looking for callbacks and listeners for ' + message.query_id + '...', helpers.LOG_TYPE.DEBUG);
                // Handle callbacks.
                let callback = callbacks[message.query_id],
                        listener = listeners[message.query_id];

                if (callback !== undefined) {
                    helpers.log('Found callback...', helpers.LOG_TYPE.DEBUG);
                    // Add our data to the callback array.
                    if (!callback.isUpdate) {
                        if (callback.isArray) {
                            callback.queryData = message.results;
                        } else if (callback.storeKey === true) {
                            callback.queryData[Object.keys(message.results)[1]] = message.results.value;
                        } else {
                            callback.queryData[message.results.table] = message.results.value;
                        }
                    }

                    // If we got all the data, run the callback.
                    if (--callback.await === 0) {
                        helpers.log('Running callback...', helpers.LOG_TYPE.DEBUG);
                        // Run the function and send the query data with it.
                        callback.func(callback.queryData);
                        // Log this.
                        helpers.log('Called callback with id: ' + message.query_id, helpers.LOG_TYPE.DEBUG);
                        // Remove the callback from the array.
                        delete callbacks[message.query_id];

                        // Remove any active spinners.
                        if (message.query_id !== 'get_bot_updates' && message.query_id.indexOf('get') !== -1) {
                            // Remove any active spinners.
                            $('.load-ajax').remove();
                        }

                        if (message.query_id.indexOf('module_toggle') !== -1 || message.query_id.indexOf('module_status') !== -1
                                || message.query_id.endsWith('module')) {
                            if (message.results !== undefined && message.results.value == 'false') {
                                $('.load-ajax').remove();
                            }
                        }
                    } else {
                        helpers.log('Awaiting for data (' + callback.await + ' left) before calling callback with id: ' + message.query_id, helpers.LOG_TYPE.DEBUG);
                    }
                } else if (listener !== undefined) {
                    helpers.log('Found listener...', helpers.LOG_TYPE.DEBUG);
                    // Call the listener.
                    listener(message.results);
                    helpers.log('Listener complete', helpers.LOG_TYPE.DEBUG);
                }
            }
        } catch (ex) {
            // Line number won't be accurate, function will by anonymous, but we get the stack so it should be fine.
            helpers.logError('Failed to parse message from socket: ' + ex.stack + '\n\n' + e.data, helpers.LOG_TYPE.FORCE);
        }
    };

    // Make this a global object.
    window.socket = socket;
    // Store all timers in here so we can destroy them.
    window.timers = [];
});
