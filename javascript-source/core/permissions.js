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

/**
 * permissions.js
 *
 * (Previously known as permissionHandler.js)
 *
 * Provide an usergroups API
 * Use the $ API
 */
(function() {
    var userGroups = [],
        modeOUsers = [],
        subUsers = new java.util.concurrent.CopyOnWriteArrayList(),
        vipUsers = [],
        modListUsers = [],
        users = [],
        moderatorsCache = [],
        botList = [],
        lastJoinPart = $.systemTime(),
        firstRun = true,
        isUpdatingUsers = false;

    /**
     * @function cleanTwitchBots
     */
    function cleanTwitchBots() {
        var twitchBots = $.readFile('./addons/ignorebots.txt');

        for (var i in twitchBots) {
            $.inidb.del('points', twitchBots[i].toLowerCase());
            $.inidb.del('time', twitchBots[i].toLowerCase());
        }
    }

    /**
     * @function loadTwitchBots
     *
     */
    function loadTwitchBots() {
        var twitchBots = $.readFile('./addons/ignorebots.txt');

        for (var i = 0; i < twitchBots.length; i++) {
            botList[twitchBots[i]] = true;
        }
    }

    /**
     * @function isTwitchBot
     * @param {string} username
     * @returns {Boolean}
     */
    function isTwitchBot(username) {
        return botList[username] !== undefined;
    }

    /**
     * @function removeTwitchBot
     *
     */
    function removeTwitchBot(username) {
        if (isTwitchBot(username)) {
            delete botList[username];
        }
    }

    /**
     * @function addTwitchBot
     *
     */
    function addTwitchBot(username) {
        if (!isTwitchBot(username)) {
            botList[username] = true;
        }
    }

    /**
     * @function savebotList
     *
     */
    function saveBotList() {
        $.writeToFile(Object.keys(botList).join(String.fromCharCode(13, 10)), './addons/ignorebots.txt', false);
        cleanTwitchBots();
    }

    /**
     * @function hasKey
     * @param {Array} list
     * @param {*} value
     * @returns {boolean}
     */
    function hasKey(list, value) {
        var exists = false;

        for (var i = 0; i < list.length; i++) {
            if (list[i] !== undefined && list[i].equalsIgnoreCase(value)) {
                exists = true;
                break;
            }
        }

        return exists;
    }

     /**
     * @function updateUsersObject
     * @param {Array} list
     *
     * This function properly rebuilds the users list from a list of usernames.
     * The $.users object cannot be modified and if the users object is replaced,
     * then it disassociates from the original list causing issues.
     *
     *** This can take a very long time to complete and is very hard on your CPU when large array.
     */
    function updateUsersObject(newUsers) {
        for (var i in newUsers) {
            if (!userExists(newUsers[i])) {
                users.push(newUsers[i]);
            }
        }

        for (var i = users.length - 1; i >= 0; i--) {
            if (!hasKey(newUsers, users[i])) {
                users.splice(i, 1);
            }
        }
    }

    /**
     * @function getKeyIndex
     * @param {Array} list
     * @param {*} value
     * @returns {boolean}
     */
    function getKeyIndex(list, value) {
        var idx = -1;

        for (var i = 0; i < list.length; i++) {
            if (list[i] !== undefined && $.equalsIgnoreCase(list[i], value)) {
                idx = i;
                break;
            }
        }

        return idx;
    }

    /**
     * @function userExists
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function userExists(username) {
        return hasKey(users, username);
    }

    /**
     * @function isBot
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isBot(username) {
        return username.equalsIgnoreCase($.botName);
    }

    /**
     * @function isOwner
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isOwner(username) {
        return username.equalsIgnoreCase($.ownerName) || username.equalsIgnoreCase($.botName);
    }

    /**
     * @function isCaster
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isCaster(username) {
        return getUserGroupId(username.toLowerCase()) == 0 || isOwner(username);
    }

    /**
     * @function isAdmin
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isAdmin(username) {
        return getUserGroupId(username.toLowerCase()) <= 1 || isOwner(username);
    }

    /**
     * @function isMod
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isMod(username) {
        return getUserGroupId(username.toLowerCase()) <= 2 || isOwner(username);
    }

    /**
     * @function isModv3
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isModv3(username, tags) {
        return (tags != null && tags != '{}' && tags.get('user-type').length() > 0) || isModeratorCache(username.toLowerCase()) || isOwner(username);
    }

    /**
     * @function isSub
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isSub(username) {
        return subUsers.contains(username.toLowerCase());
    }

    /**
     * @function isSubv3
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isSubv3(username, tags) {
        return (tags != null && tags != '{}' && tags.get('subscriber').equals('1')) || isSub(username);
    }

    /**
     * @function isTurbo
     * @export $
     * @param {Object} tags
     * @returns {boolean}
     */
    function isTurbo(tags) {
        return (tags != null && tags != '{}' && tags.get('turbo').equals('1')) || false;
    }

    /**
     * @function isDonator
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isDonator(username) {
        return getUserGroupId(username.toLowerCase()) == 4;
    }

    /**
     * @function isVIP
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isVIP(username, tags) {
        return (tags != null && tags != '{}' && tags.get('badges').indexOf('vip') !== -1) || getUserGroupId(username.toLowerCase()) == 5;
    }

    /**
     * @function isReg
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isReg(username) {
        return getUserGroupId(username.toLowerCase()) <= 6 || isOwner(username);
    }

    /**
     * @function hasModeO
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function hasModeO(username) {
        return hasKey(modeOUsers, username);
    }

    /**
     * @function hasModList
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function hasModList(username) {
        return hasKey(modListUsers, username);
    }

    /**
     * @function isTwitchSub
     * @param {String}
     * @returns {Boolean}
     */
    function isTwitchSub(username) {
        return isSub(username);
    }

    /**
     * @function getUserGroupId
     * @export $
     * @param {string} username
     * @returns {Number}
     */
    function getUserGroupId(username) {
        if ($.inidb.exists('group', username.toLowerCase())) {
            return parseInt($.inidb.get('group', username.toLowerCase()));
        } else {
            return 7;
        }
    }

    /**
     * @function getUserGroupName
     * @export $
     * @param {string} username
     * @returns {string}
     */
    function getUserGroupName(username) {
        return getGroupNameById(getUserGroupId(username.toLowerCase()));
    }

    /**
     * @function getGroupNameById
     * @export $
     * @param {Number} groupId
     * @returns {string}
     */
    function getGroupNameById(groupId) {
        groupId = parseInt(groupId);
        if ($.inidb.exists('groups', groupId)) {
            return $.inidb.get('groups', groupId);
        } else {
            return userGroups[7];
        }
    }

    /**
     * @function getGroupIdByName
     * @export $
     * @param {string} groupName
     * @returns {Number}
     */
    function getGroupIdByName(groupName) {
        var i;
        for (i = 0; i < userGroups.length; i++) {
            if (userGroups[i].equalsIgnoreCase(groupName.toLowerCase())) {
                return i;
            }
        }
        return 7;
    }

    /**
     * @function getGroupPointMultiplier
     * @export $
     * @param username
     * @returns {Number}
     */
    function getGroupPointMultiplier(username) {
        return parseInt($.inidb.get('grouppoints', getUserGroupName(username.toLowerCase())));
    }

    /**
     * @function setUserGroupById
     * @export $
     * @param {string} username
     * @param {Number} id
     */
    function setUserGroupById(username, id) {
        $.inidb.set('group', username.toLowerCase(), id);
    }

    /**
     * @function setUserGroupByName
     * @export $
     * @param username
     * @param groupName
     */
    function setUserGroupByName(username, groupName) {
        setUserGroupById(username.toLowerCase(), getGroupIdByName(groupName.toLowerCase()));
    }

    /**
     * @function reloadGroups
     */
    function reloadGroups() {
        var groupKeys = $.inidb.GetKeyList('groups', ''),
            i;

        userGroups = [];
        for (i in groupKeys) {
            userGroups[parseInt(groupKeys[i])] = $.inidb.get('groups', groupKeys[i]);
        }
    }

    /**
     * @function getUsernamesArrayByGroupId
     * @param {Number} [filterId]
     * @returns {Array}
     */
    function getUsernamesArrayByGroupId(filterId) {
        var i, array = [];
        for (i in users) {
            if (filterId) {
                if ($.getUserGroupId(users[i]) <= filterId) {
                    array.push(users[i]);
                }
            } else {
                array.push(users[i]);
            }
        }
        return array;
    }

    /**
     * @function addSubUsersList
     * @export $
     * @param username
     */
    function addSubUsersList(username) {
        if (!isSub(username)) {
            subUsers.add(username);
        }
    }

    /**
     * @function delSubUsersList
     * @export $
     * @param username
     */
    function delSubUsersList(username) {
        if (subUsers.contains(username)) {
            subUsers.remove(username);
        }
    }

    /**
     * @function isModeratorCache
     * @export $
     * @param username
     */
    function isModeratorCache(username) {
        return (moderatorsCache[username] !== undefined);
    }

    /**
     * @function addModeratorToCache
     * @export $
     * @param username
     */
    function addModeratorToCache(username) {
        moderatorsCache[username] = true;
    }

    /**
     * @function removeModeratorFromCache
     * @export $
     * @param username
     */
    function removeModeratorFromCache(username) {
        if (moderatorsCache[username] !== undefined) {
            delete moderatorsCache[username];
        }
    }

    /**
     * @function loadModeratorsCache
     */
    function loadModeratorsCache() {
        var keys = $.inidb.GetKeyList('group', ''),
            i;

        for (i in keys) {
            if (parseInt($.inidb.get('group', keys[i])) <= 2) {
                addModeratorToCache(keys[i].toLowerCase());
            }
        }
    }

    /**
     * @function restoreSubscriberStatus
     * @param username
     */
    function restoreSubscriberStatus(username) {
        username = (username + '').toLowerCase();

        if (isMod(username) || isAdmin(username)) {
            return;
        }

        if ($.getIniDbBoolean('subscribed', username, false) && !isTwitchSub(username)) {
            $.setIniDbBoolean('subscribed', username, false);
        } else if (!$.getIniDbBoolean('subscribed', username, false) && isTwitchSub(username)) {
            $.setIniDbBoolean('subscribed', username, true);
        }

        if (isTwitchSub(username) && getUserGroupId(username) != 3) {
            $.inidb.set('preSubGroup', username, getUserGroupId(username));
            setUserGroupByName(username, 'Subscriber');
        }

        if (!isTwitchSub(username) && getUserGroupId(username) == 3) {
            if ($.inidb.exists('preSubGroup', username)) {
                $.inidb.set('group', username, $.inidb.get('preSubGroup', username));
                $.inidb.del('preSubGroup', username);
            } else {
                $.inidb.set('group', username, 7);
            }
        }
    }

    function getGroupList() {
        var keys = $.inidb.GetKeyList('groups', ''),
            groups = [],
            temp = [],
            i;

        for (i in keys) {
            groups.push({
                id: keys[i],
                group: $.inidb.get('groups', keys[i])
            });
        }

        for (i in groups) {
            temp.push('Permission IDs: ' + groups[i].id + ' (' + groups[i].group + ')');
        }
        return temp.join(', ');
    }

    /**
     * @function generateDefaultGroupPoints
     */
    function generateDefaultGroupPoints() {
        $.getSetIniDbString('grouppoints', 'Caster', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Caster', '-1');
        $.getSetIniDbString('grouppoints', 'Administrator', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Administrator', '-1');
        $.getSetIniDbString('grouppoints', 'Moderator', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Moderator', '-1');
        $.getSetIniDbString('grouppoints', 'Subscriber', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Subscriber', '-1');
        $.getSetIniDbString('grouppoints', 'Donator', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Donator', '-1');
        $.getSetIniDbString('grouppoints', 'VIP', '-1');
        $.getSetIniDbString('grouppointsoffline', 'VIP', '-1');
        $.getSetIniDbString('grouppoints', 'Regular', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Regular', '-1');
        $.getSetIniDbString('grouppoints', 'Viewer', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Viewer', '-1');
    }

    /**
     * @function generateDefaultGroups
     */
    function generateDefaultGroups() {
        if (!userGroups[0] || userGroups[0] != 'Caster') {
            userGroups[0] = 'Caster';
            $.inidb.set('groups', '0', 'Caster');
        }
        if (!userGroups[1] || userGroups[1] != 'Administrator') {
            userGroups[1] = 'Administrator';
            $.inidb.set('groups', '1', 'Administrator');
        }
        if (!userGroups[2] || userGroups[2] != 'Moderator') {
            userGroups[2] = 'Moderator';
            $.inidb.set('groups', '2', 'Moderator');
        }
        if (!userGroups[3] || userGroups[3] != 'Subscriber') {
            userGroups[3] = 'Subscriber';
            $.inidb.set('groups', '3', 'Subscriber');
        }
        if (!userGroups[4] || userGroups[4] != 'Donator') {
            userGroups[4] = 'Donator';
            $.inidb.set('groups', '4', 'Donator');
        }
        if (!userGroups[5] || userGroups[5] != 'VIP') {
            userGroups[5] = 'VIP';
            $.inidb.set('groups', '5', 'VIP');
        }
        if (!userGroups[6] || userGroups[6] != 'Regular') {
            userGroups[6] = 'Regular';
            $.inidb.set('groups', '6', 'Regular');
        }
        if (!userGroups[7] || userGroups[7] != 'Viewer') {
            userGroups[7] = 'Viewer';
            $.inidb.set('groups', '7', 'Viewer');
        }
        $.inidb.set('group', $.ownerName.toLowerCase(), 0);
        $.inidb.set('group', $.botName.toLowerCase(), 0);
    }

    /**
     * @event ircChannelJoinUpdate
     *
     * @info Event that is sent when a large amount of people join/leave. This is done on a new thread.
     */
    $.bind('ircChannelUsersUpdate', function(event) {
        setTimeout(function() {
            // Don't allow other events to add or remove users.
            isUpdatingUsers = true;

            var joins = event.getJoins(),
                parts = event.getParts(),
                values = [],
                now = $.systemTime();

            // Handle parts
            for (var i = 0; i < parts.length; i++) {
                // Cast the user as a string, because Rhino.
                parts[i] = (parts[i] + '');
                // Remove the user from the users array.
                var t = getKeyIndex($.users, parts[i]);
                if (t >= 0) {
                    $.users.splice(t, 1);
                }

                $.restoreSubscriberStatus(parts[i]);
                $.username.removeUser(parts[i]);
            }

            // Handle joins.
            for (var i = 0; i < joins.length; i++) {
                // Cast the user as a string, because Rhino.
                joins[i] = (joins[i] + '');
                values[i] = 'true';

                if (isTwitchBot(joins[i])) {
                    continue;
                }

                // Since the user's array gets so big, let's skip it on first run in case the bot ever gets shutdown and restarted mid stream.
                if (!firstRun && !userExists(joins[i])) {
                    $.users.push(joins[i]);
                } else {
                    $.users.push(joins[i]);
                }
            }

            $.inidb.SetBatchString('visited', '', joins, values);

            isUpdatingUsers = false;
            firstRun = false;
        }, 0, 'core::permissions.js::ircChannelUsersUpdate');
    });

    /**
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function(event) {
        var username = event.getUser().toLowerCase();

        if (isTwitchBot(username)) {
            return;
        }

        if (!isUpdatingUsers && !userExists(username)) {
            if (!$.user.isKnown(username)) {
                $.setIniDbBoolean('visited', username, true);
            }

            lastJoinPart = $.systemTime();

            users.push(username);
        }
    });

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var username = event.getSender().toLowerCase();

        if (isTwitchBot(username)) {
            return;
        }

        if (!isUpdatingUsers && !userExists(username)) {
            if (!$.user.isKnown(username)) {
                $.setIniDbBoolean('visited', username, true);
            }

            users.push(username);
        }
    });

    /**
     * @event ircChannelLeave
     */
    $.bind('ircChannelLeave', function(event) {
        var username = event.getUser().toLowerCase(),
            i;

        if (!isUpdatingUsers) {
            i = getKeyIndex(users, username);

            if (i >= 0) {
                users.splice(i, 1);
                restoreSubscriberStatus(username.toLowerCase());
                $.username.removeUser(username);
            }
        }
    });

    /**
     * @event ircChannelUserMode
     */
    $.bind('ircChannelUserMode', function(event) {
        var username = event.getUser().toLowerCase(),
            i;

        if (event.getMode().equalsIgnoreCase('o')) {
            if (event.getAdd().toString().equals('true')) {
                if (!hasModeO(username)) {
                    addModeratorToCache(username.toLowerCase());
                    if (isOwner(username)) {
                        modeOUsers.push(username);
                        $.inidb.set('group', username, '0');
                    } else {
                        if (isAdmin(username)) {
                            modeOUsers.push(username);
                            $.inidb.set('group', username, '1');
                        } else {
                            modeOUsers.push(username);
                            $.inidb.set('group', username, '2');
                        }
                    }
                }
            } else {
                if (hasModeO(username)) {
                    removeModeratorFromCache(username);

                    i = getKeyIndex(modeOUsers, username);

                    if (i >= 0) {
                        modeOUsers.splice(i, 1);
                    }

                    if (isSub(username)) {
                        $.inidb.set('group', username, '3'); // Subscriber, return to that group.
                    } else {
                        $.inidb.set('group', username, '7');
                    }
                }
            }
        } else if (event.getMode().equalsIgnoreCase('vip')) {
            if (event.getAdd().toString().equals('true')) {
                if (getUserGroupId(username) < 5) {
                    setUserGroupById(username, 5);
                }
            } else {
                if (isVIP(username)) {
                    setUserGroupById(username, 7);
                }
            }
        }
    });

    /**
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function(event) {
        var sender = event.getSender().toLowerCase(),
            message = event.getMessage().toLowerCase().trim(),
            modMessageStart = 'the moderators of this channel are: ',
            vipMessageStart = 'vips for this channel are: ',
            novipMessageStart = 'this channel does not have any vips',
            keys = $.inidb.GetKeyList('group', ''),
            subsTxtList = [],
            spl,
            i;

        if (sender.equalsIgnoreCase('jtv')) {
            if (message.indexOf(modMessageStart) > -1) {
                spl = message.replace(modMessageStart, '').split(', ');
                modListUsers = [];

                for (i in keys) {
                    if ($.inidb.get('group', keys[i]).equalsIgnoreCase('2')) {
                        $.inidb.del('group', keys[i]);
                    }
                }

                for (i in spl) {
                    modListUsers.push(spl[i]);
                    if (!isAdmin(spl[i]) && !isBot(spl[i])) {
                        $.inidb.set('group', spl[i], '2');
                    }
                }
                $.saveArray(modListUsers, 'addons/mods.txt', false);
            } else if (message.indexOf(vipMessageStart) > -1) {
                spl = message.replace(vipMessageStart, '').split(', ');
                vipUsers = [];

                for (i in keys) {
                    if ($.inidb.get('group', keys[i]).equalsIgnoreCase('5')) {
                        $.inidb.del('group', keys[i]);
                    }
                }

                for (i in spl) {
                    vipUsers.push(spl[i]);
                    if (!isMod(spl[i]) && !isAdmin(spl[i]) && !isBot(spl[i])) {
                        $.inidb.set('group', spl[i], '5');
                    }
                }
                $.saveArray(vipUsers, 'addons/vips.txt', false);
            } else if (message.indexOf(novipMessageStart) > -1) {
                for (i in keys) {
                    if ($.inidb.get('group', keys[i]).equalsIgnoreCase('5')) {
                        $.inidb.del('group', keys[i]);
                    }
                }
                $.deleteFile('addons/vips.txt', true);
            } else if (message.indexOf('specialuser') > -1) {
                spl = message.split(' ');
                if (spl[2].equalsIgnoreCase('subscriber')) {
                    if (!subUsers.contains(spl[1].toLowerCase())) {
                        subUsers.add(spl[1]);

                        restoreSubscriberStatus(spl[1].toLowerCase());
                        for (var i = 0; i < subUsers.size(); i++) {
                            subsTxtList.push(subUsers.get(i));
                        }
                        $.saveArray(subsTxtList, 'addons/subs.txt', false);
                    }
                }
            }
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();
            actionValue = args[0];

        /*
         * @commandpath reloadbots - Reload the list of bots and users to ignore. They will not gain points or time.
         */
        if (command.equalsIgnoreCase('reloadbots')) {
            botList = [];
            cleanTwitchBots();
            loadTwitchBots();
            $.say($.whisperPrefix(sender) + $.lang.get('permissions.reloadbots'));
        }

        /**
         * @commandpath users - List users currently in the channel
         */
        if (command.equalsIgnoreCase('users')) {
            if (users.length > 20) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.listtoolong', users.length));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.users', getUsernamesArrayByGroupId().join(', ')));
            }
        }

        /**
         * @commandpath mods - List mods currently in the channel
         */
        if (command.equalsIgnoreCase('mods')) {
            var tmp = getUsernamesArrayByGroupId(2);
            if (tmp.length > 20) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.listtoolong', tmp.length));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.mods', tmp.join(', ')));
            }
        }

        /**
         * @commandpath ignorelist - List the bots from the ignorebots.txt
         */
        if (command.equalsIgnoreCase('ignorelist')) {
            var tmp = Object.keys(botList);
            if (tmp.length > 20) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignorelist.listtoolong', tmp.length));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ignorelist', Object.keys(botList).join(', ')));
            }
        }

        /**
         * @commandpath ignoreadd [username] - Add a bot to the ignorebots.txt
         */
        if (command.equalsIgnoreCase('ignoreadd')) {
            if (!actionValue) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.usage'));
            } else {
                actionValue = actionValue.toLowerCase();
                actionValue = $.user.sanitize(actionValue.trim());
                if (!isTwitchBot(actionValue)) {
                    addTwitchBot(actionValue);
                    saveBotList();
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.added', actionValue));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.nouser', actionValue));
                }
            }
        }

        /**
         * @commandpath ignoreremove [username] - Remove a bot from the ignorebots.txt
         */
        if (command.equalsIgnoreCase('ignoreremove')) {
            if (!actionValue) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.usage'));
            } else {
                actionValue = actionValue.toLowerCase();
                actionValue = $.user.sanitize(actionValue.trim());
                if (isTwitchBot(actionValue)) {
                    removeTwitchBot(actionValue);
                    saveBotList();
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.removed', actionValue));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.nouser', actionValue));
                }
            }
        }

        /**
         * @commandpath permission [username] [groupId] - Get your current permission or optionally get/set the user permission for a user.
         */
        if (command.equalsIgnoreCase('permission')) {
            if (args[0] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.self.current', $.getUserGroupName(sender)));
                return;
            }

            var username = $.user.sanitize(args[0]),
                groupId = parseInt(args[1]);

            if (!$.user.isKnown(username)) {
                $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', username));
                return;
            }

            if (args[1] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.other.current', $.username.resolve(args[0]), $.getUserGroupName(args[0])));
                return;
            }

            if (isNaN(groupId)) {
                groupId = parseInt(getGroupIdByName(args[1]));
            }

            if ((args.length < 2 && username === undefined) || args.length > 2 || (isNaN(groupId) && username === undefined) || $.outOfRange(groupId, 0, userGroups.length - 1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.usage'));
                return;
            }

            if (groupId == 3) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.sub.error'));
                return;
            }

            if (!isOwner(sender) && groupId < getUserGroupId(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.error.abovegroup'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.success', $.username.resolve(username), getGroupNameById(groupId) + " (" + groupId + ")"));
            $.inidb.set('group', username, groupId);
            if (groupId <= 2) {
                addModeratorToCache(username);
            } else {
                removeModeratorFromCache(username);
            }
        }

        /**
         * @commandpath permissionpoints [permissionID] [online / offline] [points] - Show/set the points gained for each permissions. -1 defaults to the global configuration.
         */
        if (command.equalsIgnoreCase('permissionpoints')) {
            var groupId,
                channelStatus,
                points;

            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.usage'));
                return;
            }

            groupId = parseInt(args[0]);
            if (isNaN(groupId) || $.outOfRange(groupId, 0, userGroups.length - 1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.usage'));
                return;
            }

            if (!args[1]) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.showgroup', getGroupNameById(groupId),
                    ($.inidb.exists('grouppoints', getGroupNameById(groupId)) ? $.inidb.get('grouppoints', getGroupNameById(groupId)) : '(undefined)'),
                    $.pointNameMultiple,
                    ($.inidb.exists('grouppointsoffline', getGroupNameById(groupId)) ? $.inidb.get('grouppointsoffline', getGroupNameById(groupId)) : '(undefined)'),
                    $.pointNameMultiple));
                return;
            }

            channelStatus = args[1];
            if (!channelStatus.equalsIgnoreCase('online') && !channelStatus.equalsIgnoreCase('offline')) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.usage'));
                return;
            }

            if (!args[2]) {
                if (channelStatus.equalsIgnoreCase('online')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.showgroup.online', getGroupNameById(groupId),
                        ($.inidb.exists('grouppoints', getGroupNameById(groupId)) ? $.inidb.get('grouppoints', getGroupNameById(groupId)) : '(undefined)'),
                        $.pointNameMultiple));
                } else if (channelStatus.equalsIgnoreCase('offline')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.showgroup.offline', getGroupNameById(groupId),
                        ($.inidb.exists('grouppointsoffline', getGroupNameById(groupId)) ? $.inidb.get('grouppointsoffline', getGroupNameById(groupId)) : '(undefined)'),
                        $.pointNameMultiple));
                }
                return;
            }

            points = parseInt(args[2]);
            if (isNaN(points)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.usage'));
                return;
            }

            if (points < 0) {
                points = -1;
            }

            if (channelStatus.equalsIgnoreCase('online')) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.online', getGroupNameById(groupId), points, $.pointNameMultiple));
                $.inidb.set('grouppoints', getGroupNameById(groupId), points);
            } else if (channelStatus.equalsIgnoreCase('offline')) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.offline', getGroupNameById(groupId), points, $.pointNameMultiple));
                $.inidb.set('grouppointsoffline', getGroupNameById(groupId), points);
            }
        }

        /**
         * @commandpath permission - Give's you all the ppermissions with there id's
         */
        if (command.equalsIgnoreCase('permissions') || command.equalsIgnoreCase('permissionlist')) {
            $.say(getGroupList());
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/permissions.js', 'permission', 1);
        $.registerChatCommand('./core/permissions.js', 'permissions', 1);
        $.registerChatCommand('./core/permissions.js', 'permissionlist', 1);
        $.registerChatCommand('./core/permissions.js', 'permissionpoints', 1);
        $.registerChatCommand('./core/permissions.js', 'users', 2);
        $.registerChatCommand('./core/permissions.js', 'mods', 2);
        $.registerChatCommand('./core/permissions.js', 'reloadbots', 1);
        $.registerChatCommand('./core/permissions.js', 'ignorelist', 1);
        $.registerChatCommand('./core/permissions.js', 'ignoreadd', 1);
        $.registerChatCommand('./core/permissions.js', 'ignoreremove', 1);


        /** Load groups and generate default groups if they don't exist */
        reloadGroups();
        generateDefaultGroups();
        generateDefaultGroupPoints();

        // Load the moderators cache. This needs to load after the privmsg check.
        setTimeout(loadModeratorsCache, 7e3);

        // Load up data for Twitch bots.
        loadTwitchBots();

        // Clean up data for Twitch bots.
        cleanTwitchBots();
    });

    /** Export functions to API */
    $.casterMsg = $.lang.get('cmd.casteronly');
    $.adminMsg = $.lang.get('cmd.adminonly');
    $.modMsg = $.lang.get('cmd.modonly');
    $.userGroups = userGroups;
    $.modeOUsers = modeOUsers;
    $.subUsers = subUsers;
    $.modListUsers = modListUsers;
    $.users = users;
    $.lastJoinPart = lastJoinPart;

    $.userExists = userExists;
    $.isBot = isBot;
    $.isTwitchBot = isTwitchBot;
    $.isOwner = isOwner;
    $.isCaster = isCaster;
    $.isAdmin = isAdmin;
    $.isMod = isMod;
    $.isModv3 = isModv3;
    $.isModeratorCache = isModeratorCache;
    $.isOwner = isOwner;
    $.isSub = isSub;
    $.isSubv3 = isSubv3;
    $.isTurbo = isTurbo;
    $.isDonator = isDonator;
    $.isVIP = isVIP;
    $.isReg = isReg;
    $.hasModeO = hasModeO;
    $.hasModList = hasModList;
    $.getUserGroupId = getUserGroupId;
    $.getUserGroupName = getUserGroupName;
    $.getGroupNameById = getGroupNameById;
    $.getGroupIdByName = getGroupIdByName;
    $.getGroupPointMultiplier = getGroupPointMultiplier;
    $.setUserGroupById = setUserGroupById;
    $.setUserGroupByName = setUserGroupByName;
    $.addSubUsersList = addSubUsersList;
    $.delSubUsersList = delSubUsersList;
    $.addModeratorToCache = addModeratorToCache;
    $.removeModeratorFromCache = removeModeratorFromCache;
    $.updateUsersObject = updateUsersObject;
    $.restoreSubscriberStatus = restoreSubscriberStatus;
})();
