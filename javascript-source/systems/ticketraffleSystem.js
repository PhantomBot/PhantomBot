/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

(function() {
    var cost = 0,
        entries = [],
        subTMulti = 1,
        regTMulti = 1,
        maxEntries = 0,
        followers = false,
        raffleStatus = false,
        msgToggle = $.getSetIniDbBoolean('traffleSettings', 'traffleMSGToggle', false),
        raffleMessage = $.getSetIniDbString('traffleSettings', 'traffleMessage', 'A raffle is still opened! Type !tickets (amount) to enter. (entries) users have entered so far.'),
        messageInterval = $.getSetIniDbNumber('traffleSettings', 'traffleMessageInterval', 0),
        limiter = $.getSetIniDbNumber('traffleSettings', 'traffleLimiter', false),
        totalEntries = 0,
        totalTickets = 0,
        a = '',
        saveStateInterval,
        interval,
        uniqueEntries = [],
        lastWinners = [],
        hasDrawn = false;

    var POS = {
        times: 0,
        bonus: 1
    };

    function reloadTRaffle() {
        msgToggle = $.inidb.GetBoolean('traffleSettings', '', 'traffleMSGToggle');
        raffleMessage = $.getSetIniDbString('traffleSettings', 'traffleMessage');
        messageInterval = $.getSetIniDbNumber('traffleSettings', 'traffleMessageInterval');
        limiter = $.inidb.GetBoolean('traffleSettings', '', 'traffleLimiter');

    }

    function checkArgs(user, max, regMulti, subMulti, price, followersOnly) {
        if (raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.opened'));
            return;
        }

        if (!max) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.missing.syntax'));
            return;
        }

        if (isNaN(parseInt(max)) || isNaN(parseInt(price))) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.usage'));
            return;
        }

        if (max) {
            maxEntries = parseInt(max);
        }

        if (price) {
            cost = parseInt(price);
        }

        if (regMulti) {
            regTMulti = (parseInt(regMulti) < 1 ? 1 : parseInt(regMulti));
        }

        if (subMulti) {
            subTMulti = (parseInt(subMulti) < 1 ? 1 : parseInt(subMulti));
        }

        if (followersOnly && followersOnly.equalsIgnoreCase('-followers')) {
            followers = true;
            a = $.lang.get('ticketrafflesystem.msg.need.to.be.following');
        }

        openRaffle(maxEntries, cost, a, user);
    }

    function openRaffle(maxEntries, cost, a, user) {
        $.say($.lang.get('ticketrafflesystem.raffle.opened', maxEntries, $.getPointsString(cost), a));
        lastWinners = [];
        raffleStatus = true;
        hasDrawn = false;
        $.inidb.RemoveFile('ticketsList');
        $.inidb.RemoveFile('entered');
        $.inidb.set('traffleresults', 'ticketRaffleEntries', 0);
        entries = "";
        entries = [];

        if (messageInterval !== 0) {
            interval = setInterval(function () {
                $.say(raffleMessage.replace('(entries)', String(totalEntries))); //can't use regex here. why? who knows.
            }, messageInterval * 6e4);
        }

        saveStateInterval = setInterval(function () {
            saveState();
        }, 5 * 6e4);

        $.log.event(user + ' opened a ticket raffle.');
        $.inidb.SetBoolean('traffleState', '', 'isActive', raffleStatus);
        saveState();
    }

    function reopen() {
        if (!$.inidb.FileExists('traffleState') || !$.inidb.HasKey('traffleState', '', 'cost') || !$.inidb.HasKey('traffleState', '', 'entries')
                || !$.inidb.HasKey('traffleState', '', 'subTMulti') || !$.inidb.HasKey('traffleState', '', 'regTMulti') || !$.inidb.HasKey('traffleState', '', 'maxEntries')
                || !$.inidb.HasKey('traffleState', '', 'followers') || !$.inidb.HasKey('traffleState', '', 'isActive') || !$.inidb.HasKey('traffleState', '', 'totalEntries') || !$.inidb.HasKey('traffleState', '', 'totalTickets')
                || !$.inidb.HasKey('traffleState', '', 'uniqueEntries') || !$.inidb.HasKey('traffleState', '', 'hasDrawn')) {
            return;
        }

        cost = parseInt($.inidb.get('traffleState', 'cost'));
        entries = JSON.parse($.inidb.get('traffleState', 'entries'));
        uniqueEntries = JSON.parse($.inidb.get('traffleState', 'uniqueEntries'));
        subTMulti = parseInt($.inidb.get('traffleState', 'subTMulti'));
        regTMulti = parseInt($.inidb.get('traffleState', 'regTMulti'));
        maxEntries = parseInt($.inidb.get('traffleState', 'maxEntries'));
        totalEntries = parseInt($.inidb.get('traffleState', 'totalEntries'));
        totalTickets = parseInt($.inidb.get('traffleState', 'totalTickets'));
        hasDrawn = $.inidb.GetBoolean('traffleState', '', 'hasDrawn');
        followers = $.inidb.GetBoolean('traffleState', '', 'followers');
        raffleStatus = $.inidb.GetBoolean('traffleState', '', 'isActive');

        if (raffleStatus === true) {
            if (followers) {
                a = $.lang.get('ticketrafflesystem.msg.need.to.be.following');
            }

            if (messageInterval !== 0) {
                interval = setInterval(function () {
                    $.say(raffleMessage.replace('(entries)', String(totalEntries))); //can't use regex here. why? who knows.
                }, messageInterval * 6e4);
            }

            saveStateInterval = setInterval(function () {
                saveState();
            }, 5 * 6e4);
        }
    }

    function saveState() {
        $.inidb.set('traffleState', 'cost', cost);
        $.inidb.set('traffleState', 'entries', JSON.stringify(entries));
        $.inidb.set('traffleState', 'subTMulti', subTMulti);
        $.inidb.set('traffleState', 'regTMulti', regTMulti);
        $.inidb.set('traffleState', 'maxEntries', maxEntries);
        $.inidb.SetBoolean('traffleState', '', 'isActive', raffleStatus);
        $.inidb.SetBoolean('traffleState', '', 'followers', followers);
        $.inidb.set('traffleState', 'totalEntries', totalEntries);
        $.inidb.set('traffleState', 'totalTickets', totalTickets);
        $.inidb.set('traffleState', 'uniqueEntries', JSON.stringify(uniqueEntries));
        $.inidb.SetBoolean('traffleState', '', 'hasDrawn', hasDrawn);
    }

    function closeRaffle() {
        raffleStatus = false;
        clearInterval(interval);
        clearInterval(saveStateInterval);
        saveState();
    }

    function clear() {
        clearInterval(interval);
        clearInterval(saveStateInterval);

        raffleStatus = false;
        followers = false;
        hasDrawn = false;
        maxEntries = 0;
        cost = 0;
        a = '';
        totalEntries = 0;
        totalTickets = 0;
        regTMulti = 1;
        subTMulti = 1;
        saveState();
    }

    function winner(amount) {
        var entriesLen = entries.length;
        if (entriesLen === 0) {
            $.say($.lang.get('ticketrafflesystem.raffle.close.err'));
            return;
        }

        hasDrawn = true;
        $.inidb.SetBoolean('traffleState', '', 'hasDrawn', hasDrawn);

        if (raffleStatus) {
            closeRaffle(); //Close the raffle if it's open. Why draw a winner when new users can still enter?
            $.say($.lang.get('ticketrafflesystem.raffle.closed.and.draw'));
        }

        /*
         * Thanks https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
         * Faster than calling $.randElement() over and over
         */
        lastWinners = [];

        var taken = [];
        while (amount--) {
            var rnd = Math.floor(Math.random() * entriesLen);
            lastWinners[amount] = entries[taken.includes(rnd) ? taken[rnd] : rnd];
            taken[rnd] = taken.includes(--entriesLen) ? taken[entriesLen] : entriesLen;
        }

        winningMsg();

        $.inidb.set('traffleresults', 'winner', JSON.stringify(lastWinners));
        $.log.event('Winner of the ticket raffle was ' + lastWinners.join(', '));
    }

    function winningMsg() {
        if (lastWinners.length === 1) {
            var followMsg = ($.user.isFollower(lastWinners[0].toLowerCase()) ? $.lang.get('rafflesystem.isfollowing') : $.lang.get('rafflesystem.isnotfollowing'));
            $.say($.lang.get('ticketrafflesystem.winner.single', $.username.resolve(lastWinners[0]), followMsg));
            return;
        }

        var msg = $.lang.get('ticketrafflesystem.winner.multiple', lastWinners.join(', '));

        if (msg.length >= 500) { // I doubt anybody will draw more winners than we can fit in 2 messages
            var i = msg.substring(0, 500).lastIndexOf(",");
            $.say(msg.substring(0, i));
            $.say(msg.substring(i + 1, msg.length));
        } else {
            $.say(msg);
        }
    }

    function enterRaffle(user, event, arg) {
        if (!raffleStatus) {
            if (msgToggle) {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.not.opened'));
            }
            return;
        }

        var baseAmount,
            tmpMax = maxEntries,
            multiplier = 1;

        if (limiter) {
            multiplier = calcBonus(user, event, 1);
            tmpMax = maxEntries / multiplier;
        }

        if (isNaN(parseInt(arg)) && ($.equalsIgnoreCase(arg, "max") || $.equalsIgnoreCase(arg, "all"))) {
            var possibleBuys = (cost > 0 ? Math.floor($.getUserPoints(user) / cost) : tmpMax);
            baseAmount = tmpMax - getTickets(user); //Maximum possible entries that can be bought up to the maxEntries limit
            baseAmount = (baseAmount > possibleBuys ? possibleBuys : baseAmount);
        } else if (!isNaN(parseInt(arg)) && parseInt(arg) % 1 === 0) {
            baseAmount = parseInt(arg);
        } else {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.ticket.usage', getTickets(user)));
            return;
        }

        var bonus = calcBonus(user, event, baseAmount),
            amount = baseAmount;

        if (limiter) {
            amount = Math.round(amount + bonus); //Math.Round because we can be limited by the bit length i.e 1/3 = 0.333333333.....
        }


        if (amount > maxEntries || baseAmount === 0 || baseAmount < 0) {
            if (msgToggle) {
                if (limiter) {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.only.buy.amount.limiter', Math.ceil(tmpMax), multiplier * 100));
                } else {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.only.buy.amount', maxEntries));
                }
            }
            return;
        }

        if (getTickets(user) + amount > maxEntries) {
            if (msgToggle) {
                if (limiter) {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.limit.hit.limiter', Math.ceil(tmpMax), multiplier * 100, getTickets(user)));
                } else {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.limit.hit', maxEntries, getTickets(user)));
                }
            }
            return;
        }

        if (cost > 0) {
            if ((baseAmount * cost) > $.getUserPoints(user)) {
                if (msgToggle) {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.points', $.pointNameMultiple));
                }
                return;
            }
        }

        totalTickets += baseAmount + bonus;

        if (cost !== 0) {
            $.inidb.decr('points', user, (baseAmount * cost));
        }

        if (!$.inidb.exists('entered', user.toLowerCase())) {
            totalEntries++;
            $.inidb.SetBoolean('entered', '', user.toLowerCase(), true);
            $.inidb.incr('traffleresults', 'ticketRaffleEntries', 1);
        }

        if (!(uniqueEntries.includes(user))) {
            uniqueEntries.push(user);
        }

        incr(user.toLowerCase(), baseAmount, bonus);

        if (msgToggle) {
            if (userGetsBonus(user, event)) {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.entered.bonus', baseAmount, bonus, getTickets(user), getBonusTickets(user)));
            } else {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.entered', baseAmount, getTickets(user)));
            }
        }
    }

    function incr(user, times, bonus) {
        var total = times * bonus;
        for (var i = 0; i < total; i++) {
            entries.push(user);
        }

        if ($.inidb.exists('ticketsList', user.toLowerCase())) {
            var current = JSON.parse($.inidb.get('ticketsList', user.toLowerCase()));
            times += current[POS.times];
            bonus += current[POS.bonus];
        }

        $.inidb.set('ticketsList', user.toLowerCase(), JSON.stringify([times, bonus]));

    }

    function getTickets(user) {
        if (!$.inidb.exists('ticketsList', user.toLowerCase())) {
            return 0;
        }
        return JSON.parse($.inidb.get('ticketsList', user.toLowerCase()))[POS.times];
    }

    function getBonusTickets(user) {
        if (!$.inidb.exists('ticketsList', user.toLowerCase())) {
            return 0;
        }
        return JSON.parse($.inidb.get('ticketsList', user.toLowerCase()))[POS.bonus];
    }

    function userGetsBonus(user, event) {
        return ($.isSub(user, event.getTags()) || $.isRegular(user));
    }

    function calcBonus(user, event, tickets) {
        var tags = undefined;
        if (event !== undefined) {
            tags = event.getTags();
        }

        var bonus = tickets;

        if ($.isSub(user, tags)) {
            bonus = tickets * subTMulti;
        } else if ($.isRegular(user)) {
            bonus = tickets * regTMulti;
        }

        return Math.round(bonus - tickets);
    }

    function awardWinners(prize) {

        for (var i = 0; i < lastWinners.length; i++) {
            $.inidb.incr('points', lastWinners[i], prize);
        }

        if (lastWinners.length > 1) {
            $.say($.lang.get('ticketrafflesystem.winner.multiple.award', $.getPointsString(prize)));
        } else {
            $.say($.lang.get('ticketrafflesystem.winner.single.award', $.getPointsString(prize)));
        }
    }

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
         * @commandpath traffle [option] - Displays usage for the command
         */
        if (command.equalsIgnoreCase('traffle')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.usage'));
                return;
            }

            /**
             * @commandpath traffle open [max entries] [regular ticket multiplier (default = 1)] [subscriber ticket multiplier (default = 1)] [cost] [-followers] - Opens a ticket raffle. -followers is optional.
             */
            if (action.equalsIgnoreCase('open')) {
                if (args[4] === undefined) {
                    checkArgs(sender, args[1], args[2], 1, 1, args[3]);
                } else {
                    checkArgs(sender, args[1], args[2], args[3], args[4], args[5]);
                }
                return;
            }

            /**
             * @commandpath traffle close - Closes a ticket raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                if (!raffleStatus) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.err.raffle.not.opened'));
                    return;
                }

                closeRaffle();
                $.say($.lang.get('ticketrafflesystem.raffle.closed'));
                $.log.event(sender + ' closed a ticket raffle.');
                return;
            }

            /**
             * @commandpath traffle draw [amount (default = 1)] [loyalty points prize (default = 0)] - Picks winner(s) for the ticket raffle and optionally awards them with points 
             */
            if (action.equalsIgnoreCase('draw')) {

                var amount = 1;
                if (args[1] !== undefined && (isNaN(parseInt(args[1])) || parseInt(args[1] === 0))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.draw.usage'));
                    return;
                }

                if (hasDrawn) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.err.already.drawn'));
                    return;
                }

                if (args[1] !== undefined) {
                    amount = parseInt(args[1]);
                }

                if (amount > uniqueEntries.length) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.err.not.enoughUsers', amount));
                    return;
                }

                winner(amount);

                if (args[2] !== undefined && !isNaN(parseInt(args[2])) && parseInt(args[2]) !== 0) {
                    awardWinners(parseInt(args[2]));
                }

                return;
            }

            /**
             * @commandpath traffle reset - Resets the raffle.
             */
            if (action.equalsIgnoreCase('reset')) {
                clear();
                $.inidb.RemoveFile('ticketsList');
                $.inidb.RemoveFile('entered');
                $.inidb.set('traffleresults', 'ticketRaffleEntries', 0);
                entries = [];
                saveState();
                if (!sender.equalsIgnoreCase($.botName)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.reset'));
                }
                return;
            }

            /**
             * @commandpath traffle messagetoggle - Toggles on and off a message when entering a ticket raffle
             */
            if (action.equalsIgnoreCase('messagetoggle')) {
                if (msgToggle) {
                    msgToggle = false;
                    $.inidb.set('traffleSettings', 'traffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.msg.disabled'));
                } else {
                    msgToggle = true;
                    $.inidb.set('traffleSettings', 'traffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.msg.enabled'));
                }
                return;
            }

            /**
             * @commandpath traffle limitertoggle - Toggles the ticket limiter between only bought tickets mode and bought + bonus tickets mode
             */
            if (action.equalsIgnoreCase('limitertoggle')) {
                if (raffleStatus) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.settings.err.open'));
                    return;
                }

                limiter = !limiter;
                $.inidb.SetBoolean('traffleSettings', '', 'traffleLimiter', limiter);
                if (limiter) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.limiter.enabled'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.limiter.disabled'));
                }
                return;
            }

            /**
             * @commandpath traffle autoannouncemessage [message] - Sets the auto announce message for when a raffle is opened
             */
            if (action.equalsIgnoreCase('autoannouncemessage')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msg.usage'));
                    return;
                }

                raffleMessage = argString.replace(action, '').trim();
                $.inidb.set('traffleSettings', 'traffleMessage', raffleMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.auto.msg.set', raffleMessage));
                $.log.event(sender + ' changed the auto announce message to ' + raffleMessage);
                return;
            }

            /**
             * @commandpath traffle autoannounceinterval [minutes] - Sets the auto announce message interval. Use 0 to disable it
             */
            if (action.equalsIgnoreCase('autoannounceinterval')) {
                if (!parseInt(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msginterval.usage'));
                    return;
                }

                messageInterval = parseInt(args[1]);
                $.inidb.set('traffleSettings', 'traffleMessageInterval', messageInterval);
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.auto.msginterval.set', messageInterval));
                $.log.event(sender + ' changed the auto announce interval to ' + messageInterval);
                return;
            }
        }

        /**
         * @commandpath tickets [amount / max] - Buy tickets to enter the ticket raffle.
         */
        if (command.equalsIgnoreCase('tickets') || command.equalsIgnoreCase('ticket')) {
            if (!action) {
                if (msgToggle && raffleStatus) {
                    if (userGetsBonus(sender, event)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.ticket.usage.bonus', getTickets(sender),
                            getBonusTickets(sender)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.ticket.usage', getTickets(sender)));
                    }
                }
                return;
            }

            enterRaffle(sender, event, action);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/ticketraffleSystem.js', 'traffle', $.PERMISSION.Mod);
        $.registerChatCommand('./systems/ticketraffleSystem.js', 'tickets', $.PERMISSION.Viewer);
        $.registerChatCommand('./systems/ticketraffleSystem.js', 'ticket', $.PERMISSION.Viewer);
        $.registerChatSubcommand('traffle', 'open', $.PERMISSION.Mod);
        $.registerChatSubcommand('traffle', 'close', $.PERMISSION.Mod);
        $.registerChatSubcommand('traffle', 'draw', $.PERMISSION.Mod);
        $.registerChatSubcommand('traffle', 'reset', $.PERMISSION.Mod);
        $.registerChatSubcommand('traffle', 'autoannounceinterval', $.PERMISSION.Admin);
        $.registerChatSubcommand('traffle', 'autoannouncemessage', $.PERMISSION.Admin);
        $.registerChatSubcommand('traffle', 'messagetoggle', $.PERMISSION.Admin);
        $.registerChatSubcommand('traffle', 'limitertoggle', $.PERMISSION.Admin);

        // Since we have to calculate the users bonus tickets, the update has to happen in the script itself
        if ($.inidb.FileExists('ticketsList')) {
            var users = $.inidb.GetKeyList('ticketsList', ''),
                first = $.inidb.get('ticketsList', users[0]);

            if (!isNaN(first)) { // NaN = JSON present instead of a basic ticket count (old value) - do not update the list
                for (var i = 0; i < users.length; i++) {
                    var times = $.getIniDbNumber('ticketsList', users[i]),
                        bonus = calcBonus(users[i], undefined, times);

                    $.inidb.set('ticketsList', users[i], JSON.stringify([times, bonus]));
                }
            }
        }

        reopen();
    });

    /**
     * @event Shutdown
     */
    $.bind('Shutdown', function () {
        saveState();
    });

    $.reloadTRaffle = reloadTRaffle;
})();
