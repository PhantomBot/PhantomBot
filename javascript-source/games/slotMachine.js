/**
 * slotMachine.js
 *
 * When the user uses the slots, the bot will generate three random numbers.
 * These numbers represent an emote. Each emote has a value.
 * The amount of points; corresponding to the output, will be added to the user's balance.
 */
(function() {
    var emotes = ['Kappa', 'KappaPride', 'BloodTrail', 'ResidentSleeper', 'deIlluminati'],
        prizes = [];

    /* Set default prizes in the DB for the Panel */
    $.getSetIniDbNumber('slotmachine', 'prizes_0', 75);
    $.getSetIniDbNumber('slotmachine', 'prizes_1', 150);
    $.getSetIniDbNumber('slotmachine', 'prizes_2', 300);
    $.getSetIniDbNumber('slotmachine', 'prizes_3', 450);
    $.getSetIniDbNumber('slotmachine', 'prizes_4', 1000);
        
    /**
     * @function loadPrizes
     */
    function loadPrizes() {
        prizes[0] = $.getSetIniDbNumber('slotmachine', 'prizes_0', 75);
        prizes[1] = $.getSetIniDbNumber('slotmachine', 'prizes_1', 150);
        prizes[2] = $.getSetIniDbNumber('slotmachine', 'prizes_2', 300);
        prizes[3] = $.getSetIniDbNumber('slotmachine', 'prizes_3', 450);
        prizes[4] = $.getSetIniDbNumber('slotmachine', 'prizes_4', 1000);
    }

    /**
     * @function getEmoteKey
     * @returns {Number}
     */
    function getEmoteKey() {
        var rand = $.randRange(1, 1000);
        if (rand <= 75) {
            return 4;
        }
        if (rand > 75 && rand <= 200) {
            return 3;
        }
        if (rand > 200 && rand <= 450) {
            return 2;
        }
        if (rand > 450 && rand <= 700) {
            return 1;
        }
        if (rand > 700) {
            return 0;
        }
    };

    /**
     * @function calculateResult
     * @param {string} sender
     */
    function calculateResult(sender) {
        var e1 = getEmoteKey(),
            e2 = getEmoteKey(),
            e3 = getEmoteKey(),
            message = $.lang.get('slotmachine.result.start', $.username.resolve(sender), emotes[e1], emotes[e2], emotes[e3]);

        loadPrizes();

        if (e1 == e2 && e2 == e3) {
            message += $.lang.get('slotmachine.result.win', $.getPointsString(prizes[e1]));
            $.inidb.incr('points', sender, prizes[e1]);
            $.say(message + $.gameMessages.getWin(sender));
            return;
        }
        
        if (e1 == e2 || e2 == e3 || e3 == e1) {
            message += $.lang.get('slotmachine.result.win', $.getPointsString(Math.floor(prizes[Math.min(e1, e2, e3)] / 3)));
            $.inidb.incr('points', sender, Math.floor(prizes[Math.min(e1, e2, e3)] / 3));
            $.say(message + $.gameMessages.getWin(sender));
            return;
        }
        $.say(message + $.gameMessages.getLose(sender));
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = (event.getCommand() + '').toLowerCase(),
            sender = event.getSender().toLowerCase(),
            args = event.getArgs();

        /**
         * @commandpath slot - Play the slot machines for some points
         */
        if (command.equalsIgnoreCase('slot')) {
            /**
             * @commandpath slot rewards [val1] [val2] [val3] [val4] [val5] - Set the reward values for the slots.
             */
            if (args[0] !== undefined) {
                if (args[0].equalsIgnoreCase('rewards')) {
                    if (args.length != 6) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.rewards.usage', prizes.join(' ')));
                        return;
                    }

                    if (isNaN(args[1]) || isNaN(args[2]) || isNaN(args[3]) || isNaN(args[4]) || isNaN(args[5])) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.rewards.usage', prizes.join(' ')));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.rewards.success'));
                    $.inidb.set('slotmachine', 'prizes_0', args[1]);
                    $.inidb.set('slotmachine', 'prizes_1', args[2]);
                    $.inidb.set('slotmachine', 'prizes_2', args[3]);
                    $.inidb.set('slotmachine', 'prizes_3', args[4]);
                    $.inidb.set('slotmachine', 'prizes_4', args[5]);
                    return;
                }
            }

            /* Slot machine */
            calculateResult(sender);
        }

    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/slotMachine.js')) {
            $.registerChatCommand('./games/slotMachine.js', 'slot', 7);
            $.registerChatSubcommand('slot', 'reward', 1);
        }
    });

    /**
     * Warn the user if the points system is disabled and this is enabled.
     */
    if ($.bot.isModuleEnabled('./games/slotMachine.js') && !$.bot.isModuleEnabled('./systems/pointSystem.js')) {
        $.log.error("Disabled. ./systems/pointSystem.js is not enabled.");
    }
})();
