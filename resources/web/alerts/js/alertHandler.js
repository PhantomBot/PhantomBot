/*
 * Copyright (C) 2017 phantombot.tv
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
 * @author IllusionaryOne
 */
var DEBUG_MODE = false;
var url = window.location.host.split(":");
var addr = 'ws://' + url[0] + ':' + getPanelPort();
var connection = new WebSocket(addr, []);
var isConnected = false;

/**
 * @function debugMsg
 * @param {String} message
 */
function debugMsg(message) {
    if (DEBUG_MODE) console.log('Alerts::DEBUG::' + message);
}

/**
 * @function logMsg
 * @param {String} message
 */
function logMsg(message) {
    console.log('Alerts::' + message);
}

/**
 * @event connection.onopen
 * Triggered when the WebSocket connection is opened.
 */
connection.onopen = function(data) {
    var jsonObject = {};
    debugMsg('connection.onopen()');
    jsonObject['authenticate'] = getAuth();
    connection.send(JSON.stringify(jsonObject));
    isConnected = true;

    $("#imageLocation").fadeOut(1);
}

/**
 * @event connection.onclose
 * Triggered when the WebSocket connection is closed by the bot.
 */
connection.onclose = function(data) {
    debugMsg('connection.onclose()');
    isConnected = false;
}

/**
 * @event connection.onmessage
 * Triggered when a message comes in from the WebSocket. This event is in the other
 * panel JS files as well.
 */
connection.onmessage = function(e) {
    try {
        var messageObject = JSON.parse(e.data);
    } catch (ex) {
        logMsg('connection.onmessage: badJson(' + e.data + '): ' + ex.message);
        return;
    }
    debugMsg('connection.onmessage('+ e.data + ')');

    if (messageObject['authresult'] == false) {
        if (!messageObject['authresult']) {
            isConnected = false;
            return;
        }
        return;
    }

    if (messageObject['alert_image'] !== undefined) {
        var imageData = messageObject['alert_image'],
            imageArray,
            imageFile,
            imageVolume = 0.8,
            imageFileBasename,
            duration;

        debugMsg('alert_image(' + imageData + ')');
        if (imageData.indexOf(',') !== -1) {
            imageArray = imageData.split(',');
            imageFile = imageArray[0];
            duration = imageArray[1] * 1000;
            if (imageArray[2] !== undefined) {
                imageVolume = imageArray[2];
            }
        } else {
            imageFile = imageData;
            duration = 3000;
        } 
        imageFileBasename = imageFile.substring(0, imageFile.indexOf('.'));
        $("#imageLocation img").attr('src','');
        $("#imageLocation").html('<img src="/alerts/data/' + imageFile + '">').fadeIn(1000);

        // If the file doesn't exist a DOM error is tossed to the Console.
        var audioObj = new Audio('/alerts/data/' + imageFileBasename + '.mp3');
        audioObj.volume = imageVolume;
        audioObj.play();

        setTimeout(function() { $("#imageLocation").fadeOut(1000); }, duration);
    }
}
