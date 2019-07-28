/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * @author jsnphil
 */

/*
 * history.js
 */

(function() {

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

                            // Date
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

                            // Song name
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
                $('#quoteList').html(html);
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
        if (active == 10 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Song History Data', 'success', 1000);
            if (!isDeleting) {
                doQuery();
            }
        }
    }, 3e4);

    // Export to HTML
    $.quotesOnMessage = onMessage;
    $.quotesDoQuery = doQuery;
})();