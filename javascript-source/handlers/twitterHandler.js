/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * twitterHandler.js
 *
 * Interfaces with Twitter.  Provides the connection to the Core to be provided
 * with Tweets and configuration of the module.  As the Core directly reads the
 * DB for configuration, there is not a need for local variables in this module.
 *
 */


/**
 * Anything you modify or remove in this script is at your own risk with Twitter.
 */
(function () {
    var randPrev = 0,
            onlinePostDelay = 480 * 6e4, // 8 hour cooldown
            gameChangeDelay = 60 * 6e4, // 1 hour cooldown
            interval;

    /* Set default values for all configuration items. */
    $.getSetIniDbString('twitter', 'message_online', 'Starting up a stream (twitchurl)');
    $.getSetIniDbString('twitter', 'message_gamechange', 'Changing game over to (game) (twitchurl)');
    $.getSetIniDbString('twitter', 'message_update', 'Still streaming (game) [(uptime)] (twitchurl)');

    $.getSetIniDbNumber('twitter', 'polldelay_mentions', 60);
    $.getSetIniDbNumber('twitter', 'polldelay_retweets', 60);
    $.getSetIniDbNumber('twitter', 'polldelay_hometimeline', 60);
    $.getSetIniDbNumber('twitter', 'polldelay_usertimeline', 15);
    $.getSetIniDbNumber('twitter', 'postdelay_update', 180);
    $.getSetIniDbNumber('twitter', 'reward_points', 100);
    $.getSetIniDbNumber('twitter', 'reward_cooldown', 4);

    $.getSetIniDbBoolean('twitter', 'poll_mentions', false);
    $.getSetIniDbBoolean('twitter', 'poll_retweets', false);
    $.getSetIniDbBoolean('twitter', 'poll_hometimeline', false);
    $.getSetIniDbBoolean('twitter', 'poll_usertimeline', false);
    $.getSetIniDbBoolean('twitter', 'post_online', false);
    $.getSetIniDbBoolean('twitter', 'post_gamechange', false);
    $.getSetIniDbBoolean('twitter', 'post_update', false);
    $.getSetIniDbBoolean('twitter', 'reward_toggle', false);
    $.getSetIniDbBoolean('twitter', 'reward_announce', false);

    /**
     * @event twitter
     */
    $.bind('twitter', function (event) {
        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }
        if (event.getMentionUser() != null) {
            $.say($.lang.get('twitter.tweet.mention', event.getMentionUser(), event.getTweet()).replace('(twitterid)', $.twitter.getUsername() + ''));
        } else {
            $.say($.lang.get('twitter.tweet', event.getTweet()).replace('(twitterid)', $.twitter.getUsername() + ''));
        }
    });

    /**
     * @event twitterRetweet
     */
    $.bind('twitterRetweet', function (event) {
        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }

        /* The core only generates this event if reward_toggle is enabled, therefore, we do not check the toggle here. */
        if ($.getIniDbNumber('twitter', 'reward_points') == 0) {
            return;
        }

        var userNameArray = event.getUserNameArray(),
                i,
                twitterUserName,
                rewardNameArray = [],
                lastRetweet,
                userName,
                reward = $.getIniDbNumber('twitter', 'reward_points'),
                cooldown = $.getIniDbFloat('twitter', 'reward_cooldown') * 3.6e6,
                now = $.systemTime();

        for (i in userNameArray) {
            twitterUserName = userNameArray[i].toLowerCase();
            userName = $.inidb.GetKeyByValue('twitter_mapping', '', twitterUserName);
            if (userName === null) {
                continue;
            }

            lastRetweet = $.getIniDbNumber('twitter_user_last_retweet', userName, 0);
            if (now - lastRetweet > cooldown) {
                rewardNameArray.push(userName);
                $.inidb.incr('points', userName, reward);
                $.setIniDbNumber('twitter_user_last_retweet', userName, now);
            }
        }

        if (rewardNameArray.length > 0 && $.getIniDbBoolean('twitter', 'reward_announce')) {
            $.say($.lang.get('twitter.reward.announcement', rewardNameArray.join(', '), $.getPointsString(reward)));
        }
    });

    /**
     * @event twitchOnline
     */
    $.bind('twitchOnline', function (event) {
        var randNum,
                now = $.systemTime(),
                message = $.getIniDbString('twitter', 'message_online');

        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }

        if ($.getIniDbBoolean('twitter', 'post_online', false)) {
            if (now > $.getIniDbNumber('twitter', 'last_onlinepost', 0) + onlinePostDelay) {
                $.inidb.set('twitter', 'last_onlinepost', now + onlinePostDelay);
                do {
                    randNum = $.randRange(1, 9999);
                } while (randNum == randPrev);
                randPrev = randNum;
                $.twitter.updateStatus(String(message).replace('(title)', $.twitchcache.getStreamStatus()).replace('(game)', $.twitchcache.getGameTitle()).replace('(twitchurl)', 'https://www.twitch.tv/' + $.ownerName + '?' + randNum).replace(/\(enter\)/g, '\r\n'));
            }
        }
    });

    /**
     * @event twitchGameChange
     */
    $.bind('twitchGameChange', function (event) {
        var now = $.systemTime(),
                message = $.getIniDbString('twitter', 'message_gamechange');
        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }

        if ($.twitchcache.getGameTitle() == '') {
            return;
        }

        if ($.getIniDbBoolean('twitter', 'post_gamechange', false) && $.isOnline($.channelName)) {
            if (now > $.getIniDbNumber('twitter', 'last_gamechange', 0) + gameChangeDelay) {
                $.inidb.set('twitter', 'last_gamechange', now + gameChangeDelay);
                var randNum,
                        uptimeSec = $.getStreamUptimeSeconds($.channelName),
                        hrs = (uptimeSec / 3600 < 10 ? '0' : '') + Math.floor(uptimeSec / 3600),
                        min = ((uptimeSec % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptimeSec % 3600) / 60);

                do {
                    randNum = $.randRange(1, 9999);
                } while (randNum == randPrev);
                randPrev = randNum;
                $.twitter.updateStatus(String(message).replace('(title)', $.twitchcache.getStreamStatus()).replace('(game)', $.twitchcache.getGameTitle()).replace('(uptime)', hrs + ':' + min).replace('(twitchurl)', 'https://www.twitch.tv/' + $.ownerName + '?' + randNum).replace(/\(enter\)/g, '\r\n'));
            }
        }
    });

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
                command = event.getCommand(),
                args = event.getArgs(),
                commandArg = args[0],
                subCommandArg = args[1],
                setCommandArg = args[2],
                setCommandVal = args[3],
                setCommandList = ['mentions', 'retweets', 'hometimeline', 'usertimeline'],
                setRewardCommandList = ['toggle', 'points', 'cooldown', 'announce'],
                minVal;

        /**
         * @commandpath twitter - Twitter base command
         */
        if (command.equalsIgnoreCase('twitter')) {
            if (commandArg === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.id', $.ownerName, $.twitter.getUsername() + '') + ' ' + $.lang.get('twitter.usage.id'));
                return;
            }

            /**
             * @commandpath twitter usage - Display the Twitter usage
             */
            if (commandArg.equalsIgnoreCase('usage')) {
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.usage'));
                return;
            }

            /**
             * @commandpath twitter set - Twitter configuration base command
             */
            if (commandArg.equalsIgnoreCase('set')) {
                if (subCommandArg === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.usage'));
                    return;
                }

                /**
                 * @commandpath twitter set reward - Base command for retweet rewards
                 */
                if (subCommandArg.equalsIgnoreCase('reward')) {
                    if (setCommandArg === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.usage'));
                        return;
                    }

                    /**
                     * @commandpath twitter set reward toggle [on/off] - Reward users that retweet.
                     * @commandpath twitter set reward points [points] - Amount of points to reward a retweet.
                     * @commandpath twitter set reward cooldown [hours] - Number of hours to wait between another retweet reward.
                     * @commandpath twitter set reward announce [on/off] - Announce retweet rewards in chat.
                     */
                    if (setRewardCommandList.indexOf(setCommandArg + '') === -1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.usage'));
                        return;
                    }
                    if (setCommandVal === undefined) {
                        if (setCommandArg.equalsIgnoreCase('toggle') || setCommandArg.equalsIgnoreCase('announce')) {
                            setCommandVal = $.getIniDbBoolean('twitter', 'reward_' + setCommandArg, false);
                            setCommandVal = setCommandVal ? 'on' : 'off';
                        } else {
                            setCommandVal = $.getIniDbFloat('twitter', 'reward_' + setCommandArg);
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (setCommandArg.equalsIgnoreCase('toggle') || setCommandArg.equalsIgnoreCase('announce')) {
                        if (!setCommandVal.equalsIgnoreCase('on') && !setCommandVal.equalsIgnoreCase('off')) {
                            setCommandVal = $.getIniDbBoolean('twitter', 'reward_' + setCommandArg, false);
                            setCommandVal = setCommandVal ? 'on' : 'off';
                            $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.' + setCommandArg + '.usage', setCommandVal));
                            return;
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.' + setCommandArg + '.success', setCommandVal.toLowerCase()));
                        setCommandVal = setCommandVal.equalsIgnoreCase('on') ? 'true' : 'false';
                        $.inidb.set('twitter', 'reward_' + setCommandArg, setCommandVal);
                    } else {
                        if (isNaN(setCommandVal)) {
                            setCommandVal = $.getIniDbNumber('twitter', 'reward_' + setCommandArg);
                            $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.' + setCommandArg + '.usage', setCommandVal));
                            return;
                        }
                        $.inidb.set('twitter', 'reward_' + setCommandArg, setCommandVal);
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.reward.' + setCommandArg + '.success', setCommandVal));
                        return;
                    }
                }

                /**
                 * @commandpath twitter set polldelay - Twitter poll delay base command
                 */
                if (subCommandArg.equalsIgnoreCase('polldelay')) {
                    if (setCommandArg === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.usage'));
                        return;
                    }

                    /**
                     * @commandpath twitter set polldelay mentions [seconds] - Poll delay for mentions in seconds. Minimum is 60.
                     * @commandpath twitter set polldelay retweets [seconds] - Poll delay for retweets in seconds. Minimum is 60.
                     * @commandpath twitter set polldelay hometimeline [seconds] - Poll delay for home timeline in seconds. Minimum is 60.
                     * @commandpath twitter set polldelay usertimeline [seconds] - Poll delay for user timeline in seconds. Minimum is 15.
                     */
                    if (setCommandList.indexOf(setCommandArg + '') === -1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.usage'));
                        return;
                    }
                    if (setCommandVal === undefined) {
                        setCommandVal = $.getIniDbNumber('twitter', 'polldelay_' + setCommandArg, setCommandArg.equalsIgnoreCase('usertimeline') ? 15 : 60);
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (isNaN(setCommandVal)) {
                        setCommandVal = $.getIniDbNumber('twitter', 'polldelay_' + setCommandArg, setCommandArg.equalsIgnoreCase('usertimeline') ? 15 : 60);
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    minVal = setCommandArg.equalsIgnoreCase('usertimeline') ? 15 : 60;
                    if (parseInt(setCommandVal) < minVal) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.minerror', minVal));
                        return;
                    }
                    $.inidb.set('twitter', 'polldelay_' + setCommandArg, setCommandVal);
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.' + setCommandArg + '.success', setCommandVal));
                    return;
                }

                /**
                 * @commandpath twitter set poll - Twitter poll configuration base command
                 */
                if (subCommandArg.equalsIgnoreCase('poll')) {
                    if (setCommandArg === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.poll.usage'));
                        return;
                    }

                    /**
                     * @commandpath twitter set poll mentions [on/off] - Poll mentions from Twitter.
                     * @commandpath twitter set poll retweets [on/off] - Poll retweets from Twitter.
                     * @commandpath twitter set poll hometimeline [on/off] - Poll home timeline from Twitter. Disables all other polling in the Core.
                     * @commandpath twitter set poll usertimeline [on/off] - Poll user timeline from Twitter.
                     */
                    if (setCommandList.indexOf(setCommandArg + '') === -1) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.poll.usage'));
                        return;
                    }
                    if (setCommandVal === undefined) {
                        setCommandVal = $.getIniDbBoolean('twitter', 'poll_' + setCommandArg, false);
                        setCommandVal = setCommandVal ? 'on' : 'off';
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.poll.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (!setCommandVal.equalsIgnoreCase('on') && !setCommandVal.equalsIgnoreCase('off')) {
                        setCommandVal = $.getIniDbBoolean('twitter', 'poll_' + setCommandArg, false);
                        setCommandVal = setCommandVal ? 'on' : 'off';
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.poll.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.poll.' + setCommandArg + '.success', setCommandVal.toLowerCase()));
                    setCommandVal = setCommandVal.equalsIgnoreCase('on') ? 'true' : 'false';
                    $.inidb.set('twitter', 'poll_' + setCommandArg, setCommandVal);
                    return;
                }

                /**
                 * @commandpath twitter set post - Twitter automatic post configuration base command
                 */
                if (subCommandArg.equalsIgnoreCase('post')) {
                    if (setCommandArg === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.usage'));
                        return;
                    }

                    /**
                     * @commandpath twitter set post online [on/off] - Automatically post when the stream is detected as going online.
                     * @commandpath twitter set post gamechange [on/off] - Automatically post when a game change is peformed via the !game command.
                     * @commandpath twitter set post update [on/off] - Automatically post an update to Twitter on a timed interval (!twitter set updatetimer).
                     */
                    if (!setCommandArg.equalsIgnoreCase('online') && !setCommandArg.equalsIgnoreCase('gamechange') && !setCommandArg.equalsIgnoreCase('update')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.usage'));
                        return;
                    }
                    if (setCommandVal === undefined) {
                        setCommandVal = $.getIniDbBoolean('twitter', 'post_' + setCommandArg, false);
                        setCommandVal = setCommandVal ? 'on' : 'off';
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (!setCommandVal.equalsIgnoreCase('on') && !setCommandVal.equalsIgnoreCase('off')) {
                        setCommandVal = $.getIniDbBoolean('twitter', 'post_' + setCommandArg, false);
                        setCommandVal = setCommandVal ? 'on' : 'off';
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.' + setCommandArg + '.success', setCommandVal.toLowerCase()));
                    setCommandVal = setCommandVal.equalsIgnoreCase('on') ? 'true' : 'false';
                    $.inidb.set('twitter', 'post_' + setCommandArg, setCommandVal);
                    return;
                }

                /**
                 * @commandpath twitter set updatetimer [minutes] - Twitter automatic post timer. Posts updates about the stream in progress.
                 */
                if (subCommandArg.equalsIgnoreCase('updatetimer')) {
                    setCommandVal = setCommandArg;
                    if (setCommandVal == undefined) {
                        setCommandVal = $.getIniDbNumber('twitter', 'postdelay_update');
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.updatetimer.usage', setCommandVal));
                        return;
                    }
                    if (isNaN(setCommandVal)) {
                        setCommandVal = $.getIniDbNumber('twitter', 'postdelay_update');
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.updatetimer.usage', setCommandVal));
                        return;
                    }
                    if (parseInt(setCommandVal) <= 180) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.updatetimer.toosmall', setCommandVal));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.updatetimer.success', setCommandVal));
                    $.inidb.set('twitter', 'postdelay_update', setCommandVal);
                    return;
                }

                /**
                 * @commandpath twitter set message - Twitter automatic post message configuration base command
                 */
                if (subCommandArg.equalsIgnoreCase('message')) {
                    if (setCommandArg === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.message.usage'));
                        return;
                    }

                    /**
                     * @commandpath twitter set message online [message] - Configures message that is sent out when stream goes online. Tags: (game) (twitchurl)
                     * @commandpath twitter set message gamechange [message] - Configures message that is sent out on game change. Tags: (game) (twitchurl)
                     * @commandpath twitter set message update [message] - Configures message that is sent out on an interval basis. Tags: (game) (twitchurl) (uptime)
                     */
                    if (!setCommandArg.equalsIgnoreCase('online') && !setCommandArg.equalsIgnoreCase('gamechange') && !setCommandArg.equalsIgnoreCase('update')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.message.usage'));
                        return;
                    }
                    if (setCommandVal === undefined) {
                        setCommandVal = $.getIniDbString('twitter', 'message_' + setCommandArg);
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.message.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    setCommandVal = args.splice(3).join(' ');
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.message.' + setCommandArg + '.success', setCommandVal));
                    $.inidb.set('twitter', 'message_' + setCommandArg, setCommandVal);
                    return;
                }
            }

            /**
             * @commandpath twitter post [message] - Post a message to Twitter
             */
            if (commandArg.equalsIgnoreCase('post')) {
                if (args.length === 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.post.usage'));
                    return;
                }
                var retval = $.twitter.updateStatus(String(args.splice(1).join(' ')).replace(/\(enter\)/g, '\r\n')) + '';
                if (retval) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.post.sent', args.splice(1).join(' ')));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.post.failed'));
                }
                return;
            }

            /**
             * @commandpath twitter lasttweet - Display the last Tweet on the home or user timeline
             */
            if (commandArg.equalsIgnoreCase('lasttweet')) {
                if ($.getIniDbBoolean('twitter', 'poll_hometimeline', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.lasttweet', $.getIniDbString('twitter', 'last_hometimeline', 'No Tweets have been pulled yet!')));
                    return;
                }
                if ($.getIniDbBoolean('twitter', 'poll_usertimeline', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.lasttweet', $.getIniDbString('twitter', 'last_usertimeline', 'No Tweets have been pulled yet!')));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.lasttweet.disabled'));
                return;
            }

            /**
             * @commandpath twitter lastmention - Display the last @mention from Twitter
             */
            if (commandArg.equalsIgnoreCase('lastmention')) {
                if ($.getIniDbBoolean('twitter', 'poll_mentions', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.lastmention', $.getIniDbString('twitter', 'last_mentions', 'No Mentions have been pulled yet!')));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.lastmention.disabled'));
                return;
            }

            /**
             * @commandpath twitter lastretweet - Display the last retweeted message on Twitter
             */
            if (commandArg.equalsIgnoreCase('lastretweet')) {
                if ($.getIniDbBoolean('twitter', 'poll_retweets', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.lastretweet', $.getIniDbString('twitter', 'last_retweets', 'No Retweets have been pulled yet!')));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.lastretweet.disabled'));
                return;
            }

            /**
             * @commandpath twitter id - Display the configured Twitter ID for the caster
             */
            if (commandArg.equalsIgnoreCase('id')) {
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.id', $.ownerName, $.twitter.getUsername() + ''));
                return;
            }

            /**
             * @commandpath twitter register [twitter_id] - Register your Twitter username
             */
            if (commandArg.equalsIgnoreCase('register')) {
                if (subCommandArg === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.register.usage', $.getIniDbString('twitter_mapping', sender, $.lang.get('twitter.register.notregistered'))));
                    return;
                }
                if ($.inidb.GetKeyByValue('twitter_mapping', '', subCommandArg.toLowerCase()) !== null) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.register.inuse', subCommandArg.toLowerCase()));
                    return;
                }
                $.setIniDbString('twitter_mapping', sender, subCommandArg.toLowerCase());
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.register.success', subCommandArg.toLowerCase()));
                return;
            }

            /**
             * @commandpath twitter unregister - Unregister your Twitter username
             */
            if (commandArg.equalsIgnoreCase('unregister')) {
                $.inidb.del('twitter_mapping', sender);
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.unregister'));
                return;
            }

        } /* if (command.equalsIgnoreCase('twitter')) */
    }); /* @event command */

    /**
     * @function checkAutoUpdate
     */
    function checkAutoUpdate() {
        var message = $.getIniDbString('twitter', 'message_update');

        /*
         * If not online, nothing to do. The last_autoupdate is reset to ensure that
         * the moment a stream comes online an additional Tweet is not sent out.
         */
        if (!$.isOnline($.channelName)) {
            $.inidb.set('twitter', 'last_autoupdate', $.systemTime());
            return;
        }

        if ($.getIniDbBoolean('twitter', 'post_update', false)) {
            var lastUpdateTime = $.getSetIniDbNumber('twitter', 'last_autoupdate', $.systemTime());

            if (($.systemTime() - lastUpdateTime) >= ($.getIniDbNumber('twitter', 'postdelay_update', 180) * 6e4)) { // 3 hour cooldown
                var DownloadHTTP = Packages.com.illusionaryone.ImgDownload;
                var success = DownloadHTTP.downloadHTTP($.twitchcache.getPreviewLink(), 'twitch-preview.jpg'),
                        uptimeSec = $.getStreamUptimeSeconds($.channelName),
                        hrs = (uptimeSec / 3600 < 10 ? '0' : '') + Math.floor(uptimeSec / 3600),
                        min = ((uptimeSec % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptimeSec % 3600) / 60);

                $.inidb.set('twitter', 'last_autoupdate', $.systemTime());

                if (success.equals('true')) {
                    $.twitter.updateStatus(String(message).replace('(title)', $.twitchcache.getStreamStatus()).replace('(game)', $.twitchcache.getGameTitle()).replace('(twitchurl)', 'https://www.twitch.tv/' + $.ownerName + '?' + uptimeSec).replace(/\(enter\)/g, '\r\n').replace('(uptime)', hrs + ':' + min),
                            './addons/downloadHTTP/twitch-preview.jpg', 'TWEET_IMAGE');
                } else {
                    $.twitter.updateStatus(String(message).replace('(title)', $.twitchcache.getStreamStatus()).replace('(game)', $.twitchcache.getGameTitle()).replace('(twitchurl)', 'https://www.twitch.tv/' + $.ownerName + '?' + uptimeSec).replace('(uptime)', hrs + ':' + min).replace(/\(enter\)/g, '\r\n'));
                }
                $.log.event('Sent Auto Update to Twitter');
            }
        }
    }

    interval = setInterval(function () {
        checkAutoUpdate();
    }, 8e4);

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/twitterHandler.js', 'twitter', 7);
        $.registerChatSubcommand('twitter', 'set', 1);
        $.registerChatSubcommand('twitter', 'post', 1);
        $.registerChatSubcommand('twitter', 'lasttweet', 7);
        $.registerChatSubcommand('twitter', 'lastmention', 7);
        $.registerChatSubcommand('twitter', 'lastretweet', 7);
        $.registerChatSubcommand('twitter', 'id', 7);
        $.registerChatSubcommand('twitter', 'register', 7);
        $.registerChatSubcommand('twitter', 'unregister', 7);
    });
})();
