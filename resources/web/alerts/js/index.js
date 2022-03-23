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
$(function () {
    let webSocket = getWebSocket(),
            queryMap = getQueryMap(),
            isPlaying = false,
            isDebug = localStorage.getItem('phantombot_alerts_debug') === 'true' || false;
    let queue = [];

    /*
     * @function Gets a new instance of the websocket.
     *
     * @return {ReconnectingWebSocket}
     */
    function getWebSocket() {
        let socketUri = ((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/alertspolls'), // URI of the socket.
                reconnectInterval = 5000; // How often in milliseconds we should try reconnecting.

        return new ReconnectingWebSocket(socketUri, null, {
            reconnectInterval: reconnectInterval
        });
    }

    /*
     * @function Parses the query params in the URL and puts them into a map.
     *
     * @return {Map}
     */
    function getQueryMap() {
        let queryString = window.location.search, // Query string that starts with ?
                queryParts = queryString.slice(1).split('&'), // Split at each &, which is a new query.
                queryMap = new Map(); // Create a new map for save our keys and values.

        for (let i = 0; i < queryParts.length; i++) {
            let key = queryParts[i].substring(0, queryParts[i].indexOf('=')),
                    value = queryParts[i].slice(queryParts[i].indexOf('=') + 1);

            if (key.length > 0 && value.length > 0) {
                queryMap.set(key, value);
            }
        }

        return queryMap;
    }

    /*
     * @function Prints debug logs.
     *
     * @param {String} message
     */
    function printDebug(message, force) {
        if (isDebug || force) {
            console.log('%c[PhantomBot Log]', 'color: #6441a5; font-weight: 900;', message);
        }
    }

    /*
     * @function Toggles the debug mode.
     *
     * @param {String} toggle
     */
    window.toggleDebug = function (toggle) {
        localStorage.setItem('phantombot_alerts_debug', toggle.toString());

        // Refresh the page.
        window.location.reload();
    };

    /*
     * @function Checks if the query map has the option, if not, returns default.
     *
     * @param  {String} option
     * @param  {String} def
     * @return {String}
     */
    function getOptionSetting(option, def) {
        if (queryMap.has(option)) {
            return queryMap.get(option);
        } else {
            return def;
        }
    }

    /*
     * @function Sends a message to the socket
     *
     * @param {String} message
     */
    function sendToSocket(message) {
        try {
            webSocket.send(JSON.stringify(message));
        } catch (ex) {
            printDebug('Failed to send a message to the socket: ' + ex.stack);
        }
    }

    //Copied from https://davidwalsh.name/detect-supported-audio-formats-javascript
    function supportsAudioType(type) {
        let audio;

        // Allow user to create shortcuts, i.e. just "mp3"
        let formats = {
            mp3: 'audio/mpeg',
            aac: 'audio/aac',
            ogg: 'audio/ogg; codecs="vorbis"'
        };

        if (!audio) {
            audio = document.createElement('audio');
        }

        let ret = audio.canPlayType(formats[type] || type);

        if (getOptionSetting('show-debug', 'false') === 'true') {
            $('.main-alert').append('<br />supportsAudioType(' + type + '): ' + ret);
        }

        printDebug('supportsAudioType(' + type + '): ' + ret);

        return ret;
    }

    //Copied from https://davidwalsh.name/detect-supported-video-formats-javascript
    function supportsVideoType(type) {
        let video;

        // Allow user to create shortcuts, i.e. just "webm"
        let formats = {
            ogg: 'video/ogg; codecs="theora"',
            ogv: 'video/ogg; codecs="theora"',
            webm: 'video/webm; codecs="vp8, vorbis"',
            mp4: 'video/mp4'
        };

        if (!video) {
            video = document.createElement('video');
        }

        let ret = video.canPlayType(formats[type] || type);

        if (getOptionSetting('show-debug', 'false') === 'true') {
            $('.main-alert').append('<br />supportsVideoType(' + type + '): ' + ret);
        }

        printDebug('supportsVideoType(' + type + '): ' + ret);

        return ret;
    }

    /*
     * @function Handles the user interaction for the page.
     */
    function handleBrowserInteraction() {
        const audio = new Audio();

        // Try to play to see if we can interact.
        audio.play().catch(function (err) {
            // User need to interact with the page.
            if (err.toString().startsWith('NotAllowedError')) {
                $('.main-alert').append($('<button/>', {
                    'html': 'Click me to activate audio hooks.',
                    'style': 'top: 50%; position: absolute; font-size: 30px; font-weight: 30; cursor: pointer;'
                }).on('click', function () {
                    $(this).remove();
                }));
            }
        });
    }

    /*
     * @function Handles the queue.
     */
    function handleQueue() {
        let event = queue[0];

        if (event !== undefined && isPlaying === false) {
            printDebug('Processing event ' + JSON.stringify(event));

            isPlaying = true;
            if (event.alert_image !== undefined) {
                handleGifAlert(event);
            } else {
                handleAudioHook(event);
            }
            queue.splice(0, 1);
        }
    }

    /*
     * @function Checks for if the audio file exists since the socket doesn't pass the file type.
     *
     * @param  {String} name
     * @return {String}
     */
    function getAudioFile(name, path) {
        let defaultPath = '/config/audio-hooks/',
                fileName = '',
                extensions = ['mp3', 'aac', 'ogg'],
                found = false;

        if (path !== undefined) {
            defaultPath = path;
        }

        for (let x in extensions) {
            if (fileName.length > 0) {
                break;
            }
            if (supportsAudioType(extensions[x]) !== '') {
                found = true;
                $.ajax({
                    async: false,
                    method: 'HEAD',
                    url: defaultPath + name + '.' + extensions[x],
                    success: function () {
                        fileName = (defaultPath + name + '.' + extensions[x]);
                    }
                });
            }
        }

        if (!found) {
            printDebug('No audio formats were supported by the browser!', true);
        }

        if (getOptionSetting('show-debug', 'false') === 'true' && path === undefined) {
            $('.main-alert').append('<br />getAudioFile(' + name + '): Unable to find file in a supported format');
        }

        return fileName;
    }

    /*
     * @function Handles audio hooks.
     *
     * @param {Object} json
     */
    function handleAudioHook(json) {
        // Make sure we can allow audio hooks.
        if (getOptionSetting('allow-audio-hooks', 'false') === 'true') {
            let audioFile = getAudioFile(json.audio_panel_hook),
                    audio;

            if (audioFile.length === 0) {
                printDebug('Failed to find audio file.', true);
                return;
            }

            // Create a new audio file.
            audio = new Audio(audioFile);
            // Set the volume.
            audio.volume = getOptionSetting('audio-hook-volume', '1');

            if (json.hasOwnProperty("audio_panel_volume") && json.audio_panel_volume >= 0.0) {
                audio.volume = json.audio_panel_volume;
            }
            // Add an event handler.
            $(audio).on('ended', function () {
                audio.currentTime = 0;
                isPlaying = false;
            });
            // Play the audio.
            audio.play().catch(function (err) {
                console.log(err);
            });
        } else {
            isPlaying = false;
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /*
     * @function Handles GIF alerts.
     *
     * @param {Object} json
     */
    async function handleGifAlert(json) {
        // Make sure we can allow alerts.
        if (getOptionSetting('allow-alerts', 'true') === 'true') {
            let defaultPath = '/config/gif-alerts/',
                    gifData = json.alert_image,
                    gifDuration = 3000,
                    gifVolume = getOptionSetting('gif-default-volume', '0.8'),
                    gifFile = '',
                    gifCss = '',
                    gifText = '',
                    htmlObj,
                    audio,
                    isVideo = false,
                    hasAudio = false;

            // If a comma is found, that means there are custom settings.
            if (gifData.indexOf(',') !== -1) {
                let gifSettingParts = gifData.split(',');

                // Loop through each setting and set it if found.
                gifSettingParts.forEach(function (value, index) {
                    switch (index) {
                        case 0:
                            gifFile = value;
                            break;
                        case 1:
                            gifDuration = (parseInt(value) * 1000);
                            break;
                        case 2:
                            gifVolume = value;
                            break;
                        case 3:
                            gifCss = value;
                            break;
                        case 4:
                            gifText = value;
                            break;
                        default:
                            gifText = gifText + ',' + value;
                            break;
                    }
                });
            } else {
                gifFile = gifData;
            }

            // Check if the file is a gif, or video.
            if (gifFile.match(/\.(webm|mp4|ogg|ogv)$/) !== null) {
                htmlObj = $('<video/>', {
                    'src': defaultPath + gifFile,
                    'autoplay': 'false',
                    'style': gifCss,
                    'preload': 'auto'
                });

                htmlObj.prop('volume', gifVolume);
                isVideo = true;

                if (supportsVideoType(gifFile.substring(gifFile.lastIndexOf('.') + 1)) === '') {
                    printDebug('Video format was not supported by the browser!', true);
                }
            } else {
                htmlObj = $('<img/>', {
                    'src': defaultPath + gifFile,
                    'style': gifCss,
                    'alt': "Video"
                });
            }

            let audioPath = getAudioFile(gifFile.slice(0, gifFile.indexOf('.')), defaultPath);

            if (audioPath.length > 0 && gifFile.substring(gifFile.lastIndexOf('.') + 1) !== audioPath.substring(audioPath.lastIndexOf('.') + 1)) {
                hasAudio = true;
                audio = new Audio(audioPath);
            }

            // p object to hold custom gif alert text and style
            textObj = $('<p/>', {
                'style': gifCss
            }).text(gifText);

            await sleep(1000);

            // Append the custom text object to the page
            $('#alert-text').append(textObj).fadeIn(1e2).delay(gifDuration)
                    .fadeOut(1e2, function () { //Remove the text with a fade out.
                        let t = $(this);

                        // Remove the p tag
                        t.find('p').remove();
                    });

            // Append a new the image.
            $('#alert').append(htmlObj).fadeIn(1e2, function () {// Set the volume.
                if (isVideo) {
                    // Play the sound.
                    htmlObj[0].play().catch(function () {
                        // Ignore.
                    });
                }
                if (hasAudio) {
                    audio.volume = gifVolume;
                    audio.play().catch(function () {
                        // Ignore.
                    });
                }
            }).delay(gifDuration) // Wait this time before removing this image.
                    .fadeOut(1e2, function () { // Remove the image with a fade out.
                        let t = $(this);

                        // Remove either the img tag or video tag.
                        if (!isVideo) {
                            // Remove the image.
                            t.find('img').remove();
                        } else {
                            // Remove the video.
                            t.find('video').remove();
                        }

                        if (hasAudio) {
                            // Stop the audio.
                            audio.pause();
                            // Reset the duration.
                            audio.currentTime = 0;
                        }
                        if (isVideo) {
                            htmlObj[0].pause();
                            htmlObj[0].currentTime = 0;
                        }
                        // Mark as done playing.
                        isPlaying = false;
                    });
        } else {
            isPlaying = false;
        }
    }

    /*
     * @event Called once the socket opens.
     */
    webSocket.onopen = function () {
        printDebug('Successfully connected to the socket.', true);
        // Authenticate with the socket.
        sendToSocket({
            authenticate: getAuth()
        });
    };

    /*
     * @event Called when the socket closes.
     */
    webSocket.onclose = function () {
        printDebug('Disconnected from the socket.', true);
    };

    /*
     * @event Called when we get a message.
     *
     * @param {Object} e
     */
    webSocket.onmessage = function (e) {
        try {
            let rawMessage = e.data,
                    message = JSON.parse(rawMessage);

            printDebug('[MESSAGE] ' + rawMessage);

            if (message.query_id === undefined) {
                // Check for our auth result.
                if (message.authresult !== undefined) {
                    if (message.authresult === 'true') {
                        printDebug('Successfully authenticated with the socket.', true);
                        // Handle this.
                        handleBrowserInteraction();
                    } else {
                        printDebug('Failed to authenticate with the socket.', true);
                    }
                } else

                // Queue all events and process them one at-a-time.
                if (message.alert_image !== undefined || message.audio_panel_hook !== undefined) {
                    queue.push(message);
                }

                // Message cannot be handled error.
                else {
                    printDebug('Failed to process message from socket: ' + rawMessage);
                }
            }
        } catch (ex) {
            printDebug('Failed to parse socket message [' + e.data + ']: ' + e.stack);
        }
    };

    // Handle processing the queue.
    setInterval(handleQueue, 5e2);
});
