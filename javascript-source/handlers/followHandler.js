/**
 * followHandler.js
 *
 * Register new followers and unfollows in the channel
 * Optionally supports rewarding points for a follow (Only the first time!)
 *
 * The follow train:
 * Checks if the previous follow was less than 5 minutes ago.
 * It will trigger on 3, 4, 5, 20, 30 and 50 followers, after that it won't announce trains
 * anymore to reduce spam. Unless the 5 minutes have past, then it will start over.
 *
 */
(function() {
    var lastFollowTime = 0,
        followTrain = 0,
        announceFollows = false,
        followReward = ($.inidb.exists('settings', 'followReward') ? parseInt($.inidb.get('settings', 'followReward')) : 100),
        followMessage = ($.inidb.exists('settings', 'followMessage') ? $.inidb.get('settings', 'followMessage') : $.lang.get('followhandler.follow.message')),
        followToggle = ($.inidb.exists('settings', 'followToggle') ? $.inidb.get('settings', 'followToggle') : false);

    /**
     * @function checkFollowTrain
     */
    function checkFollowTrain() {
        if (($.systemTime() - lastFollowTime) > 3e5) {
            if (followTrain == 3) {
                $.say($.lang.get('followhandler.followtrain.triple'));
            } else if (followTrain == 4) {
                $.say($.lang.get('followhandler.followtrain.quad'));
            } else if (followTrain == 5) {
                $.say($.lang.get('followhandler.followtrain.penta'));
            } else if (followTrain == 20) {
                $.say($.lang.get('followhandler.followtrain.mega', followTrain));
            } else if (followTrain == 30) {
                $.say($.lang.get('followhandler.followtrain.ultra', followTrain));
            } else if (followTrain == 50) {
                $.say($.lang.get('followhandler.followtrain.unbelievable', followTrain));
            }
            ++followTrain;
        } else {
            followTrain = 1;
        }
        lastFollowTime = $.systemTime();
    };

    /**
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function() {
        if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
            return;
        }

        $.consoleLn('>> Enabling follower announcements');
        $.logEvent('followHandler.js', 56, 'Follow announcements enabled');
        announceFollows = true;
    });

    /**
     * @event twitchFollow
     */
    $.bind('twitchFollow', function(event) {
        var follower = event.getFollower(),
            s;

        if ($.bot.isModuleEnabled('./commands/lastseenCommand.js')) {
            $.inidb.set('lastseen', follower, $.systemTime());
        }

        if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
            if (!$.inidb.exists('followed', follower)) {
                if (followToggle && announceFollows) {
                    s = followMessage;
                    s = s.replace('(name)', $.username.resolve(follower));
                    s = s.replace('(reward)', $.getPointsString(followReward));
                    checkFollowTrain();
                    $.say(s);
                }
                /** Don't use $.username.resolve() here, because it will abuse the api when this module is enabled for the first time.*/
                $.setIniDbBoolean('followed', follower, true);
                if (followReward > 0) {
                    $.inidb.incr('points', follower, followReward);
                }
                $.writeToFile(follower, './addons/followHandler/latestFollower.txt', false);
            }
        }
    });

    $.bind('twitchUnfollow', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
            return;
        }

        var follower = event.getFollows().toLowerCase(),
            followed = $.getIniDbBoolean('followed', follower);

        if (followed) {
            $.setIniDbBoolean('followed', follower, false);
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            argString = event.getArguments(),
            comArg = args[0],
            streamer,
            streamerGame,
            streamerURL,
            shoutout;

        /**
         * @commandpath followreward [amount] - Set the points reward for following
         */
        if (command.equalsIgnoreCase('followreward')) {
            comArg = parseInt(comArg);
            if (!args[0] || isNaN(comArg)) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.usage', $.pointNameMultiple, followReward));
                return;
            }

            followReward = comArg;
            $.inidb.set('settings', 'followReward', followReward);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.success', $.getPointsString(followReward)));
            $.logEvent('followHandler.js', 141, sender + ' set the follow reward to ' + followReward);
        }

        /**
         * @commandpath followmessage [message] - Set the new follower message when there is a reward
         */
        if (command.equalsIgnoreCase('followmessage')) {
            if (!comArg || comArg <= 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.usage'));
                return;
            }

            followMessage = argString;
            $.inidb.set('settings', 'followMessage', followMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.success', followMessage));
            $.logEvent('followHandler.js', 156, sender + ' set the follow message to ' + followMessage);
        }

        /**
         * @commandpath followtoggle - Enable or disable the anouncements for new followers
         */
        if (command.equalsIgnoreCase('followtoggle')) {
            if (followToggle) {
                followToggle = false;
                $.inidb.set('settings', 'followToggle', followToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.followtoggle.off'));
                $.logEvent('followHandler.js', 181, sender + ' turned follow announcements off');
            } else if (!followToggle) {
                followToggle = true;
                $.inidb.set('settings', 'followToggle', followToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.followtoggle.on'));
                $.logEvent('followHandler.js', 181, sender + ' turned follow announcements on');
            }
        }

        /**
         * @commandpath followers - Announce the current amount of followers
         */
        if (command.equalsIgnoreCase('followers')) {
            $.say($.lang.get('followhandler.followers', $.getFollows($.channelName)))
        }

        /**
         * @commandpath checkfollow [username] - Check if a user is following the channel
         */
        if (command.equalsIgnoreCase('checkfollow')) {
            if (!comArg || comArg == '') {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.check.usage'));
                return;
            }

            comArg = comArg.toLowerCase();

            if ($.user.isFollower(comArg)) {
                $.say($.lang.get('followhandler.check.follows', $.username.resolve(comArg)));
            } else {
                $.say($.lang.get('followhandler.check.notfollows', $.username.resolve(comArg)));
            }
        }

        /**
         * @commandpath follow [streamer] - Give a shout out to a streamer.
         * @commandpath shoutout [streamer] - Give a shout out to a streamer.
         * @commandpath caster [streamer] - Give a shout out to a streamer.
         */
        if (command.equalsIgnoreCase('follow') || command.equalsIgnoreCase('shoutout') || command.equalsIgnoreCase('caster')) {
            if (!comArg || comArg == '') {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.shoutout.usage', command.toLowerCase()));
                return;
            }
            streamer = $.username.resolve(args[0]);
            streamerGame = $.getGame(streamer);
            streamerURL = "http://twitch.tv/" + streamer;

            if (streamerGame == null || streamerGame == '') {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.shoutout.404', args[0]));
                return;
            }

            if (!$.isOnline(streamer)) {
                shoutout = $.lang.get('followhandler.shoutout.offline', streamer, streamerURL, streamerGame);
                $.logEvent('followHandler.js', 181, sender + ' shouted out streamer ' + streamer);
            } else {
                shoutout = $.lang.get('followhandler.shoutout.online', streamer, streamerURL, streamerGame);
                $.logEvent('followHandler.js', 181, sender + ' shouted out streamer ' + streamer);
            }
            $.say(shoutout);
            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
            $.registerChatCommand('./handlers/followHandler.js', 'followreward', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followtoggle', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followmessage', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followmessagenoreward', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'checkfollow', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'followers', 7);
            $.registerChatCommand('./handlers/followHandler.js', 'follow', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'shoutout', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'caster', 2);
        }
    });
})();
