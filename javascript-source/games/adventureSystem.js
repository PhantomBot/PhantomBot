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

(function() {
    var joinTime = $.getSetIniDbNumber('adventureSettings', 'joinTime', 60),
        coolDown = $.getSetIniDbNumber('adventureSettings', 'coolDown', 900),
        gainPercent = $.getSetIniDbNumber('adventureSettings', 'gainPercent', 30),
        minBet = $.getSetIniDbNumber('adventureSettings', 'minBet', 10),
        maxBet = $.getSetIniDbNumber('adventureSettings', 'maxBet', 1000),
        enterMessage = $.getSetIniDbBoolean('adventureSettings', 'enterMessage', false),
        warningMessage = $.getSetIniDbBoolean('adventureSettings', 'warningMessage', false),
        coolDownAnnounce = $.getSetIniDbBoolean('adventureSettings', 'coolDownAnnounce', false),
        startPermission = $.getSetIniDbNumber('adventureSettings', 'startPermission', $.PERMISSION.Viewer),
        currentAdventure = {},
        stories = [],
        lastStory,
        _currentAdventureLock = new Packages.java.util.concurrent.locks.ReentrantLock();


    function reloadAdventure() {
        joinTime = $.getIniDbNumber('adventureSettings', 'joinTime');
        coolDown = $.getIniDbNumber('adventureSettings', 'coolDown');
        gainPercent = $.getIniDbNumber('adventureSettings', 'gainPercent');
        minBet = $.getIniDbNumber('adventureSettings', 'minBet');
        maxBet = $.getIniDbNumber('adventureSettings', 'maxBet');
        enterMessage = $.getIniDbBoolean('adventureSettings', 'enterMessage');
        warningMessage = $.getIniDbBoolean('adventureSettings', 'warningMessage');
        coolDownAnnounce = $.getIniDbBoolean('adventureSettings', 'coolDownAnnounce');
        startPermission = $.getSetIniDbNumber('adventureSettings', 'startPermission', $.PERMISSION.Viewer);
    }

    /**
     * Loads stories from the prefixes 'adventuresystem.stories.default' (only if the language
     * property of 'adventuresystem.stories.default.enabled' is set to 'true') and
     * 'adventuresystem.stories'.
     *
     * Clears any previously loaded stories.
     *
     * @function loadStories
     */
    function loadStories() {
        currentAdventure.users = [];
        currentAdventure.survivors = [];
        currentAdventure.caught = [];
        currentAdventure.gameState = 0;

        stories = [];

        // For backwards compatibility, load default stories if the variable is not set
        if (!$.lang.exists('adventuresystem.stories.default') || $.lang.get('adventuresystem.stories.default') === 'true') {
            loadStoriesFromPrefix('adventuresystem.stories');
        }

        loadStoriesFromPrefix('adventuresystem.stories.custom');

        $.consoleDebug($.lang.get('adventuresystem.loaded', stories.length));

        for (var i in stories) {
            if (stories[i].game === null) {
                return;
            }
        }

        $.log.warn('You must have at least one adventure that doesn\'t require a game to be set.');
        currentAdventure.gameState = 2;
    }

    /**
     * Loads stories from a specific prefix in the language table and adds them to the
     * global stories array.
     *
     * @param {string} prefix - The prefix underneath which the stories can be found
     * @example
     * // Import stories with adventuresystem.stories.custom.X.title as title and
     * // adventuresystem.stories.custom.X.chapter.Y as chapters
     * loadStoriesFromPrefix('adventuresystem.stories.custom');
     */
    function loadStoriesFromPrefix(prefix) {
        var storyId = 1,
            chapterId,
            lines;

        for (storyId; $.lang.exists(prefix + '.' + storyId + '.title'); storyId++) {
            lines = [];
            for (chapterId = 1; $.lang.exists(prefix + '.' + storyId + '.chapter.' + chapterId); chapterId++) {
                lines.push($.lang.get(prefix + '.' + storyId + '.chapter.' + chapterId));
            }

            stories.push({
                game: ($.lang.exists(prefix + '.' + storyId + '.game') ? $.lang.get(prefix + '.' + storyId + '.game') : null),
                title: $.lang.get(prefix + '.' + storyId + '.title'),
                lines: lines
            });
        }

        $.consoleDebug($.lang.get('adventuresystem.loaded.prefix', storyId - 1, prefix));
    }

    /**
     * @function top5
     */
    function top5() {
        var payoutsKeys = $.inidb.GetKeyList('adventurePayouts', ''),
            temp = [],
            counter = 1,
            top5 = [],
            i;

        if (payoutsKeys.length === 0) {
            $.say($.lang.get('adventuresystem.top5.empty'));
        }

        for (i in payoutsKeys) {
            if (payoutsKeys[i].equalsIgnoreCase($.ownerName) || payoutsKeys[i].equalsIgnoreCase($.botName)) {
                continue;
            }
            temp.push({
                username: payoutsKeys[i],
                amount: parseInt($.inidb.get('adventurePayouts', payoutsKeys[i]))
            });
        }

        temp.sort(function(a, b) {
            return (a.amount < b.amount ? 1 : -1);
        });

        for (i in temp) {
            if (counter <= 5) {
                top5.push(counter + '. ' + temp[i].username + ': ' + $.getPointsString(temp[i].amount));
                counter++;
            }
        }
        $.say($.lang.get('adventuresystem.top5', top5.join(', ')));
    }

    /**
     * @function checkUserAlreadyJoined
     * @param {string} username
     * @returns {boolean}
     */
    function checkUserAlreadyJoined(username) {
        var i;
        _currentAdventureLock.lock();
        try {
            for (i in currentAdventure.users) {
                if (currentAdventure.users[i].username === username) {
                    return true;
                }
            }
        } finally {
            _currentAdventureLock.unlock();
        }

        return false;
    }

    /**
     * @function adventureUsersListJoin
     * @param {Array} list
     * @returns {string}
     */
    function adventureUsersListJoin(list) {
        var temp = [],
            i;
        for (i in list) {
            temp.push($.username.resolve(list[i].username));
        }
        return temp.join(', ');
    }

    /**
     * @function calculateResult
     */
    function calculateResult() {
        var i;
        for (i in currentAdventure.users) {
            if ($.randRange(0, 20) > 5) {
                currentAdventure.survivors.push(currentAdventure.users[i]);
            } else {
                currentAdventure.caught.push(currentAdventure.users[i]);
            }
        }
    }

    /**
     * @function replaceTags
     * @param {string} line
     * @returns {string}
     */
    function replaceTags(line) {
        if (line.indexOf('(caught)') > -1) {
            if (currentAdventure.caught.length > 0) {
                return line.replace('(caught)', adventureUsersListJoin(currentAdventure.caught));
            } else {
                return '';
            }
        }
        if (line.indexOf('(survivors)') > -1) {
            if (currentAdventure.survivors.length > 0) {
                return line.replace('(survivors)', adventureUsersListJoin(currentAdventure.survivors));
            } else {
                return '';
            }
        }
        return line;
    }

    /**
     * @function startHeist
     * @param {string} username
     */
    function startHeist(username) {
        currentAdventure.gameState = 1;

        var t = setTimeout(function() {
            runStory();
        }, joinTime * 1e3);

        $.say($.lang.get('adventuresystem.start.success', $.resolveRank(username), $.pointNameMultiple));
    }

    /**
     * @function joinHeist
     * @param {string} username
     * @param {Number} bet
     * @returns {boolean}
     */
    function joinHeist(username, bet) {
        if (stories.length < 1) {
            $.log.error('No adventures found; cannot start an adventure.');
            return;
        }

        if (currentAdventure.gameState > 1) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.notpossible'));
            return;
        }

        if (checkUserAlreadyJoined(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.alreadyjoined'));
            return;
        }

        if (bet > $.getUserPoints(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.needpoints', $.getPointsString(bet), $.getPointsString($.getUserPoints(username))));
            return;
        }

        if (bet < minBet) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.bettoolow', $.getPointsString(bet), $.getPointsString(minBet)));
            return;
        }

        if (bet > maxBet) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.bettoohigh', $.getPointsString(bet), $.getPointsString(maxBet)));
            return;
        }

        if (currentAdventure.gameState === 0) {
            if (!$.checkUserPermission(username, undefined, startPermission)) {
                return;
            }
            startHeist(username);
        } else if (enterMessage) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.success', $.getPointsString(bet)));
        }

        _currentAdventureLock.lock();
        try {
            currentAdventure.users.push({
                username: username,
                bet: parseInt(bet)
            });
        } finally {
            _currentAdventureLock.unlock();
        }

        $.inidb.decr('points', username, bet);
        return true;
    }

    /**
     * @function runStory
     */
    function runStory() {
        var progress = 0,
            temp = [],
            story,
            line,
            t;

        currentAdventure.gameState = 2;
        calculateResult();

        var game = $.getGame($.channelName);

        for (var i in stories) {
            if (stories[i].game !== null) {
                if (game.equalsIgnoreCase(stories[i].game)) {
                    //$.consoleLn('gamespec::' + stories[i].title);
                    temp.push({
                        title: stories[i].title,
                        lines: stories[i].lines
                    });
                }
            } else {
                //$.consoleLn('normal::' + stories[i].title);
                temp.push({
                    title: stories[i].title,
                    lines: stories[i].lines
                });
            }
        }

        do {
            story = $.randElement(temp);
        } while (story === lastStory && stories.length !== 1);

        $.say($.lang.get('adventuresystem.runstory', story.title, currentAdventure.users.length));

        t = setInterval(function() {
            if (progress < story.lines.length) {
                line = replaceTags(story.lines[progress]);
                if (line !== '') {
                    $.say(line.replace(/\(game\)/g, $.twitchcache.getGameTitle() + ''));
                }
            } else {
                endHeist();
                clearInterval(t);
            }
            progress++;
        }, 7e3);
    }

    /**
     * @function endHeist
     */
    function endHeist() {
        var i, pay, username, maxlength = 0;
        var temp = [];

        for (i in currentAdventure.survivors) {
            pay = (currentAdventure.survivors[i].bet * (gainPercent / 100));
            $.inidb.incr('adventurePayouts', currentAdventure.survivors[i].username, pay);
            $.inidb.incr('adventurePayoutsTEMP', currentAdventure.survivors[i].username, pay);
            $.inidb.incr('points', currentAdventure.survivors[i].username, currentAdventure.survivors[i].bet + pay);
        }

        for (i in currentAdventure.survivors) {
            username = currentAdventure.survivors[i].username;
            maxlength += username.length();
            temp.push($.username.resolve(username) + ' (+' + $.getPointsString($.inidb.get('adventurePayoutsTEMP', currentAdventure.survivors[i].username)) + ')');
        }

        if (temp.length === 0) {
            $.say($.lang.get('adventuresystem.completed.no.win'));
        } else if (((maxlength + 14) + $.channelName.length) > 512) {
            $.say($.lang.get('adventuresystem.completed.win.total', currentAdventure.survivors.length, currentAdventure.caught.length)); //in case too many people enter.
        } else {
            $.say($.lang.get('adventuresystem.completed', temp.join(', ')));
        }

        clearCurrentAdventure();
        temp = "";
        $.coolDown.set('adventure', true, coolDown, undefined);
        if (coolDownAnnounce) {
            setTimeout(function() {
                $.say($.lang.get('adventuresystem.reset', $.pointNameMultiple));
            }, coolDown*1000);
        }
    }

    /**
     * @function clearCurrentAdventure
     */
    function clearCurrentAdventure() {
        currentAdventure = {
            gameState: 0,
            users: [],
            survivors: [],
            caught: []
        };
        $.inidb.RemoveFile('adventurePayoutsTEMP');
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = args[2];

        /**
         * @commandpath adventure - Adventure command for starting, checking or setting options
         * @commandpath adventure [amount] - Start/join an adventure
         */
        if (command.equalsIgnoreCase('adventure')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.adventure.usage', $.pointNameMultiple));
                return;
            }

            if (!isNaN(parseInt(action))) {
                joinHeist(sender, parseInt(action));
                return;
            }

            /**
             * @commandpath adventure top5 - Announce the top 5 adventurers in the chat (most points gained)
             */
            if (action.equalsIgnoreCase('top5')) {
                top5();
            }

            /**
             * @commandpath adventure set - Base command for controlling the adventure settings
             */
            if (action.equalsIgnoreCase('set')) {
                if (actionArg1 === undefined || actionArg2 === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                    return;
                }

                /**
                 * @commandpath adventure set jointime [seconds] - Set the join time
                 */
                if (actionArg1.equalsIgnoreCase('joinTime')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }
                    joinTime = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'joinTime', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set cooldown [seconds] - Set cooldown time
                 */
                if (actionArg1.equalsIgnoreCase('coolDown')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }
                    coolDown = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'coolDown', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set gainpercent [value] - Set the gain percent value
                 */
                if (actionArg1.equalsIgnoreCase('gainPercent')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }
                    gainPercent = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'gainPercent', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set minbet [value] - Set the minimum bet
                 */
                if (actionArg1.equalsIgnoreCase('minBet')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }
                    minBet = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'minBet', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set maxbet [value] - Set the maximum bet
                 */
                if (actionArg1.equalsIgnoreCase('maxBet')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }
                    maxBet = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'maxBet', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set warningmessages [true / false] - Sets the per-user warning messages
                 */
                if (actionArg1.equalsIgnoreCase('warningmessages')) {
                    if (args[2].equalsIgnoreCase('true')) warningMessage = true, actionArg2 = $.lang.get('common.enabled');
                    if (args[2].equalsIgnoreCase('false')) warningMessage = false, actionArg2 = $.lang.get('common.disabled');
                    $.inidb.set('adventureSettings', 'warningMessage', warningMessage);
                }

                /**
                 * @commandpath adventure set entrymessages [true / false] - Sets the per-user entry messages
                 */
                if (actionArg1.equalsIgnoreCase('entrymessages')) {
                    if (args[2].equalsIgnoreCase('true')) enterMessage = true, actionArg2 = $.lang.get('common.enabled');
                    if (args[2].equalsIgnoreCase('false')) enterMessage = false, actionArg2 = $.lang.get('common.disabled');
                    $.inidb.set('adventureSettings', 'enterMessage', enterMessage);
                }

                /**
                 * @commandpath adventure set cooldownannounce [true / false] - Sets the cooldown announcement
                 */
                if (actionArg1.equalsIgnoreCase('cooldownannounce')) {
                    if (args[2].equalsIgnoreCase('true')) coolDownAnnounce = true, actionArg2 = $.lang.get('common.enabled');
                    if (args[2].equalsIgnoreCase('false')) coolDownAnnounce = false, actionArg2 = $.lang.get('common.disabled');
                    $.inidb.set('adventureSettings', 'coolDownAnnounce', coolDownAnnounce);
                }

                $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.success', actionArg1, actionArg2));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./games/adventureSystem.js', 'adventure', $.PERMISSION.Viewer);
        $.registerChatSubcommand('adventure', 'set', $.PERMISSION.Admin);
        $.registerChatSubcommand('adventure', 'top5', $.getHighestIDSubVIP());

        loadStories();
    });

    $.reloadAdventure = reloadAdventure;
})();
