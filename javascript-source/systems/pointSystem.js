/**
 * pointSystem.js
 *
 * Manage user loyalty points and export and API to manipulate points in other modules
 * Use the $ API
 */
(function() {
    var pointsTimedGain = $.getSetIniDbBoolean('pointSettings', 'pointsTimedGain', true),
        onlineGain = $.getSetIniDbNumber('pointSettings', 'onlineGain', 1),
        offlineGain = $.getSetIniDbNumber('pointSettings', 'offlineGain', 1),
        onlinePayoutInterval = $.getSetIniDbNumber('pointSettings', 'onlinePayoutInterval', 10),
        offlinePayoutInterval = $.getSetIniDbNumber('pointSettings', 'offlinePayoutInterval',  0),
        lastPayout = 0,
        penaltys = [],
        pointsBonus = false,
        pointsBonusAmount = 0,

        /** @export $ */
        pointNameSingle = $.getSetIniDbString('pointSettings', 'pointNameSingle', 'point'),
        pointNameMultiple = $.getSetIniDbString('pointSettings', 'pointNameMultiple', 'points');

    /**
     * @function updateSettings
     */
    function updateSettings() {
        pointsTimedGain = $.getIniDbBoolean('pointSettings', 'pointsTimedGain');
        onlineGain = $.getIniDbNumber('pointSettings', 'onlineGain');
        offlineGain = $.getIniDbNumber('pointSettings', 'offlineGain');
        onlinePayoutInterval = $.getIniDbNumber('pointSettings', 'onlinePayoutInterval');
        offlinePayoutInterval = $.getIniDbNumber('pointSettings', 'offlinePayoutInterval');
        pointNameSingle = $.getIniDbString('pointSettings', 'pointNameSingle');
        pointNameMultiple = $.getIniDbString('pointSettings', 'pointNameMultiple');

        if (!pointNameMultiple.equalsIgnoreCase('points') || !pointNameSingle.equalsIgnoreCase('point')) {
            $.inidb.set('temppoints', 'pointsname', pointNameMultiple);
            $.inidb.set('temppoints', 'pointsname2', pointNameSingle);
        }

        if (pointNameMultiple.equalsIgnoreCase('points') && pointNameSingle.equalsIgnoreCase('point')) {
            defaultPointsName(true);
            //registerNewPointsCommands($.inidb.get('temppoints', 'pointsname'), $.inidb.get('temppoints', 'pointsname2'), false);
        } else {
            defaultPointsName(false);
            registerNewPointsCommands($.inidb.get('temppoints', 'pointsname'), $.inidb.get('temppoints', 'pointsname2'), true);
        }
        var timeout = setTimeout(function () {
            $.inidb.RemoveFile('temppoints');
        }, 9000);
    };

    /**
     * @function defaultPointsName
     * @param {Boolean} [register]
     */
    function defaultPointsName(register) {
        if (register) {
            $.registerChatCommand('./systems/pointSystem.js', 'points', 7);
            $.registerChatSubcommand('points', 'add', 1);
            $.registerChatSubcommand('points', 'give', 1);
            $.registerChatSubcommand('points', 'take', 1);
            $.registerChatSubcommand('points', 'remove', 1);
            $.registerChatSubcommand('points', 'set', 1);
            $.registerChatSubcommand('points', 'all', 1);
            $.registerChatSubcommand('points', 'takeall', 1);
            $.registerChatSubcommand('points', 'setname', 1);
            $.registerChatSubcommand('points', 'setgain', 1);
            $.registerChatSubcommand('points', 'setofflinegain', 1);
            $.registerChatSubcommand('points', 'setinterval', 1);
            $.registerChatSubcommand('points', 'user', 7);
            $.registerChatSubcommand('points', 'check', 7);
            $.registerChatSubcommand('points', 'bonus', 1);
            $.registerChatSubcommand('points', 'resetall', 1);
        } else {
            $.unregisterChatCommand('points', 7);
            $.unregisterChatSubcommand('points', 'add', 1);
            $.unregisterChatSubcommand('points', 'give', 1);
            $.unregisterChatSubcommand('points', 'take', 1);
            $.unregisterChatSubcommand('points', 'remove', 1);
            $.unregisterChatSubcommand('points', 'set', 1);
            $.unregisterChatSubcommand('points', 'all', 1);
            $.unregisterChatSubcommand('points', 'takeall', 1);
            $.unregisterChatSubcommand('points', 'setname', 1);
            $.unregisterChatSubcommand('points', 'setgain', 1);
            $.unregisterChatSubcommand('points', 'setofflinegain', 1);
            $.unregisterChatSubcommand('points', 'setinterval', 1);
            $.unregisterChatSubcommand('points', 'user', 7);
            $.unregisterChatSubcommand('points', 'check', 7);
            $.unregisterChatSubcommand('points', 'bonus', 1);
            $.unregisterChatSubcommand('points', 'resetall', 1);
        }
    }

    /**
     * @function registerPointCommands
     * @param {string} [boolean]
     */
    function registerNewPointsCommands(newName, newName2, boolean) {
        newName = newName.toLowerCase();
        newName2 = newName2.toLowerCase();
        if (newName && boolean) {
            $.registerChatCommand('./systems/pointSystem.js', newName, 7);
            $.registerChatSubcommand(newName, 'add', 1);
            $.registerChatSubcommand(newName, 'give', 1);
            $.registerChatSubcommand(newName, 'take', 1);
            $.registerChatSubcommand(newName, 'set', 1);
            $.registerChatSubcommand(newName, 'all', 1);
            $.registerChatSubcommand(newName, 'takeall', 1);
            $.registerChatSubcommand(newName, 'setname', 1);
            $.registerChatSubcommand(newName, 'setgain', 1);
            $.registerChatSubcommand(newName, 'setofflinegain', 1);
            $.registerChatSubcommand(newName, 'setinterval', 1);
            $.registerChatSubcommand(newName, 'user', 7);
            $.registerChatSubcommand(newName, 'check', 7);
            $.registerChatSubcommand(newName, 'bonus', 1);
            $.registerChatSubcommand(newName, 'resetall', 1);
        } 
        if (newName2 && boolean) {
            $.registerChatCommand('./systems/pointSystem.js', newName2, 7);
            $.registerChatSubcommand(newName2, 'add', 1);
            $.registerChatSubcommand(newName2, 'give', 1);
            $.registerChatSubcommand(newName2, 'take', 1);
            $.registerChatSubcommand(newName2, 'remove', 1);
            $.registerChatSubcommand(newName2, 'set', 1);
            $.registerChatSubcommand(newName2, 'all', 1);
            $.registerChatSubcommand(newName2, 'takeall', 1);
            $.registerChatSubcommand(newName2, 'setname', 1);
            $.registerChatSubcommand(newName2, 'setgain', 1);
            $.registerChatSubcommand(newName2, 'setofflinegain', 1);
            $.registerChatSubcommand(newName2, 'setinterval', 1);
            $.registerChatSubcommand(newName2, 'user', 7);
            $.registerChatSubcommand(newName2, 'check', 7);
            $.registerChatSubcommand(newName2, 'bonus', 1);
            $.registerChatSubcommand(newName2, 'resetall', 1);
        }

        if (newName && !boolean) {
            $.unregisterChatCommand('./systems/pointSystem.js', newName, 7);
            $.unregisterChatSubcommand(newName, 'add', 1);
            $.unregisterChatSubcommand(newName, 'give', 1);
            $.unregisterChatSubcommand(newName, 'take', 1);
            $.unregisterChatSubcommand(newName, 'remove', 1);
            $.unregisterChatSubcommand(newName, 'set', 1);
            $.unregisterChatSubcommand(newName, 'all', 1);
            $.unregisterChatSubcommand(newName, 'takeall', 1);
            $.unregisterChatSubcommand(newName, 'setname', 1);
            $.unregisterChatSubcommand(newName, 'setgain', 1);
            $.unregisterChatSubcommand(newName, 'setofflinegain', 1);
            $.unregisterChatSubcommand(newName, 'setinterval', 1);
            $.unregisterChatSubcommand(newName, 'user', 7);
            $.unregisterChatSubcommand(newName, 'check', 7);
            $.unregisterChatSubcommand(newName, 'bonus', 1);
            $.unregisterChatSubcommand(newName, 'resetall', 1);
        } 
        if (newName2 && !boolean) {
            $.unregisterChatCommand('./systems/pointSystem.js', newName2, 7);
            $.unregisterChatSubcommand(newName2, 'add', 1);
            $.unregisterChatSubcommand(newName2, 'give', 1);
            $.unregisterChatSubcommand(newName2, 'take', 1);
            $.unregisterChatSubcommand(newName2, 'remove', 1);
            $.unregisterChatSubcommand(newName2, 'takeall', 1);
            $.unregisterChatSubcommand(newName2, 'set', 1);
            $.unregisterChatSubcommand(newName2, 'all', 1);
            $.unregisterChatSubcommand(newName2, 'setname', 1);
            $.unregisterChatSubcommand(newName2, 'setgain', 1);
            $.unregisterChatSubcommand(newName2, 'setofflinegain', 1);
            $.unregisterChatSubcommand(newName2, 'setinterval', 1);
            $.unregisterChatSubcommand(newName2, 'user', 7);
            $.unregisterChatSubcommand(newName2, 'check', 7);
            $.unregisterChatSubcommand(newName2, 'bonus', 1);
            $.unregisterChatSubcommand(newName2, 'resetall', 1);
        }
    };

    /**
     * @function getUserPoints
     * @export $
     * @param {string} username
     * @returns {*}
     */
    function getUserPoints(username) {
        return ($.inidb.exists('points', username.toLowerCase()) ? parseInt($.inidb.get('points', username.toLowerCase())) : 0);
    };

    /**
     * @function getPointsString
     * @export $
     * @param {Number} points
     * @returns {string}
     */
    function getPointsString(points) {
        if (parseInt(points) == 1) {
            return points + ' ' + pointNameSingle;
        }
        return points + ' ' + pointNameMultiple;
    };

    /**
     * @function runPointsPayout
     */
    function runPointsPayout() {
        var now = $.systemTime(),
            uUsers = [],
            username,
            amount,
            i;

        if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
            return;
        }

        if ($.isOnline($.channelName)) {
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

        $.inidb.setAutoCommit(false);
        for (i in $.users) {
            username = $.users[i][0].toLowerCase();
            if ($.isOnline($.channelName)) {
                if ($.isMod(username) && $.isSub(username) || $.isAdmin(username) && $.isSub(username)) {
                    if (parseInt($.inidb.get('grouppoints', 'Subscriber')) > 0) {
                        amount = parseInt($.inidb.get('grouppoints', 'Subscriber'));
                    } else {
                        amount = onlineGain;
                    }
                } else {
                    if ($.inidb.exists('grouppoints', $.getUserGroupName(username))) {
                        amount = (parseInt($.inidb.get('grouppoints', $.getUserGroupName(username))) < 0 ? onlineGain : parseInt($.inidb.get('grouppoints', $.getUserGroupName(username))));
                    }
                }
            } else {
                if ($.isMod(username) && $.isSub(username) || $.isAdmin(username) && $.isSub(username)) {
                    if (parseInt($.inidb.get('grouppointsoffline', 'Subscriber')) > 0) {
                        amount = parseInt($.inidb.get('grouppointsoffline', 'Subscriber'));
                    } else {
                        amount = offlineGain;
                    }
                } else {
                    if ($.inidb.exists('grouppointsoffline', $.getUserGroupName(username))) {
                        amount = (parseInt($.inidb.get('grouppointsoffline', $.getUserGroupName(username))) < 0 ? offlineGain : parseInt($.inidb.get('grouppointsoffline', $.getUserGroupName(username))));
                    }
                }
            }

            if ($.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
                if ($.getTierData(username, 'bonuspoints') != 0) {
                    amount += Math.floor(amount * ($.getTierData(username, 'bonuspoints') / 100));
                }
            }

            if (getUserPenalty(username)) {
                for (i in penaltys) {
                    var time = penaltys[i].time - now;
                    if (time <= 0) {
                        penaltys.splice(i, 1);
                    }
                }
            }

            if (pointsBonus) {
                amount = (amount + pointsBonusAmount);
            }

            if (!getUserPenalty(username)) {
                $.inidb.incr('points', username, amount);
                uUsers.push(username + '(' + amount + ')');
            }
        }
        $.inidb.setAutoCommit(true);
        $.log.file('pointSystem', 'Executed ' + pointNameMultiple + ' payouts. Users: ' + (uUsers.length > 0 ? uUsers.join(', ') : 'none'));
        lastPayout = now;
    };

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

        penaltys.push({user: username, time: newTime});

        if (!silent) {
            time = $.getTimeStringMinutes((time * 6e4) / 1000);
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.penalty.set', username, time));
        }
    };

    /**
    * @function getUserPenalty
    * @param username
    */
    function getUserPenalty(username) {
        for (var i in penaltys) {
            if (penaltys[i].user.equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
    };

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
        }, newTime, 'pointsBonus');

        if (time >= 60) {
            newTime = $.getTimeString((time * 6e4) / 1000, true);
        } else {
            newTime = $.getTimeStringMinutes((time * 6e4) / 1000);
        }

        $.say('For the next ' + newTime + ' I will be giving out ' + pointsBonusAmount + ' extra ' + pointNameMultiple + ' at each payouts!');
    };

    /**
    * @function giveAll
    * @param {Number} action
    */
    function giveAll(amount) {
        if (amount < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.error.negative', pointNameMultiple));
            return;
        }
        
        for (i in $.users) {
            $.inidb.incr('points', $.users[i][0].toLowerCase(), amount);
        }

        $.say($.lang.get('pointsystem.add.all.success', getPointsString(amount)));
    };

    /**
    * @function takeAll
    * @param {Number} action
    */
    function takeAll(amount, sender) {
        if (amount < 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.error.negative', pointNameMultiple));
            return;
        }
        
        for (i in $.users) {
            if (getUserPoints($.users[i][0].toLowerCase()) > amount) {
                $.inidb.decr('points', $.users[i][0].toLowerCase(), amount);
            }
        }

        $.say($.lang.get('pointsystem.take.all.success', getPointsString(amount)));
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
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
                if (getUserPoints(sender) == 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.get.self.nopoints', pointNameMultiple));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.get.self.withtime', ($.hasRank(sender) ? "the " + $.getRank(sender) : ""), getPointsString(getUserPoints(sender)), $.getUserTimeString(sender)));
                }
            } else {
                if (action && $.user.isKnown(action.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.user.success', $.username.resolve(action), getPointsString(getUserPoints(action.toLowerCase()))));
                }

                /**
                 * @commandpath points add [username] [amount] - Add an amount of points to a user's balance
                 */
                else if (action.equalsIgnoreCase('add') || action.equalsIgnoreCase('give')) {
                    actionArg1 = (actionArg1 + '').toLowerCase();
                    actionArg2 = parseInt(actionArg2);
                    if (isNaN(actionArg2)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.usage'));
                        return;
                    }

                    if (actionArg1.equalsIgnoreCase('all')) {
                        giveAll(actionArg2, sender);
                        return;
                    }

                    if (!actionArg1 || !$.user.isKnown(actionArg1)) {
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
                }

                /**
                 * @commandpath points take [username] [amount] - Take an amount of points from the user's balance
                 */
                else if (action.equalsIgnoreCase('take') || action.equalsIgnoreCase('remove')) {
                    actionArg1 = (actionArg1 + '').toLowerCase();
                    actionArg2 = parseInt(actionArg2);
                    if (isNaN(actionArg2)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.usage'));
                        return
                    }

                    if (actionArg1.equalsIgnoreCase('all')) {
                        takeAll(actionArg2, sender);
                        return;
                    }

                    if (!actionArg1 || !$.user.isKnown(actionArg1)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', actionArg1));
                        return;
                    }

                    if (actionArg2 > $.getUserPoints(actionArg1)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.error.toomuch', username, pointNameMultiple));
                        return;
                    }

                    $.inidb.decr('points', actionArg1, actionArg2);
                    $.say($.lang.get('pointsystem.take.success',
                        $.getPointsString(actionArg2), $.username.resolve(actionArg1), getPointsString(getUserPoints(actionArg1))))
                }

                /**
                 * @commandpath points set [username] [amount] - Set the user's points balance to an amount
                 */
                else if (action.equalsIgnoreCase('set')) {
                    actionArg1 = (actionArg1 + '').toLowerCase();
                    actionArg2 = parseInt(actionArg2);
                    if (isNaN(actionArg2)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.setbalance.usage'));
                        return;
                    }

                    if (!actionArg1 || !$.user.isKnown(actionArg1)) {
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
                }

                /**
                 * @commandpath points all [amount] - Send an amount of points to all users in the chat
                 */
                else if (action.equalsIgnoreCase('all')) {
                    if (!parseInt(actionArg1)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.all.usage'));
                        return;
                    }
                    giveAll(actionArg1, sender);
                }

                /**
                 * @commandpath points takeall [amount] - Remove an amount of points to all users in the chat
                 */
                else if (action.equalsIgnoreCase('takeall')) {
                    if (!parseInt(actionArg1)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.all.usage'));
                        return;
                    }
                    takeAll(actionArg1, sender);
                }

                /**
                 * @commandpath points setname single [name] - Set the points name for single points
                 * @commandpath points setname multiple [name] - Set the points name for plural points
                 * @commandpath points setname delete - Deletes single and multiple custom names
                 */
                else if (action.equalsIgnoreCase('setname')) {
                    (actionArg1 + '');
                    (actionArg2 + '');

                    if (actionArg1.equalsIgnoreCase('single') && actionArg2) {
                        temp = pointNameSingle;
                        pointNameSingle = actionArg2;
                        $.inidb.set('pointSettings', 'pointNameSingle', pointNameSingle);
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.single.success', temp, pointNameSingle));
                        updateSettings();
                        return;
                    }
                    if (actionArg1.equalsIgnoreCase('multiple') && actionArg2) {
                        temp = pointNameMultiple;
                        pointNameMultiple = actionArg2;
                        $.inidb.set('pointSettings', 'pointNameMultiple', pointNameMultiple);
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.multiple.success', temp, pointNameMultiple));
                        updateSettings();
                        return;
                    }
                    if (actionArg1.equalsIgnoreCase('delete')) {
                        $.inidb.set('pointSettings', 'pointNameSingle', 'point');
                        $.inidb.set('pointSettings', 'pointNameMultiple', 'points');
                        pointNameSingle = "point";
                        pointNameMultiple = "points";
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.delete'));
                        updateSettings();
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.usage'));
                }

                /**
                 * @commandpath points setgain [amount] - Set the amount of points gained per payout interval while the channel is online, can be overriden by group settings
                 */
                else if (action.equalsIgnoreCase('setgain')) {
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
                }

                /**
                 * @commandpath points setofflinegain [amount] - Set the amount of points gained per interval while the channel is offline, can be overridden by group settings
                 */
                else if (action.equalsIgnoreCase('setofflinegain')) {
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
                }

                /**
                 * @commandpath points setinterval [minutes] - Set the points payout interval for when the channel is online
                 */
                else if (action.equalsIgnoreCase('setinterval')) {
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
                }

                /**
                 * @commandpath points setofflineinterval [minutes] - Set the points payout interval for when the channel is offline
                 */
                else if (action.equalsIgnoreCase('setofflineinterval')) {
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
                }

                /**
                 * @commandpath points bonus [amount] [time in minutes] - Gives a bonus amount of points at each payouts
                 */
                else if (action.equalsIgnoreCase('bonus')) {
                    if (!actionArg1 || !actionArg2) {
                        $.say($.whisperPrefix(sender) + 'Usage: !points bonus (amount) (for time)');
                        return;
                    }
                    setTempBonus(actionArg1, actionArg2);
                } 

                /**
                 * @commandpath points resetall - Deletes everyones points
                 */
                else if (action.equalsIgnoreCase('resetall')) {
                    $.inidb.RemoveFile('points'); 
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.reset.all'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get("pointsystem.usage.invalid", "!" + command));
                } 
            }
        }


        /**
         * @commandpath makeitrain [amount] - Send a random amount of points to each user in the channel
         */
        if (command.equalsIgnoreCase('makeitrain')) {
            var lastAmount = 0,
                amount = 0,
                totalAmount = 0;

            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

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
                } while (amount == lastAmount);
                totalAmount += amount;
                $.inidb.incr('points', $.users[i][0].toLowerCase(), amount);
            }

            if (totalAmount > 0) {
                $.say($.lang.get('pointsystem.makeitrain.success', username, action, pointNameMultiple));
            }
        }

        /**
         * @commandpath gift [user] [amount] - Give points to a friend.
         */
        if (command.equalsIgnoreCase('gift')) {
            if (!args[0] || !parseInt(args[1])) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.gift.usage'));
                return;
            }

            if (parseInt(args[1]) > getUserPoints(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.gift.shortpoints'));
                return;
            }

            if (!$.user.isKnown(args[0].toLowerCase())) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.gift.404'));
                return;
            }

            if (parseInt(args[1]) <= 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.err.negative', pointNameMultiple));
                return;
            }

            $.inidb.incr('points', args[0].toLowerCase(), parseInt(args[1]));
            $.inidb.decr('points', sender, parseInt(args[1]));
            $.say($.lang.get('pointsystem.gift.success', $.username.resolve(sender), getPointsString(parseInt(args[1])), $.username.resolve(args[0])));
        }

        /**
         * @commandpath penalty [user] [time] - Stop a user from gaining points for X amount of minutes.
         */
        if (command.equalsIgnoreCase('penalty')) {
            if (sender.equalsIgnoreCase($.botName)) { // Used for the panel.
                setPenalty(sender, action.toLowerCase(), parseInt(actionArg1), true);
                return;
            }
            setPenalty(sender, action.toLowerCase(), parseInt(actionArg1));
        }
    });

    // Set the timer for the points payouts
    var interval = setInterval(function() {
        runPointsPayout();
    }, 6e4);

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/pointSystem.js')) {
            $.registerChatCommand('./systems/pointSystem.js', 'makeitrain', 1);
            $.registerChatCommand('./systems/pointSystem.js', 'points', 7);
            $.registerChatCommand('./systems/pointSystem.js', 'point', 7);
            $.registerChatCommand('./systems/pointSystem.js', 'gift', 7);
            $.registerChatCommand('./systems/pointSystem.js', 'penalty', 2);

            $.registerChatSubcommand('points', 'add', 1);
            $.registerChatSubcommand('points', 'give', 1);
            $.registerChatSubcommand('points', 'take', 1);
            $.registerChatSubcommand('points', 'remove', 1);
            $.registerChatSubcommand('points', 'set', 1);
            $.registerChatSubcommand('points', 'all', 1);
            $.registerChatSubcommand('points', 'takeall', 1);
            $.registerChatSubcommand('points', 'setname', 1);
            $.registerChatSubcommand('points', 'setgain', 1);
            $.registerChatSubcommand('points', 'setofflinegain', 1);
            $.registerChatSubcommand('points', 'setinterval', 1);
            $.registerChatSubcommand('points', 'user', 7);
            $.registerChatSubcommand('points', 'check', 7);
            $.registerChatSubcommand('points', 'bonus', 1);
            $.registerChatSubcommand('points', 'resetall', 1);

            if (pointNameSingle != 'point' && pointNameMultiple != 'points') {
               updateSettings(); 
            }
        }
    });

    /** Export functions to API */
    $.pointNameSingle = pointNameSingle;
    $.pointNameMultiple = pointNameMultiple;
    $.getUserPoints = getUserPoints;
    $.getPointsString = getPointsString;
    $.updateSettings = updateSettings;
    $.setTempBonus = setTempBonus;
})();
