/**
 * Provides for a configurable rank system with various different configurable ranks
 * based on time spent in the channel. This is just aesthetic but could, in theory,
 * be used for other purposes if really desired. 
 */

(function() {

    var rankEligableTime = $.getSetIniDbNumber('settings', 'rankEligableTime', 50),
        rankEligableCost = $.getSetIniDbNumber('settings', 'rankEligableCost', 200),
        ranksTimeTable;

    /**
     * @function sortCompare
     * Callback function for sorting the ranksMapping table.
     */
    function sortCompare(a, b) {
        var numA = parseInt(a),
            numB = parseInt(b);

        if (numA > numB) {
            return 1;
        } else if (numA == numB) {
            return 0;
        } else {
            return -1;
        }
    }

    /**
     * @function loadRanksTimeTable
     * Loads the time portion of the ranksMapping table into local memory and sorts it.
     * The table is then used to map to the rank that a person belongs to.
     */
    function loadRanksTimeTable() {
        ranksTimeTable = $.inidb.GetKeyList('ranksMapping', '');
        ranksTimeTable.sort(sortCompare);
    }

    /**
     * @function hasRank
     * @export $
     * @param {string} username
     * @returns {boolean}
     */
    function hasRank(username) {
        var userTime;

        username = username.toLowerCase();

        // Has a custom rank.
        if ($.inidb.exists('viewerRanks', username.toLowerCase())) {
            return true;
        }

        // Look for data in the ranksMapping table, if none, the user has no rank, else, has a rank.
        if (ranksTimeTable === undefined) {
            loadRanksTimeTable();
        }
        if (ranksTimeTable.length == 0) {
            return false;
        }

        userTime = parseInt(parseInt($.inidb.get('time', username)) / 3600);
        if (isNaN(userTime)) {
            userTime = 0;
        }
        for (var i = 0; i < ranksTimeTable.length; i++) {
            if (parseInt(userTime) >= parseInt(ranksTimeTable[i])) {
                return true;
            } else {
                i = ranksTimeTable.length;
            }
        }
        return false;
    }

    /**
     * @function getRank
     * @export $
     * @param {string} username
     * @returns {string}
     */
    function getRank(username) {
        var userTime,
            userLevel;

        username = username.toLowerCase();

        if (!hasRank(username)) {
            return '';
        }

        // Return Custom Rank
        if ($.inidb.exists('viewerRanks', username.toLowerCase())) {
            return $.inidb.get('viewerRanks', username.toLowerCase());
        }

        // Return System Rank
        userLevel = -1;
        userTime = parseInt(parseInt($.inidb.get('time', username)) / 3600);
        if (isNaN(userTime)) {
            userTime = 0;
        }
        for (var i = 0; i < ranksTimeTable.length; i++) {
            if (parseInt(userTime) >= parseInt(ranksTimeTable[i])) {
                userLevel = i;
            } else {
                i = ranksTimeTable.length;
            }
        }
        if (userLevel != -1) {
            return $.inidb.get('ranksMapping', ranksTimeTable[userLevel].toString());
        }
        return '';
    }

    /**
     * @function resolveRank
     * @export $
     * @param {string} username
     * @param {boolean} resolveName
     * @returns {string}
     */
    function resolveRank(username) {
        return (getRank(username.toLowerCase()) + ' ' + ($.username.hasUser(username) == true ? $.username.get(username) : username)).trim();
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender().toLowerCase(),
            username = $.username.resolve(sender),
            levelTime,
            levelName,
            userTime = parseInt(parseInt($.inidb.get('time', sender)) / 3600),
            rankEligableTime = $.getIniDbNumber('settings', 'rankEligableTime', 50),
            rankEligableCost = $.getIniDbNumber('settings', 'rankEligableCost', 200),
            userLevel,
            timeUntilNextRank,
            nextLevel,
            isReplace,
            customUser,
            customRank;

        if (isNaN(userTime)) {
            userTime = 0;
        }

        /*
         * @commandpath rankedit - Displays the usage of rankedit.
         * @commandpath rankedit add [time] [rankname] - Add a new rank. Time is in hours.
         * @commandpath rankedit del [time] - Deletes the rank associated with the given time
         * @commandpath rankedit custom [user] [rankname] - Add a custom rank to a user.
         * @commandpath rankedit customdel [user] - Remove a custom rank from a user.
         * @commandpath rankedit settime [time] - Number of minimum hours before user can choose custom rank.
         * @commandpath rankedit setcost [points] - Cost of custom rank.
         */
        if (command.equalsIgnoreCase('rankedit')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ranks.edit.usage'));
                return;
            }

            if (args[0].equalsIgnoreCase('settime')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.settime.usage'));
                    return;
                }

                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.settime.usage'));
                    return;
                }

                rankEligableTime = parseInt(args[1]);
                $.inidb.set('settings', 'rankEligableTime', rankEligableTime);
                $.say($.whisperPrefix(sender) + $.lang.get('ranks.settime.success', rankEligableTime));
                return;
            }

            if (args[0].equalsIgnoreCase('setcost')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.setcost.usage', $.pointNameMultiple));
                    return;
                }

                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.setcost.usage', $.pointNameMultiple));
                    return;
                }

                rankEligableCost = parseInt(args[1]);
                $.inidb.set('settings', 'rankEligableCost', rankEligableCost);
                $.say($.whisperPrefix(sender) + $.lang.get('ranks.setcost.success', rankEligableCost, $.pointNameMultiple));
                return;
            }

            if (args[0].equalsIgnoreCase('custom')) {
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.custom.usage'));
                    return;
                }

                customUser = args[1];
                customRank = args.splice(2).join(' ');

                if (!$.inidb.exists('time', customUser.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.custom.404', customUser));
                    return;
                }

                $.inidb.set('viewerRanks', customUser.toLowerCase(), customRank);
                $.say($.whisperPrefix(sender) + $.lang.get('ranks.custom.success', $.username.resolve(customUser), customRank));
                return;
            }

            if (args[0].equalsIgnoreCase('customdel')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.customdel.usage'));
                    return;
                }

                customUser = args[1];

                if (!$.inidb.exists('viewerRanks', customUser.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.customdel.404', customUser));
                    return;
                }

                $.inidb.del('viewerRanks', customUser.toLowerCase());
                $.say($.whisperPrefix(sender) + $.lang.get('ranks.customdel.success', $.username.resolve(customUser)));
                return;
            }

            if (args[0].equalsIgnoreCase('add')) {
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.add.usage'));
                    return;
                }
                if (isNaN(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.add.usage'));
                    return;
                }

                levelTime = args[1];
                levelName = args.splice(2).join(' ');

                isReplace = $.inidb.exists('ranksMapping', levelTime);
                $.inidb.set('ranksMapping', levelTime, levelName);
                if (isReplace) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.add.success-update', levelTime, levelName));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.add.success-new', levelTime, levelName));
                }

                if (!isReplace) {
                    loadRanksTimeTable();
                }
                return;
            }

            if (args[0].equalsIgnoreCase('del')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.del.usage'));
                    return;
                }

                if (!$.inidb.exists('ranksMapping', args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.del.404', args[1]));
                } else {
                    $.inidb.del('ranksMapping', args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('ranks.del.success', args[1]));
                    loadRanksTimeTable();
                }
                return;
            }
        }

        /**
         * @commandpath rank - Display current rank.
         * @commandpath rank set [rankname] - Set rank for self if enough hours and points, if applicable, available in chat.
         * @commandpath rank del - Deletes customized rank.
         */
        if (command.equalsIgnoreCase('rank')) {
            if (args[0]) {
                if (args[0].equalsIgnoreCase('del')) {
                    if (inidb.exists('viewerRanks', sender.toLowerCase())) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ranks.delself.success'));
                        $.inidb.del('viewerRanks', sender.toLowerCase());
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ranks.delself.404'));
                    }
                    return;
                }

                if (args[0].equalsIgnoreCase('set')) {
                    if (!args[1]) {
                        if ($.bot.isModuleEnabled('./systems/pointSystem.js')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('ranks.set.usage', rankEligableTime, rankEligableCost, $.pointNameMultiple));
                        } else {
                            $.say($.whisperPrefix(sender) + $.lang.get('ranks.set.usage.nopoints', rankEligableTime));
                        }
                        return;
                    }

                    customRank = args.splice(1).join(' ');

                    if (userTime >= rankEligableTime &&
                        ($.bot.isModuleEnabled('./systems/pointSystem.js') && getUserPoints(sender) > rankEligableCost) || !$.bot.isModuleEnabled('./systems/pointSystem.js')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ranks.set.success', customRank));
                        $.inidb.set('viewerRanks', sender.toLowerCase(), customRank);
                        if ($.bot.isModuleEnabled('./systems/pointSystem.js')) {
                            $.inidb.decr('points', sender.toLowerCase(), rankEligableCost);
                        }
                        return;
                    }

                    if ($.bot.isModuleEnabled('./systems/pointSystem.js')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ranks.set.failure', rankEligableTime, $.pointNameMultiple, rankEligableCost));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ranks.set.failure.nopoints', rankEligableTime));
                    }
                    return;
                }
            }

            if ($.inidb.exists('viewerRanks', username.toLowerCase())) {
                $.say($.lang.get('ranks.rank.customsuccess', username, $.inidb.get('viewerRanks', username.toLowerCase())));
                return;
            }

            if (ranksTimeTable === undefined) {
                loadRanksTimeTable();
            }
            if (ranksTimeTable.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ranks.rank.404'));
                return;
            }

            userLevel = -1;
            for (var i = 0; i < ranksTimeTable.length; i++) {
                if (parseInt(userTime) >= parseInt(ranksTimeTable[i])) {
                    userLevel = i;
                } else {
                    i = ranksTimeTable.length;
                }
            }

            if (userLevel <= ranksTimeTable.length - 2) {
                nextLevel = parseInt(userLevel) + 1;
                timeUntilNextRank = parseInt(ranksTimeTable[nextLevel]) - userTime;
                if (userLevel == -1) {
                    $.say($.lang.get('ranks.rank.norank.success', username, timeUntilNextRank, $.inidb.get('ranksMapping', ranksTimeTable[nextLevel].toString())));
                } else {
                    $.say($.lang.get('ranks.rank.success', username, $.inidb.get('ranksMapping', ranksTimeTable[userLevel].toString()), timeUntilNextRank, $.inidb.get('ranksMapping', ranksTimeTable[nextLevel].toString())));
                }
            } else {
                $.say($.lang.get('ranks.rank.maxsuccess', username, $.inidb.get('ranksMapping', ranksTimeTable[userLevel].toString())));
            }
            return;
        }

    });

    /**
     * @event initReady
     *
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/ranksSystem.js', 'rank', 7);
        $.registerChatCommand('./systems/ranksSystem.js', 'rankedit', 1);

        $.registerChatSubcommand('rankedit', 'add', 1);
        $.registerChatSubcommand('rankedit', 'del', 1);
        $.registerChatSubcommand('rankedit', 'custom', 1);
        $.registerChatSubcommand('rankedit', 'customdel', 1);

        $.registerChatSubcommand('rank', 'set', 7);
        $.registerChatSubcommand('rank', 'del', 7);
    });

    /**
     * Export functions to API
     */
    $.resolveRank = resolveRank;
    $.getRank = getRank;
    $.hasRank = hasRank;
    $.loadRanksTimeTable = loadRanksTimeTable;
})();