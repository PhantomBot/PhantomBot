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

    /**
     * @function reloadTop
     * @export $
     */
    function reloadTop() {
        amountPoints = $.getIniDbNumber('settings', 'topListAmountPoints');
        amountTime = $.getIniDbNumber('settings', 'topListAmountTime');
    }

    /**
     * @function getTop5
     *
     * @param {string} iniName
     * @returns {Array}
     * @export $
     */
    function getTop5(iniName) {
        let list = [],
            ctr = 0,
            amount = (iniName === 'points' ? amountPoints : amountTime),
            keys = $.inidb.GetKeysByNumberOrderValue(iniName, '', 'DESC', amount + 2, 0);

        for (let i in keys) {
            if (!$.isBot(keys[i]) && !$.isOwner(keys[i])) {
                if (ctr++ === amount) {
                    break;
                }

                list.push({
                    username: keys[i],
                    value: $.getIniDbString(iniName, keys[i])
                });
            }
        }

        list.sort(function(a, b) {
            return (b.value - a.value);
        });

        list = list.slice(0, amountPoints);

        let top = [],
                type = (iniName === 'points' ? $.pointNameMultiple : 'time');
        for (let i = 0; i < list.length; i++) {
            let string = (iniName === 'points' ? $.getPointsString(list[i].value) : $.getTimeString(list[i].value, true));
            top.push((parseInt(i) + 1) + '. ' + $.resolveRank(list[i].username) + ' ' + string);
        }

        return $.lang.get('top5.default', amount, type, top.join(', '));
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        let command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender(),
            action = args[0];

        /**
         * @commandpath top - Display the top people with the most points
         */
        if ($.equalsIgnoreCase(command, 'top')) {
            if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
                return;
            }

            $.say(getTop5('points'));
            return;
        }

        /**
         * @commandpath toptime - Display the top people with the most time
         */
        if ($.equalsIgnoreCase(command, 'toptime')) {
            $.say(getTop5('time'));
            return;
        }

        /**
         * @commandpath topamount - Set how many people who will show up in the !top points list
         */
        if ($.equalsIgnoreCase(command, 'topamount')) {
            if (action === undefined || isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.usage'));
                return;
            }
            if (parseInt(action) > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountPoints = parseInt(action);
            $.inidb.set('settings', 'topListAmountPoints', amountPoints);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.set', amountPoints));
            return;
        }

        /**
         * @commandpath toptimeamount - Set how many people who will show up in the !toptime list
         */
        if ($.equalsIgnoreCase(command, 'toptimeamount')) {
            if (action === undefined || isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.usage'));
                return;
            }
            if (parseInt(action) > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountTime = parseInt(action);
            $.inidb.set('settings', 'topListAmountTime', amountTime);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.set', amountTime));
            return;
        }

        /**
         * @commandpath reloadtopbots - DEPRECATED. Use !reloadbots
         */
        if ($.equalsIgnoreCase(command, 'reloadtopbots')) {
            $.say($.whisperPrefix(sender) + $.lang.get('top5.reloadtopbots'));
            return;
        }

        /**
         * Panel command, no command path needed.
         */
        if ($.equalsIgnoreCase(command, 'reloadtop')) {
            reloadTop();
            return;
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

    $.getTop5 = getTop5;
    $.reloadTop = reloadTop;
})();
