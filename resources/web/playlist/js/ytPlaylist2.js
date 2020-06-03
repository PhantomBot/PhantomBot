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

/*
 * ytPlaylist.js
 * -------------
 * Produces a GUI for the playlists in YouTube Player
 */
var DEBUG_MODE = false;
var connectedToWS = false;

var url = window.location.host.split(":");
var addr = (getProtocol() == 'https://' ? 'wss://' : 'ws://') + url[0] + ':' + getPlayerPort();
var connection = new WebSocket(addr, []);
var currentVolume = 0;

function debugMsg(message) {
    if (DEBUG_MODE)
        console.log("ytPlaylist::DEBUG::" + message);
}
function logMsg(message) {
    console.log('ytPlaylist::' + message);
}

connection.onopen = function (data) {
    var jsonObject = {};

    debugMsg("connection.onopen()");
    connectedToWS = true;

    var jsonObject = {};
    jsonObject["readauth"] = getAuth();
    connection.send(JSON.stringify(jsonObject));
    debugMsg("onPlayerReady::connection.send(" + JSON.stringify(jsonObject) + ")");
}

connection.onclose = function (data) {
    debugMsg("connection.onclose()");
    connectedToWS = false;
}

connection.onmessage = function (e) {
    try {
        var messageObject = JSON.parse(e.data);
    } catch (ex) {
        logMsg('connection.onmessage: badJson(' + e.data + '): ' + ex.message);
        return;
    }

    debugMsg('connection.onmessage(' + e.data + ')');

    if (messageObject['authresult'] === false) {
        if (!messageObject['authresult']) {
            newAlert('WS Auth Failed', 'Reload page, if that fails, let the caster know', 'danger', 0);
            return;
        }
        return;
    }
    if (messageObject['authresult'] === true) {
        refreshData();
    }

    if (messageObject['command'] !== undefined) {
        if (messageObject['command']['play'] !== undefined) {
            handleNewSong(messageObject['command']['title'], messageObject['command']['duration'], messageObject['command']['requester']);
            refreshData();
            return;
        }
    }

    if (messageObject['currentsong'] !== undefined) {
        handleNewSong(messageObject['currentsong']['title'], messageObject['currentsong']['duration'],
                messageObject['currentsong']['requester'], messageObject['currentsong']['song']);
        return;
    }

    if (messageObject['songlist'] !== undefined) {
        handleSongList(messageObject);
        return;
    }

    if (messageObject['playlist'] !== undefined) {
        handlePlayList(messageObject);
        return;
    }

    if (messageObject['requestHistory'] !== undefined) {
        handleSongHistoryList(messageObject);
        return;
    }
}

function handleNewSong(title, duration, requester, id) {
    debugMsg('handleNewSong(' + title + ', ' + duration + ', ' + requester + ')');

    var html = '<a href="https://youtu.be/' + id + '" target="_blank">' +
            '<div class="dataRow">' +
            '<div class="data dataQueueTitle">' + title + '</div>' +
            '<div class="data dataQueueArtist">' + requester + '</div>' +
            '<div class="data dataQueueLength">' + duration + '</div>' +
            '</div></a>';

    $('#currentSongHtml').html(html);
}

function handlePlayList(d) {
    debugMsg('handlePlayList(' + d + ')');
    $('#playlistTableTitle').html('Current Playlist: ' + d['playlistname']);
    var tableData = '';
    for (var i in d['playlist']) {
        var id = d['playlist'][i]['song'];
        var title = d['playlist'][i]['title'];
        //var requester = d['playlist'][i]['requester'];

        tableData += '<a href="https://youtu.be/' + id + '" target="_blank">';

        tableData += '<div class="dataRow">';

        // Title Column
        tableData += '<div class="data dataQueueTitleShortened">' + title + '</div>';

        // Requester Column
        tableData += '<div class="data dataQueueArtist"></div>';

        // Length Column
        tableData += '<div class="data dataQueueLength"></div>';

        tableData += '</div></a>';

    }

    $('#contendersHtml').html(tableData);
}

function handleSongList(d) {
    debugMsg('handleSongList(' + d + ')');
    var tableData = "";
    for (var i in d['songlist']) {
        var playerIndex = parseInt(i, 10) + 1;
        var bumped = d['songlist'][i]['bump'];
        var id = d['songlist'][i]['song'];
        var title = d['songlist'][i]['title'];
        var duration = d['songlist'][i]['duration'];
        var requester = d['songlist'][i]['requester'];
        tableData += '<a href="https://youtu.be/' + id + '" target="_blank">';

        tableData += '<div class="dataRow">';
        // Position Column
        tableData += '<div class="data dataQueuePosition"> #' + playerIndex;

        if (bumped == "true") {
            tableData += ' <i class="fas fa-star"></i>';
        }
        tableData += '</div>';

        // Title Column
        tableData += '<div class="data dataQueueTitleShortened">' + title + '</div>';

        // Requester Column
        tableData += '<div class="data dataQueueArtist">' + requester + '</div>';

        // Length Column
        tableData += '<div class="data dataQueueLength">' + duration + '</div>';

        tableData += '</div></a>';
    }
    $('#requestQueueHtml').html(tableData);
}

function handleSongHistoryList(d) {
    debugMsg('handleSongHistoryList(' + d + ')');
    var tableData = '';
    for (var i in d['requestHistory']) {
        var playerIndex = parseInt(i, 10) + 1;
        var id = d['requestHistory'][i]['song'];
        var title = d['requestHistory'][i]['title'];
        var duration = d['requestHistory'][i]['duration'];
        var requester = d['requestHistory'][i]['requester'];

        tableData += '<a href="https://youtu.be/' + id + '" target="_blank">';

        tableData += '<div class="dataRow">';

        // Position Column
        tableData += '<div class="data dataQueuePosition"> #' + playerIndex + '</div>';

        // Title Column
        tableData += '<div class="data dataQueueTitleShortened">' + title + '</div>';

        // Requester Column
        tableData += '<div class="data dataQueueArtist">' + requester + '</div>';

        // Length Column
        tableData += '<div class="data dataQueueLength">' + duration + '</div>';

        tableData += '</div></a>';

    }
    $('#requestHistoryHtml').html(tableData);
}

// Type is: success (green), info (blue), warning (yellow), danger (red)
function newAlert(message, title, type, timeout) {
    debugMsg('newAlert(' + message + ', ' + title + ', ' + type + ', ' + timeout + ')');
    $('.alert').fadeIn(1000);
    $('#newAlert').show().html('<div class="alert alert-' + type + '"><button type="button" ' +
            'class="close" data-dismiss="alert" aria-hidden="true"></button><span>' +
            message + ' [' + title + ']</span></div>');
    if (timeout != 0) {
        $('.alert-' + type).delay(timeout).fadeOut(1000, function () {
            $(this).remove();
        });
    }
}

function refreshData() {
    var jsonObject = {};
    if (!connectedToWS) {
        return;
    }
    jsonObject['query'] = 'currentsong';
    connection.send(JSON.stringify(jsonObject));
    jsonObject['query'] = 'songlist';
    connection.send(JSON.stringify(jsonObject));
    jsonObject['query'] = 'playlist';
    connection.send(JSON.stringify(jsonObject));
    jsonObject['query'] = 'songrequesthistory';
    connection.send(JSON.stringify(jsonObject));
}
setInterval(refreshData, 20000);

