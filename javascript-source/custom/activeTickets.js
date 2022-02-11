(function() {

    function addActiveTickets(amount) {
        var activeUsers = $.getActiveUsers();
        $.say($.lang.get('activetickets.command.startsending', amount, activeUsers.length))
        $.streamelements.AddTicketsToUsers(activeUsers,parseInt(amount));
        $.say($.lang.get('activetickets.command.addactive', activeUsers.length))
    }

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