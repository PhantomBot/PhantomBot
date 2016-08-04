(function() {
    var cost = 0,
        entries = [],
        keyword = '',
        followers = false,
        raffleStatus = false,
        msgToggle = $.getSetIniDbBoolean('settings', 'raffleMSGToggle', false),
        noRepickSame = $.getSetIniDbBoolean('settings', 'noRepickSame', true),
        raffleMessage = $.getSetIniDbString('settings', 'raffleMessage', 'A raffle is still opened! Type !(keyword) to enter. (entries) users have entered so far.'),
        messageInterval = $.getSetIniDbNumber('settings', 'raffleMessageInterval', 0),
        timer = 0,
        totalEntries = 0,
        a = '',
        costLang = '', 
        interval,
        timeout,
        timeout1;


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
    };

    function reloadRaffle() {
        noRepickSame = $.getIniDbBoolean('settings', 'noRepickSame');
        msgToggle = $.getIniDbBoolean('settings', 'raffleMSGToggle');
        raffleMessage = $.getSetIniDbString('settings', 'raffleMessage');
        messageInterval = $.getSetIniDbNumber('settings', 'raffleMessageInterval');
    };

    /**
     * @function checkArgs
     * @returns {boolean}
     */
    function checkArgs(user, key, price, t, followersOnly) {
        if (raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.opened'));
            return;
        }

        if (!key || !price) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.missing.syntax'));
            return;
        }

        if (price < 0) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.negative'));
            return;
        }

        if (key.includes('!')) {
            key = key.replace('!', '');
        }

        if (key) {
            keyword = key;
        }

        if (price) {
            cost = parseInt(price);
            if (cost != 0) {
                costLang = $.lang.get('rafflesystem.cost.lang', $.getPointsString(cost));  
            }
        }

        if (t) {
            timer = parseInt(t);
        }

        if (followersOnly && followersOnly.equalsIgnoreCase('-followers')) {
            followers = true;
            a = $.lang.get('rafflesystem.msg.need.to.be.follwing');
        }
        openRaffle(key, cost, followers, timer, a, user);
    };

    /**
     * @function openRaffle
     * @returns {opens raffle}
     */
    function openRaffle(key, cost, followers, timer, a, user) {
        $.say($.lang.get('rafflesystem.raffle.opened', costLang, key, a));
        $.registerChatCommand('./systems/raffleSystem.js', key, 7);
        entries = "";
        entries = [];
        $.inidb.RemoveFile('raffleList');
        $.inidb.set('raffleresults', 'raffleEntries', 0);
        $.inidb.set('raffle', 'command', key);
        raffleStatus = true;

        if (timer > 0) {
            timeout = setTimeout(function() {
                $.say($.lang.get('rafflesystem.warn', key));
            }, (timer / 2) * 1000);
            timeout1 = setTimeout(function() {
                closeRaffle();
            }, timer * 1000);
        }

        if (messageInterval != 0) {
            interval = setInterval(function() {
                $.say(raffleMessage.replace(/\(keyword\)/g, keyword).replace(/\(entries\)/g, totalEntries));
            }, messageInterval * 6e4);
        }

        $.log.event(user + ' opened a raffle with the keyword !' + key);
    };

    /**
     * @function closeRaffle
     * @returns {closes raffle}
     */
    function closeRaffle(user, key) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.not.opened'));
            return;
        }
        $.inidb.del('raffle', 'command');

        clearInterval(interval);
        clearInterval(timeout);
        clearInterval(timeout1);

        resetRaffle();
        $.unregisterChatCommand(key);

        $.say($.lang.get('rafflesystem.raffle.closed'));
        winner();
        $.log.event(user + ' closed a raffle with the keyword !' + key);
    };

    /**
     * @function winner
     * @returns {winner}
     */
    function winner(force) {
        if (entries.length == 0) {
            $.say($.lang.get('rafflesystem.raffle.close.err'));
            return;
        }

        if (force) {
            $.say($.lang.get('rafflesystem.raffle.repick', $.username.resolve($.randElement(entries))));
            return;
        }

        var Winner = $.randElement(entries);
        $.inidb.set('raffleresults', 'winner', $.username.resolve(Winner));
        $.say($.lang.get('rafflesystem.winner', $.username.resolve(Winner)));

        if (noRepickSame) {
            $.inidb.del('raffleList', Winner);
            $.inidb.decr('raffleresults', 'raffleEntries', 1);
            for (var i in entries) {
                if (entries[i].equalsIgnoreCase(Winner)) {
                    entries.splice(i, 1);
                }
            }
        }

        $.log.event('Winner for raffle with keyword !' + keyword + ' was ' + Winner);
    };

    /**
     * @function enterRaffle
     * @returns {message}
     */
    function enterRaffle(user, cost) {
        if (!raffleStatus) {
            if (msgToggle) {
                $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.raffle.not.opened'));
            }
            return;
        }

        if (followers) {
            if (!$.user.isFollower(user)) {
                if (msgToggle) {
                    $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.not.following'));
                }
                return;
            }
        }

        if (hasKey(entries, user)) {
            if (msgToggle) {
                $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.enter.error.alreadyentered'));
            }
            return;
        }

        if (cost > 0) {
            if (cost > $.getUserPoints(user)) {
                if (msgToggle) {
                    $.say($.whisperPrefix(user) + $.lang.get('rafflesystem.err.points', $.pointNameMultiple));
                }
                return;
            } else {
                $.inidb.decr('points', user, cost);
            }
        }

        totalEntries++;

        entries.push(user);
        raffleListPush(user);
    };

    function raffleListPush(user) {
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            if (!$.inidb.exists('raffleList', user)) {
                $.inidb.set('raffleList', $.username.resolve(user), 'entered');
                $.inidb.incr('raffleresults', 'raffleEntries', 1);
            }
        }
    };

    /**
     * @function resetRaffle
     */
    function resetRaffle() {
        raffleStatus = false;
        followers = false;
        keyword = '';
        cost = 0;
        timer = 0;
        a = '';
        totalEntries = 0;
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath raffle [option] - Displays the usage of the raffle command
         */
        if (command.equalsIgnoreCase('raffle')) {
            if (!$.isModv3(sender, event.getTags())) {
                $.say($.whisperPrefix(sender) + $.modMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.usage'));
                return;
            }

            /**
             * @commandpath raffle open [keyword] [cost] [timer in seconds (use 0 if you dont want a timer)] [-followers] - Opens a raffle. -followers is optional.
             */
            if (action.equalsIgnoreCase('open')) {
                checkArgs(sender, args[1], args[2], args[3], args[4]);
            }

            /**
             * @commandpath raffle close - Closes a raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                closeRaffle(sender, keyword);
            }

            /**
             * @commandpath raffle repick - Picks a new winner for the raffle
             */
            if (action.equalsIgnoreCase('repick')) {
                winner();
            }

            /**
             * @commandpath raffle messagetoggle - Toggles on and off user warning messages
             */
            if (action.equalsIgnoreCase('messagetoggle')) {
                if (msgToggle) {
                    msgToggle = false;
                    $.inidb.set('settings', 'raffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.msg.disabled'));
                    $.log.event(sender + ' disabled the raffle enter message');
                } else {
                    msgToggle = true;
                    $.inidb.set('settings', 'raffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.msg.enabled'));
                    $.log.event(sender + ' enabled the raffle enter message');
                }
            }

            /**
             * @commandpath raffle norepick - Toggles on and off if a user can be repicked more then once
             */
            if (action.equalsIgnoreCase('norepick')) {
                if (noRepickSame) {
                    noRepickSame = false;
                    $.inidb.set('settings', 'noRepickSame', noRepickSame);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.no.repick.true'));
                    $.log.event(sender + ' enabled no repick same for the raffle.');
                } else {
                    noRepickSame = true;
                    $.inidb.set('settings', 'noRepickSame', noRepickSame);
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.no.repick.false'));
                    $.log.event(sender + ' disabled no repick same for the raffle.');
                }
            }

            /**
             * @commandpath raffle autoannouncemessage - Sets the auto annouce message for when a raffle is opened
             */
            if (action.equalsIgnoreCase('autoannouncemessage')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msg.usage'));
                    return;
                }

                raffleMessage = argString.replace(action, '').trim();
                $.inidb.set('settings', 'raffleMessage', raffleMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msg.set', raffleMessage));
                $.log.event(sender + ' changed the auto annouce message to ' + raffleMessage);
            }

            /**
             * @commandpath raffle autoannounceinterval - Sets the auto annouce message interval. Use 0 to disable it
             */
            if (action.equalsIgnoreCase('autoannounceinterval')) {
                if (!parseInt(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msginterval.usage'));
                    return;
                }

                messageInterval = parseInt(args[1]);
                $.inidb.set('settings', 'raffleMessageInterval', messageInterval);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msginterval.set', messageInterval));
                $.log.event(sender + ' changed the auto annouce interval to ' + messageInterval);
            }
        }

        if (command.equalsIgnoreCase('reloadraffle')) {
            if (!$.isAdmin(sender)) {
                return;
            }
            reloadRaffle();
        }

        if (command.equalsIgnoreCase(keyword)) {
            enterRaffle(sender, cost);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/raffleSystem.js')) {
            $.registerChatCommand('./systems/raffleSystem.js', 'raffle', 2);
            $.registerChatCommand('./systems/raffleSystem.js', 'reloadraffle');
        }
    });
})();
