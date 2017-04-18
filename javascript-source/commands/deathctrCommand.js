/*
 * deathCounter.js
 *
 * A death counter.
 */

(function() {
    /*
     * @function deathUpdateFile
     *
     * @param {String} game
     */
    function deathUpdateFile(game) {
        var deathFile = './addons/deathctr/deathctr.txt',
            deathCounter = parseInt($.inidb.get('deaths', game));

        if (!$.isDirectory('./addons/deathctr/')) {
            $.mkDir('./addons/deathctr');
        }
        if (isNaN(deathCounter)) {
            deathCounter = 0;
        }

        $.writeToFile(deathCounter.toFixed(0), deathFile, false);
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            game = ($.getGame($.channelName) != '' ? $.getGame($.channelName) : 'Some Game');

        /*
         * @commandpath deathctr - Display the current number of deaths in game being played.
         */
        if (command.equalsIgnoreCase('deathctr')) {
            if (action === undefined) {
                var deathCounter = parseInt($.inidb.get('deaths', game));
                if (isNaN(parseInt(deathCounter)) || parseInt(deathCounter) === 0) {
                    $.say($.lang.get('deathcounter.none', $.ownerName, game));
                } else {
                    $.say($.lang.get('deathcounter.counter', $.ownerName, game, deathCounter));
                }
            } else {
                /*
                 * @commandpath deathctr reset - Reset the death counter for the game being played.
                 */
                if (action.equalsIgnoreCase('reset')) {
                    var deathCounter = parseInt($.inidb.get('deaths', game));
                    if (isNaN(parseInt(deathCounter)) || parseInt(deathCounter) === 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('deathcounter.reset-nil', game));
                    } else { 
                        $.say($.whisperPrefix(sender) + $.lang.get('deathcounter.reset', game, deathCounter));
                        $.inidb.set('deaths', game, 0);
                        $.deathUpdateFile(game);
                    }
                    return;
                }

                /*
                 * @commandpath deathctr set [number] - Set the death counter for the game being played.
                 */
                if (action.equalsIgnoreCase('set')) {
                    if (isNaN(parseInt(args[1]))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('deathcounter.set-error'));
                        return;
                    } else {
                        var setDeath = parseInt(args[1]);
                        $.say($.whisperPrefix(sender) + $.lang.get('deathcounter.set-success', game, setDeath));
                        $.inidb.set('deaths', game, setDeath);
                        $.deathUpdateFilegame();
                        return;
                    }
                }

                /*
                 * @commandpath deathctr incr - Add one to the death counter for the game being played.
                 */
                if (action.equalsIgnoreCase('add') || action.equalsIgnoreCase('incr') || action.equalsIgnoreCase('+')) {
                    
                    $.say($.lang.get('deathcounter.add-success', $.ownerName, game, ($.inidb.exists('deaths', game) ? (parseInt($.inidb.get('deaths', game)) + 1) : 0)));
                    $.inidb.incr('deaths', game, 1);
                    $.deathUpdateFile(game);
                    return;
                }

                /*
                 * @commandpath deathctr decr - Subtract one from the death counter for the game being played.
                 */
                if (action.equalsIgnoreCase('sub') || action.equalsIgnoreCase('decr') || action.equalsIgnoreCase('-')) {
                    if (isNaN(parseInt($.inidb.get('deaths', game))) || parseInt($.inidb.get('deaths', game)) === 0) {
                        $.say($.lang.get('deathcounter.sub-zero', game));
                        return;
                    }

                    $.say($.lang.get('deathcounter.sub-success', game, ($.inidb.exists('deaths', game) ? (parseInt($.inidb.get('deaths', game)) - 1) : 0)));
                    $.inidb.decr('deaths', game, 1);
                    $.deathUpdateFile(game);
                    return;
                }
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/deathctrCommand.js', 'deathctr', 7);

        $.registerChatSubcommand('deathctr', 'reset', 2);
        $.registerChatSubcommand('deathctr', 'set', 2);
        $.registerChatSubcommand('deathctr', 'add', 2);
        $.registerChatSubcommand('deathctr', 'incr', 2);
        $.registerChatSubcommand('deathctr', '+', 2);
        $.registerChatSubcommand('deathctr', 'sub', 2);
        $.registerChatSubcommand('deathctr', 'decr', 2);
        $.registerChatSubcommand('deathctr', '-', 2);

        setTimeout(function() {
            deathUpdateFile(($.getGame($.channelName) != '' ? $.getGame($.channelName) : 'Some Game'));
        }, 10000);
    });

    /*
     * Export functions to API 
     */
    $.deathUpdateFile = deathUpdateFile;
})();
