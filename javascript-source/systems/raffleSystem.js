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

/**
 * raffleSystem.js made for giveaways on Twitch
 *
 */
(function() {
    var entries = [],
        entered = [],
        keyword = '',
        entryFee = 0,
        timerTime = 0,
        startTime = 0,
        followers = false,
        subscribers = false,
        usePoints = true,
        status = false,
        sendMessages = $.getSetIniDbBoolean('raffleSettings', 'raffleMSGToggle', false),
        whisperWinner = $.getSetIniDbBoolean('raffleSettings', 'raffleWhisperWinner', false),
        allowRepick = $.getSetIniDbBoolean('raffleSettings', 'noRepickSame', true),
        raffleMessage = $.getSetIniDbString('raffleSettings', 'raffleMessage', 'A raffle is still opened! Type (keyword) to enter. (entries) users have entered so far.'),
        messageInterval = $.getSetIniDbNumber('raffleSettings', 'raffleMessageInterval', 0),
        subscriberBonus = $.getSetIniDbNumber('raffleSettings', 'subscriberBonusRaffle', 1),
        regularBonus = $.getSetIniDbNumber('raffleSettings', 'regularBonusRaffle', 1),
        interval, timeout, followMessage = '',
        saveStateInterval,
        timerMessage = '',
        lastWinners,
        hasDrawn;

    /**
     * @function reloadRaffle
     * @info used for the panel.
     */
    function reloadRaffle() {
        sendMessages = $.getIniDbBoolean('raffleSettings', 'raffleMSGToggle');
        allowRepick = $.getIniDbBoolean('raffleSettings', 'noRepickSame');
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
        var args,
            i = 1,
            tempKeyword,
            tempFollowMessage = '',
            tempUsePoints,
            tempFollowers,
            tempSubscribers,
            tempEntryFee;

        /* Check if there's a raffle already opened */
        if (status) {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.error.opened'));
            return;
        }

        /* Check if the caster wants to use time or points for the raffle */
        if (arguments.match('-usetime')) {
            tempUsePoints = false;
            arguments = arguments.replace('-usetime ', '');
        } else if (arguments.match('-usepoints')) {
            arguments = arguments.replace('-usepoints', '');
            tempUsePoints = true;
        } else {
            tempUsePoints = null;
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

            if (keyword.startsWith('!')) {
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
            timeout = setTimeout(function() {
                close();
            }, (timerTime * 6e4));
            timerMessage = $.lang.get('rafflesystem.common.timer', timerTime);
        }
        

        /* Say in chat that the raffle is now opened. */
        if (!usePoints && usePoints !== null) {
            $.say($.lang.get('rafflesystem.open.time', keyword, Math.floor(entryFee / 60), followMessage, timerMessage));
        } else if (usePoints && entryFee !== 0) {
            $.say($.lang.get('rafflesystem.open.points', keyword, $.getPointsString(entryFee) + followMessage, timerMessage));
        } else {
            $.say($.lang.get('rafflesystem.open', keyword, followMessage, timerMessage));
        }

        if (parseInt(messageInterval) !== 0) {
            interval = setInterval(function() {
                $.say(raffleMessage.replace('(keyword)', keyword).replace('(entries)', String(Object.keys(entered).length)));
            }, messageInterval * 6e4);
        }

        startTime = $.systemTime();
        saveStateInterval = setInterval(function() {
           saveState();
        }, 5 * 6e4);

        /* Mark the raffle as opened */
        $.raffleCommand = keyword;
        // Mark the raffle as on for the panel.
        $.inidb.set('raffleSettings', 'isActive', 'true');
        status = true;

        saveState();
    }

    function reopen() {
        if (!$.inidb.FileExists('raffleState') || !$.inidb.HasKey('raffleState', '', 'entries') || !$.inidb.HasKey('raffleState', '', 'entered')
                 || !$.inidb.HasKey('raffleState', '', 'keyword') || !$.inidb.HasKey('raffleState', '', 'entryFee') || !$.inidb.HasKey('raffleState', '', 'timerTime')
                  || !$.inidb.HasKey('raffleState', '', 'startTime') || !$.inidb.HasKey('raffleState', '', 'bools')) {
            return;
        }

        entries = JSON.parse($.inidb.get('raffleState', 'entries'));
        entered = JSON.parse($.inidb.get('raffleState', 'entered'));
        keyword = $.inidb.get('raffleState', 'keyword');
        entryFee = parseInt($.inidb.get('raffleState', 'entryFee'));
        timerTime = parseInt($.inidb.get('raffleState', 'timerTime'));
        startTime = parseInt($.inidb.get('raffleState', 'startTime'));
        var bools = JSON.parse($.inidb.get('raffleState', 'bools'));
        followers = bools[0];
        subscribers = bools[1];
        usePoints = bools[2];
        status = bools[3];
        lastWinners = [];
        if ($.inidb.HasKey('raffleresults', '', 'winner')) { //Consider raffles saved before this change
            var temp = $.inidb.get('raffleresults', 'winner');
            if (temp !== undefined && !temp.equalsIgnoreCase('undefined')) {
                lastWinners = JSON.parse(temp); //lastWinners found
            }
        }

        hasDrawn = bools.length !== 5 ? false : bools[4]; //Consider raffles saved before this change

        if (status === true) {
            $.inidb.set('raffleSettings', 'isActive', 'true');
            if (keyword.startsWith('!') && $.commandExists(keyword.substring(1))) {
                $.say($.lang.get('rafflesystem.open.keyword-exists', keyword));
                close();
                return;
            }

            if (followers) {
                followMessage = ' ' + $.lang.get('rafflesystem.common.following');
            }

            if (timerTime > 0) {
                var timeleft = timerTime - (($.systemTime() - startTime) / 6e4);
                timeout = setTimeout(function() {
                    close();
                }, timeleft * 6e4);
                timerMessage = $.lang.get('rafflesystem.common.timer', timerTime);
            }

            if (parseInt(messageInterval) !== 0) {
                interval = setInterval(function() {
                    $.say(raffleMessage.replace('(keyword)', keyword).replace('(entries)', String(Object.keys(entered).length)));
                }, messageInterval * 6e4);
            }

            saveStateInterval = setInterval(function() {
                saveState();
            }, 5 * 6e4);

            $.raffleCommand = keyword;
        }
    }

    function saveState() {
        $.inidb.set('raffleState', 'entries', JSON.stringify(entries));
        $.inidb.set('raffleState', 'entered', JSON.stringify(entered));
        $.inidb.set('raffleState', 'keyword', keyword);
        $.inidb.set('raffleState', 'entryFee', entryFee);
        $.inidb.set('raffleState', 'timerTime', timerTime);
        $.inidb.set('raffleState', 'startTime', startTime);
        $.inidb.set('raffleState', 'bools', JSON.stringify([followers, subscribers, usePoints, status, hasDrawn]));
        if (lastWinners.length >= 0){
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
        clearInterval(timeout);
        clearInterval(interval);
        clearInterval(saveStateInterval);

        /* Check if there's a raffle opened */
        if (!status) {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.close.error.closed'));
            return;
        }

        status = false;

        $.say($.lang.get('rafflesystem.close.success'));

        // Mark the raffle as off for the panel.
        $.inidb.set('raffleSettings', 'isActive', 'false');
        saveState();
    }

    /**
     * @function winner
     * @info chooses a winner for the raffle
     */
    function draw(amount) {
        var entriesLen = entries.length;
        /* Check if anyone entered the raffle */
        if (entriesLen === 0) {
            $.say($.lang.get('rafflesystem.winner.404'));
            return;
        }

        if (!hasDrawn) {
            //First time we draw for this raffle, flush old roaches from the system :O
            lastWinners = [];
        }

        // Thanks https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
        // Faster than calling $.randElement() over and over
        var newWinners = [];
        
        var taken = [];
        while (amount--) {
            var rnd = Math.floor(Math.random() * entriesLen);
            newWinners[amount] = entries[taken.includes(rnd) ? taken[rnd] : rnd];
            taken[rnd] = taken.includes(--entriesLen) ? taken[entriesLen] : entriesLen;
        }

        lastWinners = lastWinners.concat(newWinners);

        winningMsg(newWinners);
        hasDrawn = true;

        /* whisper the winner if the toggle is on */
        if (whisperWinner) {
            for (var i = 0; i < newWinners.length; i++) {
                if ($.user.isFollower(newWinners[i].toLowerCase())) {
                    $.say($.whisperPrefix(newWinners[i], true) + $.lang.get('rafflesystem.whisper.winner', $.channelName));
                }
            }
        }

        /* Remove the user from the array if we are not allowed to have multiple repicks. */
        if (allowRepick) {
            for (var j in entries) {
                for (var k in newWinners) {
                    var e = entries[j];
                    if (e.equalsIgnoreCase(newWinners[k])) {
                        entries.splice(j, 1);
                        $.inidb.del('raffleList', newWinners[k]);
                        $.inidb.decr('raffleresults', 'raffleEntries', 1);
                    }
                }
            }
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
            var followMsg = ($.user.isFollower(winners[0].toLowerCase()) ? $.lang.get('rafflesystem.isfollowing') : $.lang.get('rafflesystem.isnotfollowing'));
            $.say($.lang.get('rafflesystem.winner.single', $.username.resolve(winners[0]), followMsg));
            return;
        }

        var msg = $.lang.get('rafflesystem.winner.multiple', winners.join(', '));

        if (msg.length >= 500) { // I doubt anybody will draw more winners than we can fit in 2 messages
            var i = msg.substring(0, 500).lastIndexOf(",");
            $.say(msg.substring(0, i));
            $.say(msg.substring(i+1, msg.length));
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

        for (var i = (lastWinners.length-amount); i < lastWinners.length; i++) {
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
     * @param {string} message
     */
    function message(username, message) {
        if (sendMessages) {
            $.say($.whisperPrefix(username) + message);
        }
    }

    /**
     * @function enter
     * @info enters the user into the raffle
     *
     * @param {string} username
     */
    function enter(username, tags) {
        /* Check if the user already entered the raffle */
        if (entered[username] !== undefined) {
            message(username, $.lang.get('rafflesystem.enter.404'));
            return;
        }

        /* Check if the user is a subscriber */
        if (subscribers && !$.isSubv3(username, tags)) {
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
            } else {
                if (entryFee > $.getUserTime(username)) {
                    message(username, $.lang.get('rafflesystem.enter.time'));
                    return;
                }
            }
        }

        /* Push the user into the array */
        entered[username] = true;
        entries.push(username);
        var i;
        if (subscriberBonus > 0 && $.isSubv3(username, tags)) {
            for (i = 0; i < subscriberBonus; i++) {
                entries.push(username);
            }
        } else if (regularBonus > 0 && $.isReg(username)) {
            for (i = 0; i < regularBonus; i++) {
                entries.push(username);
            }
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
        clearInterval(timeout);
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
        entered = [];
        entries = [];
        $.raffleCommand = null;
        hasDrawn = false;
        $.inidb.RemoveFile('raffleList');
        $.inidb.set('raffleresults', 'raffleEntries', 0);
        // Mark the raffle as off for the panel.
        $.inidb.set('raffleSettings', 'isActive', 'false');
        saveState();
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        if (status === true && event.getMessage().equalsIgnoreCase(keyword)) {
            enter(event.getSender().toLowerCase(), event.getTags());
        }
    });

    /**
     * @event command
     * @info handles the command event
     * @param {object} event
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            arguments = event.getArguments(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('raffle')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.usage'));
                return;
            }

            /**
             * @commandpath raffle open [entry fee] [keyword] [close timer] [-usepoints / -usetime / -followers] - Opens a custom raffle.
             */
            if (action.equalsIgnoreCase('open')) {
                open(sender, arguments);
                $.log.event('A raffle was opened by: ' + sender + '. Arguments (' + arguments + ')');
                return;
            }

            /**
             * @commandpath raffle close - Closes the current raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                close(sender);
                $.log.event('A raffle was closed by: ' + sender + '.');
                return;
            }

            /**
             * @commandpath raffle draw [amount (default = 1)] [prize points (default = 0)] - Picks winner(s) for the raffle and optionally awards them with points 
             */
            if (action.equalsIgnoreCase('draw')) {
                
                var amount = 1;
                if(args[1] !== undefined && (isNaN(parseInt(args[1])) || parseInt(args[1] === 0))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.err.draw.usage'));
                    return;
                }
                
                if (args[1] !== undefined) {
                    amount = parseInt(args[1]);
                }

                draw(amount);

                if(args[2] !== undefined && !isNaN(parseInt(args[2])) && parseInt(args[2]) !== 0) {
                    awardWinners(amount, parseInt(args[2]));
                }

                return;
            }

            /**
             * @commandpath raffle lastWinners - Prints the last raffle winners
             */
             if (action.equalsIgnoreCase('lastWinners')) {
                winningMsg(lastWinners);
                return;
             }

            /**
             * @commandpath raffle reset - Resets the raffle.
             */
            if (action.equalsIgnoreCase('reset')) {
                clear();
                if (sender !== $.botName.toLowerCase()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.reset'));
                }
                return;
            }

            /**
             * @commandpath raffle results - Give you the current raffle information if there is one active.
             */
            if (action.equalsIgnoreCase('results')) {
                if (status) {
                    $.say($.lang.get('rafflesystem.results', keyword + (usePoints ? $.lang.get('rafflesystem.fee', $.getPointsString(entryFee)) : ''), Object.keys(entered).length));
                }
                return;
            }

            /**
             * @commandpath raffle subscriberbonus [1-10] - Sets the bonus luck for subscribers.
             */
            if (action.equalsIgnoreCase('subscriberbonus')) {
                if (subAction === undefined || isNaN(parseInt(subAction)) || parseInt(subAction) < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.subbonus.usage'));
                    return;
                }
                subscriberBonus = parseInt(subAction);
                $.inidb.set('raffleSettings', 'subscriberBonusRaffle', subscriberBonus);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.subbonus.set', subscriberBonus));
                return;
            }

            /**
             * @commandpath raffle regularbonus [1-10] - Sets the bonus luck for regulars.
             */
            if (action.equalsIgnoreCase('regularbonus')) {
                if (subAction === undefined || isNaN(parseInt(subAction)) || parseInt(subAction) < 1) {
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
            if (action.equalsIgnoreCase('whisperwinner')) {
                whisperWinner = !whisperWinner;
                $.inidb.set('raffleSettings', 'raffleWhisperWinner', whisperWinner);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.whisper.winner.toggle', (whisperWinner ? '' : $.lang.get('rafflesystem.common.message'))));
            }

            /**
             * @commandpath raffle togglewarningmessages - Toggles the raffle warning messages when entering.
             */
            if (action.equalsIgnoreCase('togglewarningmessages')) {
                sendMessages = !sendMessages;
                $.inidb.set('raffleSettings', 'raffleMSGToggle', sendMessages);
                $.say($.whisperPrefix(sender) + 'Raffle warning messages have been ' + (sendMessages ? $.lang.get('common.enabled') : $.lang.get('common.disabled')) + '.');
                return;
            }

            /**
             * @commandpath raffle togglerepicks - Toggles if the same winner can be repicked more than one.
             */
            if (action.equalsIgnoreCase('togglerepicks')) {
                allowRepick = !allowRepick;
                $.inidb.set('raffleSettings', 'noRepickSame', allowRepick);
                $.say($.whisperPrefix(sender) + (allowRepick ? $.lang.get('rafflesystem.raffle.repick.toggle1') : $.lang.get('rafflesystem.raffle.repick.toggle2')));
                return;
            }

            /**
             * @commandpath raffle message [message] - Sets the raffle auto annouce messages saying that raffle is still active.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.message.usage'));
                    return;
                }

                raffleMessage = arguments.substring(action.length() + 1);
                $.inidb.set('raffleSettings', 'raffleMessage', raffleMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.message.set', raffleMessage));
                return;
            }

            /**
             * @commandpath raffle messagetimer [minutes] - Sets the raffle auto annouce messages interval. 0 is disabled.
             */
            if (action.equalsIgnoreCase('messagetimer')) {
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
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/raffleSystem.js', 'raffle', 2);

        $.registerChatSubcommand('raffle', 'open', 2);
        $.registerChatSubcommand('raffle', 'close', 2);
        $.registerChatSubcommand('raffle', 'draw', 2);
        $.registerChatSubcommand('raffle', 'reset', 2);
        $.registerChatSubcommand('raffle', 'results', 7);
        $.registerChatSubcommand('raffle', 'lastWinners', 2);
        $.registerChatSubcommand('raffle', 'subscriberbonus', 1);
        $.registerChatSubcommand('raffle', 'regularbonus', 1);
        $.registerChatSubcommand('raffle', 'togglemessages', 1);
        $.registerChatSubcommand('raffle', 'togglerepicks', 1);
        $.registerChatSubcommand('raffle', 'message', 1);
        $.registerChatSubcommand('raffle', 'messagetimer', 1);

        reopen();
    });

    /**
     * @event Shutdown
     */
    $.bind('Shutdown', function() {
       saveState();
    });

    $.reloadRaffle = reloadRaffle;
})();
