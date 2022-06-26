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

(function () {
    var cmd, match, temp;

    /*
     * @transformer pay
     * @formula (pay) outputs the number of points the sender has gained by using this command
     * @formula (pay command:str) outputs the number of points the sender would gain if they use the specified command
     * @labels twitch command points
     * @cached
     */
    function pay(args, event) {
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            cmd = match[1] || '';
            if (cmd.length === 0) {
                cmd = event.getCommand();
            }
            if ($.inidb.exists('paycom', cmd)) {
                temp = $.inidb.get('paycom', cmd);
            } else {
                temp = 0;
            }
            return {
                result: $.getPoints($.jsString(temp)),
                cache: true
            };
        }
    }

    /*
     * @transformer pointname
     * @formula (pointname) the plural name of the loyalty points
     * @labels twitch command points
     * @example Caster: !addcom !pointsname (sender) current points name is set to: (pointname)
     * User: !pointsname
     * Bot: User current points name is set to: points
     */
    function pointname(args) {
        if (!args) {
            return {result: $.pointNameMultiple, cache: true};
        }
    }

    /*
     * @transformer points
     * @formula (points) points of the sender
     * @formula (points user:str) points of the given user
     * @labels twitch command points
     * @cached
     */
    function points(args, event) {
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            var user;
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = event.getSender();
            }
            return {
                result: $.getUserPoints(user),
                cache: true
            };
        }
    }

    /*
     * @transformer price
     * @formula (price) the number of points the sender paid to use this command
     * @formula (price command:str) the number of points the sender would pay if they use the specified command
     * @labels twitch command points
     * @example Caster: !addcom !cost This command costs (price) (pointname)
     * User: !cost
     * Bot: This command costs 10 points
     * @cached
     */
    function price(args, event) {
        if ((match = args.match(/^(?:\s(.*))?$/))) {
            cmd = match[1] || '';
            if (cmd.length === 0) {
                cmd = event.getCommand();
            }
            if ($.inidb.exists('pricecom', cmd)) {
                temp = $.inidb.get('pricecom', cmd);
            } else {
                temp = 0;
            }
            return {
                result: $.getPointsString(temp),
                cache: true
            };
        }
    }

    var transformers = [
        new $.transformers.transformer('pay', ['twitch', 'command', 'points'], pay),
        new $.transformers.transformer('pointname', ['twitch', 'command', 'points'], pointname),
        new $.transformers.transformer('points', ['twitch', 'command', 'points'], points),
        new $.transformers.transformer('price', ['twitch', 'command', 'points'], price)
    ];

    $.transformers.addTransformers(transformers);
})();
