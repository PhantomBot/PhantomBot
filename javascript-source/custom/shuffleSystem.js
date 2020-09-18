/*
 * Copyright (C) 2016-2018 phantombot.tv
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
(function () {
    var entries = [],
            entered = [],
            keyword = '',
            timerTime = 0,
            status = false,
            sendMessages = $.getSetIniDbBoolean('shuffleSettings', 'raffleMSGToggle', false),
            allowRepick = $.getSetIniDbBoolean('shuffleSettings', 'noRepickSame', true),
            raffleMessage = $.getSetIniDbString('shuffleSettings', 'raffleMessage', 'A raffle is still opened! Type (keyword) to enter. (entries) users have entered so far.'),
            messageInterval = $.getSetIniDbNumber('shuffleSettings', 'raffleMessageInterval', 0),
            interval, timeout, followMessage = '',
            timerMessage = '',
            shuffleBuffer = $.getSetIniDbNumber('shuffleSettings', 'songbuffer', 2);

    /* New Shuffle System Functions */

    /**
     * @function reloadRaffle
     * @info used for the panel.
     */
    function reloadShuffle() {
        sendMessages = $.getIniDbBoolean('shuffleSettings', 'raffleMSGToggle');
        allowRepick = $.getIniDbBoolean('shuffleSettings', 'noRepickSame');
        raffleMessage = $.getIniDbString('shuffleSettings', 'raffleMessage');
        messageInterval = $.getIniDbNumber('shuffleSettings', 'raffleMessageInterval');
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
            $.say($.whisperPrefix(username) + $.lang.get('shufflesystem.open.error.opened'));
            return;
        }

        clear();

        /* Now split the arguments string up as we could have removed some items. */
        args = arguments.split(' ');

        /* Check for the keyword */
        if (args[i] !== undefined) {
            keyword = args[i].toLowerCase();
            i++;

            if (keyword.startsWith('!')) {
                keyword = ('!' + keyword.match(/(!+)(.+)/)[2]);
            }

            /* Ensure that keyword is not already a registered command. */
            if (keyword.startsWith('!') && $.commandExists(keyword.substring(1))) {
                $.say($.whisperPrefix(username) + $.lang.get('shufflesystem.open.keyword-exists', keyword));
                return;
            }
        } else {
            $.say($.whisperPrefix(username) + $.lang.get('shufflesystem.open.usage'));
            return;
        }

        // TODO Default to 1 minute timer
        /* Check if the caster wants a auto close timer */
        if (!isNaN(parseInt(args[i])) && parseInt(args[i]) !== 0) {
            timerTime = parseInt(args[i]);
            timeout = setTimeout(function () {
                draw();
            }, (timerTime * 6e4));
            timerMessage = $.lang.get('shufflesystem.common.timer', timerTime);
        }

        /* Say in chat that the raffle is now opened. */
        $.say($.lang.get('shufflesystem.open', keyword, followMessage, timerMessage));

        if (parseInt(messageInterval) !== 0) {
            interval = setInterval(function () {
                $.say(raffleMessage.replace('(keyword)', keyword).replace('(entries)', String(Object.keys(entered).length)));
            }, messageInterval * 6e4);
        }

        /* Clear the old shuffle raffle data */
        entries = [];
        $.shuffleCommand = keyword;
        $.inidb.RemoveFile('shuffleList');
        $.inidb.set('shuffleresults', 'shuffleEntries', 0);
        // Mark the raffle as on for the panel.
        $.inidb.set('shuffleSettings', 'isActive', 'true');

        /* Mark the shuffle raffle as opened */
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
            $.say($.whisperPrefix(username) + $.lang.get('shufflesystem.close.error.closed'));
            return;
        }

        status = false;

        $.say($.lang.get('shufflesystem.close.success'));

        // Mark the raffle as off for the panel.
        $.inidb.set('shuffleSettings', 'isActive', 'false');
    }

    /**
     * @function winner
     * @info chooses a winner for the raffle
     */
    function draw(sender) {
        /* Check if anyone entered the raffle */
        if (entries.length === 0) {
            $.say($.lang.get('shufflesystem.winner.404'));
            return;
        }

        if (status) {
            close(sender);
        }

        var username = $.randElement(entries);

        $.inidb.incr("shufflewins", username, 1);
        var wins = $.inidb.get("shufflewins", username);
        var winMsg;
        if (wins == 1) {
            winMsg = $.lang.get('shufflesystem.user.first.win');
        } else {
            winMsg = $.lang.get('shufflesystem.user.win.count', wins);
        }

        $.say($.lang.get('shufflesystem.winner', username, winMsg));

        var request = $.getUserRequest(username);

        // Bump users song in the queue
        // TODO Mark song as a shuffle
        request[0].setShuffleFlag();
        var position = $.getBumpPosition();
        $.currentPlaylist().addToQueue(request[0], position);
        $.getConnectedPlayerClient().pushSongList();
    }

    /**
     * @function message
     * @info messages that user if the raffle toggles are on
     *
     * @param {string} username
     * @param {string} message
     */
    function message(username, message) {
        $.say($.whisperPrefix(username) + message);
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
            message(username, $.lang.get('shufflesystem.enter.404'));
            return;
        }

        /* Check if the user has a song in the queue */
        var request = $.getUserRequest(username);
        if (request == null) {
            message(username, $.lang.get('shufflesystem.error.norequest'));
            return;
        }

        /* Check if the user is one of the last 2 winners */
        var recentUsers = $.currentPlaylist().getPreviousRequesters();
        var history = recentUsers.toArray();
        for (i = 0; i < history.length; i++) {
            if (username.equalsIgnoreCase(history[i])) {
                message(username, $.lang.get('shufflesystem.error.recentwinner', shuffleBuffer));
                return;
            }
        }

        /* Push the user into the array */
        entered[username] = true;
        entries.push(username);

        message(username, $.lang.get('shufflesystem.enter.success'));

