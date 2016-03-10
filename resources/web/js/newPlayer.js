/*
 * newPlayer.js
 * ------------
 * Interface for the YouTube Player for PhantomBot.
 */

var playerPaused = false;
var connectedToWS = false;

var url = window.location.host.split(":");
var addr = 'ws://' + url[0] + ':25003';
var connection = new WebSocket(addr, []);

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
            //controls: 0,
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

function onPlayerReady(event) {
    readyEvent()
}

function readyEvent() {
    var jsonObject = {};
    jsonObject["status"] = { "ready" : true };
    connection.send(JSON.stringify(jsonObject));
}

function onPlayerStateChange(event) {
    var jsonObject = {};
    jsonObject["status"] = { "state" : event.data };
    connection.send(JSON.stringify(jsonObject));
}

connection.onopen = function(data) {
    connectedToWS = true;
}

connection.onclose = function(data) {
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
    $("#playlistTableTitle").html("Current Playlist: " + d['playlistname']);
    var tableData = "<tr><th>Song Title</th><th>Duration</th><th>YouTube ID</th></tr>";
    for (var i in d['playlist']) {
        var id = d['playlist'][i]['song'];
        var title = d['playlist'][i]['title'];
        var duration = d['playlist'][i]['duration'];
        tableData += "<tr><td>" + title + "</td><td>" + duration + "</td><td>" + id + "</td></tr>";
    }
    $("#playlistTable").html(tableData);
}

function handleSongList(d) {
    var tableData = "<tr><th></th><th>Song Title</th><th>Requester</th><th>Duration</th><th>YouTube ID</th></tr>";
    for (var i in d['songlist']) {
        var id = d['songlist'][i]['song'];
        var title = d['songlist'][i]['title'];
        var duration = d['songlist'][i]['duration'];
        var requester = d['songlist'][i]['requester'];
        tableData += "<tr><td><button onclick=\"deleteSong('" + id + "')\"><img src=\"images/delete-icon.png\" height=\"15\" width=\"15\"></button></td><td>" + title + "</td>" +
                     "<td>" + requester + "</td>" +
                     "<td>" + duration + "</td>" +
                     "<td style=\"{width: 10%; text-align: right}\">"  + id + "</td></tr>";
    }
    $("#songTable").html(tableData);
}

function handlePlay(id, title, duration, requester) {
    try {
        playerObject.loadVideoById(id, 0, "medium");
        newSongAlert('Now Playing', title, 'success', 4000);
        $("#currentSong").html("<strong>" + title + "</strong><br>" +
                               "<img style=\"margin: 0px 10px 0px 0px\" height=\"15\" width=\"15\" src=\"images/transparent-clock.png\">" + duration + "<br>" +
                               "<img style=\"margin: 0px 10px 0px 0px\" height=\"15\" height=\"15\" width=\"15\" src=\"images/link-icon.png\">" +
                               "<a id=\"playerLink\" href=\"https://youtu.be/" + id + "\">https://youtu.be/" + id + "</a><br>" +
                               "<img style=\"margin: 0px 10px 0px 0px\" height=\"15\" height=\"15\" width=\"15\" src=\"images/user-icon.png\">" + requester + "<br><br>" +
                               "<div id=\"songProgressBar\"> </div><br>" +
                               "<div id=\"volumeControl\"> </div>");
        $("#volumeControl").slider({
            min: 0,
            max: 100,
            value: playerObject.getVolume(),
            slide: function (event, ui) { playerObject.setVolume(ui.value); }
        }).height(10);
        querySongList();
    } catch (ex) {
        console.log("YouTubePlayer::handlePlay::loadVideoById: " + ex.message);
    }
}

function deleteSong(id) {
    var jsonObject = {};
    jsonObject["deletesr"] = id;
    connection.send(JSON.stringify(jsonObject));
}

function handlePause(d) {
    if (playerPaused) {
        playerPaused = false;
        playerObject.playVideo();
    } else {
        playerPaused = true;
        playerObject.pauseVideo();
    }
}

function handleCurrentId(d) {
    var jsonObject = {};
    jsonObject["status"] = { "currentid" : playerObject.getVideoUrl().match(/[?&]v=([^&]+)/)[1] };
    connection.send(JSON.stringify(jsonObject));
}

function handleSetVolume(d) {
    playerObject.setVolume(d);
}

function handleCurrentVolume(d) {
    var jsonObject = {};
    jsonObject["status"] = { "volume" : playerObject.getVolume() };
    connection.send(JSON.stringify(jsonObject));
}

function queryPlayList() {
    var jsonObject = {};
    jsonObject["query"] = "playlist";
    connection.send(JSON.stringify(jsonObject));
}

function querySongList() {
    var jsonObject = {};
    jsonObject["query"] = "songlist";
    connection.send(JSON.stringify(jsonObject));
}

// Type is: success (green), info (blue), warning (yellow), danger (red)
function newSongAlert(message, title, type, timeout) {
  $(".alert").fadeIn(1000);
  $("#newSongAlert").show().html('<div class="alert alert-' + type + '"><button type="button" '+
                      'class="close" data-dismiss="alert" aria-hidden="true"></button><span>' + 
                       message + ' [' + title + ']</span></div>');
  if (timeout != 0) {
      $(".alert-" + type).delay(timeout).fadeOut(1000, function () { $(this).remove(); });
  }
}

function updateSongProgressBar() {
    $("#songProgressBar").progressbar({ max: playerObject.getDuration(), value: playerObject.getCurrentTime() }).height(20);
}
setInterval(updateSongProgressBar, 2000);

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
