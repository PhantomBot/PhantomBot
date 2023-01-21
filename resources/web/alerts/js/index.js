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
/* global Keyframes */

$(function () {
    let webSocket = getWebSocket(),
            queryMap = getQueryMap(),
            isPlaying = false,
            isDebug = localStorage.getItem('phantombot_alerts_debug') === 'true' || false;
    let queue = [];

    let audioFormats = {
        maybe: [],
        probably: []
    };

    let videoFormats = {
        maybe: [],
        probably: []
    };

    let queueProcessing = false;
    let playingAudioFiles = [];

    const CONF_ENABLE_FLYING_EMOTES = 'enableFlyingEmotes';
    const CONF_ENABLE_GIF_ALERTS = 'enableGifAlerts';
    const CONF_ENABLE_VIDEO_CLIPS = 'enableVideoClips';
    const CONF_VIDEO_CLIP_VOLUME = 'videoClipVolume';
    const CONF_GIF_ALERT_VOLUME = 'gifAlertVolume';

    const PROVIDER_TWITCH = 'twitch';
    const PROVIDER_LOCAL = 'local';
    const PROVIDER_MAXCDN = 'maxcdn';
    const PROVIDER_FFZ = 'ffz';
    const PROVIDER_BTTV = 'bttv';

    //Copied from https://davidwalsh.name/detect-supported-audio-formats-javascript
    function populateSupportedAudioTypes() {
        let audio = new Audio();

        let formats = {
            wav: 'audio/wav',
            mp3: 'audio/mpeg',
            mp4: 'audio/mp4',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
            opus: 'audio/ogg; codecs="opus"',
            ogg: 'audio/ogg; codecs="vorbis"',
            oga: 'audio/ogg; codecs="vorbis"',
            webm: 'audio/webm; codecs="vorbis"'
        };

        for (let x in formats) {
            let ret = audio.canPlayType(formats[x]);
            printDebug('supportsAudioType(' + x + '): ' + ret);

            if (ret === 'maybe') {
                audioFormats.maybe.push(x);
            } else if (ret === 'probably') {
                audioFormats.probably.push(x);
            }
        }
    }
    populateSupportedAudioTypes();

    //Copied from https://davidwalsh.name/detect-supported-video-formats-javascript
    function populateSupportedVideoTypes() {
        let video = document.createElement('video');

        let formats = {
            ogg: 'video/ogg; codecs="theora"',
            ogv: 'video/ogg; codecs="theora"',
            webm: 'video/webm; codecs="vp8"',
            mp4: 'video/mp4'
        };

        for (let x in formats) {
            let ret = video.canPlayType(formats[x]);
            printDebug('supportsVideoType(' + x + '): ' + ret);

            if (ret === 'maybe') {
                videoFormats.maybe.push(x);
            } else if (ret === 'probably') {
                videoFormats.probably.push(x);
            }
        }
    }
    populateSupportedVideoTypes();



    function findFirstFile(filePath, fileName, extensions) {
        let ret = '';

        if (!filePath.endsWith('/')) {
            filePath = filePath + '/';
        }

        for (let x in extensions) {
            if (ret.length > 0) {
                return ret;
            }

            $.ajax({
                async: false,
                method: 'HEAD',
                url: filePath + fileName + '.' + extensions[x],
                success: function () {
                    ret = filePath + fileName + '.' + extensions[x];
                }
            });
        }

        return ret;
    }

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
    async function handleQueue() {
        // Do not do anything if the queue is empty
        if (queueProcessing || queue.length === 0) {
            return;
        }

        queueProcessing = true;
        try {
            // Process the whole queue at once
            while (queue.length > 0) {
                let event = queue[0];
                let ignoreIsPlaying = (event.ignoreIsPlaying !== undefined ? event.ignoreIsPlaying : false);

                if (event === undefined) {
                    console.error('Received event of type undefined. Ignoring.');
                } else if (event.emoteId !== undefined) {
                    // do not respect isPlaying for emotes
                    handleEmote(event);
                } else if (event.script !== undefined) {
                    handleMacro(event);
                } else if (event.stopMedia !== undefined) {
                    handleStopMedia(event);
                } else if (ignoreIsPlaying || isPlaying === false) {
                    // sleep a bit to reduce the overlap
                    await sleep(100);
                    printDebug('Processing event: ' + JSON.stringify(event));
                    // called method is responsible to reset this
                    isPlaying = true;
                    if (event.type === 'playVideoClip') {
                        handleVideoClip(event);
                    } else if (event.alert_image !== undefined) {
                        handleGifAlert(event);
                    } else if (event.audio_panel_hook !== undefined) {
                        handleAudioHook(event);
                    } else {
                        printDebug('Received message and don\'t know what to do about it: ' + event);
                        isPlaying = false;
                    }
                } else {
                    return;
                }
                // Remove the event
                queue.splice(0, 1);
            }
        } finally {
            queueProcessing = false;
        }
    }

    function handleStopMedia(json) {
        let stopVideo;
        let stopAudio;
        try {
            if (json.stopMedia === 'all') {
                stopVideo = stopAudio = true;
            } else {
                stopVideo = json.stopMedia.indexOf('video') >= 0;
                stopAudio = json.stopMedia.indexOf('audio') >= 0;
            }
            if (stopVideo) {
                let videoFrame = document.getElementById('main-video-clips');
                while (videoFrame.children.length > 0) {
                    videoFrame.children[0].remove();
                }
            }
            if (stopAudio) {
                while (playingAudioFiles.length > 0) {
                    playingAudioFiles[0].pause();
                    playingAudioFiles[0].remove();
                    playingAudioFiles.splice(0, 1);
                }
            }
        } finally {
            isPlaying = false;
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
                fileName = '';

        if (path !== undefined) {
            defaultPath = path;
        }

        fileName = findFirstFile(defaultPath, name, audioFormats.probably);

        if (fileName.length === 0) {
            fileName = findFirstFile(defaultPath, name, audioFormats.maybe);
        }

        if (fileName.length === 0) {
            printDebug(`Could not find a supported audio file for ${name}.`, true);
        }

        if (getOptionSetting('enableDebug', getOptionSetting('show-debug', 'false')) === 'true' && fileName.length === 0) {
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
        if (getOptionSetting('enableAudioHooks', getOptionSetting('allow-audio-hooks', 'false')) === 'true') {
            let audioFile = getAudioFile(json.audio_panel_hook),
                    audio;

            if (audioFile.length === 0) {
                printDebug('Failed to find audio file.', true);
                isPlaying = false;
                return;
            }

            // Create a new audio file.
            audio = new Audio(audioFile);
            // Set the volume.
            audio.volume = getOptionSetting('audioHookVolume', getOptionSetting('audio-hook-volume', '1'));

            if (json.hasOwnProperty("audio_panel_volume") && json.audio_panel_volume >= 0.0) {
                audio.volume = json.audio_panel_volume;
            }
            // Add an event handler.
            $(audio).on('ended', function () {
                audio.currentTime = 0;
                isPlaying = false;
            });
            playingAudioFiles.push(audio);
            // Play the audio.
            audio.play().catch(function (err) {
                console.log(err);
            });
        } else {
            isPlaying = false;
        }
    }

    /*
     * Handles emote messages
     * @param json
     * @returns {Promise<void>}
     */
    async function handleEmote(json) {
        let amount = json.amount !== undefined ? json.amount : 1;
        const animationName = json.animationName || 'flyUp';
        const duration = json.duration || 10000;
        const ignoreSleep = json.ignoreSleep || false;
        for (let i = 0; i < amount; i++) {
            displayEmote(json['emoteId'], json['provider'], animationName, duration);
            if (!ignoreSleep) {
                await sleep(getRandomInt(1, 200));
            }
        }
    }

    async function displayEmote(emoteId, provider, animationName, duration) {
        if (getOptionSetting(CONF_ENABLE_FLYING_EMOTES, 'false') === 'false') {
            // Feature not enabled, end the function
            return;
        }

        // scaling of the emote (by width)
        const size = 112;

        const browserSafeId = emoteId.replace(/\W/g, '');

        // a pseudo unique id to make sure, the keyframe names won't interfere each other
        const uniqueId = `${Date.now()}${Math.random().toString(16).substr(2, 8)}`;

        let emoteUrl;
        switch (provider) {
            case PROVIDER_TWITCH:
                // Taken from the entry "emotes" on https://dev.twitch.tv/docs/irc/tags/#privmsg-twitch-tags
                emoteUrl = 'https://static-cdn.jtvnw.net/emoticons/v2/' + emoteId + '/default/dark/3.0';
                break;
            case PROVIDER_LOCAL:
                emoteUrl = '/config/emotes/' + emoteId;
                break;
            case PROVIDER_MAXCDN:
                emoteUrl = `https://twemoji.maxcdn.com/v/latest/svg/${emoteId}.svg`;
                break;
            case PROVIDER_BTTV:
                emoteUrl = `https://cdn.betterttv.net/emote/${emoteId}/3x`;
                break;
            case PROVIDER_FFZ:
                emoteUrl = `https://cdn.frankerfacez.com/emoticon/${emoteId}/4`;
                break;
            default:
                printDebug(`Could not find local emote '${emoteId}'`);
                return;
        }

        let emote = document.createElement('img');
        emote.style.position = 'absolute';
        emote.src = emoteUrl;
        emote.width = size;
        emote.id = `emote-${browserSafeId}-${uniqueId}`;
        emote.dataset['browserSafeId'] = browserSafeId;
        emote.dataset['uniqueId'] = uniqueId;
        await emote.decode();

        emote = document.getElementById('main-emotes').appendChild(emote);
        if (animationName === 'flyUp') {
            emoteFlyingUp(emote);
        } else {
            emoteAnimated(emote, animationName, duration);
        }
    }

    function emoteAnimated(emote, animationName, duration) {
        emote.style.top = getRandomInt(-5, 95) + 'vh';
        emote.style.left = getRandomInt(-5, 95) + 'vw';
        emote.classList.add('animatedEmote');
        emote.classList.add('animate__animated');
        emote.classList.add('animate__' + animationName);
        emote.classList.add('animate__infinite');

        setTimeout(() => {
            emote.remove();
        }, duration);
    }

    function emoteFlyingUp(emote) {
        // How long should the emotes fly over the screen?
        const displayTime = 12 + Math.random() * 3;
        // How long should one side-way iteration take
        const sideWayDuration = 3 + Math.random();
        // How much distance may the side-way movements take
        // value is in vw (viewport width) -> screen percentage
        const sideWayDistance = 3 + getRandomInt(0, 20);
        // Spawn Range
        const spawnRange = getRandomInt(0, 80);

        const browserSafeId = emote.dataset['browserSafeId'];
        const uniqueId = emote.dataset['uniqueId'];
        const keyFrameFly = `emoteFly-${browserSafeId}-${uniqueId}`;
        const keyFrameSideways = `emoteSideWays-${browserSafeId}-${uniqueId}`;
        const keyFrameOpacity = `emoteOpacity-${browserSafeId}-${uniqueId}`;

        let emoteAnimation = new Keyframes(emote);

        Keyframes.define([{
                name: keyFrameFly,
                '0%': {transform: 'translate(' + spawnRange + 'vw, 100vh)'},
                '100%': {transform: 'translate(' + spawnRange + 'vw, 0vh)'}
            }]);

        Keyframes.define([{
                name: keyFrameSideways,
                '0%': {marginLeft: '0'},
                '100%': {marginLeft: sideWayDistance + 'vw'}
            }]);

        Keyframes.define([{
                name: keyFrameOpacity,
                '0%': {opacity: 0},
                '40%': {opacity: 1},
                '80%': {opacity: 1},
                '90%': {opacity: 0},
                '100%': {opacity: 0}
            }]);

        emoteAnimation.play([{
                name: keyFrameFly,
                duration: displayTime + 's',
                timingFunction: 'ease-in'
            }, {
                name: keyFrameSideways,
                duration: sideWayDuration + 's',
                timingFunction: 'ease-in-out',
                iterationCount: Math.round(displayTime / sideWayDuration),
                direction: 'alternate' + (getRandomInt(0, 1) === 0 ? '-reverse' : '')
            }, {
                name: keyFrameOpacity,
                duration: displayTime + 's',
                timingFunction: 'ease-in'
            }], {
            onEnd: (event) => {
                event.target.remove();
            }
        });
    }

    async function handleVideoClip(json) {
        if (getOptionSetting(CONF_ENABLE_VIDEO_CLIPS, 'true') !== 'true') {
            return;
        }
        let defaultPath = '/config/clips';
        let filename = json.filename;
        let duration = json.duration || -1;
        let fullscreen = json.fullscreen || false;
        let volume = getOptionSetting(CONF_VIDEO_CLIP_VOLUME, '0.8');

        let video = document.createElement('video');
        video.src = `${defaultPath}/${filename}`;
        video.autoplay = false;
        video.preload = 'auto';
        video.volume = volume;
        if (fullscreen) {
            video.className = 'fullscreen';
        }
        let isReady = false;
        video.oncanplay = (event) => {
            isReady = true;
        };
        video.oncanplaythrough = (event) => {
            isReady = true;
        };
        const videoIsReady = () => {
            return isReady;
        };
        video.load();
        await promisePoll(() => videoIsReady(), {pollIntervalMs: 250});
        let frame = document.getElementById('main-video-clips');
        frame.append(video);

        video.play().catch(() => {
            console.error('Failed to play ' + video.src);
            isPlaying = false;
        });
        video.addEventListener('ended', (event) => {
            isPlaying = false;
            video.pause();
            video.remove();
        });
        if (duration > 0) {
            setTimeout(() => {
                video.pause();
                video.remove();
                isPlaying = false;
            }, duration);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //https://stackoverflow.com/a/57380742
    promisePoll = (promiseFunction, { pollIntervalMs = 2000 } = {}) => {
        const startPoll = async resolve => {
            const startTime = new Date();
            const result = await promiseFunction();

            if (result) {
                return resolve();
            }

            const timeUntilNext = Math.max(pollIntervalMs - (new Date() - startTime), 0);
            setTimeout(() => startPoll(resolve), timeUntilNext);
        };

        return new Promise(startPoll);
    };

    /*
     * @function Handles GIF alerts.
     *
     * @param {Object} json
     */
    async function handleGifAlert(json) {
        // Make sure we can allow alerts.
        if (getOptionSetting(CONF_ENABLE_GIF_ALERTS, 'true') === 'true') {
            let defaultPath = '/config/gif-alerts/',
                    gifData = json.alert_image,
                    gifDuration = 3000,
                    gifVolume = getOptionSetting(CONF_GIF_ALERT_VOLUME, '0.8'),
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
                    'style': gifCss,
                    'preload': 'auto'
                });

                htmlObj.prop('volume', gifVolume);
                isVideo = true;

                let ext = gifFile.substring(gifFile.lastIndexOf('.') + 1);
                if (!videoFormats.probably.includes(ext) && !videoFormats.maybe.includes(ext)) {
                    printDebug('Video format ' + ext + ' was not supported by the browser!', true);
                }
            } else {
                htmlObj = $('<img/>', {
                    'src': defaultPath + gifFile,
                    'style': gifCss,
                    'alt': "Video"
                });
                await htmlObj[0].decode();
            }

            let audioPath = getAudioFile(gifFile.slice(0, gifFile.indexOf('.')), defaultPath);

            if (audioPath.length > 0 && gifFile.substring(gifFile.lastIndexOf('.') + 1) !== audioPath.substring(audioPath.lastIndexOf('.') + 1)) {
                hasAudio = true;
                audio = new Audio(audioPath);
            }

            // p object to hold custom gif alert text and style
            textObj = $('<p/>', {
                'style': gifCss
            }).html(gifText);

            await sleep(500);

            if (isVideo) {
                let isReady = false;
                htmlObj[0].oncanplay = (event) => {
                    isReady = true;
                };
                htmlObj[0].oncanplaythrough = (event) => {
                    isReady = true;
                };
                const videoIsReady = () => {
                    return isReady;
                };
                htmlObj[0].load();
                await promisePoll(() => videoIsReady(), {pollIntervalMs: 250});
            }
            if (hasAudio) {
                let isReady = false;
                audio.oncanplay = (event) => {
                    isReady = true;
                };
                audio.oncanplaythrough = (event) => {
                    isReady = true;
                };
                const audioIsReady = () => {
                    return isReady;
                };

                audio.load();
                await promisePoll(() => audioIsReady(), {pollIntervalMs: 250});
                audio.volume = gifVolume;
            }

            await sleep(500);

            // Append the custom text object to the page
            $('#alert-text').append(textObj).fadeIn(1e2).delay(gifDuration)
                    .fadeOut(1e2, function () { //Remove the text with a fade out.
                        let t = $(this);

                        // Remove the p tag
                        t.find('p').remove();
                    });

            // Append a new the image.
            $('#alert').append(htmlObj).fadeIn(1e2, async function () {// Set the volume.
                if (isVideo) {
                    // Play the sound.
                    htmlObj[0].play().catch(function () {
                        // Ignore.
                    });
                }
                if (hasAudio) {
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

    async function handleMacro(json) {
        printDebug('Playing Macro: ' + json.macroName);
        for (let i = 0; i < json.script.length; i++) {
            let element = json.script[i];
            switch (element.elementType) {
                case 'clip':
                    isPlaying = true;
                    await handleVideoClip(element);
                    break;
                case 'emote':
                    element.emoteId = element.emoteId !== undefined ? element.emoteId.toString() : element.emotetext;
                    await handleEmote(element);
                    break;
                case 'pause':
                    await sleep(element.duration);
                    break;
                case 'sound':
                    await handleAudioHook({audio_panel_hook: element.filename, duration: element.duration});
                    break;
            }
        }
        printDebug('Finished playing macro: ' + json.macroName);
    }

    /**
     * Generates a random number between the given min and max
     * @param min the minimum value
     * @param max the maximum value
     * @returns {number} a random number
     */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
                } else {
                    // Queue all events and process them one at-a-time.
                    queue.push(message);
                }
            }
        } catch (ex) {
            printDebug('Failed to parse socket message [' + e.data + ']: ' + e.stack);
        }
    };

    // Handle processing the queue.
    setInterval(handleQueue, 5e2);
});
