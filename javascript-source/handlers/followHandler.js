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
        followReward = $.getSetIniDbNumber('settings', 'followReward', 0),
        followMessage = $.getSetIniDbString('settings', 'followMessage', $.lang.get('followhandler.follow.message')),
        followToggle = $.getSetIniDbBoolean('settings', 'followToggle', false),
        followTrainToggle = $.getSetIniDbBoolean('settings', 'followTrainToggle', false),
        followDelay = $.getSetIniDbNumber('settings', 'followDelay', 0),
        follows = [],
        lastFollow = 0,
        timer = false,
        running = false,
        timeout = false,
        interval;

    /**
     * @function updateFollowConfig
     */
    function updateFollowConfig() {
        followReward = $.getIniDbNumber('settings', 'followReward');
        followMessage = $.getIniDbString('settings', 'followMessage');
        followToggle = $.getIniDbBoolean('settings', 'followToggle');
        followDelay = $.getIniDbNumber('settings', 'followDelay');
    };

    /**
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
    };

    /**
     * Used for the follow delay
     *
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
                setTimeout(function() { interval = setInterval(function() { run(); }, 3e2); }, 1e2);
            }
        }
    };

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
                $.say(follows[i]);
                lastFollow = $.systemTime();
                follows.splice(i, 1);
                running = false;
            }
        }
    };

    /**
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
                    runFollow(s);
                    followTrain++;

                    if (!timeout) {
                        timeout = true;
                        setTimeout(function() {
                            followTrainCheck();
                        }, 8e3);
                    }
                    lastFollowTime = $.systemTime();
                }

                $.setIniDbBoolean('followed', follower, true);
                $.inidb.set('streamInfo', 'lastFollow', $.username.resolve(follower));
                if (followReward > 0) {
                    $.inidb.incr('points', follower, followReward);
                }
                $.writeToFile($.username.resolve(follower), './addons/followHandler/latestFollower.txt', false);
            }
        }
    });

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

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            argString = event.getArguments(),
            comArg = args[0],
            channel = $.channelName;

        /* Do not show command on the command list, for the panel only. */
        if (command.equalsIgnoreCase('followerpanelupdate')) {
            updateFollowConfig();
        }

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
            $.log.event(sender + ' set the follow reward to ' + followReward);
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
            $.log.event(sender + ' set the follow message to ' + followMessage);
        }

        /**
         * @commandpath followdelay [message] - Set the delay in seconds between follow announcements
         */
        if (command.equalsIgnoreCase('followdelay')) {
            if (!comArg) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followdelay.usage'));
                return;
            }

            followDelay = parseInt(args[0]);
            $.inidb.set('settings', 'followDelay', followDelay);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followdelay.success', followDelay));
            $.log.event(sender + ' set the follow delay to ' + followDelay + ' seconds.');
        }

        /**
         * @commandpath followtoggle - Enable or disable the anouncements for new followers
         */
        if (command.equalsIgnoreCase('followtoggle')) {
            if (followToggle) {
                followToggle = false;
                $.inidb.set('settings', 'followToggle', followToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.followtoggle.off'));
                $.log.event(sender + ' turned follow announcements off');
            } else if (!followToggle) {
                followToggle = true;
                $.inidb.set('settings', 'followToggle', followToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.followtoggle.on'));
                $.log.event(sender + ' turned follow announcements on');
            }
        }

        /**
         * @commandpath followtaintoggle - Enable or disable the follow train anouncements
         */
        if (command.equalsIgnoreCase('followtraintoggle')) {
            if (followTrainToggle) {
                followTrainToggle = false;
                $.inidb.set('settings', 'followTrainToggle', followTrainToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.followtraintoggle.off'));
                $.log.event(sender + ' turned follow train announcements off');
            } else if (!followTrainToggle) {
                followTrainToggle = true;
                $.inidb.set('settings', 'followTrainToggle', followTrainToggle);
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.followtraintoggle.on'));
                $.log.event(sender + ' turned follow train announcements on');
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

            var streamer = $.username.resolve(args[0]),
                streamerGame = $.getGame(streamer),
                streamerURL = 'https://twitch.tv/' + streamer;

            if (streamerGame == null || streamerGame.length == 0) {
                $.say($.lang.get('followhandler.shoutout.no.game', streamer, streamerURL));
                return;
            }

            if (!$.isOnline(streamer)) {
                $.say($.lang.get('followhandler.shoutout.offline', streamer, streamerURL, streamerGame));
                $.log.event(sender + ' shouted out streamer ' + streamer);
                return;
            } 
            $.say($.lang.get('followhandler.shoutout.online', streamer, streamerURL, streamerGame))
            $.log.event(sender + ' shouted out streamer ' + streamer);
        }

        /**
         * @commandpath followage [user] - Tells you how long someone has been following the channel for
         * @commandpath followage [user] [channel] - Tells you how long someone has been following that channel for
         * @commandpath followage - Tells you how long you have been following the channel
         */
        if (command.equalsIgnoreCase('followage')) {
            if (args.length > 0) {
                sender = args[0];
            }

            if (args.length > 1) {
                channel = args[1];
            }

            if ($.twitch.GetUserFollowsChannel(sender.toLowerCase(), channel.toLowerCase()).getInt('_http') == 200) {
                $.getFollowAge(event.getSender(), sender, channel);
            } else {
                $.say($.lang.get('followhandler.follow.age.err.404', $.userPrefix(event.getSender(), true), sender, channel));
            }
        }

        /**
         * @commandpath fixfollow [user] - Will force add a user to the followed list to the bot, and will add a heart next to the name on the panel
         */
        if (command.equalsIgnoreCase('fixfollow')) {
            if (!comArg) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.usage'));
                return;
            } else if ($.inidb.exists('followed', comArg)) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.error', comArg));
                return;
            } else if ($.twitch.GetUserFollowsChannel(comArg, $.channelName).getInt('_http') != 200) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.error.404', comArg));
                return;
            }

            $.inidb.set('followed', comArg, 'true');
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.added', comArg));
            $.log.event(sender + ' added ' + comArg + ' to the followed list.');
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
            $.registerChatCommand('./handlers/followHandler.js', 'followreward', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'fixfollow', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followtoggle', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followtraintoggle', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followdelay', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followmessage', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'checkfollow', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'followers', 7);
            $.registerChatCommand('./handlers/followHandler.js', 'follow', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'shoutout', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'caster', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'followerpanelupdate', 1);
            $.registerChatCommand('./handlers/followHandler.js', 'followage');
        }
    });
})();
