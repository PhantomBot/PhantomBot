/**
 * youtubePlayer.js
 *
 * Manage songrequests and play them through an external player.
 *
 * NOTE: This version is going to be deprecated!
 */
(function () {
  var updatesInChat = ($.inidb.exists('youtubePlayer', 'updatesInChat') ? $.getIniDbBoolean('youtubePlayer', 'updatesInChat') : false),
      requestLimit = ($.inidb.exists('youtubePlayer', 'requestLimit') ? parseInt($.inidb.get('youtubePlayer', 'requestLimit')) : 3),
      playerVolume = ($.inidb.exists('youtubePlayer', 'playerVolume') ? parseInt($.inidb.get('youtubePlayer', 'playerVolume')) : 20),
      shuffleDefaultPlaylist = ($.inidb.exists('youtubePlayer', 'shuffleDefaultPlaylist') ? $.getIniDbBoolean('youtubePlayer', 'shuffleDefaultPlaylist') : false),
      requestsEnabled = ($.inidb.exists('youtubePlayer', 'requestsEnabled') ? $.getIniDbBoolean('youtubePlayer', 'requestsEnabled') : true),
      maxVideoLength = ($.inidb.exists('youtubePlayer', 'maxVideoLength') ? parseInt($.inidb.get('youtubePlayer', 'maxVideoLength')) * 1000 : 48e4),
      workPath = './addons/youtubePlayer/',
      playerConnected = false,
      videoPaused = false,
      defaultPlaylistPos = -1,
      lastRandom = -1,
      defaultPlaylist = [],
      requestQueue = [],
      currentSong = null;


  /**
   * @class
   * @param {YoutubeVideo} youtubeVideoInstance
   * @param {string} username
   */
  function VideoRequest(youtubeVideoInstance, username) {
    this.youtubeVideo = youtubeVideoInstance;
    this.username = username;

    /**
     * #function isOverRequestLimit
     * @returns {boolean}
     */
    this.isOverRequestLimit = function() {
      var count = 0, i;
      for (i in requestQueue) {
        if (requestQueue[i].username == this.username) {
          count++;
        }
      }
      return (count >= requestLimit);
    };

    /**
     * @function isQueueDuplicate
     * @returns {boolean}
     */
    this.isQueueDuplicate = function() {
      var i;
      for (i in requestQueue) {
        if (requestQueue[i].videoId == this.youtubeVideo.videoId) {
          return true;
        }
      }
      return false;
    };

    /**
     * @function isVideoTooLong
     * @returns {boolean}
     */
    this.isVideoTooLong = function() {
      return ($.isAdmin(this.username) || this.youtubeVideo.getVideoLength() > maxVideoLength);
    };

    this.request = function() {
      if (!this.youtubeVideo.found) {
        $.say($.whisperPrefix(this.username) + $.lang.get('youtubeplayer.request.error.404', this.youtubeVideo.link));
        $.returnCommandCost(this.username, 'addsong');
        return false;
      } else if (this.isOverRequestLimit()) {
        $.say($.whisperPrefix(this.username) + $.lang.get('youtubeplayer.request.error.overlimit', requestLimit));
        $.returnCommandCost(this.username, 'addsong');
        return false;
      } else if (this.isQueueDuplicate()) {
        $.say($.whisperPrefix(this.username) + $.lang.get('youtubeplayer.request.error.alreadyexists'));
        $.returnCommandCost(this.username, 'addsong');
        return false;
      } else if (this.isVideoTooLong()) {
        $.say($.whisperPrefix(this.username) + $.lang.get('youtubeplayer.request.error.toolong',
                this.youtubeVideo.videoTitle, $.getTimeString(this.youtubeVideo.getVideoLength()), $.getTimeString(maxVideoLength)));
        $.returnCommandCost(this.username, 'addsong');
        return false;
      } else {
        requestQueue.push(this.youtubeVideo);
        updateRequestFile();
        $.say($.lang.get('youtubeplayer.request.success', this.youtubeVideo.videoTitle, $.resolveRank(this.username)));
        return true
      }
    }
  }

  /**
   * @class
   * @param {string} ytLink
   * @param {string} [username]
   */
  function YoutubeVideo(ytLink, username) {
    this.link = ytLink;
    this.username = (username + '').toLowerCase();
    this.videoId = '';
    this.videoTitle = '';
    this.length = 0;
    this.found = true;

    this.getVideoLength = function() {
      var lData = $.youtube.GetVideoLength(this.videoId);
      while (lData[0] == 0 && lData[1] == 0 && lData[2] == 0) {
        lData = $.youtube.GetVideoLength(this.videoId);
      }
      if (lData[0] == 0 && lData[1] == 0 && lData[2] == 0) {
        return false;
      }
      this.length = lData[2];
      return this.length;
    };

    this.cue = function() {
      $.musicplayer.cue(this.videoId);
    };

    if (!this.link) {
      this.found = false;
    }

    var data = $.youtube.SearchForVideo(this.link);
    while (data[0].length() < 11 && data[1] != "No Search Results Found") {
      data = $.youtube.SearchForVideo(this.link);
    }

    this.videoId = data[0];
    this.videoTitle = data[1];
    this.length = 1;

    if (this.videoTitle == 'Video Marked Private' || this.videoTitle == 'No Search Results Found') {
      this.found = false;

    }

    if (this.videoId == '') {
      this.found = false;
    }
  }

  /**
   * @function reloadDefaultPlaylist
   */
  function reloadDefaultPlaylist() {
    var i, song;

    $.consoleLn($.lang.get('youtubeplayer.playlist.parse.default.start'));
    defaultPlaylist = $.readFile(workPath + 'playlist.txt').reverse();

    if (defaultPlaylist.length > 0) {
      for (i in defaultPlaylist) {
        song = new YoutubeVideo(defaultPlaylist[i]);
        if (song) {
          $.writeToFile(i + '. ' + song.videoTitle + ' (' + song.link + ')', workPath + 'defaultPlaylist.txt', (i != 0));
        } else {
          $.writeToFile(i + '. COULD NOT FIND! (' + song.link + ')', workPath + 'defaultPlaylist.txt', (i != 0));
        }
      }
    }

    $.consoleLn($.lang.get('youtubeplayer.playlist.parse.default.complete'));
  };

  /**
   * @function nextVideo
   */
  function nextVideo() {
    var video, rand;
    if (requestQueue.length > 0) {
      video = requestQueue.shift();
    } else {
      if (shuffleDefaultPlaylist) {
        do {
          rand = $.randRange(0, defaultPlaylist.length - 1)
        } while (rand == lastRandom);
        defaultPlaylistPos = lastRandom = rand;
      } else {
        if (defaultPlaylistPos < defaultPlaylist.length) {
          defaultPlaylistPos++;
        } else {
          defaultPlaylistPos = 0;
        }
      }
      video = new YoutubeVideo(defaultPlaylist[defaultPlaylistPos], $.botName);
    }
    playYoutubeVideo(video);
  };

  /**
   * @function jumpToSong
   * @param {string} youtubeId
   * @returns {boolean}
   */
  function jumpToSong(youtubeId) {
    var i, video;
    for (i in defaultPlaylist) {
      if (defaultPlaylist[i].toLowerCase().indexOf(youtubeId.toLowerCase()) > -1) {
        defaultPlaylistPos = i;
        video = new YoutubeVideo(defaultPlaylist[i], $.botName);
        playYoutubeVideo(video);
        return true;
      }
    }
    return false;
  };

  /**
   * @function addToDefaultPlaylist
   * @param {YoutubeVideo} youtubeVideo
   */
  function addToDefaultPlaylist(youtubeVideo) {
    $.writeToFile('http://youtube.com/watch?v=' + youtubeVideo.videoId, './addons/youtubePlayer/playlist.txt', true);
    reloadDefaultPlaylist();
  };

  /**
   * @function deleteFromDefaultPlaylist
   * @param {Number} id
   * @returns {string}
   */
  function deleteFromDefaultPlaylist(id) {
    var video = new YoutubeVideo(defaultPlaylist[id]),
        temp,
        i;
    defaultPlaylist.splice(id, 1);
    temp = defaultPlaylist.reverse();
    for (i in temp) {
      $.writeToFile(temp[i], './addons/youtubePlayer/playlist.txt', (i != 0));
    }
    reloadDefaultPlaylist();
    return video.videoTitle;
  };

  /**
   * @function playYoutubeVideo
   * @param {YoutubeVideo} youtubeVideo
   */
  function playYoutubeVideo(youtubeVideo) {
    if (youtubeVideo) {
      currentSong = youtubeVideo;
      youtubeVideo.cue();
      $.writeToFile(youtubeVideo.videoTitle, workPath + 'currentSong.txt', false);
      if (updatesInChat) {
        $.say($.lang.get('youtubeplayer.nowplaying.get', youtubeVideo.videoTitle, $.resolveRank(youtubeVideo.username)));
      } else {
        $.consoleLn($.lang.get('youtubeplayer.nowplaying.get', youtubeVideo.videoTitle, $.resolveRank(youtubeVideo.username)));
      }
    }
    updateRequestFile();
  };

  /**
   * @function updateRequestFile
   * @param {boolean} [truncate]
   */
  function updateRequestFile(truncate) {
    var i;
    if (truncate) {
      $.writeToFile('', workPath + 'requestQueue.txt', false);
      return;
    }
    if (requestQueue.length > 0) {
      for (i in requestQueue) {
        $.writeToFile(requestQueue[i].videoTitle + ' (By ' + $.username.resolve(requestQueue[i].username) + ')',
            workPath + 'requestQueue.txt', (i != 0));
      }
    }
  };

  /**
   * @function togglePauseVideo
   */
  function togglePauseVideo() {
    if (videoPaused) {
      $.musicplayer.play();
    } else {
      $.musicplayer.pause();
    }
    videoPaused = !videoPaused;
  };

  /**
   * @event musicPlayerConnect
   */
  $.bind('musicPlayerConnect', function () {
    playerConnected = true;
    if (defaultPlaylist.length == 0) {
      reloadDefaultPlaylist();
    }
    if (updatesInChat && requestsEnabled) {
      $.say($.lang.get('youtubeplayer.requests.enabled') + ' ' + $.lang.get('youtubeplayer.request.usage'));
    }
    $.consoleLn($.lang.get('youtubeplayer.console.client.connected'));
  });

  /**
   * @event musicPlayerDisconnect
   */
  $.bind('musicPlayerDisconnect', function () {
    playerConnected = false;
    updateRequestFile(true);
    if (updatesInChat && requestsEnabled) {
      $.say("[\u266B] Song requests have been disabled.");
    }
    $.consoleLn($.lang.get('youtubeplayer.console.client.disconnected'));
  });

  /**
   * @event musicPlayerState
   */
  $.bind('musicPlayerState', function (event) {
    $.musicplayer.setVolume(playerVolume);
    if (event.getStateId() == -2) {
      requestQueue = [];

      nextVideo();
    }

    if (event.getStateId() == 0) {
      nextVideo();
    }

    if (event.getStateId() == 5) {
      $.musicplayer.play();
      $.musicplayer.currentId();
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        action = (args[0] ? args[0] : ''),
        actionArg = args[1],
        videoRequest;

    /**
     * @commandpath musicplayer - MAnage Youtbe Player settings
     */
    if (command.equalsIgnoreCase('musicplayer')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      /**
       * @commandpath musicplayer togglenotify - Toggle now-playing notifications in the chat
       */
      if (action.equalsIgnoreCase('togglenotify')) {
        updatesInChat = !updatesInChat;
        $.setIniDbBoolean('youtubePlayer', 'updatesInChat', updatesInChat);
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.toggle.chatnotifications.success', (updatesInChat ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
      }

      /**
       * @commandpath musicplayer limit [amount] - Limit the maximum parallel songs a user can request
       */
      if (action.equalsIgnoreCase('limit')) {
        if (!actionArg || isNaN(parseInt(actionArg))) {
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.set.requestlimit.usage', requestLimit));
          return;
        }

        requestLimit = parseInt(actionArg);
        $.inidb.set('youtubePlayer', 'requestLimit', requestLimit);
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.set.requestlimit.success', requestLimit));
      }

      /**
       * @commandpath musicplayer maxvideolength [seconds] - Set the meximum video length for requests in seconds
       */
      if (action.equalsIgnoreCase('maxvideolength')) {
        if (!actionArg || isNaN(parseInt(actionArg))) {
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.set.maxvideolength.usage', $.getTimeString(maxVideoLength / 1e3)));
          return;
        }

        maxVideoLength = parseInt(actionArg) * 6e4;
        $.inidb.set('youtubePlayer', 'maxVideoLength', maxVideoLength);
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.set.maxvideolength.success', $.getTimeString(maxVideoLength / 1e3)));
      }

      /**
       * @commandpath musicplayer shuffle - Toggle the shuffling of the default playlist
       */
      if (action.equalsIgnoreCase('shuffle')) {
        shuffleDefaultPlaylist = !shuffleDefaultPlaylist;
        $.setIniDbBoolean('youtubePlayer', 'shuffleDefaultPlaylist', shuffleDefaultPlaylist);
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.toggle.songShuffle.success',
                (shuffleDefaultPlaylist ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
      }

      /**
       * @commandpath musicplayer pause - Toggle te play/pause state of the connected musicplayers
       */
      if (action.equalsIgnoreCase('pause')) {
        togglePauseVideo();
      }

      /**
       * @commandpath musicplayer reload - Reload the default playlist
       */
      if (action.equalsIgnoreCase('reload')) {
        reloadDefaultPlaylist();
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playlist.reload.success'));
      }

      /**
       * @commandpath musicplayer adddefault [Youtube link] - Add a video to the default playlist
       */
      if (action.equalsIgnoreCase('adddefault')) {
        if (!actionArg) {
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playlist.adddefault.usage'));
          return;
        }

        videoRequest = new YoutubeVideo(actionArg, sender);

        if (!videoRequest) {
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playlist.adddefault.failed'));
        } else {
          addToDefaultPlaylist(videoRequest);
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playlist.adddefault.success', videoRequest.videoTitle));
        }
      }


      /**
       * @commandpath musicplayer deldefault [id in playlist] - Delete an entry from the default playlist
       */
      if (action.equalsIgnoreCase('deldefault')) {
        actionArg = parseInt(actionArg);
        if (isNaN(actionArg) || !defaultPlaylist[actionArg]) {
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playlist.deletedefault.usage'));
          return;
        }

        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playlist.deletedefault.success',
                deleteFromDefaultPlaylist(actionArg)));
      }
    }

    /**
     * @commandpath addsong [Youtube link] - Add a song the the request list
     */
    if (command.equalsIgnoreCase('addsong')) {
      if (!requestsEnabled) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.request.error.disabled'));
        return;
      }

      if (!action) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.request.usage'));
        return;
      }

      if (!playerConnected) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.request.error.notrunning'));
        return;
      }

      videoRequest = new VideoRequest(new YoutubeVideo(action, sender), sender);
      if (videoRequest.youtubeVideo) {
        videoRequest.request();
      }
    }

    /**
     * @commandpath volume [0-100] - Set the volume of the connected musicplayer
     */
    if (command.equalsIgnoreCase('volume')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (!actionArg && !isNaN(parseInt(action))) {
        playerVolume = parseInt(action);
        $.inidb.set('youtubePlayer', 'playerVolume', playerVolume);
        if (playerConnected) {
          $.musicplayer.setVolume(playerVolume);
        }
      }
    }

    /**
     * @commandpath skipsong - Skip to the next song in the playlist
     */
    if (command.equalsIgnoreCase('skipsong')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (!playerConnected) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.notrunning'));
        return;
      }

      nextVideo();
    }

    /**
     * @comandpath currentsong - Announce the currently playing song
     */
    if (command.equalsIgnoreCase('currentsong')) {
      if (!playerConnected) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.notrunning'));
        return;
      }
      $.say($.lang.get('youtubeplayer.nowplaying.getwithlink', currentSong.videoTitle,
          $.resolveRank(currentSong.username), currentSong.link));
    }

    /**
     * @commandpath stealsong - Steal the currently playing song and add it to the default playlist
     */
    if (command.equalsIgnoreCase('stealsong')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (currentSong) {
        $.writeToFile('https://youtube.com/watch?v=' + currentSong.videoId, workPath + 'playlist.txt', true);
        $.say($.lang.get('youtubeplayer.stealsong.success', currentSong.videoTitle, $.resolveRank(currentSong.username)));
        reloadDefaultPlaylist();
      }
    }

    /**
     * @commandpath playsong [id in playlsit] - Jump to a song at the given position in the playlist
     */
    if (command.equalsIgnoreCase('playsong')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (!playerConnected) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.notrunning'));
        return;
      }

      if (requestQueue.length > 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playsong.requestsrunning'));
        return;
      }

      if (action) {
        if (!jumpToSong(action)) {
          $.say($.whisperPrefix(sender) + $.lang.get('youtubeplayer.playsong.404', action));
        }
      }
    }

    /**
     * @commandpath togglerequests - Toggle songrequests on/off
     */
    if (command.equalsIgnoreCase('togglerequests')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }
      requestsEnabled = !requestsEnabled;
      $.setIniDbBoolean('youtubePlayer', 'requestsEnabled', requestsEnabled);
      if (requestsEnabled) {
        $.say($.lang.get('youtubeplayer.requests.enabled'));
      } else {
        $.say($.lang.get('youtubeplayer.requests.disabled'));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/youtubePlayer.js')) {
      if (defaultPlaylist.length == 0) {
        reloadDefaultPlaylist();
      }

      $.registerChatCommand('./systems/youtubePlayer.js', 'musicplayer', 1);
      $.registerChatCommand('./systems/youtubePlayer.js', 'volume', 1);
      $.registerChatCommand('./systems/youtubePlayer.js', 'skipsong', 1);
      $.registerChatCommand('./systems/youtubePlayer.js', 'stealsong', 1);
      $.registerChatCommand('./systems/youtubePlayer.js', 'playsong', 1);
      $.registerChatCommand('./systems/youtubePlayer.js', 'togglerequests', 1);
      $.registerChatCommand('./systems/youtubePlayer.js', 'addsong', 6);
      $.registerChatCommand('./systems/youtubePlayer.js', 'currentsong', 7);
    }
  })
})();