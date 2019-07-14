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
 */

/**
 * youtubePlayer.js
 *
 * This is version 2 of the youtube player.
 *
 */
(function() {
    var playlistDbPrefix = 'ytPlaylist_',
        randomizePlaylist = $.getSetIniDbBoolean('ytSettings', 'randomizePlaylist', false),
        shuffleQueue = $.getSetIniDbBoolean('ytSettings', 'shuffleQueue', false),
        announceInChat = $.getSetIniDbBoolean('ytSettings', 'announceInChat', false),
        activePlaylistname = $.getSetIniDbString('ytSettings', 'activePlaylistname', 'default'),
        baseFileOutputPath = $.getSetIniDbString('ytSettings', 'baseFileOutputPath', './addons/youtubePlayer/'),
        songRequestsEnabled = $.getSetIniDbBoolean('ytSettings', 'songRequestsEnabled', true),
        songRequestsMaxParallel = $.getSetIniDbNumber('ytSettings', 'songRequestsMaxParallel', 1),
        songRequestsMaxLimit = $.getSetIniDbNumber('ytSettings', 'songRequestsMaxLimit', 2),
        songRequestsMaxSecondsforVideo = $.getSetIniDbNumber('ytSettings', 'songRequestsMaxSecondsforVideo', (8 * 60)),
        stealRefund = $.getSetIniDbBoolean('ytSettings', 'stealRefund', false),
        voteCount = $.getSetIniDbNumber('ytSettings', 'voteCount', 0),
        playCCOnly = $.getSetIniDbBoolean('ytSettings', 'playCCOnly', false),
        voteArray = [],
        skipCount,
        lastSkipTime = 0,
        playlistDJname = $.getSetIniDbString('ytSettings', 'playlistDJname', $.botName),
        
        /* enum for player status */
        playerStateEnum = {
            NEWPAUSE: -3,
            NEW: -2,
            UNSTARTED: -1,
            ENDED: 0,
            PLAYING: 1,
            PAUSED: 2,
            BUFFERING: 3,
            CUED: 5,
            KEEPALIVE: 200
        },
        /* @type {PlayerClientInterface} */
        connectedPlayerClient = null,
        /* @type {BotPlayList} */
        currentPlaylist = null;

    /**
     * @function reloadyt
     */
    function reloadyt() {
        songRequestsMaxParallel = $.getIniDbNumber('ytSettings', 'songRequestsMaxParallel');
        songRequestsMaxLimit = $.getIniDbNumber('ytSettings', 'songRequestsMaxLimit');
        songRequestsMaxSecondsforVideo = $.getIniDbNumber('ytSettings', 'songRequestsMaxSecondsforVideo');
        playlistDJname = $.getIniDbString('ytSettings', 'playlistDJname');
        announceInChat = $.getIniDbBoolean('ytSettings', 'announceInChat');
        stealRefund = $.getIniDbBoolean('ytSettings', 'stealRefund', false);
        voteCount = $.getIniDbNumber('ytSettings', 'voteCount', 0);
        playCCOnly = $.getIniDbBoolean('ytSettings', 'playCCOnly', false);
        
        songRequestsMaxRequest = $.getIniDbNumber('ytSettings', 'songRequestsMaxRequest'),
        
        // Initialize song counter
        $.inidb.set("songcounts", "totalsongs", 0);
        
        // Initialize user request played counter
        $.inidb.RemoveFile("songcounts");
    };

    /**
     * @function loadPanelPlaylist
     */
    function loadPanelPlaylist() {
        var keys = $.inidb.GetKeyList('yt_playlists_registry', ''),
            count = 0;
        $.inidb.RemoveFile('ytPanelPlaylist');

        for (var i in keys) {
            count++;
            $.inidb.set('ytPanelPlaylist', count, keys[i].replace('ytPlaylist_', ''));
        }
    }

    /**
     * @function createDefaultPl
     */
    function createDefaultPl() {
        $.inidb.set('ytPlaylist_default', '1', 'vY_kyk8yL9U');
        $.inidb.set('ytPlaylist_default', '2', 'q_Wk_dn-jEg');
        $.inidb.set('ytPlaylist_default', '3', '5WRZ-bC5XzE');
        $.inidb.set('ytPlaylist_default', '4', '9Y5CCHacHfk');
        $.inidb.set('ytPlaylist_default', 'lastkey', '4');
    }

    /**
     * @function loadDefaultPl
     */
    function loadDefaultPl() {
        if (currentPlaylist === null && connectedPlayerClient !== null) {
            /** Pre-load last activated playlist */
            currentPlaylist = new BotPlayList(activePlaylistname, true);
            /** if the current playlist is "default" and it's empty, add some default songs. */
            if (currentPlaylist.getPlaylistname().equals('default') && currentPlaylist.getplaylistLength() == 0) {
                /** whatfunk - Waves FREE CC0 No Copyright Royalty Free Music */
                try {
                    currentPlaylist.addToPlaylist(new YoutubeVideo('vY_kyk8yL9U', $.botName));
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                }

                /** CYAN!DE - Scorpion FREE Electro House Music For Monetize */
                try {
                    currentPlaylist.addToPlaylist(new YoutubeVideo('q_Wk_dn-jEg', $.botName));
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                }

                /** SmaXa - We're Coming In FREE Creative Commons Music */
                try {
                    currentPlaylist.addToPlaylist(new YoutubeVideo('5WRZ-bC5XzE', $.botName))
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                }

                /** Static Love - Choices FREE Pop Music for Monetize */
                try {
                    currentPlaylist.addToPlaylist(new YoutubeVideo('9Y5CCHacHfk', $.botName))
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                }
            }
        }
    }

    /**
     * @class
     * @description This class holds information about a youtube video.
     * @param {string} searchQuery
     * @param {string} owner
     * @throws {Exception}
     * @requires PlayerClientInterface
     */
    function YoutubeVideo(searchQuery, owner) {
        var videoId = '',
            videoTitle = '',
            videoLength = -1,
            license = 0,
            embeddable = 0;

        this.found = false;

        /**
         * @function getVideoId
         * @returns {string}
         */
        this.getVideoId = function() {
            return videoId;
        };

        /**
         * @function getOwner
         * @returns {string}
         */
        this.getOwner = function() {
            return owner;
        };

        /**
         * @function getVideoLength
         * @returns {number}
         */
        this.getVideoLength = function() {
            var attempts = 0;
            if (videoLength != -1) {
                return videoLength;
            }

            var lengthData = $.youtube.GetVideoLength(videoId);

            if (lengthData[0] == 123 && lengthData[1] == 456 && lengthData[2] === 7899) {
                throw 'Live Stream Detected';
            }
            // only try 2 times.
            // No point in spamming the API, we'll hit the limit.
            // If we try more than 2 times, that's 2 times on each song.
            while (lengthData[0] == 0 && lengthData[1] == 0 && lengthData[2] == 0 && attempts <= 2) {
                lengthData = $.youtube.GetVideoLength(videoId);
                attempts++;
            }
            if (lengthData[0] == 0 && lengthData[1] == 0 && lengthData[2] == 0) {
                return 0;
            }
            videoLength = lengthData[2];
            return lengthData[2];
        };

        /**
         * @function getVideoInfo
         * Sets the member values for embeddable and license.
         */
        this.getVideoInfo = function() {
            var videoInfo = $.youtube.GetVideoInfo(videoId);
            license = videoInfo[0];
            embeddable = videoInfo[1];
        }

        /**
         * @function getVideoLengthMMSS
         * @returns {String}
         */
        this.getVideoLengthMMSS = function() {
            var min,
                sec;

            if (videoLength == -1) {
                videoLength = this.getVideoLength();
            }

            min = (videoLength / 60 < 10 ? "0" : "") + Math.floor(videoLength / 60);
            sec = (videoLength % 60 < 10 ? "0" : "") + Math.floor(videoLength % 60);

            return min + ":" + sec;
        };

        /**
         * @function getVideoLink
         * @returns {string}
         */
        this.getVideoLink = function() {
            return 'https://youtu.be/' + videoId;
        };

        /**
         * @function getVideoTitle
         * @returns {string}
         */
        this.getVideoTitle = function() {
            return videoTitle;
        };

        /** START CONTRUCTOR YoutubeVideo() */

        if (!searchQuery) {
            throw "No Search Query Given";
        }

        searchQuery = searchQuery.trim();

        if (!owner.equals(playlistDJname)) {
            owner = owner.toLowerCase();
        }

        /* Redefine searchQuery to check the cache, if it doesn't exist in the cache,
         * this is simply extracting the ID from the searchString which is one way
         * of looking up videos via the YouTube API. Also, strip any query parameters
         * from what should be URLs.  We do not wish to do this at the non-URL level
         * as someone might be searching for a song using an ampersand.
         */
        if (searchQuery.includes('watch?v=')) {
            searchQuery = searchQuery.split('=', 2)[1];
            if (searchQuery.includes('&')) {
                searchQuery = searchQuery.split('&', 2)[0];
            }
        }
        if (searchQuery.startsWith('https://youtu.be/')) {
            searchQuery = searchQuery.split('/', 4)[3];
            if (searchQuery.includes('&')) {
                searchQuery = searchQuery.split('&', 2)[0];
            }
        }

        if ($.inidb.exists('ytcache', searchQuery)) {
            var jsonString = $.inidb.get('ytcache', searchQuery);
            var jsonData = JSON.parse(jsonString);
            videoId = jsonData["id"];
            videoTitle = jsonData["title"];
            videoLength = jsonData["time"];
        } else {
            var data = null;
            var attempts = 0;
            // We do not need an infinite loop here. 2 attempts is enough.
            // If we loop more we might hit the limit.
            // Since we need to look x times for each songs.
            do {
                data = $.youtube.SearchForVideo(searchQuery);
                attempts++;
            } while (data[0].length() < 11 && data[1] != "No Search Results Found" && attempts <= 2);

            // Hit 5 trys and nothing was found
            if (data[0].length() < 11) {
                throw 'No data returned.';
            }

            videoId = data[0];
            videoTitle = data[1];

            if (videoTitle.equalsIgnoreCase('video marked private') || videoTitle.equalsIgnoreCase('no search results found')) {
                throw videoTitle;
            }

            this.getVideoLength();
            var jsonData = {};
            jsonData["id"] = videoId + '';
            jsonData["title"] = videoTitle + '';
            jsonData["time"] = videoLength;
            var jsonString = JSON.stringify(jsonData);
            $.inidb.set('ytcache', videoId, jsonString);
        }

        this.getVideoInfo();
        if (license == 0 && playCCOnly) {
            throw 'Video is not licensed as Creative Commons (ID: ' + videoId + ')';
        }
        if (embeddable == 0) {
            throw 'This video is not allowed to be embedded (ID: ' + videoId + ')';
        }

        /** END CONTRUCTOR YoutubeVideo() */
    }

    /**
     * @class
     * @description This class loads a playlist and takes care of managing currently playing songs and songrequest.
     * @param {string} playlistName
     * @param {boolean} loadDefaultPlaylist
     * @return {boolean}
     * @requires YoutubeVideo
     */
    function BotPlayList(playlistName, loadDefault) {
        var previousVideo = null,
            currentVideo = null,
            playListDbId = playlistDbPrefix + playlistName,
            defaultPlaylist = [], // @type { Integer[] }
            defaultPlaylistReadOnly = [], // @type { Integer[] }
            //requests = new java.util.concurrent.ConcurrentLinkedQueue, // @type { YoutubeVideo[] }
            requests = new Packages.kentobot.songrequest.SongQueue,  // @type { YoutubeVideo[] }
            lastRequesters = new java.util.concurrent.ConcurrentLinkedQueue,
            requestFailReason = '';

        this.playlistName = playlistName;
        this.loaded = false;

        /**
         * @function importPlaylistFile
         * @param {String}
         * @param {String}
         * @return {String}
         */
        this.importPlaylistFile = function(listName, fileName, sender) {
            var importedList = [],
                importCount = 0,
                failCount = 0,
                playlistFailCount = 0,
                spaceMacther = new RegExp('\\s');

            if ($.inidb.exists('yt_playlists_registry', 'ytPlaylist_' + listName)) {
                if ($.fileExists("./addons/youtubePlayer/" + fileName)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.importpl.file.start'));
                    importedList = $.readFile("./addons/youtubePlayer/" + fileName);
                    for (var i = 0; i < importedList.length; i++) {
                        if (importedList[i].contains('&list')) {
                            playlistFailCount++;
                            continue;
                        } else if (spaceMacther.test(importedList[i]) || importedList[i].isEmpty()) { // match for spaces or an empty line.
                            failCount++;
                            continue;
                        }

                        try {
                            var youtubeVideo = new YoutubeVideo(importedList[i], 'importPlaylistFile');
                            $.inidb.set(playlistDbPrefix + listName, importCount, youtubeVideo.getVideoId());
                            importCount++;
                        } catch (ex) {
                            $.log.error("importPlaylistFile::skipped [" + importedList[i] + "]: " + ex);
                            failCount++;
                        }
                    }
                    $.inidb.set(playlistDbPrefix + listName, 'lastkey', importCount);

                    if (playlistFailCount > 0) {
                        return $.lang.get('ytplayer.command.importpl.file.success.plerror', importCount, failCount, fileName, listName, playlistFailCount);
                    } else {
                        return $.lang.get('ytplayer.command.importpl.file.success', importCount, failCount, fileName, listName);
                    }
                } else {
                    return $.lang.get('ytplayer.command.importpl.file.404', fileName);
                }
            }
            return $.lang.get('ytplayer.command.importpl.file.registry404', listName);
        };

        /**
         * @function loadNewPlaylist
         * @return {Boolean}
         */
        this.loadNewPlaylist = function(listName) {
            if ($.inidb.exists('yt_playlists_registry', 'ytPlaylist_' + listName)) {
                this.playlistName = listName;
                playListDbId = playlistDbPrefix + listName;
                this.loadPlaylistKeys();
                connectedPlayerClient.pushPlayList();
            }
        };

        /**
         * @function getplayListDbId
         * @return {String}
         */
        this.getplayListDbId = function() {
            return playListDbId;
        };

        /**
         * @function getRequestFailReason
         * @return {String}
         */
        this.getRequestFailReason = function() {
            return requestFailReason;
        };

        /**
         * @function setCurrentVideo
         * @param {YoutubeVideo} youtubeVideo
         */
        this.setCurrentVideo = function(youtubeVideo) {
            currentVideo = youtubeVideo;
        };

        /**
         * @function addToPlaylist
         * @param {YoutubeVideo} youtubeVideo
         * @param {string} [targetPlaylistName]
         * @return {number}
         */
        this.addToPlaylist = function(youtubeVideo, targetPlaylistName) {
            if (!youtubeVideo) {
                return -1;
            }
            var newKey;
            targetPlaylistName = (targetPlaylistName ? targetPlaylistName : this.playlistName);
            if (this.videoExistsInPlaylist(youtubeVideo, targetPlaylistName)) {
                return -2;
            }
            if (targetPlaylistName) {
                newKey = (!$.inidb.exists(playlistDbPrefix + targetPlaylistName, 'lastkey') ? 0 : parseInt($.inidb.get(playlistDbPrefix + targetPlaylistName, 'lastkey')) + 1);
                $.inidb.set(playlistDbPrefix + targetPlaylistName, newKey, youtubeVideo.getVideoId());
                $.inidb.set(playlistDbPrefix + targetPlaylistName, 'lastkey', newKey);
            }
            if (targetPlaylistName.equals(this.playlistName)) {
                this.loadPlaylistKeys();
                connectedPlayerClient.pushPlayList();
            }
            return newKey;
        };

        /**
         * @function deleteCurrentVideo
         * @returns {Number}
         */
        this.deleteCurrentVideo = function() {
            var keyList = $.inidb.GetKeyList(playListDbId, ''),
                i;

            for (i = 0; i < keyList.length; i++) {
                if (!keyList[i].equals("lastkey")) {
                    if ($.inidb.get(playListDbId, keyList[i]) == currentVideo.getVideoId()) {
                        $.inidb.del(playListDbId, keyList[i]);
                        break;
                    }
                }
            }

            if (this.loadPlaylistKeys() > 0) {
                connectedPlayerClient.pushPlayList();
                this.nextVideo();
            } else {
                connectedPlayerClient.pushPlayList();
            }

            return this.getplaylistLength();
        };

        /**
         * @function deleteVideoByID
         * @param {String}
         * @returns {Number}
         */
        this.deleteVideoByID = function(videoId) {
            var keyList = $.inidb.GetKeyList(playListDbId, ''),
                i;

            for (i = 0; i < keyList.length; i++) {
                if ($.inidb.get(playListDbId, keyList[i]).equals(videoId)) {
                    $.inidb.del(playListDbId, keyList[i]);
                    break;
                }
            }
            this.loadPlaylistKeys();
            connectedPlayerClient.pushPlayList();
        }

        /**
         * @function deletePlaylist
         * @returns {boolean}
         */
        this.deletePlaylist = function(listName) {
            if ($.inidb.exists('yt_playlists_registry', 'ytPlaylist_' + listName)) {
                $.inidb.del('yt_playlists_registry', 'ytPlaylist_' + listName);
                $.inidb.RemoveFile('ytPlaylist_' + listName);
                return true;
            }
            return false;
        };

        /**
         * @function getCurrentVideo
         * @returns {YoutubeVideo}
         */
        this.getCurrentVideo = function() {
            return currentVideo;
        };

        /**
         * @function getPlaylistname
         * @returns {string}
         */
        this.getPlaylistname = function() {
            return this.playlistName;
        };

        /**
         * @function getplaylistLength
         * @returns {Number}
         */
        this.getplaylistLength = function() {
            return defaultPlaylist.length;
        };

        /**
         * @function getReadOnlyPlaylistData
         * @returns {String}[]
         */
        this.getReadOnlyPlaylistData = function() {
            return defaultPlaylistReadOnly;
        }

        /**
         * @function getPreviousVideo
         * @returns {YoutubeVideo}
         */
        this.getPreviousVideo = function() {
            return previousVideo;
        };

        /**
         * @function getRequestList
         * @returns {List}{YoutubeVideo}
         */
        this.getRequestList = function() {
            return requests.toArray();
        }

        /**
         * @function getRequestAtIndex
         * @returns {YoutubeVideo}
         */
        this.getRequestAtIndex = function(index) {
            var requestsArray = requests.toArray();
            if (index > requestsArray.length) {
                return null;
            }
            return requestsArray[index];
        }

        /**
         * @function getRequestsCount
         * @returns {Number}
         */
        this.getRequestsCount = function() {
            return requests.size();
        };
        
        /**
         * @function jumpToSong
         * @param playlistPosition
         * @return {boolean}
         */
        this.jumpToSong = function(playlistPosition) {
            playlistPosition--;

            if (!requests.isEmpty()) {
                if (currentPlaylist.getRequestAtIndex(playlistPosition) == null) {
                    return false;
                }
                previousVideo = currentVideo;
                try {
                    currentVideo = currentPlaylist.getRequestAtIndex(playlistPosition);
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                    return false;
                }
            } else {
                if (defaultPlaylistReadOnly.length == 0 || defaultPlaylistReadOnly.length < playlistPosition) {
                    return false;
                }

                previousVideo = currentVideo;
                try {
                    var playListIndex = defaultPlaylistReadOnly[playlistPosition];
                    currentVideo = new YoutubeVideo($.inidb.get(playListDbId, playListIndex), playlistDJname);
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                    return false;
                }
            }

            connectedPlayerClient.play(currentVideo);
            this.updateCurrentSongFile(currentVideo);

            if (announceInChat) {
                $.say($.lang.get('ytplayer.announce.nextsong', currentVideo.getVideoTitle(), currentVideo.getOwner()));
            }

            skipCount = 0;
            voteArray = [];
            return true;
        };

        /**
         * @function findSongByTitle
         * @param String
         * @return (boolean}
         */
        this.findSongByTitle = function(songTitle) {
            if (!requests.isEmpty()) {
                var videoTitle = null,
                    requestsArray = requests.toArray(),
                    match = false;

                for (var i in requestsArray) {
                    videoTitle = requestsArray[i].getVideoTitle();
                    if (videoTitle.toLowerCase().indexOf(songTitle.toLowerCase()) >= 0) {
                        previousVideo = currentVideo;
                        try {
                            currentVideo = currentPlaylist.getRequestAtIndex(i);
                            match = true;
                        } catch (ex) {
                            $.log.error("YoutubeVideo::exception: " + ex);
                            return false;
                        }
                        break;
                    }
                }
            } else {
                if (defaultPlaylistReadOnly.length == 0) {
                    return false;
                }

                for (var i in defaultPlaylistReadOnly) {
                    try {
                        examineVideo = new YoutubeVideo($.inidb.get(playListDbId, defaultPlaylistReadOnly[i]), playlistDJname);
                        if (examineVideo.getVideoTitle().toLowerCase().indexOf(songTitle.toLowerCase()) >= 0) {
                            previousVideo = currentVideo;
                            currentVideo = new YoutubeVideo($.inidb.get(playListDbId, defaultPlaylistReadOnly[i]), playlistDJname);
                            match = true;
                            break;
                        }
                    } catch (ex) {
                        $.log.error("YoutubeVideo::exception: " + ex);
                        return false;
                    }
                }
            }

            if (!match) {
                return false;
            }

            connectedPlayerClient.play(currentVideo);
            this.updateCurrentSongFile(currentVideo);

            if (announceInChat) {
                $.say($.lang.get('ytplayer.announce.nextsong', currentVideo.getVideoTitle(), currentVideo.getOwner()));
            }

            skipCount = 0;
            voteArray = [];
            return true;
        }


        /**
         * @function loadPlaylistKeys
         * @returns {number}
         */
        this.loadPlaylistKeys = function() {
            var keyList = $.inidb.GetKeyList(playListDbId, '');

            defaultPlaylist = [];
            defaultPlaylistReadOnly = [];

            for (var i = 0; i < keyList.length; i++) {
                if (!keyList[i].equals("lastkey")) {
                    defaultPlaylist.push(keyList[i]);
                }
            }
            defaultPlaylist = (randomizePlaylist ? $.arrayShuffle(defaultPlaylist) : defaultPlaylist);
            for (var i = 0; i < defaultPlaylist.length; i++) {
                defaultPlaylistReadOnly.push(defaultPlaylist[i]);
            }
            this.loaded = true;
            return keyList.length;
        };

        /**
         * @function nextVideo
         * @return {YoutubeVideo}
         */
        this.nextVideo = function() {
            if (!connectedPlayerClient) {
                return null;
            }
            
            // TODO Add Randomizer here

            exception = true;
            while (exception) {
                previousVideo = currentVideo;

                if (!requests.isEmpty()) {
                    currentVideo = requests.poll();
                    exception = false;
                } else {
                    if (defaultPlaylist.length == 0) {
                        if (this.loadPlaylistKeys() == 0) {
                            return new YoutubeVideo('r9NsG7pMwNk', playlistDJname);
                        }
                        return new YoutubeVideo('r9NsG7pMwNk', playlistDJname);
                    }

                    try {
                        var playListIndex = defaultPlaylist.shift();
                        currentVideo = new YoutubeVideo($.inidb.get(playListDbId, playListIndex), playlistDJname);
                        exception = false
                    } catch (ex) {
                        $.log.error("YoutubeVideo::exception: " + ex);
                        exception = true;
                    }

                }
            }

            connectedPlayerClient.play(currentVideo);
            this.updateCurrentSongFile(currentVideo);

            if (announceInChat) {
                $.say($.lang.get('ytplayer.announce.nextsong', currentVideo.getVideoTitle(), currentVideo.getOwner()));
            }
            skipCount = 0;
            voteArray = [];
            return currentVideo;
        };

        /**
         * @function preparePlaylist
         * @return {boolean}
         */
        this.preparePlaylist = function(playlistName) {
            $.inidb.set('ytSettings', 'activePlaylistname', playlistName);
            if (!$.inidb.exists('yt_playlists_registry', playListDbId) || !$.inidb.FileExists(playListDbId)) {
                $.setIniDbBoolean('yt_playlists_registry', playListDbId, true);
                $.inidb.AddFile(playListDbId);
            }
            return true;
        };

        /**
         * @function removeSong
         * @param {String} YouTube ID
         * @return {String}
         */
        this.removeSong = function(youTubeID) {
            var songTitle = null,
                requestsArray = requests.toArray(),
                i;

            for (i in requestsArray) {
                if (requestsArray[i].getVideoId().equals(youTubeID)) {
                    songTitle = requestsArray[i].getVideoTitle();
                    requests.remove(requestsArray[i]);
                    break;
                }
            }
            return songTitle;
        };

        /**
         * @function removeUserSong
         * @param {String}
         * @return {String}
         */
        this.removeUserSong = function(username) {
            var songTitle = null,
                requestsArray = requests.toArray(),
                i;

            for (i = requestsArray.length - 1; i >= 0; i--) {
                if (requestsArray[i].getOwner().equals(username) && songTitle == null) {
                    songTitle = requestsArray[i].getVideoTitle();
                    requests.remove(requestsArray[i]);
                }
            }
            return songTitle;
        };
        
        this.removeSongIndex = function(index) {
            var songTitle = null,
                requestsArray = requests.toArray();

            songTitle = requestsArray[index-1].getVideoTitle();
            requests.remove(requestsArray[index-1]);
            
            return songTitle;
        };

        /**
         * @function requestSong
         * @param {string} searchQuery
         * @param {string} requestOwner
         * @return {YoutubeVideo}
         */
        this.requestSong = function(searchQuery, requestOwner) {
            var keys = $.inidb.GetKeyList('ytpBlacklistedSong', '');
            if (!$.isAdmin(requestOwner) && !$.isMod(requestOwner) && (!songRequestsEnabled || this.senderReachedRequestMax(requestOwner) || this.senderReachedTotalRequestsMax(requestOwner))) {
                if (this.senderReachedRequestMax(requestOwner)) {
                    // User already has max allowed in the queue
                    requestFailReason = $.lang.get('ytplayer.requestsong.error.maximum.concurrent.requests', songRequestsMaxParallel);
                } else if (this.senderReachedTotalRequestsMax(requestOwner)) {
                    // User has requested the max allowed per stream
                    // Mods and owner are exempt
                    requestFailReason = $.lang.get('ytplayer.requestsong.error.maximum.total.requests', songRequestsMaxLimit);
                } else {
                    requestFailReason = $.lang.get('ytplayer.requestsong.error.disabled');
                }
                return null;
            }

            try {
                var youtubeVideo = new YoutubeVideo(searchQuery, requestOwner);
            } catch (ex) {
                requestFailReason = $.lang.get('ytplayer.requestsong.error.yterror', ex);
                $.log.error("YoutubeVideo::exception: " + ex);
                return null;
            }

            if (this.videoExistsInRequests(youtubeVideo)) {
                requestFailReason = $.lang.get('ytplayer.requestsong.error.exists');
                return null;
            }

            if (this.videoLengthExceedsMax(youtubeVideo) && !$.isAdmin(requestOwner)) {
                var minutes = Math.floor(songRequestsMaxSecondsforVideo / 60);
                var seconds = songRequestsMaxSecondsforVideo - minutes * 60;
            
                if (seconds === 0) {
                    seconds = "00";
                }
                requestFailReason = $.lang.get('ytplayer.requestsong.error.maxlength', youtubeVideo.getVideoLengthMMSS(), minutes + ":" + seconds);
                return null;
            }

            for (var i in keys) {
                if (youtubeVideo.getVideoTitle().toLowerCase().includes(keys[i])) {
                    requestFailReason = $.lang.get('ytplayer.blacklist.404');
                    return null;
                }
            }

            requests.add(youtubeVideo);
            return youtubeVideo;
        };

        /**
         * @function senderReachedRequestMax
         * @param {string} sender
         * @returns {boolean}
         */
        this.senderReachedRequestMax = function(sender) {
            var currentRequestCount = 0,
                requestsArray = requests.toArray(),
                i;

            sender = sender.toLowerCase();

            for (i in requestsArray) {
                if (requestsArray[i].getOwner() == sender) {
                    ++currentRequestCount;
                }
            }
            return (currentRequestCount >= songRequestsMaxParallel);
        };
        
        /**
         * 
         * @function senderReachedTotalRequestsMax Determines if the user has reached the 
         * maximum number of requests per stream
         * @param {type} sender
         * @returns {boolean}
         */
        this.senderReachedTotalRequestsMax = function(sender) {
            var totalUserRequests = $.inidb.get("songcounts", sender +"-request-counts");
            return totalUserRequests > songRequestsMaxLimit;
        };

        /**
         * @function updateCurrentSongFile
         * @param {YoutubeVideo} youtubeVideo
         * Note that the trailing space is for any broadcasting software which is "wrapping"
         * the text constantly in a loop.
         */
        this.updateCurrentSongFile = function(youtubeVideo) {
            $.writeToFile(
                youtubeVideo.getVideoTitle() + ' -- Requested by ' + youtubeVideo.getOwner() + ' ',
                baseFileOutputPath + 'currentsong.txt',
                false
            );
        };

        /**
         * @function videoExistsInPlaylist
         * @param {YoutubeVideo} youtubeVideo
         * @param {string} targetPlaylistName
         * @returns {boolean}
         */
        this.videoExistsInPlaylist = function(youtubeVideo, targetPlaylistName) {
            var keyList = $.inidb.GetKeyList(playlistDbPrefix + targetPlaylistName, ''),
                i;

            for (i in keyList) {
                if (!keyList[i].equals("lastkey")) {
                    if ($.inidb.get(playlistDbPrefix + targetPlaylistName, keyList[i]) == youtubeVideo.getVideoId()) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * @function videoExistsInRequests
         * @param {YoutubeVideo} youtubeVideo
         * @returns {boolean}
         */
        this.videoExistsInRequests = function(youtubeVideo) {
            var i,
                requestsArray = requests.toArray();

            for (i in requestsArray) {
                if (requestsArray[i].getVideoId() == youtubeVideo.getVideoId()) {
                    return true;
                }
            }

            return false;
        };

        /**
         * @function videoLengthExceedsMax
         * @param {YoutubeVideo} youtubeVideo
         * @returns {boolean}
         */
        this.videoLengthExceedsMax = function(youtubeVideo) {
            return (youtubeVideo.getVideoLength() > songRequestsMaxSecondsforVideo);
        };

        /** START CONTRUCTOR PlayList() */

        if (!this.playlistName) {
            return this.loaded;
        }

        this.preparePlaylist(this.playlistName);
        if (loadDefault) {
            this.loadPlaylistKeys();
        }
        
        this.addToQueue = function(youtubeVideo, position) {
            requests.addAtPosition(youtubeVideo, position);
        };
        
        this.getPreviousRequesters = function() {
            return lastRequesters;
        };
        
         this.addRequester = function(requester) {
             lastRequesters.add(requester);
        };
        

        /** END CONTRUCTOR PlayList() */
    }

    /**
     * @class
     * @description This class acts as interface between the javascript and any connected player clients
     */
    function PlayerClientInterface() {
        var client = $.ytplayer,
            playerPaused = false;

        /**
         * @function pushCurrentSong
         */
        this.pushCurrentSong = function() {
            var jsonData = {};

            jsonData['currentsong'] = {
                "requester": currentPlaylist.getCurrentVideo().getOwner() + '',
                "song": currentPlaylist.getCurrentVideo().getVideoId() + '',
                "title": currentPlaylist.getCurrentVideo().getVideoTitle() + '',
                "duration": currentPlaylist.getCurrentVideo().getVideoLengthMMSS() + ''
            };
            client.currentSong(JSON.stringify(jsonData));
        }

        /**
         * @function pushPlayList
         */
        this.pushPlayList = function() {
            var jsonList = {},
                playList = [],
                jsonString,
                jsonData,
                youtubeObject,
                videoId,
                videoTitle,
                videoLength,
                youTubeDbId,
                i;

            if (currentPlaylist) {

                jsonList['playlistname'] = currentPlaylist.getPlaylistname() + '';
                jsonList['playlist'] = [];
                playList = currentPlaylist.getReadOnlyPlaylistData();

                for (i = 0; i < playList.length; i++) {

                    youTubeDbId = $.inidb.get(currentPlaylist.getplayListDbId(), playList[i]);

                    if ($.inidb.exists('ytcache', youTubeDbId)) {
                        jsonString = $.inidb.get('ytcache', youTubeDbId);
                        jsonData = JSON.parse(jsonString);
                        videoId = jsonData["id"];
                        videoTitle = jsonData["title"];
                        videoLength = jsonData["time"];

                        min = (videoLength / 60 < 10 ? "0" : "") + Math.floor(videoLength / 60);
                        sec = (videoLength % 60 < 10 ? "0" : "") + Math.floor(videoLength % 60);
                        videoLength = min + ':' + sec;

                        jsonList['playlist'].push({ "song": videoId, "title": videoTitle, "duration": videoLength });
                    } else {
                        try {
                            youtubeObject = new YoutubeVideo(youTubeDbId, $.botName);
                            videoId = youtubeObject.getVideoId() + '';
                            videoTitle = youtubeObject.getVideoTitle() + '';
                            videoLength = youtubeObject.getVideoLengthMMSS() + '';

                            // Store in the YTCache so that we do not have to hit the API again later.
                            jsonData = {};
                            jsonData["id"] = videoId;
                            jsonData["title"] = videoTitle;
                            jsonData["time"] = youtubeObject.getVideoLength();
                            jsonString = JSON.stringify(jsonData);
                            $.inidb.set('ytcache', videoId, jsonString);

                            jsonList['playlist'].push({ "song": videoId, "title": videoTitle, "duration": videoLength });
                        } catch (ex) {
                            $.log.error('YouTube API Failed Lookup: Playlist [' + jsonList['playlistname'] +
                                '] Index [' + playList[i] + '] YT ID [' + youTubeDbId + '] Error [' + ex + ']');
                        }
                    }
                }
                client.playList(JSON.stringify(jsonList));
            }
        };

        /**
         * @function pushSongList
         */
        this.pushSongList = function() {
            var jsonList = {},
                requestList = [],
                youtubeObject,
                i;

            if (currentPlaylist) {
                jsonList['songlist'] = [];
                requestList = currentPlaylist.getRequestList();
                for (i in requestList) {
                    youtubeObject = requestList[i];
                    jsonList['songlist'].push({
                        "song": youtubeObject.getVideoId() + '',
                        "title": youtubeObject.getVideoTitle() + '',
                        "duration": youtubeObject.getVideoLengthMMSS() + '',
                        "requester": youtubeObject.getOwner() + ''
                    });
                }
                client.songList(JSON.stringify(jsonList));
            }
        };


        /**
         * @function play
         * @param {YoutubeVideo} youtubeVideo
         */
        this.play = function(youtubeVideo) {
            // Increment song count
            $.inidb.incr("songcounts", "totalsongs", 1);

            var lastRequesters = currentPlaylist.getPreviousRequesters();
            var requestOwner = youtubeVideo.getOwner();
            
            if (lastRequesters != null) {
                if (lastRequesters.size() > 2) {
                    lastRequesters.poll();
                }
            }

            if(!$.isAdmin(requestOwner) && !$.isMod(requestOwner)) {
                currentPlaylist.addRequester(requestOwner);
            }

            // Increment request count for user
            $.inidb.incr("songcounts", requestOwner +"-request-counts" , 1);
            
//            saveSongHistory(String($.username.resolve(requestOwner)), youtubeVideo.getVideoTitle());
            
            client.play(youtubeVideo.getVideoId(), youtubeVideo.getVideoTitle(), youtubeVideo.getVideoLengthMMSS(), youtubeVideo.getOwner());
        };
        
        function saveSongHistory(username, song) {
            var newKey = $.inidb.GetKeyList('history', '').length;

            if ($.inidb.exists('history', newKey)) {
                newKey++;
            }
            
            song = String(song).replace(/"/g, '\'\'');
            $.inidb.set('history', newKey, JSON.stringify([username, song, $.systemTime()]));
            return newKey;
        };

        /**
         * @function getVolume
         * @returns {number}
         */
        this.getVolume = function() {
            return client.getVolume();
        };

        /**
         * @function setVolume
         * @param {number} volume
         */
        this.setVolume = function(volume) {
            volume = parseInt(volume);
            if (!isNaN(volume)) {
                client.setVolume(volume);
                $.inidb.set('ytSettings', 'volume', volume);
            }
        };

        /**
         * @function togglePause
         * @returns {boolean}
         */
        this.togglePause = function() {
            client.pause();
            playerPaused = !playerPaused;
            return playerPaused;
        };

        /**
         * @function checkState
         * @returns {Int}
         */
        this.checkState = function() {
            return parseInt(client.getPlayerState());
        }
    }



    /**
     * @event yTPlayerRandomize
     */
    $.bind('yTPlayerRandomize', function(event) {
        var EventBus = Packages.tv.phantombot.event.EventBus,
            CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;

        EventBus.instance().post(new CommandEvent($.botName, 'ytp', 'togglerandom'));
    });

    /**
     * @event yTQueueRandomize
     */
    $.bind('yTPlayerRandomize', function(event) {
        var EventBus = Packages.tv.phantombot.event.EventBus,
            CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;

        EventBus.instance().post(new CommandEvent($.botName, 'ytp', 'toggleshuffle'));
    });

    /**
     * @event yTPlayerDeletePlaylistByID
     */
    $.bind('yTPlayerDeletePlaylistByID', function(event) {
        currentPlaylist.deleteVideoByID(event.getYouTubeID());
    });

    /**
     * @event yTPlayerSongRequest
     */
    $.bind('yTPlayerSongRequest', function(event) {
        var request = currentPlaylist.requestSong(event.getSearch(), $.ownerName);
        if (request != null) {
            connectedPlayerClient.pushSongList();
        }
    });

    /**
     * @event ytPlayerStealSong
     */
    $.bind('yTPlayerStealSong', function(event) {
        var youTubeID = (event.getYouTubeID() + ''),
            refundUser = (event.getRequester() + ''),
            retval;

        if (youTubeID.length > 1) {
            retval = currentPlaylist.addToPlaylist(new YoutubeVideo(youTubeID, refundUser));
        } else {
            refundUser = currentPlaylist.getCurrentVideo().getOwner().toLowerCase();
            retval = currentPlaylist.addToPlaylist(currentPlaylist.getCurrentVideo());
        }

        if (stealRefund && retval != -2 && refundUser.length > 1) {
            if (!$.isBot(refundUser) && !playlistDJname.equalsIgnoreCase(refundUser)) {
                if ($.inidb.exists('pricecom', 'songrequest') || $.inidb.exists('pricecom', 'addsong')) {
                    var isMod = $.isMod(refundUser);
                    if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(refundUser)) || !isMod))) {
                        var refund = $.inidb.get('pricecom', 'songrequest');
                        if (refund == 0) {
                            refund = $.inidb.get('pricecom', 'addsong');
                        }
                        refund = parseInt(refund / 2);
                        if (refund > 0) {
                            $.inidb.incr('points', refundUser, parseInt(refund));
                            $.say($.lang.get('ytplayer.command.stealsong.refund', $.username.resolve(refundUser), refund, (refund == 1 ? $.pointNameSingle : $.pointNameMultiple)));
                        }
                    }
                }
            }
        }
    });

    /**
     * @event yTPlayerLoadPlaylist
     */
    $.bind('yTPlayerLoadPlaylist', function(event) {
        currentPlaylist.loadNewPlaylist(event.getPlaylist());
        loadPanelPlaylist();
    });

    /**
     * @event ytPlayerDeleteCurrent
     */
    $.bind('yTPlayerDeleteCurrent', function(event) {
        currentPlaylist.deleteCurrentVideo();
        connectedPlayerClient.pushSongList();
    });

    /**
     * @event ytPlayerSkipSong
     */
    $.bind('yTPlayerSkipSong', function(event) {
        currentPlaylist.nextVideo();
        connectedPlayerClient.pushSongList();
    });

    /**
     * @event yTPlayerDeleteSR
     */
    $.bind('yTPlayerDeleteSR', function(event) {
        currentPlaylist.removeSong(event.getId());
        connectedPlayerClient.pushSongList();
    });

    /**
     * @event yTPlayerVolume
     */
    $.bind('yTPlayerVolume', function(event) {
        $.inidb.set('ytSettings', 'volume', event.getVolume());
    });

    /**
     * @event yTPlayerRequestSonglist
     */
    $.bind('yTPlayerRequestSonglist', function(event) {
        connectedPlayerClient.pushSongList();
    });

    /**
     * @event yTPlayerRequestPlaylist
     */
    $.bind('yTPlayerRequestPlaylist', function(event) {
        connectedPlayerClient.pushPlayList();
    });

    /**
     * @event yTPlayerRequestCurrentSong
     */
    $.bind('yTPlayerRequestCurrentSong', function(event) {
        connectedPlayerClient.pushCurrentSong();
    });

    /**
     * @event yTPlayerState
     */
    $.bind('yTPlayerState', function(event) {
        var state = event.getStateId(),
            volume;

        if (state == playerStateEnum.NEW || state == playerStateEnum.NEWPAUSE) {
            volume = $.inidb.exists('ytSettings', 'volume') ? parseInt($.inidb.get('ytSettings', 'volume')) : 5;
            connectedPlayerClient.setVolume(volume);
            if (currentPlaylist) {
                if (announceInChat && state == playerStateEnum.NEWPAUSE) {
                    announceInChat = false;
                    currentPlaylist.nextVideo();
                    announceInChat = true;
                } else {
                    currentPlaylist.nextVideo();
                }

                if (state != playerStateEnum.NEWPAUSE) {
                    if (songRequestsEnabled && announceInChat) {
                        $.say($.lang.get('ytplayer.songrequests.enabled'));
                    }
                }
            }
        }

        if (state == playerStateEnum.ENDED) {
            if (currentPlaylist) {
                // Record song title for history
                var videoTitle = currentPlaylist.getCurrentVideo().getVideoTitle();
                var videoId = currentPlaylist.getCurrentVideo().getVideoId()
                $.inidb.set("songhistory", videoTitle + '|' + videoId, $.getLocalTime());
                
                // TODO Use HttpRequest or create a new class that can call the Google Sheets API to add rows for song
                // Pass the song name, YouTube link, and requester
                
                // Commented out to prevent autoplay
                //currentPlaylist.nextVideo();

            }
        }
    });

    /**
     * @event yTPlayerCurrentId
     */
    $.bind('yTPlayerCurrentId', function(event) {
        if (isNaN(event.getId())) {
            var video = new YoutubeVideo(event.getId(), $.ownerName);

            connectedPlayerClient.play(video);
            currentPlaylist.setCurrentVideo(video);
            currentPlaylist.updateCurrentSongFile(video);
        } else {
            currentPlaylist.jumpToSong(parseInt(event.getId()));
        }
    });

    /**
     * @event yTPlayerConnect
     */
    $.bind('yTPlayerConnect', function(event) {
        connectedPlayerClient = new PlayerClientInterface();

        $.consoleLn($.lang.get('ytplayer.console.client.connected'));
        loadDefaultPl();
        connectedPlayerClient.pushPlayList();
        $.youtubePlayerConnected = true;
        $.ytplayer.setClientConnected(true);
    });

    /**
     * @event yTPlayerDisconnect
     */
    $.bind('yTPlayerDisconnect', function(event) {
        connectedPlayerClient = null;

        $.ytplayer.setClientConnected(false);
        $.consoleLn($.lang.get('ytplayer.console.client.disconnected'));
        if (!songRequestsEnabled && announceInChat) {
            $.say($.lang.get('ytplayer.songrequests.disabled'));
        }
        $.youtubePlayerConnected = false;
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            sender = event.getSender().toLowerCase(),
            args = event.getArgs(),
            pActions,
            action,
            actionArgs;

        /**
         * Used by the panel
         */
        if (command.equalsIgnoreCase('reloadyt')) {
            reloadyt();
            return;
        }

        /**
         * @commandpath ytp - Base command to manage YouTube player settings
         * @commandpath musicplayer - Built-in permanent alias to !ytp
         */
        if (command.equalsIgnoreCase('ytp') || command.equalsIgnoreCase('musicplayer')) {
            pActions = ['volume', 'pause'].join(', ');
            action = args[0];
            actionArgs = args.splice(1);

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.usage'));
                return;
            }

            /**
             * @commandpath ytp clearcache now - Clears the cache of YouTube IDs from the database.
             */
            if (action.equalsIgnoreCase('clearcache')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.clearcache.warning'));
                } else {
                    if (actionArgs[0].equalsIgnoreCase('now')) {
                        $.inidb.RemoveFile('ytcache');
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.clearcache.success'));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.clearcache.warning'));
                    }
                }
                return;
            }

            /**
             * @commandpath ytp resetdefaultlist - Resets the default playlist back to the default songs.
             */
            if (action.equalsIgnoreCase('resetdefaultlist')) {
                if (connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.resetdefaultlist.active'));
                    return;
                }
                $.inidb.RemoveFile('ytPlaylist_default');
                createDefaultPl();
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.resetdefaultlist.success'));
                return;
            }

            /**
             * @commandpath ytp togglecconly - Toggle option to only use Creative Commons licensed songs.
             */
            if (action.equalsIgnoreCase('togglecconly')) {
                if ($.getIniDbBoolean('ytSettings', 'playCCOnly')) {
                    playCCOnly = false;
                    $.setIniDbBoolean('ytSettings', 'playCCOnly', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.togglecconly.disable'));
                } else {
                    playCCOnly = true;
                    $.setIniDbBoolean('ytSettings', 'playCCOnly', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.togglecconly.enable'));
                }
                return;
            }

            /**
             * @commandpath ytp togglestealrefund - Toggle refunding users half their points if their song is stolen, use to reward users with songs that are liked
             */
            if (action.equalsIgnoreCase('togglestealrefund')) {
                if ($.getIniDbBoolean('ytSettings', 'stealRefund')) {
                    stealRefund = false;
                    $.setIniDbBoolean('ytSettings', 'stealRefund', false);
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.togglestealrefund.disable'));
                } else {
                    stealRefund = true;
                    $.setIniDbBoolean('ytSettings', 'stealRefund', true);
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.togglestealrefund.enable'));
                }
                return;
            }

            /**
             * @commandpath ytp djname [DJ Name] - Name the DJ for playlists
             */
            if (action.equalsIgnoreCase('djname')) {
                if (actionArgs[0]) {
                    playlistDJname = actionArgs.join(' ');
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.setdjname.success', playlistDJname));
                    $.inidb.set('ytSettings', 'playlistDJname', playlistDJname);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.setdjname.usage'));
                }
            }

            /**
             * @commandpath ytp delrequest [YouTube ID] - Delete a song that has been requested
             */
            if (action.equalsIgnoreCase('delrequest')) {
                if (actionArgs[0]) {
                    var removedSongTitle = currentPlaylist.removeSong(actionArgs[0]);
                    if (removedSongTitle) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.delrequest.success', actionArgs[0], removedSongTitle));
                        connectedPlayerClient.pushSongList();
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.delrequest.404', actionArgs[0]));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.delrequest.usage'));
                }
                return;
            }

            /**
             * @commandpath ytp volume [0-100] - Set volume in player. No value to display current volume.
             * @commandpath ytp volume [0-100] [+/-] - Set volume in player. +/- raises/lowers by 2. No value to display current volume.
             */
            if (action.equalsIgnoreCase('volume')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }

                if (actionArgs[0]) {
                    if (!isNaN(parseInt(actionArgs[0]))) {
                        connectedPlayerClient.setVolume(actionArgs[0]);
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.volume.set', actionArgs[0]));
                        return;
                    }
                    if (actionArgs[0].equals('+')) {
                        connectedPlayerClient.setVolume($.getIniDbNumber('ytSettings', 'volume') + 2);
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.volume.set', $.getIniDbNumber('ytSettings', 'volume')));
                        return;
                    }
                    if (actionArgs[0].equals('-')) {
                        connectedPlayerClient.setVolume($.getIniDbNumber('ytSettings', 'volume') - 2);
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.volume.set', $.getIniDbNumber('ytSettings', 'volume')));
                        return;
                    }
                }
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.volume.get', connectedPlayerClient.getVolume()));
                return;
            }

            /**
             * @commandpath ytp votecount - Set the amount of votes needed for the !skip command to work
             */
            if (action.equalsIgnoreCase('votecount')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }

                if (actionArgs[0] && !isNaN(parseInt(actionArgs[0]))) {
                    if (actionArgs[0] < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.votecount.negative'));
                        return;
                    }
                    $.inidb.set('ytSettings', 'voteCount', actionArgs[0]);
                    voteCount = actionArgs[0];
                    voteArray = [];
                    skipCount = 0;
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.votecount.set', actionArgs[0]));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.votecount.usage', voteCount));
                }
                return;
            }
            /**
             * @commandpath ytp pause - Pause/unpause the player.
             */
            if (action.equalsIgnoreCase('pause')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }
                connectedPlayerClient.togglePause();
                return;
            }

            /**
             * @commandpath ytp togglerandom - Toggle randomizing playlists
             * @commandpath ytp shuffle - Toggle randomizing playlists
             */
            if (action.equalsIgnoreCase('togglerandom') || action.equalsIgnoreCase('shuffle')) {
                randomizePlaylist = !randomizePlaylist;

                $.setIniDbBoolean('ytSettings', 'randomizePlaylist', randomizePlaylist);
                if (currentPlaylist) {
                    currentPlaylist.loadPlaylistKeys();
                }
                if (connectedPlayerClient) {
                    connectedPlayerClient.pushPlayList();
                }

                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.togglerandom.toggled', (randomizePlaylist ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                return;
            }

            /**
             * @commandpath ytp toggleannounce - Toggle announcing now playing in the chat
             * @commandpath ytp togglenotify - Toggle announcing now playing in the chat
             */
            if (action.equalsIgnoreCase('toggleannounce') || action.equalsIgnoreCase('togglenotify')) {
                announceInChat = !announceInChat;
                $.setIniDbBoolean('ytSettings', 'announceInChat', announceInChat);
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.toggleannounce.toggled', (announceInChat ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                return;
            }

            /**
             * @commandpath ytp togglerequests - Toggle song request ability for users below admin.
             * @commandpath ytp togglesr - Toggle song request ability for users below admin.
             */
            if (action.equalsIgnoreCase('togglerequests') || action.equalsIgnoreCase('togglesr')) {
                songRequestsEnabled = !songRequestsEnabled;

                $.setIniDbBoolean('ytSettings', 'songRequestsEnabled', songRequestsEnabled);

                if (songRequestsEnabled) {
                    $.say($.lang.get('ytplayer.songrequests.enabled'));
                } else {
                    $.say($.lang.get('ytplayer.songrequests.disabled'));
                }
                return;
            }

            /**
             * @commandpath ytp setrequestmax [max concurrent requests] - Set the maximum of concurrent songrequests a user can make
             * @commandpath ytp limit [max concurrent requests] - Set the maximum of concurrent songrequests a user can make
             */
            if (action.equalsIgnoreCase('setrequestmax') || action.equalsIgnoreCase('limit')) {
                if (!actionArgs[0] || isNaN(parseInt(actionArgs[0]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.setrequestmax.usage'));
                    return;
                }

                songRequestsMaxParallel = parseInt(actionArgs[0]);
                $.inidb.set('ytSettings', 'songRequestsMaxParallel', songRequestsMaxParallel);
                $.say($.lang.get('ytplayer.command.ytp.setrequestmax.success', songRequestsMaxParallel));
                return;
            }
            
            	            /**/
            
            /**
             * @commandpath songrequest limit [max concurrent requests] - Set the maximum of songrequests a user can make per stream
             */
            if (action.equalsIgnoreCase('limit')) {
                if (!actionArgs[0] || isNaN(parseInt(actionArgs[0]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.setrequestmax.usage'));
                    return;
                }
                songRequestsMaxParallel = parseInt(actionArgs[0]);
                $.inidb.set('ytSettings', 'songRequestsMaxParallel', songRequestsMaxParallel);
                $.say($.lang.get('ytplayer.command.ytp.setrequestmax.success', songRequestsMaxParallel));
                return;
            }
            
            /**/

            /**
             * @commandpath ytp setmaxvidlength [max video length in seconds] - Set the maximum length of a song that may be requested
             * @commandpath ytp maxvideolength [max video length in seconds] - Set the maximum length of a song that may be requested
             */
            if (action.equalsIgnoreCase('setmaxvidlength') || action.equalsIgnoreCase('maxvideolength')) {
                if (!actionArgs[0] || isNaN(parseInt(actionArgs[0]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.ytp.setmaxvidlength.usage'));
                    return;
                }

                songRequestsMaxSecondsforVideo = parseInt(actionArgs[0]);
                $.inidb.set('ytSettings', 'songRequestsMaxSecondsforVideo', songRequestsMaxSecondsforVideo);
                $.say($.lang.get('ytplayer.command.ytp.setmaxvidlength.success', songRequestsMaxSecondsforVideo));
                return;
            }

            /**
             * @commandpath ytp blacklistuser [add / remove] [user] - Blacklist a user from using the songrequest features.
             */
            if (action.equalsIgnoreCase('blacklistuser')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.usage'));
                    return;
                }

                if (args[1].equalsIgnoreCase('add')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.add.usage'));
                        return;
                    }

                    $.inidb.set('ytpBlacklist', args[2].toLowerCase(), 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.add.success', args[2]));
                }

                if (args[1].equalsIgnoreCase('remove')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.usage'));
                        return;
                    }

                    $.inidb.del('ytpBlacklist', args[2].toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.success', args[2]));
                    return;
                }
            }

            /**
             * @commandpath ytp blacklist [add / remove] [name contained in the video] - Blacklist a song name from being requested.
             */
            if (action.equalsIgnoreCase('blacklist')) {
                actionArgs = args.splice(2);
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.usage.song'));
                    return;
                }

                if (args[1].equalsIgnoreCase('add')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.add.usage.song'));
                        return;
                    }

                    $.inidb.set('ytpBlacklistedSong', actionArgs.join(' ').trim().toLowerCase(), 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.add.success.song', actionArgs.join(' ').trim()));
                    return;
                }

                if (args[1].equalsIgnoreCase('remove')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.usage.song'));
                        return;
                    }

                    $.inidb.del('ytpBlacklistedSong', actionArgs.join(' ').trim().toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.success.song', actionArgs.join(' ').trim()));
                    return;
                }
            }
            
            /**
             * @commandpath ytp toggleshuffle - Shuffle the song request queue.
             */
            if (action.equalsIgnoreCase('toggleshuffle')) {
                shuffleQueue = !shuffleQueue;

                $.setIniDbBoolean('ytSettings', 'shuffleQueue', shuffleQueue);

                if (shuffleQueue) {
                    $.say($.lang.get('ytplayer.command.position.shuffle.on'));
                } else {
                    $.say($.lang.get('ytplayer.command.position.shuffle.off'));
                }
                if (connectedPlayerClient) {
                    connectedPlayerClient.pushPlayList();
                }

                return;
            }
        }

        /**
         * @commandpath playlist - Base command: Manage playlists
         */
        if (command.equalsIgnoreCase('playlist')) {
            pActions = ['add', 'delete', 'loadpl', 'deletepl', 'importpl'].join(', ');
            action = args[0];
            actionArgs = args.splice(1);

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.usage', pActions));
                return;
            }

            /**
             * @commandpath playlist add [youtube link | id | search] - Add a song to the current playlist
             */
            if (action.equalsIgnoreCase('add')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }
                if (actionArgs.length > 0) {
                    try {
                        var youtubeVideo = new YoutubeVideo(actionArgs.join(' '), sender);
                    } catch (ex) {
                        $.log.error("YoutubeVideo::exception: " + ex);
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.add.failed', ex));
                        return;
                    }

                    if (currentPlaylist.addToPlaylist(youtubeVideo)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.add.success', youtubeVideo.getVideoTitle(), currentPlaylist.getPlaylistname()));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.add.failed', currentPlaylist.getRequestFailReason()));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.add.usage'));
                }
                loadPanelPlaylist();
                return;
            }

            /**
             * @commandpath playlist delete - Delete the current song from the current playlist
             */
            if (action.equalsIgnoreCase('delete')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }
                currentPlaylist.deleteCurrentVideo();
                return;
            }

            /**
             * @commandpath playlist loadpl [playlist name] - Load playlist by name, calling this command with an unknown playlist will create it for you.
             */
            if (action.equalsIgnoreCase('loadpl')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }
                if (actionArgs.length > 0) {
                    var requestedPlaylist = new BotPlayList(actionArgs[0], true);
                    if (requestedPlaylist.getplaylistLength() == 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.load.success.new', requestedPlaylist.getPlaylistname()));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.load.success', requestedPlaylist.getPlaylistname()));
                    }
                    currentPlaylist.loadNewPlaylist(actionArgs[0]);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.load.usage'));
                }
                loadPanelPlaylist();
                return;
            }


            /**
             * Used by the panel
             */
            if (action.equalsIgnoreCase('playlistloadpanel')) {
                if (actionArgs.length > 0) {
                    var requestedPlaylist = new BotPlayList(actionArgs[0], true);
                    currentPlaylist.loadNewPlaylist(actionArgs[0]);
                    connectedPlayerClient.pushPlayList();
                }
                loadPanelPlaylist();
                return;
            }

            /**
             * @commandpath playlist listpl - List the playlists
             */
            if (action.equalsIgnoreCase('listpl')) {
                var playlistsList = $.inidb.GetKeyList('yt_playlists_registry', '');

                if (playlistsList) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.listpl', playlistsList.join(', ').replace(/ytPlaylist_/g, '')));
                }
            }

            /**
             * @commandpath playlist deletepl [playlist name] - Delete a playlist by name
             */
            if (action.equalsIgnoreCase('deletepl')) {
                if (!currentPlaylist) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                }
                if (actionArgs.length > 0) {
                    if (actionArgs[0].equalsIgnoreCase('default')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.delete.isdefault'));
                        return;
                    }
                    if (currentPlaylist.deletePlaylist(actionArgs[0])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.delete.success', actionArgs[0]));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.delete.404', actionArgs[0]));
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.delete.usage'));
                }
                loadPanelPlaylist();
                return;
            }

            /**
             * @commandpath playlist importpl file [playlist name] [file] - Creates/overwrites playlist with new list generated from ./addons/youtubePlayer/file. File may contain links, descriptions, or YouTube IDs
             */
            if (action.equalsIgnoreCase('importpl')) {
                if (actionArgs.length == 3) {
                    if (actionArgs[0].equalsIgnoreCase('file')) {
                        var importPlaylist = new BotPlayList(actionArgs[1], false);
                        $.say($.whisperPrefix(sender) + importPlaylist.importPlaylistFile(actionArgs[1], actionArgs[2], sender));
                        return;
                    }
                }
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.importpl.file.usage'));
            }
            loadPanelPlaylist();
            return;
        }

        // Skip all following commands, since they all need the client to be connected
        // (a.k.a. they need a current song to be active)
        if (connectedPlayerClient == null) {
            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
            return;
        }

        /**
         * @commandpath stealsong [playlist name] - Add the currently playing song to the current playlist or a given playlist
         */
        if (command.equalsIgnoreCase('stealsong')) {
            var refundUser = '',
                responseString;

            if (args.length == 0) {
                if (currentPlaylist.addToPlaylist(currentPlaylist.getCurrentVideo()) == -2) {
                    $.say($.lang.get('ytplayer.command.stealsong.duplicate'));
                    return;
                }
                refundUser = currentPlaylist.getCurrentVideo().getOwner().toLowerCase();
                responseString = $.lang.get('ytplayer.command.stealsong.this.success', $.username.resolve(sender));
            } else if ($.inidb.FileExists(playlistDbPrefix + args[0].toLowerCase())) {
                if (currentPlaylist.addToPlaylist(currentPlaylist.getCurrentVideo(), args[0].toLowerCase()) == -2) {
                    $.say($.lang.get('ytplayer.command.stealsong.duplicate'));
                    return;
                }
                refundUser = currentPlaylist.getCurrentVideo().getOwner().toLowerCase();
                responseString = $.lang.get('ytplayer.command.stealsong.other.success', $.username.resolve(sender), args[0]);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.playlist.404', args[0]));
                return;
            }

            if (stealRefund) {
                if (!$.isBot(refundUser) && !playlistDJname.equalsIgnoreCase(refundUser)) {
                    if ($.inidb.exists('pricecom', 'songrequest') || $.inidb.exists('pricecom', 'addsong')) {
                        var isMod = $.isMod(refundUser);
                        if ((((isMod && $.getIniDbBoolean('settings', 'pricecomMods', false) && !$.isBot(sender)) || !isMod))) {
                            var refund = $.inidb.get('pricecom', 'songrequest');
                            if (refund == 0) {
                                refund = $.inidb.get('pricecom', 'addsong');
                            }
                            refund = parseInt(refund / 2);
                            if (refund > 0) {
                                $.inidb.incr('points', refundUser, parseInt(refund))
                                responseString = responseString + ' ' + $.lang.get('ytplayer.command.stealsong.refund', $.username.resolve(refundUser), refund, (refund == 1 ? $.pointNameSingle : $.pointNameMultiple));
                            }
                        }
                    }
                }
            }
            $.say(responseString);
        }

        /**
         * @commandpath jumptosong [position in playlist] - Jump to a song in the current playlist by position in playlist.
         * @commandpath playsong [position in playlist] - Jump to a song in the current playlist by position in playlist.
         */
        if (command.equalsIgnoreCase('jumptosong') || command.equalsIgnoreCase('playsong')) {
            if (args[0] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.jumptosong.usage', command.toLowerCase()));
                return;
            }

            if (!currentPlaylist.jumpToSong(args[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.jumptosong.failed', args[0]));
            }
        }

        /**
         * @commandpath findsong [search string] - Finds a song based on a search string.
         */
        if (command.equalsIgnoreCase('findsong')) {
            if (args[0] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.findsong.usage', command.toLowerCase()));
                return;
            }

            if (!currentPlaylist.findSongByTitle(args.join(' '))) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.findsong.failed', args.join(' ')));
            }
        }

        /**
         * @commandpath skipsong - Skip the current song and proceed to the next video in line
         */
        if (command.equalsIgnoreCase('skipsong')) {
            var username = $.username.resolve(sender, event.getTags()),
                check = voteArray.indexOf(username),
                action = args[0];

            if (!action) {
                if ($.systemTime() - lastSkipTime > 1000) {
                    lastSkipTime = $.systemTime + 10000; // Make sure that no one can skip while we wait to reset the value.
                    currentPlaylist.nextVideo();
                    connectedPlayerClient.pushSongList();
                    lastSkipTime = $.systemTime();
                    return;
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.skip.delay'));
                    return;
                }
            } else {

                /**
                 * @commandpath skipsong vote - allow viewers to vote to skip a song
                 */
                if (action.equalsIgnoreCase('vote')) {
                    if (voteCount == 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.skip.disabled'));
                        return;
                    }

                    if (check != -1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.skip.failure'));
                        return;
                    }

                    skipCount = skipCount + 1;
                    if (skipCount == voteCount) {
                        $.say($.lang.get('ytplayer.command.skip.skipping'));
                        currentPlaylist.nextVideo();
                        connectedPlayerClient.pushSongList();
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.skip.success', voteCount - skipCount));
                    voteArray.push(username);
                    return;
                }
            }
        }


        /****** Song Requests Added Here ******/
        /**
         * @commandpath songrequest [YouTube ID | YouTube link | search string] - Request a song!
         */
        if (command.equalsIgnoreCase('songrequest') || command.equalsIgnoreCase('addsong')) {
            if ($.getIniDbBoolean('ytpBlacklist', sender, false)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklisted'));
                return;
            }

            if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.songrequest.usage'));
                $.returnCommandCost(sender, command, $.isModv3(sender, event.getTags()));
                return;
            }

            var request = currentPlaylist.requestSong(event.getArguments(), sender);
            if (request != null) {
                var i;
                var queueLengthInSeconds = 0;
                var req;
                var playTime; 
                
                if (!shuffleQueue) {
                    if (currentPlaylist.getRequestsCount() == 1) {
                        playTime = "next!";
                    } else {
                        for (i = 0; i < currentPlaylist.getRequestsCount()-1; i++) {
                            req = currentPlaylist.getRequestAtIndex(i);
                            queueLengthInSeconds = queueLengthInSeconds + parseInt(req.getVideoLength(), 10);
                        }

                        playTime = "in " + secondsToTimestamp(queueLengthInSeconds);
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.songrequest.success', request.getVideoTitle(), currentPlaylist.getRequestsCount(), playTime));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.songrequest.success.shuffle', request.getVideoTitle()));
                }
                
                connectedPlayerClient.pushSongList();
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.songrequest.failed', currentPlaylist.getRequestFailReason()));
            }
        }

        /**
         * @commandpath wrongsong - Removes the last requested song from the user
         * @commandpath wrongsong user [username] - Removes the last requested song from a specific user
         */
        if (command.equalsIgnoreCase('wrongsong')) {
            if (args.length == 0) {
                var songTitle = currentPlaylist.removeUserSong(sender);
                if (songTitle) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.success', songTitle));
                    connectedPlayerClient.pushSongList();
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.404'));
                }
            } else {
                if (args[0].equalsIgnoreCase('user')) {
                    if (args[1]) {
                        var songTitle = currentPlaylist.removeUserSong(args[1].toLowerCase());
                        if (songTitle) {
                            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.user.success', args[1], songTitle));
                            connectedPlayerClient.pushSongList();
                        } else {
                            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.404'));
                        }
                    }
                } else if (args[0].equalsIgnoreCase('position')) {
                    if (args[1]) {
                        var songTitle = currentPlaylist.removeSongIndex(args[1]);
                        if (songTitle) {
                            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.index.success', args[1], songTitle));
                            connectedPlayerClient.pushSongList();
                        } else {
                            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.404'));
                        }
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.wrongsong.usage'));
                }
            }
        }

        /**
         * @commandpath previoussong - Announce the previous played song in the chat
         */
        if (command.equalsIgnoreCase('previoussong')) {
            if (currentPlaylist.getPreviousVideo()) {
                $.say($.userPrefix(sender, true) + $.lang.get('ytplayer.command.previoussong', currentPlaylist.getPreviousVideo().getVideoTitle(), currentPlaylist.getPreviousVideo().getOwner(), currentPlaylist.getPreviousVideo().getVideoLink()));
            } else {
                $.say($.lang.get('ytplayer.command.previoussong.404'));
            }
        }

        /**
         * @commandpath currentsong - Announce the currently playing song in the chat
         */
        if (command.equalsIgnoreCase('currentsong')) {
            $.say($.userPrefix(sender, true) + $.lang.get('ytplayer.command.currentsong', currentPlaylist.getCurrentVideo().getVideoTitle(), currentPlaylist.getCurrentVideo().getOwner(), currentPlaylist.getCurrentVideo().getVideoLink()));
        }

        /**
         * @commandpath nextsong - Display the next song in the request queue
         * @commandpath nextsong [index number] - Display the full song title at the index.
         * @commandpath nextsong next [n] - Display the next n songs in queue, max of 5
         * @commandpath nextsong list [x-y] - Display songs in queue from the range, max of 5
         */
        if (command.equalsIgnoreCase('nextsong')) {
            var minRange,
                maxRange,
                showRange;

            if (!args[0]) {
                if (currentPlaylist.getRequestAtIndex(0) == null) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.404'));
                    return;
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.single', currentPlaylist.getRequestAtIndex(0).getVideoTitle()));
                    return;
                }
            } else {
                if (!isNaN(args[0])) {
                    if (currentPlaylist.getRequestAtIndex(parseInt(args[0])) == null) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.404'));
                        return;
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.single', '#' + args[0] + ': ' + currentPlaylist.getRequestAtIndex(parseInt(args[0])).getVideoTitle()));
                        return;
                    }
                } else if (args[0].equalsIgnoreCase('next')) {
                    if (!args[1]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.usage'));
                        return;
                    }
                    if (isNaN(args[1])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.usage'));
                        return;
                    }
                    minRange = 1;
                    maxRange = parseInt(args[1]);
                } else if (args[0].equalsIgnoreCase('list')) {
                    if (!args[1]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.usage'));
                        return;
                    }
                    if (args[1].match(/\d+\-\d+/)) {
                        minRange = parseInt(args[1].match(/(\d+)\-\d+/)[1]);
                        maxRange = parseInt(args[1].match(/\d+\-(\d+)/)[1]);
                        if (maxRange - minRange > 5) {
                            maxRange = minRange + 5;
                        }
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.usage'));
                        return;
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.usage'));
                    return;
                }

                var displayString = '';
                minRange = minRange - 1;
                while (minRange <= maxRange) {
                    showRange = minRange + 1;
                    if (currentPlaylist.getRequestAtIndex(minRange) == null) {
                        break;
                    }
                    displayString += "[(#" + showRange + ") " + currentPlaylist.getRequestAtIndex(minRange).getVideoTitle().substr(0, 20) + "] ";
                    minRange++;
                }
                if (displayString.equals('')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.range.404'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.range', displayString));
                }
            }
        }
        
        /**
         * @commandpath songcount
         */
        if (command.equalsIgnoreCase('songcount')) {
            var count = $.inidb.get("songcounts", "totalsongs");
            
            if (count === null) {
                count = 0;
            }
            
            $.say($.lang.get('ytplayer.command.songcount', count));
        }
        
        /**
         * @commandpath songcount
         */
        if (command.equalsIgnoreCase('requests')) {
            var count = $.inidb.get("songcounts", sender + "-request-counts");
            
            if (count === null) {
                count = 0;
            }
            $.say($.lang.get('ytplayer.command.requestcount', sender, count));
        }
        
        /**
         * @commandpath queuelimit [off|max concurrent requests] - Set the maximum number of requests a user can
         * have in the queue at one time
         */
        if (command.equalsIgnoreCase('queuelimit')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.queuelimit.usage'));
                return;
            }
            
            if (isNaN(parseInt(args[0])) && !args[0].equalsIgnoreCase('off')){
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.queuelimit.usage'));
                return;
            }
            
            var message;
            if (args[0].equalsIgnoreCase('off')) {
                songRequestsMaxParallel = 999;
                message = $.lang.get('ytplayer.command.queuelimit.success.off');
            } else {
                songRequestsMaxParallel = parseInt(args[0]);
                message = $.lang.get('ytplayer.command.queuelimit.success', songRequestsMaxParallel);
            }
            $.inidb.set('ytSettings', 'songRequestsMaxParallel', songRequestsMaxParallel);
            $.say(message);
            return;
        }
        
        /**
         * @commandpath requestlimit [off|max requests] - Set the maximum number of requests a user can have per stream
         */
        if (command.equalsIgnoreCase('requestlimit')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.requestlimit.usage'));
                return;
            }
            
            if (isNaN(parseInt(args[0])) && !args[0].equalsIgnoreCase('off')){
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.requestlimit.usage'));
                return;
            }
            
            var message;
            if (args[0].equalsIgnoreCase('off')) {
                songRequestsMaxLimit = 999;
                message = $.lang.get('ytplayer.command.requestlimit.success.off');
            } else {
                songRequestsMaxLimit = parseInt(args[0]);
                message = $.lang.get('ytplayer.command.requestlimit.success', songRequestsMaxLimit);
            }
            $.inidb.set('ytSettings', 'songRequestsMaxLimit', songRequestsMaxLimit);
            $.say(message);
            return;
        }
        
        if (command.equalsIgnoreCase('length')) {
            var minutes = Math.floor(songRequestsMaxSecondsforVideo / 60);
            var seconds = songRequestsMaxSecondsforVideo - minutes * 60;
            
            if (seconds === 0) {
                seconds = "00";
            }
            $.say($.lang.get('ytplayer.command.requestlimit.length', minutes + ":" + seconds));
        }
        
        if (command.equalsIgnoreCase('shuffle')) {
            if (shuffleQueue) {
                var requests = currentPlaylist.getRequestList();
                var numberOfRequests = currentPlaylist.getRequestsCount();

                if (numberOfRequests == 0) {
                   $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                }
                
                var request = getRandomRequest();

                currentPlaylist.removeUserSong(request.getOwner());
                currentPlaylist.addToQueue(request, 0);
                connectedPlayerClient.pushSongList();
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.shuffle.disabled'));
            }
        }
        
        if (command.equalsIgnoreCase('position')) {
            if(shuffleQueue) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.shuffle'));
                return;
            }
            
            var requests = currentPlaylist.getRequestList();
            
            var message;
            if (requests.length != 0) {
                var i;
                var request;
                var timeToPlayInSeconds = 0;
                for (i = 0; i < requests.length; i++) {
                    request = requests[i];
                    
                    if (request.getOwner() == sender) {
                        var playTime;
                        if (i == 0) {
                            playTime = "next";
                        } else {
                            playTime = "in about  " + secondsToTimestamp(timeToPlayInSeconds);
                        }
                        
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.success', (i+1), playTime));
                        return;
                    } else {
                        timeToPlayInSeconds = timeToPlayInSeconds + parseInt(request.getVideoLength(), 10);
                    }
                }
                
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.none'));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
            }
        }
        
        if (command.equalsIgnoreCase('queuesize')) {
            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.queue.size', currentPlaylist.getRequestsCount()));
        }
        
        if (command.equalsIgnoreCase('edit')) {
            if (!songRequestsEnabled) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.edit.closed'));
                return;
            }            
            
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.edit.usage'));
                return;
            }
            
            var requestsList = currentPlaylist.getRequestList();
 
            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }
            
            var i, requestFound = false;
            var existingRequest;
            for (i = 0; i < requestsList.length; i++) {
                existingRequest = requestsList[i];

                if (existingRequest.getOwner() == sender) {
                    requestFound = true;
                    break;
                }
            }
            
            if (!requestFound) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.none'));
                return;
            }
                         
            // Find the new song
            var newRequest;
            try {
                newRequest = new YoutubeVideo(args[0], sender);
            } catch (ex) {
                requestFailReason = $.lang.get('ytplayer.requestsong.error.yterror', ex);
                $.log.error("YoutubeVideo::exception: " + ex);
                return;
            }

            // Make sure new request follows rules
            if (currentPlaylist.videoExistsInRequests(newRequest)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.requestsong.error.exists'));
                return;
            }

            if (currentPlaylist.videoLengthExceedsMax(newRequest)) {
                var minutes = Math.floor(songRequestsMaxSecondsforVideo / 60);
                var seconds = songRequestsMaxSecondsforVideo - minutes * 60;

                if (seconds === 0) {
                    seconds = "00";
                }
                requestFailReason = $.lang.get('ytplayer.requestsong.error.maxlength', newRequest.getVideoLengthMMSS(), minutes + ":" + seconds);
                
                $.say($.whisperPrefix(sender) + requestFailReason);
                return;
            }

            var keys = $.inidb.GetKeyList('ytpBlacklistedSong', '');
            for (var i in keys) {
                if (newRequest.getVideoTitle().toLowerCase().includes(keys[i])) {
                    requestFailReason = $.lang.get('ytplayer.blacklist.404');
                    
                    $.say($.whisperPrefix(sender) + requestFailReason);
                    return;
                }
            }
            
            currentPlaylist.removeUserSong(sender);
            currentPlaylist.addToQueue(newRequest, i);
            connectedPlayerClient.pushSongList();
            $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.edit.success', newRequest.getVideoTitle()));
        }
        
        if (command.equalsIgnoreCase('promote')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.bump.usage'));
                return;
            }

            var bumper = args[0];
            var requestsList = currentPlaylist.getRequestList();

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var i, requestFound = false;
            var existingRequest;
            for (i = 0; i < requestsList.length; i++) {
                existingRequest = requestsList[i];

                if (existingRequest.getOwner().equalsIgnoreCase(bumper)) {
                    requestFound = true;
                    break;
                }
            }

            if (requestFound) {
                currentPlaylist.removeUserSong(bumper);
                currentPlaylist.addToQueue(existingRequest, 0);
                connectedPlayerClient.pushSongList();
                $.say($.whisperPrefix(bumper) + $.lang.get('ytplayer.command.bump.success'));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.move.none', bumper));
            }
        }
        
        if (command.equalsIgnoreCase('move')) {
            if (!args[1]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.move.usage'));
                return;
            }
          
            var requester = args[0];
            var newPosition = args[1];
            
            if (newPosition > currentPlaylist.getRequestsCount()) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.move.error.length', currentPlaylist.getRequestsCount()));  
                return;
            }

            var newQueuePosition = newPosition - 1;

            var requestsList = currentPlaylist.getRequestList();

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var i, requestFound = false;
            var existingRequest;
            for (i = 0; i < requestsList.length; i++) {
                existingRequest = requestsList[i];

                if (existingRequest.getOwner().equalsIgnoreCase(requester)) {
                    requestFound = true;
                    break;
                }
            }

            if (requestFound) {
                currentPlaylist.removeUserSong(requester);
                currentPlaylist.addToQueue(existingRequest, newQueuePosition);
                connectedPlayerClient.pushSongList();
                
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.move.success', requester, newPosition));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.move.none', requester));
                return;
            }
        }
    });
    
    function secondsToTimestamp(timeInSeconds) {
        // multiply by 1000 because Date() requires miliseconds
        var date = new Date(timeInSeconds * 1000);
        
        var hh = 0;
        if (timeInSeconds > 3600) {
            hh = date.getUTCHours();
        }
        var mm = date.getUTCMinutes();
        var ss = date.getSeconds();
        
        // If you were building a timestamp instead of a duration, you would uncomment the following line to get 12-hour (not 24) time
        // if (hh > 12) {hh = hh % 12;}
        // These lines ensure you have two-digits
        if (hh < 10) {hh = "0"+hh;}
        if (mm < 10) {mm = "0"+mm;}
        if (ss < 10) {ss = "0"+ss;}
        // This formats your string to HH:MM:SS
        return trimZerosFromTime(hh+":"+mm+":"+ss); 
    }
    
    function trimZerosFromTime(time) {
        if (time.startsWith('0') || time.startsWith(':')) {
            return trimZerosFromTime(time.substring(1, time.length));
        }
        
        return time;
    }
    
    function getRandomRequest() {
        var requests = currentPlaylist.getRequestList();
        var numberOfRequests = currentPlaylist.getRequestsCount();

        if (numberOfRequests == 0) {
           $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
        }

        var random = Math.floor(Math.random() * (+numberOfRequests - +0)) + +0; 
        var request = currentPlaylist.getRequestAtIndex(random);
         
        var recentUsers = currentPlaylist.getPreviousRequesters();
        var i;
        
        var history = recentUsers.toArray();
        for (i = 0; i < history.length; i++) {
            if (request.getOwner().equalsIgnoreCase(history[i])) {
                return getRandomRequest();
            }
        }
        
        $.say($.lang.get('ytplayer.command.shuffle', (random + 1), request.getVideoTitle(), request.getOwner()));
        return request;
    }

    $.bind('initReady', function() {
        $.registerChatCommand('./systems/youtubePlayer.js', 'ytp', 2);
        $.registerChatCommand('./systems/youtubePlayer.js', 'musicplayer', 2);
        $.registerChatCommand('./systems/youtubePlayer.js', 'playlist', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'stealsong', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'jumptosong', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'findsong', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'playsong', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'skipsong', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'reloadyt', 1);
        $.registerChatCommand('./systems/youtubePlayer.js', 'songrequest');
        $.registerChatCommand('./systems/youtubePlayer.js', 'addsong');
        $.registerChatCommand('./systems/youtubePlayer.js', 'previoussong');
        $.registerChatCommand('./systems/youtubePlayer.js', 'currentsong');
        $.registerChatCommand('./systems/youtubePlayer.js', 'wrongsong');
        $.registerChatCommand('./systems/youtubePlayer.js', 'nextsong');

        $.registerChatSubcommand('skipsong', 'vote', 7);
        $.registerChatSubcommand('wrongsong', 'user', 2);
        $.registerChatSubcommand('wrongsong', 'position', 2);
        
        // Custom Commands
        $.registerChatCommand('./systems/youtubePlayer.js', 'songcount');
        $.registerChatCommand('./systems/youtubePlayer.js', 'requests');
        $.registerChatCommand('./systems/youtubePlayer.js', 'queuelimit', 2);
        $.registerChatCommand('./systems/youtubePlayer.js', 'requestlimit', 2);
        $.registerChatCommand('./systems/youtubePlayer.js', 'length');
        $.registerChatCommand('./systems/youtubePlayer.js', "shuffle", 2);
        $.registerChatCommand('./systems/youtubePlayer.js', "position");
        $.registerChatCommand('./systems/youtubePlayer.js', "queuesize");
        $.registerChatCommand('./systems/youtubePlayer.js', "edit");
        $.registerChatCommand('./systems/youtubePlayer.js', "promote", 2);
        $.registerChatCommand('./systems/youtubePlayer.js', "move", 2);

        loadPanelPlaylist();
        loadDefaultPl();
        
        // Initialize song counter
        $.inidb.set("songcounts", "totalsongs", 0);
        
        // Initialize user request played counter
        $.inidb.RemoveFile("songcounts");
    });
})();

