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

/*
 * Filename : panelUtils.js
 * Purpose  : Contains utilities for the control panel.
 */
var DEBUG_MODE = false;
var PANEL_VERSION = "1.1";
var TABS_INITIALIZED = false;
var INITIAL_WAIT_TIME = 200;
var TIMEOUT_WAIT_TIME = 500;
var YOUTUBE_IFRAME = false;

var url = window.location.host.split(":");
var addr = (getProtocol() == 'https://' ? 'wss://' : 'ws://') + url[0] + ':' + getPanelPort();
//var connection = new WebSocket(addr, []);
var connection = new ReconnectingWebSocket(addr, null, {reconnectInterval: 5000});
var isConnected = false;
var panelStatsEnabled = false;
var inputFieldInFocus = false;

var onMessageArray = [];
var doQueryArray = [];
var modulePanelArray = [];
var panelRefreshTimeout = null;

/**
 * @function debugMsg
 * @param {String} message
 */
function debugMsg(message) {
    if (DEBUG_MODE) console.log('WebPanel::DEBUG::' + message);
}

/**
 * @function logMsg
 * @param {String} message
 */
function logMsg(message) {
    console.log('WebPanel::' + message);
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
    newPanelAlert('Connecting to WebSocket', 'success', 1000);
    isConnected = true;
}

/**
 * @event connection.onclose
 * Triggered when the WebSocket connection is closed by the bot.
 */
connection.onclose = function(data) {
    debugMsg('connection.onclose()');
    newPanelAlert('WebSocket Disconnected - Retrying Connection Every 5 Seconds', 'danger', 0);
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
            newPanelAlert('Authorization Failed! Check Configuration File', 'danger', 0);
            return;
        }
        return;
    }

    // Look for the tag in the return value of the message to route to the proper onMessage handler.
    // If new panels are added a new tag MUST be created and implemented.
    //
    var messageKey;
    for ( messageKey in onMessageArray ) {

        eIndex = messageKey + '_';
        if ( e.data.indexOf( eIndex ) !== -1 ) {

            for( var idx = 0 in onMessageArray[ messageKey ] ) {
                if ( typeof onMessageArray[ messageKey ][ idx ] == 'function' ) {
                    onMessageArray[ messageKey ][ idx ]( e );
                }
            }

        }

    }
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
 * @function requestVersion
 * @param {String} unique_id
 */
