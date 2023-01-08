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
 * pointSystem.js
 *
 * Manage user loyalty points and export and API to manipulate points in other modules
 * Use the $ API
 */
(function () {
    var onlineGain = $.getSetIniDbNumber('pointSettings', 'onlineGain', 1),
            offlineGain = $.getSetIniDbNumber('pointSettings', 'offlineGain', 1),
            onlinePayoutInterval = $.getSetIniDbNumber('pointSettings', 'onlinePayoutInterval', 10),
            offlinePayoutInterval = $.getSetIniDbNumber('pointSettings', 'offlinePayoutInterval', 0),
            activeBonus = $.getSetIniDbNumber('pointSettings', 'activeBonus', 0),
            lastPayout = 0,
            penalties = [],
            pointsBonus = false,
            pointsBonusAmount = 0,
            pointNameSingle = $.getSetIniDbString('pointSettings', 'pointNameSingle', 'point'),
            pointNameMultiple = $.getSetIniDbString('pointSettings', 'pointNameMultiple', 'points'),
            pointsMessage = $.getSetIniDbString('pointSettings', 'pointsMessage', '(userprefix) you currently have (pointsstring) and you have been in the chat for (time).'),
            userCache = {},
            _userCacheLock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function updateSettings
     */
    function updateSettings() {
        var tempPointNameSingle,
                tempPointNameMultiple;

        onlineGain = $.getIniDbNumber('pointSettings', 'onlineGain');
        offlineGain = $.getIniDbNumber('pointSettings', 'offlineGain');
        onlinePayoutInterval = $.getIniDbNumber('pointSettings', 'onlinePayoutInterval');
        offlinePayoutInterval = $.getIniDbNumber('pointSettings', 'offlinePayoutInterval');
        pointNameSingle = $.getIniDbString('pointSettings', 'pointNameSingle');
        pointNameMultiple = $.getIniDbString('pointSettings', 'pointNameMultiple');
        pointsMessage = $.getIniDbString('pointSettings', 'pointsMessage');
        activeBonus = $.getIniDbNumber('pointSettings', 'activeBonus');

        if (!pointNameMultiple.equalsIgnoreCase('points') || !pointNameSingle.equalsIgnoreCase('point')) {
            tempPointNameSingle = pointNameSingle;
            tempPointNameMultiple = pointNameMultiple;
        }

        if (!pointNameMultiple.equalsIgnoreCase('points') || !pointNameSingle.equalsIgnoreCase('point')) {
            registerNewPointsCommands(tempPointNameSingle, tempPointNameMultiple, true);
        }
    }

    /**
     * @function registerPointCommands
     */
    function registerNewPointsCommands(newName, newName2, newCommand) {
        newName = newName.toLowerCase();
        newName2 = newName2.toLowerCase();

        if (newName && newCommand && !$.commandExists(newName)) {
            $.registerChatCommand('./systems/pointSystem.js', newName, $.PERMISSION.Viewer);
            $.registerChatSubcommand(newName, 'add', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'give', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'take', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'remove', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'set', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'all', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'takeall', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'setname', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'setgain', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'setofflinegain', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'setinterval', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'user', $.PERMISSION.Viewer);
            $.registerChatSubcommand(newName, 'check', $.PERMISSION.Viewer);
            $.registerChatSubcommand(newName, 'bonus', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'resetall', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'setmessage', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName, 'setactivebonus', $.PERMISSION.Admin);
        }


        if (newName2 && newCommand && !$.commandExists(newName2)) {
            $.registerChatCommand('./systems/pointSystem.js', newName2, $.PERMISSION.Viewer);
            $.registerChatSubcommand(newName2, 'add', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'give', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'take', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'remove', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'set', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'all', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'takeall', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'setname', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'setgain', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'setofflinegain', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'setinterval', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'user', $.PERMISSION.Viewer);
            $.registerChatSubcommand(newName2, 'check', $.PERMISSION.Viewer);
            $.registerChatSubcommand(newName2, 'bonus', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'resetall', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'setmessage', $.PERMISSION.Admin);
            $.registerChatSubcommand(newName2, 'setactivebonus', $.PERMISSION.Admin);
        }

        if (newName && newName !== 'points' && !newCommand) {
            $.unregisterChatCommand(newName);
        }

        if (newName2 && newName2 !== 'points' && !newCommand) {
            $.unregisterChatCommand(newName2);
        }
    }

    /**
     * @function getUserPoints
     * @export $
     * @param {string} username
     * @returns {*}
     */
    function getUserPoints(username) {
        return ($.inidb.exists('points', username.toLowerCase()) ? parseInt($.inidb.get('points', username.toLowerCase())) : 0);
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

    function calcPointsGained(username, group, defaultgain, isonline) {
        var table = 'grouppoints' + (isonline ? '' : 'offline');
        username = $.jsString(username);
        group = $.jsString(group);
        defaultgain = Math.max(defaultgain, 0);
        var amount = -1;

        if ($.inidb.exists(table, group)) {
            var candidateAmount = parseInt($.inidb.get(table, group));
            if (candidateAmount !== null && !isNaN(candidateAmount)) {
                amount = candidateAmount;
            }
        }

        if (group === 'Subscriber' && $.inidb.exists('subplan', username)) {
            if ($.inidb.exists(table, 'Subscriber' + $.inidb.get('subplan', username))) {
                var candidateAmount2 = parseInt($.inidb.get(table, 'Subscriber' + $.inidb.get('subplan', username)));
                if (candidateAmount2 !== null && !isNaN(candidateAmount2)) {
                    amount = candidateAmount2;
                }
            }
        }

        if (amount < 0) {
            amount = defaultgain;
        }

        return amount;
    }

    /**
     * @function runPointsPayout
     */
    function runPointsPayout() {
        var now = $.systemTime(),
            normalPayoutUsers = [], // users that get the normal online payout, nothing custom.
            isOnline = false,
            username,
            amount,
            i;

        if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
            return;
        }

        if ((isOnline = $.isOnline($.channelName))) {
            if (onlinePayoutInterval > 0 && (lastPayout + (onlinePayoutInterval * 6e4)) <= now) {
                amount = onlineGain;
            } else {
                return;
            }
        } else {
            if (offlinePayoutInterval > 0 && (lastPayout + (offlinePayoutInterval * 6e4)) <= now) {
                amount = offlineGain;
            } else {
                return;
            }
        }


        for (i in $.users) {
            if ($.users[i] !== null) {
                username = $.users[i].toLowerCase();
                if (isOnline) {
                    if ($.checkUserPermission(username, undefined, $.PERMISSION.Mod) && $.checkUserPermission(username, undefined, $.PERMISSION.Sub) || $.checkUserPermission(username, undefined, $.PERMISSION.Admin) && $.checkUserPermission(username, undefined, $.PERMISSION.Sub)) {
                        amount = calcPointsGained(username, 'Subscriber', onlineGain, true);
                    } else {
                        amount = calcPointsGained(username, $.getUserGroupName(username), onlineGain, true);
                    }
                } else {
                    if ($.checkUserPermission(username, undefined, $.PERMISSION.Mod) && $.checkUserPermission(username, undefined, $.PERMISSION.Sub) || $.checkUserPermission(username, undefined, $.PERMISSION.Admin) && $.checkUserPermission(username, undefined, $.PERMISSION.Sub)) {
                        amount = calcPointsGained(username, 'Subscriber', offlineGain, false);
                    } else {
                        amount = calcPointsGained(username, $.getUserGroupName(username), offlineGain, false);
                    }
                }

                _userCacheLock.lock();
                try {
                    if (userCache[username] !== undefined) {
                        if (userCache[username] - lastPayout > 0) {
                            delete userCache[username];
                            amount += activeBonus;
                        } else {
                            delete userCache[username];
                        }
                    }
                } finally {
                    _userCacheLock.unlock();
                }

                if (getUserPenalty(username)) {
                    for (i in penalties) {
                        var time = penalties[i].time - now;
                        if (time <= 0) {
                            penalties.splice(i, 1);
                        }
                    }
                }

                if (pointsBonus) {
                    amount = (amount + pointsBonusAmount);
                }

                if (!getUserPenalty(username)) {
                    if (amount === onlineGain || amount === offlineGain) {
                        normalPayoutUsers.push(username);
                    } else {
                        $.inidb.incr('points', username, amount);
                    }
                }
            }
        }


        // Update points for all users with the same amount of online/offline gain.
        $.inidb.IncreaseBatchString('points', '', normalPayoutUsers, (isOnline ? onlineGain : offlineGain));

        lastPayout = now;
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

        var newTime = (time * 6e4) + $.systemTime();
        username = username.toLowerCase();

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
        for (var i in penalties) {
            if (penalties[i].user.equalsIgnoreCase(username)) {
                return true;
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
        var newTime = (time * 6e4);
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


        for (var i in $.users) {
            $.inidb.incr('points', $.users[i].toLowerCase(), amount);
        }


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


        for (var i in $.users) {
            if (getUserPoints($.users[i].toLowerCase()) > amount) {
                $.inidb.decr('points', $.users[i].toLowerCase(), amount);
            } else {
                $.inidb.set('points', $.users[i].toLowerCase(), '0');
            }
        }


        $.say($.lang.get('pointsystem.take.all.success', getPointsString(amount)));
    }

    /*
     * @function getPointsMessage
     */
    function getPointsMessage(username, displayName) {
        var s = pointsMessage;

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

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        if (activeBonus > 0) {
            _userCacheLock.lock();
            try {
                userCache[event.getSender()] = $.systemTime();
            } finally {
                _userCacheLock.unlock();
            }
        }
    });

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
                username = $.username.resolve(sender, event.getTags()),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0],
                actionArg1 = args[1],
                actionArg2 = args[2],
                temp,
                user,
                i;

        /**
         * @commandpath points - Announce points in chat when no parameters are given.
         */
        if (command.equalsIgnoreCase('points') || command.equalsIgnoreCase('point') || command.equalsIgnoreCase(pointNameMultiple) || command.equalsIgnoreCase(pointNameSingle)) {
            if (!action) {
                $.say(getPointsMessage(sender, username));
                return;
            }

            // Replace everything that is not \w
            action = $.user.sanitize(action);
            if ($.user.isKnown(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.user.success', $.username.resolve(action), getPointsString(getUserPoints(action))));
                return;
            }

            /**
             * @commandpath points add [username] [amount] - Add an amount of points to a user's balance
             */
            if (action.equalsIgnoreCase('add') || action.equalsIgnoreCase('give')) {
                actionArg1 = (actionArg1 + '').toLowerCase();
                actionArg2 = parseInt(actionArg2);
                if (isNaN(actionArg2) || !actionArg1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.usage'));
                    return;
                }

                if (actionArg1.equalsIgnoreCase('all')) {
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
                            $.getPointsString(actionArg2), $.username.resolve(actionArg1), getPointsString(getUserPoints(actionArg1))));
                }

                return;
            }

            /**
             * @commandpath points take [username] [amount] - Take an amount of points from the user's balance
             */
            if (action.equalsIgnoreCase('take') || action.equalsIgnoreCase('remove')) {
                actionArg1 = (actionArg1 + '').toLowerCase();
                actionArg2 = parseInt(actionArg2);
                if (isNaN(actionArg2) || !actionArg1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.usage'));
                    return;
                }

                if (actionArg1.equalsIgnoreCase('all')) {
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
                        $.getPointsString(actionArg2), $.username.resolve(actionArg1), getPointsString(getUserPoints(actionArg1))));
                return;
            }

            /**
             * @commandpath points set [username] [amount] - Set the user's points balance to an amount
             */
            if (action.equalsIgnoreCase('set')) {
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
                        pointNameSingle, $.username.resolve(actionArg1), getPointsString(getUserPoints(actionArg1))));
                return;
            }

            /**
             * @commandpath points all [amount] - Send an amount of points to all users in the chat
             */
            if (action.equalsIgnoreCase('all')) {
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
            if (action.equalsIgnoreCase('takeall')) {
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
            if (action.equalsIgnoreCase('setname')) {
                if (actionArg1 === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.usage'));
                    return;
                }
                if (actionArg1.equalsIgnoreCase('single') && actionArg2) {
                    temp = pointNameSingle;
                    if (actionArg2.equalsIgnoreCase($.inidb.get('pointSettings', 'pointNameSingle'))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.duplicate'));
                        return;
                    }

                    pointNameSingle = actionArg2.toLowerCase();
                    $.inidb.set('pointSettings', 'pointNameSingle', pointNameSingle);
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.single.success', temp, pointNameSingle));
                    updateSettings();
                    return;
                }
                if (actionArg1.equalsIgnoreCase('multiple') && actionArg2) {
                    temp = pointNameMultiple;
                    if (actionArg2.equalsIgnoreCase($.inidb.get('pointSettings', 'pointNameMultiple'))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.duplicate'));
                        return;
                    }

                    pointNameMultiple = actionArg2.toLowerCase();
                    $.inidb.set('pointSettings', 'pointNameMultiple', pointNameMultiple);
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.multiple.success', temp, pointNameMultiple));
                    updateSettings();
                    return;
                }
                if (actionArg1.equalsIgnoreCase('delete')) {
                    $.inidb.set('pointSettings', 'pointNameSingle', 'point');
                    $.inidb.set('pointSettings', 'pointNameMultiple', 'points');
                    $.unregisterChatCommand(pointNameSingle);
                    $.unregisterChatCommand(pointNameMultiple);
                    pointNameSingle = "point";
                    pointNameMultiple = "points";
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
            if (action.equalsIgnoreCase('setgain')) {
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
            if (action.equalsIgnoreCase('setofflinegain')) {
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
            if (action.equalsIgnoreCase('setinterval')) {
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
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.interval.success', pointNameSingle, onlinePayoutInterval));
                return;
            }

            /**
             * @commandpath points setofflineinterval [minutes] - Set the points payout interval for when the channel is offline
             */
            if (action.equalsIgnoreCase('setofflineinterval')) {
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
                $.say($.whisperPrefix(sender) + $.lang.get("pointsystem.set.interval.offline.success", pointNameSingle, offlinePayoutInterval));
                return;
            }

            /**
             * @commandpath points setmessage [message] - Set the points message for when someone uses the points command. - Tags: (userprefix), (user), (points), (pointsname), (pointsstring), (time), and (rank)
             */
            if (action.equalsIgnoreCase('setmessage')) {
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
            if (action.equalsIgnoreCase('bonus')) {
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
            if (action.equalsIgnoreCase('resetall')) {
                $.inidb.RemoveFile('points');
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.reset.all'));
                return;
            }

            /**
             * @commandpath points setactivebonus [points] - Sets a bonus amount of points user get if they are active between the last payout.
             */
            if (action.equalsIgnoreCase('setactivebonus')) {
                if (actionArg1 === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.active.bonus.usage'));
                    return;
                }

                activeBonus = parseInt(actionArg1);
                $.setIniDbNumber('pointSettings', 'activeBonus', activeBonus);
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.active.bonus.set', getPointsString(activeBonus)));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.usage.invalid', '!' + command));
        }


        /**
         * @commandpath makeitrain [amount] - Send a random amount of points to each user in the channel
         */
        if (command.equalsIgnoreCase('makeitrain')) {
            var lastAmount = 0,
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

            for (i in $.users) {
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
        if (command.equalsIgnoreCase('gift')) {
            if (!action || isNaN(parseInt(actionArg1)) || action.equalsIgnoreCase(sender)) {
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
            $.say($.lang.get('pointsystem.gift.success', $.username.resolve(sender), getPointsString(parseInt(args[1])), $.username.resolve(action)));
        }

        /**
         * @commandpath penalty [user] [time] - Stop a user from gaining points for X amount of minutes.
         */
        if (command.equalsIgnoreCase('penalty')) {
            if (action === undefined || isNaN(actionArg1)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.err.penalty'));
                return;
            }

            if (sender.equalsIgnoreCase($.botName)) { // Used for the panel.
                setPenalty(sender, action.toLowerCase(), parseInt(actionArg1), true);
                return;
            }

            setPenalty(sender, action.toLowerCase(), parseInt(actionArg1));
        }
    });

    // Set the timer for the points payouts
    var interval = setInterval(function () {
        runPointsPayout();
    }, 6e4, 'scripts::systems::pointSystem.js');

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/pointSystem.js', 'makeitrain', $.PERMISSION.Admin);
        $.registerChatCommand('./systems/pointSystem.js', 'points', $.PERMISSION.Viewer);
        $.registerChatCommand('./systems/pointSystem.js', 'gift', $.PERMISSION.Viewer);
        $.registerChatCommand('./systems/pointSystem.js', 'penalty', $.PERMISSION.Mod);

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
        $.registerChatSubcommand('points', 'bonus', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'resetall', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setmessage', $.PERMISSION.Admin);
        $.registerChatSubcommand('points', 'setactivebonus', $.PERMISSION.Admin);

        if (pointNameSingle !== 'point' || pointNameMultiple !== 'points') {
            updateSettings();
        }
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
})();
