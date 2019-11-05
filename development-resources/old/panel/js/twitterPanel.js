/*
 * Copyright (C) 2016-2019 phantombot.tv
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
 * twitterPanel.js
 */

(function() {

    var modeIcon = [],
        settingIcon = [],
        settingMap = [];

        modeIcon['false'] = "<i style=\"color: var(--main-color)\" class=\"fa fa-circle-o\" />";
        modeIcon['true'] = "<i style=\"color: var(--main-color)\" class=\"fa fa-circle\" />";

        settingIcon['false'] = "<i class=\"fa fa-circle-o\" />";
        settingIcon['true'] = "<i class=\"fa fa-circle\" />";

        settingMap['poll_mentions'] = "Poll Mentions";
        settingMap['poll_retweets'] = "Poll Retweets";
        settingMap['poll_hometimeline'] = "Poll Home Timeline";
        settingMap['poll_usertimeline'] = "Poll User Timeline";

        settingMap['post_online'] = "Post When Stream Goes Online";
        settingMap['post_gamechange'] = "Post Game Change";
        settingMap['post_update'] = "Post Timed Automatic Updates";

        settingMap['reward_toggle'] = 'Toggle Rewards';
        settingMap['reward_announce'] = 'Toggle Reward Announcements';


    /**
     * @function onMessage
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'twitter_config')) {
                var setting,
                    value,
                    pollhtml,
                    posthtml;

                pollhtml = '<table>';
                posthtml = '<table>';
                rewardhtml = '<table>';

                for (idx in msgObject['results']) {
                    setting = msgObject['results'][idx]['key'];
                    value = msgObject['results'][idx]['value'];

                    // Update text/number values in form inputs.
                    switch (setting) {
                        case 'message_online' :
                        case 'message_gamechange' :
                        case 'message_update' :
                        case 'polldelay_mentions' :
                        case 'polldelay_retweets' :
                        case 'polldelay_hometimeline' :
                        case 'polldelay_usertimeline' :
                        case 'postdelay_update' :
                        case 'reward_points' :
                        case 'reward_cooldown' :
                            $('#' + setting + 'TweetInput').val(value);
                            break;
                    }

                    // Skip the reward_points and reward_cooldown.
                    if (setting == 'reward_points' || setting == 'reward_cooldown') {
                        continue;
                    }

                    // Build the poll options table.
                    if (setting.indexOf('poll_') === 0) {
                        pollhtml += '<tr class="textList">' +
                                    '    <td>' + settingMap[setting] + '</td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div id="twitterStatus_"' + idx + '">' + modeIcon[value] + '</div>' +
                                    '    </td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div data-toggle="tooltip" title="Enable" class="button"' +
                                    '             onclick="$.toggleTwitter(\'' + setting + '\', \'true\', \'' + idx + '\')">' + settingIcon['true'] +
                                    '        </div>' +
                                    '    </td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div data-toggle="tooltip" title="Disable" class="button"' +
                                    '             onclick="$.toggleTwitter(\'' + setting + '\', \'false\', \'' + idx + '\')">' + settingIcon['false'] +
                                    '        </div>' +
                                    '    </td>' +

                                    '</tr>';
                    }

                    // Build the post options table.
                    if (setting.indexOf('post_') === 0) {
                        posthtml += '<tr class="textList">' +
                                    '    <td>' + settingMap[setting] + '</td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div id="twitterStatus_"' + idx + '">' + modeIcon[value] + '</div>' +
                                    '    </td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div data-toggle="tooltip" title="Enable" class="button"' +
                                    '             onclick="$.toggleTwitter(\'' + setting + '\', \'true\', \'' + idx + '\')">' + settingIcon['true'] +
                                    '        </div>' +
                                    '    </td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div data-toggle="tooltip" title="Disable" class="button"' +
                                    '             onclick="$.toggleTwitter(\'' + setting + '\', \'false\', \'' + idx + '\')">' + settingIcon['false'] +
                                    '        </div>' +
                                    '    </td>' +

                                    '</tr>';
                    }

                    // Build the rewtweet reward options table.
                    if (setting.indexOf('reward_') === 0) {
                        rewardhtml += '<tr class="textList">' +
                                    '    <td>' + settingMap[setting] + '</td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div id="twitterStatus_"' + idx + '">' + modeIcon[value] + '</div>' +
                                    '    </td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div data-toggle="tooltip" title="Enable" class="button"' +
                                    '             onclick="$.toggleTwitter(\'' + setting + '\', \'true\', \'' + idx + '\')">' + settingIcon['true'] +
                                    '        </div>' +
                                    '    </td>' +

                                    '    <td style="width: 25px">' +
                                    '        <div data-toggle="tooltip" title="Disable" class="button"' +
                                    '             onclick="$.toggleTwitter(\'' + setting + '\', \'false\', \'' + idx + '\')">' + settingIcon['false'] +
                                    '        </div>' +
                                    '    </td>' +

                                    '</tr>';
                    }

                }
                pollhtml += '</table>';
                posthtml += '</table>';
                rewardhtml += '</table>';

                $('#twitterPollTable').html(pollhtml);
                $('#twitterPostTable').html(posthtml);
                $('#twitterRewardTable').html(rewardhtml);
                $('[data-toggle="tooltip"]').tooltip();
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys('twitter_config', 'twitter');
    }

    /**
     * @function toggleTwitter
     * @param {String} module
     */
    function toggleTwitter(setting, value, idx) {
        $("#twitterStatus_" + idx).html("<i style=\"color: var(--main-color)\" class=\"fa fa-spinner fa-spin\" />");
        sendDBUpdate('twitter_update', 'twitter', setting, value);
        setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function postTweet
     */
    function postTweet() {
        var value = $('#postTweetInput').val();
        if (value.length > 0) {
            $('#postTweetInput').val('');
            sendCommand('twitter post ' + value);
        }
    }

    /**
     * @function updateDataTwitter
     * @param {String} dbKey
     */
    function updateDataTwitter(dbKey) {
        var value = $('#' + dbKey + 'TweetInput').val();

        if (dbKey == 'reward_points') {
            if (value >= 0) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (dbKey == 'reward_cooldown') {
            if (value >= 0) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (dbKey == 'postdelay_update') {
            if (value >= 180) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (dbKey == 'polldelay_mentions') {
            if (value >= 60) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (dbKey == 'polldelay_retweets') {
            if (value >= 60) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (dbKey == 'polldelay_hometimeline') {
            if (value >= 60) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }

        if (dbKey == 'polldelay_usertimeline') {
            if (value >= 15) {
                sendDBUpdate('twitter_update', 'twitter', dbKey, value);
                setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
            }
            setTimeout(function() { $('#' + dbKey + 'TweetInput').val(''); }, TIMEOUT_WAIT_TIME);
            return;
        }
        if (value.length > 0) {
            sendDBUpdate('twitter_update', 'twitter', dbKey, value);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    // Import the HTML file for this panel.
    $("#twitterPanel").load("/panel/twitter.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $("#tabs").tabs("option", "active");
            if (active == 17) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 17 && isConnected && !isInputFocus()) {
            newPanelAlert('Refreshing Twitter Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export to HTML
    $.twitterOnMessage = onMessage;
    $.twitterDoQuery = doQuery;
    $.toggleTwitter = toggleTwitter;
    $.postTweet = postTweet;
    $.updateDataTwitter = updateDataTwitter;
})();
