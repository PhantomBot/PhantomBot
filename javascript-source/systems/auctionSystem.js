(function() {
    var auction = {
        increments: 0,
        minimum: 0,
        topUser: 0,
        topPoints: 0,
        timer: 0,
        status: false,
    },
    a,
    b;

    /**
     * @function openAuction
     *
     * @param {string} user 
     * @param {int} increments 
     * @param {int} minimum 
     * @param {int} timer 
     */
    function openAuction(user, increments, minimum, timer) {
        if (auction.status) {
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

        auction.status = true;

        $.say($.lang.get('auctionsystem.opened', $.getPointsString(increments), $.getPointsString(minimum)));

        if (timer > 0) {
            $.say($.lang.get('auctionsystem.auto.timer.msg', timer));
            a = setTimeout(function() {
                warnAuction(true);
                clearInterval(a);
            }, (timer / 2) * 1000);
            b = setTimeout(function() {
                closeAuction();
                clearInterval(b);
            }, timer * 1000);
        }
    };

    /**
     * @function closeAuction
     *
     * @param {string} user 
     */
    function closeAuction(user) {
        if (!auction.status) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
            return;
        }

        clearInterval(a);
        clearInterval(b);

        if (!auction.topUser) {
            auction.status = false;
            $.say($.lang.get('auctionsystem.err.no.bids'));
            return;
        }

        auction.status = false;
        $.inidb.decr('points', auction.topUser, auction.topPoints);
        $.say($.lang.get('auctionsystem.closed', auction.topUser, $.getPointsString(auction.topPoints)));
        setTimeout(function () {
            resetAuction();
        }, 1000);
    };

    /**
     * @function warnAuction
     *
     * @param {boolean} force 
     */
    function warnAuction(force, user) {
        if (!auction.status) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
            return;
        }

        if (force) {
            $.say($.lang.get('auctionsystem.warn.force', auction.topUser, $.getPointsString(auction.topPoints), $.getPointsString((auction.topPoints + auction.increments))));
        } else {
            $.say($.lang.get('auctionsystem.warn', auction.topUser, $.getPointsString(auction.topPoints)));
        }
    };

    /**
     * @function bid
     *
     * @param {string} user 
     * @param {int} amount 
     */
    function bid(user, amount) {
        if (!auction.status) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.closed'));
            return;
        }

        if (!(amount = parseInt(amount))) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.bid.usage'));
            return;
        } else if (amount < auction.minimum) {
            $.say($.lang.get('auctionsystem.err.bid.minimum', $.getPointsString(auction.minimum)));
            return;
        } else if (amount > $.getUserPoints(user)) {
            $.say($.whisperPrefix(user) + $.lang.get('auctionsystem.err.points', $.pointNameMultiple));
            return;
        } else if (amount < (auction.topPoints + auction.increments)) {
            $.say($.lang.get('auctionsystem.err.increments', $.getPointsString(auction.increments)));
            return;
        }

        auction.topUser = user;
        auction.topPoints = amount;

        $.inidb.set('auctionresults', 'winner', auction.topUser);
        $.inidb.set('auctionresults', 'amount', auction.topPoints);
    };

    /**
     * @function resetAuction
     */
    function resetAuction() {
        auction.increments = 0;
        auction.minimum = 0;
        auction.topUser = 0;
        auction.topPoints = 0;
        auction.timer = 0;
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
             * @commandpath auction open [increments] [minimum bet] [timer] - Opens an auction; timer is optional.
             */
            if (action.equalsIgnoreCase('open')) {
                openAuction(sender, args[1], args[2], args[3]);
            }

            /**
             * @commandpath auction close - Closes an open auction
             */
            if (action.equalsIgnoreCase('close')) {
                closeAuction(sender);
            }

            /**
             * @commandpath auction warn - Shows the top bidder in an auction
             */
            if (action.equalsIgnoreCase('warn')) {
                warnAuction(sender);
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
        if ($.bot.isModuleEnabled('./systems/auctionSystem.js')) {
            $.registerChatCommand('./systems/auctionSystem.js', 'auction', 2);
            $.registerChatCommand('./systems/auctionSystem.js', 'bid', 7);
        }
    });
})();
