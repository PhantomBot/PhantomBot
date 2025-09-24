/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
 * pointSystem.js
 *
 * Manage user loyalty points and export and API to manipulate points in other modules
 * Use the $ API
 */
(function () {
    let onlineGain = $.getSetIniDbNumber('pointSettings', 'onlineGain', 1),
            offlineGain = $.getSetIniDbNumber('pointSettings', 'offlineGain', 1),
            onlinePayoutInterval = $.getSetIniDbNumber('pointSettings', 'onlinePayoutInterval', 10),
            offlinePayoutInterval = $.getSetIniDbNumber('pointSettings', 'offlinePayoutInterval', 0),
            activeBonus = $.getSetIniDbNumber('pointSettings', 'activeBonus', 0),
            onlyModsCanCheckUsers = $.getSetIniDbBoolean('pointSettings', 'onlyModsCanCheckUsers', false),
            penalties = [],
            pointsBonus = false,
            pointsBonusAmount = 0,
            pointNameSingle = $.getSetIniDbString('pointSettings', 'pointNameSingle', 'point'),
            pointNameMultiple = $.getSetIniDbString('pointSettings', 'pointNameMultiple', 'points'),
            pointsMessage = $.getSetIniDbString('pointSettings', 'pointsMessage', '(userprefix) you currently have (pointsstring) and you have been in the chat for (time).'),
            payoutInterval,
            currentPayoutIntervalTime = -1,
            maxUpdateRetries = 3;

    /**
     * @function updateSettings
     */
    function updateSettings() {
        let tempPointNameSingle = pointNameSingle.toLowerCase(),
            tempPointNameMultiple = pointNameMultiple.toLowerCase();

        onlineGain = $.getIniDbNumber('pointSettings', 'onlineGain');
        offlineGain = $.getIniDbNumber('pointSettings', 'offlineGain');
        onlinePayoutInterval = $.getIniDbNumber('pointSettings', 'onlinePayoutInterval');
        offlinePayoutInterval = $.getIniDbNumber('pointSettings', 'offlinePayoutInterval');
        pointNameSingle = $.getIniDbString('pointSettings', 'pointNameSingle');
        $.pointNameSingle = pointNameSingle;
        pointNameMultiple = $.getIniDbString('pointSettings', 'pointNameMultiple');
        $.pointNameMultiple = pointNameMultiple;
        pointsMessage = $.getIniDbString('pointSettings', 'pointsMessage');
        activeBonus = $.getIniDbNumber('pointSettings', 'activeBonus');
        onlyModsCanCheckUsers = $.getIniDbBoolean('pointSettings', 'onlyModsCanCheckUsers');

        if (tempPointNameSingle !== 'point' && tempPointNameSingle !== pointNameSingle.toLowerCase()) {
            $.unregisterChatCommand(tempPointNameSingle);
            $.inidb.del('aliases', tempPointNameSingle);
        }

        if (tempPointNameMultiple !== 'points' && tempPointNameMultiple !== pointNameMultiple.toLowerCase()) {
            $.unregisterChatCommand(tempPointNameMultiple);
            $.inidb.del('aliases', tempPointNameMultiple);
        }

        if (pointNameSingle.toLowerCase() !== 'point') {
            $.registerChatCommand('./commands/customCommands.js', pointNameSingle.toLowerCase());
            $.inidb.set('aliases', pointNameSingle.toLowerCase(), 'points');
            $.registerChatAlias(pointNameSingle.toLowerCase());
        }

        if (pointNameMultiple.toLowerCase() !== 'points') {
            $.registerChatCommand('./commands/customCommands.js', pointNameMultiple.toLowerCase());
            $.inidb.set('aliases', pointNameMultiple.toLowerCase(), 'points');
            $.registerChatAlias(pointNameMultiple.toLowerCase());
        }

        setupPayoutRun();
    }

    /**
     * @returns {string} the singular name of points
     */
    function getPointNameSingle() {
        return pointNameSingle;
    }

    /**
     * @returns {string} the plural name of points
     */
    function getPointNameMultiple() {
        return pointNameMultiple;
    }

    /**
     * @function getUserPoints
     * @export $
     * @param {string} username the username to lookup
     * @returns {number} the number of points the user has
     */
    function getUserPoints(username) {
        return $.getIniDbNumber('points', username.toLowerCase(), 0);
    }

    /**
     * Attempts to perform a safe update of the users points.
     * If the current value is not `orig` at the time of writing, the `calcfunc` is called to recalculate and retry.
     * After retrying `maxUpdateRetries` times, the call fails
     * 
     * `calcfunc` must be defined as `function(username, current, value, retry)`, where `current`
     * is the new current value that caused the previous attempt to fail and `value` is the new target value
     * that failed to be written during the previous attempt
     * 
     * `calcfunc` must recurse to `updateUserPointsInternal` and return the result
     * if a retry is possible; otherwise, it should return `null` if a retry is not possible
     * (ie. due to a negative constraint failing on the new current value)
     * 
     * `retry` will be updated by this function when calling `calcfunc`, therefore it should not be modified by `calcfunc` but passed as-is
     * 
     * @param {string} username the username to update points for
     * @param {number} orig the original value
     * @param {number} value the new value
     * @param {Function} calcfunc a function, as described in the description, that recalculates the change on failure
     * @param {number} retry the retry count
     * @returns {number|null} the new value on success; `null` on failure
     */
    function updateUserPointsInternal(username, orig, value, calcfunc, retry) {
        if (retry === undefined || retry === null || retry < 0) {
            retry = 0;
        }

        if ($.inidb.SafeChangeLong('points', '', username.toLowerCase(), orig, value)) {
            return value;
        } else if (retry < maxUpdateRetries) {
            return calcfunc(username, getUserPoints(username), value, retry + 1);
        }

        return null;
    }

    /**
     * Attempts to perform a safe update of the users points.
     * If the current value is not `orig` at the time of writing, the `calcfunc` is called to recalculate.
     * After retrying `maxUpdateRetries` times, the call fails
     * 
     * `calcfunc` must be defined as `function(username, current, value)`, where `current`
     * is the new current value that caused the previous attempt to fail and `value` is the new target value
     * that failed to be written during the previous attempt
     * 
     * `calcfunc` must return the new value for the `value` param if it wants to attempt a retry, it should return `null` 
     * if a retry is not possible (ie. due to a negative constraint failing on the new current value)
     * 
     * `calcfunc` must NOT attempt to call `updateUserPoints` again, as it could cause
     * infinite looping and race conditions. Retry logic is handled internally
     * 
     * @param {string} username the username to update points for
     * @param {number} orig the original value
     * @param {number} value the new value
     * @param {Function} calcfunc a function, as described in the description, that recalculates the change on failure
     * @returns {number|null} the new value on success; `null` on failure
     */
    function updateUserPoints(username, orig, value, calcfunc) {
        function calcfuncInternal(username, current, value, retry) {
            let newval = calcfunc(username, current, value);
            if (newval !== undefined && newval !== null) {
                return updateUserPointsInternal(username, current, newval, calcfuncInternal, retry);
            }
            
            return null;
        }

        return updateUserPointsInternal(username, orig, value, calcfuncInternal, 0);
    }

    /**
     * Attempts to take points from a user, if they have enough balance to support it
     * 
     * @param {string} username the username to take points from
     * @param {number} points the number of points to take from the user
     * @param {boolean|null|undefined} zero `true` to zero out points instead of failing if user does not have enough points. default `false`
     * @returns {number|null} the users new point balance on success; `null` on failure
     */
    function takePoints(username, points, zero) {
        if (zero === undefined || zero === null) {
            zero = false;
        }

        let current = getUserPoints(username);

        if (current < points) {
            if (zero) {
                zeroUserPoints(username);
                return 0;
            }

            return null;
        }

        function takePointsCalc(username, current, value) {
            if (current < points) {
                return zero ? 0 : null;
            }

            return current - points;
        }

        return updateUserPoints(username, current, current - points, takePointsCalc);
    }

    /**
     * Attempts to give points to a user
     * 
     * @param {string} username the username to give points to
     * @param {number} points the number of points to give to the user
     * @returns {number|null} the users new point balance on success; `null` on failure
     */
    function givePoints(username, points) {
        let current = getUserPoints(username);

        function givePointsCalc(username, current, value) {
            return current + points;
        }

        return updateUserPoints(username, current, current + points, givePointsCalc);
    }

    /**
     * Attempts to transfer points from one user to another
     * 
     * To increase chances of success, this function tries 10 times to give the taken points to `toUsername`.
     * On failure, this function tries 10 times to return them back to `fromUsername`
     * 
     * @param {string} fromUsername the username to take points from
     * @param {string} toUsername the username to give points to
     * @param {number} points the number of points to transfer
     * @returns {Object.<string, number|null>} an object mapping the usernames to their new balances on success; usernames mapped to `null` on failure
     * @throws if points were successfully taken from `fromUsername` but then failed to either give them to `toUsername` or return them back to `fromUsername`
     */
    function transferPoints(fromUsername, toUsername, points) {
        let take = takePoints(fromUsername, points);
        let give = null;
        let giveback = null;

        if (take !== null) {
            for (let i = 0; i < 10 && give === null; i++) {
                give = givePoints(toUsername, points);
            }
        }

        if (take !== null && give === null) {
            for (let i = 0; i < 10 && give === null; i++) {
                giveback = givePoints(fromUsername, points);
            }
            
            if (giveback === null) {
                throw new Error('Took ' + points + ' points from ' + fromUsername + ' but failed to give them to ' + toUsername + ' or return them back to ' + fromUsername);
            }
        }

        return {
            fromUsername: giveback === null ? take : giveback,
            toUsername: give
        }
    }

    /**
     * Sets the users points to `0`
     * 
     * @param {string} username the username to set 
     */
    function zeroUserPoints(username) {
        $.setIniDbNumber('points', username, 0);
    }

    /**
     * Gives points to all users
     * 
     * @param {number} points the number of points to give
     * @param {Array<string>|null|undefined} users the users to give points to; `null` or `undefined` to use he list of users currently recognized as being in chat
     */
    function giveToAll(points, users) {
        if (users === undefined || users === null) {
            users = [];
            for (let i in $.users) {
                users.push($.users[i].toLowerCase());
            }
        }

        $.inidb.IncreaseBatchString('points', '', users, points);
    }

    /**
     * Takes points from all users currently recognized as being in chat
     * 
     * Any user whose points would go negative is instead set to `0`
     * 
     * @param {number} points the number of points to take 
     * @param {Array<string>|null|undefined} users the users to take points from; `null` or `undefined` to use he list of users currently recognized as being in chat
     */
    function takeFromAll(points, users) {
        if (users === undefined || users === null) {
            users = [];
            for (let i in $.users) {
                users.push($.users[i].toLowerCase());
            }
        }
        
        let takeUsers = [];

        for (let i in users) {
            let user = users[i];
            if (getUserPoints(user) >= points) {
                takeUsers.push(user);
            } else {
                zeroUserPoints(user);
            }
        }

        $.inidb.IncreaseBatchString('points', '', takeUsers, -points);
    }

    /**
     * @function getPointsString
     * @export $
     * @param {Number} points
     * @returns {string}
     */
    function getPointsString(points) {
        if (parseInt(points) === 1) {
            return points + ' ' + pointNameSingle;
        }
        return points + ' ' + pointNameMultiple;
    }

    function calcPointsGained(username, group, isOnline) {
        let table = 'grouppoints' + (isOnline ? '' : 'offline'),
                defaultGain = isOnline ? Math.max(onlineGain, 0) : Math.max(offlineGain, 0);

        username = $.jsString(username);
        group = $.jsString(group);

        let amount = $.getIniDbNumber(table, group, -1);

        if (group === 'Subscriber') {
            let plan = $.optIniDbString('subplan', username);
            if (plan.isPresent()) {
                amount = $.getIniDbNumber(table, ('Subscriber' + plan.get()), amount);
            }
        }

        if (amount < 0) {
            return defaultGain;
        }

        return amount;
    }

    /**
     * @function runPointsPayout
     */
    function runPointsPayout() {
        if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
            payoutInterval = clearInterval(payoutInterval);
            currentPayoutIntervalTime = -1;
            return;
        }

        let isOnline = $.isOnline($.channelName),
                activeList,
                active,
                chatList = $.viewer.chatters(),
                normalPayoutUsers = []; // users that get the normal online payout, nothing custom.

        if (isOnline && activeBonus > 0) {
            activeList = $.viewer.activeChatters();
            active = [];
            for (let i = 0; i < activeList.size(); i++) {
                active.push($.jsString(activeList.get(i).login().toLowerCase()));
            }
        }

        for (let i = 0; i < chatList.size(); i++) {
            let username = $.jsString(chatList.get(i).login().toLowerCase()),
                    amount = calcPointsGained(username, $.getUserGroupName(username), isOnline);

            if (active !== undefined && active.includes(username)) {
                amount += activeBonus;
            }

            if (pointsBonus && pointsBonusAmount > 0) {
                amount += pointsBonusAmount;
            }

            if (!getUserPenalty(username) && !$.isTwitchBot(username)) {
                if ((isOnline && onlineGain > 0 && amount === onlineGain) || (!isOnline && offlineGain > 0 && amount === offlineGain)) {
                    normalPayoutUsers.push($.javaString(username));
                } else if (amount > 0) {
                    $.inidb.incr('points', username, amount);
                }
            }
        }

        // Update points for all users with the same amount of online/offline gain.
        if (normalPayoutUsers.length > 0) {
            $.inidb.IncreaseBatchString('points', '', normalPayoutUsers, (isOnline ? onlineGain : offlineGain));
        }
    }

    /**
     * @function setupPayoutRun
     */
    function setupPayoutRun() {
        let minutes = $.isOnline($.channelName) ? onlinePayoutInterval : offlinePayoutInterval;
        if (currentPayoutIntervalTime === minutes) {
            return;
        }

        payoutInterval = clearInterval(payoutInterval);
        currentPayoutIntervalTime = minutes;

        if (minutes <= 0) {
            return;
        }

        payoutInterval = setInterval(function () {
            runPointsPayout();
        }, minutes * 6e4, 'scripts::systems::pointSystem.js');
    }

    /**
     * @function setPenalty
     */
    function setPenalty(sender, username, time, silent) {
        if (!username || !time) {
            if (!silent) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.err.penalty'));
            }
            return;
        }

        let newTime = (time * 6e4) + $.systemTime();
        username = $.jsString(username.toLowerCase());

        penalties.push({
            user: username,
            time: newTime
        });

        if (!silent) {
            time = $.getTimeStringMinutes((time * 6e4) / 1000);
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.penalty.set', username, time));
        }
    }

    /**
     * @function getUserPenalty
     * @param username
     */
    function getUserPenalty(username) {
        for (let i in penalties) {
            if ($.equalsIgnoreCase(penalties[i].user, username)) {
                if (penalties[i].time - $.systemTime() > 0) {
                    return true;
                }

                penalties.splice(i, 1);
                return false;
            }
        }

        return false;
    }

    /**
     * @function setTempBonus
     * @param {Number} amount
     * @param {Number} time
     */
    function setTempBonus(amount, time) {
        let newTime = (time * 6e4);
        if (!amount || !time) {
            return;
        }

        pointsBonus = true;
        pointsBonusAmount = parseInt(amount);

        setTimeout(function () {
            pointsBonus = false;
            pointsBonusAmount = 0;
        }, newTime);

        if (time >= 60) {
            newTime = $.getTimeString((time * 6e4) / 1000, true);
        } else {
            newTime = $.getTimeStringMinutes((time * 6e4) / 1000);
        }

        $.say($.lang.get('pointsystem.bonus.say', newTime, pointsBonusAmount, pointNameMultiple));
    }

    /**
     * @function giveAll
     * @param {Number} action
     */
    function giveAll(amount, sender) {
        if (amount < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.error.negative', pointNameMultiple));
            return;
        }

        giveToAll(amount);

        $.say($.lang.get('pointsystem.add.all.success', getPointsString(amount)));
    }

    /**
     * @function takeAll
     * @param {Number} action
     */
    function takeAll(amount, sender) {
        if (amount < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.error.negative', pointNameMultiple));
            return;
        }

        takeFromAll(amount);

        $.say($.lang.get('pointsystem.take.all.success', getPointsString(amount)));
    }

    /*
     * @function getPointsMessage
     */
    function getPointsMessage(username, displayName) {
        let s = pointsMessage;

        if (s.match(/\(userprefix\)/)) {
            s = $.replace(s, '(userprefix)', $.whisperPrefix(username).trim());
        }

        if (s.match(/\(user\)/)) {
            s = $.replace(s, '(user)', displayName);
        }

        if (s.match(/\(pointsstring\)/)) {
            s = $.replace(s, '(pointsstring)', String(getPointsString(getUserPoints(username))));
        }

        if (s.match(/\(points\)/)) {
            s = $.replace(s, '(points)', String(getUserPoints(username)));
        }

        if (s.match(/\(pointsname\)/)) {
            s = $.replace(s, '(pointsname)', String(pointNameMultiple));
        }

        if (s.match(/\(time\)/)) {
            s = $.replace(s, '(time)', $.getUserTimeString(username).trim());
        }

        if (s.match(/\(rank\)/)) {
            s = $.replace(s, '(rank)', ($.hasRank(username) ? String($.getRank(username)) : ''));
        }

        return s;
    }

    /**
     * @event twitchOnline
     */
    $.bind('twitchOnline', function () {
        setupPayoutRun();
    });

    /**
     * @event twitchOffline
     */
    $.bind('twitchOffline', function () {
        setupPayoutRun();
    });

    /**
     * @event command
     */
    $.bind('command', function (event) {
        let sender = event.getSender().toLowerCase(),
                username = $.username.resolve(sender, event.getTags()),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0],
                actionArg1 = args[1],
                actionArg2 = args[2],
                isMod = $.checkUserPermission(sender, event.getTags(), $.PERMISSION.Mod);

        /**
         * @commandpath points - Announce points in chat when no parameters are given.
         */
        if ($.equalsIgnoreCase(command, 'points') || $.equalsIgnoreCase(command, 'point') || $.equalsIgnoreCase(command, pointNameMultiple) || $.equalsIgnoreCase(command, pointNameSingle)) {
            // if onlyModsCanCheckUsers and the user is not a mod, then disallow progressing further
            if (!action || (!isMod && onlyModsCanCheckUsers)) {
                $.say(getPointsMessage(sender, username));
                return;
            }

            // Replace everything that is not \w
            action = $.user.sanitize(action);
            if ((actionArg1 === null || actionArg1 === undefined || actionArg1 === '') && $.user.isKnown(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.user.success', $.viewer.getByLogin(action).name(), getPointsString(getUserPoints(action))));
                return;
            }

            /**
             * @commandpath points add [username] [amount] - Add an amount of points to a user's balance
             */
            if ($.equalsIgnoreCase(action, 'add') || $.equalsIgnoreCase(action, 'give')) {
                actionArg1 = (actionArg1 + '').toLowerCase();
                actionArg2 = parseInt(actionArg2);
                if (isNaN(actionArg2) || !actionArg1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.usage'));
                    return;
                }

                if ($.equalsIgnoreCase(actionArg1, 'all')) {
                    giveAll(actionArg2, sender);
                    return;
                }

                // Replace everything that is not \w
                actionArg1 = $.user.sanitize(actionArg1);

                if (!$.user.isKnown(actionArg1) || $.isTwitchBot(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
                    return;
                }

                if (actionArg2 < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.error.negative', pointNameMultiple));
                    return;
                }

                if ($.user.isKnown(actionArg1)) {
                    $.inidb.incr('points', actionArg1, actionArg2);
                    $.say($.lang.get('pointsystem.add.success',
                            $.getPointsString(actionArg2), $.viewer.getByLogin(actionArg1).name(), getPointsString(getUserPoints(actionArg1))));
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.usage.invalid', '!' + command));
                return;
            }

            /**
             * @commandpath points take [username] [amount] - Take an amount of points from the user's balance
             */
            if ($.equalsIgnoreCase(action, 'take') || $.equalsIgnoreCase(action, 'remove')) {
                actionArg1 = (actionArg1 + '').toLowerCase();
                actionArg2 = parseInt(actionArg2);
                if (isNaN(actionArg2) || !actionArg1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.usage'));
                    return;
                }

                if ($.equalsIgnoreCase(actionArg1, 'all')) {
                    takeAll(actionArg2, sender);
                    return;
                }

                // Replace everything that is not \w
                actionArg1 = $.user.sanitize(actionArg1);

                if (!$.user.isKnown(actionArg1) || $.isTwitchBot(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
                    return;
                }

                if (actionArg2 > $.getUserPoints(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.error.toomuch', username, pointNameMultiple));
                    return;
                }

                $.inidb.decr('points', actionArg1, actionArg2);
                $.say($.lang.get('pointsystem.take.success',
                        $.getPointsString(actionArg2), $.viewer.getByLogin(actionArg1).name(), getPointsString(getUserPoints(actionArg1))));
                return;
            }

            /**
             * @commandpath points set [username] [amount] - Set the user's points balance to an amount
             */
            if ($.equalsIgnoreCase(action, 'set')) {
                actionArg1 = (actionArg1 + '').toLowerCase();
                actionArg2 = parseInt(actionArg2);
                if (isNaN(actionArg2) || !actionArg1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.setbalance.usage'));
                    return;
                }

                // Replace everything that is not \w
                actionArg1 = $.user.sanitize(actionArg1);

                if (!$.user.isKnown(actionArg1) || $.isTwitchBot(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
                    return;
                }

                if (actionArg2 < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.setbalance.error.negative', pointNameMultiple));
                    return;
                }

                $.inidb.set('points', actionArg1, actionArg2);
                $.say($.lang.get('pointsystem.setbalance.success',
                        pointNameSingle, $.viewer.getByLogin(actionArg1).name(), getPointsString(getUserPoints(actionArg1))));
                return;
            }

            /**
             * @commandpath points all [amount] - Send an amount of points to all users in the chat
             */
            if ($.equalsIgnoreCase(action, 'all')) {
                if (!parseInt(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.all.usage'));
                    return;
                }

                giveAll(actionArg1, sender);
                return;
            }

            /**
             * @commandpath points takeall [amount] - Remove an amount of points to all users in the chat
             */
            if ($.equalsIgnoreCase(action, 'takeall')) {
                if (!parseInt(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.all.usage'));
                    return;
                }

                takeAll(actionArg1, sender);
                return;
            }

            /**
             * @commandpath points setname single [name] - Set the points name for single points
             * @commandpath points setname multiple [name] - Set the points name for plural points
             * @commandpath points setname delete - Deletes single and multiple custom names
             */
            if ($.equalsIgnoreCase(action, 'setname')) {
                if (actionArg1 === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.usage'));
                    return;
                }
                if ($.equalsIgnoreCase(actionArg1, 'single') && actionArg2) {
                    if ($.equalsIgnoreCase(actionArg2, $.getIniDbString('pointSettings', 'pointNameSingle'))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.duplicate'));
                        return;
                    }

                    let temp = actionArg2.toLowerCase();
                    $.inidb.set('pointSettings', 'pointNameSingle', temp);
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.single.success', pointNameSingle, temp));
                    updateSettings();
                    return;
                }
                if ($.equalsIgnoreCase(actionArg1, 'multiple') && actionArg2) {
                    if ($.equalsIgnoreCase(actionArg2, $.getIniDbString('pointSettings', 'pointNameMultiple'))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.duplicate'));
                        return;
                    }

                    let temp = actionArg2.toLowerCase();
                    $.inidb.set('pointSettings', 'pointNameMultiple', temp);
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.multiple.success', pointNameMultiple, temp));
                    updateSettings();
                    return;
                }
                if ($.equalsIgnoreCase(actionArg1, 'delete')) {
                    $.inidb.set('pointSettings', 'pointNameSingle', 'point');
                    $.inidb.set('pointSettings', 'pointNameMultiple', 'points');
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.delete'));
                    updateSettings();
                    return;
                }

                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.usage'));
                return;
            }

            /**
             * @commandpath points setgain [amount] - Set the amount of points gained per payout interval while the channel is online, can be overriden by group settings
             */
            if ($.equalsIgnoreCase(action, 'setgain')) {
                actionArg1 = parseInt(actionArg1);
                if (isNaN(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.usage'));
                    return;
                }

                if (actionArg1 < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.error.negative', pointNameMultiple));
                    return;
                }

                onlineGain = actionArg1;
                $.inidb.set('pointSettings', 'onlineGain', onlineGain);
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.success', pointNameSingle, getPointsString(onlineGain), onlinePayoutInterval));
                return;
            }

            /**
             * @commandpath points setofflinegain [amount] - Set the amount of points gained per interval while the channel is offline, can be overridden by group settings
             */
            if ($.equalsIgnoreCase(action, 'setofflinegain')) {
                actionArg1 = parseInt(actionArg1);
                if (isNaN(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.offline.usage'));
                    return;
                }

                if (actionArg1 < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.error.negative', pointNameMultiple));
                    return;
                }

                offlineGain = actionArg1;
                $.inidb.set('pointSettings', 'offlineGain', offlineGain);
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.offline.success',
                        pointNameSingle, $.getPointsString(offlineGain), offlinePayoutInterval));
                return;
            }

            /**
             * @commandpath points setinterval [minutes] - Set the points payout interval for when the channel is online
             */
            if ($.equalsIgnoreCase(action, 'setinterval')) {
                actionArg1 = parseInt(actionArg1);
                if (isNaN(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.usage'));
                    return;
                }

                if (actionArg1 < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.error.negative', pointNameMultiple));
                    return;
                }

                onlinePayoutInterval = actionArg1;
                $.inidb.set('pointSettings', 'onlinePayoutInterval', onlinePayoutInterval);
                setupPayoutRun();
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.success', pointNameSingle, onlinePayoutInterval));
                return;
            }

            /**
             * @commandpath points setofflineinterval [minutes] - Set the points payout interval for when the channel is offline
             */
            if ($.equalsIgnoreCase(action, 'setofflineinterval')) {
                actionArg1 = parseInt(actionArg1);
                if (isNaN(actionArg1)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.offline.usage'));
                    return;
                }

                if (actionArg1 < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.error.negative', pointNameMultiple));
                    return;
                }

                offlinePayoutInterval = actionArg1;
                $.inidb.set('pointSettings', 'offlinePayoutInterval', offlinePayoutInterval);
                setupPayoutRun();
                $.say($.whisperPrefix(sender) + $.lang.get("pointsystem.set.interval.offline.success", pointNameSingle, offlinePayoutInterval));
                return;
            }

            /**
             * @commandpath points setmessage [message] - Set the points message for when someone uses the points command. - Tags: (userprefix), (user), (points), (pointsname), (pointsstring), (time), and (rank)
             */
            if ($.equalsIgnoreCase(action, 'setmessage')) {
                if (!actionArg1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.message.usage'));
                    return;
                }

                pointsMessage = args.slice(1).join(' ');
                $.inidb.set('pointSettings', 'pointsMessage', pointsMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.message.set', pointsMessage));
                return;
            }

            /**
             * @commandpath points bonus [amount] [time in minutes] - Gives a bonus amount of points at each payouts
             */
            if ($.equalsIgnoreCase(action, 'bonus')) {
                if (!actionArg1 || !actionArg2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.bonus.usage'));
                    return;
                }

                setTempBonus(actionArg1, actionArg2);
                return;
            }

            /**
             * @commandpath points resetall - Deletes everyones points
             */
            if ($.equalsIgnoreCase(action, 'resetall')) {
                $.inidb.RemoveFile('points');
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.reset.all'));
                return;
            }

            /**
             * @commandpath points setactivebonus [points] - Sets a bonus amount of points user get if they are active between the last payout.
             */
            if ($.equalsIgnoreCase(action, 'setactivebonus')) {
                if (actionArg1 === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.active.bonus.usage'));
                    return;
                }

                activeBonus = parseInt(actionArg1);
                $.setIniDbNumber('pointSettings', 'activeBonus', activeBonus);
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.active.bonus.set', getPointsString(activeBonus)));
                return;
            }

            /**
             * @commandpath points modonlyusercheck - Toggle allowing only mods able to view others points
             */
            if ($.equalsIgnoreCase(action, 'modonlyusercheck')) {
                onlyModsCanCheckUsers = !onlyModsCanCheckUsers;
                $.setIniDbBoolean('pointSettings', 'onlyModsCanCheckUsers', onlyModsCanCheckUsers);
                $.say($.whisperPrefix(sender) + (onlyModsCanCheckUsers ? $.lang.get('pointsystem.modonlyusercheck.enabled', pointNameMultiple) : $.lang.get('pointsystem.modonlyusercheck.disabled', pointNameMultiple)));
                return;
            }
        }


        /**
         * @commandpath makeitrain [amount] - Send a random amount of points to each user in the channel
         */
        if ($.equalsIgnoreCase(command, 'makeitrain')) {
            let lastAmount = 0,
                    amount = 0,
                    totalAmount = 0;

            action = parseInt(action);
            if (isNaN(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.makeitrain.usage'));
                return;
            }

            if (action < 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.makeitrain.error.negative', pointNameMultiple));
                return;
            }

            for (let i in $.users) {
                do {
                    amount = $.randRange(1, action);
                } while (amount === lastAmount);
                totalAmount += amount;
                $.inidb.incr('points', $.users[i].toLowerCase(), amount);
            }

            if (totalAmount > 0) {
                $.say($.lang.get('pointsystem.makeitrain.success', username, action, pointNameMultiple));
            }
        }

        /**
         * @commandpath gift [user] [amount] - Give points to a friend.
         */
        if ($.equalsIgnoreCase(command, 'gift')) {
            if (!action || isNaN(parseInt(actionArg1)) || $.equalsIgnoreCase(action, sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.gift.usage'));
                return;
            }

            if (parseInt(args[1]) > getUserPoints(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.gift.shortpoints'));
                return;
            }

            if (parseInt(args[1]) <= 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.err.negative', pointNameMultiple));
                return;
            }

            // Replace everything that is not \w
            action = $.user.sanitize(action);

            if (!$.user.isKnown(action) || $.isTwitchBot(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.gift.404'));
                return;
            }

            $.inidb.incr('points', action, parseInt(args[1]));
            $.inidb.decr('points', sender, parseInt(args[1]));
            $.say($.lang.get('pointsystem.gift.success', $.viewer.getByLogin(sender).name(), getPointsString(parseInt(args[1])), $.viewer.getByLogin(action).name()));
        }

        /**
         * @commandpath penalty [user] [time] - Stop a user from gaining points for X amount of minutes.
         */
        if ($.equalsIgnoreCase(command, 'penalty')) {
            if (action === undefined || isNaN(actionArg1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.err.penalty'));
                return;
            }

            if ($.equalsIgnoreCase(sender, $.botName)) { // Used for the panel.
                setPenalty(sender, action.toLowerCase(), parseInt(actionArg1), true);
                return;
            }

            setPenalty(sender, action.toLowerCase(), parseInt(actionArg1));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/pointSystem.js', 'makeitrain', $.PERMISSION.Admin);
        $.registerChatCommand('./systems/pointSystem.js', 'gift', $.PERMISSION.Viewer);
        $.registerChatCommand('./systems/pointSystem.js', 'penalty', $.PERMISSION.Mod);
        $.registerChatCommand('./systems/pointSystem.js', 'points', $.PERMISSION.Viewer);
        $.registerChatSubcommand('points', 'add', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'give', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'take', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'remove', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'set', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'all', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'takeall', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setname', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setgain', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setofflinegain', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setinterval', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'user', $.PERMISSION.Viewer);
        $.registerChatSubcommand('points', 'check', $.PERMISSION.Viewer);
        $.registerChatSubcommand('points', 'bonus', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'resetall', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setmessage', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setactivebonus', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'modonlyusercheck', $.PERMISSION.Admin);
        
        updateSettings();
    });

    /** Export functions to API */
    $.pointNameSingle = pointNameSingle;
    $.pointNameMultiple = pointNameMultiple;
    $.getUserPoints = getUserPoints;
    $.getPointsString = getPointsString;
    $.getPointsMessage = getPointsMessage;
    $.updateSettings = updateSettings;
    $.setTempBonus = setTempBonus;
    $.giveAll = giveAll;
    $.takeAll = takeAll;
    /**
     * Functions for working with pointSystem
     * @export $
     */
    $.points = {
        /**
         * @export $.points
         * @returns {string} the singular name of points
         */
        nameSingle: getPointNameSingle,
        /**
         * @export $.points
         * @returns {string} the plural name of points
         */
        nameMultiple: getPointNameMultiple,
        /**
         * @export $.points
         * @param {string} username the username to lookup
         * @returns {number} the number of points the user has
         */
        get: getUserPoints,
        /**
         * Returns the number of points the user has, with the points name appended on the end
         * 
         * ex. `"25 cool points"`
         * 
         * @export $.points
         * @param {string} username the username to lookup
         * @returns {string} the number of points the user has
         */
        getString: getPointsString,
        /**
         * Attempts to perform a safe update of the users points.
         * If the current value is not `orig` at the time of writing, the `calcfunc` is called to recalculate.
         * After retrying `maxUpdateRetries` times, the call fails
         * 
         * `calcfunc` must be defined as `function(username, current, value)`, where `current`
         * is the new current value that caused the previous attempt to fail and `value` is the new target value
         * that failed to be written during the previous attempt
         * 
         * `calcfunc` must return the new value for the `value` param if it wants to attempt a retry, it should return `null` 
         * if a retry is not possible (ie. due to a negative constraint failing on the new current value)
         * 
         * `calcfunc` must NOT attempt to call `updateUserPoints` again, as it could cause
         * infinite looping and race conditions. Retry logic is handled internally
         * 
         * @export $.points
         * @param {string} username the username to update points for
         * @param {number} orig the original value
         * @param {number} value the new value
         * @param {Function} calcfunc a function, as described in the description, that recalculates the change on failure
         * @returns {number|null} the new value on success; `null` on failure
         */
        update: updateUserPoints,
        /**
         * Attempts to take points from a user, if they have enough
         * 
         * @export $.points
         * @param {string} username the username to take points from
         * @param {number} points the number of points to take from the user
         * @param {boolean|null|undefined} zero `true` to zero out points instead of failing if user does not have enough points. default `false`
         * @returns {number|null} the users new point balance on success; `null` on failure
         */
        take: takePoints,
        /**
         * Attempts to give points to a user
         * 
         * @export $.points
         * @param {string} username the username to give points to
         * @param {number} points the number of points to give to the user
         * @returns {number|null} the users new point balance on success; `null` on failure
         */
        give: givePoints,
        /**
         * Attempts to transfer points from one user to another
         * 
         * To increase chances of success, this function tries 10 times to give the taken points to `toUsername`.
         * On failure, this function tries 10 times to return them back to `fromUsername`
         * 
         * @export $.points
         * @param {string} fromUsername the username to take points from
         * @param {string} toUsername the username to give points to
         * @param {number} points the number of points to transfer
         * @returns {Object.<string, number|null>} an object mapping the usernames to their new balances on success; usernames mapped to `null` on failure
         * @throws if points were successfully taken from `fromUsername` but then failed to either give them to `toUsername` or return them back to `fromUsername`
         */
        transfer: transferPoints,
        /**
         * Sets the users points to `0`
         * 
         * @export $.points
         * @param {string} username the username to set 
         */
        zero: zeroUserPoints,
        /**
         * Gives points to all users currently recognized as being in chat
         * 
         * @export $.points
         * @param {number} points the number of points to give
         * @param {Array<string>|null|undefined} users the users to give points to; `null` or `undefined` to use he list of users currently recognized as being in chat
         */
        giveToAll: giveToAll,
        /**
         * Takes points from all users currently recognized as being in chat
         * 
         * Any user whose points would go negative is instead set to `0`
         * 
         * @export $.points
         * @param {number} points the number of points to take
         * @param {Array<string>|null|undefined} users the users to take points from; `null` or `undefined` to use he list of users currently recognized as being in chat
         */
        takeFromAll: takeFromAll
    };
})();
