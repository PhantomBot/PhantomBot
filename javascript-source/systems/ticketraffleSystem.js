/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
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
        msgToggle = $.getSetIniDbBoolean('settings', 'tRaffleMSGToggle', false),
        raffleMessage = $.getSetIniDbString('settings', 'traffleMessage', 'A raffle is still opened! Type !tickets (amount) to enter. (entries) users have entered so far.'),
        messageInterval = $.getSetIniDbNumber('settings', 'traffleMessageInterval', 0),
        totalEntries = 0,
        lastTotalEntries = 0,
        totalTickets = 0,
        a = '',
        interval;

    function reloadTRaffle() {
        msgToggle = $.getIniDbBoolean('settings', 'tRaffleMSGToggle');
        raffleMessage = $.getSetIniDbString('settings', 'traffleMessage');
        messageInterval = $.getSetIniDbNumber('settings', 'traffleMessageInterval');
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
            a = $.lang.get('ticketrafflesystem.msg.need.to.be.follwing');
        }
        openRaffle(maxEntries, followers, cost, a, user);
    };

    function openRaffle(maxEntries, followers, cost, a, user) {
        $.say($.lang.get('ticketrafflesystem.raffle.opened', maxEntries, $.getPointsString(cost), a));
        raffleStatus = true;
        $.inidb.RemoveFile('ticketsList');
        $.inidb.RemoveFile('entered');
        $.inidb.set('raffleresults', 'ticketRaffleEntries', 0);
        entries = "";
        entries = [];

        if (messageInterval != 0) {
            interval = setInterval(function() {
                $.say(raffleMessage.replace('(entries)', String(totalEntries))); //can't use regex here. why? who knows.
            }, messageInterval * 6e4);
        }

        $.log.event(user + ' opened a ticket raffle.');
        $.inidb.set('traffleSettings', 'isActive', 'true');
    };

    function closeRaffle(user) {
        if (!raffleStatus) {
            $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.not.opened'));
            return;
        }

        clear();

        $.say($.lang.get('ticketrafflesystem.raffle.closed'));
        $.log.event(user + ' closed a ticket raffle.');
    };

    function clear() {
        clearInterval(interval);

        raffleStatus = false;
        followers = false;
        maxEntries = 0;
        cost = 0;
        a = '';
        totalEntries = 0;
        lastTotalEntries = 0;
        totalTickets = 0;
        regTMulti = 1;
        subTMulti = 1;
        $.inidb.set('traffleSettings', 'isActive', 'false');
    };

    function winner(force) {
        if (entries.length == 0) {
            $.say($.lang.get('ticketrafflesystem.raffle.close.err'));
            return;
        }

        var Winner = $.randElement(entries),
            isFollowing = $.user.isFollower(Winner.toLowerCase()),
            followMsg = (isFollowing ? $.lang.get('rafflesystem.isfollowing') : $.lang.get('rafflesystem.isnotfollowing'));

        $.say($.lang.get('ticketrafflesystem.winner', $.username.resolve(Winner), followMsg));
        $.inidb.set('traffleresults', 'winner', $.username.resolve(Winner) + ' ' + followMsg);
        $.log.event('Winner of the ticket raffle was ' + Winner);
    };

    function enterRaffle(user, tags, times) {
        if (!raffleStatus) {
            if (msgToggle) {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.raffle.not.opened'));
            }
            return;
        }

        var otimes = times;
        if (tags.getTags().containsKey('subscriber') && tags.getTags().get('subscriber').equals('1')) {
            times *= subTMulti;
        } else if ($.isReg(user)) {
            times *= regTMulti;
        }

        if (times > maxEntries || times == 0 || times < 0) {
            if (msgToggle) {
                $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.only.buy.amount', maxEntries));
            }
            return;
        }

        for (var i = 0, t = 0; i < entries.length; i++) {
            if (entries[i].equalsIgnoreCase(user)) {
                t++;
                if ((t + times) > maxEntries) {
                    if (msgToggle) {
                        $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.limit.hit', maxEntries));
                    }
                    return;
                }
            }
        }

        if (cost > 0) {
            if ((otimes * cost) > $.getUserPoints(user)) {
                if (msgToggle) {
                    $.say($.whisperPrefix(user) + $.lang.get('ticketrafflesystem.err.points', $.pointNameMultiple));
                }
                return;
            }
        }

        if (!$.inidb.exists('entered', user.toLowerCase())) {
            totalEntries++;
        }

        totalTickets += times;
        $.inidb.decr('points', user, (otimes * cost));
        incr(user.toLowerCase(), times);

        for (var i = 0; i < times; i++) {
            entries.push(user);
        }
    };

    function incr(user, times) {
        if (!$.inidb.exists('entered', user.toLowerCase())) {
            $.inidb.set('entered', user.toLowerCase(), 'true');
            $.inidb.incr('raffleresults', 'ticketRaffleEntries', 1);
        }
        $.inidb.incr('ticketsList', user.toLowerCase(), times);
    }

    function getTickets(user) {
        if (!$.inidb.exists('ticketsList', user.toLowerCase())) {
            return 0;
        }
        return $.inidb.get('ticketsList', user.toLowerCase());
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
            }

            /**
             * @commandpath traffle close - Closes a ticket raffle.
             */
            if (action.equalsIgnoreCase('close')) {
                closeRaffle(sender);
            }

            /**
             * @commandpath traffle draw - Picks a winner for the ticket raffle
             */
            if (action.equalsIgnoreCase('draw')) {
                winner();
            }

            /**
             * @commandpath traffle reset - Resets the raffle.
             */
            if (action.equalsIgnoreCase('reset')) {
                clear();
                $.inidb.RemoveFile('ticketsList');
                $.inidb.RemoveFile('entered');
                $.inidb.set('raffleresults', 'ticketRaffleEntries', 0);
                entries = [];
                if (sender != $.botName.toLowerCase()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.reset'));
                }
            }

            /**
             * @commandpath traffle messagetoggle - Toggles on and off a message when entering a ticket raffle
             */
            if (action.equalsIgnoreCase('messagetoggle')) {
                if (msgToggle) {
                    msgToggle = false;
                    $.inidb.set('settings', 'tRaffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.msg.disabled'));
                } else {
                    msgToggle = true;
                    $.inidb.set('settings', 'tRaffleMSGToggle', msgToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.msg.enabled'));
                }
            }

            /**
             * @commandpath traffle autoannouncemessage [message] - Sets the auto annouce message for when a raffle is opened
             */
            if (action.equalsIgnoreCase('autoannouncemessage')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msg.usage'));
                    return;
                }

                raffleMessage = argString.replace(action, '').trim();
                $.inidb.set('settings', 'traffleMessage', raffleMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.auto.msg.set', raffleMessage));
                $.log.event(sender + ' changed the auto annouce message to ' + raffleMessage);
            }

            /**
             * @commandpath traffle autoannounceinterval [minutes] - Sets the auto annouce message interval. Use 0 to disable it
             */
            if (action.equalsIgnoreCase('autoannounceinterval')) {
                if (!parseInt(args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('rafflesystem.auto.msginterval.usage'));
                    return;
                }

                messageInterval = parseInt(args[1]);
                $.inidb.set('settings', 'traffleMessageInterval', messageInterval);
                $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.auto.msginterval.set', messageInterval));
                $.log.event(sender + ' changed the auto annouce interval to ' + messageInterval);
            }
        }

        /**
         * @commandpath tickets [amount] - Buy tickets to enter the ticket raffle.
         */
        if (command.equalsIgnoreCase('tickets') || command.equalsIgnoreCase('ticket')) {
            if (!action) {
                if (msgToggle && raffleStatus) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ticketrafflesystem.ticket.usage', getTickets(sender)));
                }
                return;
            }
            enterRaffle(sender, event, parseInt(action));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/ticketraffleSystem.js', 'traffle', 2);
        $.registerChatCommand('./systems/ticketraffleSystem.js', 'tickets', 7);
        $.registerChatCommand('./systems/ticketraffleSystem.js', 'ticket', 7);

        $.inidb.set('traffleSettings', 'isActive', 'false');
        $.inidb.set('raffleresults', 'ticketRaffleEntries', 0);
        $.inidb.RemoveFile('ticketsList');
        $.inidb.RemoveFile('entered');
    });

    $.reloadTRaffle = reloadTRaffle;
})();
