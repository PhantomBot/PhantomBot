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

/**
 * roll.js
 *
 * A game where the bot will generate two random dices and award the sender with the points corresponding to the output.
 */
(function() {
    var prizes = [];

    /* Set default prices in the DB for the Panel */
    $.getSetIniDbNumber('rollprizes', 'prizes_0', 4);
    $.getSetIniDbNumber('rollprizes', 'prizes_1', 16);
    $.getSetIniDbNumber('rollprizes', 'prizes_2', 36);
    $.getSetIniDbNumber('rollprizes', 'prizes_3', 64);
    $.getSetIniDbNumber('rollprizes', 'prizes_4', 100);
    $.getSetIniDbNumber('rollprizes', 'prizes_5', 144);

    /**
     * @function loadPrizes
     */
    function loadPrizes() {
        prizes[0] = $.getSetIniDbNumber('rollprizes', 'prizes_0', 4);
        prizes[1] = $.getSetIniDbNumber('rollprizes', 'prizes_1', 16);
        prizes[2] = $.getSetIniDbNumber('rollprizes', 'prizes_2', 36);
        prizes[3] = $.getSetIniDbNumber('rollprizes', 'prizes_3', 64);
        prizes[4] = $.getSetIniDbNumber('rollprizes', 'prizes_4', 100);
        prizes[5] = $.getSetIniDbNumber('rollprizes', 'prizes_5', 144);
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            dice1,
            dice2,
            resultMessage;

        /**
         * @commandpath roll - Roll the dice for some points
         */
        if (command.equalsIgnoreCase('roll')) {

            /**
             * @commandpath roll rewards [double 1's] [2's] [3's] [4's] [5's] [6's] - Set the reward for each set of doubles.
             */
            if (args[0] !== undefined) {
                if (args[0].equalsIgnoreCase('rewards')) {
                    if (args.length != 7) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + $.lang.get('roll.rewards.usage', prizes.join(' ')));
                        return;
                    }

                    if (isNaN(args[1]) || isNaN(args[2]) || isNaN(args[3]) || isNaN(args[4]) || isNaN(args[5]) || isNaN(args[6])) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + $.lang.get('roll.rewards.usage', prizes.join(' ')));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('roll.rewards.success'));
                    $.inidb.set('rollprizes', 'prizes_0', args[1]);
                    $.inidb.set('rollprizes', 'prizes_1', args[2]);
                    $.inidb.set('rollprizes', 'prizes_2', args[3]);
                    $.inidb.set('rollprizes', 'prizes_3', args[4]);
                    $.inidb.set('rollprizes', 'prizes_4', args[5]);
                    $.inidb.set('rollprizes', 'prizes_5', args[6]);
                    return;
                }
            }

            dice1 = $.randRange(1, 6);
            dice2 = $.randRange(1, 6);
            resultMessage = $.lang.get('roll.rolled', $.resolveRank(sender), dice1, dice2);

            if (dice1 == dice2) {
                loadPrizes();
                switch (dice1) {
                    case 1:
                        resultMessage += $.lang.get('roll.doubleone', $.getPointsString(prizes[dice1 - 1]));
                        break;
                    case 2:
                        resultMessage += $.lang.get('roll.doubletwo', $.getPointsString(prizes[dice1 - 1]));
                        break;
                    case 3:
                        resultMessage += $.lang.get('roll.doublethree', $.getPointsString(prizes[dice1 - 1]));
                        break;
                    case 4:
                        resultMessage += $.lang.get('roll.doublefour', $.getPointsString(prizes[dice1 - 1]));
                        break;
                    case 5:
                        resultMessage += $.lang.get('roll.doublefive', $.getPointsString(prizes[dice1 - 1]));
                        break;
                    case 6:
                        resultMessage += $.lang.get('roll.doublesix', $.getPointsString(prizes[dice1 - 1]));
                        break;
                }

                $.say(resultMessage + $.gameMessages.getWin(sender, 'roll'));
                $.inidb.incr('points', sender, prizes[dice1 - 1]);
            } else {
                $.say(resultMessage + $.gameMessages.getLose(sender, 'roll'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./games/roll.js', 'roll');
        $.registerChatSubcommand('roll', 'rewards', 1);
    });


    $.loadPrizes = loadPrizes;
})();