//        /* Push the panel stats */
//        if ($.bot.isModuleEnabled('./handlers/panelHandler.js')) {
//            $.inidb.setAutoCommit(false);
//            $.inidb.set('raffleList', username, true);
//            $.inidb.set('raffleresults', 'raffleEntries', Object.keys(entered).length);
//            $.inidb.setAutoCommit(true);
//        }
    }

    /**
     * @function clear
     * @info resets the raffle information
     */
    function clear() {
        /* Clear the timer if there is one active. */
        clearInterval(timeout);
        clearInterval(interval);
        keyword = '';
        followMessage = '';
        timerMessage = '';
        status = false;
        entryFee = 0;
        timerTime = 0;
        entered = [];
        entries = [];
        $.shuffleCommand = null;
        $.inidb.RemoveFile('shuffleList');
        $.inidb.set('shuffleresults', 'shuffleEntries', 0);
        // Mark the raffle as off for the panel.
        $.inidb.set('shuffleSettings', 'isActive', 'false');
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        if (status === true && event.getMessage().equalsIgnoreCase(keyword)) {
            enter(event.getSender(), event.getTags());
        }
    });

    /**
     * @event command
     * @info handles the command event
     * @param {object} event
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                arguments = event.getArguments(),
                args = event.getArgs(),
                action = args[0],
                subAction = args[1];

        // Shuffle Commands
        if (command.equalsIgnoreCase('shuffle')) {
            var player = $.getConnectedPlayerClient();
            if (player == null) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.client.404'));
            }
            var shuffleEnabled = $.isQueueShuffleEnabled();

            if (!shuffleEnabled) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.shuffle.disabled'));
                return;
            }

            action = args[0];

            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.usage'));
                return;
            }

            /**
             * @commandpath shuffle open [entry fee] [keyword] [close timer] [-usepoints / -usetime / -followers] - Opens a custom raffle.
             */
            if (action.equalsIgnoreCase('open')) {
                open(sender, arguments);
                $.log.event('A shuffle was opened by: ' + sender + '. Arguments (' + args[0] + ')');
                return;
            }

            /**
             * @commandpath shuffle close - Closes the current raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                close(sender);
                $.log.event('A shuffle was closed by: ' + sender + '.');
                return;
            }

            /**
             * @commandpath shuffle draw - Draws a winner from the current raffle list.
             */
            if (action.equalsIgnoreCase('draw')) {
                draw(sender);
                return;
            }

            /**
             * @commandpath shuffle reset - Resets the shuffle.
             */
            if (action.equalsIgnoreCase('reset')) {
                clear();
                if (sender != $.botName.toLowerCase()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.reset'));
                }
                return;
            }

            /**
             * @commandpath shuffle results - Give you the current raffle information if there is one active.
             */
            if (action.equalsIgnoreCase('results')) {
                if (status) {
                    $.say($.lang.get('shufflesystem.results', keyword, Object.keys(entered).length))
                }
                return;
            }

            if (action.equalsIgnoreCase('buffer')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.buffer.usage'));
                    return;
                }

                shuffleBuffer = parseInt(args[1]);
                $.inidb.set('shuffleSettings', 'songbuffer', shuffleBuffer);
                $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.buffer.success', shuffleBuffer));
                return;
            }

            /**
             * @commandpath shuffle togglewarningmessages - Toggles the raffle warning messages when entering.
             */
            if (action.equalsIgnoreCase('togglewarningmessages')) {
                sendMessages = !sendMessages;
                $.inidb.set('shuffleSettings', 'raffleMSGToggle', sendMessages);
                $.say($.whisperPrefix(sender) + 'Raffle warning messages have been ' + (sendMessages ? $.lang.get('common.enabled') : $.lang.get('common.disabled')) + '.');
                return;
            }

            // TODO Change to make it so a winner can't win within 2 songs
            /**
             * @commandpath shuffle togglerepicks - Toggles if the same winner can be repicked more than one.
             */
            if (action.equalsIgnoreCase('togglerepicks')) {
                allowRepick = !allowRepick;
                $.inidb.set('shuffleSettings', 'noRepickSame', allowRepick);
                $.say($.whisperPrefix(sender) + (allowRepick ? $.lang.get('shufflesystem.raffle.repick.toggle1') : $.lang.get('shufflesystem.raffle.repick.toggle2')));
                return;
            }

            /**
             * @commandpath shuffle message [message] - Sets the raffle auto annouce messages saying that raffle is still active.
             */
            if (action.equalsIgnoreCase('message')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.message.usage'));
                    return;
                }

                raffleMessage = arguments.substring(action.length() + 1);
                $.inidb.set('shuffleSettings', 'raffleMessage', raffleMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.message.set', raffleMessage));
                return;
            }

            /**
             * @commandpath shuffle messagetimer [minutes] - Sets the raffle auto annouce messages interval. 0 is disabled.
             */
            if (action.equalsIgnoreCase('messagetimer')) {
                if (subAction === undefined || isNaN(parseInt(subAction))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.timer.usage'));
                    return;
                }

                messageInterval = parseInt(subAction);
                $.inidb.set('shuffleSettings', 'raffleMessageInterval', messageInterval);
                $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.timer.set', messageInterval));
                return;
            }
        }

        if (command.equalsIgnoreCase('shufflewins')) {
            var wins = $.inidb.get("shufflewins", sender);
            if (wins == null) {
                wins = 0;
            }
            $.say($.whisperPrefix(sender) + $.lang.get('shufflesystem.user.wins', wins));
        }

        if (command.equalsIgnoreCase('startshuffle')) {
            open(sender, 'open join 1');
        }
    });

    /**
     * @event initReady
     * @info event sent to register commands
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./custom/shuffleSystem.js', 'shuffle', 2);
        $.registerChatSubcommand('shuffle', 'buffer', 2);

        $.registerChatCommand('./custom/shuffleSystem.js', 'shufflewins');
        $.registerChatCommand('./custom/shuffleSystem.js', 'startshuffle', 2);


        // Mark the raffle as off for the panel.
//        $.inidb.set('shuffleSettings', 'isActive', 'false');
//        $.inidb.set('raffleresults', 'raffleEntries', 0);
//        $.inidb.RemoveFile('raffleList');
    });

    $.reloadShuffle = reloadShuffle;
})();