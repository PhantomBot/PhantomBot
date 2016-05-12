/*
 * Copyright (C) 2016 www.phantombot.net
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
 * gamesPanel.js
 */

(function() {

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'games_roulette')) {
                $('#rouletteTimeoutInput').attr('placeholder', msgObject['results']['timeoutTime']);
            }

            if (panelCheckQuery(msgObject, 'games_adventure')) {
                for (idx in msgObject['results']) {
                   $('#adventure' + msgObject['results'][idx]['key'] + 'Input').attr('placeholder', msgObject['results'][idx]['value']);
                }
            }

            if (panelCheckQuery(msgObject, 'games_slotmachine')) {
                for (idx in msgObject['results']) {
                    $('#slotRewards' + idx + 'Input').val(msgObject['results'][idx]['value']);
                }
            }

            if (panelCheckQuery(msgObject, 'games_rollprizes')) {
                for (idx in msgObject['results']) {
                    $('#rollRewards' + idx + 'Input').val(msgObject['results'][idx]['value']);
                }
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBQuery('games_roulette', 'roulette', 'timeoutTime');
        sendDBKeys('games_adventure', 'adventureSettings');
        sendDBKeys('games_slotmachine', 'slotmachine');
        sendDBKeys('games_rollprizes', 'rollprizes');
    }

    /**
     * @function setRollRewards() {
     */
    function setRollRewards() {
        var val0 = $('#rollRewards0Input').val(),
            val1 = $('#rollRewards1Input').val(),
            val2 = $('#rollRewards2Input').val(),
            val3 = $('#rollRewards3Input').val(),
            val4 = $('#rollRewards4Input').val(),
            val5 = $('#rollRewards5Input').val();

        if (val0.length > 0 && val1.length > 0 && val2.length > 0 && val3.length > 0 && val4.length > 0 && val5.length > 0) {
            sendCommand('roll rewards ' + val0 + ' ' + val1 + ' ' + val2 + ' ' + val3 + ' ' + val4 + ' ' + val5);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function setSlotRewards() {
     */
    function setSlotRewards() {
        var val0 = $('#slotRewards0Input').val(),
            val1 = $('#slotRewards1Input').val(),
            val2 = $('#slotRewards2Input').val(),
            val3 = $('#slotRewards3Input').val(),
            val4 = $('#slotRewards4Input').val();
         
        if (val0.length > 0 && val1.length > 0 && val2.length > 0 && val3.length > 0 && val4.length > 0) {
            sendCommand('slot rewards ' + val0 + ' ' + val1 + ' ' + val2 + ' ' + val3 + ' ' + val4);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function rouletteTimeout
     */
    function rouletteTimeout() {
        var time = $('#rouletteTimeoutInput').val();

        if (time.length > 0) {
            $('#rouletteTimeoutInput').val(time);
            sendCommand('roulettetimeouttime ' + time);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function adventureStart
     */
    function adventureStart() {
        var value = $('#adventureStartInput').val();

        if (value.length > 0) {
            $('#adventureStartInput').val('');
            sendCommand('adventure ' + value, getChannelName());
        }
    }

    /**
     * @function adventureUpdateSetting
     * @param {String} setting
     */
    function adventureUpdateSetting(setting) {
        var value = $('#adventure' + setting + 'Input').val();
        if (value.length > 0) {
           sendCommand('adventure set ' + setting + ' ' + value);
           setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    // Import the HTML file for this panel.
    $("#gamesPanel").load("/panel/games.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $("#tabs").tabs("option", "active");
            if (active == 15) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 15 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Games Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);


    // Export to HTML
    $.gamesOnMessage = onMessage;
    $.gamesDoQuery = doQuery;
    $.rouletteTimeout = rouletteTimeout;
    $.adventureStart = adventureStart;
    $.adventureUpdateSetting = adventureUpdateSetting;
    $.setSlotRewards = setSlotRewards;
    $.setRollRewards = setRollRewards;
})();
