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
 * gamesPanel.js
 */

(function() {
    var toggleIcon = [],
        saveBets = false,
        toggleWarningMessage = false;

        toggleIcon['false'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle-o\" />";
        toggleIcon['true'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle\" />";
    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject = JSON.parse(message.data);

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
                    if (msgObject['results'][idx]['key'] == 'warningMessage') {
                        $('#adventure' + msgObject['results'][idx]['key']).html(toggleIcon[msgObject['results'][idx]['value']]);
                    }
                    if (msgObject['results'][idx]['key'] == 'enterMessage') {
                        $('#adventure' + msgObject['results'][idx]['key']).html(toggleIcon[msgObject['results'][idx]['value']]);
                    }
                   $('#adventure' + msgObject['results'][idx]['key'] + 'Input').attr('placeholder', msgObject['results'][idx]['value']);
                }
            }

            if (panelCheckQuery(msgObject, 'games_slotmachine')) {
                for (idx in msgObject['results']) {
                    $('#slotRewards' + idx + 'Input').val(msgObject['results'][idx]['value']);
                }
            }

            if (panelCheckQuery(msgObject, 'games_slotmachineemotes')) {
                for (idx in msgObject['results']) {
                    $('#slotEmotes' + idx + 'Input').val(msgObject['results'][idx]['value']);
                }
            }

            if (panelCheckQuery(msgObject, 'games_rollprizes')) {
                for (idx in msgObject['results']) {
                    $('#rollRewards' + idx + 'Input').val(msgObject['results'][idx]['value']);
                }
            }

            if (panelCheckQuery(msgObject, 'games_gambling_range')) {
                $('#gamblingWinRange').val(msgObject['results']['winRange']);
            }

            if (panelCheckQuery(msgObject, 'games_gambling_percent')) {
                $('#gamblingWinPercent').val(msgObject['results']['winGainPercent']);
            }

            if (panelCheckQuery(msgObject, 'games_gambling_max')) {
                $('#gamblingMax').val(msgObject['results']['max']);
            }

            if (panelCheckQuery(msgObject, 'games_gambling_min')) {
                $('#gamblingMin').val(msgObject['results']['min']);
            }

            if (panelCheckQuery(msgObject, 'games_betting')) {
                for (idx in msgObject['results']) {
                    if (msgObject['results'][idx]['key'] == 'gain') {
                        $('#gainPercent').val(msgObject['results'][idx]['value']);
                    } 

                    if (msgObject['results'][idx]['key'] == 'format') {
                        $('#dateFormat').val(msgObject['results'][idx]['value']);
                    }

                    if (msgObject['results'][idx]['key'] == 'save') {
                        $('#toggleSaveBets').html(toggleIcon[msgObject['results'][idx]['value']]);
                        saveBets = msgObject['results'][idx]['value'];
                    }

                    if (msgObject['results'][idx]['key'] == 'warningMessages') {
                        $('#toggleWarningMessages').html(toggleIcon[msgObject['results'][idx]['value']]);
                        toggleWarningMessage = msgObject['results'][idx]['value'];
                    }

                    if (msgObject['results'][idx]['key'] == 'lastBet') {
                        var split = msgObject['results'][idx]['value'].split('___');
                        $('#betResults').html('<strong>Results from Last Bet</strong><br> Winner(s): ' + split[0] + '<br> Amount Won: ' + split[1]);
                    } else {
                        $('#betResults').html('<strong>Results from Last Bet: </strong><br> Winner(s): 0 <br> Amount Won: 0 points');
                    }
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
        sendDBKeys('games_betting', 'bettingSettings');
        sendDBKeys('games_slotmachineemotes', 'slotmachineemotes');
        sendDBKeys('games_rollprizes', 'rollprizes');
        sendDBQuery('games_gambling_range', 'gambling', 'winRange');
        sendDBQuery('games_gambling_percent', 'gambling', 'winGainPercent');
        sendDBQuery('games_gambling_max', 'gambling', 'max');
        sendDBQuery('games_gambling_min', 'gambling', 'min');
    }

    /**
     * @function openBet
     */
    function openBet() {
        var title = $('#betTitle').val(),
            options = $('#betOptions').val(),
            min = $('#minBet').val(),
            max = $('#maxBet').val(),
            timer = $('#bet-timer').val();

        sendCommand('bet open \"' + title + '\" \"' + options + '\" ' + min + ' ' + max + ' ' + timer);
        $('#betTitle').val(''),
        $('#betOptions').val(''),
        $('#minBet').val(''),
        $('#maxBet').val(''),
        $('#bet-timer').val('');
        document.getElementById('bet-timer').value = 0;
    }

    /**
     * @function toggleInput
     */
    function toggleInput() {
        if ($('#tempclose').is(':checked') === true) {
            document.getElementById("betCloseI").disabled = true;
            document.getElementById("betCloseI").title = "You cannot chose a winning option and turn entries off at the same time.";
        } else {
            document.getElementById("betCloseI").disabled = false;
            document.getElementById("betCloseI").title = "";
        }
    }

    /**
     * @function closeBet
     */
    function closeBet() {
        if ($('#tempclose').is(':checked') === true) {
            sendCommand('bet close');
        } else {
            sendCommand('bet close ' + $('#betCloseI').val());
        }
        $('#betCloseI').val('');
        $('#tempclose').val('');
    }

    /**
     * @function updateBet
     */
    function updateBet() {
        if ($('#dateFormat').val().length != 0 || $('#gainPercent').val().length != 0) {
            sendDBUpdate('bet_dateformat', 'bettingSettings', 'format', $('#dateFormat').val());
            sendDBUpdate('bet_dateformat', 'bettingSettings', 'gain', $('#gainPercent').val());
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand('reloadbet'); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleSaveBets
     */
    function toggleSaveBets() {
        $("#toggleSaveBets").html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (saveBets == 'true') {
            sendDBUpdate('bet_dateformat', 'bettingSettings', 'save', 'false');
            saveBets = 'false';
        } else {
            sendDBUpdate('bet_dateformat', 'bettingSettings', 'save', 'true');
            saveBets = 'true';
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand('reloadbet'); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleSaveBets
     */
    function toggleWarningMessages() {
        $("#toggleWarningMessages").html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        if (toggleWarningMessage == 'true') {
            sendDBUpdate('bet_dateformat', 'bettingSettings', 'warningMessages', 'false');
            toggleWarningMessage = 'false';
        } else {
            sendDBUpdate('bet_dateformat', 'bettingSettings', 'warningMessages', 'true');
            toggleWarningMessage = 'true';
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand('reloadbet'); }, TIMEOUT_WAIT_TIME);
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
            sendDBUpdate('rollRewards0', 'rollprizes', 'prizes_0', val0);
            sendDBUpdate('rollRewards1', 'rollprizes', 'prizes_1', val1);
            sendDBUpdate('rollRewards2', 'rollprizes', 'prizes_2', val2);
            sendDBUpdate('rollRewards3', 'rollprizes', 'prizes_3', val3);
            sendDBUpdate('rollRewards4', 'rollprizes', 'prizes_4', val4);
            sendDBUpdate('rollRewards5', 'rollprizes', 'prizes_5', val5);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand('loadprizesroll'); }, TIMEOUT_WAIT_TIME);
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
            sendDBUpdate('slotRewards0', 'slotmachine', 'prizes_0', val0);
            sendDBUpdate('slotRewards1', 'slotmachine', 'prizes_1', val1);
            sendDBUpdate('slotRewards2', 'slotmachine', 'prizes_2', val2);
            sendDBUpdate('slotRewards3', 'slotmachine', 'prizes_3', val3);
            sendDBUpdate('slotRewards4', 'slotmachine', 'prizes_4', val4);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand('loadprizes'); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function setSlotemotes() {
     */
    function setSlotEmotes() {
        var val0 = $('#slotEmotes0Input').val(),
            val1 = $('#slotEmotes1Input').val(),
            val2 = $('#slotEmotes2Input').val(),
            val3 = $('#slotEmotes3Input').val(),
            val4 = $('#slotEmotes4Input').val();
         
        if (val0.length > 0 && val1.length > 0 && val2.length > 0 && val3.length > 0 && val4.length > 0) {
            sendDBUpdate('slotEmotes0', 'slotmachineemotes', 'emote_0', val0);
            sendDBUpdate('slotEmotes1', 'slotmachineemotes', 'emote_1', val1);
            sendDBUpdate('slotEmotes2', 'slotmachineemotes', 'emote_2', val2);
            sendDBUpdate('slotEmotes3', 'slotmachineemotes', 'emote_3', val3);
            sendDBUpdate('slotEmotes4', 'slotmachineemotes', 'emote_4', val4);
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
            sendDBUpdate('games_roulette', 'roulette', 'timeoutTime', time);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand('reloadroulette'); }, TIMEOUT_WAIT_TIME);
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
    function adventureUpdateSetting(setting, l) {
        var value = $('#adventure' + setting + 'Input').val();

        if (setting == 'warningMessage') {
            $("#adventure" + setting).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
            if (l == 'true') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, 'true');
            } else {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, 'false');
            }
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand('reloadadventure') }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (setting == 'enterMessage') {
            $("#adventure" + setting).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
            if (l == 'true') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, 'true');
            } else {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, 'false');
            }
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand('reloadadventure') }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (value.length > 0) {
            if (setting == 'joinTime') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, value);
            }

            if (setting == 'coolDown') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, value);
            }

            if (setting == 'gainPercent') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, value);
            }

            if (setting == 'minBet') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, value);
            }

            if (setting == 'maxBet') {
                sendDBUpdate('games_adventure', 'adventureSettings', setting, value);
            }

           setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
           setTimeout(function() { sendCommand('reloadadventure') }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function gambling
     * @param {String} argument
     */
    function gambling (argument) {
        var value = $('#gambling' + argument).val();

        if (value.length != 0) {
            if (argument == 'Max') {
                sendDBUpdate('games_gambling_max', 'gambling', 'max', value);
            }
            if (argument == 'Min') {
                sendDBUpdate('games_gambling_min', 'gambling', 'min', value);
            }
            if (argument == 'WinRange' && value <= 100) {
                sendDBUpdate('games_gambling_range', 'gambling', 'winRange', value);
            }
            if (argument == 'WinPercent' && value <= 100) {
                sendDBUpdate('games_gambling_percent', 'gambling', 'winGainPercent', value);
            }
        }
        setTimeout(function() { doQuery(); sendCommand('reloadgamble'); }, TIMEOUT_WAIT_TIME);
    };

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
    $.gambling = gambling;
    $.setSlotEmotes = setSlotEmotes;
    $.toggleSaveBets = toggleSaveBets;
    $.toggleInput = toggleInput;
    $.toggleWarningMessages = toggleWarningMessages;
    $.bet = {open: openBet, close: closeBet, update: updateBet };
})();
