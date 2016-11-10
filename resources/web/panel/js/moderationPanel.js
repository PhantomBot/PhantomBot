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
 * @author IllusionaryOne
 */

/*
 * moderationPanel.js
 * Drives the Moderation Panel
 */
(function() {
    var spamTrackerLimit = 0;

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
                    html = "<table>";
                    for (idx in msgObject['results']) {
                        modSetting = msgObject['results'][idx]['key'];
                        modValue = msgObject['results'][idx]['value'];

                        html += "<tr class=\"textList\">" +
                            "    <td style=\"width: 3%\">" +
                            "        <div id=\"delete_blackList_" + modSetting.replace(/![a-zA-Z1-9]/g, '__') + "\" type=\"button\" class=\"btn btn-default btn-xs\" " +
                            "             onclick=\"$.deleteBlacklist('" + modSetting + "')\"><i class=\"fa fa-trash\" />" +
                            "        </div>" +
                            "    </td>" +
                            "    <td>" + modValue + "</td>" +
                            "</tr>";
                    
                    }
                    html += "</table>";
                } else {
                    html = "<i>No entries in table.</i>";
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
                                "        <div id=\"delete_whiteList_" + modSetting.replace(".", "_") + "\" class=\"button\" " +
                                "             onclick=\"$.deleteWhitelist('" + modSetting + "')\"><i class=\"fa fa-trash\" />" +
                                "        </div>" +
                                "    </td>" +
                                "    <td>" + modValue + "</td>" +
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
                            $("#" + modSetting + "Input").attr("placeholder", modValue).blur();
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
                        $("#warningTimeLinks").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeLinks')) {
                        $("#timeoutTimeLinks").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeFakePurge')) {
                        $("#warningTimeFakePurge").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeFakePurge')) {
                        $("#timeoutTimeFakePurge").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeCaps')) {
                        $("#warningTimeCaps").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeCaps')) {
                        $("#timeoutTimeCaps").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeSymbols')) {
                        $("#warningTimeSymbols").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeSymbols')) {
                        $("#timeoutTimeSymbols").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeSpam')) {
                        $("#warningTimeSpam").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeSpam')) {
                        $("#timeoutTimeSpam").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeEmotes')) {
                        $("#warningTimeEmotes").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeEmotes')) {
                        $("#timeoutTimeEmotes").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeColors')) {
                        $("#warningTimeColors").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeColors')) {
                        $("#timeoutTimeColors").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeLongMsg')) {
                        $("#warningTimeLongMsg").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeLongMsg')) {
                        $("#timeoutTimeLongMsg").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningTimeSpamTracker')) {
                        $("#warningTimeSpamTracker").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'timeoutTimeSpamTracker')) {
                        $("#timeoutTimeSpamTracker").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'blacklistTimeoutTime')) {
                        $("#blacklistTimeoutTime").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'blacklistMessage')) {
                        $("#blacklistMessage").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentLinkMessage')) {
                        $("#LinkMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentFakePurgeMessage')) {
                        $("#FakePurgeReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentSymbolsMessage')) {
                        $("#SymbolMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentCapMessage')) {
                        $("#CapMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentSpamMessage')) {
                        $("#SpamMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentLongMessage')) {
                        $("#LongMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentColorMessage')) {
                        $("#ColorMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentEmoteMessage')) {
                        $("#EmoteMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentBlacklistMessage')) {
                        $("#BlacklistMessageReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'silentSpamTrackerMessage')) {
                        $("#SpamTrackerReason").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'msgCooldownSecs')) {
                        $("#msgCooldownSec").attr("placeholder", modValue).blur();
                    }

                    if (panelMatch(modSetting, 'warningResetTime')) {
                        $("#warningResetTime").attr("placeholder", modValue).blur();
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
     * @function addModBlacklist
     */
    function addModBlacklist() {
        var value = $("#addModBlacklistInput").val();
        if (value.length > 0) {
            sendDBUpdate("moderation_addBlacklist", "blackList", "phrase_" + value.toLowerCase(), value.toLowerCase());
            $("#addModBlacklistInput").val("Submitted");
            setTimeout(function() { $("#addModBlacklistInput").val(""); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function addModWhitelist
     */
    function addModWhitelist() {
        var value = $("#addModWhitelistInput").val();
        if (value.length > 0) {
            sendDBUpdate("moderation_addWhitelist", "whiteList", "link_" + value, value);
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
        var newkey = key.replace(/:/g, '__').replace(/;/g, '__').replace('\'', '__').replace('"', '__').replace(/\[/g, '__').replace(/\\/g, '__').replace(/\//g, '__').replace(/\]/g, '__').replace('*', '__').replace('.', '__');
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
        $("#delete_whiteList_" + key.replace(".", "_")).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("commands_delwhitelist_" + key, "whiteList", key);
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
            if (newValue >= 45) {
                sendDBUpdate("moderation_updateSetting_" + tableKey, "chatModerator", tableKey, newValue);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
                setTimeout(function() { $(tagId).val(''); }, TIMEOUT_WAIT_TIME * 2);
                setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
            }
            return;
        }

        if (newValue.length > 0 && newValue > 1) {
            sendDBUpdate("moderation_updateSetting_" + tableKey, "chatModerator", tableKey, newValue);
            $(tagId).val('');
            $(tagId).attr("placeholder", newValue).blur();
            setTimeout(function() { sendCommand("reloadmod"); }, TIMEOUT_WAIT_TIME);
        }
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
})();
