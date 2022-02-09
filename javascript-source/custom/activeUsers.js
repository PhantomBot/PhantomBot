(function() {
    var userCache = {},
    activeTime = 900000;

    function getActiveUsers() {
        var currentTime = $.systemTime();
        var users = [];
        for (user in userCache) {
            if(userCache[user] + activeTime > currentTime) {
                users.push(user);
            }
        }

        return users;
    }

    $.bind('twitchOffline', function(event) {
        setTimeout(function() {
            if (!$.twitchcache.isStreamOnline()) {
                userCache = {};
            }
        }, 6e4);
    });

    $.bind('ircChannelMessage', function(event) {
        if($.twitchcache.isStreamOnline()) {
            userCache[event.getSender()] = $.systemTime();
        }
    });

    $.getActiveUsers = getActiveUsers;
})();