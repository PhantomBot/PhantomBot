/*
 * Copyright (C) 2016 phantombot.tv
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
 * gamblingPanel.js
 */

(function() {
    var eligibility;

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
            winner = '',
            amount = '';

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }


        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'gambling_betsettings')) {
                for (idx in msgObject['results']) {
                    $('#' + msgObject['results'][idx]['key'] + 'Input').attr('placeholder', msgObject['results'][idx]['value']).blur();
                }
            }

            if (panelCheckQuery(msgObject, 'gambling_rafflesettings')) {
                for (idx in msgObject['results']) {
                    var value = msgObject['results'][idx]['value'],
                        key = msgObject['results'][idx]['key'];

                    if (key == 'raffleMessage') {
                        $('#raffle-message-input').val(value);
                    }

                    if (key == 'raffleMessageInterval') {
                        if (value == 0) {
                            $('#raffle-message-timer2').html('Disabled');
                            $('#raffle-message-timer').html('0');
                        } else {
                            $('#raffle-message-timer2').html(value + ' Minutes');
                            $('#raffle-message-timer').val(value);
                        }
                    }

                    if (key == 'noRepickSame') {
                        if (value == 'true') {
                            $('#raffle-repick').html('No');
                        } else {
                            $('#raffle-repick').html('Yes');
                        }
                    }

                    if (key == 'raffleWhisperWinner') {
                        if (value == 'true') {
                            $('#raffle-whisper-winner').html('Yes');
                        } else {
                            $('#raffle-whisper-winner').html('No');
                        }
                    }

                    if (key == 'raffleMSGToggle') {
                        if (value == 'true') {
                            $('#raffle-message').html('Enabled');
                        } else {
                            $('#raffle-message').html('Disabled');
                        }
                    }
                }
            }

            if (panelCheckQuery(msgObject, 'gambling_betresults')) {
                for (idx in msgObject['results']) {
                    if (panelMatch(msgObject['results'][idx]['key'], 'winners')) {
                        winner = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'amount')) {
                        amount = msgObject['results'][idx]['value'];
                    }
                }
                if (winner.length > 0) {
                    $('#betResults').html('<strong>Results from Last Bet</strong><br>' +
                                          'Winner(s): ' + winner + '<br>' +
                                          'Amount Won: ' + amount);
                }
            }

            if (panelCheckQuery(msgObject, 'gambling_auctionresults')) {
                for (idx in msgObject['results']) {
                    if (panelMatch(msgObject['results'][idx]['key'], 'winner')) {
                        winner = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'amount')) {
                        amount = msgObject['results'][idx]['value'];
                    }
                }
                if (winner.length > 0) {
                    $('#auctionResults').html('<strong>Results from Last Auction</strong><br>' +
                                          'Winner: ' + winner + '<br>' +
                                          'Amount Paid: ' + amount);
                } 
            }

            if (panelCheckQuery(msgObject, 'gambling_raffleresults')) {
                winner = msgObject['results']['winner'];
                if (winner !== null) {
                    $('#raffleResults').html('<strong>Winner of Last Raffle: </strong>' + winner);
                }
            }


            if (panelCheckQuery(msgObject, 'gambling_traffleresults')) {
                winner = msgObject['results']['winner'];
                if (winner !== null) {
                    $('#traffleResults').html('<strong>Winner of Last Ticket Raffle: </strong>' + winner);
                }
            }

            if (panelCheckQuery(msgObject, 'gambling_trafflemessage')) {
                $('#traffleMsg').val(msgObject['results']['traffleMessage']);
            }

            if (panelCheckQuery(msgObject, 'gambling_traffletimer')) {
                $('#traffleTimer').val(msgObject['results']['traffleMessageInterval']);
            }

            if (panelCheckQuery(msgObject, 'gambling_rafflemsgtoggle')) {
                if (panelMatch(msgObject['results']['raffleMSGToggle'], 'true')) {
                    $('#raffleEnterMsg').attr('checked', 'checked');
                }
            }

            if (panelCheckQuery(msgObject, 'gambling_trafflemsgtoggle')) {
                if (panelMatch(msgObject['results']['tRaffleMSGToggle'], 'true')) {
                    $('#traffleEnterMsg').attr('checked', 'checked');
                }
            }

            if (panelCheckQuery(msgObject, 'gambling_rafflelistentries')) {
                amount = msgObject['results']['raffleEntries'];
                if (amount === null || amount === undefined || amount === 0) {
                    $("#raffleentries").html("0");
                }
                $("#raffleentries").html(msgObject['results']['raffleEntries']);
            }

            if (panelCheckQuery(msgObject, 'gambling_trafflelistentries')) {
                amount = msgObject['results']['ticketRaffleEntries'];
                if (amount === null || amount === undefined || amount === 0) {
                    $("#traffleentries").html("0");
                }
                $("#traffleentries").html(msgObject['results']['ticketRaffleEntries']);
            }

            if (panelCheckQuery(msgObject, 'gambling_rafflelist')) {
                var raffleList = msgObject['results'],
                    html = "",
                    username = "";

                html = "<table>";
                for (var idx = 0; idx < raffleList.length; idx++) {
                    username = raffleList[idx]['key'];
                    html += "<tr class=\"textList\">" +
                            "    <td style=\"vertical-align: middle; width: 50%\">" + username + "</td>" +
                            "    <td style=\"vertical-align: middle width: 25%\">" +
                            "</tr>";
                }
                html += "</table>";
                $("#raffleListTable").html(html);
            }

        if (panelCheckQuery(msgObject, 'gambling_trafflelist')) {
                var ticketsList = msgObject['results'],
                    html = "",
                    username = "",
                    tickets = "";

            html = "<table>";
            for (var idx = 0; idx < ticketsList.length; idx++) {
                username = ticketsList[idx]['key'];
                tickets = ticketsList[idx]['value'];
                html += "<tr class=\"textList\">" +
                        "    <td style=\"vertical-align: middle; width: 50%\">" + username + "</td>" +
                        "    <td style=\"vertical-align: middle; width: 25%\">" + tickets + "</td>" +
                        "    <td style=\"vertical-align: middle width: 25%\">" +
                        "</tr>";
                }
                html += "</table>";
                $("#traffleListTable").html(html);
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('gambling_betsettings', 'betSettings');
        sendDBKeys('gambling_rafflesettings', 'raffleSettings');
        sendDBKeys('gambling_betresults', 'betresults');
        sendDBKeys('gambling_auctionresults', 'auctionresults');
        sendDBQuery('gambling_raffleresults', 'raffleresults', 'winner');
        sendDBQuery('gambling_traffleresults', 'traffleresults', 'winner');
        sendDBKeys('gambling_rafflelist', 'raffleList');
        sendDBKeys('gambling_trafflelist', 'ticketsList');
        sendDBQuery('gambling_trafflemsgtoggle', 'settings', 'tRaffleMSGToggle');
        sendDBQuery('gambling_traffletimer', 'settings', 'traffleMessageInterval');
        sendDBQuery('gambling_trafflemessage', 'settings', 'traffleMessage');
        sendDBQuery('gambling_rafflelistentries', 'raffleresults', 'raffleEntries');
        sendDBQuery('gambling_trafflelistentries', 'raffleresults', 'ticketRaffleEntries');
    }

    /**
     * @function betHandler
     * @param {String} action
     * @param {String} id
     */
    function betHandler(action, id) {
        var value = $('#' + id).val();

        if (value.length > 0) {
            sendCommand('bet ' + action + ' ' + value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);

            if (panelMatch(action, 'close')) {
                $('#betOpenInput').val('');
                $('#betCloseInput').val('');
            }
        }
    }

    /**
     * @function auctionOpen
     */
    function auctionOpen() {
        var increment = $('#auctionIncrementInput').val(),
            bet = $('#auctionBetInput').val(),
            timer = $('#auctionTimerInput').val();

        if (increment.length > 0 && bet.length > 0) {
            sendCommand('auction open ' + increment + ' ' + bet + ' '  + timer);
            $('#auctionIncrementInput').val(''),
            $('#auctionBetInput').val(''),
            $('#auctionTimerInput').val('');
        }
    }

    /**
     * @function auctionClose
     */
    function auctionClose() {
        sendCommand('auction close');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function timeRaffleOpen
     */
    function timeRaffleOpen() {
        var keyword = $('#raffle-time-keyword').val(),
            minimumTime = $('#raffle-time-cost').val(),
            timer = $('#raffle-normal-timer').val(),
            reg = $('#raffle-normal-regluck').val(),
            sub = $('#raffle-normal-subluck').val();

        if (keyword.length == 0 && minimumTime.length == 0) {
            return;
        }

        if (sub == 0) {
            sub = 1
        }

        if (reg == 0) {
            reg = 1
        }

        sendDBUpdate('raffle_sub_luck', 'raffleSettings', 'subscriberBonusRaffle', String(sub));
        sendDBUpdate('raffle_sub_luck', 'raffleSettings', 'regularBonusRaffle', String(reg));
        sendCommand('reloadraffle');

        sendCommand('raffle open ' + minimumTime + ' ' + keyword + ' ' + timer + ' ' + eligibility + ' -usetime');
        $('#raffle-keyword').val('');
        $('#raffle-cost').val('');
        $('#raffle-time-sub').html('1 Times');
        $('#raffle-time-reg').html('1 Times');
        $('#raffle-time-timer2').html('Until closed');
        $('#raffle-normal-timer').val('0');
        $('#raffle-normal-regluck').val('0');
        $('#raffle-normal-subluck').val('0');
    }

    /**
     * @function pointsRaffleOpen
     */
    function pointsRaffleOpen() {
        var keyword = $('#raffle-keyword').val(),
            minimumTime = $('#raffle-cost').val(),
            timer = $('#raffle-normal-timer').val(),
            reg = $('#raffle-normal-regluck').val(),
            sub = $('#raffle-normal-subluck').val();

        if (keyword.length == 0 && minimumTime.length == 0) {
            return;
        }

        sendDBUpdate('raffle_sub_luck', 'raffleSettings', 'subscriberBonusRaffle', String(sub));
        sendDBUpdate('raffle_sub_luck', 'raffleSettings', 'regularBonusRaffle', String(reg));
        sendCommand('reloadraffle');

        sendCommand('raffle open ' + minimumTime + ' ' + keyword + ' ' + timer + ' ' + eligibility + ' -usepoints');
        $('#raffle-keyword').val('');
        $('#raffle-cost').val('');
        $('#raffle-points-sub').html('1 Times');
        $('#raffle-points-reg').html('1 Times');
        $('#raffle-points-timer2').html('Until closed');
        $('#raffle-normal-timer').val('0');
        $('#raffle-normal-regluck').val('0');
        $('#raffle-normal-subluck').val('0');
    }

    /**
     * @function normalRaffleOpen
     */
    function normalRaffleOpen() {
        var keyword = $('#raffle-normal-keyword').val(),
            timer = $('#raffle-normal-timer').val(),
            reg = $('#raffle-normal-regluck').val(),
            sub = $('#raffle-normal-subluck').val();

        if (keyword.length == 0) {
            return;
        }

        sendDBUpdate('raffle_sub_luck', 'raffleSettings', 'subscriberBonusRaffle', String(sub));
        sendDBUpdate('raffle_sub_luck', 'raffleSettings', 'regularBonusRaffle', String(reg));
        sendCommand('reloadraffle');

        sendCommand('raffle open ' + keyword + ' ' + timer + ' ' + eligibility);
        $('#raffle-normal-keyword').val('');
        $('#raffle-normal-sub').html('1 Times');
        $('#raffle-normal-reg').html('1 Times');
        $('#raffle-normal-timer2').html('Until closed');
        $('#raffle-normal-timer').val('0');
        $('#raffle-normal-regluck').val('0');
        $('#raffle-normal-subluck').val('0');
    }

    /**
     * @function raffleSettings
     */
    function raffleSettings() {
        var message = $('#raffle-message-input').val(),
            interval = $('#raffle-message-timer').val();

        console.log(message + ' ' + interval);

        sendDBUpdate('raffle_settings_set', 'raffleSettings', 'raffleMessage', message);
        sendDBUpdate('raffle_settings_set', 'raffleSettings', 'raffleMessageInterval', String(interval));
        sendCommand('reloadraffle');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function raffleClose
     */
    function raffleClose() {
        sendCommand('raffle close');
    }

    /**
     * @function raffleRepick
     */
    function raffleRepick() {
        sendCommand('raffle repick');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function setEligibility
     */
    function setEligibility(value) {
        if (value == 'followers') {
            eligibility = '-followers';
        } else {
            eligibility = '';
        }
    }

    /**
     * @function dropdownSet
     */
    function dropdownSet(table, key, value) {
        sendDBUpdate('dropdown_set', table, key, value);
        sendCommand('reloadraffle');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function traffleRepick
     */
    function traffleRepick() {
        sendCommand('traffle repick');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function traffleClose
     */
    function traffleClose() {
        sendCommand('traffle close');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function traffleOpen
     */
    function traffleOpen() {
        var max = $('#traffleMaxInput').val(),
            cost = $('#traffleCostInput').val(),
            followers = $('#traffleFollowerInput:checked').val();

        if (max.length > 0 && cost.length > 0) {
            sendCommand('traffle open ' + max + ' ' + cost + ' ' + followers);
            $('#traffleMaxInput').val(''),
            $('#traffleCostInput').val(''),
            $('#traffleFollowerInput:checkbox').removeAttr('checked');
        }
    }

    function toggleTRaffleMsg() {
        var value = $('#traffleEnterMsg').attr('checked', 'checked');

        if ($('#traffleEnterMsg').is(':checked') === true) {
            sendDBUpdate("gambling_trafflemsgtoggle", "settings", "tRaffleMSGToggle", 'true');
        } else {
            sendDBUpdate("gambling_trafflemsgtoggle", "settings", "tRaffleMSGToggle", 'false');
        }
        setTimeout(function() { sendCommand("reloadtraffle"); }, TIMEOUT_WAIT_TIME);
    }

    function updateTRaffleSettings(setting) {
        var value = $('#' + setting).val();

        if (setting == "traffleMsg") {
            sendDBUpdate('gambling_trafflemessage', 'settings', 'traffleMessage', value);
        }

        if (setting == "traffleTimer") {
            sendDBUpdate('gambling_trafflemessage', 'settings', 'traffleMessageInterval', value);
        }
        setTimeout(function() { sendCommand("reloadtraffle"); }, TIMEOUT_WAIT_TIME);
    }

    // Import the HTML file for this panel.
    $("#gamblingPanel").load("/panel/gambling.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $("#tabs").tabs("option", "active");
            if (active == 14) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 25 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 14 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Gambling Data', 'success', 1000);
            doQuery();
        }
    }, 2e5);


    // Export to HTML
    $.gamblingOnMessage = onMessage;
    $.gamblingDoQuery = doQuery;
    $.betHandler = betHandler;
    $.auctionOpen = auctionOpen;
    $.auctionClose = auctionClose;
    $.traffleRepick = traffleRepick;
    $.traffleOpen = traffleOpen;
    $.traffleClose = traffleClose;
    $.toggleTRaffleMsg = toggleTRaffleMsg;
    $.updateTRaffleSettings = updateTRaffleSettings;
    $.setEligibility = setEligibility;

    $.raffle = {
        openTime: timeRaffleOpen,
        openPoints: pointsRaffleOpen,
        openNormal: normalRaffleOpen,
        end: raffleClose,
        repick: raffleRepick,
        settings: raffleSettings,
        set: dropdownSet,
    };
})();
