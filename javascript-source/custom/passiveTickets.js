(function() {
    var pointsToAdd = 10,
        delay = 300000;

    function runTicketsPayout() {
        $.log.error("Starting payout");
        if ($.twitchcache.isStreamOnline()) {
            var activeUsers = $.getActiveUsers();
            $.streamelements.AddTicketsToUsers(activeUsers,pointsToAdd);
            var subUsers = [];

            for (user in activeUsers) {
                if($.isSub(user)) {
                    subUsers.push(user);
                }
            }
            if(subUsers.length > 0) {
                $.streamelements.AddTicketsToUsers(subUsers,pointsToAdd);
            }
        }
        $.log.error("Ending payout");
    }

    var interval = setInterval(function() {
        runTicketsPayout();
    }, delay)
})()