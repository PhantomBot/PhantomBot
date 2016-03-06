/**
 * adventureSystem.js
 *
 * It's an improved bankheist, basically.
 *
 * Viewers can start/join an adventure using the commands.
 * A random story will then bee chosen from the available stories.
 * This means this heist can have more than one story, in fact it can have pretty much
 * an infinite amount of different locations, events etc...
 *
 * When a user joins the adventure the module will check if
 * the Tamagotchi module is active and attempt to retrieve the user's tamagotchi.
 * If the user owns a tamagotchi and it's feeling good enough it wil join
 * the adventure with it's own entry of half of its owner's bet.
 * If the tamagotchi survives it wil then give it's price to it's owner.
 */
(function() {
    var joinTime = ($.inidb.exists('adventureSettings', 'joinTime') ? parseInt($.inidb.get('adventureSettings', 'joinTime')) : 60),
        coolDown = ($.inidb.exists('adventureSettings', 'coolDown') ? parseInt($.inidb.get('adventureSettings', 'coolDown')) : 900),
        gainPercent = ($.inidb.exists('adventureSettings', 'gainPercent') ? parseInt($.inidb.get('adventureSettings', 'gainPercent')) : 30),
        minBet = ($.inidb.exists('adventureSettings', 'minBet') ? parseInt($.inidb.get('adventureSettings', 'minBet')) : 10),
        maxBet = ($.inidb.exists('adventureSettings', 'maxBet') ? parseInt($.inidb.get('adventureSettings', 'maxBet')) : 1000),
        tgFunIncr = 1,
        tgExpIncr = 0.5,
        tgFoodDecr = 0.25,
        currentAdventure = 1,
        stories = [];

    /**
     * @function loadStories
     */
    function loadStories() {
        var storyId = 1,
            chapterId,
            lines;

        for (storyId; $.lang.exists('adventuresystem.stories.' + storyId + '.title'); storyId++) {
            lines = [];
            for (chapterId = 1;
                ($.lang.exists('adventuresystem.stories.' + storyId + '.chapter.' + chapterId)); chapterId++) {
                lines.push($.lang.get('adventuresystem.stories.' + storyId + '.chapter.' + chapterId));
            }
            stories.push({
                title: $.lang.get('adventuresystem.stories.' + storyId + '.title'),
                lines: lines,
            });
        }
        $.consoleDebug($.lang.get('adventuresystem.loaded', storyId - 1));
    };

    /**
     * @function top5
     */
    function top5() {
        var payoutsKeys = $.inidb.GetKeyList('adventurePayouts', ''),
            temp = [],
            counter = 1,
            top5 = [],
            i;

        if (payoutsKeys.length == 0) {
            $.say($.lang.get('adventuresystem.top5.empty'));
        }

        for (i in payoutsKeys) {
            if (payoutsKeys[i].equalsIgnoreCase($.ownerName) || payoutsKeys[i].equalsIgnoreCase($.botName)) {
                continue;
            }
            temp.push({
                username: payoutsKeys[i],
                amount: parseInt($.inidb.get('adventurePayouts', payoutsKeys[i])),
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
    };

    /**
     * @function checkUserAlreadyJoined
     * @param {string} username
     * @returns {boolean}
     */
    function checkUserAlreadyJoined(username) {
        var i;
        for (i in currentAdventure.users) {
            if (currentAdventure.users[i].username == username) {
                return true;
            }
        }
        return false;
    };

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
    };

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
    };

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
        return line
    };

    /**
     * @function inviteTamagotchi
     * @param {string} username
     * @param {Number} bet
     */
    function inviteTamagotchi(username, bet) {
        if ($.bot.isModuleEnabled('./games/tamagotchi.js')) {
            //noinspection JSUnresolvedVariable,JSUnresolvedFunction
            var userTG = $.tamagotchi.getByOwner(username);
            if (userTG) {
                //noinspection JSUnresolvedFunction
                if (userTG.isHappy()) {
                    //noinspection JSUnresolvedFunction
                    userTG
                        .incrFunLevel(tgFunIncr)
                        .incrExpLevel(tgExpIncr)
                        .decrFoodLevel(tgFoodDecr)
                        .save();
                    $.say($.lang.get('adventuresystem.tamagotchijoined', userTG.name));
                    currentAdventure.users.push({
                        username: userTG.name,
                        tgOwner: username,
                        bet: (bet / 2),
                    });
                } else {
                    //noinspection JSUnresolvedFunction
                    userTG.sayFunLevel();
                }
            }
        }
    };

    /**
     * @function startHeist
     * @param {string} username
     */
    function startHeist(username) {
        currentAdventure.gameState = 1;

        var t = setTimeout(function() {
            runStory();
            clearTimeout(t);
        }, joinTime * 1e3);

        $.say($.lang.get('adventuresystem.start.success', $.resolveRank(username), $.pointNameMultiple));
    };

    /**
     * @function joinHeist
     * @param {string} username
     * @param {Number} bet
     * @returns {boolean}
     */
    function joinHeist(username, bet) {
        if (currentAdventure.gameState > 1) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.notpossible'));
            return;
        }

        if (checkUserAlreadyJoined(username)) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.alreadyjoined'));
            return;
        }

        if (bet > $.getUserPoints(username)) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.needpoints', $.getPointsString(bet), $.getPointsString($.getUserPoints(username))));
            return;
        }

        if (bet < minBet) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.bettoolow', $.getPointsString(bet), $.getPointsString(minBet)));
            return;
        }

        if (bet > maxBet) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.bettoohigh', $.getPointsString(bet), $.getPointsString(maxBet)));
            return;
        }

        currentAdventure.users.push({
            username: username,
            bet: parseInt(bet),
        });

        $.inidb.decr('points', username, bet);
        inviteTamagotchi(username, bet);

        if (currentAdventure.gameState == 0) {
            startHeist(username);
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.success', $.getPointsString(bet)));
        }
        return true;
    };

    /**
     * @function runStory
     */
    function runStory() {
        var progress = 0,
            story = $.randElement(stories),
            line,
            t;

        currentAdventure.gameState = 2;
        calculateResult();
        $.say($.lang.get('adventuresystem.runstory', story.title, currentAdventure.users.length));

        t = setInterval(function() {
            if (progress < story.lines.length) {
                line = replaceTags(story.lines[progress]);
                if (line != '') {
                    $.say(line);
                }
            } else {
                endHeist();
                clearInterval(t);
            }
            progress++;
        }, 5e3);
    };

    /**
     * @function endHeist
     */
    function endHeist() {
        var i, pay;
        for (i in currentAdventure.survivors) {
            if (currentAdventure.survivors[i].tgOwner) {
                currentAdventure.survivors[i].username = currentAdventure.survivors[i].tgOwner;
            }
            pay = (currentAdventure.survivors[i].bet * (gainPercent / 100));
            $.inidb.incr('adventurePayouts', currentAdventure.survivors[i].username, pay);
            $.inidb.incr('points', currentAdventure.survivors[i].username, currentAdventure.survivors[i].bet + pay);
        }

        $.say($.lang.get('adventuresystem.completed', currentAdventure.survivors.length, currentAdventure.caught.length));
        clearCurrentAdventure();
        $.coolDown.set('adventure', coolDown * 1e3);
    };

    /**
     * @function clearCurrentAdventure
     */
    function clearCurrentAdventure() {
        currentAdventure = {
            gameState: 0,
            users: [],
            tgOwners: [],
            survivors: [],
            caught: [],
        }
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = parseInt(args[2]);

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
                if (!$.isAdmin(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }

                if (!actionArg1 || isNaN(actionArg2)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                    return;
                }

                /**
                 * @commandpath adventure set jointime [seconds] - Set the join time
                 */
                if (actionArg1.equalsIgnoreCase('joinTime')) {
                    joinTime = actionArg2;
                    $.inidb.set('adventureSettings', 'joinTime', actionArg2);
                }

                /**
                 * @commandpath adventure set cooldown [seconds] - Set cooldown time
                 */
                if (actionArg1.equalsIgnoreCase('coolDown')) {
                    coolDown = actionArg2;
                    $.inidb.set('adventureSettings', 'coolDown', actionArg2);
                }

                /**
                 * @commandpath adventure set gainpercent [value] - Set the gain percent value
                 */
                if (actionArg1.equalsIgnoreCase('gainPercent')) {
                    gainPercent = actionArg2;
                    $.inidb.set('adventureSettings', 'gainPercent', actionArg2);
                }

                /**
                 * @commandpath adventure set minbet [value] - Set the minimum bet
                 */
                if (actionArg1.equalsIgnoreCase('minBet')) {
                    minBet = actionArg2;
                    $.inidb.set('adventureSettings', 'minBet', actionArg2);
                }

                /**
                 * @commandpath adventure set maxbet [value] - Set the maximum bet
                 */
                if (actionArg1.equalsIgnoreCase('maxBet')) {
                    maxBet = actionArg2;
                    $.inidb.set('adventureSettings', 'maxBet', actionArg2);
                }

                $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.success', actionArg1, actionArg2));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/adventureSystem.js')) {
            clearCurrentAdventure();
            loadStories();
            $.registerChatCommand('./games/adventureSystem.js', 'adventure', 7);
        }
    });

    /**
     * Warn the user if the points system is disabled and this is enabled.
     */
    if ($.bot.isModuleEnabled('./games/adventureSystem.js') && !$.bot.isModuleEnabled('./systems/pointSystem.js')) {
        $.logError('adventureSystem.js', 402, "Disabled. ./systems/pointSystem.js is not enabled.");
    }

})();