/*
 * Copyright (C) 2016-2018 phantombot.tv
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
    var socket = new WebSocket((getProtocol() == 'https://' ? 'wss://' : 'ws://') + window.location.host.split(':')[0] + ':' + getPlayerPort()),
        listeners = [],
        player = {};

    /*
     * @function sends data to the socket, this should only be used in this script.
     *
     * @param {Object} data
     */
    var sendToSocket = (data) => {
        try {
            socket.send(JSON.stringify(data));
        } catch (ex) {
            console.error('Failed to send message to socket: ' + ex.message);
        }
    };

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
        console.info('Verbindung mit dem Websocket hergestellt.');

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
        console.error('Verbindung mit dem Websocket verloren.');
        toastr.error('Die Verbindung mit WebSocket wurde unterbrochen.  Aktualisieren Sie das Programm, sobald sie wiederhergestellt wurde.', '', {timeOut: 0});
    };

    /*
     * @function the socket calls when it gets message.
     */
    socket.onmessage = (e) => {
        try {
            let message = JSON.parse(e.data);

            // Check this message here before doing anything else.
            if (message.authresult !== undefined) {
                if (message.authresult === false) {
                    console.error('Die Anmeldung mit dem Sockel ist fehlgeschlagen.');
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
            console.error('Es ist nicht gelungen, die Nachricht vom Socket zu verarbeiten: ' + ex.message);
        }
    }

    // Make the player object global.
    window.player = player;
});
