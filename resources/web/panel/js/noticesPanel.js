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
 * noticesPanel.js
 */

(function() {

   var refreshIcon = '<i class="fa fa-refresh" />',
       spinIcon = '<i style=\"color: #6136b1\" class="fa fa-spinner fa-spin" />',
       modeIcon = [],
       isDeleting = false,
       settingIcon = [];

       modeIcon['false'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle-o\" />";
       modeIcon['true'] = "<i style=\"color: #6136b1\" class=\"fa fa-circle\" />";

       settingIcon['false'] = "<i class=\"fa fa-circle-o\" />";
       settingIcon['true'] = "<i class=\"fa fa-circle\" />";

    var noticeOnlineToggle = false,
        noticeOfflineToggle = false;

    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject,
            html = '',
            id = '';

        try { 
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'notices_settings')) {
                for (var idx in msgObject['results']) {
                    if (panelMatch(msgObject['results'][idx]['key'], 'reqmessages')) {
                        $('#noticeReqInput').attr('placeholder', msgObject['results'][idx]['value']).blur();
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'interval')) {
                        $('#noticeIntervalInput').attr('placeholder', msgObject['results'][idx]['value']).blur();
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'noticetoggle')) {
                        noticeOnlineToggle = msgObject['results'][idx]['value'];
                        $('#chatNoticeMode').html(modeIcon[msgObject['results'][idx]['value']]);
                    }
                    if (panelMatch(msgObject['results'][idx]['key'], 'noticeOfflineToggle')) {
                        noticeOfflineToggle = msgObject['results'][idx]['value'];
                        $('#chatOfflineNoticeMode').html(modeIcon[msgObject['results'][idx]['value']]);
                    }
                }
            }

            if (panelCheckQuery(msgObject, 'notices_notices')) {
                if (msgObject['results'].length === 0) {
                    $('#noticeList').html('<i>No Notices Are Defined</i>');
                    return;
                }

                html = '<table>';
                for (var idx in msgObject['results']) {
                    id = msgObject['results'][idx]['key'].match(/message_(\d+)/)[1];
                    html += '<tr style="textList">' +
                    '    <td style="width: 15%">Notice #' + id + '</td>' +
                    '    <td style="vertical-align: middle">' +
                    '        <form onkeypress="return event.keyCode != 13">' +
                    '            <input style="width: 80%" type="text" id="inlineNoticeEdit_' + id + '"' +
                    '                   value="' + msgObject['results'][idx]['value'] + '" />' +
                    '              <button type="button" class="btn btn-default btn-xs" onclick="$.updateNotice(\'' + id + '\')"><i class="fa fa-pencil" /> </button> ' +
                    '              <button type="button" class="btn btn-default btn-xs" id="deleteNotice_' + id + '" onclick="$.deleteNotice(\'' + id + '\')"><i class="fa fa-trash" /> </button>' +
                    '             </form>' +
                    '        </form>' +
                    '    </td>' +
                    '</tr>';
                }
                html += '</table>';
                $('#noticeList').html(html);
                handleInputFocus();
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('notices_settings', 'noticeSettings');
        sendDBKeys('notices_notices', 'notices');
    }

    /**
     * @function toggleChatNotice
     */
    function toggleChatNotice() {
        $('#chatNoticeMode').html(spinIcon);
        if (noticeOnlineToggle == "true") {
            sendDBUpdate('notices_settings', 'noticeSettings', 'noticetoggle', 'false');
        } else {
            sendDBUpdate('notices_settings', 'noticeSettings', 'noticetoggle', 'true');
        }
        setTimeout(function() { sendCommand("reloadnotice"); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleChatOfflineNotice
     */
    function toggleChatOfflineNotice() {
        $('#chatOfflineNoticeMode').html(spinIcon);
        if (noticeOfflineToggle == "true") {
            sendDBUpdate('notices_settings', 'noticeSettings', 'noticeOfflineToggle', 'false');
        } else {
            sendDBUpdate('notices_settings', 'noticeSettings', 'noticeOfflineToggle', 'true');
        }
        setTimeout(function() { sendCommand("reloadnotice"); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateNoticeInterval
     */
    function updateNoticeInterval(tagId, tableKey) {
        var newValue = $(tagId).val();
        if (parseInt(newValue) >= 2 && newValue.length > 0) {
            sendDBUpdate("noticeIntervalInput", "noticeSettings", tableKey, newValue);
            $(tagId).val('')
            $(tagId).attr("placeholder", newValue).blur();
            setTimeout(function() { sendCommand("reloadnotice"); }, TIMEOUT_WAIT_TIME);
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateNoticeReq
     */
    function updateNoticeReq(tagId, tableKey) {
        var newValue = $(tagId).val();
        if (parseInt(newValue) >= 0 && newValue.length > 0) {
            sendDBUpdate("noticeReqInput", "noticeSettings", tableKey, newValue);
            $(tagId).val('')
            $(tagId).attr("placeholder", newValue).blur();
            setTimeout(function() { sendCommand("reloadnotice"); }, TIMEOUT_WAIT_TIME);
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function addNotice
     */
    function addNotice() {
        var value = $('#addNoticeInput').val().replace(/\"/g, '%22');
        if (value.length > 0) {
            value = value.replace(/%22/g, '\'\'');
            sendCommand('notice addsilent ' + value);
            $('#addNoticeInput').val('');
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);    
        }
    }

    /**
     * @function deleteNotice
     * @param {String} id
     */
    function deleteNotice(id) {
        $('#deleteNotice_' + id).html(spinIcon);
        sendCommand('notice removesilent ' + id);

        if (!isDeleting) { // Added this or the list goes crazy on the panel.
            isDeleting = true; 
            setTimeout(function() { doQuery(); isDeleting = false; }, TIMEOUT_WAIT_TIME * 4); 
        }
    }

    /**
     * @function updateNotice
     * @param {String} id
     */
    function updateNotice(id) {
        var value = $('#inlineNoticeEdit_' + id).val();
        if (value.length > 0) {
            $('#inlineNoticeEdit_' + id).val(value).blur();
            sendCommand('notice editsilent ' + id + ' ' + value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }
    
    // Import the HTML file for this panel.
    $("#noticesPanel").load("/panel/notices.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $('#tabs').tabs('option', 'active');
            if (active == 9) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $('#tabs').tabs('option', 'active');
        if (active == 9 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Notices Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);
    
    // Export to HTML
    $.noticesOnMessage = onMessage;
    $.noticesDoQuery = doQuery;
    $.toggleChatNotice = toggleChatNotice;
    $.toggleChatOfflineNotice = toggleChatOfflineNotice;
    $.updateNoticeInterval = updateNoticeInterval;
    $.updateNoticeReq = updateNoticeReq;
    $.addNotice = addNotice;
    $.deleteNotice = deleteNotice;
    $.updateNotice = updateNotice;
})();
