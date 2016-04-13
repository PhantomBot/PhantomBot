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
 * keywordsPanel.js
 */

(function() {

    var spinIcon = '<i style="color: magenta" class="fa fa-spinner fa-spin" />',
        keywordMap = [];

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
            html = '',
            keyword = '';

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'keywords_keywords')) {
                keywordMap = [];
                if (msgObject['results'].length === 0) {
                    $('#keywordsList').html('<i>No Keywords are Defined</i>');
                    return;
                }

                html = '<table>';
                for (idx in msgObject['results']) {
                    keyword = msgObject['results'][idx]['key'];
                    keywordMap[idx] = keyword;
                    html += '<tr style="textList">' +
                            '    <td style="width: 25px">' +
                            '        <div id="deleteKeyword_' + idx + '" class="button"' +
                            '             onclick="$.deleteKeyword(\'' + idx + '\')"><i class="fa fa-trash" />' +
                            '        </div>' +
                            '    </td>' +
                            '    <td style="vertical-align: middle">' + keyword + '</td>' +
                            '    <td style="vertical-align: middle">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input style="width: 90%" type="text" id="inlineKeywordEdit_' + idx + '"' +
                            '                   value="' + msgObject['results'][idx]['value'] + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updateKeyword(\'' + idx + '\')"><i class="fa fa-pencil" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>';
                }
                html += '</table>';
                $('#keywordsList').html(html);
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('keywords_keywords', 'keywords');
    }

    /** 
     * @function addKeyword
     */
    function addKeyword() {
        var keyword = $('#addKeywordInput').val(),
            response = $('#addKeywordResponseInput').val();

        if (keyword.length > 0 && response.length > 0) {
            $('#addKeywordInput').val('Submitting...');
            $('#addKeywordResponseInput').val('Submitting...');
            sendDBUpdate('keywords_addkeyword', 'keywords', keyword, response);
            setTimeout(function() {
                $('#addKeywordInput').val('');
                $('#addKeywordResponseInput').val('');
                doQuery();
            }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function deleteKeyword
     * @param {String} keywordIdx
     */
    function deleteKeyword(keywordIdx) {
        $('#deleteKeyword_' + keywordIdx).html(spinIcon);
        keyword = keywordMap[keywordIdx];
        sendDBDelete('keywords_delkeyword', 'keywords', keyword);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateKeyword
     * @param {String} keyword
     */
    function updateKeyword(keywordIdx) {
        var value = $('#inlineKeywordEdit_' + keywordIdx).val();
        if (value.length > 0) {
            keyword = keywordMap[keywordIdx];
            sendDBUpdate('keywords_editkeyword', 'keywords', keyword, value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    // Import the HTML file for this panel.
    $("#keywordsPanel").load("/panel/keywords.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 11) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 11 && isConnected) {
            newPanelAlert('Refreshing Keyword Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.keywordsOnMessage = onMessage;
    $.addKeyword = addKeyword;
    $.deleteKeyword = deleteKeyword;
    $.updateKeyword = updateKeyword;
})();
