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
 * gamblingPanel.js
 */

(function() {

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
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('gambling_betsettings', 'betSettings');
        sendDBKeys('gambling_betresults', 'betresults');
        sendDBKeys('gambling_auctionresults', 'auctionresults');
        sendDBQuery('gambling_raffleresults', 'raffleresults', 'winner');
        sendDBQuery('gambling_traffleresults', 'traffleresults', 'winner');
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
     * @function raffleRepick
     */
    function raffleRepick() {
        sendCommand('raffle repick');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function raffleClose
     */
    function raffleClose() {
        sendCommand('raffle close');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function raffleOpen
     */
    function raffleOpen() {
        var keyword = $('#raffleKeywordInput').val(),
            cost = $('#raffleCostInput').val(),
            timer = $('#raffleTimerInput').val(),
            followers = $('#raffleFollowerInput:checked').val();

        if (timer.length === 0) {
            timer = "0";
        }
        if (keyword.length > 0 && cost.length > 0) {
            sendCommand('raffle open ' + keyword + ' ' + cost + ' ' + timer + ' ' + followers);
            $('#raffleKeywordInput').val(''),
            $('#raffleCostInput').val(''),
            $('#raffleTimerInput').val(''),
            $('#raffleFollowerInput:checkbox').removeAttr('checked');
        }
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

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 14 && isConnected) {
            newPanelAlert('Refreshing Gambling Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);


    // Export to HTML
    $.gamblingOnMessage = onMessage;
    $.betHandler = betHandler;
    $.auctionOpen = auctionOpen;
    $.auctionClose = auctionClose;
    $.raffleRepick = raffleRepick;
    $.raffleOpen = raffleOpen;
    $.raffleClose = raffleClose;
    $.traffleRepick = traffleRepick;
    $.traffleOpen = traffleOpen;
    $.traffleClose = traffleClose;
})();
