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

// Provides commands for running tests
(function () {
    var testTimeoutId = null;
    var testIntervalId = null;
    var id = 0;
    $.bind('command', function (event) {
        var command = event.getCommand(),
                args = event.getArgs();

        // Lists the test commands
        if (command.equalsIgnoreCase('testhelp')) {
            $.say('Test Commands: !testcmd | !addmon | !delmod | !addsub | !delsub | !setcaster | !setadmin | !setvip | !setdonator | !setregular'
                    + ' | !setviewer | !testexception | !testtimeout | !testinterval | !testcleartimeout | !testclearinterval');
        }

        // Runs a command as another (real or fake) user
        if (command.equalsIgnoreCase('testcmd')) {
            if (args.length < 2) {
                $.say('Usage: !testcmd newsender newcmd args...');
                return;
            }

            var newsender = args[0];
            var newcmd = args[1];
            args = args.slice(2);
            var tags = event.getTags();
            tags.clear();
            $.command.run(newsender, newcmd, args.join(' '), tags);
        }

        // Adds a (real or fake) user as a moderator in the cache
        if (command.equalsIgnoreCase('addmod')) {
            if (args.length < 1) {
                $.say('Usage: !addmod user');
                return;
            }
            $.addModeratorToCache(args[0]);
        }

        // Removes a (real or fake) user as a moderator in the cache (NOTE: Does not affect tags)
        if (command.equalsIgnoreCase('delmod')) {
            if (args.length < 1) {
                $.say('Usage: !delmod user');
                return;
            }
            $.removeModeratorFromCache(args[0]);
        }

        // Adds a (real or fake) user as a subscriber in the cache
        if (command.equalsIgnoreCase('addsub')) {
            if (args.length < 1) {
                $.say('Usage: !addsub user');
                return;
            }
            $.addSubUsersList(args[0]);
        }

        // Removes a (real or fake) user as a subscriber in the cache (NOTE: Does not affect tags)
        if (command.equalsIgnoreCase('delsub')) {
            if (args.length < 1) {
                $.say('Usage: !delsub user');
                return;
            }
            $.delSubUsersList(args[0]);
        }

        // Sets a (real or fake) user as a Caster in the database
        if (command.equalsIgnoreCase('setcaster')) {
            if (args.length < 1) {
                $.say('Usage: !setcaster user');
                return;
            }
            $.setUsergroupByName(args[0], 'Caster');
        }

        // Sets a (real or fake) user as an Administrator in the database
        if (command.equalsIgnoreCase('setadmin')) {
            if (args.length < 1) {
                $.say('Usage: !setadmin user');
                return;
            }
            $.setUsergroupByName(args[0], 'Administrator');
        }

        // Sets a (real or fake) user as a VIP in the database (NOTE: Does not affect tags)
        if (command.equalsIgnoreCase('setvip')) {
            if (args.length < 1) {
                $.say('Usage: !setvip user');
                return;
            }
            $.setUsergroupByName(args[0], 'VIP');
        }

        // Sets a (real or fake) user as a Donator in the database
        if (command.equalsIgnoreCase('setdonator')) {
            if (args.length < 1) {
                $.say('Usage: !setdonator user');
                return;
            }
            $.setUsergroupByName(args[0], 'Donator');
        }

        // Sets a (real or fake) user as a Regular in the database
        if (command.equalsIgnoreCase('setregular')) {
            if (args.length < 1) {
                $.say('Usage: !setregular user');
                return;
            }
            $.setUsergroupByName(args[0], 'Regular');
        }

        // Sets a (real or fake) user as a Viewer, by deleting them from the groups table in the databse
        if (command.equalsIgnoreCase('setviewer')) {
            if (args.length < 1) {
                $.say('Usage: !setviewer user');
                return;
            }
            $.inidb.del('group', args[0].toLowerCase());
        }

        // Throws an IllegalStateException to test exception catching/logging in init.js
        if (command.equalsIgnoreCase('testexception')) {
            throw new Packages.java.lang.IllegalStateException("This is a test");
        }

        // Sends a test message to chat after 10 seconds
        if (command.equalsIgnoreCase('testtimeout')) {
            var myid = id++;
            testTimeoutId = setTimeout(function () {
                $.say('Test timeout triggered ' + myid);
            }, 10000, 'test::testTimeout');
        }

        // Sends a test message to chat every 5 seconds
        if (command.equalsIgnoreCase('testinterval')) {
            var myid = id++;
            testIntervalId = setInterval(function () {
                $.say('Test interval triggered ' + myid);
            }, 5000, 'test::testInterval');
        }

        // Cancels the most recent !testtimeout, if it has not triggered
        if (command.equalsIgnoreCase('testcleartimeout')) {
            clearTimeout(testTimeoutId);
        }

        // Cancels the most recent !testinterval
        if (command.equalsIgnoreCase('testclearinterval')) {
            clearInterval(testIntervalId);
        }
    });

    $.bind('initReady', function () {
        $.registerChatCommand('./custom/test.js', 'testhelp', 1);
        $.registerChatCommand('./custom/test.js', 'testcmd', 1);
        $.registerChatCommand('./custom/test.js', 'addmod', 1);
        $.registerChatCommand('./custom/test.js', 'delmod', 1);
        $.registerChatCommand('./custom/test.js', 'addsub', 1);
        $.registerChatCommand('./custom/test.js', 'delsub', 1);
        $.registerChatCommand('./custom/test.js', 'setcaster', 1);
        $.registerChatCommand('./custom/test.js', 'setadmin', 1);
        $.registerChatCommand('./custom/test.js', 'setvip', 1);
        $.registerChatCommand('./custom/test.js', 'setdonator', 1);
        $.registerChatCommand('./custom/test.js', 'setregular', 1);
        $.registerChatCommand('./custom/test.js', 'setviewer', 1);
        $.registerChatCommand('./custom/test.js', 'testexception', 1);
        $.registerChatCommand('./custom/test.js', 'testtimeout', 1);
        $.registerChatCommand('./custom/test.js', 'testinterval', 1);
        $.registerChatCommand('./custom/test.js', 'testcleartimeout', 1);
        $.registerChatCommand('./custom/test.js', 'testclearinterval', 1);
    });
})();
