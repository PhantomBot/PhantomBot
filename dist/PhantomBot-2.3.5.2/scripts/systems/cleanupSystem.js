/**
 * cleanupSystem.js
 *
 * A module that enables channel owners to clean the bot's database.
 */
(function() {
    var logName = 'cleanUpSystem',
        running = false;

    function cleanUp(table, amount, sender) {
        if (table.equalsIgnoreCase('time')) {
            var keys = $.inidb.GetKeyList('time', ''),
                time = parseInt(amount),
                count = 0,
                i;

            $.consoleLn('>>> Process is starting this might take a few minutes...');
            running = true;
            for (i in keys) {
                if (parseInt($.inidb.get('time', keys[i])) <= time) {
                    $.consoleLn('>> Removing ' + keys[i] + ' from the time table with ' + $.inidb.get('time', keys[i]) + ' time.');
                    $.inidb.del('time', keys[i]);
                    count++;
                }
            }
            $.consoleLn('> Process done. ' + count + ' users have been removed from the times table.');
            $.log.file(logName, '' + 'Cleanup ran for the time table by ' + sender + '. (Removed ' + count + ' users from the time table)');
            running = false;
            return;
        }

        if (table.equalsIgnoreCase('points')) {
            var keys = $.inidb.GetKeyList('points', ''),
                points = parseInt(amount),
                count = 0,
                i;

            $.consoleLn('>>> Process is starting this might take a few minutes...');
            running = true;
            for (i in keys) {
                if (parseInt($.inidb.get('points', keys[i])) <= points) {
                    $.consoleLn('>> Removing ' + keys[i] + ' from the points table with ' + $.inidb.get('points', keys[i]) + ' points.');
                    $.inidb.del('points', keys[i]);
                    count++;
                }
            }
            $.consoleLn('> Process done. ' + count + ' users have been removed from the points table.');
            $.log.file(logName, '' + 'Cleanup ran for the points table by ' + sender + '. (Removed ' + count + ' users from the points table)');
            running = false;
            return;
        }

        if (table.equalsIgnoreCase('all')) {
            var keys = $.inidb.GetKeyList('visited', ''),
                time = parseInt(amount),
                count = 0,
                t,
                i;

            $.consoleLn('>>> Process is starting this might take a few minutes...');
            running = true;
            for (i in keys) {
                t = ($.inidb.exists('time', keys[i]) ? parseInt($.inidb.get('time', keys[i])) : 0);
                if (t <= time) {
                    $.inidb.del('time', keys[i]);
                    $.inidb.del('points', keys[i]);
                    $.inidb.del('heistPayouts', keys[i]);
                    $.inidb.del('lastseen', keys[i]);
                    $.inidb.del('followed', keys[i]);
                    $.inidb.del('visited', keys[i]);
                    $.consoleLn('>> Removed ' + keys[i] + ' from the database.');
                    count++;
                }
            }
            $.consoleLn('> Process done. ' + count + ' users have been removed from the database.');
            $.log.file(logName, '' + 'Cleanup ran by ' + sender + '. (Removed ' + count + ' users from the database)');
            running = false;
            return;
        }
        $.log.error('commands: cleanup [time / points / all] [amount of time in seconds or points if cleaning points]');
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = parseInt(args[1]);

        /**
         * @commandpath cleanup time [amount in seconds] - Will remove users from the times table with less then the seconds you chose.
         * @commandpath cleanup points [amount of points] - Will remove users from the points table with less then the points you chose.
         * @commandpath cleanup all [time in seconds] - Will remove users from all the db tables with less then the seconds you chose.
         */
        if (command.equalsIgnoreCase('cleanup') && !running) {
            if (!action || !subAction) {
                $.say($.whisperPrefix(sender) + $.lang.get('cleanupsystem.run.usage'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('cleanupsystem.run.progress', $.botName));
            cleanUp(action, subAction, sender);
            $.say($.whisperPrefix(sender) + $.lang.get('cleanupsystem.run.success'));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/cleanupSystem.js')) {
            $.registerChatCommand('./systems/cleanupSystem.js', 'cleanup', 1);
        }
    });
})();
