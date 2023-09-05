/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

/* global Packages */

/**
 * permissions.js
 *
 * (Previously known as permissionHandler.js)
 *
 * Provide an usergroups API
 * Use the $ API
 */
(function () {
    let userGroups = [],
            modeOUsers = new Packages.java.util.concurrent.CopyOnWriteArrayList(),
            subUsers = new Packages.java.util.concurrent.CopyOnWriteArrayList(),
            vipUsers = new Packages.java.util.concurrent.CopyOnWriteArrayList(),
            moderatorsCache = new Packages.java.util.concurrent.CopyOnWriteArrayList(),
            botList = new Packages.java.util.concurrent.CopyOnWriteArrayList(),
            lastJoinPart = $.systemTime(),
            isUpdatingUsers = false,
            _isSwappedSubscriberVIP = $.getSetIniDbBoolean('settings', 'isSwappedSubscriberVIP', true),
            _usersGroupsLock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @export $
     */
    let PERMISSION = {
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
        let twitchBots = $.readFile('./addons/ignorebots.txt');

        for (let i in twitchBots) {
            $.inidb.del('points', twitchBots[i].toLowerCase());
            $.inidb.del('time', twitchBots[i].toLowerCase());
        }
    }

    /**
     * @function loadTwitchBots
     *
     */
    function loadTwitchBots() {
        let twitchBots = $.readFile('./addons/ignorebots.txt');

        for (let i = 0; i < twitchBots.length; i++) {
            botList.addIfAbsent($.javaString(twitchBots[i].toLowerCase()));
        }
    }

    /**
     * @function isTwitchBot
     * @param {String} username
     * @returns {boolean}
     */
    function isTwitchBot(username) {
        return botList.contains($.javaString(username.toLowerCase()));
    }

    /**
     * @function removeTwitchBot
     * @param {String} username
     */
    function removeTwitchBot(username) {
        botList.remove($.javaString(username.toLowerCase()));
    }

    /**
     * @function addTwitchBot
     * @param {String} username
     */
    function addTwitchBot(username) {
        botList.addIfAbsent($.javaString(username.toLowerCase()));
    }

    /**
     * @function savebotList
     *
     */
    function saveBotList() {
        $.writeToFile(botList.toArray().join(String.fromCharCode(13, 10)), './addons/ignorebots.txt', false);
        cleanTwitchBots();
    }

    /**
     * @function hasKey
     * @param {Array} list
     * @param {*} value
     * @returns {boolean}
     */
    function hasKey(list, value) {
        for (let i = 0; i < list.length; i++) {
            if ($.equalsIgnoreCase(list[i], value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @function updateUsersObject
     * @param {Array} newUsers
     *
     * This function properly rebuilds the users list from a list of usernames.
     * The $.users object cannot be modified and if the users object is replaced,
     * then it disassociates from the original list causing issues.
     *
     *** This can take a very long time to complete and is very hard on your CPU when large array.
     * @deprecated
     */
    function updateUsersObject(newUsers) {}

    /**
     * @function getKeyIndex
     * @param {Array} list
     * @param {*} value
     * @returns {boolean}
     */
    function getKeyIndex(list, value) {
        for (let i = 0; i < list.length; i++) {
            if (list[i] !== undefined && $.equalsIgnoreCase(list[i], value)) {
                return i;
            }
        }

        return -1;
    }

    /**
     * @function userExists
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function userExists(username) {
        return hasKey($.users, username);
    }

    /**
     * @function isBot
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isBot(username) {
        return $.equalsIgnoreCase(username, $.botName);
    }

    /**
     * @function isOwner
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isOwner(username) {
        return $.equalsIgnoreCase(username, $.ownerName) || isBot(username);
    }

    /**
     * @function isCaster
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isCaster(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Caster || $.equalsIgnoreCase(username, $.channelName) || isOwner(username);
    }

    /**
     * @function isAdmin
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isAdmin(username) {
        return queryDBPermission(username.toLowerCase()) <= PERMISSION.Admin || isOwner(username);
    }

    /**
     * @function isModNoTags
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isModNoTags(username) {
        return isModeratorCache(username.toLowerCase()) || queryDBPermission(username.toLowerCase()) <= PERMISSION.Mod || isCaster(username);
    }

    /**
     * @function checkTags
     * @param {Object} tags
     * @returns {boolean}
     *
     * Checks if provided tags are not empty
     */
    function checkTags(tags) {
        $.consoleDebug('Tags: ' + tags + ', isNull: ' + (tags === null) + ', isUndefined: ' + (tags === undefined) + ', is -1: ' + (tags === '-1') + ', is {}: ' + (tags === '{}'));
        return !(tags === null || tags === '{}' || tags === '-1' || tags === undefined);
    }

    /**
     * @function isMod
     * @export $
     * @param {String} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isMod(username, tags) {
        $.consoleDebug('');
        if (checkTags(tags)) {
            if ($.strlen(tags.getOrDefault('user-type', '')) > 0 || tags.getOrDefault('mod', '0').equals('1')) {
                return true;
            }
        }

        $.consoleDebug('Used isMod without tags');
        return isModNoTags(username);
    }


    /**
     * @function isSubNoTags
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isSubNoTags(username) {
        return isSubCache(username) || queryDBPermission(username.toLowerCase()) === PERMISSION.Sub;
    }

    /**
     * @function isSub
     * @export $
     * @param {String} username
     * @param {Object} tags
     * @returns {boolean}
     */
    function isSub(username, tags) {
        $.consoleDebug('');
        if (checkTags(tags)) {
            if (tags.getOrDefault('subscriber', '0').equals('1')) {
                return true;
            }
        }

        $.consoleDebug('Used isSub without tags');
        return isSubNoTags(username);
    }

    /**
     * @function isTurbo
     * @export $
     * @param {Object} tags
     * @returns {boolean}
     */
    function isTurbo(tags) {
        $.consoleDebug('');
        if (checkTags(tags)) {
            if (tags.containsKey('turbo')) {
                return tags.get('turbo').equals('1');
            }
        }

        return false;
    }

    /**
     * @function isDonator
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isDonator(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Donator;
    }

    /**
     * @function isVIP
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isVIP(username, tags) {
        $.consoleDebug('');
        if (checkTags(tags)) {
            if (tags.containsKey('vip')) {
                return true;
            }
        }

        $.consoleDebug('Used isVIP without tags');
        return isVIPNoTags(username);
    }

    /**
     * @function isVIPNoTags
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isVIPNoTags(username) {
        return isVIPCache(username) || queryDBPermission(username.toLowerCase()) === PERMISSION.VIP;
    }

    /**
     * @function isRegular
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isRegular(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Regular;
    }

    /**
     * @deprecated
     *
     * @function isReg
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isReg(username) {
        return getUserGroupId(username.toLowerCase()) <= PERMISSION.Regular || isOwner(username);
    }

    /**
     * @function isViewer
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isViewer(username) {
        return queryDBPermission(username.toLowerCase()) === PERMISSION.Viewer;
    }

    /**
     * @function hasPermissionLevel
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function hasPermissionLevel(username) {
        return queryDBPermission(username.toLowerCase()) !== PERMISSION.None;
    }

    /**
     * @function hasModeO
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function hasModeO(username) {
        return modeOUsers.contains($.javaString(username.toLowerCase()));
    }

    /**
     * @function getUserGroupId
     * @export $
     * @param {String} username
     * @param {Object} tags
     * @returns {Number}
     *
     * Gets the lowest group id of a users according to the PERMISSION enum
     * A lower group id indicates a higher level of permissions
     */
    function getUserGroupId(username, tags) {

        if (isOwner(username) || isBot(username)) {
            return PERMISSION.Caster;
        }

        let id = PERMISSION.Viewer;

        if (id > PERMISSION.Caster && isCaster(username)) {
            id = PERMISSION.Caster;
        }
        if (id > PERMISSION.Admin && isAdmin(username)) {
            id = PERMISSION.Admin;
        }
        if (id > PERMISSION.Mod && isMod(username, tags)) {
            id = PERMISSION.Mod;
        }
        if (id > PERMISSION.Sub && isSub(username, tags)) {
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
     * @param {String} username
     * @param {Object} tags
     * @returns {Number}
     */
    function checkUserPermission(username, tags, permission) {
        $.consoleDebug('');

        if (permission === PERMISSION.Panel) {
            return isBot(username);
        }

        return getUserGroupId(username, tags) <= permission;
    }

    /**
     * @function permCom
     *
     * @export $
     * @param {String} username
     * @param {String} command
     * @param {sub} subcommand
     * @param {Object} tags
     * @returns {Number} 0 = good, 1 = command perm bad, 2 = subcommand perm bad
     *
     * Checks if the user has adequate permission to execute a command or subcommand
     */
    function permCom(username, command, subcommand, tags) {
        $.consoleDebug('');
        let commandGroup, allowed;
        if (subcommand === '' || subcommand === undefined) {
            commandGroup = $.getCommandGroup(command);
        } else {
            commandGroup = $.getSubcommandGroup(command, subcommand);
        }

        $.consoleDebug('Checking permissions for command: ' + command + ' and subcommand: ' + subcommand + ' with group/permission level: ' + commandGroup);
        $.consoleDebug('For user: ' + username + ' with group/permission level: ' + getUserGroupId(username, tags) + '(' + getUserGroupName(username, tags) + ')');
        $.consoleDebug('Current VIP id: ' + PERMISSION.VIP + ', Current Sub id: ' + PERMISSION.Sub + ', is VIPSubGroupID swapped: ' + _isSwappedSubscriberVIP);
        $.consoleDebug('isSub?: ' + isSub(username, tags) + ', isVIP?: ' + isVIP(username, tags) + ', isMod?: ' + isMod(username, tags) + ', isAdmin?: ' + isAdmin(username) + ', isDonator?: ' + isDonator(username) + ', isRegular?: ' + isRegular(username) + ' isCaster?: ' + isCaster(username));


        allowed = checkUserPermission(username, tags, parseInt(commandGroup));
        $.consoleDebug("Allowed: " + allowed + " Allowed var: " + (allowed ? 0 : (subcommand === '' ? 1 : 2)));

        return allowed ? 0 : (subcommand === '' ? 1 : 2);
    }

    /**
     * @function queryDBPermission
     * @export $
     * @param {String} username
     * @returns {Number}
     */
    function queryDBPermission(username) {
        return $.getIniDbNumber('group', username.toLowerCase(), PERMISSION.None);
    }

    /**
     * @function getUserGroupName
     * @export $
     * @param {String} username
     * @param {Object} tags
     * @returns {String}
     */
    function getUserGroupName(username, tags) {
        return getGroupNameById(getUserGroupId(username.toLowerCase(), tags));
    }

    /**
     * @function getGroupNameById
     * @export $
     * @param {Number} groupId
     * @param {String} defaultName
     * @returns {String}
     */
    function getGroupNameById(groupId, defaultName) {
        _usersGroupsLock.lock();
        try {
            return $.getIniDbString('groups', parseInt(groupId), (defaultName ? defaultName : userGroups[PERMISSION.Viewer]));
        } finally {
            _usersGroupsLock.unlock();
        }
    }

    /**
     * @function getGroupIdByName
     * @export $
     * @param {String} inGroupName
     * @returns {Number}
     */
    function getGroupIdByName(inGroupName) {
        let groupName = $.javaString(inGroupName),
                userGroupName;

        _usersGroupsLock.lock();
        try {
            for (let i = 0; i < userGroups.length; i++) {
                userGroupName = $.javaString(userGroups[i]);
                if ($.equalsIgnoreCase(userGroupName, groupName) || $.equalsIgnoreCase(userGroupName.substring(0, $.strlen(userGroupName) - 1), groupName)) {
                    return i;
                }
            }
        } finally {
            _usersGroupsLock.unlock();
        }

        return PERMISSION.Viewer;
    }

    /**
     * @function getGroupPointMultiplier
     * @export $
     * @param {String} username
     * @returns {Number}
     */
    function getGroupPointMultiplier(username) {
        return $.getIniDbNumber('grouppoints', getUserGroupName(username.toLowerCase()), -1);
    }

    /**
     * @function setUserGroupById
     * @export $
     * @param {String} username
     * @param {Number} id
     */
    function setUserGroupById(username, id) {
        if (id < PERMISSION.None) {
            $.setIniDbNumber('group', username.toLowerCase(), id);
        }
    }

    /**
     * @function setUserGroupByName
     * @export $
     * @param {String} username
     * @param {String} groupName
     */
    function setUserGroupByName(username, groupName) {
        setUserGroupById(username.toLowerCase(), getGroupIdByName(groupName.toLowerCase()));
    }

    /**
     * @function reloadGroups
     */
    function reloadGroups() {
        let groupKeys = $.inidb.GetKeyList('groups', '');

        _usersGroupsLock.lock();
        try {
            userGroups = [];

            for (let i in groupKeys) {
                userGroups[parseInt(groupKeys[i])] = $.getIniDbString('groups', groupKeys[i], '');
            }
        } finally {
            _usersGroupsLock.unlock();
        }
    }

    /**
     * @function getUsernamesArrayByGroupId
     * @param {Number} filterId
     * @returns {Array}
     */
    function getUsernamesArrayByGroupId(filterId) {
        let array = [];

        for (let i in $.users) {
            if (filterId) {
                if (getUserGroupId($.users[i]) <= filterId) {
                    array.push($.users[i]);
                }
            } else {
                array.push($.users[i]);
            }
        }

        return array;
    }

    /**
     * @function addSubUsersList
     * @export $
     * @param {String} username
     */
    function addSubUsersList(username) {
        subUsers.addIfAbsent($.javaString(username.toLowerCase()));
    }

    /**
     * @function delSubUsersList
     * @export $
     * @param {String} username
     */
    function delSubUsersList(username) {
        subUsers.remove($.javaString(username.toLowerCase()));
    }

    /**
     * @function isSubCache
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isSubCache(username) {
        return subUsers.contains($.javaString(username.toLowerCase()));
    }

    /**
     * @function addVIPUsersList
     * @export $
     * @param {String} username
     */
    function addVIPUsersList(username) {
        vipUsers.addIfAbsent($.javaString(username.toLowerCase()));
    }

    /**
     * @function delVIPUsersList
     * @export $
     * @param {String} username
     */
    function delVIPUsersList(username) {
        vipUsers.remove($.javaString(username.toLowerCase()));
    }

    /**
     * @function isVIPCache
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isVIPCache(username) {
        return vipUsers.contains($.javaString(username.toLowerCase()));
    }

    /**
     * @function isModeratorCache
     * @export $
     * @param {String} username
     * @returns {boolean}
     */
    function isModeratorCache(username) {
        return moderatorsCache.contains($.javaString(username.toLowerCase()));
    }

    /**
     * @function addModeratorToCache
     * @export $
     * @param {String} username
     */
    function addModeratorToCache(username) {
        moderatorsCache.addIfAbsent($.javaString(username.toLowerCase()));
    }

    /**
     * @function removeModeratorFromCache
     * @export $
     * @param {String} username
     */
    function removeModeratorFromCache(username) {
        moderatorsCache.remove($.javaString(username.toLowerCase()));
    }

    /**
     * @function loadModeratorsCache
     */
    function loadModeratorsCache() {
        let keys = $.inidb.GetKeyValueList('group', ''),
            a = new Packages.java.util.ArrayList();

        for (let i in keys) {
            if (parseInt(keys[i].getValue()) <= PERMISSION.Mod) {
                a.add($.javaString(keys[i].getKey().toLowerCase()));
            }
        }

        $.consoleDebug("Adding the mods to the moderator cache: " + a.toString());
        moderatorsCache.addAllAbsent(a);
    }

    /**
     * @function restoreSubscriberStatus
     * @param {String} username
     *
     * Actual twitch users subscription status can be out of sync with what the database reflects. This function remediates this but adjusting the saved permission accordingly.
     * The subUsers cache should always be up-to-date with the users twitch subscription status and can thus be used to "fix" phantombot's permissions
     * VIPs do get updated through OMode and thus shouldn't need to be fixed
     */
    function restoreSubscriberStatus(username) {
        username = $.jsString(username.toString().toLowerCase());

        if (isMod(username) || isAdmin(username)) { //Ignore high privileged users
            return;
        }

        let oldID = queryDBPermission(username),
            isInCache = isSubCache(username);

        if (isInCache && oldID !== PERMISSION.Sub) { //User got added to subscriber cache but it's database value is out of sync
            if (isVIP(username) && oldID > PERMISSION.VIP) { //User is also a VIP - Only change permissions if needed
                setUserGroupById(username, getLowestIDSubVIP());
            } else if (!isVIP(username)){ //User is only a subscriber - Set permission accordingly
                setUserGroupById(username, PERMISSION.Sub);
            }

            oldID = (oldID > PERMISSION.Regular) ? PERMISSION.Regular : oldID; //Only save meaningful permissions
            $.setIniDbNumber('preSubGroup', username, oldID); //Save the old (permission) id for reference when the subscription runs out
        } else if (!isInCache && oldID === PERMISSION.Sub) { //User is not in the subscriber cache but holds subscriber permissions according to the database
            if (isVIP(username)) { //User is a VIP - Set permission to VIP
                setUserGroupById(username, PERMISSION.VIP);
            } else if ($.inidb.exists('preSubGroup', username)) { //User is not a VIP but has a reference to his old permissions - Use those
                setUserGroupById(username, $.getIniDbNumber('preSubGroup', username, PERMISSION.Viewer));
                $.inidb.del('preSubGroup', username);
            } else {
                setUserGroupById(username, PERMISSION.Viewer);
            }
        }
    }


    /**
     * @function getGroupList
     * @returns {String}
     */
    function getGroupList() {
        let keys = $.inidb.GetKeyList('groups', ''),
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
            temp.push('' + groups[i].id + ' (' + groups[i].group + ')');
        }

        return 'Permission IDs: ' + temp.join(', ');
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
        _usersGroupsLock.lock();
        try {
            if (!userGroups[PERMISSION.Caster] || !$.equalsIgnoreCase(userGroups[PERMISSION.Caster], 'Caster')) {
                userGroups[PERMISSION.Caster] = 'Caster';
                $.setIniDbString('groups', PERMISSION.Caster.toString(), 'Caster');
            }
            if (!userGroups[PERMISSION.Admin] || !$.equalsIgnoreCase(userGroups[PERMISSION.Admin], 'Administrator')) {
                userGroups[PERMISSION.Admin] = 'Administrator';
                $.setIniDbString('groups', PERMISSION.Admin.toString(), 'Administrator');
            }
            if (!userGroups[PERMISSION.Mod] || !$.equalsIgnoreCase(userGroups[PERMISSION.Mod], 'Moderator')) {
                userGroups[PERMISSION.Mod] = 'Moderator';
                $.setIniDbString('groups', PERMISSION.Mod.toString(), 'Moderator');
            }
            if (!userGroups[PERMISSION.Sub] || !$.equalsIgnoreCase(userGroups[PERMISSION.Sub], 'Subscriber')) {
                userGroups[PERMISSION.Sub] = 'Subscriber';
                $.setIniDbString('groups', PERMISSION.Sub.toString(), 'Subscriber');
            }
            if (!userGroups[PERMISSION.Donator] || !$.equalsIgnoreCase(userGroups[PERMISSION.Donator], 'Donator')) {
                userGroups[PERMISSION.Donator] = 'Donator';
                $.setIniDbString('groups', PERMISSION.Donator.toString(), 'Donator');
            }
            if (!userGroups[PERMISSION.VIP] || !$.equalsIgnoreCase(userGroups[PERMISSION.VIP], 'VIP')) {
                userGroups[PERMISSION.VIP] = 'VIP';
                $.setIniDbString('groups', PERMISSION.VIP.toString(), 'VIP');
            }
            if (!userGroups[PERMISSION.Regular] || !$.equalsIgnoreCase(userGroups[PERMISSION.Regular], 'Regular')) {
                userGroups[PERMISSION.Regular] = 'Regular';
                $.setIniDbString('groups', PERMISSION.Regular.toString(), 'Regular');
            }
            if (!userGroups[PERMISSION.Viewer] || !$.equalsIgnoreCase(userGroups[PERMISSION.Viewer], 'Viewer')) {
                userGroups[PERMISSION.Viewer] = 'Viewer';
                $.setIniDbString('groups', PERMISSION.Viewer.toString(), 'Viewer');
            }
        } finally {
            _usersGroupsLock.unlock();
        }

        setUserGroupById($.ownerName.toLowerCase(), PERMISSION.Caster);
        setUserGroupById($.botName.toLowerCase(), PERMISSION.Caster);
    }

    function swapSubscriberVIP() {
        _usersGroupsLock.lock();
        try {
            let oldSubL = userGroups[PERMISSION.Sub],
                oldSubD = $.getIniDbString('groups', PERMISSION.Sub.toString()),
                oldSubU = $.inidb.GetKeysByLikeValues('group', '', PERMISSION.Sub.toString()),
                newSubU = [],
                oldVIPL = userGroups[PERMISSION.VIP],
                oldVIPD = $.getIniDbString('groups', PERMISSION.VIP.toString()),
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
        } finally {
            _usersGroupsLock.unlock();
        }

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
     * @return {Number}
     * @export $
     * @info Get the higher group ID of VIP or Sub (Higher = less permissions)
     */
    function getHighestIDSubVIP() {
        return (PERMISSION.Sub > PERMISSION.VIP ? PERMISSION.Sub : PERMISSION.VIP);
    }

    /**
     * @function getLowestIDSubVIP
     * @return {Number}
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
     */
    $.bind('ircChannelUsersUpdate', function (event) {

        if (isUpdatingUsers) {
            return; //Skip this update run
        }

        // Don't allow other events to add or remove users.
        isUpdatingUsers = true;

        let chatters = event.chatters(),
                newUsers = [],
                keys = [],
                values = [];

        // Process new users list
        for (let i = 0; i < chatters.length; i++) {
            let username = $.jsString(chatters.get(i).login().toLowerCase());
            if (isTwitchBot(username)) {
                continue;
            }

            if (!isOwner(username) && !$.users.includes(username)) { //Ignore already known users and bots as well as the streamer
                keys.push(username);
                values.push('true');
                restoreSubscriberStatus(username);
            }

            newUsers.push(username);
        }

        $.users = newUsers;
        isUpdatingUsers = false;

        if (keys.length !== 0) {
            $.inidb.SetBatchString('visited', '', keys, values);
        }
    });

    /**
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function (event) {
        let username = $.jsString(event.getUser().toLowerCase());

        if (isTwitchBot(username)) {
            return;
        }

        if (!isUpdatingUsers && !userExists(username)) {
            if (!$.user.isKnown(username)) {
                $.setIniDbBoolean('visited', username, true);
            }

            lastJoinPart = $.systemTime();
        }
    });

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        let username = $.jsString(event.getSender().toLowerCase()),
            tags = event.getTags();

        if (isTwitchBot(username)) {
            return;
        }

        if (!isUpdatingUsers && !userExists(username)) {
            if (!$.user.isKnown(username)) {
                $.setIniDbBoolean('visited', username, true);
            }
        } else if (checkTags(tags)) { // The subscriber and vip cache should always be up-to-date for restoreSubscriberStatus() to properly work
            if (tags.getOrDefault('subscriber', '0').equals('1')) {
                addSubUsersList(username);
            } else {
                delSubUsersList(username);
            }
            if (tags.containsKey('vip')) {
                addVIPUsersList(username);
            } else {
                delVIPUsersList(username);
            }
        }
    });

    /**
     * @event ircChannelLeave
     */
    $.bind('ircChannelLeave', function (event) {
        let username = $.jsString(event.getUser().toLowerCase());

        if (!isUpdatingUsers) {
            if (userExists(username)) {
                restoreSubscriberStatus(username.toLowerCase());
            }
        }
    });

    /**
     * @event ircChannelUserMode
     */
    $.bind('ircChannelUserMode', function (event) {
        let username = event.getUser().toLowerCase();

        if ($.equalsIgnoreCase(event.getMode(), 'o')) {
            if (event.getAdd().toString().equals('true')) {
                if (!hasModeO(username)) {
                    addModeratorToCache(username.toLowerCase());
                    modeOUsers.addIfAbsent($.javaString(username.toLowerCase()));
                    if (isOwner(username)) {
                        setUserGroupById(username, PERMISSION.Caster);
                    } else if (isAdmin(username)) {
                        setUserGroupById(username, PERMISSION.Admin);
                    } else {
                        setUserGroupById(username, PERMISSION.Mod);
                    }
                }
            } else if (hasModeO(username)) {
                removeModeratorFromCache(username);
                modeOUsers.remove($.javaString(username.toLowerCase()));
                if (isSub(username) && isVIP(username)) {
                    setUserGroupById(username, getLowestIDSubVIP()); // Do not lower permissions if is sub and vip
                } else if (isSub(username)) {
                    setUserGroupById(username, PERMISSION.Sub);
                } else if (isVIP(username)) {
                    setUserGroupById(username, PERMISSION.VIP);
                } else {
                    setUserGroupById(username, PERMISSION.Viewer);
                }
            }
        } else if ($.equalsIgnoreCase(event.getMode(), 'vip')) {
            if (event.getAdd().toString().equals('true')) { // Add to VIP
                addVIPUsersList(username);
                if (isSub(username)) { // Subscriber and VIP - Assign the highest permission
                    addSubUsersList(username); //Add to SubUserList if absent
                    setUserGroupById(username, getLowestIDSubVIP());
                } else {
                    setUserGroupById(username, PERMISSION.VIP);
                }
            } else { //Remove from VIP
                delVIPUsersList(username);
                if (isSub(username)) { // Still subscriber - Remove only from VIP
                    setUserGroupById(username, PERMISSION.Sub);
                } else {
                    setUserGroupById(username, PERMISSION.Viewer);
                }
            }
        }
    });

    /**
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function (event) {
        let sender = event.getSender().toLowerCase(),
                message = event.getMessage().toLowerCase().trim(),
                subsTxtList = [],
                spl,
                i;

        if ($.equalsIgnoreCase(sender, 'jtv')) {
            if (message.indexOf('specialuser') > -1) {
                spl = message.split(' ');
                if ($.equalsIgnoreCase(spl[2], 'subscriber')) {
                    if (addSubUsersList(spl[1])) {

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
    $.bind('command', function (event) {
        let sender = event.getSender().toLowerCase(),
                command = event.getCommand(),
                args = event.getArgs(),
                actionValue = args[0];

        /*
         * @commandpath reloadbots - Reload the list of bots and users to ignore. They will not gain points or time.
         */
        if ($.equalsIgnoreCase(command, 'reloadbots')) {
            botList.clear();
            cleanTwitchBots();
            loadTwitchBots();
            $.say($.whisperPrefix(sender) + $.lang.get('permissions.reloadbots'));
        }

        /**
         * @commandpath users - List users currently in the channel
         */
        if ($.equalsIgnoreCase(command, 'users')) {
            if ($.users.length > 20) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.listtoolong', len));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.users', getUsernamesArrayByGroupId().join(', ')));
            }
        }

        /**
         * @commandpath mods - List mods currently in the channel
         */
        if ($.equalsIgnoreCase(command, 'mods')) {
            let tmp = getUsernamesArrayByGroupId(PERMISSION.Mod);
            if (tmp.length > 20) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.listtoolong', tmp.length));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.mods', tmp.join(', ')));
            }
        }

        /**
         * @commandpath ignorelist - List the bots from the ignorebots.txt
         */
        if ($.equalsIgnoreCase(command, 'ignorelist')) {
            if (botList.size() > 20) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignorelist.listtoolong', botList.size()));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('ignorelist', botList.toArray().join(', ')));
            }
        }

        /**
         * @commandpath ignoreadd [username] - Add a bot to the ignorebots.txt
         */
        if ($.equalsIgnoreCase(command, 'ignoreadd')) {
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
        if ($.equalsIgnoreCase(command, 'ignoreremove')) {
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
        if ($.equalsIgnoreCase(command, 'permission')) {
            if (args[0] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.self.current', $.getUserGroupName(sender)));
                return;
            }

            let username = $.user.sanitize(args[0]),
                    groupId = parseInt(args[1]);

            if (!$.user.isKnown(username)) {
                $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', username));
                return;
            }

            if (args[1] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.other.current', $.viewer.getByLogin(args[0]).name(), $.getUserGroupName(args[0])));
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

            $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.success', $.viewer.getByLogin(username).name(), getGroupNameById(groupId) + ' (' + groupId + ')'));
            setUserGroupById(username, groupId);
            if (groupId <= PERMISSION.Mod) {
                addModeratorToCache(username);
            } else {
                removeModeratorFromCache(username);
            }
        }

        /**
         * @commandpath permissionpoints [permissionID] [online / offline] [points] - Show/set the points gained for each permissions. -1 defaults to the global configuration.
         */
        if ($.equalsIgnoreCase(command, 'permissionpoints')) {
            let groupId,
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

            let onlinePoints = $.optIniDbNumber('grouppoints', getGroupNameById(groupId)),
                    offlinePoints = $.optIniDbNumber('grouppointsoffline', getGroupNameById(groupId));
            if (!args[1]) {

                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.showgroup', getGroupNameById(groupId),
                        (onlinePoints.isPresent() ? onlinePoints.get() : '(undefined)'),
                        $.pointNameMultiple,
                        (offlinePoints.isPresent() ? offlinePoints.get() : '(undefined)'),
                        $.pointNameMultiple));
                return;
            }

            channelStatus = args[1];
            if (!$.equalsIgnoreCase(channelStatus, 'online') && !$.equalsIgnoreCase(channelStatus, 'offline')) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.usage'));
                return;
            }

            if (!args[2]) {
                if ($.equalsIgnoreCase(channelStatus, 'online')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.showgroup.online', getGroupNameById(groupId),
                            (onlinePoints.isPresent() ? onlinePoints.get() : '(undefined)'),
                            $.pointNameMultiple));
                } else if ($.equalsIgnoreCase(channelStatus, 'offline')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.showgroup.offline', getGroupNameById(groupId),
                            (offlinePoints.isPresent() ? offlinePoints.get() : '(undefined)'),
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

            if ($.equalsIgnoreCase(channelStatus, 'online')) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.online', getGroupNameById(groupId), points, $.pointNameMultiple));
                $.inidb.set('grouppoints', getGroupNameById(groupId), points);
            } else if ($.equalsIgnoreCase(channelStatus, 'offline')) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.offline', getGroupNameById(groupId), points, $.pointNameMultiple));
                $.inidb.set('grouppointsoffline', getGroupNameById(groupId), points);
            }
        }

        /**
         * @commandpath swapsubscribervip - Swaps the Subscriber and VIP usergroups for the purposes of permcom
         */
        if ($.equalsIgnoreCase(command, 'swapsubscribervip')) {
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
        if ($.equalsIgnoreCase(command, 'permissions') || $.equalsIgnoreCase(command, 'permissionslist')) {
            $.say(getGroupList());
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
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
        $.registerChatCommand('./core/permissions.js', 'swapsubscribervip', $.PERMISSION.Admin);

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
    $.users = [];
    /**
     * @deprecated
     */
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
    $.isSubCache = isSubCache;
    $.isTurbo = isTurbo;
    $.isDonator = isDonator;
    $.isVIP = isVIP;
    $.isVIPCache = isVIPCache;
    $.isRegular = isRegular;
    $.isViewer = isViewer;
    $.hasPermissionLevel = hasPermissionLevel;
    $.hasModeO = hasModeO;
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
    $.isSubv3 = isSub;
    $.isModv3 = isMod;
    $.isReg = isReg;

})();
