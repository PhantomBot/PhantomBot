/**
 * youtubePlayer.js
 *
 * This is version 2 of the youtube player.
 *
 */
(function() {
    var playlistDbPrefix = 'ytPlaylist_',
        randomizePlaylist = $.getSetIniDbBoolean('ytSettings', 'randomizePlaylist', false),
        announceInChat = $.getSetIniDbBoolean('ytSettings', 'announceInChat', false),
        activePlaylistname = $.getSetIniDbString('ytSettings', 'activePlaylistname', 'default'),
        baseFileOutputPath = $.getSetIniDbString('ytSettings', 'baseFileOutputPath', './addons/youtubePlayer/'),
        songRequestsEnabled = $.getSetIniDbBoolean('ytSettings', 'songRequestsEnabled', true),
        songRequestsMaxParallel = $.getSetIniDbNumber('ytSettings', 'songRequestsMaxParallel', 1),
        songRequestsMaxSecondsforVideo = $.getSetIniDbNumber('ytSettings', 'songRequestsMaxSecondsforVideo', (8 * 60)),
        voteCount = $.getSetIniDbNumber('ytSettings', 'voteCount', 0),
        voteArray = [],
        skipCount,
        playlistDJname = $.getSetIniDbString('ytSettings', 'playlistDJname', $.botName);

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
        songRequestsMaxSecondsforVideo = $.getIniDbNumber('ytSettings', 'songRequestsMaxSecondsforVideo');
        playlistDJname = $.getIniDbString('ytSettings', 'playlistDJname');
        announceInChat = $.getIniDbBoolean('ytSettings', 'announceInChat');
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
            videoLength = -1;

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
            if (videoLength != -1) {
                return videoLength;
            }

            var lengthData = $.youtube.GetVideoLength(videoId);

            if (lengthData[0] == 123 && lengthData[1] == 456 && lengthData[2] === 7899) {
                throw 'Live Stream Detected';
            }

            while (lengthData[0] == 0 && lengthData[1] == 0 && lengthData[2] == 0) {
                lengthData = $.youtube.GetVideoLength(videoId);
            }
            if (lengthData[0] == 0 && lengthData[1] == 0 && lengthData[2] == 0) {
                return 0;
            }
            videoLength = lengthData[2];
            return lengthData[2];
        };

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

        if (!owner.equals(playlistDJname)) {
            owner = owner.toLowerCase();
        }

        if ($.inidb.exists('ytcache', searchQuery)) {
            var jsonString = $.inidb.get('ytcache', searchQuery);
            var jsonData = JSON.parse(jsonString);
            videoId = jsonData["id"];
            videoTitle = jsonData["title"];
            videoLength = jsonData["time"];
        } else {
            var data = null;
            do {
                data = $.youtube.SearchForVideo(searchQuery);
            } while (data[0].length() < 11 && data[1] != "No Search Results Found");

            videoId = data[0];
            videoTitle = data[1];

            if (videoTitle.equalsIgnoreCase('video marked private') || videoTitle.equalsIgnoreCase('no search results found')) {
                throw videoTitle;
            }

            this.getVideoLength();
            var jsonData = {};
            jsonData["id"] = videoId+'';
            jsonData["title"] = videoTitle+'';
            jsonData["time"] = videoLength;
            var jsonString = JSON.stringify(jsonData);
            $.inidb.set('ytcache', videoId, jsonString);
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
            defaultPlaylist = [],          // @type { Integer[] }
            defaultPlaylistReadOnly = [],  // @type { Integer[] }
            requests = [],                 // @type { YoutubeVideo[] }
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
                failCount = 0;

            if ($.inidb.exists('yt_playlists_registry', 'ytPlaylist_' + listName)) {
                if ($.fileExists("./addons/youtubePlayer/" + fileName)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.importpl.file.start'));
                    importedList = readFile("./addons/youtubePlayer/" + fileName);
                    for (var i = 0; i < importedList.length; i++) {
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

                    return $.lang.get('ytplayer.command.importpl.file.success', importCount, failCount, fileName, listName);
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
                return -1;
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
            return requests;
        }

        /**
         * @function getRequestAtIndex
         * @returns {YoutubeVideo}
         */
        this.getRequestAtIndex = function(index) {
            if (index > requests.length) {
                return null;
            }
            return requests[index];
        }

        /**
         * @function getRequestsCount
         * @returns {Number}
         */
        this.getRequestsCount = function() {
            return requests.length;
        };

        /**
         * @function jumpToSong
         * @param playlistPosition
         * @return {boolean}
         */
        this.jumpToSong = function(playlistPosition) {
            if ($.inidb.exists(playListDbId, playlistPosition)) {
                previousVideo = currentVideo;
                try {
                    currentVideo = new YoutubeVideo($.inidb.get(playListDbId, playlistPosition), $.ownerName);
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                    return false;
                }
                connectedPlayerClient.play(currentVideo);
                return true;
            } else {
                return false;
            }
        };

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

            previousVideo = currentVideo;

            if (requests.length > 0) {
                currentVideo = requests.shift();
            } else {
                if (defaultPlaylist.length == 0) {
                    if (this.loadPlaylistKeys() == 0) {
                        return null;
                    }
                }

                try {
                    var playListIndex = defaultPlaylist.shift();                    
                    currentVideo = new YoutubeVideo($.inidb.get(playListDbId, playListIndex), playlistDJname);
                } catch (ex) {
                    $.log.error("YoutubeVideo::exception: " + ex);
                    this.nextVideo();
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
        this.preparePlaylist = function() {
            $.inidb.set('ytSettings', 'activePlaylistname', 'default');
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
                newRequests = [],
                i;

            for (i in requests) {
                if (requests[i].getVideoId().equals(youTubeID)) {
                    songTitle = requests[i].getVideoTitle();
                } else {
                    newRequests.push(requests[i]);
                }
            }
            requests = newRequests;
            return songTitle;
        };

        /**
         * @function removeUserSong
         * @param {String} 
         * @return {String}
         */
        this.removeUserSong = function(username) {
            var songTitle = null,
                newRequests = [],
                i;

            for (i = requests.length - 1; i >= 0; i--) {
                if (requests[i].getOwner().equals(username) && songTitle == null) {
                    songTitle = requests[i].getVideoTitle();
                } else {
                    newRequests.push(requests[i]);
                }
            }
            requests = newRequests;
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
            if (!$.isAdmin(requestOwner) && (!songRequestsEnabled || this.senderReachedRequestMax(requestOwner))) {
                if (this.senderReachedRequestMax(requestOwner)) {
                    requestFailReason = $.lang.get('ytplayer.requestsong.error.maxrequests');
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
                requestFailReason = $.lang.get('ytplayer.requestsong.error.maxlength', youtubeVideo.getVideoLengthMMSS());
                return null;
            }

            for (var i in keys) {
                if (youtubeVideo.getVideoTitle().toLowerCase().includes(keys[i])) {
                    requestFailReason = $.lang.get('ytplayer.blacklist.404');
                    return null;
                }
            }

            requests.push(youtubeVideo);
            var playerState = connectedPlayerClient.checkState();
            if (playerState == playerStateEnum.UNSTARTED || playerState == playerStateEnum.ENDED) {
                this.nextVideo();
            }
            return youtubeVideo;
        };

        /**
         * @function senderReachedRequestMax
         * @param {string} sender
         * @returns {boolean}
         */
        this.senderReachedRequestMax = function(sender) {
            var currentRequestCount = 0,
                i;

            sender = sender.toLowerCase();

            for (i in requests) {
                if (requests[i].getOwner() == sender) {
                    ++currentRequestCount;
                }
            }
            if ($.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
                return (currentRequestCount >= songRequestsMaxParallel + $.getTierData(sender, 'songrequests'));
            } else {
                return (currentRequestCount >= songRequestsMaxParallel);
            }
        };

        /**
         * @function updateCurrentSongFile
         * @param {YoutubeVideo} youtubeVideo
         */
        this.updateCurrentSongFile = function(youtubeVideo) {
            $.writeToFile(
                youtubeVideo.getVideoTitle(),
                baseFileOutputPath + 'currentSong.txt',
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
            var i;

            for (i in requests) {
                if (requests[i].getVideoId() == youtubeVideo.getVideoId()) {
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

        this.preparePlaylist();
        if (loadDefault) {
            this.loadPlaylistKeys();
        }

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
                "requester" : currentPlaylist.getCurrentVideo().getOwner() + '',
                "song" : currentPlaylist.getCurrentVideo().getVideoId() + '',
                "title" : currentPlaylist.getCurrentVideo().getVideoTitle() + '',
                "duration" : currentPlaylist.getCurrentVideo().getVideoLengthMMSS() + ''
            };
            client.currentSong(JSON.stringify(jsonData));
        }

        /**
         * @function pushPlayList
         */
        this.pushPlayList = function() {
            var jsonList = {},
                playList = [],
                youtubeObject,
                i;

            if (currentPlaylist) {

                jsonList['playlistname'] = currentPlaylist.getPlaylistname()+'';
                jsonList['playlist'] = [];
                playList = currentPlaylist.getReadOnlyPlaylistData();

                for (i = 0; i < playList.length; i++) {
                    youtubeObject = new YoutubeVideo($.inidb.get(currentPlaylist.getplayListDbId(), playList[i]), $.botName);
                    jsonList['playlist'].push({
                        "song": youtubeObject.getVideoId() + '',
                        "title": youtubeObject.getVideoTitle() + '',
                        "duration": youtubeObject.getVideoLengthMMSS() + ''
                    });
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
            client.play(youtubeVideo.getVideoId(), youtubeVideo.getVideoTitle(), youtubeVideo.getVideoLengthMMSS(), youtubeVideo.getOwner());
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
        var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus,
            CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;

        EventBus.instance().post(new CommandEvent($.botName, 'ytp', 'togglerandom'));
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
        var youTubeID = event.getYouTubeID()+'';
        if (youTubeID.length > 1) {
            currentPlaylist.addToPlaylist(new YoutubeVideo(youTubeID, $.ownerName));
        } else {
            currentPlaylist.addToPlaylist(currentPlaylist.getCurrentVideo());
        }
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
                    if (songRequestsEnabled) {
                        $.say($.lang.get('ytplayer.songrequests.enabled'));
                    }
                }
            }
        }

        if (state == playerStateEnum.ENDED) {
            if (currentPlaylist) {
                currentPlaylist.nextVideo();
            }
        }
    });

    /**
     * @event yTPlayerConnect
     */
    $.bind('yTPlayerConnect', function(event) {
        connectedPlayerClient = new PlayerClientInterface();

        $.consoleLn($.lang.get('ytplayer.console.client.connected'));
        connectedPlayerClient.pushPlayList();
        $.youtubePlayerConnected = true;
    });

    /**
     * @event yTPlayerDisconnect
     */
    $.bind('yTPlayerDisconnect', function(event) {
        connectedPlayerClient = null;

        $.consoleLn($.lang.get('ytplayer.console.client.disconnected'));
        if (!songRequestsEnabled) {
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
             */
            if (action.equalsIgnoreCase('volume')) {
                if (!connectedPlayerClient) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
                    return;
                } 
                if (actionArgs[0] && !isNaN(parseInt(actionArgs[0]))) {
                    connectedPlayerClient.setVolume(actionArgs[0]);
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.volume.set', actionArgs[0]));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.volume.get', connectedPlayerClient.getVolume()));
                }
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

                $.say($.whisperPrefix(sender) + $.lang.get(
                    'ytplayer.command.ytp.togglerandom.toggled', (randomizePlaylist ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))
                ));
                return;
            }

            /**
             * @commandpath ytp toggleannounce - Toggle announcing now playing in the chat
             * @commandpath ytp togglenotify - Toggle announcing now playing in the chat
             */
            if (action.equalsIgnoreCase('toggleannounce') || action.equalsIgnoreCase('togglenotify')) {
                announceInChat = !announceInChat;

                $.setIniDbBoolean('ytSettings', 'announceInChat', announceInChat);

                $.say($.whisperPrefix(sender) + $.lang.get(
                    'ytplayer.command.ytp.toggleannounce.toggled', (announceInChat ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))
                ));
                return;
            }

            /**
             * @commandpath ytp togglerequests - Toggle announcing now playing in the chat
             * @commandpath ytp togglesr - Toggle announcing now playing in the chat
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
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.usage.song'));
                    return;
                }

                if (args[1].equalsIgnoreCase('add')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.add.usage.song'));
                        return;
                    }

                    $.inidb.set('ytpBlacklistedSong', args[2].toLowerCase(), 'true');
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.add.success.song', args[2]));
                    return;
                }

                if (args[1].equalsIgnoreCase('remove')) {
                    if (!args[2]) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.usage.song'));
                        return;
                    }

                    $.inidb.del('ytpBlacklistedSong', args[2].toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.blacklist.remove.success.song', args[2]));
                    return;
                }
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
                        $.say($.whisperPrefix(sender) + $.lang.get(
                            'ytplayer.command.playlist.add.success',
                            youtubeVideo.getVideoTitle(),
                            currentPlaylist.getPlaylistname()
                        ));
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
                    connectedPlayerClient.pushPlayList();
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
                    if (requestedPlaylist.getplaylistLength() == 0) {
                        //$.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.load.success.new', requestedPlaylist.getPlaylistname()));
                    } else {
                        //$.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.load.success', requestedPlaylist.getPlaylistname()));
                    }
                    currentPlaylist.loadNewPlaylist(actionArgs[0]);
                    connectedPlayerClient.pushPlayList();
                } else {
                    //$.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.playlist.load.usage'));
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
            if (args.length == 0) {
                currentPlaylist.addToPlaylist(currentPlaylist.getCurrentVideo());

                $.say($.lang.get(
                    'ytplayer.command.stealsong.this.success',
                    $.username.resolve(sender)
                ));
            } else if ($.inidb.FileExists(playlistDbPrefix + args[0].toLowerCase())) {
                currentPlaylist.addToPlaylist(currentPlaylist.getCurrentVideo(), args[0].toLowerCase());

                $.say($.lang.get(
                    'ytplayer.command.stealsong.other.success',
                    $.username.resolve(sender),
                    args[0]
                ));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.playlist.404', args[0]));
            }
        }

        /**
         * @commandpath jumptosong [position in playlist] - Jump to a song in the current playlist by position in playlist.
         * @commandpath playsong [position in playlist] - Jump to a song in the current playlist by position in playlist.
         */
        if (command.equalsIgnoreCase('jumptosong') || command.equalsIgnoreCase('playsong')) {
            if (!currentPlaylist.jumpToSong(args[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.jumptosong.failed', args[0]));
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
                currentPlaylist.nextVideo();
                connectedPlayerClient.pushSongList();
                return;
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
                    
                    skipCount = skipCount +1;
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
                $.say($.whisperPrefix(sender) + $.lang.get(
                    'ytplayer.command.songrequest.success',
                    request.getVideoTitle(),
                    currentPlaylist.getRequestsCount(),
                    request.getVideoId()
                ));
                connectedPlayerClient.pushSongList();
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get(
                    'ytplayer.command.songrequest.failed', currentPlaylist.getRequestFailReason()
                ));
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
                $.say($.userPrefix(sender, true) + $.lang.get(
                    'ytplayer.command.previoussong',
                    currentPlaylist.getPreviousVideo().getVideoTitle(),
                    currentPlaylist.getPreviousVideo().getOwner(),
                    currentPlaylist.getPreviousVideo().getVideoLink()
                ));
            } else {
                $.say($.lang.get('ytplayer.command.previoussong.404'));
            }
        }

        /**
         * @commandpath currentsong - Announce the currently playing song in the chat
         */
        if (command.equalsIgnoreCase('currentsong')) {
            $.say($.userPrefix(sender, true) + $.lang.get(
                'ytplayer.command.currentsong',
                currentPlaylist.getCurrentVideo().getVideoTitle(),
                currentPlaylist.getCurrentVideo().getOwner(),
                currentPlaylist.getCurrentVideo().getVideoLink()
            ));
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
                    displayString += "[(#"+ showRange + ") "+ currentPlaylist.getRequestAtIndex(minRange).getVideoTitle().substr(0, 20) + "] ";
                    minRange++;
                }
                if (displayString.equals('')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.range.404'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.nextsong.range', displayString));
                }
            }
        }
    });

    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/youtubePlayer.js')) {
            $.registerChatCommand('./systems/youtubePlayer.js', 'ytp', 1);
            $.registerChatCommand('./systems/youtubePlayer.js', 'musicplayer', 1);
            $.registerChatCommand('./systems/youtubePlayer.js', 'playlist', 1);
            $.registerChatCommand('./systems/youtubePlayer.js', 'stealsong', 1);
            $.registerChatCommand('./systems/youtubePlayer.js', 'jumptosong', 1);
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

            loadPanelPlaylist();

            if (currentPlaylist == null) {
                /** Pre-load last activated playlist */
                currentPlaylist = new BotPlayList(activePlaylistname, true);

                /** if the current playlist is "default" and it's empty, add some default songs. */
                if (currentPlaylist.getPlaylistname().equals('default') && currentPlaylist.getplaylistLength() == 0) {
                    /** CyberPosix - Under The Influence (Outertone Free Release) */
                    try {
                        currentPlaylist.addToPlaylist(new YoutubeVideo('gotxnim9h8w', $.botName));
                    } catch (ex) {
                        $.log.error("YoutubeVideo::exception: " + ex);
                    }
    
                    /** Different Heaven & Eh!de - My Heart (Outertone 001 - Zero Release) */
                    try {
                        currentPlaylist.addToPlaylist(new YoutubeVideo('WFqO9DoZZjA', $.botName));
                    } catch (ex) {
                        $.log.error("YoutubeVideo::exception: " + ex);
                    }
    
    
                    /** Tobu - Higher (Outertone Release) */
                    try {
                        currentPlaylist.addToPlaylist(new YoutubeVideo('l7C29RM1UmU', $.botName))
                    } catch (ex) {
                        $.log.error("YoutubeVideo::exception: " + ex);
                    }
                }
            }
        }
    });
})();
