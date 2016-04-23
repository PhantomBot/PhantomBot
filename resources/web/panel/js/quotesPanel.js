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
 * quotesPanel.js
 */

(function() {

    var spinIcon = '<i style="color: #6136b1" class="fa fa-spinner fa-spin" />';

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
                    html += '<tr style="textList">' +
                            '    <td rowspan="2" style="width: 25px">' +
                            '        <div id="deleteQuote_' + id + '" class="button"' +
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
                            '            <input type="text" id="inlineQuoteEdit_user_' + id + '"' +
                            '                   value="' + quoteData[0] + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updateQuote(\'' + id + '\', \'' + quoteData + '\', \'user\')">' +
                            '                <i class="fa fa-pencil" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +

                            // Game
                            '    <td style="vertical-align: middle">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input type="text" id="inlineQuoteEdit_game_' + id + '"' +
                            '                   value="' + (quoteData.length == 4 ? quoteData[3] : 'Some Game') + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updateQuote(\'' + id + '\', \'' + quoteData + '\', \'game\')">' +
                            '                <i class="fa fa-pencil" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>' +

                            // Quote
                            '<tr style="textList">' +
                            '    <td colspan="4" style="vertical-align">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input style="width: 89%" type="text" id="inlineQuoteEdit_quote_' + id + '"' +
                            '                   value="' + quoteData[1] + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updateQuote(\'' + id + '\', \'' + quoteData + '\', \'quote\')">' +
                            '                <i class="fa fa-pencil" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>';
                }
                html += '</table>';
                $('#quoteList').html(html);
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

    /**
     * @function setQuoteMessage
     */
    function setQuoteMessage() {
        var value = $('#quoteMessageInput').val();
        if (value.length > 0) {
            $('#quoteMessageInput').val('Updating...');
            sendCommand('quotemessage ' + value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function deleteQuote
     * @param {String} id
     */
    function deleteQuote(id) {
        $('#deleteQuote_' + id).html(spinIcon);
        sendCommand('delquote ' + id);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 4);
    }

    /**
     * @function updateQuote
     * @param {String} id
     * @param {Object} quoteData
     * @param {String} field
     */
    function updateQuote(id, quoteData, field) {
        var value = $('#inlineQuoteEdit_' + field + '_' + id).val(),
            quoteArray = quoteData.split(',');
        if (value.length > 0) {
            if (panelMatch(field, 'quote')) {
                quoteArray[1] = value;
            }
            if (panelMatch(field, 'game')) {
                quoteArray[3] = value;
            }
            if (panelMatch(field, 'user')) {
                quoteArray[0] = value;
            }
            sendDBUpdate('quotes_update', 'quotes', id, JSON.stringify(quoteArray));
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function addQuote
     */
    function addQuote() {
        var value = $('#addQuoteInput').val();
        if (value.length > 0) {
            $('#addQuoteInput').val('Adding...').blur();
            sendCommand('addquote ' + value);
            setTimeout(function() { doQuery(); $('#addQuoteInput').val(''); }, TIMEOUT_WAIT_TIME * 4);
        }
    }
    

    // Import the HTML file for this panel.
    $("#quotesPanel").load("/panel/quotes.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 10) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 10 && isConnected) {
            newPanelAlert('Refreshing Quotes Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.quotesOnMessage = onMessage;
    $.deleteQuote = deleteQuote;
    $.updateQuote = updateQuote;
    $.addQuote = addQuote;
    $.setQuoteMessage = setQuoteMessage;
})();
