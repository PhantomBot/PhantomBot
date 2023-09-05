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
 * raffleSystem.js made for giveaways on Twitch
 *
 */
(function () {
    let entries = [],
            entered = {},
            keyword = '',
            entryFee = 0,
            timerTime = 0,
            startTime = 0,
            followers = false,
            subscribers = false,
            usePoints = true,
            status = false,
            sendMessages = $.getSetIniDbBoolean('raffleSettings', 'raffleMSGToggle', false),
            openDraw = $.getSetIniDbBoolean('raffleSettings', 'raffleOpenDraw', false),
            whisperWinner = $.getSetIniDbBoolean('raffleSettings', 'raffleWhisperWinner', false),
            noRepickSame = $.getSetIniDbBoolean('raffleSettings', 'noRepickSame', true),
            raffleMessage = $.getSetIniDbString('raffleSettings', 'raffleMessage', 'A raffle is still opened! Type (keyword) to enter. (entries) users have entered so far.'),
            messageInterval = $.getSetIniDbNumber('raffleSettings', 'raffleMessageInterval', 0),
            subscriberBonus = $.getSetIniDbNumber('raffleSettings', 'subscriberBonusRaffle', 1),
            regularBonus = $.getSetIniDbNumber('raffleSettings', 'regularBonusRaffle', 1),
            interval, timeout, followMessage = '',
            saveStateInterval,
            timerMessage = '',
            lastWinners = [],
            hasDrawn = false,
            _entriesLock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function reloadRaffle
     * @info used for the panel.
     */
    function reloadRaffle() {
        sendMessages = $.getIniDbBoolean('raffleSettings', 'raffleMSGToggle');
        openDraw = $.getIniDbBoolean('raffleSettings', 'raffleOpenDraw');
        noRepickSame = $.getIniDbBoolean('raffleSettings', 'noRepickSame');
        whisperWinner = $.getIniDbBoolean('raffleSettings', 'raffleWhisperWinner');
        raffleMessage = $.getIniDbString('raffleSettings', 'raffleMessage');
        messageInterval = $.getIniDbNumber('raffleSettings', 'raffleMessageInterval');
        subscriberBonus = $.getIniDbNumber('raffleSettings', 'subscriberBonusRaffle');
        regularBonus = $.getIniDbNumber('raffleSettings', 'regularBonusRaffle');
    }

    /**
     * @function open
     * @info opens a raffle
     *
     * @param {string} username
     * @param {arguments} arguments
     */
    function open(username, arguments) {
        let args,
                i = 1,
                tempKeyword,
                tempFollowMessage = '',
                tempUsePoints,
                tempFollowers = false,
                tempSubscribers = false,
                tempEntryFee = 0;

        /* Check if there's a raffle already opened */
        if (status) {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.error.opened'));
            return;
        }

        /* Check if the caster wants to use time or points for the raffle */
        arguments = arguments.replace('-usetime ', '');
        if (arguments.match('-usepoints')) {
            arguments = arguments.replace('-usepoints', '');
            tempUsePoints = true;
        } else {
            tempUsePoints = false;
        }

        /* Check if the caster wants the raffle to be for followers only or not */
        if (arguments.match('-followers')) {
            tempFollowers = true;
            tempFollowMessage = ' ' + $.lang.get('rafflesystem.common.following');
        }

        /* Check if the caster wants the raffle to be for susbcribers only or not */
        if (arguments.match('-subscribers')) {
            tempSubscribers = true;
        }

        /* Now split the arguments string up as we could have removed some items. */
        args = arguments.split(' ');

        /* Check the entry fee of points, or the minimum time */
        if (!isNaN(parseInt(args[i])) && tempUsePoints !== null) {
            if (tempUsePoints) {
                tempEntryFee = parseInt(args[i]);
            } else {
                tempEntryFee = (parseInt(args[i]) * 60);
            }

            i++;
        }

        /* Check for the keyword */
        if (args[i] !== undefined) {
            tempKeyword = args[i].toLowerCase();
            i++;

            if (tempKeyword.startsWith('!')) {
                tempKeyword = ('!' + tempKeyword.match(/(!+)(.+)/)[2]);
            }

            /* Ensure that keyword is not already a registered command. */
            if (tempKeyword.startsWith('!') && $.commandExists(tempKeyword.substring(1))) {
                $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.keyword-exists', tempKeyword));
                return;
            }
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.usage'));
            return;
        }

        // All checks passed ... empty our mind and meditate
        clear();
        // Ah snap meditation is over already :( Rebuild vars since we've cleared them
        keyword = tempKeyword;
        followMessage = tempFollowMessage;
        usePoints = tempUsePoints;
        followers = tempFollowers;
        subscribers = tempSubscribers;
        entryFee = tempEntryFee;

        /* Check if the caster wants a auto close timer */
        if (!isNaN(parseInt(args[i])) && parseInt(args[i]) !== 0) {
            timerTime = parseInt(args[i]);
            timeout = setTimeout(function () {
                close();
            }, (timerTime * 6e4));
            timerMessage = $.lang.get('rafflesystem.common.timer', timerTime);
        }

        /* Say in chat that the raffle is now opened. */
        if (!usePoints && entryFee !== 0) {
            $.say($.lang.get('rafflesystem.open.time', keyword, Math.floor(entryFee / 60), followMessage, timerMessage));
        } else if (usePoints && entryFee !== 0) {
            $.say($.lang.get('rafflesystem.open.points', keyword, $.getPointsString(entryFee) + followMessage, timerMessage));
        } else {
            $.say($.lang.get('rafflesystem.open', keyword, followMessage, timerMessage));
        }

        if (parseInt(messageInterval) !== 0) {
            interval = setInterval(function () {
                $.say(raffleMessage.replace('(keyword)', keyword).replace('(entries)', String(Object.keys(entered).length)));
            }, messageInterval * 6e4);
        }

        startTime = $.systemTime();
        saveStateInterval = setInterval(function () {
            saveState();
        }, 5 * 6e4);

        /* Mark the raffle as opened */
        $.raffleCommand = keyword;
        status = true;

        saveState();
    }

    function reopen() {
        if (!$.inidb.FileExists('raffleState')) {
            return;
        }

        entries = $.getIniDbArray('raffleState', 'entries', []);
        entered = $.getIniDbArray('raffleState', 'entered', {});

        let tempKeyword = $.optIniDbString('raffleState', 'keyword'),
                tempEntryFee = $.optIniDbNumber('raffleState', 'entryFee'),
                tempTimerTime = $.optIniDbNumber('raffleState', 'timerTime'),
                tempStartTime = $.optIniDbNumber('raffleState', 'startTime'),
                tempFollowers = $.optIniDbBoolean('raffleState', 'isFollowersOnly'),
                tempSubscribers = $.optIniDbBoolean('raffleState', 'isSubscribersOnly'),
                tempUsePoints = $.optIniDbBoolean('raffleState', 'usePoints');


        if (entries.length === 0 || entered.length === 0 || !tempKeyword.isPresent() || !tempEntryFee.isPresent() || !tempTimerTime.isPresent() || !tempStartTime.isPresent()
            || !tempFollowers.isPresent() || !tempSubscribers.isPresent() || !tempUsePoints.isPresent()) {
            return;
        }

        keyword = tempKeyword.get();
        entryFee = tempEntryFee.get();
        timerTime = tempTimerTime.get();
        startTime = tempStartTime.get();
        followers = tempFollowers.get();
        subscribers = tempSubscribers.get();
        usePoints = tempUsePoints.get();

        status = $.getIniDbBoolean('raffleState', 'isActive', false);
        lastWinners = $.getIniDbArray('raffleresults', 'winner', []);
        hasDrawn = $.getIniDbBoolean('raffleState', 'hasDrawn', false);

        if (status === true) {
            if (keyword.startsWith('!') && $.commandExists(keyword.substring(1))) {
                $.say($.lang.get('rafflesystem.open.keyword-exists', keyword));
                close();
                return;
            }

            if (followers) {
                followMessage = ' ' + $.lang.get('rafflesystem.common.following');
            }

            if (timerTime > 0) {
                let timeleft = timerTime - (($.systemTime() - startTime) / 6e4);
                timeout = setTimeout(function () {
                    close();
                }, timeleft * 6e4);
                timerMessage = $.lang.get('rafflesystem.common.timer', timerTime);
            }

            if (parseInt(messageInterval) !== 0) {
                interval = setInterval(function () {
                    $.say(raffleMessage.replace('(keyword)', keyword).replace('(entries)', String(Object.keys(entered).length)));
                }, messageInterval * 6e4);
            }

            saveStateInterval = setInterval(function () {
                saveState();
            }, 5 * 6e4);

            $.raffleCommand = keyword;
        }
    }

    function saveState() {
        _entriesLock.lock();
        try {
            $.setIniDbArray('raffleState', 'entries', entries);
            $.setIniDbArray('raffleState', 'entered', entered);
        } finally {
            _entriesLock.unlock();
        }

        $.inidb.set('raffleState', 'keyword', keyword);
        $.inidb.set('raffleState', 'entryFee', entryFee);
        $.inidb.set('raffleState', 'timerTime', timerTime);
        $.inidb.set('raffleState', 'startTime', startTime);
        $.inidb.SetBoolean('raffleState', '', 'isActive', status);
        $.inidb.SetBoolean('raffleState', '', 'isFollowersOnly', followers);
        $.inidb.SetBoolean('raffleState', '', 'isSubscribersOnly', subscribers);
        $.inidb.SetBoolean('raffleState', '', 'usePoints', usePoints);
        $.inidb.SetBoolean('raffleState', '', 'hasDrawn', hasDrawn);
        if (lastWinners.length >= 0) {
            $.inidb.set('raffleresults', 'winner', JSON.stringify(lastWinners));
        } else if ($.inidb.HasKey('raffleresults', '', 'winner')) { //No winners but key present - we have to remove it
            $.inidb.del('raffleresults', 'winner');
        }
    }

    /**
     * @function close
     * @info closes the raffle
     *
     * @param {string} username
     */
    function close(username) {
        /* Clear the timer if there is one active. */
        clearTimeout(timeout);
        clearInterval(interval);
        clearInterval(saveStateInterval);

        /* Check if there's a raffle opened */
        if (!status && username !== undefined) {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.close.error.closed'));
            return;
        }

        status = false;

        if (!hasDrawn) {
            $.say($.lang.get('rafflesystem.close.success'));
        }

        saveState();
    }

    /**
     * @function draw
     * @info draws a winner
     * @param {int} amount
     */
    function draw(amount) {
        /* Check if anyone entered the raffle */
        if (entries.length === 0) {
            $.say($.lang.get('rafflesystem.winner.404'));
            return;
        }

        if (!hasDrawn) {
            //First time we draw for this raffle, flush old roaches from the system :O
            lastWinners = [];
        }

        let newWinners = [];

        _entriesLock.lock();
        try {
            if (amount >= entries.Length) {
                newWinners = entries;
            } else {
                let remainingEntries = JSON.parse(JSON.stringify(entries));
                while (newWinners.length < amount && remainingEntries.length > 0) {
                    let candidate = $.randElement(remainingEntries);
                    remainingEntries.splice(remainingEntries.indexOf(candidate), 1);
                    newWinners.push(candidate);
                }
            }
        } finally {
            _entriesLock.unlock();
        }

        lastWinners = lastWinners.concat(newWinners);

        winningMsg(newWinners);

        /* whisper the winner if the toggle is on */
        if (whisperWinner) {
            for (let i = 0; i < newWinners.length; i++) {
                if ($.user.isFollower(newWinners[i].toLowerCase())) {
                    $.say($.whisperPrefix(newWinners[i], true) + $.lang.get('rafflesystem.whisper.winner', $.channelName));
                }
            }
        }

        /* Remove the user from the array if we are not allowed to have multiple repicks. */
        _entriesLock.lock();
        try {
            if (noRepickSame) {
                for (let k in newWinners) {
                    entries.splice(entries.indexOf(newWinners[k]), 1);
                    $.inidb.del('raffleList', newWinners[k]);
                    $.inidb.decr('raffleresults', 'raffleEntries', 1);
                }
            }
        } finally {
            _entriesLock.unlock();
        }

        hasDrawn = true;

        if (!openDraw) {
            close(undefined);
        }

        saveState();
    }

    /**
     * @function winningMsg
     *
     * @info Builds the winning message
     * @param {Array} winners the new winners drawn
     */
    function winningMsg(winners) {

        //Special case !raffle lastWinners
        if (winners.length === 0) {
            $.say($.lang.get('rafflesystem.winner.none'));
        }

        if (winners.length === 1) {
            let followMsg = ($.user.isFollower(winners[0].toLowerCase()) ? $.lang.get('rafflesystem.isfollowing') : $.lang.get('rafflesystem.isnotfollowing'));
            $.say($.lang.get('rafflesystem.winner.single', $.viewer.getByLogin(winners[0]).name(), followMsg));
            return;
        }

        let msg = $.lang.get('rafflesystem.winner.multiple', winners.join(', '));

        if (msg.length >= 500) { // I doubt anybody will draw more winners than we can fit in 2 messages
            let i = msg.substring(0, 500).lastIndexOf(",");
            $.say(msg.substring(0, i));
            $.say(msg.substring(i + 1, msg.length));
        } else {
            $.say(msg);
        }
    }

    /**
     * @function winningMsg
     *
     * @info Awards the winners
     * @param {Number} amount
     * @param {Number} prize
     */
    function awardWinners(amount, prize) {

        for (let i = (lastWinners.length - amount); i < lastWinners.length; i++) {
            $.inidb.incr('points', lastWinners[i], prize);
        }

        if (amount > 1) {
            $.say($.lang.get('rafflesystem.winner.multiple.award', $.getPointsString(prize)));
        } else {
            $.say($.lang.get('rafflesystem.winner.single.award', $.getPointsString(prize)));
        }
    }

    /**
     * @function message
     * @info messages that user if the raffle toggles are on
     *
     * @param {string} username
     * @param {string} msg
     */
    function message(username, msg) {
        if (sendMessages) {
            $.say($.whisperPrefix(username) + msg);
        }
    }

    /**
     * @function enter
     * @info enters the user into the raffle
     *
     * @param {string} username
     * @param {ArrayList} tags
     */
    function enter(username, tags) {
        username = $.jsString(username);
        /* Check if the user already entered the raffle */
        if (entered[username] !== undefined) {
            message(username, $.lang.get('rafflesystem.enter.404'));
            return;
        }

        /* Check if the user is a subscriber */
        if (subscribers && !$.checkUserPermission(username, tags, $.PERMISSION.Sub)) {
            message(username, $.lang.get('rafflesystem.enter.subscriber'));
            return;
        }

        /* Check if the user is following the channel. */
        if (followers && !$.user.isFollower(username)) {
            message(username, $.lang.get('rafflesystem.enter.following'));
            return;
        }

        /* Check the entry fee */
        if (entryFee > 0 && usePoints !== null) {
            /* If we are using points */
            if (usePoints) {
                if (entryFee > $.getUserPoints(username)) {
                    message(username, $.lang.get('rafflesystem.enter.points', $.pointNameMultiple));
                    return;
                }

                $.inidb.decr('points', username, entryFee);
            } else if (entryFee > $.getUserTime(username)) {
                message(username, $.lang.get('rafflesystem.enter.time'));
                return;
            }
        }

        /* Push the user into the array */
        let entryAmount = 1;
        if (subscriberBonus > 0 && $.checkUserPermission(username, tags, $.PERMISSION.Sub)) {
            entryAmount += subscriberBonus;
        } else if (regularBonus > 0 && $.checkUserPermission(username, tags, $.PERMISSION.Regular)) {
            entryAmount += regularBonus;
        }

        _entriesLock.lock();
        try {
            for (let i = 0; i < entryAmount; i++) {
                entries.push(username);
            }

            entered[username] = true;
        } finally {
            _entriesLock.unlock();
        }

        /* Push the panel stats */
        $.inidb.set('raffleList', username, true);
        $.inidb.set('raffleresults', 'raffleEntries', Object.keys(entered).length);
    }

    /**
     * @function clear
     * @info resets the raffle information
     */
    function clear() {
        /* Clear the timer if there is one active. */
        clearTimeout(timeout);
        clearInterval(interval);
        clearInterval(saveStateInterval);
        keyword = '';
        followMessage = '';
        timerMessage = '';
        usePoints = false;
        followers = false;
        subscribers = false;
        status = false;
        entryFee = 0;
        timerTime = 0;
        startTime = 0;
        entered = {};
        entries = [];
        $.raffleCommand = null;
        hasDrawn = false;
        $.inidb.RemoveFile('raffleList');
        $.inidb.set('raffleresults', 'raffleEntries', 0);
        saveState();
    }

    /**
     * @event ircChannelMessage
     * @param {object} event
     */
    $.bind('ircChannelMessage', function (event) {
        if (status === true && $.equalsIgnoreCase(event.getMessage(), keyword)) {
            enter(event.getSender().toLowerCase(), event.getTags());
        }
    });

    /**
     * @event command
     * @info handles the command event
     * @param {object} event
     */
    $.bind('command', function (event) {
        let sender = event.getSender(),
                command = event.getCommand(),
                arguments = event.getArguments(),
                args = event.getArgs(),
                action = args[0],
                subAction = args[1];

        if ($.equalsIgnoreCase(command, 'raffle')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.usage'));
                return;
            }

            /**
             * @commandpath raffle open [entry fee] [keyword] [close timer] [-usepoints / -usetime / -followers] - Opens a custom raffle.
             */
            if ($.equalsIgnoreCase(action, 'open')) {
                open(sender, arguments);
                $.log.event('A raffle was opened by: ' + sender + '. Arguments (' + arguments + ')');
                return;
            }

            /**
             * @commandpath raffle close - Closes the current raffle.
             */
            if ($.equalsIgnoreCase(action, 'close')) {
                close(sender);
                $.log.event('A raffle was closed by: ' + sender + '.');
                return;
            }

            /**
             * @commandpath raffle draw [amount (default = 1)] [prize points (default = 0)] - Picks winner(s) for the raffle and optionally awards them with points, and closes the raffle if it is still open
             */
            if ($.equalsIgnoreCase(action, 'draw')) {
                let amount = 1;
                if (args[1] !== undefined && (isNaN(parseInt(args[1])) || parseInt(args[1] === 0))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.err.draw.usage'));
                    return;
                }

                if (args[1] !== undefined) {
                    amount = parseInt(args[1]);
                }

                draw(amount);

                if (args[2] !== undefined && !isNaN(parseInt(args[2])) && parseInt(args[2]) !== 0) {
                    awardWinners(amount, parseInt(args[2]));
                }

                return;
            }

            /**
             * @commandpath raffle lastWinners - Prints the last raffle winners
             */
            if ($.equalsIgnoreCase(action, 'lastWinners')) {
                winningMsg(lastWinners);
                return;
            }

            /**
             * @commandpath raffle reset - Resets the raffle.
             */
            if ($.equalsIgnoreCase(action, 'reset')) {
                clear();
                if (sender !== $.botName.toLowerCase()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.reset'));
                }
                return;
            }

            /**
             * @commandpath raffle results - Give you the current raffle information if there is one active.
             */
            if ($.equalsIgnoreCase(action, 'results')) {
                if (status) {
                    $.say($.lang.get('rafflesystem.results', keyword + (usePoints ? $.lang.get('rafflesystem.fee', $.getPointsString(entryFee)) : ''), Object.keys(entered).length));
                }
                return;
            }

            /**
             * @commandpath raffle subscriberbonus [0-10] - Sets the bonus luck for subscribers.
             */
            if ($.equalsIgnoreCase(action, 'subscriberbonus')) {
                if (subAction === undefined || isNaN(parseInt(subAction)) || parseInt(subAction) < 0 || parseInt(subAction) > 10) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.subbonus.usage'));
                    return;
                }

                subscriberBonus = parseInt(subAction);
                $.inidb.set('raffleSettings', 'subscriberBonusRaffle', subscriberBonus);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.subbonus.set', subscriberBonus));
                return;
            }

            /**
             * @commandpath raffle regularbonus [0-10] - Sets the bonus luck for regulars.
             */
            if ($.equalsIgnoreCase(action, 'regularbonus')) {
                if (subAction === undefined || isNaN(parseInt(subAction)) || parseInt(subAction) < 0 || parseInt(subAction) > 10) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.regbonus.usage'));
                    return;
                }

                regularBonus = parseInt(subAction);
                $.inidb.set('raffleSettings', 'regularBonusRaffle', regularBonus);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.regbonus.set', regularBonus));
                return;
            }

            /**
             * @commandpath raffle whisperwinner - Toggles if the raffle winner gets a whisper from the bot saying he won.
             */
            if ($.equalsIgnoreCase(action, 'whisperwinner')) {
                whisperWinner = !whisperWinner;
                $.inidb.set('raffleSettings', 'raffleWhisperWinner', whisperWinner);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.whisper.winner.toggle', (whisperWinner ? '' : $.lang.get('rafflesystem.common.message'))));
            }

            /**
             * @commandpath raffle toggleopendraw - Toggles whether the raffle closes automatically when drawing a winner
             */
            if ($.equalsIgnoreCase(action, 'toggleopendraw')) {
                openDraw = !openDraw;
                $.setIniDbBoolean('raffleSettings', 'raffleOpenDraw', openDraw);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.opendraw.' + (openDraw ? 'enable' : 'disable')));
                return;
            }

            /**
             * @commandpath raffle togglewarningmessages - Toggles the raffle warning messages when entering.
             */
            if ($.equalsIgnoreCase(action, 'togglewarningmessages')) {
                sendMessages = !sendMessages;
                $.inidb.set('raffleSettings', 'raffleMSGToggle', sendMessages);
                $.say($.whisperPrefix(sender) + 'Raffle warning messages have been ' + (sendMessages ? $.lang.get('common.enabled') : $.lang.get('common.disabled')) + '.');
                return;
            }

            /**
             * @commandpath raffle togglerepicks - Toggles if the same winner can be repicked more than one.
             */
            if ($.equalsIgnoreCase(action, 'togglerepicks')) {
                noRepickSame = !noRepickSame;
                $.inidb.set('raffleSettings', 'noRepickSame', noRepickSame);
                $.say($.whisperPrefix(sender) + (noRepickSame ? $.lang.get('rafflesystem.raffle.repick.toggle1') : $.lang.get('rafflesystem.raffle.repick.toggle2')));
                return;
            }

            /**
             * @commandpath raffle message [message] - Sets the raffle auto annouce messages saying that raffle is still active.
             */
            if ($.equalsIgnoreCase(action, 'message')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.message.usage'));
                    return;
                }

                raffleMessage = arguments.substring($.strlen(action) + 1);
                $.inidb.set('raffleSettings', 'raffleMessage', raffleMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.message.set', raffleMessage));
                return;
            }

            /**
             * @commandpath raffle messagetimer [minutes] - Sets the raffle auto annouce messages interval. 0 is disabled.
             */
            if ($.equalsIgnoreCase(action, 'messagetimer')) {
                if (subAction === undefined || isNaN(parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.timer.usage'));
                    return;
                }

                messageInterval = parseInt(subAction);
                $.inidb.set('raffleSettings', 'raffleMessageInterval', messageInterval);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.timer.set', messageInterval));
                return;
            }
        }
    });

    /**
     * @event initReady
     * @info event sent to register commands
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/raffleSystem.js', 'raffle', $.PERMISSION.Mod);

        $.registerChatSubcommand('raffle', 'open', $.PERMISSION.Mod);
        $.registerChatSubcommand('raffle', 'close', $.PERMISSION.Mod);
        $.registerChatSubcommand('raffle', 'draw', $.PERMISSION.Mod);
        $.registerChatSubcommand('raffle', 'reset', $.PERMISSION.Mod);
        $.registerChatSubcommand('raffle', 'results', $.PERMISSION.Viewer);
        $.registerChatSubcommand('raffle', 'lastWinners', $.PERMISSION.Mod);
        $.registerChatSubcommand('raffle', 'subscriberbonus', $.PERMISSION.Admin);
        $.registerChatSubcommand('raffle', 'regularbonus', $.PERMISSION.Admin);
        $.registerChatSubcommand('raffle', 'toggleopendraw', $.PERMISSION.Admin);
        $.registerChatSubcommand('raffle', 'togglewarningmessages', $.PERMISSION.Admin);
        $.registerChatSubcommand('raffle', 'togglerepicks', $.PERMISSION.Admin);
        $.registerChatSubcommand('raffle', 'message', $.PERMISSION.Admin);
        $.registerChatSubcommand('raffle', 'messagetimer', $.PERMISSION.Admin);

        reopen();
    });

    /**
     * @event Shutdown
     */
    $.bind('Shutdown', function () {
        saveState();
    });

    $.reloadRaffle = reloadRaffle;
})();
