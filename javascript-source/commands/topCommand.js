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

/**
 * topCommand.js
 *
 * Build and announce lists of top viewers (Highest points, highest time spent in the channel)
 */
(function() {
    var amountPoints = $.getSetIniDbNumber('settings', 'topListAmountPoints', 5),
        amountTime = $.getSetIniDbNumber('settings', 'topListAmountTime', 5);

    /*
     * @function reloadTop
     */
    function reloadTop() {
        amountPoints = $.getIniDbNumber('settings', 'topListAmountPoints');
        amountTime = $.getIniDbNumber('settings', 'topListAmountTime');
    }

    /*
     * @function getTop5
     *
     * @param {string} iniName
     * @returns {Array}
     */
    function getTop5(iniName) {
        var keys = $.inidb.GetKeysByNumberOrderValue(iniName, '', 'DESC', (iniName.equals('points') ? amountPoints + 2: amountTime + 2), 0),
            list = [],
            i,
            ctr = 0;

        for (i in keys) {
            if (!$.isBot(keys[i]) && !$.isOwner(keys[i])) {
                if (ctr++ === (iniName.equals('points') ? amountPoints : amountTime)) {
                    break;
                }
                list.push({
                    username: keys[i],
                    value: $.inidb.get(iniName, keys[i])
                });
            }
        }

        list.sort(function(a, b) {
            return (b.value - a.value);
        });

        if (iniName.equals('points')) {
            return list.slice(0, amountPoints);
        } else {
            return list.slice(0, amountTime);
        }
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender(),
            action = args[0];

        /**
         * @commandpath top - Display the top people with the most points
         */
        if (command.equalsIgnoreCase('top')) {
            if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
                return;
            }

            var temp = getTop5('points'),
                top = [],
                i;

            for (i in temp) {
                top.push((parseInt(i) + 1) + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getPointsString(temp[i].value));
            }

            $.say($.lang.get('top5.default', amountPoints, $.pointNameMultiple, top.join(', ')));
            return;
        }

        /*
         * @commandpath toptime - Display the top people with the most time
         */
        if (command.equalsIgnoreCase('toptime')) {
            var temp = getTop5('time'),
                top = [],
                i;

            for (i in temp) {
                top.push((parseInt(i) + 1) + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getTimeString(temp[i].value, true));
            }

            $.say($.lang.get('top5.default', amountTime, 'time', top.join(', ')));
            return;
        }

        /*
         * @commandpath topamount - Set how many people who will show up in the !top points list
         */
        if (command.equalsIgnoreCase('topamount')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.usage'));
                return;
            } else if (action > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountPoints = action;
            $.inidb.set('settings', 'topListAmountPoints', amountPoints);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.set', amountPoints));
        }

        /*
         * @commandpath toptimeamount - Set how many people who will show up in the !toptime list
         */
        if (command.equalsIgnoreCase('toptimeamount')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.usage'));
                return;
            } else if (action > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountTime = action;
            $.inidb.set('settings', 'topListAmountTime', amountTime);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.set', amountTime));
        }

        /*
         * @commandpath reloadtopbots - DEPRECATED. Use !reloadbots
         */
        if (command.equalsIgnoreCase('reloadtopbots')) {
            $.say($.whisperPrefix(sender) + $.lang.get('top5.reloadtopbots'));
        }

        /*
         * Panel command, no command path needed.
         */
        if (command.equalsIgnoreCase('reloadtop')) {
            reloadTop();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/topCommand.js', 'top', $.PERMISSION.Viewer);
        $.registerChatCommand('./commands/topCommand.js', 'toptime', $.PERMISSION.Viewer);
        $.registerChatCommand('./commands/topCommand.js', 'topamount', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/topCommand.js', 'toptimeamount', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/topCommand.js', 'reloadtop', $.PERMISSION.Admin);
        $.registerChatCommand('./commands/topCommand.js', 'reloadtopbots', $.PERMISSION.Admin);
    });
})();
