(function() {
    var ticketsToGiveOut = 0,
        lastTicketsAdded = $.systemTime(),
        delay = 1000;

    function addActiveTickets(amount) {
        var activeUsers = $.getActiveUsers();
        ticketsToGiveOut += parseInt(amount);
        lastTicketsAdded = $.systemTime();
    }

    function runActivePayout() {
        if(ticketsToGiveOut == 0) {
            return;
        }
        var currentTime = $.systemTime();
        var timeToCheck = parseInt(lastTicketsAdded);
        var timeDiff = currentTime - timeToCheck;
        if(timeDiff <= 5000) {
            return;
        }

        var amountToGive = ticketsToGiveOut;
        ticketsToGiveOut = 0;

        var activeUsers = $.getActiveUsers();

        var pointsString = String(amountToGive).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        $.say($.lang.get('activetickets.command.startsending', pointsString, activeUsers.length));
        $.streamelements.AddTicketsToUsers(activeUsers,parseInt(amountToGive));
    }

    var interval = setInterval(function() {
        runActivePayout();
    }, delay)


    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = args[2];

        if(command.equalsIgnoreCase('addactive')) {
            if(!action) {
                return;
            }

            addActiveTickets(action);
        }
    });


    $.bind('initReady', function() {
        $.registerChatCommand('./custom/activeTickets.js', 'addactive', 1)
    });

    $.addActiveTickets = addActiveTickets;
})();