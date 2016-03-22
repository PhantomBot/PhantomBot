/*
 * Filename : panelUtils.js
 * Purpose  : Contains utilities for the control panel.
 */
var DEBUG_MODE = false;

var url = window.location.host.split(":");
var addr = 'ws://' + url[0] + ':' + getPanelPort();
var connection = new WebSocket(addr, []);
var isConnected = false;

function debugMsg(message) {
    if (DEBUG_MODE) console.log("WebPanel::" + message);
}
function logMsg(message) {
    console.log("WebPanel::" + message);
}

connection.onopen = function(data) {
    var jsonObject = {};
    debugMsg("connection.onopen()");
    jsonObject["authenticate"] = getAuth();
    connection.send(JSON.stringify(jsonObject));
    newPanelAlert('Connecting to WebSocket', 'success', 1000);
    isConnected = true;
}

connection.onclose = function(data) {
    debugMsg("connection.onclose()");
    newPanelAlert('WebSocket Disconnected - Restart Panel When Restored', 'danger', 0);
    isConnected = false;
}

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
