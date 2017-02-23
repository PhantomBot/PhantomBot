var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";

var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
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
    ready()
}

var r = false;
function ready() {
    if (r) {
        connection.send("ready");
    } else {
        r = true;
    }
}

var vids = []

var i = -1;
function onPlayerStateChange(event) {
    console.log(event);
    connection.send("state|" + event.data);
}

var url = window.location.host.split (":");
var addr = 'ws://' + url [0] + ':26001';
var connection = new WebSocket(addr, []);

connection.onopen = function (e) {
    ready();
}

connection.onmessage = function (e) {
    console.log(e);
    var d = e.data.split('|');

    switch (d[0]) {
        case "next":
            handleNext(d);
            break;
        case "previous":
            handlePrevious(d);
            break;
        case "play":
            handlePlay(d);
            break;
        case "pause":
            handlePause(d);
            break;
        case "add":
            handleAdd(d);
            break;
        case "currentid":
            handleCurrentId(d);
            break;
        case "reload":
            handleReload(d);
            break;
        case "cue":
            handleCue(d);
            break;
        case "eval":
            handleEval(d);
            break;
        case "currentvolume":
            handleCurrentVolume(d);
            break;
        case "setvolume":
            handleSetVolume(d);
            break;
    }
}

function handleNext(d) {
    i++;
    if (vids[i] == null) i = 0;
    player.cueVideoById(vids[i], 0, "medium");
}

function handlePrevious(d) {
    i--;
    if (vids[i] == null) i = vids.length - 1;
    player.cueVideoById(vids[i], 0, "medium");
}

function handlePlay(d) {
    player.playVideo();
}

function handlePause(d) {
    player.pauseVideo();
}

function handleAdd(d) {
    vids.push(d[1]);
    
}

function handleCurrentId(d) {
    connection.send("currentid|" + player.getVideoUrl().match(/[?&]v=([^&]+)/)[1]);
}

function handleReload(d) {
    location.reload();
}

function handleCue(d) {
    player.cueVideoById(d[1], 0, "medium");
    displaySongList();
}

function handleEval(d) {
    eval(d[1]);
}

function handleSetVolume(d) {
    player.setVolume(d[1]);
}

function handleCurrentVolume(d) {
    connection.send("currentvolume|" + player.getVolume());
}

function displaySongList() {
    console.log("displaySongList()");
    var div = document.getElementById("songlist");
    div.innerHTML = "Adding Songlist<br><table border='0'>" +
                    "  <tr>" +
                    "    <td>Link</td>" +
                    "  </tr>";
    for (var j = 0; j < vids.length; j++) {
        div.innerHTML += "  <tr><td>" + vids[j] + "</td></tr>";
    }
    div.innerHTML += "</tr></table>";
}

// Keep Alive
setInterval(function() {
    connection.send("state|200");
}, 5000);

