(function() {
    var pointsToAdd = 10,
        delay = 300000;

    function runTicketsPayout() {
        $.log.event("Starting payout");
        if ($.twitchcache.isStreamOnline()) {
            var activeUsers = $.getActiveUsers();
            $.streamelements.AddTicketsToUsers(activeUsers,pointsToAdd);
            var subUsers = [];
            $.log.event("Sent tickets to active users");
//            for (user in activeUsers) {
//                if($.isSub(user)) {
//                    subUsers.push(user);
//                }
//            }
            for(i = 0; i < activeUsers.length; i++) {
                if($.isSub(activeUsers[i])) {
                    subUsers.push(activeUsers[i])
                }
            }
            if(subUsers.length > 0) {
                $.log.event("Sent tickets to active subscribers");
                $.streamelements.AddTicketsToUsers(subUsers,pointsToAdd);
            }
        }
        $.log.event("Ending payout");
    }

    var interval = setInterval(function() {
        runTicketsPayout();
    }, delay)
})()