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
        subUsers = [],
        gwSubUsers = [],
        modListUsers = [],
        users = [],
        moderatorsCache = [],
        lastJoinPart = $.systemTime();


    /** 
     * @function hasKey
     * @param {Array} list
     * @param {*} value
     * @param {Number} [subIndex]
     * @returns {boolean}
     */
    function hasKey(list, value, subIndex) {
        var i;

        if (subIndex > -1) {
            for (i in list) {
                if (list[i][subIndex].equalsIgnoreCase(value)) {
                    return true;
                }
            }
        } else {
            for (i in list) {
                if (list[i].equalsIgnoreCase(value)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * @function userExists
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function userExists(username) {
        for (var i in users) {
            if (users[i][0].equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
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
        return (tags !== null && tags != '{}' && tags.get('user-type').length() > 0) || isModeratorCache(username.toLowerCase());
    }

    /**
     * @function isSub
     * @export $
     * @param {string} username
     * @returns {boolean}
     * @info this also included gamewisp subs and twitch subs.
     */
    function isSub(username) {
        return hasKey(subUsers, username, 0) || isGWSub(username.toLowerCase());
    }

    /**
     * @function isGWSub
     * @param {String}
     * @returns {Boolean}
     */
    function isGWSub(username) {
        return (username.toLowerCase() in gwSubUsers);
    }

    /**
     * @function isSubv3
     * @export $
     * @param {string} username
     * @param {Object} tags
     * @returns {boolean}
     * @info this also included gamewisp subs, and it will only check if the user is a sub with the tags.
     */
    function isSubv3(username, tags) {
        return ((tags !== null && tags != '{}' && tags.get('subscriber').equals('1')) || gwSubUsers[username] !== undefined);
    }

    /**
     * @function isTurbo
     * @export $
     * @param {Object} tags
     * @returns {boolean}
     */
    function isTurbo(tags) {
        return (tags !== null && tags != '{}' && tags.get('turbo').equals('1')) || false;
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
     * @function isHoster
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function isHoster(username) {
        return getUserGroupId(username.toLowerCase()) == 5;
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
        return hasKey(modeOUsers, username.toLowerCase(), 0);
    }

    /**
     * @function hasModList
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function hasModList(username) {
        return hasKey(modListUsers, username.toLowerCase());
    }

    /**
     * @function isTwitchSub
     * @param {String}
     * @returns {Boolean}
     */
    function isTwitchSub(username) {
        return hasKey(subUsers, username, 0);
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
                if ($.getUserGroupId(users[i][0]) <= filterId) {
                    array.push(users[i][0]);
                }
            } else {
                array.push(users[i][0]);
            }
        }
        return array;
    }

    /**
     * @function getGWTier
     * @export $
     * @param username
     */
    function getGWTier(username) {
        if (username.toLowerCase() in gwSubUsers) {
            return gwSubUsers[username];
        }
        return 0;
    }

    /**
     * @function addGWSubUsersList
     * @export $
     * @param username
     */
    function addGWSubUsersList(username, tier) {
        gwSubUsers[username] = tier;
    }

    /**
     * @function delGWSubUsersList
     * @export $
     * @param username
     */
    function delGWSubUsersList(username) {
        delete gwSubUsers[username];
    }
   
    /**
     * @function addSubUsersList
     * @export $
     * @param username
     */
    function addSubUsersList(username) {
        username = (username + '').toLowerCase();
        for (i in subUsers) {
            if (subUsers[i][0].equalsIgnoreCase(username)) {
                return;
            }
        }
        subUsers.push([username, $.systemTime() + 1e4]);
    }

    /**
     * @function delSubUsersList
     * @export $
     * @param username
     */
    function delSubUsersList(username) {
        var newSubUsers = [];

        username = (username + '').toLowerCase();
        for (i in subUsers) {
            if (!subUsers[i][0].equalsIgnoreCase(username)) {
                newSubUsers.push([subUsers[i][0], subUsers[i][1]]);
            }
        }
        subUsers = newSubUsers;
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
     * @param haveTwitchStatus
     */
    function restoreSubscriberStatus(username, haveTwitchStatus) {
        username = (username + '').toLowerCase();

        if ($.bot.isModuleEnabled('./handlers/subscribeHandler.js') ||
            $.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {

            if (isMod(username) || isAdmin(username)) {
                return;
            }

            if (haveTwitchStatus) {
                if ($.getIniDbBoolean('subscribed', username, false) && !isTwitchSub(username)) {
                    $.setIniDbBoolean('subscribed', username, false);
                } else if (!$.getIniDbBoolean('subscribed', username, false) && isTwitchSub(username)) {
                    $.setIniDbBoolean('subscribed', username, true);
                } 
            }

            if ($.getIniDbBoolean('gamewispsubs', username, false) && !isGWSub(username)) {
                $.setIniDbBoolean('gamewispsubs', username, false);
                $.inidb.set('gamewispsubs', username + '_tier', 1);
            } else if (!$.getIniDbBoolean('gamewispsubs', username, false) && isGWSub(username)) {
                $.setIniDbBoolean('gamewispsubs', username, true);
                $.inidb.set('gamewispsubs', username + '_tier', getGWTier(username));
            }

            if ((isTwitchSub(username) || isGWSub(username)) && getUserGroupId(username) != 3) {
                $.inidb.set('preSubGroup', username, getUserGroupId(username));
                setUserGroupByName(username, 'Subscriber');
            }

            if (haveTwitchStatus) {
                if ((!isTwitchSub(username) && !isGWSub(username)) && getUserGroupId(username) == 3) {
                    if ($.inidb.exists('preSubGroup', username)) {
                        $.inidb.set('group', username, $.inidb.get('preSubGroup', username));
                        $.inidb.del('preSubGroup', username);
                    } else {
                        $.inidb.set('group', username, 7);
                    }
                }
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
        $.getSetIniDbString('grouppoints', 'Hoster', '-1');
        $.getSetIniDbString('grouppointsoffline', 'Hoster', '-1');
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
        if (!userGroups[5] || userGroups[5] != 'Hoster') {
            userGroups[5] = 'Hoster';
            $.inidb.set('groups', '5', 'Hoster');
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
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function(event) {
        var username = event.getUser().toLowerCase();

        if (!userExists(username)) {
            if (!$.user.isKnown(username)) {
                $.setIniDbBoolean('visited', username, true);
            }
    
            lastJoinPart = $.systemTime();

            users.push([username, $.systemTime()]);
            $.checkGameWispSub(username);
        }
    });
    
    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var username = event.getSender().toLowerCase();
        
        if (!userExists(username)) {
            if (!$.user.isKnown(username)) {
                $.setIniDbBoolean('visited', username, true);
            }
        
            users.push([username, $.systemTime()]);
            $.checkGameWispSub(username);
        }
    });

    /**
     * @event ircChannelLeave
     */
    $.bind('ircChannelLeave', function(event) {
        var username = event.getUser().toLowerCase(),
            i;

        for (i in users) {
            if (users[i][0].equals(username.toLowerCase())) {
                users.splice(i, 1);
                restoreSubscriberStatus(username.toLowerCase(), true);

                // Remove this user's display name from the cache.
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
                        modeOUsers.push([username, 0]);
                        $.inidb.set('group', username, '0');
                    } else {
                        if (isAdmin(username)) {
                            modeOUsers.push([username, 1]);
                            $.inidb.set('group', username, '1');
                        } else {
                            modeOUsers.push([username, 2]);
                            $.inidb.set('group', username, '2');
                        }
                    }
                }
            } else {
                if (hasModeO(username)) {
                    var newmodeOUsers = [];

                    removeModeratorFromCache(username.toLowerCase());

                    for (i in modeOUsers) {
                        if (!modeOUsers[i][0].equalsIgnoreCase(username)) {
                            newmodeOUsers.push([modeOUsers[i][0], modeOUsers[i][1]]);
                        }
                    }

                    modeOUsers = newmodeOUsers;

                    if (isSub(username)) {
                        $.inidb.set('group', username, '3'); // Subscriber, return to that group.
                    } else {
                        $.inidb.set('group', username, '6'); // Assume user that was a mod was a regular.
                    }
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
            modMessageStart = 'the moderators of this room are: ',
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
            }
            if (message.indexOf('specialuser') > -1) {
                spl = message.split(' ');
                if (spl[2].equalsIgnoreCase('subscriber')) {
                    for (i in subUsers) {
                        if (subUsers[i][0].equalsIgnoreCase(spl[1])) {
                            subUsers[i][1] = $.systemTime() + 1e4;
                            return;
                        }
                    }
                    subUsers.push([spl[1], $.systemTime() + 1e4]);
                    restoreSubscriberStatus(spl[1].toLowerCase(), true);
                    for (i in subUsers) {
                        subsTxtList.push(subUsers[i][0]);
                    }
                    $.saveArray(subsTxtList, 'addons/subs.txt', false);
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
         * @commandpath permission [username] [groupId] - Get your current permission or optionally set the user permission for a user.
         */
        if (command.equalsIgnoreCase('permission')) {
            if (args[0] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.self.current', $.getUserGroupName(sender)));
                return;
            }

            var username = args[0],
                groupId = parseInt(args[1]);

            if ((args.length < 2 && username === undefined) || args.length > 2 || (isNaN(groupId) && username === undefined) || $.outOfRange(groupId, 0, userGroups.length - 1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.usage'));
                return;
            }

            if (username !== undefined && (isNaN(groupId) || groupId === undefined) && $.user.isKnown(username.toLowerCase())) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.other.current', $.username.resolve(args[0]), $.getUserGroupName(args[0])));
                return;
            }

            if (groupId == 3) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.grouppoints.set.sub.error'));
                return;
            }

            /**
             * This command is admin only by default. Admins should be able to set peoples group to whatever they want.
            if (!isOwner(sender) && groupId < getUserGroupId(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.error.abovegroup'));
                return;
            }

            if (!isOwner(sender) && groupId == getUserGroupId(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.error.samegroup'));
                return;
            }*/

            $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.success', $.username.resolve(username), getGroupNameById(groupId) + " (" + groupId + ")"));
            $.inidb.set('group', username.toLowerCase(), groupId);
            if (groupId <= 2) {
                addModeratorToCache(username.toLowerCase());
            } else {
                removeModeratorFromCache(username.toLowerCase());
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

        /** Load groups and generate default groups if they don't exist */
        reloadGroups();
        generateDefaultGroups();
        generateDefaultGroupPoints();

        /* Load the moderators cache. This needs to load after the privmsg check. */
        setTimeout(function() {
            loadModeratorsCache();
        }, 7000);
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
    $.isHoster = isHoster;
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
    $.restoreSubscriberStatus = restoreSubscriberStatus;
    $.addGWSubUsersList = addGWSubUsersList;
    $.delGWSubUsersList = delGWSubUsersList;
    $.addModeratorToCache = addModeratorToCache;
    $.removeModeratorFromCache = removeModeratorFromCache;
    $.getGWTier = getGWTier;
})();
