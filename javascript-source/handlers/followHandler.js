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
        followDelay = $.getSetIniDbNumber('settings', 'followDelay', 0),
        follows = [],
        lastFollow = 0,
        timer = false,
        running = false,
        timeout = false,
        interval;

    $.announceFollows = false; // for the discord handler

    /**
     * Used by the panel for reloading the script variables.
     *
     * @function updateFollowConfig
     */
    function updateFollowConfig() {
        followReward = $.getIniDbNumber('settings', 'followReward');
        followMessage = $.getIniDbString('settings', 'followMessage');
        followToggle = $.getIniDbBoolean('settings', 'followToggle');
        followDelay = $.getIniDbNumber('settings', 'followDelay');
    };

    /**
     * Check if we got a follow train going on here.
     *
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
            followTrain = 0;//reset the follow train stats
            lastFollowTime = 0;//reset the follow train stats
            timeout = false;//reset the follow train stats
        }
    };

    /**
     * Used for the follow delay to stop that chat spam.
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
                setTimeout(function() { 
                    interval = setInterval(function() { 
                        run(); 
                    }, 3e2); 
                }, 1e2);
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
                $.say(follows[i].replace('/w', ' /w'));
                lastFollow = $.systemTime();
                follows.splice(i, 1);
                running = false;
            }
        }
    };

    /**
     * Gets the follow start event from the core
     *
     * @event twitchFollowsInitialized
     */
    $.bind('twitchFollowsInitialized', function() {
        $.announceFollows = true;//for the discord handler.
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
            s;

        /** The user was last seen here. If the module is enabled. */
        if ($.bot.isModuleEnabled('./commands/lastseenCommand.js')) {
            $.inidb.set('lastseen', follower, $.systemTime());
        }

        /** Is the follow handler module enabled? */
        if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
            /** Did the user unfollow and refollowed? */
            if (!$.inidb.exists('followed', follower)) {
                /** Are we allowed to announce follows? */
                if (followToggle && announceFollows) {
                    /** Replace the message with tags if found */
                    s = followMessage;
                    s = s.replace('(name)', $.username.resolve(follower));
                    s = s.replace('(reward)', $.getPointsString(followReward));
                    runFollow(s);
                    followTrain++;//follow train ++ check.

                    /** Follow delay check */
                    if (!timeout) {
                        timeout = true;
                        setTimeout(function() {//Set a timeout here, because the follow events take time to all go through.
                            followTrainCheck();
                        }, 8e3);
                    }
                    lastFollowTime = $.systemTime();//last follow was here, save this time for later.
                    $.inidb.set('streamInfo', 'lastFollow', $.username.resolve(follower));//set the follower name in the db for the panel to read.
                }

                $.setIniDbBoolean('followed', follower, true);//set the follower as followed.
                /** Give points to the user if the caster wants to. */
                if (followReward > 0) {
                    $.inidb.incr('points', follower, followReward);
                }
                /** Write the follow name to a file for the caster to use */
                $.writeToFile($.username.resolve(follower), './addons/followHandler/latestFollower.txt', false);
            }
        }
    });

    /**
     * Gets the unfollow event from the core.
     *
     * @event twitchUnfollow
     */
    $.bind('twitchUnfollow', function(event) {
        /** Is the follow handler even on? */
        if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
            return;
        }

        var follower = event.getFollows().toLowerCase(),
            followed = $.getIniDbBoolean('followed', follower, false);

        /** is the user following us? Does the bot know about it? */
        if (followed) {
            $.setIniDbBoolean('followed', follower, false);
        }
    });

    /**
     * Gets the command event from the core.
     *
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            argString = event.getArguments(),
            action = args[0];

        /**
         * Set a follow reward for when someone follows.
         *
         * @commandpath followreward [amount] - Set the points reward for following
         */
        if (command.equalsIgnoreCase('followreward')) {
            if (!parseInt(action) || isNaN(action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.usage', $.pointNameMultiple, followReward));
                return;
            }

            followReward = action;
            $.inidb.set('settings', 'followReward', followReward);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.success', $.getPointsString(followReward)));
            $.log.event(sender + ' set the follow reward to ' + followReward);
        }

        /**
         * Set a follow message for when someome follows.
         *
         * @commandpath followmessage [message] - Set the new follower message when there is a reward
         */
        if (command.equalsIgnoreCase('followmessage')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.usage'));
                return;
            }

            followMessage = argString;
            $.inidb.set('settings', 'followMessage', followMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.success', followMessage));
            $.log.event(sender + ' set the follow message to ' + followMessage);
        }

        /**
         * Set a delay between follow announcements to stop chat spam. 
         *
         * @commandpath followdelay [message] - Set the delay in seconds between follow announcements
         */
        if (command.equalsIgnoreCase('followdelay')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followdelay.usage'));
                return;
            }

            followDelay = parseInt(args[0]);
            $.inidb.set('settings', 'followDelay', followDelay);
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followdelay.success', followDelay));
            $.log.event(sender + ' set the follow delay to ' + followDelay + ' seconds.');
        }

        /**
         * Toggles follow announcements.
         *
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
         * Toggles the follow train messages. This can and will get spammy.
         *
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
         * Check to see if a user is following your channel.
         *
         * @commandpath checkfollow [username] - Check if a user is following the channel
         */
        if (command.equalsIgnoreCase('checkfollow')) {
            if (!action) {
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

        /**
         * Gives a shoutout to a streamer with the last game they were playing, or are currently playing.
         *
         * @commandpath follow [streamer] - Give a shout out to a streamer.
         */
        if (command.equalsIgnoreCase('follow') || command.equalsIgnoreCase('shoutout') || command.equalsIgnoreCase('caster')) {
            if (!action) {
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
         * Sets a user as a follower in the db, this is for the heart on the panel.
         *
         * @commandpath fixfollow [user] - Will force add a user to the followed list to the bot, and will add a heart next to the name on the panel
         */
        if (command.equalsIgnoreCase('fixfollow')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.usage'));
                return;
            } else if ($.inidb.exists('followed', action)) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.error', action));
                return;
            } else if ($.twitch.GetUserFollowsChannel(action, $.channelName).getInt('_http') != 200) {
                $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.error.404', action));
                return;
            }

            $.inidb.set('followed', action, 'true');
            $.say($.whisperPrefix(sender) + $.lang.get('followhandler.fixfollow.added', action));
            $.log.event(sender + ' added ' + action + ' to the followed list.');
        }
    });

    /**
     * Register commands once the bot is fully loaded.
     *
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
            $.registerChatCommand('./handlers/followHandler.js', 'follow', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'shoutout', 2);
            $.registerChatCommand('./handlers/followHandler.js', 'caster', 2);
        }
    });

    $.updateFollowConfig = updateFollowConfig;
})();
