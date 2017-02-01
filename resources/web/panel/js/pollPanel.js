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
 * pollPanel.js
 */

(function() {

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
            html = '',
            question = '',
            votes = '',
            options = '',
            optionsData = [],
            counts = '',
            countsData = [],
            isTie = '',
            result = '';

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'poll_results')) {
                if (msgObject['results'].length === 0) {
                    $('#pollLastResults').html('<i>No Previous Poll Results</i>');
                    return;
                }
                for (idx in msgObject['results']) {
                    if (panelMatch(msgObject['results'][idx]['key'], 'question')) {
                        question = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'result')) {
                        result = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'votes')) {
                        votes = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'options')) {
                        options = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'counts')) {
                        counts = msgObject['results'][idx]['value'];
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'istie')) {
                        isTie = msgObject['results'][idx]['value'];
                    }
                }

                html += '<strong>Question:</strong> ' + question + '<br>' +
                        '<strong>Result:</strong> ' + (panelMatch(isTie, 'true') ? 'Tie!' : result) + '<br><br>' +
                        '<strong>Votes:</strong><br><br>';

                optionsData = options.split(',');
                countsData = counts.split(',');

                html += '<table><tr>';
                for (idx in optionsData) {
                    html += '<td>' + optionsData[idx] + '</td>';
                }
                html += '</tr><tr>';
                for (idx in countsData) {
                    html += '<td>' + countsData[idx] + '</td>';
                }
                html += '</tr></table>';
                $('#pollLastResults').html(html);
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('poll_results', 'pollresults'); 
    }

    /**
     * @function openPoll
     */
    function openPoll() {
        var question = $('#pollQuestionInput').val(),
            options = $('#pollOptionsInput').val(),
            timer = $('#pollLengthInput').val(),
            minvotes = $('#pollMinVotesInput').val();

        if (timer.length === 0) {
            timer = "60";
        }
        if (minvotes.length === 0) {
            minvotes = "1";
        }
        if (question.length > 0 && options.length > 0) {
            sendCommand('poll open "' + question + '" "' + options + '" ' + timer + ' ' + minvotes);
            $('#pollQuestionInput').val('');
            $('#pollOptionsInput').val('');
            $('#pollLengthInput').val('');
            $('#pollMinVotesInput').val('');
        }
    }

    /**
     * @function closePoll
     */
    function closePoll() {
        sendCommand('poll close');
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    // Import the HTML file for this panel.
    $("#pollPanel").load("/panel/poll.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 12) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 12 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Poll Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.pollOnMessage = onMessage;
    $.pollDoQuery = doQuery;
    $.openPoll = openPoll;
    $.closePoll = closePoll;

})();
