(function() {
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
            var activeUsers = $.getActiveUsers();
            $.streamelements.AddTicketsToUsers(activeUsers,parseInt(action));
            $.say($.lang.get('activetickets.command.addactive', activeUsers.length))
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./custom/activeTickets.js', 'addactive', 1)
    });
})();