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

(function() {
    var auction = {
            increments: 0,
            minimum: 0,
            topUser: 'None',
            topPoints: 0,
            timer: 0,
            isActive: false,
            isEnding: false,
            usePoints: true
        },
        a,
        b,
        c,
        //endTimer,
        extTime = $.getSetIniDbNumber('auctionSettings', 'extTime', 15),
        warnTime = 10;


    /**
     * @function usePoints
     *
     * @param {bool} state
     */
    function usePoints(state){
        if (!auction.isActive) { auction.usePoints = state; }
    }
    
    /**
     * @function openAuction
     *
     * @param {string} user
     * @param {int} increments
     * @param {int} minimum
     * @param {int} timer
     */
    function openAuction(user, increments, minimum, timer) {
        if (auction.isActive) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.opened'));
            return;
        }

        if (!increments || !minimum) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.usage'));
            return;
        }

        if (increments) {
            auction.increments = parseInt(increments);
        }

        if (minimum) {
            auction.minimum = parseInt(minimum);
        }

        if (timer) {
            auction.timer = parseInt(timer);
        }

        auction.isActive = true;


        $.say($.lang.get('auctionsystem.opened', ((auction.usePoints) ? $.getPointsString(increments): increments), ((auction.usePoints) ? $.getPointsString(minimum) : minimum)));

        if (timer > 0) {
            $.say($.lang.get('auctionsystem.auto.timer.msg', timer));
            if (timer > 30) {
                a = setTimeout(function() { //Warn once 30 seconds before the end
                    warnAuction(true, undefined, 30);
                    clearInterval(a);
                }, (timer - 30)  * 1000);
            }
            /*endTimer = setTimeout(function() { //10 Seconds left -> set ending variable
                auction.isEnding = true;
                clearInterval(endTimer);
            }, (timer - warnTime)  * 1000);*/
            b = setTimeout(function() { //Warn 10 seconds before end
                auction.isEnding = true;
                warnAuction(true, undefined, warnTime);
                clearInterval(b);
            }, (timer - warnTime)  * 1000);
            c = setTimeout(function() { //Close Auction when timer has run out
                closeAuction();
                clearInterval(c);
            }, timer * 1000);
        }
        $.inidb.SetBoolean('auctionSettings', '', 'isActive', true);
    };

    /**
     * @function closeAuction
     *
     * @param {string} user
     */
    function closeAuction(user) {
        if (!auction.isActive) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
            return;
        }

        clearInterval(a);
        //clearInterval(endTimer);
        clearInterval(b);
        clearInterval(c);

        if (!auction.topUser) {
            auction.isActive = false;
            auction.isEnding = false;
            auction.usePoints = false;
            $.say($.lang.get('auctionsystem.err.no.bids'));
            return;
        }

        auction.isActive = false;
        auction.isEnding = false;

        if(auction.usePoints){
            $.inidb.decr('points', auction.topUser, auction.topPoints);
        }

        $.say($.lang.get('auctionsystem.closed', auction.topUser, (auction.usePoints) ? $.getPointsString(auction.topPoints) : auction.topPoints));

        setTimeout(function() {
            resetAuction();
        }, 1000);

        $.inidb.SetBoolean('auctionSettings', '', 'isActive', false);
    };
    
    /**
     * @function warnAuction
     *
     * @param {boolean} force
     */
    function warnAuction(force, user, time) {
        if (!auction.isActive) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
            return;
        }

        if(time !== undefined ) {
            if (auction.usePoints && force) {
                $.say($.lang.get('auctionsystem.warnTime.force', time, auction.topUser, $.getPointsString(auction.topPoints), $.getPointsString((auction.topPoints + auction.increments))));
            } else if(auction.usePoints) {
                $.say($.lang.get('auctionsystem.warnTime', time, auction.topUser, $.getPointsString(auction.topPoints)));
            } else if (force) {
                $.say($.lang.get('auctionsystem.warnTime.force', time, auction.topUser, auction.topPoints, (auction.topPoints + auction.increments)));
            } else {
                $.say($.lang.get('auctionsystem.warnTime', time, auction.topUser, auction.topPoints));
            }
        } else {
            if (auction.usePoints && force) {
                $.say($.lang.get('auctionsystem.warnTime.force', auction.topUser, $.getPointsString(auction.topPoints), $.getPointsString((auction.topPoints + auction.increments))));
            } else if(auction.usePoints) {
                $.say($.lang.get('auctionsystem.warnTime', auction.topUser, $.getPointsString(auction.topPoints)));
            } else if (force) {
                $.say($.lang.get('auctionsystem.warnTime.force', auction.topUser, auction.topPoints, (auction.topPoints + auction.increments)));
            } else {
                $.say($.lang.get('auctionsystem.warnTime', auction.topUser, auction.topPoints));
            }
        }

        
    };

    /**
     * @function bid
     *
     * @param {string} user
     * @param {int} amount
     */
    function bid(user, amount) {
        if (!auction.isActive) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
            return;
        }

        if (amount === undefined|| isNaN(parseInt(amount))) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.bid.usage'));
            return;
        }

        amount = parseInt(amount);

        if (amount < auction.minimum) {
            $.say($.lang.get('auctionsystem.err.bid.minimum', ((auction.usePoints) ? $.getPointsString(auction.minimum) :auction.minimum + '$')));
            return;
        } else if (auction.usePoints && amount > $.getUserPoints(user)) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.points', $.pointNameMultiple, $.getPointsString($.getUserPoints(user))));
            return;
        } else if (amount < (auction.topPoints + auction.increments)) {
            $.say($.lang.get('auctionsystem.err.increments', ((auction.usePoints) ? $.getPointsString(auction.increments) : auction.increments), auction.topPoints + auction.increments));
            return;
        }

        auction.topUser = user;
        auction.topPoints = amount;
        
        if(auction.isEnding) {
            clearInterval(c);
            clearInterval(b);
            b = setTimeout(function() { //Warn about new highest bid 5 seconds after the bid ... prevents spam in case of a bid war at the end since the timer gets reset upon a new bid
                auction.isEnding = true;
                if(auction.usePoints){
                    $.say($.lang.get('auctionsystem.warnTime.newBid', extTime-5, auction.topUser, $.getPointsString(auction.topPoints), $.getPointsString((auction.topPoints + auction.increments))));
                    
                } else {
                    $.say($.lang.get('auctionsystem.warnTime.newBid', extTime-5, auction.topUser, auction.topPoints, (auction.topPoints + auction.increments)));
                }
                clearInterval(b);
            }, 5  * 1000);
            c = setTimeout(function() { //Extend closing time by extTime seconds
                closeAuction();
                clearInterval(c);
            }, extTime * 1000);
        }

        $.inidb.set('auctionresults', 'winner', auction.topUser);
        $.inidb.set('auctionresults', 'amount', auction.topPoints);
    };

    /**
     * @function resetAuction
     */
    function resetAuction() {
        clearInterval(a);
        //clearInterval(endTimer);
        clearInterval(b);
        clearInterval(c);
        auction.increments = 0;
        auction.minimum = 0;
        auction.topUser = 0;
        auction.topPoints = 0;
        auction.timer = 0;
        auction.isEnding = false;
        auction.usePoints = true;
        auction.isActive = false;
        $.inidb.SetBoolean('auctionSettings', '', 'isActive', false);
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath auction - Primary auction command
         */
        if (command.equalsIgnoreCase('auction')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.usage'));
                return;
            }

            /**
             * @commandpath auction open [increments] [minimum bet] [timer] [nopoints] - Opens an auction; timer is optional; nopoints is optional and starts an auction without affecting the users' points
             */
            if (action.equalsIgnoreCase('open')) {
                usePoints(args[4] === undefined && !$.equalsIgnoreCase(args[4], 'nopoints')); //Enable Auction without Points
                openAuction(sender, args[1], args[2], args[3]);
                return;
            }

            /**
             * @commandpath auction close - Closes an open auction
             */
            if (action.equalsIgnoreCase('close')) {
                closeAuction(sender);
                return;
            }

            /**
             * @commandpath auction reset - Resets the auction.
             */
            if (action.equalsIgnoreCase('reset')) {
                resetAuction();
                return;
            }

            /**
             * @commandpath auction warn - Shows the top bidder in an auction
             */
            if (action.equalsIgnoreCase('warn')) {
                warnAuction(undefined, sender, undefined);
                return;
            }

            /**
             * @commandpath auction lastWinner - Shows the last auctions' winner and its winning bid
             */
             if (action.equalsIgnoreCase('lastWinner')) {
                var user = $.getIniDbString('auctionresults', 'winner'),
                    amount = $.getIniDbNumber('auctionresults', 'amount');

                if(isNaN(amount)){
                    $.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.lastWinner.err'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.lastWinner', user, amount));
                }
                return;
            }

            /**
             * @commandpath auction setExtensionTime [extension time] - Sets the time being added to the endtimer if a bid is set in the last 10 seconds (maximum value is 29)
             */
             if (action.equalsIgnoreCase('setExtensionTime')) {
                if(args[1] === undefined || isNaN(parseInt(args[1]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.set.usage'));
                    return;
                }
                extTime = parseInt(args[1]);
                if (extTime >= 30 || extTime <= 5) {
                    $.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.set.usage'));
                }
                $.setIniDbNumber('auctionSettings', 'extTime', parseInt(extTime));
                $.say($.whisperPrefix(sender) + $.lang.get('auctionsystem.set', extTime));
            }
        }

        /**
         * @commandpath bid [amount] - Amount to bid on the current auction
         */
        if (command.equalsIgnoreCase('bid')) {
            bid(sender, action);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/auctionSystem.js', 'auction', 7);
        $.registerChatSubcommand('auction', 'open', 2);
        $.registerChatSubcommand('auction', 'close', 2);
        $.registerChatSubcommand('auction', 'setExtensionTime', 2);
        $.registerChatSubcommand('auction', 'reset', 2);
        $.registerChatSubcommand('auction', 'warn', 2);
        $.registerChatSubcommand('auction', 'lastWinner', 7);
        $.registerChatCommand('./systems/auctionSystem.js', 'bid', 7);

        $.inidb.SetBoolean('auctionSettings', '', 'isActive', false);
    });
})();