(function() {
    var userCache = {},
    activeTime = 900000,
    excludedUsers = [
        'super_waffle_bot',
        'truckybot',
        'superpenguintv',
        'moobot',
        'soundalerts',
        'streamelements',
        'drinking_buddy_bot'
        ];

    function getActiveUsers() {
        var currentTime = $.systemTime();
        var users = [];

        for (i in $.users) {
            username = $.users[i].toLowerCase();
            if(excludedUsers.includes(username)) {
                continue;
            }
            if (userCache[username] !== undefined) {
                if(userCache[username] + activeTime > currentTime) {
                    users.push(username);
                } else {
                    delete userCache[username];
                }
            }
        }

//        for (user in userCache) {
//            if(excludedUsers.includes(user)) {
//                continue;
//            }
//            if(userCache[user] + activeTime > currentTime) {
//                users.push(user);
//            }
//        }
//
        return users;
    }

    $.bind('ircChannelMessage', function(event) {
        userCache[event.getSender().toLowerCase()] = $.systemTime();
    });

    $.getActiveUsers = getActiveUsers;
})();