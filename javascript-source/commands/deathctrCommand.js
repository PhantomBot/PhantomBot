/**
 * deathCounter.js
 *
 * A death counter.
 */

(function() {
    var moduleLoaded = false;

    function deathUpdateFile(game) {
        var deathFile = "./addons/deathctr/deathctr.txt",
            deathCounter = parseInt($.inidb.get('deaths', game));

        if (isNaN(deathCounter)) {
            deathCounter = 0;
        }
        $.writeToFile(deathCounter.toFixed(0), deathFile, false);
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            username = $.username.resolve(sender),
            command = event.getCommand(),
            args = event.getArgs(),
            game = ($.getGame($.channelName) != '' ? $.getGame($.channelName) : "Some Game");

        /**
         * @commandpath deathctr - Display the current number of deaths in game being played.
         * @commandpath deathctr reset - Reset the death counter for the game being played.
         * @commandpath deathctr set [number] - Set the death counter for the game being played.
         * @commandpath deathctr add|incr|+ - Add one to the death counter for the game being played.
         * @commandpath deathctr sub|decr|- - Subtract one from the death counter for the game being played.
         */
        if (command.equalsIgnoreCase("deathctr")) {

            if (!args[0]) {
                var deathCounter = parseInt($.inidb.get('deaths', game));
                if (isNaN(deathCounter) || parseInt(deathCounter) == 0) {
                    $.say($.lang.get("deathcounter.none", $.ownerName, game));
                } else {
                    $.say($.lang.get("deathcounter.counter", $.ownerName, game, deathCounter));
                }
            } else {
                if (args[0].equalsIgnoreCase("reset")) {
                    var deathCounter = parseInt($.inidb.get('deaths', game));
                    if (isNaN(deathCounter) || parseInt(deathCounter) == 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get("deathcounter.reset-nil", game));
                    } else {
                        $.inidb.set('deaths', game, 0);
                        $.say($.whisperPrefix(sender) + $.lang.get("deathcounter.reset", game, deathCounter));
                        $.deathUpdateFile(game);
                    }
                    return;
                }

                if (args[0].equalsIgnoreCase("set")) {
                    if (isNaN(parseInt(args[1]))) {
                        $.say($.whisperPrefix(sender) + $.lang.get("deathcounter.set-error"));
                        return;
                    } else {
                        var setDeath = parseInt(args[1]);
                        $.inidb.set('deaths', game, setDeath);
                        $.say($.whisperPrefix(sender) + $.lang.get("deathcounter.set-success", game, setDeath));
                        $.deathUpdateFilegame();
                        return;
                    }
                }

                if (args[0].equalsIgnoreCase("add") || args[0].equalsIgnoreCase("incr") || args[0].equalsIgnoreCase("+")) {
                    $.inidb.incr('deaths', game, 1);
                    $.say($.lang.get("deathcounter.add-success", $.ownerName, game, $.inidb.get('deaths', game)));
                    $.deathUpdateFile(game);
                    return;
                }

                if (args[0].equalsIgnoreCase("sub") || args[0].equalsIgnoreCase("decr") || args[0].equalsIgnoreCase("-")) {
                    if (isNaN($.inidb.get('deaths', game)) || parseInt($.inidb.get('deaths', game)) == 0) {
                        $.say($.lang.get("deathcounter.sub-zero", game));
                        return;
                    }

                    $.inidb.decr('deaths', game, 1);
                    $.say($.lang.get("deathcounter.sub-success", game, $.inidb.get('deaths', game)));
                    $.deathUpdateFile(game);
                    return;
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/deathctrCommand.js')) {
            $.registerChatCommand('./commands/deathctrCommand.js', 'deathctr', 7);

            $.registerChatSubcommand('deathctr', 'reset', 2);
            $.registerChatSubcommand('deathctr', 'set', 2);
            $.registerChatSubcommand('deathctr', 'add', 2);
            $.registerChatSubcommand('deathctr', 'incr', 2);
            $.registerChatSubcommand('deathctr', '+', 2);
            $.registerChatSubcommand('deathctr', 'sub', 2);
            $.registerChatSubcommand('deathctr', 'decr', 2);
            $.registerChatSubcommand('deathctr', '-', 2);

            if (!moduleLoaded) {
                moduleLoaded = true;
                if (!$.isDirectory('./addons/deathctr/')) {
                    $.mkDir('./addons/deathctr');
                }

                var game = ($.getGame($.channelName) != '' ? $.getGame($.channelName) : "Some Game");
                deathUpdateFile(game);
            }
        }
    });
    $.deathUpdateFile = deathUpdateFile;
})();
