/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
        isUpdatingUsers = false,
        _isSwappedSubscriberVIP = $.inidb.GetBoolean('settings', '', 'isSwappedSubscriberVIP');

    /**
     * @export $
     */
    var PERMISSION = {
        Caster: 0,
        Admin: 1,
        Mod: 2,
        Sub: _isSwappedSubscriberVIP ? 5 : 3,
        Donator: 4,
        VIP: _isSwappedSubscriberVIP ? 3 : 5,
        Regular: 6,
        Viewer: 7,
        Panel: 30,
        None: 99
    };

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
        for (var i = 0; i < list.length; i++) {
            if ($.equalsIgnoreCase(list[i], value)) {
                return true;
            }
        }

        return false;
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
        var i;

        for (i in newUsers) {
            if (!userExists(newUsers[i])) {
                users.push(newUsers[i]);
            }
        }

        for (i = users.length - 1; i >= 0; i--) {
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
        for (var i = 0; i < list.length; i++) {
            if (list[i] !== undefined && $.equalsIgnoreCase(list[i], value)) {
                return i;
            }
        }

        return -1;
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
        return username.equalsIgnoreCase($.ownerName) || isBot(username);
    }

    /**
     * @function isCaster
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isCaster(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Caster || isOwner(username);
    }

    /**
     * @function isAdmin
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isAdmin(username) {
        return queryDBPermission(username.toLowerCase()) <= PERMISSION.Admin || isOwner(username);
    }

    /**
     * @function isModNoTags
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isModNoTags(username) {
        return isModeratorCache(username.toLowerCase()) || queryDBPermission(username.toLowerCase()) <= PERMISSION.Mod || isOwner(username);
    }

    function checkTags(tags) {
        return tags !== null && tags != '{}' && tags != '-1' && tags !== undefined;
    }

    /**
     * @function isMod
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isMod(username, tags) {
        if (checkTags(tags)) {
            $.consoleLn('IsMod with Tags:' + tags.toString());
            if (tags.get('user-type').length() > 0) { // Broadcaster should be included here.
                return true;
            }
        }
        $.consoleLn('IsMod without Tags:');
        $.consoleDebug('Used isModv3 without tags::' + tags);
        return isModNoTags(username);
    }

    /**
     * @function isMod
     * @deprecated
     *
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isModv3(username, tags) {
        return isMod(username, tags);
    }

    /**
     * @function isSubNoTags
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isSubNoTags(username) {
        return subUsers.contains(java.util.Objects.toString(username.toLowerCase())) || queryDBPermission(username.toLowerCase()) === PERMISSION.Sub;
    }

    /**
     * @function isSub
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isSub(username, tags) {
        if (checkTags(tags)) {
            if (tags.containsKey('subscriber')) {
                return tags.get('subscriber').equals('1');
            }
        }

        $.consoleDebug('Used isSubv3 without tags::' + tags);
        return isSubNoTags(username);
    }

    /**
     * @function isSubv3
     * @deprecated
     *
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isSubv3(username, tags) {
        return isSub(username, tags);
    }

    /**
     * @function isTurbo
     * @export $
     * @param {Object} tags
     * @returns {boolean}
     */
    function isTurbo(tags) {
        return (checkTags(tags) && tags.get('turbo').equals('1'));
    }

    /**
     * @function isDonator
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isDonator(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Donator;
    }

    /**
     * @function isVIP
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isVIP(username, tags) {
        if (checkTags(tags)) {
            $.consoleLn('VIP tags' + tags.toString());
            if (tags.containsKey('vip')) {
                return tags.get('vip').equals('1');
            }
        }

        $.consoleDebug('Used isVIP without tags::' + tags);
        return isVIPNoTags(username);
    }

    /**
     * @function isVIPNoTags
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isVIPNoTags(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.VIP || vipUsers.includes(username.toLowerCase());
    }

    /**
     * @function isRegular
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isRegular(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Regular;
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
     * @deprecated
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
     * @param {Object} tags
     * @returns {Number}
     */
    function getUserGroupId(username, tags) {

        if (isOwner(username) || isBot(username)) {
            return PERMISSION.Caster;
        }

        var id = PERMISSION.Viewer;

        if (id > PERMISSION.Caster && isCaster(username)) {
            id = PERMISSION.Caster;
        }
        if (id > PERMISSION.Admin && isAdmin(username)) {
            id = PERMISSION.Admin;
        }
        if (id > PERMISSION.Mod && isMod(username, tags)) {
            id = PERMISSION.Mod;
        }
        if (id > PERMISSION.Sub && isSub(username, tags)){
            id = PERMISSION.Sub;
        }
        if (id > PERMISSION.Donator && isDonator(username)) {
            id = PERMISSION.Donator;
        }
        if (id > PERMISSION.VIP && isVIP(username, tags)) {
            id = PERMISSION.VIP;
        }
        if (id > PERMISSION.Regular && isRegular(username)) {
            id = PERMISSION.Regular;
        }

        return id;
    }

    /**
     * @function checkUserPermission
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {Number}
     */
    function checkUserPermission(username, tags, permission) {
        return getUserGroupId(username, tags) <= permission;
    }

    /*
     * @function permCom
     *
     * @export $
     * @param {string} username
     * @param {string} command
     * @param {sub} subcommand
     * @returns 0 = good, 1 = command perm bad, 2 = subcommand perm bad
     */
    function permCom(username, command, subcommand, tags) {
        var commandGroup, allowed;
        if (subcommand === '' || subcommand === undefined) {
            commandGroup = $.getCommandGroup(command);
        } else {
            commandGroup = $.getSubcommandGroup(command, subcommand);
        }

        $.consoleDebug('Checking permissions for command: ' + command + 'and subcommand: ' + subcommand + ' with group/permission level: ' + commandGroup);
        $.consoleDebug('For user: ' + username + ' with group/permission level: ' + getUserGroupId(username) + '(' + getUserGroupName(username) + ')');
        $.consoleDebug('Current VIP id: ' + PERMISSION.VIP + ' Current Sub id: ' + PERMISSION.Sub + ' is VIPSubGroupID swapped: ' + _isSwappedSubscriberVIP);
        $.consoleDebug('isSub?: ' + isSub(username, tags) + ' isVIP?: ' + isVIP(username, tags) + ' isMod?: ' + isMod(username, tags) + ' isAdmin?: ' + isAdmin(username) + ' isDonator?: ' + isDonator(username) + ' isRegular?: ' + isRegular(username) + ' isCaster?: ' + isCaster(username));


        allowed = checkUserPermission(username, tags, parseInt(commandGroup));
        $.consoleDebug("Allowed: " + allowed + " Allowed var: " + (allowed ? 0 : (subcommand === '' ? 1 : 2)));

        return allowed ? 0 : (subcommand === '' ? 1 : 2);
    }

    /**
     * @function queryDBPermission
     * @export $
     * @param {string} username
     * @returns {Number}
     */
    function queryDBPermission(username) {
        var id = PERMISSION.None;
        if ($.inidb.exists('group', username.toLowerCase())) {
            id = parseInt($.inidb.get('group', username.toLowerCase()));
        }
        return id;
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
    function getGroupNameById(groupId, defaultName) {
        return $.getIniDbString('groups', parseInt(groupId), (defaultName ? defaultName : userGroups[PERMISSION.Viewer]));
    }

    /**
     * @function getGroupIdByName
     * @export $
     * @param {string} groupName
     * @returns {Number}
     */
    function getGroupIdByName(inGroupName) {
        var groupName = $.javaString(inGroupName),
            userGroupName;

        for (var i = 0; i < userGroups.length; i++) {
            userGroupName = $.javaString(userGroups[i]);
            if (userGroupName.equalsIgnoreCase(groupName.toLowerCase()) || userGroupName.substring(0, userGroupName.length() - 1).equalsIgnoreCase(groupName.toLowerCase())) {
                return i;
            }
        }

        return PERMISSION.Viewer;
    }

    /**
     * @function getGroupPointMultiplier
     * @export $
     * @param username
     * @returns {Number}
     */
    function getGroupPointMultiplier(username) {
        return $.getIniDbNumber('grouppoints', getUserGroupName(username.toLowerCase()), -1);
    }

    /**
     * @function setUserGroupById
     * @export $
     * @param {string} username
     * @param {Number} id
     */
    function setUserGroupById(username, id) {
        $.setIniDbNumber('group', username.toLowerCase(), id);
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
        var groupKeys = $.inidb.GetKeyList('groups', '');
        userGroups = [];

        for (var i in groupKeys) {
            userGroups[parseInt(groupKeys[i])] = $.getIniDbString('groups', groupKeys[i], '');
        }
    }

    /**
     * @function getUsernamesArrayByGroupId
     * @param {Number} [filterId]
     * @returns {Array}
     */
    function getUsernamesArrayByGroupId(filterId) {
        var array = [];

        for (var i in users) {
            if (filterId) {
                if (getUserGroupId(users[i]) <= filterId) {
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
     * @function addVIPUsersList
     * @export $
     * @param username
     */
    function addVIPUsersList(username) {
        if (!isVIP(username)) {
            vipUsers.push(username);
        }
    }

    /**
     * @function delVIPUsersList
     * @export $
     * @param username
     */
    function delVIPUsersList(username) {
        var idx = vipUsers.indexOf(username);
        if (idx > -1) {
            delete vipUsers[-1];
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
        var keys = $.inidb.GetKeyList('group', '');

        for (var i in keys) {
            if (parseInt($.inidb.get('group', keys[i])) <= PERMISSION.Mod) {
                addModeratorToCache(keys[i].toLowerCase());
            }
        }
    }

    /**
     * @function restoreSubscriberStatus
     * @param username
     */
    function restoreSubscriberStatus(username) {
        username = username.toString().toLowerCase();

        if (isMod(username) || isAdmin(username)) {
            return;
        }

        if (isSub(username) && getUserGroupId(username) !== PERMISSION.Sub) {
            $.setIniDbNumber('preSubGroup', username, getUserGroupId(username));
            if (isVIP(username)) {
                setUserGroupById(username, getHighestIDSubVIP());
            } else {
                setUserGroupById(username, PERMISSION.Sub);
            }
        }

        if (!isSub(username) && getUserGroupId(username) === PERMISSION.Sub) {
            if (isVIP(username)) {
                setUserGroupById(username, PERMISSION.VIP);
            } else if ($.inidb.exists('preSubGroup', username)) {
                setUserGroupById( username, $.getIniDbNumber('preSubGroup', username, PERMISSION.Viewer));
                $.inidb.del('preSubGroup', username);
            } else {
                setUserGroupById(username, PERMISSION.Viewer);
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
                group: $.getIniDbString('groups', keys[i], '')
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
        if (!userGroups[PERMISSION.Caster] || !userGroups[PERMISSION.Caster].equalsIgnoreCase('Caster')) {
            userGroups[PERMISSION.Caster] = 'Caster';
            $.setIniDbString('groups', PERMISSION.Caster.toString(), 'Caster');
        }
        if (!userGroups[PERMISSION.Admin] || !userGroups[PERMISSION.Admin].equalsIgnoreCase('Administrator')) {
            userGroups[PERMISSION.Admin] = 'Administrator';
            $.setIniDbString('groups', PERMISSION.Admin.toString(), 'Administrator');
        }
        if (!userGroups[PERMISSION.Mod] || !userGroups[PERMISSION.Mod].equalsIgnoreCase('Moderator')) {
            userGroups[PERMISSION.Mod] = 'Moderator';
            $.setIniDbString('groups', PERMISSION.Mod.toString(), 'Moderator');
        }
        if (!userGroups[PERMISSION.Sub] || !userGroups[PERMISSION.Sub].equalsIgnoreCase('Subscriber')) {
            userGroups[PERMISSION.Sub] = 'Subscriber';
            $.setIniDbString('groups', PERMISSION.Sub.toString(), 'Subscriber');
        }
        if (!userGroups[PERMISSION.Donator] || !userGroups[PERMISSION.Donator].equalsIgnoreCase('Donator')) {
            userGroups[PERMISSION.Donator] = 'Donator';
            $.setIniDbString('groups', PERMISSION.Donator.toString(), 'Donator');
        }
        if (!userGroups[PERMISSION.VIP] || !userGroups[PERMISSION.VIP].equalsIgnoreCase('VIP')) {
            userGroups[PERMISSION.VIP] = 'VIP';
            $.setIniDbString('groups', PERMISSION.VIP.toString(), 'VIP');
        }
        if (!userGroups[PERMISSION.Regular] || !userGroups[PERMISSION.Regular].equalsIgnoreCase('Regular')) {
            userGroups[PERMISSION.Regular] = 'Regular';
            $.setIniDbString('groups', PERMISSION.Regular.toString(), 'Regular');
        }
        if (!userGroups[PERMISSION.Viewer] || !userGroups[PERMISSION.Viewer].equalsIgnoreCase('Viewer')) {
            userGroups[PERMISSION.Viewer] = 'Viewer';
            $.setIniDbString('groups', PERMISSION.Viewer.toString(), 'Viewer');
        }

        setUserGroupById($.ownerName.toLowerCase(), PERMISSION.Caster);
        setUserGroupById($.botName.toLowerCase(), PERMISSION.Caster);
    }

    function swapSubscriberVIP() {
        var oldSubL = userGroups[PERMISSION.Sub],
            oldSubD = $.inidb.get('groups', PERMISSION.Sub.toString()),
            oldSubU = $.inidb.GetKeysByLikeValues('group', '', PERMISSION.Sub.toString()),
            newSubU = [],
            oldVIPL = userGroups[PERMISSION.VIP],
            oldVIPD = $.inidb.get('groups', PERMISSION.VIP.toString()),
            oldVIPU = $.inidb.GetKeysByLikeValues('group', '', PERMISSION.VIP.toString()),
            newVIPU = [],
            temp = PERMISSION.VIP,
            i;
        PERMISSION.VIP = PERMISSION.Sub;
        PERMISSION.Sub = temp;
        for (i in oldSubU) {
            newSubU[i] = PERMISSION.Sub;
        }

        for (i in oldVIPU) {
            newVIPU[i] = PERMISSION.VIP;
        }

        userGroups[PERMISSION.VIP] = oldVIPL;
        userGroups[PERMISSION.Sub] = oldSubL;
        $.inidb.set('groups', PERMISSION.VIP.toString(), oldVIPD);
        $.inidb.set('groups', PERMISSION.Sub.toString(), oldSubD);
        $.inidb.SetBatchString('group', '', oldSubU, newSubU);
        $.inidb.SetBatchString('group', '', oldVIPU, newVIPU);
        _isSwappedSubscriberVIP = !_isSwappedSubscriberVIP;
        $.inidb.SetBoolean('settings', '', 'isSwappedSubscriberVIP', _isSwappedSubscriberVIP);
        //Update Permission export (needs to be done since VIP and Sub are computed variables, otherwise VIP and Sub doesn't get switched)
        $.PERMISSION = PERMISSION;
    }

    /**
     * @deprecated
     * @returns {boolean}
     */
    function isSwappedSubscriberVIP() {
        return _isSwappedSubscriberVIP;
    }

    /**
     * @function getHighestIDSubVIP
     * @return {number}
     * @export $
     * @info Get the higher group ID of VIP or Sub (Higher = less permissions)
     */
    function getHighestIDSubVIP() {
        return (PERMISSION.Sub > PERMISSION.VIP ? PERMISSION.Sub : PERMISSION.VIP);
    }

    /**
     * @function getLowestIDSubVIP
     * @return {number}
     * @export $
     * @info Get the lower group ID of VIP or Sub (Lower = more permissions)
     */
    function getLowestIDSubVIP() {
        return (PERMISSION.Sub < PERMISSION.VIP ? PERMISSION.Sub : PERMISSION.VIP);
    }

    /**
     * @deprecated
     * @function getSubscriberGroupID
     * @export $
     */
    function getSubscriberGroupID() {
        return PERMISSION.Sub;
    }

    /**
     * @deprecated
     * @function getVIPGroupID
     * @export $
     */
    function getVIPGroupID() {
        return PERMISSION.VIP;
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
                i;

            // Handle parts
            for (i = 0; i < parts.length; i++) {
                // Cast the user as a string, because Rhino.
                parts[i] = parts[i].toString();
                // Remove the user from the users array.
                var t = getKeyIndex($.users, parts[i]);
                if (t >= 0) {
                    $.users.splice(t, 1);
                }

                $.restoreSubscriberStatus(parts[i]);
                $.username.removeUser(parts[i]);
            }

            // Handle joins.
            for (i = 0; i < joins.length; i++) {
                // Cast the user as a string, because Rhino.
                joins[i] = joins[i].toString();
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
        var username = event.getUser().toLowerCase();

        if (event.getMode().equalsIgnoreCase('o')) {
            if (event.getAdd().toString().equals('true')) {
                if (!hasModeO(username)) {
                    addModeratorToCache(username.toLowerCase());
                    if (isOwner(username)) {
                        modeOUsers.push(username);
                        setUserGroupById(username, PERMISSION.Caster);
                    } else if (isAdmin(username)) {
                        modeOUsers.push(username);
                        setUserGroupById(username, PERMISSION.Admin);
                    } else {
                        modeOUsers.push(username);
                        setUserGroupById(username, PERMISSION.Mod);
                    }
                }
            } else if (hasModeO(username)) {
                removeModeratorFromCache(username);

                var i = getKeyIndex(modeOUsers, username);

                if (i >= 0) {
                    modeOUsers.splice(i, 1);
                }

                if (isSub(username) && isVIP(username)) {
                    setUserGroupById(username, getHighestIDSubVIP());
                } else if (isSub(username)) {
                    setUserGroupById(username, PERMISSION.Sub);
                } else if (isVIP(username)) {
                    setUserGroupById(username, PERMISSION.VIP);
                }
            }
        } else if (event.getMode().equalsIgnoreCase('vip')) {
            if (event.getAdd().toString().equals('true')) {
                if (getUserGroupId(username) < PERMISSION.VIP) {
                    setUserGroupById(username, PERMISSION.VIP);
                }
            } else if (isVIP(username)) {
                if (isSub(username)) {
                    setUserGroupById(username, getHighestIDSubVIP());
                } else {
                    setUserGroupById(username, PERMISSION.VIP);
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
            val,
            i;

        if (sender.equalsIgnoreCase('jtv')) {
            if (message.indexOf(modMessageStart) > -1) {
                spl = message.replace(modMessageStart, '').split(', ');
                modListUsers = [];

                for (i in keys) {
                    val = queryDBPermission(keys[i]);
                    if (val === PERMISSION.None || val === PERMISSION.Mod) {
                        $.inidb.del('group', keys[i]);
                    }
                }

                for (i in spl) {
                    modListUsers.push(spl[i]);
                    if (!isAdmin(spl[i]) && !isBot(spl[i])) {
                        setUserGroupById(spl[i], PERMISSION.Mod);
                    }
                }

                $.saveArray(modListUsers, './addons/mods.txt', false);
            } else if (message.indexOf(vipMessageStart) > -1) {
                spl = message.replace(vipMessageStart, '').split(', ');
                vipUsers = [];

                for (i in keys) {
                    val = queryDBPermission(keys[i]);
                    if (val === PERMISSION.None || val === PERMISSION.VIP) {
                        $.inidb.del('group', keys[i]);
                    }
                }

                for (i in spl) {
                    vipUsers.push(spl[i]);
                    if (!isMod(spl[i]) && !isAdmin(spl[i]) && !isBot(spl[i])) {
                        setUserGroupById(spl[i], PERMISSION.VIP);
                    }
                }

                $.saveArray(vipUsers, './addons/vips.txt', false);
            } else if (message.indexOf(novipMessageStart) > -1) {
                for (i in keys) {
                    if (queryDBPermission(keys[i]) === PERMISSION.VIP) {
                        $.inidb.del('group', keys[i]);
                    }
                }

                $.deleteFile('./addons/vips.txt', true);
            } else if (message.indexOf('specialuser') > -1) {
                spl = message.split(' ');
                if (spl[2].equalsIgnoreCase('subscriber')) {
                    if (!subUsers.contains(spl[1].toLowerCase())) {
                        subUsers.add(spl[1]);

                        restoreSubscriberStatus(spl[1].toLowerCase());
                        for (i = 0; i < subUsers.size(); i++) {
                            subsTxtList.push(subUsers.get(i));
                        }

                        $.saveArray(subsTxtList, './addons/subs.txt', false);
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
            args = event.getArgs(),
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
            var tmp = getUsernamesArrayByGroupId(PERMISSION.Mod);
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

            if (groupId === PERMISSION.Sub) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.sub.error'));
                return;
            }

            if (!isOwner(sender) && groupId < getUserGroupId(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.error.abovegroup'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.success', $.username.resolve(username), getGroupNameById(groupId) + ' (' + groupId + ')'));
            $.setUserGroupById(username, groupId);
            if (groupId <= PERMISSION.Mod) {
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
         * @commandpath swapsubscribervip - Swaps the Subscriber and VIP usergroups for the purposes of permcom
         */
        if (command.equalsIgnoreCase('swapsubscribervip')) {
            swapSubscriberVIP();
            if (_isSwappedSubscriberVIP) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.swapsubscribervip.swapped'));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.swapsubscribervip.normal'));
            }
        }

        /**
         * @commandpath permissions - Give's you all the permissions with there id's
         * @commandpath permissionslist - Give's you all the permissions with there id's
         */
        if (command.equalsIgnoreCase('permissions') || command.equalsIgnoreCase('permissionslist')) {
            $.say(getGroupList());
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/permissions.js', 'permission', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'permissions', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'permissionslist', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'permissionpoints', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'users', $.PERMISSION.Mod);
        $.registerChatCommand('./core/permissions.js', 'mods', $.PERMISSION.Mod);
        $.registerChatCommand('./core/permissions.js', 'reloadbots', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'ignorelist', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'ignoreadd', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'ignoreremove', $.PERMISSION.Admin);
        $.registerChatCommand('./core/permissions.js', 'swapsubscribervip', $.PERMISSION.Admin1);

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
    $.isModeratorCache = isModeratorCache;
    $.isOwner = isOwner;
    $.isSub = isSub;
    $.isTurbo = isTurbo;
    $.isDonator = isDonator;
    $.isVIP = isVIP;
    $.isRegular = isRegular;
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
    $.addVIPUsersList = addVIPUsersList;
    $.delVIPUsersList = delVIPUsersList;
    $.addModeratorToCache = addModeratorToCache;
    $.removeModeratorFromCache = removeModeratorFromCache;
    $.updateUsersObject = updateUsersObject;
    $.restoreSubscriberStatus = restoreSubscriberStatus;
    $.PERMISSION = PERMISSION;
    $.getHighestIDSubVIP = getHighestIDSubVIP;
    $.getLowestIDSubVIP = getLowestIDSubVIP;
    $.checkUserPermission = checkUserPermission;
    $.permCom = permCom;

    //DEPRECATED Functions
    $.isSwappedSubscriberVIP = isSwappedSubscriberVIP;
    $.getSubscriberGroupID = getSubscriberGroupID;
    $.getVIPGroupID = getVIPGroupID;
    $.isSubv3 = isSubv3;
    $.isModv3 = isModv3;

})();
