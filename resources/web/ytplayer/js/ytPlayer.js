/*
 * newPlayer.js
 * ------------
 * Interface for the YouTube Player for PhantomBot.
 */
var DEBUG_MODE = false;

var startPaused = false;
var playerPaused = false;
var playerMuted = false;
var connectedToWS = false;
var showChat = false;
var loadedChat = false;
var volumeSlider = null;
var progressSlider = null;
var lastSkipButtonPress = 0;

var url = window.location.host.split(":");
var addr = (getProtocol() == 'https://' ? 'wss://' : 'ws://') + url[0] + ':' + getPlayerPort();
var connection = new WebSocket(addr, []);
var currentVolume = 0;

if (window.location.href.indexOf('start_paused') !== -1) {
    startPaused = true;
}

var documentElement = document.createElement('script');
documentElement.src = "https://www.youtube.com/iframe_api";

var scriptTag = document.getElementsByTagName('script')[0];
scriptTag.parentNode.insertBefore(documentElement, scriptTag);

var playerObject;
function onYouTubeIframeAPIReady() {
    playerObject = new YT.Player('player', {
        height: '200',
        width: '200',
        videoId: '',
        playerVars: {
            iv_load_policy: 3,
            controls: 0,
            showinfo: 0,
            showsearch: 0,
            autoplay: 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function debugMsg(message) {
    if (DEBUG_MODE) console.log("YouTubePlayer::" + message);
}

function onPlayerReady(event) {
    debugMsg("onPlayerReady()");

    var jsonObject = {};
    jsonObject["authenticate"] = getAuth();
    connection.send(JSON.stringify(jsonObject));
    debugMsg("onPlayerReady::connection.send(" + JSON.stringify(jsonObject)+")");

    readyEvent();
    playerObject.setVolume(5); // Be safe with the caster
}

function readyEvent() {
    debugMsg("readyEvent()");
    var jsonObject = {};
    if (startPaused) {
        jsonObject["status"] = { "readypause" : true };
    } else {
        jsonObject["status"] = { "ready" : true };
    }
    connection.send(JSON.stringify(jsonObject));
    debugMsg("readyEvent::connection.send(" + JSON.stringify(jsonObject)+")");
}

function onPlayerStateChange(event) {
    debugMsg("onPlayerStateChange(" + event.data + ")");

    if (event.data === 1 && startPaused) {
        playerPaused = true;
        playerObject.pauseVideo();
        startPaused = false;
    }

    var jsonObject = {};
    jsonObject["status"] = { "state" : event.data };
    connection.send(JSON.stringify(jsonObject));
    debugMsg("onPlayerStateChange::connection.send(" + JSON.stringify(jsonObject)+")");
}

connection.onopen = function(data) {
    debugMsg("connection.onopen()");
    connectedToWS = true;
}

connection.onclose = function(data) {
    debugMsg("connection.onclose()");
    newSongAlert('WebSocket has been closed', 'Restart player when bot is restored', 'danger', 0);
    connectedToWS = false;
}

connection.onmessage = function(e) {
    try {
        var messageObject = JSON.parse(e.data);
    } catch (ex) {
        console.log('YouTubePlayer::connection.onmessage: badJson(' + e.data + '): ' + ex.message);
        return;
    }
    debugMsg("connection.onmessage("+ e.data + ")");

    if (messageObject['authresult'] == false) {
        if (!messageObject['authresult']) {
            newSongAlert('WS Auth Failed', 'Reload page, if that fails, restart bot', 'danger', 0);
            return;
        }
        return;
    }

    if (messageObject['command']) {
        if (messageObject['command']['play']) {
            handlePlay(messageObject['command']['play'], messageObject['command']['title'], 
                       messageObject['command']['duration'], messageObject['command']['requester']);
            return;
        }

        if (messageObject['command']['setvolume']) {
            handleSetVolume(parseInt(messageObject['command']['setvolume']));
            return;
        }

        if (messageObject['command'].localeCompare('pause') == 0) {
            handlePause(messageObject['command']);
            return;
        }

        if (messageObject['command'].localeCompare('querysong') == 0) {
            handleQuerySong(messageObject['command']);
            return;
        }
    }

    if (messageObject['songlist']) {
        handleSongList(messageObject);
        return;
    }

    if (messageObject['playlist']) {
        handlePlayList(messageObject);
        return;
    }

    console.log('YouTubePlayer::connection.onmessage: unknownJson(' + e.data + ')');
}

function handlePlayList(d) {
    debugMsg("handlePlayList(" + d + ")");
    $("#playlistTableTitle").html("Current Playlist: " + d['playlistname']);
    var tableData = "<tr><th /><th>Song Title</th><th>Duration</th><th>YouTube ID</th></tr>";
    for (var i in d['playlist']) {
        var id = d['playlist'][i]['song'];
        var title = d['playlist'][i]['title'];
        var duration = d['playlist'][i]['duration'];
        tableData += "<tr>" +
                     "<td width=\"15\"><divclass=\"button\" onclick=\"deletePLSong('" + id + "')\"><i class=\"fa fa-trash-o\" /></div></td>" +
                     "<td>" + title + "</td><td>" + duration + "</td><td>" + id + "</td></tr>";
    }
    $("#playlistTable").html(tableData);
}

function handleSongList(d) {
    debugMsg("handleSongList(" + d + ")");
    var tableData = "<tr><th /><th /><th>Song Title</th><th>Requester</th><th>Duration</th><th>YouTube ID</th></tr>";
    for (var i in d['songlist']) {
        var id = d['songlist'][i]['song'];
        var title = d['songlist'][i]['title'];
        var duration = d['songlist'][i]['duration'];
        var requester = d['songlist'][i]['requester'];
        tableData += "<tr>" +
                     "    <td width=\"15\"><divclass=\"button\" onclick=\"deleteSong('" + id + "')\"><i class=\"fa fa-trash-o\" /></div></td>" +
                     "    <td width=\"15\"><divclass=\"button\" onclick=\"stealSong('" + id + "')\"><i class=\"fa fa-bookmark\" /></div></td>" +
                     "    <td>" + title + "</td>" +
                     "    <td>" + requester + "</td>" +
                     "    <td>" + duration + "</td>" +
                     "<td style=\"{width: 10%; text-align: right}\">"  + id + "</td></tr>";
    }
    $("#songTable").html(tableData);
}

function handlePlay(id, title, duration, requester) {
    debugMsg("handlePlay(" + id + ", " + title + ", " + duration + ", " + requester + ")");
    try {
        playerObject.loadVideoById(id, 0, "medium");
        newSongAlert('Now Playing', title, 'success', 4000);
        var ytLink = "https://youtu.be/" + id;
        $("#currentSong").html("<strong>" + title + "</strong><br>" +
                               "<span class=\"currentSong-small\">" +
                               "    <i class=\"fa fa-clock-o\">&nbsp;</i>" + duration + "<br>" +
                               "    <i class=\"fa fa-youtube\">&nbsp;</i><a id=\"playerLink\" href=\"" + ytLink + "\">" + ytLink + "</a><br>" +
                               "    <i class=\"fa fa-user\">&nbsp;</i>" + requester + 
                               "</span>" +
                               "<table class=\"controlTable\">" +
                               "    <tr><td />" +
                               "        <td><div id=\"playPauseDiv\" class=\"button\" onclick=\"handlePause()\"></div></td>" +
                               "        <td colspan=\"2\"><div id=\"songProgressBar\"></div></td>" +
                               "        <td><div class=\"button\" onclick=\"skipSong()\"><i class=\"fa fa-step-forward\" /></div></td>" +
                               "        <td><div id=\"tooltip-random\" data-placement=\"left\" data-toggle=\"tooltip\" title=\"Toggle Randomized Playlist\" class=\"button\" onclick=\"randomizePlaylist()\"><i class=\"fa fa-random\" /></div></td>" +
                               "    <td /></tr>" +
                               "    <tr><td />" +
                               "        <td><div id=\"mutedDiv\" data-placement=\"left\" data-toggle=\"tooltip\" title=\"Mute/Unmute\" class=\"button\" onclick=\"handleMute()\"></div></td>" +
                               "        <td><div id=\"volumeControl\"></div></td>" +
                               "        <td><div class=\"button\" data-toggle=\"modal\" data-target=\"#songRequestModal\"><i class=\"fa fa-plus\" /></div></td>" +
                               "        <td><div id=\"tooltip-steal\" data-placement=\"left\" data-toggle=\"tooltip\" title=\"Steal Song\" class=\"button\" onclick=\"stealSong()\"><i class=\"fa fa-bookmark\" /></div></td>" +
                               "        <td><div id=\"tooltip-chat\" data-placement=\"left\" data-toggle=\"tooltip\" title=\"Toggle Chat\" class=\"button\" onclick=\"toggleChat()\"><i class=\"fa fa-comment\" /></div></td>" +
                               "    <td /></tr>" +
                               "<table>" +
                               "<div id=\"songRequestDiv\"</div>");

        songRequestDiv();
        $("#tooltip-random").tooltip();
        $("#tooltip-steal").tooltip();
        $("#tooltip-chat").tooltip();
        $("#tooltip-sr").tooltip();

        volumeSlider = $("#volumeControl").slider({
            min: 0,
            max: 100,
            value: currentVolume,
            range: "min",
            slide: function (event, ui) { handleSetVolume(ui.value); handleCurrentVolume(currentVolume); }
        }).height(10);

        progressSlider = $("#songProgressBar").slider({
            min: 0,
            max: playerObject.getDuration(),
            value: 0,
            range: "min",
            stop: function (event, ui) { playerSeekSong(ui.value); }
        }).height(10);

        if (playerMuted) {
            $("#mutedDiv").html("<i class=\"fa fa-volume-off fa-lg\" style=\"color: #000000\" />");
        } else {
            $("#mutedDiv").html("<i class=\"fa fa-volume-off fa-lg\" style=\"color: #ffffff\" />");
        }
       
        if (playerPaused) {
            $("#playPauseDiv").html("<i class=\"fa fa-pause\" />");
        } else {
            $("#playPauseDiv").html("<i class=\"fa fa-play\" />");
        }

        querySongList();
    } catch (ex) {
        console.log("YouTubePlayer::handlePlay::loadVideoById: " + ex.message);
    }
}

function deleteSong(id) {
    debugMsg("deleteSong(" + id + ")");
    var jsonObject = {};
    jsonObject["deletesr"] = id;
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function deletePLSong(id) {
    debugMsg("deletePLSong(" + id + ")");
    var jsonObject = {};
    jsonObject["deletepl"] = id;
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function stealSong(id) {
    debugMsg("stealSong()");
    var jsonObject = {};
    jsonObject["command"] = 'stealsong';
    if (id) {
        jsonObject["youTubeID"] = id;
    }
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function toggleChat() {
    debugMsg("toggleChat()");
    if (showChat) {
        showChat = false;
        $(".chatFrame").hide();
    } else {
        if (!loadedChat) {
            $(".chat").html("<iframe class=\"chatFrame\" src=\"http://www.twitch.tv/" + getChannelName() + "/chat?popout=\">");
            loadedChat = true;
        }
        showChat = true;
        $(".chatFrame").show();
    }
}

function randomizePlaylist(d) {
    debugMsg("randomizePlaylist()");
    var jsonObject = {};
    jsonObject["command"] = "togglerandom";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function skipSong(d) {
    debugMsg("skipSong()");

    var curTime = Date.now();
    // This is to stop people from spamming the button and cause a loop.
    if (Date.now() - lastSkipButtonPress < 1000) {
        return;
    }

    var jsonObject = {};
    jsonObject["command"] = "skipsong";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("deleteSong::connection.send(" + JSON.stringify(jsonObject) + ")");

    lastSkipButtonPress = Date.now();
}

function handlePause(d) {
    debugMsg("handlePause()");
    if (playerPaused) {
        playerPaused = false;
        playerObject.playVideo();
            $("#playPauseDiv").html("<i class=\"fa fa-play\" />");
    } else {
        playerPaused = true;
        playerObject.pauseVideo();
            $("#playPauseDiv").html("<i class=\"fa fa-pause\" />");
    }
}

function handleMute(d) {
    debugMsg("handleMute()");
    if (playerMuted) {
        playerMuted = false;
        playerObject.unMute();
        $("#mutedDiv").html("<i class=\"fa fa-volume-off fa-lg\" style=\"color: #ffffff\" />");
    } else {
        playerMuted = true;
        playerObject.mute();
        $("#mutedDiv").html("<i class=\"fa fa-volume-off fa-lg\" style=\"color: #000000\" />");
    }
}

function handleCurrentId(d) {
    debugMsg("handleCurrentId()");
    var jsonObject = {};
    jsonObject["status"] = { "currentid" : playerObject.getVideoUrl().match(/[?&]v=([^&]+)/)[1] };
    connection.send(JSON.stringify(jsonObject));
    debugMsg("handleCurrentId::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function handleSetVolume(d) {
    debugMsg("handleSetVolume(" + d + ")");
    currentVolume = d;
    playerObject.setVolume(d);
    if (volumeSlider != null) {
        volumeSlider.slider("option", "value", currentVolume);
    }
}

function handleCurrentVolume(d) {
    debugMsg("handleCurrentVolume()");
    var jsonObject = {};
    jsonObject["status"] = { "volume" : playerObject.getVolume() };
    connection.send(JSON.stringify(jsonObject));
    debugMsg("handleCurrentVolume::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function queryPlayList() {
    debugMsg("queryPlayList()");
    var jsonObject = {};
    jsonObject["query"] = "playlist";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("queryPlayList::connection.send(" + JSON.stringify(jsonObject) + ")");
}

function querySongList() {
    debugMsg("querySongList()");
    var jsonObject = {};
    jsonObject["query"] = "songlist";
    connection.send(JSON.stringify(jsonObject));
    debugMsg("querySongList::connection.send(" + JSON.stringify(jsonObject) + ")");
}

// Type is: success (green), info (blue), warning (yellow), danger (red)
function newSongAlert(message, title, type, timeout) {
  debugMsg("newSongAlert(" + message + ", " + title + ", " + type + ", " + timeout + ")");
  $(".alert").fadeIn(1000);
  $("#newSongAlert").show().html('<div class="alert alert-' + type + '"><button type="button" '+
                      'class="close" data-dismiss="alert" aria-hidden="true"></button><span>' + 
                       message + ' [' + title + ']</span></div>');
  if (timeout != 0) {
      $(".alert-" + type).delay(timeout).fadeOut(1000, function () { $(this).remove(); });
  }
}

function updateSongProgressBar(seekTo) {
    debugMsg("updateSongProgress: " +  playerObject.getCurrentTime());
    if (progressSlider != null) {
        progressSlider.slider("option", "value", playerObject.getCurrentTime());
        progressSlider.slider("option", "max", playerObject.getDuration());
    }
}
setInterval(updateSongProgressBar, 2000);

function playerSeekSong(seekPos) {
   playerObject.seekTo(seekPos, true); 
}

function songRequestDiv() {
    $("#songRequestDiv").html(
        "<div class=\"modal fade\" id=\"songRequestModal\" aria-hidden=\"true\">" +
        "    <div class=\"modal-dialog\">" +
        "        <div class=\"modal-header\">" +
        "            <div class=\"modal-title\" id=\"modalLabel\">YouTube Song Request</div>" +
        "         </div>" +
        "         <div class=\"modal-body\">" +
        "             <form role=\"form\" onkeypress=\"return event.keyCode != 13\">" +
        "                 <div class=\"form-group\">" +
        "                     <label for=\"songRequestInput\">Search String / YouTube Link / YouTube ID</label>" +
        "                     <input type=\"text\" class=\"form-control\" id=\"songRequestInput\" placeholder=\"Song Request\" />" +
        "                 </div>" +
        "             </form>" +
        "         </div>" +
        "         <div class=\"modal-footer\">" +
        "             <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" onclick=\"getFormSongRequest()\">Submit</button>" +
        "             <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button>" +
        "         </div>" +
        "     </div>" +
        "</div>");

    // Reset the data form.
    $("#songRequestDiv").on("hidden.bs.modal", function() {
        $("#songRequestInput").val("");
    });
}
function getFormSongRequest() {
    var jsonObject = {};
    jsonObject["command"] = "songrequest";
    jsonObject["search"] = $("#songRequestInput").val();
    connection.send(JSON.stringify(jsonObject));
}

function sendKeepAlive() {
    var jsonObject = {};
    if (!connectedToWS) {
        return;
    }
    jsonObject["status"] = { "state" : 200 };
    try {
        connection.send(JSON.stringify(jsonObject));
        connectedToWS = true;
    } catch (ex) {
        console.log('YouTubePlayer::sendKeepAlive::exception: ' + ex.message);
    }
}
setInterval(sendKeepAlive, 20000);

