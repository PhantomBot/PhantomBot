/*
 * Copyright (C) 2016-2018 phantombot.tv
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
 * quotesPanel.js
 */

(function () {
    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
                html = '',
                id = '',
                quoteData = [];

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'quotes_quotemessage')) {
                if (msgObject['results']['quoteMessage'] !== null) {
                    $('#quoteMessageInput').val(msgObject['results']['quoteMessage']);
                }
            }

            if (panelCheckQuery(msgObject, 'quotes_quotes')) {
                if (msgObject['results'].length === 0) {
                    $('#quoteList').html('<i>No Quotes Are Defined</i>');
                    return;
                }

                html = '<table>';
                for (var idx in msgObject['results']) {
                    id = msgObject['results'][idx]['key'];
                    quoteData = JSON.parse(msgObject['results'][idx]['value']);
                    quoteDataClean = JSON.parse(msgObject['results'][idx]['value']);
                    quoteDataClean[1] = quoteDataClean[1].replace(/,/g, '%2C').replace(/"/g, '\'\'').replace(/'/g, '%27');
                    html += '<tr style="textList">' +
                            '    <td rowspan="2" style="width: 25px">' +
                            '        <div id="deleteQuote_' + id + '" type=\"button\" class=\"btn btn-default btn-xs\"' +
                            '             onclick="$.deleteQuote(\'' + id + '\')"><i class="fa fa-trash" />' +
                            '        </div>' +
                            '    </td>' +
                            // ID and Date
                            '    <td>ID: ' + id + '</td>' +
                            '    <td style="vertical-align: middle">' +
                            '        Date: ' + $.format.date(parseInt(quoteData[2]), 'MM.dd.yy') +
                            '    </td>' +
                            // User
                            '    <td style="vertical-align: middle">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input type="text" class="input-control" id="inlineQuoteEdit_user_' + id + '"' +
                            '                   value="' + quoteData[0] + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updateQuote(\'' + id + '\', \'' + quoteDataClean + '\', \'user\')">' +
                            '                <i class="fa fa-hdd-o" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>' +
                            // Quote
                            '<tr style="textList">' +
                            '    <td colspan="4" style="vertical-align">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input style="width: 89%" type="text" class="input-control" id="inlineQuoteEdit_quote_' + id + '"' +
                            '                   value="' + quoteData[1].replace(/"/g, '\'\'') + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updateQuote(\'' + id + '\', \'' + quoteDataClean + '\', \'quote\')">' +
                            '                <i class="fa fa-hdd-o" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>';
                }
                html += '</table>';
                $('#songHistoryList').html(html);
                handleInputFocus();
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('quotes_quotes', 'quotes');
        sendDBQuery('quotes_quotemessage', 'settings', 'quoteMessage');
    }

    // Import the HTML file for this panel.
    $("#quotesPanel").load("/panel/quotes.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function () {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 10) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function () {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 10 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Song History Data', 'success', 1000);
            if (!isDeleting) {
                doQuery();
            }
        }
    }, 3e4);

    // Export to HTML
    $.quotesOnMessage = onMessage;
    $.songhistoryDoQuery = doQuery;
    $.deleteQuote = deleteQuote;
    $.updateQuote = updateQuote;
    $.addQuote = addQuote;
    $.setQuoteMessage = setQuoteMessage;
    $.delQuoteMsg = delQuoteMsg;
})();
