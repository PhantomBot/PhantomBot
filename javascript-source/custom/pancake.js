(function() {
    var startTime = 0,
        runTime = 75,
        currentState = -1,
        winAmount = 0,
        recentJoinedMembers = [],
        viewers = [];

    function startRaffle(amountToWin) {
        if(currentState >= 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('raffle.running', 'pancake'));
            return;
        }

        currentState = 0;
        var maxAmount = parseInt(amountToWin)
        winAmount = $.randRange(maxAmount * 0.66, maxAmount);
        startTime = $.systemTime();
        viewers = [];
        recentJoinedMembers = [];

        $.say($.lang.get('raffle.starting', 'superp64Pancake', winAmount, '!pancake'))
        runRaffle();
    }

    function runRaffle() {
        var t = setTimeout(function() {
            var elapsedTime = parseInt(($.systemTime() - startTime) /1000);
            if(elapsedTime >= runTime) {
                sendJoinedMessage();
                pickWinners();
            } else {
                updateTimeMessage(elapsedTime);
                runRaffle();
            }
        }, 1000);
    }

    function pickWinners() {
        if(viewers.length == 0) {
            currentState = -1;
            $.say($.lang.get('raffle.notenough', 'pancake'));
            return;
        }
        if(viewers.length < 3) {
            winnerCount = viewers.length;
        } else {
            winnerCount = 3;
        }
        winners = [];
        for(n = 0; n < winnerCount; n++) {
            var winner = $.randElement(viewers);
            for(var i in viewers) {
                if(viewers[i].equalsIgnoreCase(winner)) {
                    viewers.splice(i, 1)
                }
            }
            winners.push(winner);
        }
        eachAmount = parseInt(winAmount / winnerCount);
        $.say($.lang.get('raffle.winners', winners.join(', '), 'pancake', eachAmount, 'superp64Pancake'))
        $.streamelements.AddTicketsToUsers(winners,eachAmount);
        currentState = -1;
    }

    function updateTimeMessage(elapsedTime) {
        if (currentState == 0 && elapsedTime >= 15) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        } else if (currentState == 1 && elapsedTime >= 30) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        } else if (currentState == 2 && elapsedTime >= 45) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        } else if (currentState == 3 && elapsedTime >= 60) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        } else if (currentState == 4 && elapsedTime >= 75) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        } else if (currentState == 5 && elapsedTime >= 90) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        } else if (currentState == 6 && elapsedTime >= 105) {
            sendJoinedMessage();
            sendTimeLeft(elapsedTime);
            currentState++;
        }
    }

    function sendTimeLeft(elapsedTime) {
        $.say($.lang.get('raffle.timeleft',runTime - elapsedTime, '!pancake', 'superp64Pancake'));
    }

    function sendJoinedMessage() {
        if(recentJoinedMembers.length > 0) {
            $.say('raffle.joined', 'pancake');
        }
        recentJoinedMembers = [];
    }

    function enterRaffle(username) {
        if(currentState < 0) {
            return;
        }
        var i;
        for (i in viewers) {
            if(viewers[i].equalsIgnoreCase(username)) {
                $.say($.whisperPrefix(username) + $.lang.get('raffle.alreadyjoined', 'pancake'));
                return;
            }
        }
        viewers.push(username);
    }


    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = args[2];

        if(command.equalsIgnoreCase('pancakeraffle')) {
            if(!action) {
                return;
            }

            startRaffle(action);
        }

        if(command.equalsIgnoreCase('pancake')) {
            enterRaffle(sender);
            return;
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./custom/pancake.js', 'pancakeraffle', 1)
        $.registerChatCommand('./custom/pancake.js', 'pancake', 7)
    });
})();