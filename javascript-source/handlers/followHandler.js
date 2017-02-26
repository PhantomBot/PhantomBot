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
    var lastFollowTime = 0,
        followTrain = 0,
        announceFollows = false,
        followReward = $.getSetIniDbNumber('settings', 'followReward', 0),
        followMessage = $.getSetIniDbString('settings', 'followMessage', $.lang.get('followhandler.follow.message')),
        followToggle = $.getSetIniDbBoolean('settings', 'followToggle', false),
        followTrainToggle = $.getSetIniDbBoolean('settings', 'followTrainToggle', false),
        followDelay = $.getSetIniDbNumber('settings', 'followDelay', 5),
        follows = [],
        lastFollow = 0,
        timer = false,
        running = false,
        timeout = false,
        interval;

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
     * @function checkFollowTrain
     */
    function followTrainCheck() {
        if (followTrainToggle && ($.systemTime() - lastFollowTime) <= 3e5) {
            if (followTrain > 1) {
                if (followTrain == 3) {
                    $.say($.lang.get('followhandler.followtrain.triple'));
                } else if (followTrain == 4) {
                    $.say($.lang.get('followhandler.followtrain.quad'));
                } else if (followTrain == 5) {
                    $.say($.lang.get('followhandler.followtrain.penta'));
                } else if (followTrain > 5 && followTrain <= 10) {
                    $.say($.lang.get('followhandler.followtrain.mega', followTrain));
                } else if (followTrain > 10 && followTrain <= 20) {
                    $.say($.lang.get('followhandler.followtrain.ultra', followTrain));
                } else if (followTrain > 20) {
                    $.say($.lang.get('followhandler.followtrain.unbelievable', followTrain));
                }
            }
            followTrain = 0;
            lastFollowTime = 0;
            timeout = false;
        }
    }

    /*
     * @function runFollow
     */
    function runFollow(message) {
        if (!timer && (followDelay == 0 || ($.systemTime() - lastFollow) > (followDelay * 1e3))) {
            $.say(message);
            lastFollow = $.systemTime();
        } else {
            follows.push(message);
            if (!timer) {
                timer = true;
                setTimeout(function() { 
                    interval = setInterval(function() { 
                        run(); 
                    }, 3e2); 
                }, 1e2);
            }
        }
    }

    /**
     * Used for the follow delay
     *
     * @function run
     */
    function run() {
        var i, s;
        if (follows.length == 0) {
            clearInterval(interval);
            lastFollow = 0;
            timer = false;
            return;
        }

        for (i in follows) {
            if (!running && ($.systemTime() - lastFollow) > (followDelay * 1e3)) {
                running = true;
                $.say(follows[i].replace('/w', ' /w'));
                lastFollow = $.systemTime();
                follows.splice(i, 1);
                running = false;
            }
        }
    }

    /*
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function() {
        if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
            return;
        }

        $.consoleLn('>> Enabling follower announcements');
        $.log.event('Follow announcements enabled');
        announceFollows = true;
    });

    /**
     * Gets the new follow events from the core.
     *
     * @event twitchFollow
     */
    $.bind('twitchFollow', function(event) {
        var follower = event.getFollower(),
            s = followMessage;

        if ($.bot.isModuleEnabled('./commands/lastseenCommand.js')) {
            $.inidb.set('lastseen', follower, $.systemTime());
        }

        if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
            if (!$.inidb.exists('followed', follower) && followToggle) {
                if (announceFollows) {
                    runFollow(s.replace('(name)', $.username.resolve(follower)).replace('(reward)', $.getPointsString(followReward)));
                    followTrain++;

                    if (!timeout) {
                        timeout = true;
                        setTimeout(function() {
                            followTrainCheck();
                        }, 8e3);
                    }
                    lastFollowTime = $.systemTime();
                    $.inidb.set('streamInfo', 'lastFollow', $.username.resolve(follower));
                }
                
                if (followReward > 0) {
                    $.inidb.incr('points', follower, followReward);
                }

                $.writeToFile($.username.resolve(follower) + ' ', './addons/followHandler/latestFollower.txt', false);
            }
        }
        
        $.inidb.setAutoCommit(false);
        $.setIniDbBoolean('followed', follower, true);
        $.inidb.setAutoCommit(true);
    });

    /*
     * @event twitchUnfollow
     */
    $.bind('twitchUnfollow', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
            return;
        }

        var follower = event.getFollows().toLowerCase(),
            followed = $.getIniDbBoolean('followed', follower, false);

        if (followed) {
            $.setIniDbBoolean('followed', follower, false);
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            argString = event.getArguments(),
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

            followMessage = argString;
            $.inidb.set('settings', 'followMessage', followMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.success', followMessage));
        }

        /*
         * @commandpath followdelay [message] - Set the delay in seconds between follow announcements
         */
        if (command.equalsIgnoreCase('followdelay')) {
            if (action === undefined || isNaN(parseInt(action)) || parseInt(action) < 5) {
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
         * @commandpath followtaintoggle - Enable or disable the follow train anouncements
         */
        if (command.equalsIgnoreCase('followtraintoggle')) {
            followTrainToggle = !followTrainToggle;
            $.setIniDbBoolean('settings', 'followTrainToggle', followTrainToggle);
            $.say($.whisperPrefix(sender) + (followTrainToggle ? $.lang.get('followhandler.followtraintoggle.on') : $.lang.get('followhandler.followtraintoggle.off')))
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
        if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
            $.registerChatCommand('./handlers/followHandler.js', 'followreward', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followtoggle', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followtraintoggle', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followdelay', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followmessage', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'checkfollow', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'shoutout', 2);
        }
    });

    $.updateFollowConfig = updateFollowConfig;
})();
