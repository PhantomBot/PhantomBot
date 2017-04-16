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
        interval, timeout, followMessage = '', timerMessage = '';

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
            i = 1;

        /* Check if there's a raffle already opened */
        if (status) {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.error.opened'));
            return;
        }

        /* Check if the caster wants to use time or points for the raffle */
        if (arguments.match('-usetime')) {
            usePoints = false;
            arguments = arguments.replace('-usetime ', '');
        } else if (arguments.match('-usepoints')) {
            arguments = arguments.replace('-usepoints ', '');
            usePoints = true;
        } else {
            usePoints = null;
        }

        /* Check if the caster wants the raffle to be for followers only or not */
        if (arguments.match('-followers')) {
            followers = true;
            followMessage = ' ' + $.lang.get('rafflesystem.common.following');
        }

        /* Check if the caster wants the raffle to be for susbcribers only or not */
        if (arguments.match('-subscribers')) {
            subscribers = true;
        }

        /* Now split the arguments string up as we could have removed some items. */
        args = arguments.split(' ');

        /* Check the entry fee of points, or the minimum time */
        if (!isNaN(parseInt(args[i])) && usePoints !== null) {
            if (usePoints) {
                entryFee = parseInt(args[i]);
            } else {
                entryFee = (parseInt(args[i]) * 60);
            }
            i++;
        }

        /* Check for the keyword */
        if (args[i] !== undefined) {
            keyword = args[i].toLowerCase();
            i++;
            
            if (keyword.startsWith('!')) {
                keyword = ('!' + keyword.match(/(!+)(.+)/)[2]);
            }

            /* Ensure that keyword is not already a registered command. */
            if (keyword.startsWith('!') && $.commandExists(keyword.substring(1))) {
                $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.keyword-exists', keyword));
                return;
            }
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.open.usage'));
            return;
        }


        /* Check if the caster wants a auto close timer */
        if (!isNaN(parseInt(args[i])) && parseInt(args[i]) !== 0) {
            timerTime = parseInt(args[i]);
            timeout = setTimeout(function() { close(); }, (timerTime * 6e4));
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
            interval = setInterval(function() { $.say(raffleMessage.replace('(keyword)', keyword).replace('(entries)', String(Object.keys(entered).length))); }, messageInterval * 6e4);
        }

        /* Clear the old raffle data */
        entries = [];
        $.raffleCommand = keyword;
        $.inidb.RemoveFile('raffleList');
        $.inidb.set('raffleresults', 'raffleEntries', 0);

        /* Mark the raffle as opened */
        status = true;
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
        
        /* Check if there's a raffle opened */
        if (!status) {
            $.say($.whisperPrefix(username) + $.lang.get('rafflesystem.close.error.closed'));
            return;
        }

        $.say($.lang.get('rafflesystem.close.success'));

        /* Close the raffle and clears the old data */
        clear();

        /* Choose the winner */
        winner(username, true);
    }

    /**
     * @function winner
     * @info chooses a winner for the raffle
     *
     * @param {boolean} firstWinner
     */
    function winner(sender, firstWinner) {
        /* Check to see if this is a repick or not */
        if (firstWinner) {
            /* Check if anyone entered the raffle */
            if (entries.length === 0) {
                $.say($.lang.get('rafflesystem.winner.404'));
                return;
            }

            var username = $.randElement(entries);
                isFollowing = $.user.isFollower(username.toLowerCase()),
                followMsg = (isFollowing ? $.lang.get('rafflesystem.isfollowing') : $.lang.get('rafflesystem.isnotfollowing'));

            $.say($.lang.get('rafflesystem.winner', username, followMsg));
            $.inidb.set('raffleresults', 'winner', username + ' ' + followMsg);

            /* whisper the winner if the toggle is on */
            if (whisperWinner && isFollowing) {
                $.say($.whisperPrefix(username, true) + $.lang.get('rafflesystem.whisper.winner', $.channelName));
            }

            /* Remove the user from the array if we are not allowed to have multiple repicks. */
            if (allowRepick) {
                for (var i in entries) {
                    if (entries[i].equalsIgnoreCase(username)) {
                        entries.splice(i, 1);
                    }
                }
                $.inidb.del('raffleList', username);
                $.inidb.decr('raffleresults', 'raffleEntries', 1);
            }
            return;
        }

        /* Checks if there's anyone in the raffle list */
        if (entries.length === 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.repick.error'));
            return;
        }

        /* Pick a new winner */
        var username = $.randElement(entries),
            isFollowing = $.user.isFollower(username.toLowerCase()),
            followMsg = (isFollowing ? $.lang.get('rafflesystem.isfollowing') : $.lang.get('rafflesystem.isnotfollowing'));
        
        $.say($.lang.get('rafflesystem.repick', username, followMsg));
        $.inidb.set('raffleresults', 'winner', username + ' ' + followMsg);

        /* whisper the winner if the toggle is on */
        if (whisperWinner && isFollowing) {
            $.say($.whisperPrefix(username, true) + $.lang.get('rafflesystem.whisper.winner.repick', $.channelName));
        }

        /* Remove the user from the array if we are not allowed to have multiple repicks. */
        if (allowRepick) {
            for (var i in entries) {
                if (entries[i].equalsIgnoreCase(username)) {
                    entries.splice(i, 1);
                }
            }
            $.inidb.del('raffleList', username);
            $.inidb.decr('raffleresults', 'raffleEntries', 1);
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
        /*if (followers && !$.user.isFollower(username)) {
            message(username, $.lang.get('rafflesystem.enter.following'));
            return;
        }*/

        /* Check the entry fee */
        if (entryFee > 0 && usePoints !== null) {
            /* If we are using points */
            if (usePoints) {
                if (entryFee > $.getUserPoints(username)) {
                    message(username, $.lang.get('rafflesystem.enter.points', $.pointNameMultiple));
                    return;
                } else {
                    $.inidb.decr('points', username, entryFee);
                }
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
        if (subscriberBonus > 0 && $.isSubv3(username, tags)) {
            for (var i = 0; i < subscriberBonus; i++) {
                entries.push(username);
            }
        } else if (regularBonus > 0 && $.isReg(username)) {
            for (var i = 0; i < regularBonus; i++) {
                entries.push(username);
            }
        }

        /* Push the panel stats */
        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
            $.inidb.setAutoCommit(false);
            $.inidb.set('raffleList', username, true);
            $.inidb.set('raffleresults', 'raffleEntries', Object.keys(entered).length);
            $.inidb.setAutoCommit(true);
        }
    }

    /**
     * @function clear
     * @info resets the raffle information
     */
    function clear() {
        keyword = '';
        followMessage = '';
        timerMessage = '';
        usePoints = false;
        followers = false;
        subscribers = false;
        status = false;
        entryFee = 0;
        timerTime = 0;
        entered = [];
        $.raffleCommand = null;
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        if (status === true && event.getMessage().equalsIgnoreCase(keyword)) {
            enter(event.getSender(), event.getTags());
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
             * @commandpath raffle repick - Repicks a new winner from the current raffle list.
             */
            if (action.equalsIgnoreCase('repick')) {
                winner(sender, false);
                return;
            }

            /**
             * @commandpath raffle results - Give you the current raffle information if there is one active.
             */
            if (action.equalsIgnoreCase('results')) {
                if (status) {
                    $.say($.lang.get('rafflesystem.results', keyword + (usePoints ? $.lang.get('rafflesystem.fee', $.getPointsString(entryFee)) : ''), Object.keys(entered).length))
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
        if ($.bot.isModuleEnabled('./systems/raffleSystem.js')) {
            $.registerChatCommand('./systems/raffleSystem.js', 'raffle', 2);

            $.registerChatSubcommand('raffle', 'open', 2);
            $.registerChatSubcommand('raffle', 'close', 2);
            $.registerChatSubcommand('raffle', 'repick', 2);
            $.registerChatSubcommand('raffle', 'results', 7);
            $.registerChatSubcommand('raffle', 'subscriberbonus', 1);
            $.registerChatSubcommand('raffle', 'regularbonus', 1);
            $.registerChatSubcommand('raffle', 'togglemessages', 1);
            $.registerChatSubcommand('raffle', 'togglerepicks', 1);
            $.registerChatSubcommand('raffle', 'message', 1);
            $.registerChatSubcommand('raffle', 'messagetimer', 1);
        }
    });

    $.reloadRaffle = reloadRaffle;
})();
