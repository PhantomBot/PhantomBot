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
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBQuery('games_roulette', 'roulette', 'timeoutTime');
        sendDBKeys('games_adventure', 'adventureSettings');
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
        if (active == 15 && isConnected) {
            newPanelAlert('Refreshing Games Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);


    // Export to HTML
    $.gamesOnMessage = onMessage;
    $.rouletteTimeout = rouletteTimeout;
    $.adventureStart = adventureStart;
    $.adventureUpdateSetting = adventureUpdateSetting;
})();
