/*
 * Filename : panelUtils.js
 * Purpose  : Contains utilities for the control panel.
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
    if (DEBUG_MODE) console.log("WebPanel::" + message);
}

/**
 * @function logMsg
 * @param {String} message
 */
function logMsg(message) {
    console.log("WebPanel::" + message);
}

/**
 * @event connection.onopen
 * Triggered when the WebSocket connection is opened.
 */
connection.onopen = function(data) {
    var jsonObject = {};
    debugMsg("connection.onopen()");
    jsonObject["authenticate"] = getAuth();
    connection.send(JSON.stringify(jsonObject));
    newPanelAlert('Connecting to WebSocket', 'success', 1000);
    isConnected = true;
}

/**
 * @event connection.onclose
 * Triggered when the WebSocket connection is closed by the bot.
 */
connection.onclose = function(data) {
    debugMsg("connection.onclose()");
    newPanelAlert('WebSocket Disconnected - Restart Panel When Restored', 'danger', 0);
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
    debugMsg("connection.onmessage("+ e.data + ")");

    if (messageObject['authresult'] == false) {
        if (!messageObject['authresult']) {
            newPanelAlert('Authorization Failed! Check Configuration File', 'danger', 0);
            return;
        }
        return;
    }

    logMsg('connection.onmessage: unknownJson(' + e.data + ')');
}

/**
 * @function newPanelAlert
 * @param {String} message
 * @param {String} type (danger, success)
 * @param {Number} timeout (0 = infinite, else timeout in ms)
 */
function newPanelAlert(message, type, timeout) {
  debugMsg("newPanelAlert(" + message + ", " + type + ", " + timeout + ")");
  $(".alert").fadeIn(1000);
  $("#newPanelAlert").show().html('<div class="alert alert-' + type + '"><button type="button" '+
                      'class="close" data-dismiss="alert" aria-hidden="true"></button><span>' + 
                       message + '</span></div>');
  if (timeout != 0) {
      $(".alert-" + type).delay(timeout).fadeOut(1000, function () { $(this).remove(); });
  }
}

/**
 * @function sendCommand
 * @param {String} command
 * @param {String} username
 */
function sendCommand(command, username) {
    var jsonObject = {};
    jsonObject["command"] = command;
    if (username) {
        jsonObject["username"] = username;
    }
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function sendDBQuery
 * @param {String} unique_id
 * @param {String} table
 * @param {String} key
 */
function sendDBQuery(unique_id, table, key) {
    jsonObject = {};
    jsonObject["dbquery"] = unique_id;
    jsonObject["query"] = { "table": table, "key": key };
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function sendDBKeys
 * @param {String} unique_id
 * @param {String} table
 */
function sendDBKeys(unique_id, table) {
    jsonObject = {};
    jsonObject["dbkeys"] = unique_id;
    jsonObject["query"] = { "table": table };
    connection.send(JSON.stringify(jsonObject));
}
