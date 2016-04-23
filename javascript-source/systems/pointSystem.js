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
        modPointsPermToggle = $.getSetIniDbBoolean('pointSettings', 'modPointsPermToggle', false),
        lastPayout = 0,

        /** @export $ */
        pointNameSingle = $.getSetIniDbString('pointSettings', 'pointNameSingle', 'point'),
        pointNameMultiple = $.getSetIniDbString('pointSettings', 'pointNameMultiple', 'points');

    /**
     * @function getUserPoints
     * @export $
     * @param {string} username
     * @returns {*}
     */
    function getUserPoints(username) {
        if ($.inidb.exists('points', username)) {
            return parseInt($.inidb.get('points', username));
        } else {
            return 0;
        }
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
     * @function hasPerm
     * @param {Object} event
     * @returns {boolean}
     */
    function hasPerm(event) {
        if (modPointsPermToggle) {
            if (!$.isModv3(event.getSender().toLowerCase(), event.getTags())) {
                $.say($.whisperPrefix(event.getSender().toLowerCase()) + $.modMsg);
                return false;
            }
        } else if (!$.isAdmin(event.getSender().toLowerCase())) {
            $.say($.whisperPrefix(event.getSender().toLowerCase()) + $.adminMsg);
            return false;
        }
        return true;
    };

    /**
     * @function registerPointCommands
     * @param {string} [oldName]
     */
    function registerPointCommands(oldName) {
        if (oldName && $.commandExists(oldName.toLowerCase()) && (oldName.toLowerCase() != "points" && oldName.toLowerCase() != "point")) {
            $.unregisterChatCommand(oldName.toLowerCase());
        }
        if (!$.commandExists(pointNameSingle.toLowerCase()) && !oldName) {
            $.registerChatCommand('./systems/pointSystem.js', pointNameSingle.toLowerCase(), 7);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'add', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'take', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'set', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'all', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'setname', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'setgain', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'setofflinegain', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'setinterval', 1);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'user', 7);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'check', 7);
        }
        if (!$.commandExists(pointNameMultiple.toLowerCase()) && !oldName) {
            $.registerChatCommand('./systems/pointSystem.js', pointNameMultiple.toLowerCase(), 7);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'add', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'take', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'set', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'all', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'setname', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'setgain', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'setofflinegain', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'setinterval', 1);
            $.registerChatSubcommand(pointNameMultiple.toLowerCase(), 'user', 7);
            $.registerChatSubcommand(pointNameSingle.toLowerCase(), 'check', 7);
        }
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

        for (i in $.users) {
            username = $.users[i][0].toLowerCase();
            if ($.isOnline($.channelName)) {
                if ($.inidb.exists('grouppoints', $.getUserGroupName(username))) {
                    amount = (parseInt($.inidb.get('grouppoints', $.getUserGroupName(username))) < 0 ?
                        onlineGain : parseInt($.inidb.get('grouppoints', $.getUserGroupName(username))));
                }
            } else {
                if ($.inidb.exists('grouppointsoffline', $.getUserGroupName(username))) {
                    amount = (parseInt($.inidb.get('grouppointsoffline', $.getUserGroupName(username))) < 0 ?
                        offlineGain : parseInt($.inidb.get('grouppointsoffline', $.getUserGroupName(username))));
                }
            }

            if ($.bot.isModuleEnabled('./handlers/gameWispHandler.js')) {
                if ($.getTierData(username, 'bonuspoints') != 0) {
                    amount += Math.floor(amount * ($.getTierData(username, 'bonuspoints') / 100));
                }
            }
            
            $.inidb.incr('points', username, amount);
            uUsers.push(username + '(' + amount + ')');
        }
        $.log('pointSystem', 'Executed ' + pointNameMultiple + ' payouts. Users: ' + (uUsers.length > 0 ? uUsers.join(', ') : 'none'));

        lastPayout = now;
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
                if ($.getUserPoints(sender) == 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.get.self.nopoints', pointNameMultiple));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.get.self.withtime', ($.hasRank(sender) ? "the " + $.getRank(sender) : ""), $.getPointsString($.getUserPoints(sender)), $.getUserTimeString(sender)));
                }
            } else {

                /**
                 * @commandpath points user [username] - Check the points of the user given by username
                 */
                if (action.equalsIgnoreCase('user') || action.equalsIgnoreCase('check')) {
                    if (!actionArg1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.user.usage'));
                        return;
                    }

                    user = (actionArg1 + '').toLowerCase();
                    if (!$.user.isKnown(user)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', user));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.user.success', $.resolveRank(user), $.getPointsString($.getUserPoints(user))));
                }

                /**
                 * @commandpath points add [username] [amount] - Add an amount of points to a user's balance
                 */
                else if (action.equalsIgnoreCase('add')) {
                    actionArg1 = (actionArg1 + '').toLowerCase();
                    actionArg2 = parseInt(actionArg2);
                    if (isNaN(actionArg2)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.usage'));
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
                            $.getPointsString(actionArg2), $.username.resolve(actionArg1), $.getPointsString($.getUserPoints(actionArg1))));
                    }
                }

                /**
                 * @commandpath points take [username] [amount] - Take an amount of points from the user's balance
                 */
                else if (action.equalsIgnoreCase('take')) {
                    actionArg1 = (actionArg1 + '').toLowerCase();
                    actionArg2 = parseInt(actionArg2);
                    if (isNaN(actionArg2)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.take.usage'));
                        return
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
                        $.getPointsString(actionArg2), $.username.resolve(actionArg1), $.getPointsString($.getUserPoints(actionArg1))))
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
                        pointNameSingle, $.username.resolve(actionArg1), $.getPointsString($.getUserPoints(actionArg1))));
                }

                /**
                 * @commandpath points all [amount] - Send an amount of points to all users in the chat
                 */
                else if (action.equalsIgnoreCase('all')) {
                    if (!actionArg1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.all.usage'));
                        return;
                    }
                    actionArg1 = parseInt(actionArg1);
                    if (actionArg1 < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.add.error.negative', pointNameMultiple));
                        return;
                    }

                    for (i in $.users) {
                        $.inidb.incr('points', $.users[i][0].toLowerCase(), actionArg1);
                    }
                    $.say($.lang.get('pointsystem.add.all.success', $.getPointsString(actionArg1)));
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
                        registerPointCommands(temp);
                        registerPointCommands();
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.single.success', temp, pointNameSingle));
                        return;
                    }
                    if (actionArg1.equalsIgnoreCase('multiple') && actionArg2) {
                        temp = pointNameMultiple;
                        pointNameMultiple = actionArg2;
                        $.inidb.set('pointSettings', 'pointNameMultiple', pointNameMultiple);
                        registerPointCommands(temp);
                        registerPointCommands();
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.multiple.success', temp, pointNameMultiple));
                        return;
                    }
                    if (actionArg1.equalsIgnoreCase('delete')) {
                        $.inidb.del('pointSettings', 'pointNameSingle');
                        $.inidb.del('pointSettings', 'pointNameMultiple');
                        registerPointCommands(pointNameSingle);
                        registerPointCommands(pointNameMultiple);
                        pointNameSingle = "point";
                        pointNameMultiple = "points";
                        $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.name.delete'));
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
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.set.gain.success', pointNameSingle, $.getPointsString(onlineGain), onlinePayoutInterval));
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
                } else if (action.equalsIgnoreCase('modpermtoggle')) {
                    modPointsPermToggle = !modPointsPermToggle;
                    $.setIniDbBoolean('pointSettings', 'modPointsPermToggle', modPointsPermToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.modpermtoggle.success',
                        (modPointsPermToggle ? 'moderator' : 'administrator')));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get("pointsystem.usage.invalid", "!" + command));
                }
            }
        }


        /**
         * @commandpath makeitrain [amount] - Send a random amount of points to each user in the channel
         */
        if (command.equalsIgnoreCase('makeitrain')) {
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
                var amount = $.randRange(1, action);
                temp = [];
                $.inidb.incr('points', $.users[i][0].toLowerCase(), amount);
                if (!$.users[i][0].equalsIgnoreCase($.botName)) {
                    temp.push($.username.resolve($.users[i][0]) + ': ' + $.getPointsString(amount));
                }
            }

            if (temp.length > 0) {
                $.say($.lang.get('pointsystem.makeitrain.success', username, pointNameMultiple, temp.join(', ')));
            }
        }

        /**
         * @commandpath gift [user] [amount] - Give points to a friend.
         */
        if (command.equalsIgnoreCase('gift')) {
            if (!args[0] || !args[1]) {
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
    });

    // Set the timer for the points payouts
    setInterval(function() {
        runPointsPayout();
    }, 6e4);

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/pointSystem.js')) {
            $.registerChatCommand('./systems/pointSystem.js', 'makeitrain', 2);
            $.registerChatCommand('./systems/pointSystem.js', 'points', 7);
            $.registerChatCommand('./systems/pointSystem.js', 'point', 7);
            $.registerChatCommand('./systems/pointSystem.js', 'gift', 7);

            $.registerChatSubcommand('points', 'add', 1);
            $.registerChatSubcommand('points', 'take', 1);
            $.registerChatSubcommand('points', 'set', 1);
            $.registerChatSubcommand('points', 'all', 1);
            $.registerChatSubcommand('points', 'setname', 1);
            $.registerChatSubcommand('points', 'setgain', 1);
            $.registerChatSubcommand('points', 'setofflinegain', 1);
            $.registerChatSubcommand('points', 'setinterval', 1);
            $.registerChatSubcommand('points', 'user', 7);
            $.registerChatSubcommand('points', 'check', 7);

            registerPointCommands();
        }
    });

    /** Export functions to API */
    $.pointNameSingle = pointNameSingle;
    $.pointNameMultiple = pointNameMultiple;
    $.getUserPoints = getUserPoints;
    $.getPointsString = getPointsString;
})();
