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
 *
 * @author ScaniaTV
 */

$(function() {
    var socket = new WebSocket((getProtocol() === 'https://' || window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/ytplayer'),
        listeners = [],
        player = {},
        hasAPIKey = true,
        secondConnection = false;

    /*
     * @function sends data to the socket, this should only be used in this script.
     *
     * @param {Object} data
     */
    var sendToSocket = (data) => {
        // Do not send any requests or any other data to the Core for processing if there is no key.
        if (!hasAPIKey) {
            return;
        }

        try {
            socket.send(JSON.stringify(data));
        } catch (ex) {
            console.error('Failed to send message to socket: ' + ex.message);
        }
    };

    /*
     * @function to determine is a second connection was detected.
     */
    player.secondConnection = () => {
        return secondConnection;
    }

    /*
     * @function to determine if an API key exists.
     */
    player.hasAPIKey = () => {
        return hasAPIKey;
    }

    /*
     * @function gets the playlist.
     *
     * @param {String} callback_id
     */
    player.requestPlaylist = (callback_id) => {
        // Request the data.
        sendToSocket({
            query: 'playlist'
        });
    };

    /*
     * @function gets the request list.
     *
     * @param {String} callback_id
     */
    player.requestRequestList = (callback_id) => {
        // Request the data.
        sendToSocket({
            query: 'songlist'
        });
    };

    /*
     * @function deletes a song from the current playlist.
     */
    player.deleteFromPlaylist = () => {
        sendToSocket({
            command: 'deletecurrent'
        });
    };

    /*
     * @function "steals" a song and adds it to the default playlist.
     *
     * @param {String} song_id
     * @param {String} requester
     */
    player.addSongToPlaylist = (song_id, requester) => {
        // Update the data.
        sendToSocket({
            command: 'stealsong',
            youTubeID: (song_id === undefined ? '' : song_id),
            requester: (requester === undefined ? '' : requester)
        });
    };

    /*
     * @function adds a song to the queue.
     *
     * @param {String} song_id
     */
    player.requestSong = (song_id) => {
        // Add song to queue.
        sendToSocket({
            command: 'songrequest',
            search: song_id
        });
    };

    /*
     * @function removes a song from the default playlist.
     *
     * @param {String} song_id
     * @param {String} requester
     */
    player.removeSongFromPlaylist = (song_id) => {
        // Update the data.
        sendToSocket({
            deletepl: song_id
        });
    };

    /*
     * @function removes a song from the queue.
     *
     * @param {String} song_id
     * @param {String} requester
     */
    player.removeSongFromRequest = (song_id) => {
        // Update the data.
        sendToSocket({
            deletesr: song_id
        });
    };

    /*
     * @function shuffles the playlist.
     */
    player.shufflePlaylist = () => {
        // Update the data.
        sendToSocket({
            command: 'togglerandom'
        });
    };

    /*
     * @function loads a new playlist
     *
     * @param {String} playlist
     */
    player.loadPlaylist = (playlist) => {
        // Update the data.
        sendToSocket({
            command: 'loadpl',
            playlist: playlist
        });
    };

    /*
     * @function skips the current song.
     */
    player.skipSong = () => {
        sendToSocket({
            command: 'skipsong'
        });
    };

    /*
     * @function updates the player status.
     *
     * @param {Number} status
     */
    player.updateState = (status) => {
        sendToSocket({
            status: {
                state: status
            }
        });
    };

    /*
     * @function updates the current song.
     *
     * @param {String} id
     */
    player.updateSong = (id) => {
        sendToSocket({
            status: {
                currentid: id
            }
        });
    };

    /*
     * @function puts the player in ready mode.
     */
    player.ready = () => {
        sendToSocket({
            status: {
                ready: true
            }
        });
    };

    /*
     * @function sends error code from YouTube Player
     *
     * @param {Number} status
     */
    player.sendError = (status) => {
        sendToSocket({
            status: {
                errorcode: status
            }
        });
    };

    /*
     * @function updates the player volume.+
     *
     * @param {Number} volume
     */
    player.updateVolume = (volume) => {
        sendToSocket({
            status: {
                volume: volume
            }
        });
    };

    /*
     * @function puts the player in ready-pause mode.
     */
    player.readyPause = () => {
        sendToSocket({
            status: {
                readypause: true
            }
        });
    };

    /*
     * @function Gets all keys and values from a table
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {Function} callback
     */
    player.dbQuery = (callback_id, table, callback) => {
        listeners[callback_id] = callback;

        sendToSocket({
            dbquery: true,
            query_id: callback_id,
            table: table
        });
    };

    /*
     * @function Updates a key and value in the database
     *
     * @param {String}   callback_id
     * @param {String}   table
     * @param {String}   key
     * @param {String}   value
     * @param {Function} callback
     */
    player.dbUpdate = (callback_id, table, key, value, callback) => {
        if (callback !== undefined) {
            listeners[callback_id] = callback;
        }

        sendToSocket({
            dbupdate: true,
            query_id: callback_id,
            update: {
                table: table,
                key: key,
                value: value
            }
        });
    };

    /*
     * @function adds a listener to the socket.
     *
     * @param {String}   listener_id
     * @param {Function} listener
     */
    player.addListener = (listener_id, listener) => {
        listeners[listener_id] = listener;
    };

    /* Socket functions */

    /*
     * @function is called when the socket opens.
     */
    socket.onopen = (e) => {
        console.info('Connection established with the websocket.');

        // Send the auth to the bot.
        sendToSocket({
            authenticate: getAuth()
        });

        // Load the YouTube iframe.
        $('body').append($('<script/>', {
            src: 'https://www.youtube.com/iframe_api'
        }));
    };

    /*
     * @function the socket calls when it closes
     */
    socket.onclose = (e) => {
        console.error('Connection lost with the websocket.');

        if (secondConnection) {
            toastr.error('PhantomBot has closed the WebSocket.', '', {timeOut: 0});
        } else {
            toastr.error('Connection with WebSocket was lost. Refresh once reestablished.', '', {timeOut: 0});
        }
    };

    /*
     * @function the socket calls when it gets message.
     */
    socket.onmessage = (e) => {
        try {
            let message = JSON.parse(e.data);

            if (message.ping !== undefined) {
                sendToSocket({
                    pong: "pong"
                });
                return;
            }

            // Check this message here before doing anything else.
            if (message.secondconnection !== undefined) {
                if (message.secondconnection === true) {
                    secondConnection = true;
                    toastr.error('PhantomBot rejected the connection due to a player window already being open.', '',
                                 {timeOut: 0, extendedTimeOut: 0});
                    console.error('Only one instance allowed.');
                }
                return;
            }

            // Check this message here before doing anything else.
            if (message.authresult !== undefined) {
                if (message.authresult === false) {
                    console.error('Failed to auth with the socket.');
                }
                return;
            }

            // Check to ensure that there is an API key.
            if (message.ytkeycheck !== undefined) {
                if (message.ytkeycheck === false) {
                    hasAPIKey = false;
                    console.error("Missing YouTube API Key.");
                    toastr.error('A YouTube API key has not been configured. Please review the instructions ' +
                                 '<a href="https://phantombot.dev/guides/#guide=content/integrations/youtubesetup">here' +
                                 '</a>.', 'Missing YouTube API Key',
                                 {timeOut: 0, extendedTimeOut: 0});
                }
                return;
            }

            if (message.query_id !== undefined) {
                if (listeners[message.query_id] !== undefined) {
                    listeners[message.query_id](message);
                    delete listeners[message.query_id];
                }
            } else if (message.command !== undefined) {
                if (typeof message.command === 'object') {
                    let keys = Object.keys(message.command);

                    for (let i = 0; i < keys.length; i++) {
                        if (listeners[keys[i]] !== undefined) {
                            listeners[keys[i]](message.command);
                            return;
                        }
                    }
                } else {
                    if (listeners[message.command] !== undefined) {
                        listeners[message.command](message);
                    }
                }
            } else {
                let keys = Object.keys(message);

                for (let i = 0; i < keys.length; i++) {
                    if (listeners[keys[i]] !== undefined) {
                        listeners[keys[i]](message);
                        return;
                    }
                }
            }
        } catch (ex) {
            console.error('Failed to parse message from socket: ' + ex.message);
        }
    }

    // Make the player object global.
    window.player = player;
});
