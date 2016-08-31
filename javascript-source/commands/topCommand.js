/**
 * topCommand.js
 *
 * Build and announce lists of top viewers (Highest points, highest time spent in the channel)
 */
(function() {
    var bots = ['moobot', 'nightbot', 'xanbot', 'hnlbot', 'ohbot', 'wizebot', 'vivbot', 'coebot', 'branebot', 'monstercat'], // Add your own name that you want to be in the list here.
        amountPoints = $.getSetIniDbNumber('settings', 'topListAmountPoints', 5),
        amountTime = $.getSetIniDbNumber('settings', 'topListAmountTime', 5);

     /**
     * @function reloadTop
     */
    function reloadTop() {
        amountPoints = $.getIniDbNumber('settings', 'topListAmountPoints');
        amountTime = $.getIniDbNumber('settings', 'topListAmountTime');
    };

    /**
     * @function isTwitchBot
     * @param {string} username
     * @returns {Boolean}
     */
    function isTwitchBot(username) {
        var i;
        for (i in bots) {
            if (bots[i].equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
    };

    /**
     * @function getTop5
     * @param {string} iniName
     * @returns {Array}
     */
    function getTop5(iniName) {
        var keys = $.inidb.GetKeyList(iniName, ''),
            list = [],
            i;

        for (i in keys) {
            if (!$.isBot(keys[i]) && !$.isOwner(keys[i]) && !isTwitchBot(keys[i])) {
                list.push({
                    username: keys[i],
                    value: $.inidb.get(iniName, keys[i])
                });
            }
        }

        list.sort(function(a, b) {
            return (b.value - a.value);
        });

        if (iniName == 'points') {
            return list.splice(0, amountPoints);
        } else {
            return list.splice(0, amountTime);
        }
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender(),
            top5 = [],
            c = 1,
            temp,
            i;

        /**
         * @commandpath top - By default it will disaplay the top5 people with the most points. This can be changed.
         */
        if (command.equalsIgnoreCase('top')) {
            if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
                //$.say($.lang.get('top5.points-disabled')); * we don't need to spam.
                $.log.error('points system disabled.');
                return;
            }

            temp = getTop5('points');

            for (i in temp) {
                top5.push(c + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getPointsString(temp[i].value));
                c++;
            }

            $.say($.lang.get('top5.default', amountPoints, $.pointNameMultiple, top5.join(', ')));
            temp = "";
            top5 = [];
            list = [];//Saving memory here.
        }

        /**
         * @commandpath toptime - By default it will disaplay the top5 people with the most time. This can be changed.
         */
        if (command.equalsIgnoreCase('toptime')) {
            temp = getTop5('time');

            for (i in temp) {
                top5.push(c + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getTimeString(temp[i].value, true));
                c++;
            }

            $.say($.lang.get('top5.default', amountTime, 'time', top5.join(', ')));
            temp = "";
            top5 = [];
            list = [];//Saving memory here.
        }

        /**
         * @commandpath topamount - Set how many people who up in the !top points list.
         */
        if (command.equalsIgnoreCase('topamount')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.usage'));
                return;
            }
            if (args[0] > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountPoints = args[0];
            $.inidb.set('settings', 'topListAmountPoints', amountPoints);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.set', amountPoints));
        }

        /**
         * @commandpath toptimeamount - Set how many people who up in the !toptime list.
         */
        if (command.equalsIgnoreCase('toptimeamount')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.usage'));
                return;
            }
            if (args[0] > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountTime = args[0];
            $.inidb.set('settings', 'topListAmountTime', amountTime);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.set', amountTime));
        }

        if (command.equalsIgnoreCase('reloadtop')) {
            reloadTop();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/topCommand.js')) {
            $.registerChatCommand('./commands/topCommand.js', 'top', 7);
            $.registerChatCommand('./commands/topCommand.js', 'topamount', 1);
            $.registerChatCommand('./commands/topCommand.js', 'toptimeamount', 1);
            $.registerChatCommand('./commands/topCommand.js', 'reloadtop', 1);
            $.registerChatCommand('./commands/topCommand.js', 'toptime', 7);
        }
    });
})();
