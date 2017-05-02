/**
 * followHandler.js
 *
 * Register new followers and unfollows in the channel
 * Optionally supports rewarding points for a follow (Only the first time!)
 *
 * The follow train:
 * Checks if the previous follow was less than 5 minutes ago.
 * It will trigger on 3, 4, 5, 10 and 20+ followers.
 * anymore to reduce spam. Unless the 5 minutes have past, then it will start over.
 *
 */
(function() {
    var followToggle = $.getSetIniDbBoolean('settings', 'followToggle', false),
        followReward = $.getSetIniDbNumber('settings', 'followReward', 0),
        followMessage = $.getSetIniDbString('settings', 'followMessage', $.lang.get('followhandler.follow.message')),
        followDelay = $.getSetIniDbNumber('settings', 'followDelay', 5),
        followQueue = new java.util.concurrent.ConcurrentLinkedQueue,
        lastFollow = $.systemTime(),
        announceFollows = false;
        
    /*
     * @function updateFollowConfig
     */
    function updateFollowConfig() {
        followReward = $.getIniDbNumber('settings', 'followReward');
        followMessage = $.getIniDbString('settings', 'followMessage');
        followToggle = $.getIniDbBoolean('settings', 'followToggle');
        followDelay = $.getIniDbNumber('settings', 'followDelay');
    }

    /*
     * @function runFollows
     */
    function runFollows() {
        if (!followQueue.isEmpty() && (lastFollow + (followDelay * 1e3)) < $.systemTime()) {
            $.say(followQueue.poll());
            lastFollow = $.systemTime();
        }
    }

    /*
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function() {
        $.consoleLn('>> Enabling follower announcements');

        announceFollows = true;
    });

    /*
     * @event twitchFollow
     */
    $.bind('twitchFollow', function(event) {
        var follower = event.getFollower(),
            s = followMessage;

        if ($.inidb.exists('followed', follower)) {
            return;
        }

        
        if (announceFollows === true && followToggle === true) {
            if (s.match(/\(name\)/)) {
                s = $.replace(s, '(name)', $.username.resolve(follower));
            }

            if (s.match(/\(reward\)/)) {
                s = $.replace(s, '(reward)', $.getPointsString(followReward));
            }

            if (s.match(/^\/w/)) {
                s = s.replace('/w', ' /w');
            }

            followQueue.add(s);

            if (followReward > 0) {
                $.inidb.incr('points', follower, followReward);
            }
            
            $.writeToFile(follower + ' ', './addons/followHandler/latestFollower.txt', false);
            $.inidb.set('streamInfo', 'lastFollow', follower);
        }

        $.inidb.setAutoCommit(false);
        $.setIniDbBoolean('followed', follower, true);
        $.inidb.setAutoCommit(true);
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        /*
         * @commandpath followreward [amount] - Set the points reward for following
         */
        if (command.equalsIgnoreCase('followreward')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.usage', $.pointNameMultiple, followReward));
                return;
            }

            followReward = parseInt(action);
            $.inidb.set('settings', 'followReward', followReward);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.success', $.getPointsString(followReward)));
        }

        /*
         * @commandpath followmessage [message] - Set the new follower message when there is a reward
         */
        if (command.equalsIgnoreCase('followmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.usage'));
                return;
            }

            followMessage = args.slice(0).join(' ');
            $.inidb.set('settings', 'followMessage', followMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.success', followMessage));
        }

        /*
         * @commandpath followdelay [message] - Set the delay in seconds between follow announcements
         */
        if (command.equalsIgnoreCase('followdelay')) {
            if (isNaN(parseInt(action)) || parseInt(action) < 5) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followdelay.usage'));
                return;
            }

            followDelay = parseInt(action);
            $.inidb.set('settings', 'followDelay', followDelay);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followdelay.success', followDelay));
        }

        /*
         * @commandpath followtoggle - Enable or disable the anouncements for new followers
         */
        if (command.equalsIgnoreCase('followtoggle')) {
            followToggle = !followToggle;
            $.setIniDbBoolean('settings', 'followToggle', followToggle);
            $.say($.whisperPrefix(sender) + (followToggle ? $.lang.get('followhandler.followtoggle.on') : $.lang.get('followhandler.followtoggle.off')));
        }

        /*
         * @commandpath checkfollow [username] - Check if a user is following the channel
         */
        if (command.equalsIgnoreCase('checkfollow')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.check.usage'));
                return;
            }

            action = action.toLowerCase();

            if ($.user.isFollower(action)) {
                $.say($.lang.get('followhandler.check.follows', $.username.resolve(action)));
            } else {
                $.say($.lang.get('followhandler.check.notfollows', $.username.resolve(action)));
            }
        }

        /*
         * @commandpath shoutout [streamer] - Give a shout out to a streamer.
         */
        if (command.equalsIgnoreCase('shoutout')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.shoutout.usage', command));
                return;
            }

            var streamer = $.username.resolve(args[0]),
                streamerGame = $.getGame(streamer),
                streamerURL = 'https://twitch.tv/' + streamer;

            if (streamerGame == null || streamerGame.length === 0) {
                $.say($.lang.get('followhandler.shoutout.no.game', streamer, streamerURL));
                return;
            }

            if (!$.isOnline(streamer)) {
                $.say($.lang.get('followhandler.shoutout.offline', streamer, streamerURL, streamerGame));
            } else{
                $.say($.lang.get('followhandler.shoutout.online', streamer, streamerURL, streamerGame));
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/followHandler.js', 'followreward', 1);
        $.registerChatCommand('./handlers/followHandler.js', 'followtoggle', 1);
        $.registerChatCommand('./handlers/followHandler.js', 'followdelay', 1);
        $.registerChatCommand('./handlers/followHandler.js', 'followmessage', 1);
        $.registerChatCommand('./handlers/followHandler.js', 'checkfollow', 2);
        $.registerChatCommand('./handlers/followHandler.js', 'shoutout', 2);

        setInterval(function() { runFollows(); }, 2e3);
    });

    $.updateFollowConfig = updateFollowConfig;
})();
