/**
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
    const webSocket = getWebSocket(),
        queryMap = getQueryMap(),
        isDebug = localStorage.getItem('phantombot_alerts_debug') === 'true' || false,
        imgEl = document.getElementById('alert'),
        audioEl = document.getElementById('alertAudio'),
        videoEl = document.getElementById('alertVideo'),
        SILENT_WAV =
            'data:audio/wav;base64,' +
            'UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    let isPlaying = false,
        audioUnlocked = false,
        unlocking = false,
        queue = [],
        queueProcessing = false,
        playTimeout;

    imgEl.onload = () => printDebug('GIF loaded');
    imgEl.onerror = (e) => printDebug('Error: GIF failed to load: ' + e, true);
    audioEl.oncanplay = () => printDebug('Audio loaded');
    audioEl.onstalled = () => printDebug('Error: Audio loading stalled', true);
    audioEl.onerror = (e) => printDebug('Error: Audio failed to load: ' + e, true);
    videoEl.onload = () => printDebug('Video loaded');
    videoEl.onstalled = () => printDebug('Error: Video loading stalled', true);
    videoEl.onerror = (e) => printDebug('Error: Video failed to load: ' + e, true);

    let audioFormats = {
        maybe: [],
        probably: []
    };

    let videoFormats = {
        maybe: [],
        probably: []
    };

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
    const PROVIDER_SEVENTV = 'sevenTv';

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
            webm: 'audio/webm; codecs="vorbis"',
            flac: 'audio/flac'
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

    /**
     * Select the first matching soundfile based on playability.
     * @param {String[]} candidates Available sound files on the server to play
     * @returns the first matching soundfile
     */
    function chooseBestCandidate(candidates) {
        if (!Array.isArray(candidates) || candidates.length === 0) return null;

        let lastResort = candidates[0];
        // Check candidates against probably list
        for (const candidate of candidates) {
            const ext = candidate.substring(candidate.lastIndexOf('.') + 1);
            if (audioFormats.probably.includes(ext)) {
                return candidate;
            }
            if (audioFormats.maybe.includes(ext)) {
                lastResort = candidate;
            }
        }

        // If no probably match, just return first candidate
        return lastResort;
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
            printDebug('sendToDocket: ' + JSON.stringify(message));
            webSocket.send(JSON.stringify(message));
        } catch (ex) {
            printDebug('Failed to send a message to the socket: ' + ex.stack);
        }
    }

    /*
     * @function Handles the user interaction for the page.
     */
    async function handleBrowserInteraction() {
        if (audioUnlocked || unlocking) return;

        unlocking = true;
        isPlaying = true;
        
        if (!audioEl.src) audioEl.src = SILENT_WAV;
        audioEl.muted = true;
        await audioEl.play().catch(function (err) {
                if (String(err.name) === 'NotAllowedError' || String(err).includes('NotAllowedError')) {
                    printDebug('Audio autoplay not allowed. User must interact!', true);
                    $('.main-alert').append($('<button/>', {
                            'html': 'Click me to activate audio hooks.',
                            'style': 'top: 50%; position: absolute; font-size: 30px; font-weight: 30; cursor: pointer;'
                        }).on('click', async function () {
                            $(this).remove();
                        }));
                } else {
                    printDebug('Audio could not not be played for an unknown reason', true);
                }
            });
        
        printDebug('Audio autoplay allowed. No user interaction needed');
        stopMedia(true, false, false);
        audioEl.muted = false;
        audioUnlocked = true;
        unlocking = false;  
    }

    async function playElement(element, isVideo) {
        printDebug('Playing ' + element.src);
        isVideo = isVideo ? isVideo : false;
        element.muted = false;
        try {
            element.currentTime = 0;
        } catch (e) {
            printDebug('Error: Media not seekable ' + e, true);
        }
        element.play().catch((e) => {
            printDebug('Error: Failed to play ' + element.src, true);
            printDebug(e, true);
            if (isVideo) {
                stopMedia(false, true, false);
            } else {
                stopMedia(true, false, true);
            }
        });
    }

    async function playAudio() {
        playElement(audioEl, false);
    }

    async function playVideo() {
        playElement(videoEl, true);
    }

    /**
     * @function Handles the queue.
     */
    async function handleQueue() {
        // Do not do anything if the queue is empty
        if (queueProcessing || queue.length === 0) {
            return;
        }

        queueProcessing = true;
        try {
            let played = [];
            for (let i = 0; i < queue.length; i++) {
                let event = queue.slice(i, i + 1)[0];
                let ignoreIsPlaying = (event.ignoreIsPlaying !== undefined ? event.ignoreIsPlaying : false);
                let isPlayed = false;

                try {
                    if (event === undefined) {
                        isPlayed = true;
                        console.error('Received event of type undefined. Ignoring.');
                    } else if (event.emoteId !== undefined) {
                        isPlayed = true;
                        // do not respect isPlaying for emotes
                        printDebug('Processing event: ' + JSON.stringify(event));
                        handleEmote(event);
                    } else if (event.script !== undefined) {
                        isPlayed = true;
                        printDebug('Processing event: ' + JSON.stringify(event));
                        handleMacro(event);
                    } else if (event.stopMedia !== undefined) {
                        isPlayed = true;
                        printDebug('Processing event: ' + JSON.stringify(event));
                        handleStopMedia(event);
                    } else if (ignoreIsPlaying || isPlaying === false) {
                        isPlayed = true;
                        // sleep a bit to reduce the overlap
                        await sleep(100);
                        printDebug('Processing event: ' + JSON.stringify(event));
                        if (ignoreIsPlaying) {
                            clearTimeout(playTimeout);
                        }
                        // called method is responsible to reset this
                        isPlaying = true;
                        if (event.type === 'playVideoClip'
                                    && getOptionSetting(CONF_ENABLE_VIDEO_CLIPS, 'true') === 'true') {
                            handleVideoClip(event);
                        } else if (event.alert_image !== undefined 
                                    && getOptionSetting(CONF_ENABLE_GIF_ALERTS, 'true') === 'true') {
                            handleGifAlert(event);
                        } else if (event.audio_panel_hook !== undefined
                                    && getOptionSetting('enableAudioHooks', getOptionSetting('allow-audio-hooks', 'false')) === 'true') {
                            handleAudioHook(event);
                        } else {
                            printDebug('Received message and don\'t know what to do about it: ' + event);
                            isPlaying = false;
                        }
                    }
                } finally {
                    if (isPlayed) {
                        played.push(i);
                    }
                }
            }

            played.reverse().forEach(i => queue.splice(i, 1));
        } finally {
            queueProcessing = false;
        }
    }

    function handleGifAlert(event) {
        const gifData = event.alert_image;
        const candidates = event.audioCandidates || [];
        const MEDIA_URL_BASE = '/config/gif-alerts/';
        
        let gifDuration = null,
            gifVolume = getOptionSetting(CONF_GIF_ALERT_VOLUME, '0.8'),
            gifFile = gifData,
            gifCss = '',
            gifText;
        
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
        }
        
        // Video forward to proper handler
        if (gifFile.match(/\.(webm|mp4|ogg|ogv)$/) !== null) {
            let videoData = new Object();
            videoData.filename = gifFile;
            videoData.duration = gifDuration;
            videoData.volume = gifVolume;
            handleVideoClip(videoData, MEDIA_URL_BASE, gifText, gifCss);
            return;
        }

        const gifUrl = MEDIA_URL_BASE + encodeURIComponent(gifFile);
        // pick first candidate (or better: first playable candidate, shown below)
        const audioCandidate = chooseBestCandidate(candidates);
        const audioUrl = audioCandidate
            ? MEDIA_URL_BASE + encodeURIComponent(audioCandidate)
            : null;

        imgEl.setAttribute('style', gifCss);
        imgEl.src = gifUrl;
        addAlertText(gifText, gifCss);
        imgEl.className = 'fade-in';

        gifDuration = gifDuration === null ? 3000 : gifDuration
        playTimeout = setTimeout(() => {
            printDebug('Audio complete (duration), after: ' + (gifDuration/1000) + ' seconds');
            stopMedia(false, false, true);
        }, gifDuration);
        

        // If no audio, we're done (gif only)
        if (!audioUrl) return;

        audioEl.volume = gifVolume
        audioEl.src = audioUrl;
        clearTimeout(playTimeout);
        playTimeout = setTimeout(() => {
            printDebug('Audio complete (duration), after: ' + (gifDuration/1000) + ' seconds');
            stopMedia(true, false, true);
        }, gifDuration ? 3000 : gifDuration);

        playAudio();
    }
    
    async function addAlertText(alertText, alertCSS) {
        if (!alertText) {
            return;
        }

        // p object to hold custom gif alert text and style
        let textObj = $('<p/>', {
            'style': alertCSS ? alertCSS : ''
        }).html(alertText);
        // Append the custom text object to the page
        $('#alert-text').append(textObj).fadeIn(2e2).delay(gifDuration)
                .fadeOut(2e2, function () { //Remove the text with a fade out.
                    let t = $(this);

                    // Remove the p tag
                    t.find('p').remove();
                });
    }

    async function stopMedia(stopAudio, stopVideo, stopGif) {
        if (!isPlaying) {
            return;
        }
 
        printDebug('Stopping media: (Audio: ' + stopAudio + ') (Video: ' + stopVideo + ') (Gif: ' + stopGif + ')');

        if (stopGif) {
            try {
                if (imgEl.className = 'fade-in') {
                    imgEl.className = 'fade-out';
                    await sleep(2e2);
                }
                imgEl.removeAttribute('src');
                imgEl.removeAttribute('style')
            } catch (e) {
              console.warn('Error: gif stop failed:' + e, true);
            }
        }
        
        if (stopAudio) {
            try {
                if (!audioEl.paused) {
                    audioEl.pause();
                }
                audioEl.removeAttribute('src');
                audioEl.load();
                audioEl.volume = 1;
            } catch (e2) {
                printDebug('Error: audio stop failed:' + e, true);
            }
        }
        
        if (stopVideo) {
            try {
                if (videoEl.className = 'fade-in') {
                    videoEl.className = 'fade-out';
                    await sleep(2e2);
                }
                if (!videoEl.paused) {
                    videoEl.pause();
                }
                videoEl.removeAttribute('src');
                videoEl.removeAttribute('style')
                videoEl.load();
                videoEl.volume = 1;
            } catch (e) {
              console.warn('Error: video stop failed:' + e, true);
            }
        }
        
        clearTimeout(playTimeout);
        isPlaying = false;
    }

    function handleStopMedia(json) {
        let stopVideo,
            stopAudio;

        if (json.stopMedia === 'all') {
            stopVideo = stopAudio = true;
        } else {
            stopVideo = json.stopMedia.indexOf('video') >= 0;
            stopAudio = json.stopMedia.indexOf('audio') >= 0;
        }
        
        stopMedia(stopAudio, stopVideo, stopAudio);
    }

    /*
     * @function Handles audio hooks.
     *
     * @param {Object} json
     */
    function handleAudioHook(json) {
        // Make sure we can allow audio hooks.
        if (getOptionSetting('enableAudioHooks', getOptionSetting('allow-audio-hooks', 'false')) === 'false') {
            return;
        }
        const MEDIA_URL_BASE = '/config/audio-hooks/';

        // Create a new audio file.
        audioEl.src = MEDIA_URL_BASE + encodeURIComponent(chooseBestCandidate(json.audio_panel_hook));
        // Set the volume.
        audioEl.volume = getOptionSetting('audioHookVolume', getOptionSetting('audio-hook-volume', '1'));

        if (json.hasOwnProperty('audio_panel_volume') && json.audio_panel_volume >= 0.0) {
            audioEl.volume = json.audio_panel_volume;
        }

        // Play the audio.
        printDebug('Playing audio');
        playAudio();
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
        const size = getOptionSetting('flyingEmoteSize', 112);

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
            case PROVIDER_SEVENTV:
                emoteUrl =  `https://cdn.7tv.app/emote/${emoteId}/4x.avif`;
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
        printDebug('Loading emote: ' + emote.src);
        await emote.decode();
        printDebug('Animating emote');

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
                printDebug('Animation complete');
                event.target.remove();
            }
        });
    }

    function handleVideoClip(json, MEDIA_URL_BASE, additionalText, additionalCSS) {
        let defaultPath = '/config/clips/';
        let filename = json.filename;
        let duration = json.duration || null;
        let fullscreen = json.fullscreen || false;
        let volume = getOptionSetting(CONF_VIDEO_CLIP_VOLUME, '0.8');

        if (MEDIA_URL_BASE) {
            defaultPath = MEDIA_URL_BASE;
            videoEl.setAttribute('style', additionalCSS);
            volume = json.volume;
        }

        videoEl.volume = volume;
        videoEl.muted = false;
        videoEl.src = defaultPath + encodeURIComponent(filename);
        
        if (fullscreen) {
            videoEl.className = 'fullscreen';
        } else {
            videoEl.className = 'fade-in';
        }

        if (additionalText) {
            addAlertText(additionalText, additionalCSS)
        }

        printDebug('Loading video: ' + videoEl.src);
        printDebug('Playing video, duration: ' + videoEl.duration);

        if (duration != null && duration > 0) {
            setTimeout(() => {
                printDebug('Video complete (duration), after: ' + (gifDuration/1000) + ' seconds');
                stopMedia(false, true, false);
            }, duration);
        }

        playVideo();
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

    async function handleMacro(json) {
        printDebug('Playing Macro: ' + json.macroName);
        for (let i = 0; i < json.script.length; i++) {
            let element = json.script[i];
            switch (element.elementType) {
                case 'clip':
                    if (getOptionSetting(CONF_ENABLE_VIDEO_CLIPS, 'true') === 'true') {
                        isPlaying = true;
                        await handleVideoClip(element);
                    }
                    break;
                case 'emote':
                    element.emoteId = element.emoteId !== undefined ? element.emoteId.toString() : element.emotetext;
                    await handleEmote(element);
                    break;
                case 'pause':
                    await sleep(element.duration);
                    break;
                case 'sound':
                    if (getOptionSetting('enableAudioHooks', getOptionSetting('allow-audio-hooks', 'false')) === 'true') {
                        await handleAudioHook({audio_panel_hook: element.filename, duration: element.duration});
                    }
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
    audioEl.onended = () => { 
        printDebug('Audio complete (fully played), after: ' + audioEl.duration + ' seconds');
        stopMedia(true, false, false); 
    };
    videoEl.onended = () => {
        printDebug('Video complete (fully played), after: ' + videoEl.duration + ' seconds');
        stopMedia(false, true, false);
    };
});