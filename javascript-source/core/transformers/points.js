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

(function () {
    var cmd, match, temp;

    /*
     * @transformer addpoints
     * @formula (addpoints amount:int) add points to the sender
     * @formula (addpoints amount:int user:str) add points to the given user
     * @labels twitch commandevent points
     */
    function addpoints(args) {
        var pargs = $.parseArgs(args.args, ' ');

        if (pargs !== null && !isNaN(pargs[0])) {
            var user = args.event.getSender();
            var amount = parseInt(pargs[0]);

            if (pargs.length > 1) {
                user = pargs[1].toLowerCase();
                if (!$.username.exists(user)) {
                    user = null;
                }
            }

            if (user !== null) {
                $.inidb.incr('points', user, amount);
            }
        }

        return {
            result: ''
        };
    }

    /*
     * @transformer addpointstoall
     * @formula (addpointstoall amount:int) add points to all users currently in chat
     * @labels twitch commandevent points
     */
    function addpointstoall(args) {
        var pargs = $.parseArgs(args.args);

        if (pargs !== null && !isNaN(pargs[0])) {
            var amount = parseInt(pargs[0]);

            $.giveAll(amount, args.event.getSender());
        }

        return {
            result: ''
        };
    }

    /*
     * @transformer pay
     * @formula (pay) outputs the number of points the sender has gained by using this command
     * @formula (pay command:str) outputs the number of points the sender would gain if they use the specified command
     * @labels twitch commandevent points
     * @cached
     */
    function pay(args) {
        if ((match = args.args.match(/^(?:\s(.*))?$/))) {
            cmd = match[1] || '';
            if (cmd.length === 0) {
                cmd = args.event.getCommand();
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
     * @formula (pointname amount:int) the single or plural name of the loyalty points, depending on the amount provided
     * @labels twitch noevent points
     * @example Caster: !addcom !pointsname (sender) current points name is set to: (pointname)
     * User: !pointsname
     * Bot: User current points name is set to: points
     */
    function pointname(args) {
        var pointName = $.pointNameMultiple;
        if (args.args !== '' && !isNaN(args.args.trim())) {
            if (parseInt(args.args.trim()) === 1) {
                pointName = $.pointNameSingle;
            }
        }

        return {
            result: pointName,
            cache: true
        };
    }

    /*
     * @transformer points
     * @formula (points) points of the sender
     * @formula (points user:str) points of the given user
     * @labels twitch commandevent points
     * @cached
     */
    function points(args) {
        if ((match = args.args.match(/^(?:\s(.*))?$/))) {
            var user;
            user = (match[1] || '').replace(/^@/, '');
            if (user.length === 0) {
                user = args.event.getSender();
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
     * @labels twitch commandevent points
     * @example Caster: !addcom !cost This command costs (price) (pointname)
     * User: !cost
     * Bot: This command costs 10 points
     * @cached
     */
    function price(args) {
        if ((match = args.args.match(/^(?:\s(.*))?$/))) {
            cmd = match[1] || '';
            if (cmd.length === 0) {
                cmd = args.event.getCommand();
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

    /*
     * @transformer takepoints
     * @formula (takepoints amount:int) take points from the sender
     * @formula (takepoints amount:int user:str) take points from the given user
     * @labels twitch commandevent points
     */
    function takepoints(args) {
        var pargs = $.parseArgs(args.args, ' ');

        if (pargs !== null && !isNaN(pargs[0])) {
            var user = args.event.getSender();
            var amount = parseInt(pargs[0]);

            if (pargs.length > 1) {
                user = pargs[1].toLowerCase();
                if (!$.username.exists(user)) {
                    user = null;
                }
            }

            if (user !== null) {
                if ($.inidb.GetInteger('points', '', user) > amount) {
                    $.inidb.decr('points', user, amount);
                } else {
                    $.inidb.SetInteger('points', '', user, 0);
                }
            }
        }

        return {
            result: ''
        };
    }

    /*
     * @transformer takepointsfromall
     * @formula (takepointsfromall amount:int) take points from all users currently in chat
     * @labels twitch commandevent points
     */
    function takepointsfromall(args) {
        var pargs = $.parseArgs(args.args);

        if (pargs !== null && !isNaN(pargs[0])) {
            var amount = parseInt(pargs[0]);

            $.takeAll(amount, args.event.getSender());
        }

        return {
            result: ''
        };
    }

    /*
     * @transformer transferpoints
     * @formula (transferpoints amount:int touser:str) transfer points from the sender to the given user
     * @formula (transferpoints amount:int touser:str fromuser:str) transfer points from the given fromuser to the given touser
     * @labels twitch commandevent points
     */
    function transferpoints(args) {
        var pargs = $.parseArgs(args.args, ' ');

        if (pargs !== null && !isNaN(pargs[0]) && pargs.length > 1) {
            var fromuser = args.event.getSender();
            var touser = pargs[1].toLowerCase();
            var amount = parseInt(pargs[0]);

            if (pargs.length > 2) {
                fromuser = pargs[2].toLowerCase();
                if (!$.username.exists(fromuser)) {
                    fromuser = null;
                }
            }

            if (!$.username.exists(touser)) {
                touser = null;
            }

            if (fromuser !== null && touser !== null) {
                if ($.inidb.GetInteger('points', '', fromuser) >= amount) {
                    $.inidb.decr('points', fromuser, amount);
                    $.inidb.incr('points', touser, amount);
                }
            }
        }

        return {
            result: ''
        };
    }

    var transformers = [
        new $.transformers.transformer('addpoints', ['twitch', 'commandevent', 'points'], addpoints),
        new $.transformers.transformer('addpointstoall', ['twitch', 'commandevent', 'points'], addpointstoall),
        new $.transformers.transformer('pay', ['twitch', 'commandevent', 'points'], pay),
        new $.transformers.transformer('pointname', ['twitch', 'noevent', 'points'], pointname),
        new $.transformers.transformer('points', ['twitch', 'commandevent', 'points'], points),
        new $.transformers.transformer('price', ['twitch', 'commandevent', 'points'], price),
        new $.transformers.transformer('takepoints', ['twitch', 'commandevent', 'points'], takepoints),
        new $.transformers.transformer('takepointsfromall', ['twitch', 'commandevent', 'points'], takepointsfromall),
        new $.transformers.transformer('transferpoints', ['twitch', 'commandevent', 'points'], transferpoints)
    ];

    $.transformers.addTransformers(transformers);
})();
