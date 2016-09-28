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
 * @author Nekres
 */

/*
 * statusphrasesPanel.js
 */

(function() {

    var modeIcon = [];
        modeIcon['0'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle-o\" />";
        modeIcon['1'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle\" />";
    var settingIcon = [];
        settingIcon['0'] = "<i class=\"fa fa-circle-o\" />";
        settingIcon['1'] = "<i class=\"fa fa-circle\" />";

    var spinIcon = '<i style="color: #6136b1" class="fa fa-spinner fa-spin" />';

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
            html = '',
            id = '',
            phraseData = [];

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'statusphrases_current')) {
                if (msgObject['results']['title'] === undefined || msgObject['results']['title'] === null) {
                    $("#currentPhrase").html("");
                } else {
                    $("#currentPhrase").html("<spam class=\"purplePill\">Current Title: " + msgObject['results']['title'] + "</spam>");
                }
            }
			if (panelCheckQuery(msgObject, 'statusphrases_toggle')) {
				if (msgObject['results']['toggle_phrases'] != undefined) {
					toggle_phrases = msgObject['results']['toggle_phrases'];
				}
				$("#phraseToggleRefresh").html(modeIcon[toggle_phrases]);
			}
			if (panelCheckQuery(msgObject, 'statusphrases_msgtoggle')) {
				if (msgObject['results']['msg_toggle'] != undefined) {
					msg_toggle = msgObject['results']['msg_toggle'];
				}
				$("#phraseMsgRefresh").html(modeIcon[msg_toggle]);
			}
			if (panelCheckQuery(msgObject, 'statusphrases_position')) {
				if (msgObject['results']['pos_phrase'] != undefined) {
					pos_phrase = msgObject['results']['pos_phrase'];
				}
				$("#phrasePositionSelect").html(modeIcon[pos_phrase]);
			}
			
			if (panelCheckQuery(msgObject, 'statusphrases_interval')) {
				if (msgObject['results']['interval'] != undefined) {
					interval = parseInt(msgObject['results']['interval']) / 60 / 1000;
				}
				$("#phraseIntervalInput").attr("placeholder", interval).blur();
			}
			if (panelCheckQuery(msgObject, 'statusphrases_separator')) {
				if (msgObject['results']['separator'] != undefined) {
					separator = msgObject['results']['separator'];
				}
				$("#phraseSeparatorInput").attr("placeholder", separator).blur();
			}
            if (panelCheckQuery(msgObject, 'statusphrases_phrases')) {
                if (msgObject['results'].length === 0) {
                    $('#phraseList').html('<i>No Phrases Are Defined</i>');
                    return;
                }

                html = '<table>';
                for (var idx in msgObject['results']) {
                    id = msgObject['results'][idx]['key'];
                    phraseData = JSON.parse(msgObject['results'][idx]['value']);
                    phraseDataClean = JSON.parse(msgObject['results'][idx]['value']);
                    phraseDataClean[1] = phraseDataClean[1].replace(/,/g, '%2C').replace(/'/g, '%27');
                    html += '<tr style="textList">' +
                            '    <td rowspan="2" style="width: 25px">' +
                            '        <div id="deletePhrase_' + id + '" type=\"button\" class=\"btn btn-default btn-xs\"' +
                            '             onclick="$.deletePhrase(\'' + id + '\')"><i class="fa fa-trash" />' +
                            '        </div>' +
                            '    </td>' +

                            // ID and Date
                            '    <td>ID: ' + id + '</td>' +
                            '    <td style="vertical-align: middle">' + 
                            '        Date: ' + $.format.date(parseInt(phraseData[2]), 'MM.dd.yy') +
                            '    </td>' +


                            // User
                            '    <td style="vertical-align: middle">' +
                            '		By: ' + phraseData[0] +
                            '    </td>' +
                            '</tr>' +

                            // Phrase
                            '<tr style="textList">' +
                            '    <td colspan="4" style="vertical-align">' +
                            '        <form onkeypress="return event.keyCode != 13">' +
                            '            <input style="width: 89%" type="text" id="inlinePhraseEdit_quote_' + id + '"' +
                            '                   value="' + phraseData[1] + '" />' +
                            '            <button type="button" class="btn btn-default btn-xs"' +
                            '                    onclick="$.updatePhrase(\'' + id + '\', \'' + phraseDataClean + '\', \'phrase\')">' +
                            '                <i class="fa fa-pencil" />' +
                            '            </button>' +
                            '        </form>' +
                            '    </td>' +
                            '</tr>';
                }
                html += '</table>';
                $('#phraseList').html(html);
                handleInputFocus();
            }
        }
    }
 
    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('statusphrases_phrases', 'statusphrases');
		sendDBQuery("statusphrases_current", "streamInfo", "title");
		sendDBQuery("statusphrases_toggle", "statusphrasesystem", "toggle_phrases");
		sendDBQuery("statusphrases_msgtoggle", "statusphrasesystem", "msg_toggle");
		sendDBQuery("statusphrases_position", "statusphrasesystem", "pos_phrase");
		sendDBQuery("statusphrases_interval", "statusphrasesystem", "interval");
		sendDBQuery("statusphrases_separator", "statusphrasesystem", "separator");
    }
	
    /**
     * @function deletePhrase
     * @param {String} id
     */
    function deletePhrase(id) {
        $('#deletePhrase_' + id).html(spinIcon);
        sendCommand('delphrasesilent ' + id);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updatePhrase
     * @param {String} id
     * @param {Object} quoteData
     * @param {String} field
     */
    function updatePhrase(id, phraseData, field) {
        var value = $('#inlinePhraseEdit_' + field + '_' + id).val(),
            phraseArray = phraseData.split(',');
        if (value.length > 0) {
            if (panelMatch(field, 'phrase')) {
                phraseArray[1] = value
            }
            if (panelMatch(field, 'user')) {
                phraseArray[1] = phraseArray[1].replace(/%2C/g, ',').replace(/%27/g, '\'');
                phraseArray[0] = value;
            }
            sendDBUpdate('statusphrases_update', 'statusphrases', id, JSON.stringify(phraseArray));
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function addPhrase
     */
    function addPhrase() {
        var value = $('#addPhraseInput').val();
        if (value.length > 0) {
            $('#addPhraseInput').val('Adding...').blur();
            sendCommand('addphrasesilent ' + value);
            setTimeout(function() { doQuery(); $('#addPhraseInput').val(''); }, TIMEOUT_WAIT_TIME * 4);
        }
    }
    /**
     * @function togglePhrases
     */
    function togglePhrases() {
		$('#phraseToggleRefresh').html(spinIcon);
		sendCommand('togglephrasessilent');
		setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 4);
    }
    /**
     * @function phraseMsg
     */
    function phraseMsg() {
		$('#phraseMsgRefresh').html(spinIcon);
		sendCommand('phrasemessagesilent');
		setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 4);
	}
    /**
     * @function phrasePosition
     */
    function phrasePosition(value) {
		$('#phrasePositionSelect').html(spinIcon);
		sendCommand('phrasepositionsilent ' + value);
		setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME * 4);
    }
    /**
     * @function phraseInterval
     */
    function phraseInterval() {
        var value = $('#phraseIntervalInput').val();
        if (value.length > 0) {
            $('#phraseIntervalInput').attr('type', 'text').blur();
            $('#phraseIntervalInput').val('Submitting...').blur();
            sendCommand('phraseintervalsilent ' + value);
            setTimeout(function() { doQuery(); $('#phraseIntervalInput').val(''); $('#phraseIntervalInput').attr('type', 'number'); }, TIMEOUT_WAIT_TIME * 4);
        }
    }
    /**
     * @function phraseSeparator
     */
    function phraseSeparator() {
        var value = $('#phraseSeparatorInput').val();
        if (value.length > 0) {
            $('#phraseSeparatorInput').val('Submitting...').blur();
            sendCommand('phraseseparatorsilent ' + value);
            setTimeout(function() { doQuery(); $('#phraseSeparatorInput').val(''); }, TIMEOUT_WAIT_TIME * 4);
        }
    }
    /**
     * @function setDefaultPhraseConfig
     */
	function setDefaultPhraseConfig(input) {
		if (input == 'statusPhraseInt') {
			$('#phraseIntervalInput').val('2').blur();
		}
		if (input == 'statusPhraseSep') {
			$('#phraseSeparatorInput').val('»').blur();
		}
	}
    /**
     * @function setRandomPhrase
     */
	function setRandomPhrase() {
		var preset_phrases = ["<ᴍᴇssᴀɢᴇ ᴅᴏɴɢᴇʀᴇᴅ>", "Best game EVER!", "ᕙ༼ຈل͜ຈ༽ᕗ CopyPasterino ᕙ༼ຈل͜ຈ༽ᕗ", "I Can Has Cheezburger? (*ΦДΦ*)✧",
			"Come in and find out!", "OUR DONGERS ARE RAZOR SHARP(\\ ( ͠° ͟ل͜ ͡°) /)", "Chat commands!", 
			"Born just in time to post DANK ℳℰℳℰS└( ° ͜ʖ͡°)┐", "We love this game <3", "ζ༼Ɵ͆ل͜Ɵ͆༽ᶘ FINALLY A REAL DONG ζ༼Ɵ͆ل͜Ɵ͆༽ᶘ", 
			"Just another caffeinated stream~", "Enjoy your stay!", "Endless gaming!", "Notice Me Senpai! (≧∇≦*)", "What\' up beaches! ヾ(￣◇￣)ノ"];
		$('#addPhraseInput').val(preset_phrases[Math.floor(Math.random() * preset_phrases.length)]).blur();
	}
    // Import the HTML file for this panel.
    $("#statusphrasesPanel").load("/panel/statusphrases.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var initialize = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 10) {
                doQuery();
                clearInterval(initialize);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 10 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Phrase Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.statusphrasesOnMessage = onMessage;
    $.statusphrasesDoQuery = doQuery;
    $.deletePhrase = deletePhrase;
    $.updatePhrase = updatePhrase;
    $.addPhrase = addPhrase;
	$.togglePhrases = togglePhrases;
	$.phraseMsg = phraseMsg;
	$.phrasePosition = phrasePosition;
	$.phraseInterval = phraseInterval;
	$.phraseSeparator = phraseSeparator;
	$.setDefaultPhraseConfig = setDefaultPhraseConfig;
	$.setRandomPhrase = setRandomPhrase;
})();
