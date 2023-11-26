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

/* global Pace, toastr */

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

    window.forceHttp = function() {
        window.localStorage.setItem('forceHttp', true);
        window.localStorage.setItem('forceWs', false);
        helpers.log('Panel will be forced to use HTTP Long Polling on next refresh', helpers.LOG_TYPE.FORCE);
    }

    window.forceWs = function() {
        window.localStorage.setItem('forceHttp', false);
        window.localStorage.setItem('forceWs', true);
        helpers.log('Panel will be forced to use WebSocket with infinite reconnects on next refresh', helpers.LOG_TYPE.FORCE);
    }

    window.forceNormal = function() {
        window.localStorage.setItem('forceHttp', false);
        window.localStorage.setItem('forceWs', false);
        helpers.log('Panel will be reset to use WebSocket with 3 reconnects, then HTTP Long Polling as a backup, on next refresh', helpers.LOG_TYPE.FORCE);
    }

    let usingWebsocket = window.localStorage.getItem('forceHttp') === 'true' ? false : true,
        lastReceivedTimestamp = 0,
        lastReceivedSequence = 0,
        lastTimestamp = 0,
        lastSequence = 0,
        sessionId = null,
        reconnectAttempts = 0,
        reconnectTimestamp = 0;
    const maxReconnectAttempts = window.localStorage.getItem('forceWs') === 'true' ? Infinity : 3;
    const webSocket = new ReconnectingWebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://')
        + helpers.getBotHost() + '/ws/panel?target=' + helpers.getBotHost(), null, {
        reconnectInterval: 500, reconnectDecay: 2, automaticOpen: false
    });

    if (window.localStorage.getItem('forceHttp') === 'true') {
        helpers.log('Force HTTP Long Polling option enabled', helpers.LOG_TYPE.FORCE);
    } else if (window.localStorage.getItem('forceWs') === 'true') {
        helpers.log('Force WebSocket option enabled', helpers.LOG_TYPE.FORCE);
    } else {
        helpers.log('Initializing WebSocket with ' + maxReconnectAttempts + ' reconnects before switching to HTTP Long Polling', helpers.LOG_TYPE.FORCE);
    }

    let callbacks = [],
            listeners = [],
            socket = {};

    const isLongpollInit = function() {
        return !usingWebsocket && socket.hasOwnProperty('longpoll') && socket.longpoll.init && !socket.longpoll.closed;
    };

    const sendLongpoll = async function() {
        navigator.locks.request('longpoll.send', () => {
            if (isLongpollInit() && socket.longpoll.sendingAbort === null) {
                socket.longpoll.sendingAbort = new AbortController();
                socket.longpoll.sendingAbortTimer = setTimeout(() => {
                    if (socket.longpoll.sendingAbort !== null) {
                        socket.longpoll.sendingAbort.abort();
                    }
                }, 30 * 1000);
                navigator.locks.request('longpoll.queue', () => {
                    const toSend = JSON.stringify(socket.longpoll.queue.splice(0, Infinity));
                    fetch(window.location.protocol + '//' + window.location.host + '/longpoll/panel?target=' + helpers.getBotHost(), {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + window.sessionStorage.getItem('b64'),
                            'Content-Type': 'application/json',
                            'SessionID': sessionId
                        },
                        mode: 'cors',
                        credentials: 'include',
                        body: toSend,
                        signal: socket.longpoll.sendingAbort.signal
                    }).then(r => {
                        if (!r.ok) {
                            close(r.status);
                        }
                    }, () => {
                        close(-1);
                    }).finally(async r => {
                        await navigator.locks.request('longpoll.send', async () => {
                            if (isLongpollInit()) {
                                clearInterval(socket.longpoll.sendingAbortTimer);
                                socket.longpoll.sendingAbort = null;
                            }
                        });

                        navigator.locks.request('longpoll.queue', () => {
                            if (socket.longpoll.queue.length > 0) {
                                sendLongpoll();
                            }
                        });
                    });
                });
            }
        });
    };

    const isJSObject = function(obj) {
        return obj !== undefined && obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    }

    const fetchLongpoll = function() {
        navigator.locks.request('longpoll.receive', async () => {
            if (isLongpollInit() && socket.longpoll.receivingAbort === null) {
                socket.longpoll.receivingAbort = new AbortController();
                socket.longpoll.receivingAbortTimer = setTimeout(() => {
                    if (socket.longpoll.receivingAbort !== null) {
                        socket.longpoll.receivingAbort.abort();
                    }
                }, 30 * 1000);

                await navigator.locks.request('receiver.sequence', () => {
                    return {timestamp: lastReceivedTimestamp, sequence:lastReceivedSequence};
                })
                .then(lastReceived => fetch(window.location.protocol + '//' + window.location.host + '/longpoll/panel?target=' + helpers.getBotHost()
                    + '&afterTimestamp=' + lastReceived.timestamp + '&afterSequence=' + lastReceived.sequence, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + window.sessionStorage.getItem('b64'),
                        'Content-Type': 'application/json',
                        'SessionID': sessionId
                    },
                    mode: 'cors',
                    credentials: 'include'
                })).then(r => {
                    if (r.ok) {
                        return r.json();
                    } else {
                        close(r.status);
                        return Promise.reject();
                    }
                }, () => {
                        close(-1);
                }).then(jsa => {
                    if (Array.isArray(jsa)) {
                        jsa.forEach(element => {
                            if (isJSObject(element)) {
                                onmessage(element);
                            }
                        });
                    } else if (isJSObject(jsa)) {
                        onmessage(jsa);
                    }
                }).finally(r => {
                    navigator.locks.request('longpoll.receive', async () => {
                        if (isLongpollInit()) {
                            clearInterval(socket.longpoll.receivingAbortTimer);
                            socket.longpoll.receivingAbort = null;
                        }
                    });
                });
            }
        }).finally(() => fetchLongpoll());
    };

    const close = function(code) {
        if (usingWebsocket) {
            webSocket.close(code);
        } else {
            navigator.locks.request('longpoll.close', async () => {
                if (isLongpollInit()) {
                    socket.longpoll.closed = true;
                    await navigator.locks.request('longpoll.queue', () => {
                        socket.longpoll.queue.splice(0, Infinity);
                    });
                    onclose();
                    setTimeout(() => initLongPoll(), 2 * 1000);
                }
            });
        }
    };

    const sendAuth = async function() {
        const message = {
            authenticate: getAuth()
        };

        if (usingWebsocket) {
            webSocket.send(JSON.stringify(message));
        } else {
            const toSend = JSON.stringify([message]);
            fetch(window.location.protocol + '//' + window.location.host + '/longpoll/panel?target=' + helpers.getBotHost(), {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + window.sessionStorage.getItem('b64'),
                    'Content-Type': 'application/json'
                },
                body: toSend
            }).then(r => r.json()).then(jsa => {
                if (Array.isArray(jsa)) {
                    jsa.forEach(element => {
                        if (isJSObject(element)) {
                            onmessage(element);
                        }
                    });
                } else if (isJSObject(jsa)) {
                    onmessage(jsa);
                }
            });
        }
    };

    const send = async function(message) {
        message = {
            metadata: {
                timestamp: 0,
                sequence: 0
            },
            data: message
        };

        await navigator.locks.request('sender.sequence', () => {
            const now = Date.now();
            if (now === lastTimestamp) {
                lastSequence++;
            } else {
                lastSequence = 0;
            }

            lastTimestamp = now;

            message.metadata.timestamp = now;
            message.metadata.sequence = lastSequence;
        });

        if (usingWebsocket) {
            await navigator.locks.request('receiver.sequence', () => {
                message.metadata.skipTimestamp = lastReceivedTimestamp;
                message.metadata.skipSequence = lastReceivedSequence;
            });

            webSocket.send(JSON.stringify(message));
        } else {
            await navigator.locks.request('longpoll.queue', () => {
                if (isLongpollInit()) {
                    socket.longpoll.queue.push(message);
                    sendLongpoll();
                }
            });
        }
    };

    const initLongPoll = async function() {
        await navigator.locks.request('longpoll.init', () => {
            if (!socket.hasOwnProperty('longpoll') || socket.longpoll.closed) {
                socket.longpoll = {
                    queue: [],
                    sendingAbort: null,
                    sendingAbortTimer: null,
                    receivingAbort: null,
                    receivingAbortTimer: null,
                    closed: false,
                    init: false
                };
                socket.longpoll.init = true;
                onopen();
            }
        });
    };

    const onAuth = function() {
        helpers.log('Connection established with the websocket.', helpers.LOG_TYPE.FORCE);

        if (!usingWebsocket) {
            fetchLongpoll();
        }
    };

    /*
     * @function Used to send messages to the socket. This should be private to this script.
     *
     * @param {Object} message
     */
    const sendToSocket = function (message) {
        try {
            message.section = $.currentPage().folder;

            send(message);

            helpers.log('sendToSocket:: ' + JSON.stringify(message).replace(getAuth(), '...'), helpers.LOG_TYPE.DEBUG);
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
    const generateCallBack = function (id, tables, isUpdate, isArray, callback, storeKey) {
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
    socket.wsEvent = function (callback_id, script, argsString, args, callback, requiresReply, makeUnique) {
        if (makeUnique === true) {
            callback_id = callback_id + '_' + helpers.getRandomString(4);
        }
        // Genetate a callback.
        generateCallBack(callback_id, [], requiresReply !== true, true, callback);

        // Send event.
        sendToSocket({
            socket_event: callback_id,
            script: script,
            requiresReply: requiresReply,
            args: {
                arguments: String(argsString),
                args: args
            }
        });
    };

    socket.getDiscordChannelList = function (callback_id, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

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
     * @function Gets all panel users
     *
     * @param {String}       callback_id
     * @param {Function}     callback
     */
    socket.getAllPanelUsers = function (callback_id, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUser: callback_id,
            getAll: true
        });
    };

    /*
     * @function Gets specific panel user
     *
     * @param {String}       callback_id
     * @param {String}       username
     * @param {Function}     callback
     */
    socket.getPanelUser = function (callback_id, username, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUserRO: callback_id,
            get: String(username)
        });
    };

    /*
     * @function Adds a panel User
     *
     * @param {String}       callback_id
     * @param {String}       username
     * @param {String}       permission
     * @param {Boolean}      enabled
     * @param {Function}     callback
     */
    socket.addPanelUser = function (callback_id, username, permission, enabled, canRestartBot, canManageUsers, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUser: callback_id,
            add: {
                username: String(username),
                permission: String(permission),
                enabled: enabled,
                canRestartBot: canRestartBot,
                canManageUsers: canManageUsers
            }
        });
    };

    /*
     * @function Deletes a panel User
     *
     * @param {String}       callback_id
     * @param {String}       username
     * @param {Function}     callback
     */
    socket.deletePanelUser = function (callback_id, username, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUser: callback_id,
            delete: String(username)
        });
    };

    /*
     * @function Edits a panel user
     *
     * @param {String}       callback_id
     * @param {String}       currentUsername
     * @param {String}       newUsername
     * @param {String}       permission
     * @param {Boolean}      enabled
     * @param {Function}     callback
     */
    socket.editPanelUser = function (callback_id, currentUsername, newUsername, permission, enabled, canRestartBot, canManageUsers, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUser: callback_id,
            edit: {
                currentUsername: String(currentUsername),
                newUsername: String(newUsername),
                permission: String(permission),
                enabled: enabled,
                canRestartBot: canRestartBot,
                canManageUsers: canManageUsers
            }
        });
    };

    /*
     * @function Changes a panel user's password
     *
     * @param {String}       callback_id
     * @param {String}       username
     * @param {String}       currentPassword
     * @param {String}       newPassword
     * @param {Function}     callback
     */
    socket.changePanelUserPWD = function (callback_id, username, currentPassword, newPassword, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUserRO: callback_id,
            changePassword: {
                username: String(username),
                currentPassword: String(CryptoJS.SHA256(currentPassword).toString()),
                newPassword: String(CryptoJS.SHA256(newPassword).toString())
            }
        });
    };

    /*
     * @function Resets a panel user's password
     *
     * @param {String}       callback_id
     * @param {String}       username
     * @param {Function}     callback
     */
    socket.resetPanelUserPWD = function (callback_id, username, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUser: callback_id,
            resetPassword: String(username)
        });
    };

    /*
     * @function Gets all panel permission level
     *
     * @param {String}       callback_id
     * @param {Function}     callback
     */
    socket.getPanelPermissionLevels = function (callback_id, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUserRO: callback_id,
            permission: true
        });
    };

    /*
     * @function Gets all panel sections to which permissions can be assigned
     *
     * @param {String}       callback_id
     * @param {Function}     callback
     */
    socket.getPanelSections = function (callback_id, callback) {
        // Genetate a callback.
        generateCallBack(callback_id, [], false, true, callback);

        // Query database.
        sendToSocket({
            panelUserRO: callback_id,
            sections: true
        });
    };

    /*
     * @function Sends a remote panel query.
     *
     * @param {String}   query_id
     * @param {String}   query
     * @param {Object}   params
     * @param {Function} callback
     */
    socket.doRemote = function (query_id, query, params, callback, isArray) {
        generateCallBack(query_id, [], false, true, callback);

        sendToSocket({
            remote: true,
            id: query_id,
            query: query,
            params: params
        });
    };

    /*
     * Sends a query requiring a reply
     * @param {String} type The message type
     * @param {String} query_id The unique Query ID
     * @param {Object} params Optional object of params to send
     * @param {Function} callback Callback function
     * @returns {undefined}
     */
    socket.query = function (type, query_id, params, callback, makeUnique) {
        if (makeUnique === true) {
            query_id = query_id + '_' + helpers.getRandomString(4);
        }
        generateCallBack(query_id, [], false, true, callback);

        let param = {};
        param[type] = query_id;

        if (params !== undefined && params !== null) {
            for (let x in params) {
                param[x] = params[x];
            }
        }

        sendToSocket(param);
    };

    /*
     * Sends a query not requiring a reply
     * @param {String} type The message type
     * @param {String} query_id The unique Query ID
     * @param {Object} params Optional object of params to send
     * @param {Function} callback Callback function
     * @returns {undefined}
     */
    socket.update = function (type, query_id, params, callback, makeUnique) {
        if (makeUnique === true) {
            query_id = query_id + '_' + helpers.getRandomString(4);
        }
        generateCallBack(query_id, [], true, true, callback);

        let param = {};
        param[type] = query_id;

        if (params !== undefined && params !== null) {
            for (let x in params) {
                param[x] = params[x];
            }
        }

        sendToSocket(param);
    };

    socket.close = function () {
        close(1000);
    };

    // WebSocket events.

    /*
     * @function Called when the socket opens.
     */
    const onopen = function () {
        // Restart Pace.
        Pace.restart();
        // Remove all alerts.
        toastr.remove();
        // Auth with the socket.
        sendAuth();
    };

    /*
     * @function Socket calls when it closes
     */
    const onclose = function () {
        helpers.logError('Connection lost with the websocket.', helpers.LOG_TYPE.FORCE);
        // Add error toast.
        toastr.error('Connection lost with the websocket.', '', {timeOut: 0});
        window.updateCookie();
    };

    /*
     * @function Socket calls when it gets message.
     */
    const onmessage = async function (message) {
        try {
            helpers.log('Message from socket: ' + JSON.stringify(message), helpers.LOG_TYPE.DEBUG);

            if (message.metadata !== undefined) {
                await navigator.locks.request('receiver.sequence', () => {
                    if (message.metadata.timestamp > lastReceivedTimestamp) {
                        lastReceivedTimestamp = message.metadata.timestamp;
                        lastReceivedSequence = message.metadata.sequence;
                    } else if (message.metadata.timestamp === lastReceivedTimestamp && message.metadata.sequence > lastReceivedSequence) {
                        lastReceivedSequence = message.metadata.sequence;
                    }
                });
                message = message.data;
            }

            // Check this message here before doing anything else.
            if (message.authresult !== undefined) {
                if (message.authresult === 'false') {
                    helpers.logError('Failed to auth with the socket.', helpers.LOG_TYPE.FORCE);
                    toastr.error('Failed to auth with the socket.', '', {timeOut: 0});
                    close();
                } else {
                    sessionId = message.sessionId;
                    onAuth();
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
                    helpers.log('Auth success', helpers.LOG_TYPE.DEBUG);
                }
                return;
            }

            if (message.id !== undefined) {
                if (message.id === 'initLoad.panelSettings') {
                    helpers.isAuth = true;
                    window.panelSettings.channelName = message.channelName;
                    window.panelSettings.botName = message.botName;
                    window.panelSettings.displayName = message.displayName;
                    helpers.loadCurrentUserInfo();
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
                            let key = 'value';
                            for (const k of Object.keys(message.results)) {
                                if (k !== 'table' && k !== 'value') {
                                    key = k;
                                    break;
                                }
                            }
                            callback.queryData[key] = message.results.value;
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
                            if (message.results !== undefined && message.results.value === 'false') {
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
            console.log(ex);
        }
    };

    webSocket.onopen = onopen;
    webSocket.onclose = onclose;
    webSocket.onmessage = function(e) {
        try {
            if (e.data === undefined || e.data === null || e.data === 'PING') {
                return;
            }

            onmessage(JSON.parse(e.data));
        } catch (ex) {
            console.log(ex);
        }
    };

    webSocket.onconnecting = function() {
        navigator.locks.request('webSocket.reconnect', () => {
            if (Date.now() > reconnectTimestamp) {
                reconnectAttempts = 0;
                reconnectTimestamp = Date.now() + (30 * 1000);
            } else {
                reconnectAttempts = reconnectAttempts + 1;
            }
            if (reconnectAttempts >= maxReconnectAttempts) {
                webSocket.close();
                usingWebsocket = false;
                helpers.logWarning('WebSocket retry limit reached, switching to HTTP Long Polling');
                initLongPoll();
            }
        });
    }

    if (usingWebsocket) {
        webSocket.open();
    } else {
        initLongPoll();
    }

    // Make this a global object.
    window.socket = socket;
    // Store all timers in here so we can destroy them.
    window.timers = [];
});
