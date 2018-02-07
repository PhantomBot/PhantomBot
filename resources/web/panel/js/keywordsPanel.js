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
 * keywordsPanel.js
 */

(function() {

    var spinIcon = '<i style="color: var(--main-color)" class="fa fa-spinner fa-spin" />',
        keywords = [],
        cooldowns = [],
        currentKey = '';

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

                html = '<table style="width: 100%"><tr><th>Keyword</th><th>Response</th><th style="float: right;"></td>';
                for (idx in msgObject['results'].sort(sortKeywordsTable)) {
                    var json = JSON.parse(msgObject['results'][idx]['value']),
                        keyword = json.keyword;
                        response = json.response;

                    keywords[idx] = keyword;
                    html += '<tr>' +
                        '<td>' + (keyword.length > 15 ?  keyword.substring(0, 15) + '...' : keyword) + '</td>' +
                        '<td>' + (response.length > 45 ?  response.substring(0, 45) + '...' : response) + '</td>' +
                        '<td style="float: right;"><button type="button" class="btn btn-default btn-xs" onclick="$.editKeywordnew(\'' + keyword.replace(/\'/g, '__apos__').replace(/\\/g, '\\\\') + '\', \'' + response.replace(/\'/g, '__apos__').replace(/\\/g, '\\\\') + '\')"><i class="fa fa-edit" /> </button>' +
                        '<button type="button" id="deleteKeyword_' + idx + '" class="btn btn-default btn-xs" onclick="$.deleteKeyword(\'' + idx + '\')"><i class="fa fa-trash" /> </button></td> ' +
                        '</tr>';
                }
                html += '</table>';
                $('#keywordsList').html(html);
                handleInputFocus();
            }

            if (panelCheckQuery(msgObject, 'keywords_cooldown')) {
                for (idx in msgObject['results']) {
                    cooldowns[msgObject['results'][idx]['key']] = msgObject['results'][idx]['value'];
                }
                sendDBKeys('keywords_keywords', 'keywords');
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        keywords = [];
        cooldowns = [];

        sendDBKeys('keywords_cooldown', 'coolkey');
    }
    
    /**
     * @function sortKeywordsTable
     * @param {Object} a
     * @param {Object} b
     */
    function sortKeywordsTable(a, b) {
        return panelStrcmp(a.key, b.key);
    };

    /**
     * @function addKeywordnew
     */
    function addKeywordnew() {
        $('#keyword-modal-title').html('Add Keyword');

        currentKey = '';

        $('#keyword-name').val('');
        $('#keyword-response').val('');
        $('#keyword-cooldown').val('5');
        $('#keyword-regex').prop('checked', false);
        $('#keyword-modal').modal('toggle');
    }

    /**
     * @function deleteKeyword
     * @param {String} idx
     */
    function deleteKeyword(idk) {
        $('#deleteKeyword_' + idk).html(spinIcon);

        sendDBDelete('keywords_delkeyword', 'keywords', keywords[idk]);
        sendDBDelete('keywords_delkeywordcd', 'coolkey', keywords[idk]);
        setTimeout(function() { doQuery(); sendWSEvent('keywords', './handlers/keywordHandler.js', null, []); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateKeyword
     */
    function updateKeyword() {
        var keyword = $('#keyword-name').val(),
            response = $('#keyword-response').val(),
            isRegex = $('#keyword-regex').is(':checked'),
            cooldown = parseInt($('#keyword-cooldown').val());

        if (cooldown < 5) {
            cooldown = String(5);
        } else {
            cooldown = String(cooldown);
        }

        if (response.length < 1 || keyword.length < 1) {
            return;
        }

        sendDBDelete('keyword_rm', 'keywords', currentKey);
        setTimeout(function() {
            sendDBUpdate('keyword_update', 'keywords', (isRegex ? 'regex:' : '') + keyword, JSON.stringify({
                keyword: (isRegex ? 'regex:' : '') + keyword,
                response: response,
                isRegex: isRegex
            }));
            sendDBUpdate('keyword_cooldown_up', 'coolkey', (isRegex ? 'regex:' : '') + keyword, cooldown);
        }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { doQuery(); sendWSEvent('keywords', './handlers/keywordHandler.js', null, []); }, TIMEOUT_WAIT_TIME * 2);
    }

    /**
     * @function editKeywordnew
     */
    function editKeywordnew(keyword, response) {
        $('#keyword-modal-title').html('Edit Keyword');
        keyword = keyword.replace(/__apos__/g, '\'');
        response = response.replace(/__apos__/g, '\'');

        currentKey = keyword;

        $('#keyword-name').val(keyword.replace('regex:', ''));
        $('#keyword-response').val(response);
        $('#keyword-cooldown').val(isNaN(parseInt(cooldowns[keyword])) ? 5 : cooldowns[keyword]);
        $('#keyword-regex').prop('checked', keyword.startsWith('regex:'));
        $('#keyword-modal').modal('toggle');
    }

    // Add keywords hooks
    addPanelTab( 'keywords', 'Keywords', '/panel/keywords.html', 550 );
    addDoQuery( 'keywords', doQuery, 3e4 );
    addOnMessage( 'keywords', onMessage );

    // Export to HTML
    $.keywordsOnMessage = onMessage;
    $.keywordsDoQuery = doQuery;
    $.addKeywordnew = addKeywordnew;
    $.editKeywordnew = editKeywordnew;
    $.deleteKeyword = deleteKeyword;
    $.updateKeyword = updateKeyword;
})();
