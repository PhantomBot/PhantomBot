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
 * @author ScaniaTV
 */

(function() {

	/*
     * @function onMessage
     *
     * @param {String} message
     */
    function onMessage(message) {
    	var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
        	console.error('Failed to parse panel message [queuePanel.js]: ' + ex.message);
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'queue_list')) {
            	var keys = msgObject['results'],
            		html = '<table style="width: 100%"><tr><th>Username</th><th style="padding-left: 50px;">GamerTag</th><th style="padding-left: 50px;">Position</th><th style="padding-left: 50px;">Join Time</th><th style="float: right;"></td>',
            		jsonObj = '',
            		i;

            	if (keys.length === 0) {
            		$('#queue-list').html('<i>The queue list is currently empty.</i>');
            		return;
            	}

            	for (i in keys) {
            		jsonObj = JSON.parse(keys[i]['value']);

            		html += '<tr>' +
                        '<td>' + jsonObj.username + '</td>' +
                        '<td style="padding-left: 50px;">' + (jsonObj.tag === '' ? 'None' : jsonObj.tag.substring(0, 15)) + '</td>' +
                        '<td style="padding-left: 50px;">' + jsonObj.position + '</td>' +
                        '<td style="padding-left: 50px;">' + jsonObj.time + '</td>' +
                        '<td style="float: right;"><button type="button" id="delete_user_' + jsonObj.username + '" class="btn btn-default btn-xs" onclick="$.runCommand(\'remove\', \'' + [jsonObj.username] + '\')"><i class="fa fa-trash"/></button></td>' +
                        '</tr>';
            	}
            	html += '</table>';
            	$('#queue-list').html(html);
            }
        }
    }

    /*
     * @function onMessage
     */
    function doQuery() {
    	sendDBKeys('queue_list', 'queue');
    	// sendDBKeys('queue_selected', 'queueSelected');
    }

    /*
     * @function runCommand
     *
     * @param {String} command
     */
    function runCommand(command, args) {
    	if (command == 'clear') {
    		sendWSEvent('queue', './systems/queueSystem.js', null, ['clear']);
    	} else if (command == 'close') {
    		sendWSEvent('queue', './systems/queueSystem.js', null, ['close']);
    	} else if (command == 'remove') {
    		$('#delete_user_' + args).html('<i style="color: #6136b1" class="fa fa-spinner fa-spin"/>');
    		sendWSEvent('queue', './systems/queueSystem.js', null, ['remove', args]);
    	} else if (command == 'open') {
    		var title = $('#queue-title').val(),
    			size = $('#queue-size').val();

    		if (title !== undefined && size !== undefined) {
    			sendWSEvent('queue', './systems/queueSystem.js', null, ['open', size, title]);
    		}
    		$('#queue-title').val('');
    		$('#queue-size').val('0');
    	} else if (command == 'pick') {
    		var amount = $('#queue-amount').val();

    		if (amount !== undefined) {
    			sendWSEvent('queue', './systems/queueSystem.js', null, ['pick', amount]);
    		}
    		$('#queue-amount').val('1');
    	}
    	setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /* Import the HTML file for this panel. */
    $('#queuePanel').load('/panel/queue.html');

    /* Load the DB items for this panel, wait to ensure that we are connected. */
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 0) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    /* Query the DB every 20 seconds for updates. */
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 16 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Queue Data', 'success', 1000);
            doQuery();
        }
    }, 2e4);

    $.queueOnMessage = onMessage;
    $.queueDoQuery = doQuery;
    $.runCommand = runCommand;
})();
