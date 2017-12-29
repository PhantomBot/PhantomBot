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
 * keywordsPanel.js
 */

(function() {

    var spinIcon = '<i style="color: var(--main-color)" class="fa fa-spinner fa-spin" />',
        editCache = [],
        cooldownCache = [],
        priceCache = [];

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
                if (msgObject['results'].length === 0) {
                    $('#keywordsList').html('<i>No Keywords are Defined</i>');
                    return;
                }

                html = '<table>';
                editCache = [];
                for (idx in msgObject['results']) {
                    keyword = msgObject['results'][idx]['key'];
                    editCache.push(keyword);
                    html += '<tr style="textList">' +
                    '    <td style="width: 15%">' + (keyword.length > 15 ? keyword.substring(0, 15) + '..' : keyword) + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 88%;" type="text" class="input-control" id="inlineKeywordEdit_' + idx + '"' +
                    '                   value="' + msgObject['results'][idx]['value'] + '" />' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" id="deleteKeyword_' + idx + '" onclick="$.deleteKeyword(\'' + idx + '\')"><i class="fa fa-trash" /> </button>' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" onclick="$.updateKeyword(\'' + idx + '\')"><i class="fa fa-hdd-o" /> </button> ' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += '</table>';
                $('#keywordsList').html(html);
                handleInputFocus();
            }

            if (panelCheckQuery(msgObject, 'keywords_cooldown')) {
                if (msgObject['results'].length === 0) {
                    $('#keywordsCooldownList').html('<i>No Keywords cooldown Defined</i>');
                    return;
                }

                html = '<table>';
                cooldownCache = [];
                for (idx in msgObject['results']) {
                    key = msgObject['results'][idx]['key'];
                    time = msgObject['results'][idx]['value'];
                    cooldownCache.push(key);
                    html += '<tr style="textList">' +
                    '    <td style="width: 15%">' + (key.length > 15 ? key.substring(0, 15) + '..' : key) + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 88%" type="text" class="input-control" id="editCooldown_' + idx + '"' +
                    '                   value="' + time + '" />' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" id="deleteCooldown_' + idx + '" onclick="$.deleteKeyCooldown(\'' + idx + '\')"><i class="fa fa-trash" /> </button>' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" onclick="$.editKeyCooldown(\'' + idx + '\')"><i class="fa fa-hdd-o" /> </button> ' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += '</table>';
                $('#keywordsCooldownList').html(html);
            }

            if (panelCheckQuery(msgObject, 'keywords_price')) {
                if (msgObject['results'].length === 0) {
                    $('#keywordsPriceList').html('<i>No Keywords prices Defined</i>');
                    return;
                }

                html = '<table>';
                priceCache = [];
                for (idx in msgObject['results']) {
                    key = msgObject['results'][idx]['key'];
                    time = msgObject['results'][idx]['value'];
                    priceCache.push(key);
                    html += '<tr style="textList">' +
                    '    <td style="width: 15%">' + (key.length > 15 ? key.substring(0, 15) + '..' : key) + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 88%" type="text" class="input-control" id="editKeyPrice_' + idx + '"' +
                    '                   value="' + time + '" />' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" id="deleteKeyPrice_' + idx + '" onclick="$.deleteKeyPrice(\'' + idx + '\')"><i class="fa fa-trash" /> </button>' +
                    '              <button style="float: right;" type="button" class="btn btn-default btn-xs" onclick="$.updateKeyPrice(\'' + idx + '\')"><i class="fa fa-hdd-o" /> </button> ' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += '</table>';
                $('#keywordsPriceList').html(html);
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('keywords_keywords', 'keywords');
        sendDBKeys('keywords_cooldown', 'coolkey');
        sendDBKeys('keywords_price', 'pricekey');
    }

    /**
     * @function addKeyword
     */
    function addKeywordnew() {
        var keyword = $('#addKeywordInput').val(),
            response = $('#addKeywordResponseInput').val();

        if (keyword.length > 0 && response.length > 0) {
            $('#addKeywordInput').val('Submitting...');
            $('#addKeywordResponseInput').val('');
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
     * @param {String} idx
     */
    function deleteKeyword(idx) {
        keyword = editCache[idx];
        $('#deleteKeyword_' + idx).html(spinIcon);

        sendDBDelete('keywords_delkeyword', 'keywords', keyword);
        sendDBDelete('keywords_delkeyword', 'coolkey', keyword);
        sendDBDelete('keywords_delkeyword', 'pricekey', keyword);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateKeyword
     * @param {String} idx
     */
    function updateKeyword(idx) {
        keyword = editCache[idx]; // Actually index //
        var value = $('#inlineKeywordEdit_' + idx).val();
        if (value.length > 0) {
            sendDBUpdate('keywords_editkeyword', 'keywords', keyword, value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function editKeyCooldown
     * @param {String} idx
     */
    function editKeyCooldown(idx) {
        command = cooldownCache[idx];
        var value = $('#editCooldown_' + idx).val();
        if (value > 0) {
            sendDBUpdate("keyword_cooldown_edit", "coolkey", command.toLowerCase(), value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 2);
        }
    };
    /**
     * @function deleteKeyCooldown
     * @param {String} idx
     */
    function deleteKeyCooldown(idx) {
        command = cooldownCache[idx];
        $("#deleteCooldown_" + idx).html("<i style=\"color: var(--main-color)\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("keyword_cooldown_delete", "coolkey", command);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }
    /**
     * @function addKeyCooldown
     */
    function addKeyCooldown() {
        var input = $("#cooldownKeyInput").val();
        var command = $("#cooldownKeyInputCommand").val();

        if (input.length > 0 && command.length != 0) {
            sendDBUpdate("keyword_cooldown_add", "coolkey", String(command.toLowerCase()), String(input));
            $("#cooldownKeyInput").val("Submitted");
            $("#cooldownKeyInputCommand").val("Submitted");
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { $("#cooldownKeyInputCommand").val(""); $("#cooldownKeyInput").val(""); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function setKeyPrice
     */
    function setKeyPrice() {
        var price = $("#priceKeyInput").val();
        var com = $("#priceKeyInputKey").val();

        if (price != 0 && com.length != 0) {
            sendDBUpdate("keywordprice", "pricekey", com.toLowerCase(), price);
            $("#priceKeyInput").val("");
            $("#priceKeyInputKey").val("");
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    };
    /**
     * @function updateKeyPrice
     * @param {String} idx
     */
    function updateKeyPrice(idx) {
        command = priceCache[idx];
        var val = $('#editKeyPrice_' + idx).val();
        $('#editKeyPrice_' + idx).html("<i style=\"color: var(--main-color)\" class=\"fa fa-spinner fa-spin\" />");
        if (val > 0) {
            sendDBUpdate("keyword_editprice_" + command, "pricekey", command.toLowerCase(), val);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    };

    /**
     * @function deleteKeyPrice
     * @param {String} idx
     */
    function deleteKeyPrice(idx) {
        command = priceCache[idx];
        $("#deleteKeyPrice_" + idx).html("<i style=\"color: var(--main-color)\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("keyword_delcomprice_" + command, "pricekey", command);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    };

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
        if (active == 11 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Keyword Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.keywordsOnMessage = onMessage;
    $.keywordsDoQuery = doQuery;
    $.addKeywordnew = addKeywordnew;
    $.deleteKeyword = deleteKeyword;
    $.updateKeyword = updateKeyword;
    $.addKeyCooldown = addKeyCooldown;
    $.deleteKeyCooldown = deleteKeyCooldown;
    $.editKeyCooldown = editKeyCooldown;
    $.setKeyPrice = setKeyPrice;
    $.updateKeyPrice = updateKeyPrice;
    $.deleteKeyPrice = deleteKeyPrice;
})();
