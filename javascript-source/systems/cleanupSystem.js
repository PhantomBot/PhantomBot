/*
 * Copyright (C) 2016-2019 phantombot.tv
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

            $.consoleLn('>>> Prozess startet, dies kann einige Minuten in Anspruch nehmen...');
            running = true;
            for (i in keys) {
                if (parseInt($.inidb.get('time', keys[i])) <= time) {
                    $.consoleLn('>> Entferne ' + keys[i] + ' von der Zeiten Tabelle mit ' + $.inidb.get('time', keys[i]) + ' Zeit.');
                    $.inidb.del('time', keys[i]);
                    count++;
                }
            }
            $.consoleLn('> Prozess beendet. ' + count + ' Nutzer wurden von der Zeit Tabelle entfernt.');
            $.log.file(logName, '' + 'Bereinigung für die Zeit Tabelle wurde von ' + sender + ' ausgeführt. (' + count + ' Nutzer von der Zeit Tabelle entfernt)');
            running = false;
            return;
        }

        if (table.equalsIgnoreCase('points')) {
            var keys = $.inidb.GetKeyList('points', ''),
                points = parseInt(amount),
                count = 0,
                i;

            $.consoleLn('>>> Prozess startet, dies kann einige Minuten in Anspruch nehmen...');
            running = true;
            for (i in keys) {
                if (parseInt($.inidb.get('points', keys[i])) <= points) {
                    $.consoleLn('>> Entferne ' + keys[i] + ' von der Punkte Tabelle mit ' + $.inidb.get('points', keys[i]) + ' Punkten.');
                    $.inidb.del('points', keys[i]);
                    count++;
                }
            }
            $.consoleLn('> Prozess beendet. ' + count + ' Nutzer wurden von der Punkte Tabelle entfernt.');
            $.log.file(logName, '' + 'Bereinigung für die Punkte Tabelle wurde von ' + sender + ' ausgeführt. (' + count + ' Nutzer von der Punkte Tabelle entfernt)');
            running = false;
            return;
        }

        if (table.equalsIgnoreCase('all')) {
            var keys = $.inidb.GetKeyList('visited', ''),
                time = parseInt(amount),
                count = 0,
                t,
                i;

            $.consoleLn('>>> Prozess startet, dies kann einige Minuten in Anspruch nehmen...');
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
                    $.consoleLn('>> Entferne ' + keys[i] + ' von der Datenbank.');
                    count++;
                }
            }
            $.consoleLn('> Prozess beendet. ' + count + ' Nutzer wurden von der Punkte Tabelle entfernt.');
            $.log.file(logName, '' + 'Bereinigung wurde von ' + sender + ' ausgeführt. (' + count + ' Nutzer aus der Datenbank entfernt)');
            running = false;
            return;
        }
        $.log.error('Befehle: cleanup [time / points / all] [Anzahl der Zeit in Sekunden oder Punkte wenn Punkte gereinigt werden]');
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
        $.registerChatCommand('./systems/cleanupSystem.js', 'cleanup', 1);
    });
})();
