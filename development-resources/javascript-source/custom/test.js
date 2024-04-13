/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
                    + ' | !setviewer | !testexception | !testtimeout | !testinterval | !testcleartimeout | !testclearinterval | !testdb');
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

        // Adds a (real or fake) user as a VIP in the cache
        if (command.equalsIgnoreCase('addVIP')) {
            if (args.length < 1) {
                $.say('Usage: !addvip user');
                return;
            }
            $.addVIPUsersList(args[0]);
        }

        // Removes a (real or fake) user as a VIP in the cache (NOTE: Does not affect tags)
        if (command.equalsIgnoreCase('delVIP')) {
            if (args.length < 1) {
                $.say('Usage: !delvip user');
                return;
            }
            $.delVIPUsersList(args[0]);
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

        // Tests batched operations on the DB
        if (command.equalsIgnoreCase('testdb')) {
            let tbl = 'testtable';
            let keys1 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
            let values1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26'];
            let keys2 = ['ival', 'bval', 'dval', 'sval', 'fval', 'lval', 'nval'];
            let types2 = ['int', 'bool', 'double', 'string', 'float', 'long', 'string'];
            let values2 = ['1', 'true', '3.645678903456784567', 'something', '0.12', '12345678923456789', null];
            let pass = true;


            $.inidb.RemoveFile(tbl);

            if (!$.inidb.FileExists(tbl)) {
                $.consoleDebug('Table remove success');
            } else {
                $.consoleDebug('Table remove fail');
                pass = false;
            }

            $.inidb.AddFile(tbl);

            if ($.inidb.FileExists(tbl)) {
                $.consoleDebug('Table create success');
            } else {
                $.consoleDebug('Table create fail');
                pass = false;
            }

            $.inidb.setbatch(tbl, keys1, values1);
            $.inidb.setbatch(tbl, keys2, values2);

            let found = [];
            let kvs = $.inidb.GetKeyValueList(tbl, '');
            for (let i in kvs) {
                let key = $.jsString(kvs[i].getKey());
                let value = $.jsString(kvs[i].getValue());
                for (let b in keys1) {
                    if (keys1[b] === key && !found.includes(key)) {
                        if (values1[b] === value) {
                            found.push(key);
                        }
                    }
                }
            }

            if (found.length === keys1.length) {
                $.consoleDebug('Find keys1 success');
            } else {
                $.consoleDebug('Find keys1 fail ' + found.length + ' vs ' + keys1.length);
                pass = false;
            }

            for (let i in keys2) {
                let key = keys2[i];
                let value = values2[i];
                let type = types2[i];
                let dvalue;

                try {
                    if (type === 'int') {
                        value = Packages.java.lang.Integer.parseInt(value);
                        dvalue = $.inidb.GetInteger(tbl, '', key);
                        type = 'I';
                    } else if (type === 'bool') {
                        value = (value === '1' || value === 'true' || value === 'yes');
                        dvalue = $.inidb.GetBoolean(tbl, '', key);
                        type = 'B';
                    } else if (type === 'double') {
                        value = Packages.java.lang.Double.parseDouble(value);
                        dvalue = $.inidb.GetDouble(tbl, '', key);
                        type = 'D';
                    } else if (type === 'float') {
                        value = Packages.java.lang.Float.parseFloat(value);
                        dvalue = $.inidb.GetFloat(tbl, '', key);
                        type = 'F';
                    } else if (type === 'long') {
                        value = Packages.java.lang.Long.parseLong(value);
                        dvalue = $.inidb.GetLong(tbl, '', key);
                        type = 'L';
                    } else if (type === 'string') {
                        dvalue = $.jsString($.inidb.GetString(tbl, '', key));
                        type = 'S';
                    }


                    if (dvalue === value) {
                        $.consoleDebug(key + ' [' + type + '] success');
                    } else {
                        $.consoleDebug(key + ' [' + type + '] fail ' + value + ' vs ' + dvalue);
                        pass = false;
                    }
                } catch (e) {
                    $.consoleDebug(key + ' [' + type + ']  exception ' + e);
                    pass = false;
                }
            }

            $.consoleDebug('OVERALL RESULT ' + (pass ? 'PASS' : 'FAIL'));
            $.say('DB Test ' + (pass ? 'PASS' : 'FAIL') + '. See console for details');
        }
    });

    $.bind('initReady', function () {
        $.registerChatCommand('./custom/test.js', 'testhelp', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testcmd', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'addmod', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'delmod', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'addsub', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'delsub', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'addvip', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'delvip', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'setcaster', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'setadmin', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'setvip', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'setdonator', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'setregular', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'setviewer', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testexception', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testtimeout', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testinterval', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testcleartimeout', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testclearinterval', $.PERMISSION.Admin);
        $.registerChatCommand('./custom/test.js', 'testdb', $.PERMISSION.Admin);
    });
})();
