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
 * moderationPanel.js
 * Drives the Moderation Panel
 */
(function() {
    var spamTrackerLimit = 0,
        blacklist = [],
        currentBlacklist = null;

    var modSettingIcon = [];
        modSettingIcon['false'] = "<i class=\"fa fa-circle-o\" />";
        modSettingIcon['true'] = "<i class=\"fa fa-circle\" />";

    var modSettingMap = [];
        modSettingMap['symbolsToggle'] = "Symbols Protection";
        modSettingMap['capsToggle'] = "Caps Protection";
        modSettingMap['spamToggle'] = "Spam Protection";
        modSettingMap['emotesToggle'] = "Emotes Protection";
        modSettingMap['colorsToggle'] = "Color (/me) Protection";
        modSettingMap['linksToggle'] = "Links Protection";
        modSettingMap['longMessageToggle'] = "Long Message Protection";
        modSettingMap['spamTrackerToggle'] = "Spam Tracker Protection";
        modSettingMap['fakePurgeToggle'] = "Fake Purge Protection";

        modSettingMap['subscribersModerateLinks'] = "Subscriber " + modSettingMap['linksToggle'];
        modSettingMap['subscribersModerateCaps'] = "Subscriber " + modSettingMap['capsToggle'];
        modSettingMap['subscribersModerateSymbols'] = "Subscriber " + modSettingMap['symbolsToggle'];
        modSettingMap['subscribersModerateSpam'] = "Subscriber " +  modSettingMap['spamToggle'];
        modSettingMap['subscribersModerateEmotes'] = "Subscriber " + modSettingMap['emotesToggle'];
        modSettingMap['subscribersModerateColors'] = "Subscriber " + modSettingMap['colorsToggle'];
        modSettingMap['subscribersModerateLongMsg'] = "Subscriber " + modSettingMap['longMessageToggle'];
        modSettingMap['subscribersModerateSpamTracker'] = "Subscriber " + modSettingMap['spamTrackerToggle'];
        modSettingMap['subscribersModerateFakePurge'] = "Subscriber " + modSettingMap['fakePurgeToggle'];

        modSettingMap['regularsModerateLinks'] = "Regulars " + modSettingMap['linksToggle'];
        modSettingMap['regularsModerateCaps'] = "Regulars " + modSettingMap['capsToggle'];
        modSettingMap['regularsModerateSymbols'] = "Regulars " + modSettingMap['symbolsToggle'];
        modSettingMap['regularsModerateSpam'] = "Regulars " + modSettingMap['spamToggle'];
        modSettingMap['regularsModerateEmotes'] = "Regulars " + modSettingMap['emotesToggle'];
        modSettingMap['regularsModerateColors'] = "Regulars " + modSettingMap['colorsToggle'];
        modSettingMap['regularsModerateLongMsg'] = "Regulars " + modSettingMap['longMessageToggle'];
        modSettingMap['regularsModerateSpamTracker'] = "Regulars " + modSettingMap['spamTrackerToggle'];
        modSettingMap['regularsModerateFakePurge'] = "Regulars " + modSettingMap['fakePurgeToggle'];

        modSettingMap['silentTimeoutLinks'] = "Silent Timeout on " + modSettingMap['linksToggle'];
        modSettingMap['silentTimeoutCaps'] = "Silent Timeout on " + modSettingMap['capsToggle'];
        modSettingMap['silentTimeoutSymbols'] = "Silent Timeout on " + modSettingMap['symbolsToggle'];
        modSettingMap['silentTimeoutSpam'] = "Silent Timeout on " + modSettingMap['spamToggle'];
        modSettingMap['silentTimeoutEmotes'] = "Silent Timeout on " + modSettingMap['emotesToggle'];
        modSettingMap['silentTimeoutColors'] = "Silent Timeout on " + modSettingMap['colorsToggle'];
        modSettingMap['silentTimeoutLongMsg'] = "Silent Timeout on " + modSettingMap['longMessageToggle'];
        modSettingMap['silentTimeoutSpamTracker'] = "Silent Timeout on " + modSettingMap['spamTrackerToggle'];
        modSettingMap['silentTimeoutFakePurge'] = "Silent Timeout on " + modSettingMap['fakePurgeToggle'];
        modSettingMap['silentTimeoutBlacklist'] = "Silent Timeout on Blacklist";

    /**
     * Not used at this time.
     *
    var modDBMap = [];

        modDBMap['symbolsToggle']     = { 'subscriber' : 'subscribersModerateSymbols', 'regular' : 'regularsModerateSymbols' };
        modDBMap['capsToggle']        = { 'subscriber' : 'subscribersModerateCaps',    'regular' : 'regularsModerateCaps'    };
        modDBMap['spamToggle']        = { 'subscriber' : 'subscribersModerateSpam',    'regular' : 'regularsModerateSpam'    };
        modDBMap['emotesToggle']      = { 'subscriber' : 'subscribersModerateEmotes',  'regular' : 'regularsModerateEmotes'  };
        modDBMap['colorsToggle']      = { 'subscriber' : 'subscribersModerateColors',  'regular' : 'regularsModerateColors'  };
        modDBMap['linksToggle']       = { 'subscriber' : 'subscribersModerateLinks',   'regular' : 'regularsModerateLinks'   };
        modDBMap['longMessageToggle'] = { 'subscriber' : 'subscribersModerateLongMsg', 'regular' : 'regularsModerateLongMsg' };
     *
     **/

    /*
     * onMessage
     * This event is generated by the connection (WebSocket) object.
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        // Check for dbkeysresult queries
        if (panelHasQuery(msgObject)) {
            var modSetting = "",
                modValue = "",
                html = "";

            if (panelCheckQuery(msgObject, 'moderation_blacklist')) {
                if (msgObject['results'].length > 0) {
                    html = '<table>';
                    var i = 0;
                    blacklist = [];
                    for (idx in msgObject['results']) {
                        i++;
                        modSetting = msgObject['results'][idx]['key'];
                        modValue = msgObject['results'][idx]['value'];

                        // html += "<tr class=\"textList\">" +
                        //     "    <td style=\"width: 3%\">" +
                        //     "        <div id=\"delete_blackList_" + modSetting.replace(/[^a-z1-9]/ig, '_') + "\" type=\"button\" class=\"btn btn-default btn-xs\" " +
                        //     "             onclick=\"$.deleteBlacklist('" + modSetting.replace(/\\/g, '\\\\') + "')\"><i class=\"fa fa-trash\" />" +
                        //     "        </div>" +
                        //     "    </td>" +
                        //     "    <td>" + modSetting + "</td>" +
                        //     "</tr>";
                        blacklist[i] = JSON.parse(modValue);
                        html += '<tr>' +
                        '<td>' + (modSetting.length > 80 ? modSetting.substring(0, 80) + '...' : modSetting) + '</td>' +
                        '<td style="float: right;"><button type="button" class="btn btn-default btn-xs" onclick="$.openBlackListModal(\'' + i + '\')"><i class="fa fa-pencil" /> </button>' +
                        '<button type="button" id="delete_blackList_' + modSetting.replace(/[^a-zA-Z0-9]/ig, '_') + '" class="btn btn-default btn-xs" onclick="$.deleteBlacklist(\'' + modSetting.replace(/\\/g, '\\\\') + '\')">'+
                        '<i class="fa fa-trash" /> </button></td> ' +
                        '</tr>';
                    
                    }
                    html += '</table>';
                } else {
                    html = '<i>No entries in table.</i>';
                }
                $("#blacklistModSettings").html(html);
            }

            if (panelCheckQuery(msgObject, 'moderation_whitelist')) {
                if (msgObject['results'].length > 0) {
                    html = "<table>";
                    for (idx in msgObject['results']) {
                        modSetting = msgObject['results'][idx]['key'];
                        modValue = msgObject['results'][idx]['value'];
    
                        html += "<tr class=\"textList\">" +
                                "    <td style=\"width: 15px\" padding=\"5px\">" +
                                "        <div id=\"delete_whiteList_" + modSetting.replace(/[^a-z1-9]/ig, '_') + "\" type=\"button\" class=\"btn btn-default btn-xs\"" +
                                "             onclick=\"$.deleteWhitelist('" + modSetting + "')\"><i class=\"fa fa-trash\" />" +
                                "        </div>" +
                                "    </td>" +
                                "    <td>" + modSetting + "</td>" +
                                "</tr>";
                    }
                    html += "</table>";
                } else {
                    html = "<i>No entries in table.</i>";
                }
                $("#whitelistModSettings").html(html);
            }

            if (panelCheckQuery(msgObject, 'moderation_chatmod')) {

                /**
                 * Update the text and number based fields.
                 */
                for (idx in msgObject['results']) {
                    modSetting = msgObject['results'][idx]['key'];
                    modValue = msgObject['results'][idx]['value'];

                    switch (modSetting) {
                        case 'linksMessage' :
                        case 'linkPermitTime' :
                        case 'symbolsMessage' :
                        case 'symbolsLimitPercent' :
                        case 'symbolsGroupLimit' :
                        case 'symbolsTriggerLength' :
                        case 'capsMessage' :
                        case 'capsLimitPercent' :
                        case 'capsTriggerLength' :
                        case 'spamMessage' :
                        case 'spamLimit' :
                        case 'emotesMessage' :
                        case 'emotesLimit' :
                        case 'longMessageMessage' :
                        case 'longMessageLimit' :
                        case 'colorsMessage' :
                        case 'spamTrackerMessage' :
                        case 'spamTrackerLimit' :
                        case 'spamTrackerTime' :
                        case 'fakePurgeToggle' :
                        case 'fakePurgeMessage' :
                            $("#" + modSetting + "Input").val(modValue);
                            break;
                    }

                    if (modSetting == 'spamTrackerLimit') {
                        spamTrackerLimit = modValue;
                    }
                }

                /**
                 * Build the Toggle Table for all of the moderation options.
                 */
                for (idx in msgObject['results']) {
                    modSetting = msgObject['results'][idx]['key'];
                    modValue = msgObject['results'][idx]['value'];

                    if (panelMatch(modSetting, 'warningTimeLinks')) {
                        $("#warningTimeLinks").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeLinks')) {
                        $("#timeoutTimeLinks").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeFakePurge')) {
                        $("#warningTimeFakePurge").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeFakePurge')) {
                        $("#timeoutTimeFakePurge").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeCaps')) {
                        $("#warningTimeCaps").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeCaps')) {
                        $("#timeoutTimeCaps").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeSymbols')) {
                        $("#warningTimeSymbols").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeSymbols')) {
                        $("#timeoutTimeSymbols").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeSpam')) {
                        $("#warningTimeSpam").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeSpam')) {
                        $("#timeoutTimeSpam").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeEmotes')) {
                        $("#warningTimeEmotes").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeEmotes')) {
                        $("#timeoutTimeEmotes").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeColors')) {
                        $("#warningTimeColors").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeColors')) {
                        $("#timeoutTimeColors").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeLongMsg')) {
                        $("#warningTimeLongMsg").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeLongMsg')) {
                        $("#timeoutTimeLongMsg").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningTimeSpamTracker')) {
                        $("#warningTimeSpamTracker").val(modValue);
                    }

                    if (panelMatch(modSetting, 'timeoutTimeSpamTracker')) {
                        $("#timeoutTimeSpamTracker").val(modValue);
                    }

                    if (panelMatch(modSetting, 'blacklistTimeoutTime')) {
                        $("#blacklistTimeoutTime").val(modValue);
                    }

                    if (panelMatch(modSetting, 'blacklistMessage')) {
                        $("#blacklistMessage").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentLinkMessage')) {
                        $("#LinkMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentFakePurgeMessage')) {
                        $("#FakePurgeReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentSymbolsMessage')) {
                        $("#SymbolMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentCapMessage')) {
                        $("#CapMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentSpamMessage')) {
                        $("#SpamMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentLongMessage')) {
                        $("#LongMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentColorMessage')) {
                        $("#ColorMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentEmoteMessage')) {
                        $("#EmoteMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentBlacklistMessage')) {
                        $("#BlacklistMessageReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'silentSpamTrackerMessage')) {
                        $("#SpamTrackerReason").val(modValue);
                    }

                    if (panelMatch(modSetting, 'msgCooldownSecs')) {
                        $("#msgCooldownSec").val(modValue);
                    }

                    if (panelMatch(modSetting, 'warningResetTime')) {
                        $("#warningResetTime").val(modValue);
                    }

                    if (panelMatch(modSetting, 'linksToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationLinks').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'fakePurgeToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationFakePurge').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'capsToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationCaps').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'symbolsToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationSymbols').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'spamToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationSpam').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'emotesToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationEmotes').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'colorsToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationColors').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'longMessageToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationLongMsg').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'spamTrackerToggle')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleModerationSpamTracker').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'regularsModerateLinks')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularLinks').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'regularsModerateFakePurge')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularFakePurge').attr('checked', 'checked');
                        }
                    }
                
                    if (panelMatch(modSetting, 'regularsModerateCaps')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularCaps').attr('checked', 'checked');
                        }
                    }
                
                    if (panelMatch(modSetting, 'regularsModerateSymbols')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularSymbols').attr('checked', 'checked');
                        }
                    }
                    
                    if (panelMatch(modSetting, 'regularsModerateSpam')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularSpam').attr('checked', 'checked');
                        }
                    }
                    
                    if (panelMatch(modSetting, 'regularsModerateColors')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularColors').attr('checked', 'checked');
                        }
                    }
                    
                    if (panelMatch(modSetting, 'regularsModerateLongMsg')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularLongMsg').attr('checked', 'checked');
                        }
                    }

                     if (panelMatch(modSetting, 'regularsModerateSpamTracker')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleRegularSpamTracker').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'subscribersModerateLinks')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberLinks').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'subscribersModerateFakePurge')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberFakePurge').attr('checked', 'checked');
                        }
                    }
                
                    if (panelMatch(modSetting, 'subscribersModerateCaps')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberCaps').attr('checked', 'checked');
                        }
                    }
                
                    if (panelMatch(modSetting, 'subscribersModerateSymbols')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberSymbols').attr('checked', 'checked');
                        }
                    }
                    
                    if (panelMatch(modSetting, 'subscribersModerateSpam')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberSpam').attr('checked', 'checked');
                        }
                    }
                    
                    if (panelMatch(modSetting, 'subscribersModerateColors')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberColors').attr('checked', 'checked');
                        }
                    }
                    
                    if (panelMatch(modSetting, 'subscribersModerateLongMsg')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberLongMsg').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'subscribersModerateSpamTracker')) {
                        if (panelMatch(modValue, 'false')) {
                            $('#toggleSubscriberSpamTracker').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutLinks')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutLinks').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutFakePurge')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutFakePurge').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutCaps')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutCaps').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutSymbols')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutSymbols').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutSpam')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutSpam').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutColors')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutColors').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutLongMsg')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutLongMsg').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutBlacklist')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutBlacklist').attr('checked', 'checked');
                        }
                    }

                    if (panelMatch(modSetting, 'silentTimeoutSpamTracker')) {
                        if (panelMatch(modValue, 'true')) {
                            $('#toggleSilentTimeoutSpamTracker').attr('checked', 'checked');
                        }
                    }
                }
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys("moderation_chatmod", "chatModerator");
        sendDBKeys("moderation_blacklist", "blackList");
        sendDBKeys("moderation_whitelist", "whiteList");
    }

    /**
     * @function openBlackListModal
     */
    function openBlackListModal(id) {
        var obj = blacklist[id];

        currentBlacklist = (obj.isRegex && !obj.phrase.startsWith('regex:') ? ('regex:' + String(obj.phrase)) : String(obj.phrase));
        $("#blacklistWord").val(obj.phrase);
        $("#useRegex").prop("checked", obj.isRegex);
        $("#blackList_message").val(obj.message);
        $("#blacklistReason").val(obj.banReason);
        $("#blacklistTimeout").val(obj.timeout);
        $("#blacklist_regs").prop("checked", obj.excludeRegulars);
        $("#blacklist_subs").prop("checked", obj.excludeSubscribers);
        $("#blacklist_silent").prop("checked", obj.isSilent);
        $("#blacklistModal").modal();
    }

    /**
     * @function addModBlacklist
     */
    function addModBlacklist(clear) {
        if (clear === undefined) {
            var phrase = $("#blacklistWord").val(),
                isRegex = $("#useRegex").is(":checked"),
                message = $("#blackList_message").val(),
                banReason = $("#blacklistReason").val(),
                timeout = $("#blacklistTimeout").val(),
                hasRegs = $("#blacklist_regs").is(":checked"),
                hasSubs = $("#blacklist_subs").is(":checked"),
                isSilent = $("#blacklist_silent").is(":checked");
    
            if (phrase.length > 0 && message.length > 0 && banReason.length > 0 && timeout.length > 0) {
                var obj = {
                    id: 'panel_' + phrase,
                    timeout: String(timeout),
                    isRegex: isRegex,
                    phrase: (isRegex && !phrase.startsWith('regex:') ? ('regex:' + String(phrase)) : String(phrase)),
                    isSilent: isSilent,
                    excludeRegulars: hasRegs,
                    excludeSubscribers: hasSubs,
                    message: String(message),
                    banReason: String(banReason)
                };
                
                if (currentBlacklist !== null && currentBlacklist.localeCompare((isRegex && !phrase.startsWith('regex:') ? ('regex:' + String(phrase)) : String(phrase))) !== 0) {
                    sendDBDelete("commands_delblacklist_" + currentBlacklist, "blackList", String(currentBlacklist));
                }
                sendDBUpdate("moderation_addBlacklist", "blackList", (isRegex && !phrase.startsWith('regex:') ? ('regex:' + String(phrase)) : String(phrase)), JSON.stringify(obj));
                currentBlacklist = null;
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
                setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
            }
        }

        $("#blacklistWord").val('');
        $("#useRegex").prop("checked", false);
        $("#blackList_message").val('You were timed out for using a blacklisted word.');
        $("#blacklistReason").val('Using a blacklisted word');
        $("#blacklistTimeout").val('600');
        $("#blacklist_regs").prop("checked", false);
        $("#blacklist_subs").prop("checked", false);
        $("#blacklist_silent").prop("checked", false);
    }

    /**
     * @function addModWhitelist
     */
    function addModWhitelist() {
        var value = $("#addModWhitelistInput").val();
        if (value.length > 0) {
            sendDBUpdate("moderation_addWhitelist", "whiteList", value.toLowerCase(), 'true');
            $("#addModWhitelistInput").val("Submitted");
            setTimeout(function() { $("#addModWhitelistInput").val(""); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function deleteBlacklist
     * @param {String} key
     */
    function deleteBlacklist(key) {
        /* this was giving errors if it contained a symbol other then _ */
        var newkey = key.replace(/[^a-zA-Z0-9]/ig, '_');

        $("#delete_blackList_" + newkey).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");

        sendDBDelete("commands_delblacklist_" + key, "blackList", key);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function deleteWhitelist
     * @param {String} key
     */
    function deleteWhitelist(key) {
        var newkey = key.replace(/[^a-z1-9]/ig, '_');
        $("#delete_whiteList_" + newkey).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("commands_delwhitelist_" + newkey, "whiteList", key);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function disableModeration
     * @param {String} group
     */
    function toggleModeration(group, type) {
        var modDbKeys = [];
        if (group.indexOf('viewers') === 0) {
            modDbKeys = [ "linksToggle", "capsToggle", "spamToggle", "symbolsToggle", "emotesToggle", "longMessageToggle", "colorsToggle", "spamTrackerToggle", "fakePurgeToggle" ];
        }

        if (group.indexOf('subscribers') === 0) {
            modDbKeys = [ "subscribersModerateLinks", "subscribersModerateCaps", "subscribersModerateSymbols", "subscribersModerateSpam",
                          "subscribersModerateEmotes", "subscribersModerateColors", "subscribersModerateLongMsg", "subscribersModerateSpamTacker", "subscribersModerateFakePurge" ];
        }

        if (group.indexOf('regulars') === 0) {
            modDbKeys = [ "regularsModerateLinks", "regularsModerateCaps", "regularsModerateSymbols", "regularsModerateSpam",
                          "regularsModerateEmotes", "regularsModerateColors", "regularsModerateLongMsg", "regularsModerateSpamTacker", "regularsModerateFakePurge" ];
        }

        for (key in modDbKeys) {
            sendDBUpdate("moderation_toggleAll_" + group, "chatModerator", modDbKeys[key], type.toString());
        }
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function quickSetModeration
     * @param {String} type
     * @param {Boolean} disableSubs
     * @param {Boolean} disableRegs
     * @param {Boolean} disableViewers
     */
    function quickSetModeration(type, disableSubs, disableRegs, disableViewers) {

        if (type.indexOf('extreme') === 0) {
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitPercent", "50");
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitTriggerLength", "10");
            sendDBUpdate("moderation_quickSet", "chatModerator", "spamLimit", "5");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsLimitPercent", "50");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsGroupLimit", "10");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsTriggerLength", "10");
            sendDBUpdate("moderation_quickSet", "chatModerator", "emotesLimit", "10");
            sendDBUpdate("moderation_quickSet", "chatModerator", "longMessageLimit", "200");
            sendDBUpdate("moderation_quickSet", "chatModerator", "colorsToggle", "true");
            sendDBUpdate("moderation_quickSet", "chatModerator", "subscribersModerateColors", "true");
            sendDBUpdate("moderation_quickSet", "chatModerator", "regularsModerateColors", "true");
        }

        if (type.indexOf('high') === 0) {
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitPercent", "50");
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitTriggerLength", "20");
            sendDBUpdate("moderation_quickSet", "chatModerator", "spamLimit", "10");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsLimitPercent", "60");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsGroupLimit", "15");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsTriggerLength", "20");
            sendDBUpdate("moderation_quickSet", "chatModerator", "emotesLimit", "15");
            sendDBUpdate("moderation_quickSet", "chatModerator", "longMessageLimit", "600");
            sendDBUpdate("moderation_quickSet", "chatModerator", "colorsToggle", "true");
            sendDBUpdate("moderation_quickSet", "chatModerator", "subscribersModerateColors", "true");
            sendDBUpdate("moderation_quickSet", "chatModerator", "regularsModerateColors", "true");
        }

        if (type.indexOf('medium') === 0) {
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitPercent", "30");
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitTriggerLength", "600");
            sendDBUpdate("moderation_quickSet", "chatModerator", "spamLimit", "15");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsLimitPercent", "75");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsGroupLimit", "30");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsTriggerLength", "40");
            sendDBUpdate("moderation_quickSet", "chatModerator", "emotesLimit", "30");
            sendDBUpdate("moderation_quickSet", "chatModerator", "longMessageLimit", "800");
            sendDBUpdate("moderation_quickSet", "chatModerator", "colorsToggle", "false");
            sendDBUpdate("moderation_quickSet", "chatModerator", "subscribersModerateColors", "false");
            sendDBUpdate("moderation_quickSet", "chatModerator", "regularsModerateColors", "false");
        }

        if (type.indexOf('low') === 0) {
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitPercent", "20");
            sendDBUpdate("moderation_quickSet", "chatModerator", "capsLimitTriggerLength", "100");
            sendDBUpdate("moderation_quickSet", "chatModerator", "spamLimit", "20");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsLimitPercent", "90");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsGroupLimit", "40");
            sendDBUpdate("moderation_quickSet", "chatModerator", "symbolsTriggerLength", "50");
            sendDBUpdate("moderation_quickSet", "chatModerator", "emotesLimit", "40");
            sendDBUpdate("moderation_quickSet", "chatModerator", "longMessageLimit", "1200");
            sendDBUpdate("moderation_quickSet", "chatModerator", "colorsToggle", "false");
            sendDBUpdate("moderation_quickSet", "chatModerator", "subscribersModerateColors", "false");
            sendDBUpdate("moderation_quickSet", "chatModerator", "regularsModerateColors", "false");
        }

        toggleModeration('subscribers', !disableSubs);
        toggleModeration('regulars', !disableRegs);
        toggleModeration('viewers', !disableViewers);

        if (type.indexOf('linksonly') == 0) {
            toggleModeration('subscribers', 'false');
            toggleModeration('regulars', 'false');
            toggleModeration('viewers', 'false');

            if (!disableSubs) { sendDBUpdate("moderation_linksOnly", "chatModerator", "subscribersModerateLinks", "true"); }
            if (!disableRegs) { sendDBUpdate("moderation_linksOnly", "chatModerator", "regularsModerateLinks", "true"); }
            if (!disableViewers) { sendDBUpdate("moderation_linksOnly", "chatModerator", "linksToggle", "true"); }
        }

        $("#quickModerationUpdate").html("<br><span class=\"purplePill\">&nbsp;Please wait, updating settings...&nbsp;</span>");
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { $("#quickModerationUpdate").html(""); }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function permitUserCommand() 
     */
    function permitUserCommand() {
        sendCommand("permit " + $("#permitUserInput").val());
        $("#permitUserInput").val("Submitted");
        setTimeout(function() { $("#permitUserInput").val(""); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateModSetting()
     * @param {String} tableKey
     * @param {String} newValue
     */
    function updateModSetting(tableKey, newValue) {
        $("#modSetting_" + tableKey).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBUpdate("moderation_updateSetting_" + tableKey, "chatModerator", tableKey, newValue);
        setTimeout(function() {
            $("#modSetting_" + tableKey).html("<strong><font style=\"color: #6136b1\">" + modSettingIcon[newValue] + "</font></strong>");
        }, TIMEOUT_WAIT_TIME);
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function updateRedrawModSetting()
     * @param {String} tagId
     * @param {String} tableKey
     */
    function updateRedrawModSetting(tagId, tableKey) {
        var newValue = $(tagId).val();

        if (tableKey == 'msgCooldownSecs') {
            if (newValue >= 30) {
                sendDBUpdate("moderation_updateSetting_" + tableKey, "chatModerator", tableKey, newValue);
                setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
            }
            return;
        }

        if (newValue.length > 0 && ((typeof newValue === 'number' && newValue > 1) || (typeof newValue === 'string'))) {
            sendDBUpdate("moderation_updateSetting_" + tableKey, "chatModerator", tableKey, newValue);
            setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
        }
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleRegular()
     * @param {String} val
     */
    function toggleRegular(val) {
        var value = $('#toggleRegular' + val).attr('checked', 'checked');

        if ($('#toggleRegular' + val).is(':checked') === true) {
            sendDBUpdate("moderation_chatmod", "chatModerator", "regularsModerate" + val, 'false');
        } else {
            sendDBUpdate("moderation_chatmod", "chatModerator", "regularsModerate" + val, 'true');
        }
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleSubscriber()
     * @param {String} val
     */
    function toggleSubscriber(val) {
        var value = $('#toggleSubscriber' + val).attr('checked', 'checked');

        if ($('#toggleSubscriber' + val).is(':checked') === true) {
            sendDBUpdate("moderation_chatmod", "chatModerator", "subscribersModerate" + val, 'false');
        } else {
            sendDBUpdate("moderation_chatmod", "chatModerator", "subscribersModerate" + val, 'true');
        }
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleSilentTimeout()
     * @param {String} val
     */
    function toggleSilentTimeout(val) {
        var value = $('#toggleSilentTimeout' + val).attr('checked', 'checked');

        if ($('#toggleSilentTimeout' + val).is(':checked') === true) {
            sendDBUpdate("moderation_chatmod", "chatModerator", "silentTimeout" + val, 'true');
        } else {
            sendDBUpdate("moderation_chatmod", "chatModerator", "silentTimeout" + val, 'false');
        }
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleModerations()
     * @param {String} val
     * @param {String} id
     */
    function toggleModerations(val, id) {
        var value = $('#toggleModeration' + val).attr('checked', 'checked');

        if ($('#toggleModeration' + val).is(':checked') === true) {
            sendDBUpdate("moderation_chatmod", "chatModerator", id, 'true');
        } else {
            sendDBUpdate("moderation_chatmod", "chatModerator", id, 'false');
        }
        setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function toggleModerations()
     * @param {String} id
     * @param {String} table
     */
    function banReason(id, table) {
        var value = $(id).val();

        if (value.length != 0) {
            sendDBUpdate("moderation_chatmod_reason", "chatModerator", 'silent' + table, value);
            setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    // Import the HTML file for this panel.
    $("#moderationPanel").load("/panel/moderation.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $("#tabs").tabs("option", "active");
            if (active == 2) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 2 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Moderation Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export functions - Needed when calling from HTML.
    $.moderationOnMessage = onMessage;
    $.moderationDoQuery = doQuery;
    $.permitUserCommand = permitUserCommand;
    $.updateModSetting = updateModSetting;
    $.updateRedrawModSetting = updateRedrawModSetting;
    $.quickSetModeration = quickSetModeration;
    $.addModBlacklist = addModBlacklist;
    $.addModWhitelist = addModWhitelist;
    $.deleteBlacklist = deleteBlacklist;
    $.deleteWhitelist = deleteWhitelist;
    $.toggleRegular = toggleRegular;
    $.toggleSubscriber = toggleSubscriber;
    $.toggleSilentTimeout = toggleSilentTimeout;
    $.toggleModerations = toggleModerations;
    $.banReason = banReason;
    $.openBlackListModal = openBlackListModal;
})();