function requestVersion(unique_id) {
    var jsonObject = {};
    jsonObject["version"] = unique_id;
    connection.send(JSON.stringify(jsonObject));
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

/**
 * @function sendDBKeysList
 * @param {String} unique_id
 * @param {Array}{String} tables
 */
function sendDBKeysList(unique_id, tableList) {
    jsonObject = {};
    jsonObject["dbkeyslist"] = unique_id;
    jsonObject["query"] = [];
    for (i in tableList) {
        jsonObject["query"].push({ "table": tableList[i] });
    }
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function sendDBUpdate
 * @param {String} unique_id
 * @param {String} table
 * @param {String} key
 * @param {String} value
 */
function sendDBUpdate(unique_id, table, key, value) {
    jsonObject = {};
    jsonObject["dbupdate"] = unique_id;
    jsonObject["update"] = { "table" : table, "key" : key, "value" : value };
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function sendDBIncr
 * @param {String} unique_id
 * @param {String} table
 * @param {String} key
 * @param {String} value
 */
function sendDBIncr(unique_id, table, key, value) {
    jsonObject = {};
    jsonObject["dbincr"] = unique_id;
    jsonObject["incr"] = { "table" : table, "key" : key, "value" : value };
    connection.send(JSON.stringify(jsonObject));
}
/**
 * @function sendDBDecr
 * @param {String} unique_id
 * @param {String} table
 * @param {String} key
 * @param {String} value
 */
function sendDBDecr(unique_id, table, key, value) {
    jsonObject = {};
    jsonObject["dbdecr"] = unique_id;
    jsonObject["decr"] = { "table" : table, "key" : key, "value" : value };
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function sendDBDelete
 * @param {String} unique_id
 * @param {String} table
 * @param {String} key
 */
function sendDBDelete(unique_id, table, key) {
    jsonObject = {};
    jsonObject["dbdelkey"] = unique_id;
    jsonObject["delkey"] = { "table" : table, "key" : key };
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function sendWSEvent
 * @param {String} event_id
 * @param {String} script
 * @param {String} argsString
 * @param {Array} args
 */
function sendWSEvent(event_id, script, argsString, args) {
    jsonObject = {};
    jsonObject['socket_event'] = event_id;
    jsonObject['script'] = script;
    jsonObject['args'] = { 'arguments': (argsString ? argsString : ''), 'args': (args ? args : []) };
    connection.send(JSON.stringify(jsonObject));
}

/**
 * @function panelStrcmp
 * @param {String} a
 * @param {String} b
 * @return {Number} match == 0; no match != 0
 *
 * Note that the below will not work on interational strings, only
 * ASCII compares.  If international strings are in play, then
 * localeCompare should be used instead.
 */
function panelStrcmp(a, b) {
    return ( ( a == b ) ? 0 : ( ( a > b ) ? 1 : -1 ) );
}

/**
 * @function panelMatch
 * @param {String} a
 * @param {String} b
 * @return {Boolean}
 */
function panelMatch(a, b) {
   return (panelStrcmp(a, b) === 0);
}

/**
 * @function panelIsDefined
 * @param {Object}
 * @return {Boolean}
 */
function panelIsDefined(obj) {
    return (obj !== undefined);
}

/**
 * @function panelHasQuery
 * @param {Object}
 * @return {Boolean}
 */
function panelHasQuery(obj) {
    return (panelIsDefined(obj['query_id']));
}

/**
 * @function panelCheckQuery
 * @param {Object}
 * @return {Boolean}
 */
function panelCheckQuery(obj, query_id) {
    return (panelMatch(obj['query_id'], query_id));
}

/**
 * @function hideLoadingImage
 * Callback to hide the chat loading image and to enable the chat
 * to be resizable.
 */
function hideLoadingImage() {
    setTimeout(function() {
        $("#iframeLoader").hide();
        $("#chat").fadeIn(1000);
        $(function() { $("#chatsidebar").resizable(); });
    }, 500);
}

/**
 * @function handleInputFocus
 * Checks for input focus on a page. This needs to be on every HTML
 * page and must be called after generating HTML that has form inputs.
 */
function handleInputFocus() {
    $(':input[type="number"]').focusin(function() { setInputFocus(true); });
    $(':input[type="number"]').focusout(function() { setInputFocus(false); });
    $(':input[type="text"]').focusin(function() { setInputFocus(true); });
    $(':input[type="text"]').focusout(function() { setInputFocus(false); });
}

/**
 * @function setInputFocus
 * Stores if a field is in focus or not.
 */
function setInputFocus(value) {
   inputFieldInFocus = value;
}

/**
 * @function isInputFocus
 * Returns if there is a form with input focus.
 */
function isInputFocus() {
    return inputFieldInFocus;
}

/**
 * @function performCurrentPanelRefresh
 * Refreshes the current panel.
 */
function performCurrentPanelRefresh() {
    var active = $("#tabs").tabs("option", "active"),
        tabs = $("#tabs").tabs("instance").tabs,
        functionToCall = $(tabs[active]).data('phantombot-tab');
    clearTimeout(panelRefreshTimeout)
    if (doQueryArray[functionToCall] && typeof doQueryArray[functionToCall] == 'object' && !isInputFocus()) {
        var timeoutTime = null;
        newPanelAlert('Refreshing Data', 'success', 1000);
        for (var idx = 0 in doQueryArray[functionToCall]) {
            if (typeof doQueryArray[functionToCall][idx].func == 'function') {
                doQueryArray[functionToCall][idx].func();
                if (timeoutTime == null || timeoutTime > doQueryArray[functionToCall][idx].time) {
                    timeoutTime = doQueryArray[functionToCall][idx].time;
                }
            }
        }

        if (timeoutTime > 0) {
            panelRefreshTimeout = setTimeout(performCurrentPanelRefresh, timeoutTime);
        }

    }
}
/**
 * Adds do queries into a hook list. Used by performCurrentPanelRefresh
 * @param {string} uniqueId     Unique identifier
 * @param {function} func       doQuery function
 */
function addDoQuery(uniqueId, func, time) {

    if (!time || typeof time != 'number') {
        time = 0;
    }

    if (typeof doQueryArray[uniqueId] != 'object') {
        doQueryArray[uniqueId] = []
    }

    doQueryArray[uniqueId].push({ func : func, time : time });

}

/**
 * Adds on message queries into a hook list. Used by connection.onmessage
 * @param {string} uniqueId     Unique identifier
 * @param {function} func       doQuery function
 */
function addOnMessage(uniqueID, func) {

    var uniqueID = uniqueID.trim('_');
    if (typeof onMessageArray[uniqueID] != 'object') {
        onMessageArray[uniqueID] = [];
    }

    onMessageArray[uniqueID].push(func);

}

/**
 * Return active tab
 * @return {object} Tab object
 */
function getActiveTab() {
    var active = $("#tabs").tabs("option", "active"),
    tabs = $("#tabs").tabs("instance").tabs;

    return $(tabs[active]);
}

/**
 * Tab hook to load in a new tab to the panel
 * @param {string} uniqueID
 * @param {string} tabText       Text to display in the tab bar
 * @param {string} panelHTMLPath The path to the html file to load in
 * @param {int} position      The position to appear in the tab list
 */
function addPanelTab(uniqueID, tabText, panelHTMLPath, position) {
    if (!position) {
        position = 9999;
    }

    while (modulePanelArray[position] != undefined) {
        position++;
    }

    modulePanelArray[position] = {
        id : uniqueID,
        tabText : tabText,
        panelHTMLPath : panelHTMLPath
    };

}

/**
 * Function to insert the queued tabs and panels
 */
function buildPanel(callbackFunction) {

    loadCustomModules(function() {
        modulePanelArray = modulePanelArray.filter(Boolean).reverse();
        var i = 0;
        for (i; i < modulePanelArray.length; i++) {

            $('<div>').attr('role', 'tabpanel').addClass('tab-pane').prop('id', modulePanelArray[i].id).append(
                $('<div>').prop('id', modulePanelArray[i].id + 'Panel')
            ).insertAfter($('#dashboard'));

            $('<li>').data('phantombot-tab', modulePanelArray[i].id).append(
                $('<a>').attr('href', '#' + modulePanelArray[i].id).text(modulePanelArray[i].tabText)
            ).insertAfter($('li[data-tab-list]'));

            $('#' + modulePanelArray[i].id + 'Panel').load(modulePanelArray[i].panelHTMLPath);

        }
        callbackFunction();
    })



}

var interval = setInterval(function() {
    if (isConnected && TABS_INITIALIZED) {
        for(var idx = 0 in doQueryArray) {

            for(var idx2 = 0 in doQueryArray[idx]) {
                if (typeof doQueryArray[idx][idx2].func == 'function') {
                    doQueryArray[idx][idx2].func();
                }
            }
        }
        setTimeout(performCurrentPanelRefresh,3e4);
        clearInterval(interval);
    }
}, INITIAL_WAIT_TIME);

/**
 * Load up custom modules from the panel/custom folder via ajax
 */
function loadCustomModules(callbackFunction) {

    try {

        var customModules = [];
        $.ajax({
            url : "/panel/custom/",
            success : function( d ) {
                customModules = d.split( "\n" ) ;
            },
            error : function() {
                //die quetly
            }
        }).then(function() {

            var $allAjax = [];

            for (var i = 0 in customModules) {
                if ( ! customModules[i] ) { continue; }
                if ( customModules[i].indexOf( '.md' ) > -1 ) { continue; }
                if ( customModules[i].indexOf( '.txt' ) > -1 ) { continue; }

                $allAjax.push($.ajax({
                    url : "/panel/custom/" + customModules[i] + "/" + customModules[i] + ".js",
                    success : function( d ) {
                        var script = document.createElement("script");
                        script.setAttribute("type", "text/javascript");
                        script.appendChild( document.createTextNode( d ) )
                        document.body.appendChild( script );
                    },
                    error : function( d ) {
                        // Die quietly
                    },
                    complete : function( xhr, data ) {
                        if ( 'error' == data ) {
                            var urlParts = this.url.split( '/' );
                            alert( 'Failed to load ' + urlParts.pop() + "\nThis may cause some custom functionality to stop working.\nIt is recommended that you remove the directory or file " + urlParts.pop() )
                        }

                    }
                }))
            }

            $.when.apply($, $allAjax).done( function() {
                callbackFunction();
                return;
            }).fail( function(e) {
                callbackFunction();
                return;
            })

        })

    } catch(err) {
        console.log ('Something went wrong');
        callbackFunction();
        return;
    }


}