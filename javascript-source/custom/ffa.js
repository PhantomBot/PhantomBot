(function()  {
    var cost = $.getSetIniDbNumber('ffa', 'cost', 100),
        joinTime = $.getSetIniDbNumber('ffa', 'jointime', 180),
        coolDown = $.getSetIniDbNumber('ffa', 'cooldown', 300),
        viewers = [],
        gameState = 0;

   function checkUserAlreadyJoined(username) {
        var i;
        for(i in viewers) {
            if(viewers[i] == username) {
                return true;
            }
        }
        return false;
   }

   function startFfa() {
        gameState = 1;
        var t = setTimeout(function() {
            runFfa();
        }, joinTime * 1000);
   }

   function runFfa() {
        gameState = 2;
        if(viewers.length == 1) {
            $.say($.lang.get('ffa.notenough'));
            $.inidb.incr('points', viewers[0], cost);
            endFfa();
            return;
        }
        $.say($.lang.get('ffa.running.1'));
        $.say($.lang.get('ffa.running.2'));
        var winnerId = $.rand(viewers.length);
        var winner = viewers[winnerId];
        var winnings = viewers.length*cost;
        $.say($.lang.get('ffa.results', winner));
        $.inidb.incr('points', winner, winnings);

        endFfa();
   }

   function endFfa() {
        $.coolDown.set('ffa', false, coolDown, false);
        gameState = 0;
        viewers = [];
   }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = args[2];

        if (command.equalsIgnoreCase('ffa')) {
            if (checkUserAlreadyJoined(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ffa.alreadyjoined'));
                return;
            }

            if(gameState > 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('ffa.notpossible'));
                return;
            }

            if(cost > $.getUserPoints(sender)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ffa.needpoints', $.getPointsString(cost), $.getPointsString($.getUserPoints(sender))));
                return;
            }

            if(gameState == 0) {
                $.say($.lang.get('ffa.start'));
                startFfa();
            } else {
                $.say($.lang.get('ffa.joined', sender))
            }
            viewers.push(sender);
            $.inidb.decr('points', sender, cost);

        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./custom/ffa.js','ffa',7);
    });
})()