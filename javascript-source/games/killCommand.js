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
 * killCommand.js
 *
 * Viewers can show each other the love of REAL friends by expressing it in pain.
 */
(function() {
    var selfMessageCount = 0,
        otherMessageCount = 0,
        lastRandom = -1,
        jailTimeout = $.getSetIniDbNumber('settings', 'killTimeoutTime', 60),
        lang,
        rand,
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function reloadKill
     */
    function reloadKill() {
        jailTimeout = $.getIniDbNumber('settings', 'killTimeoutTime', 60);
    }

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('killcommand.self.' + i); i++) {
            selfMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.other.' + i); i++) {
            otherMessageCount++;
        }
        $.consoleDebug($.lang.get('killcommand.console.loaded', selfMessageCount, otherMessageCount));
    }

    function selfKill(sender) {
        _lock.lock();
        try {
            do {
                rand = $.randRange(1, selfMessageCount);
            } while (rand === lastRandom);
            $.say($.lang.get('killcommand.self.' + rand, $.resolveRank(sender)));
            lastRandom = rand;
        } finally {
            _lock.unlock();
        }
    }

    function kill(sender, user) {
        user = $.user.sanitize(user);
        var tries = 0;
        _lock.lock();
        try {
            do {
                tries++;
                rand = $.randRange(1, otherMessageCount);
            } while (rand === lastRandom && tries < 5);
            lang = $.lang.get('killcommand.other.' + rand, $.resolveRank(sender), $.resolveRank(user), jailTimeout, $.botName);
        } finally {
            _lock.unlock();
        }

        if (lang.startsWith('(jail)')) {
            lang = $.replace(lang, '(jail)', '');
            $.say(lang);
            if (!$.checkUserPermission(sender, undefined, $.PERMISSION.Mod) && jailTimeout > 0) {
                setTimeout(function() {
                    Packages.tv.phantombot.PhantomBot.instance().getSession().say('.timeout ' + sender + ' ' + jailTimeout);
                }, 1500);
            }
        } else {
            $.say(lang);
        }

        _lock.lock();
        try {
            lastRandom = rand;
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();

        /**
         * @commandpath kill [username] - Kill a fellow viewer (not for real!), omit the username to kill yourself
         */
        if (command.equalsIgnoreCase('kill')) {
            if (args.length <= 0 || args[0].toLowerCase() === sender) {
                selfKill(sender);
            } else {
                kill(sender, args[0]);
            }
        }

        /**
         * @commandpath jailtimeouttime [amount in seconds] - Set the timeout time for jail time on the kill command.
         */
        if (command.equalsIgnoreCase('jailtimeouttime')) {
            if (args.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.jail.timeout.usage'));
                return;
            }

            jailTimeout = args[0];
            $.inidb.set('settings', 'killTimeoutTime', args[0]);
            $.say($.whisperPrefix(sender) + $.lang.get('killcommand.jail.timeout.set', jailTimeout));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if (selfMessageCount === 0 && otherMessageCount === 0) {
            loadResponses();
        }

        $.registerChatCommand('./games/killCommand.js', 'kill', $.PERMISSION.Viewer);
        $.registerChatCommand('./games/killCommand.js', 'jailtimeouttime', $.PERMISSION.Admin);
    });

    $.reloadKill = reloadKill;
})();
