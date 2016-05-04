/**
 * twitterHandler.js
 *
 * Interfaces with Twitter.  Provides the connection to the Core to be provided
 * with Tweets and configuration of the module.  As the Core directly reads the
 * DB for configuration, there is not a need for local variables in this module.
 * 
 */
(function() {

    /* Set default values for the messages. */
    $.getSetIniDbString('twitter', 'message_online', 'Starting up a stream (twitchurl)');
    $.getSetIniDbString('twitter', 'message_gamechange', 'Changing game over to (game) (twitchurl)');

    /**
     * @event twitter
     */
    $.bind('twitter', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }
        var tweet = event.getTweet();

        $.say($.lang.get('twitter.tweet', tweet));
    });

    /**
     * @event twitchOnline
     */
    $.bind('twitchOnline', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }
        if ($.getIniDbBoolean('twitter', 'post_online', false)) {
            $.twitter.updateStatus($.getIniDbString('twitter', 'message_online').
                                       replace('(game)', $.twitchcache.getGameTitle()).
                                       replace('(twitchurl)', 'https://www.twitch.tv/' + $.ownerName));
        }
    });

    /**
     * @event twitchGameChange
     */
    $.bind('twitchGameChange', function(event) {
        if (!$.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            return;
        }
        if ($.getIniDbBoolean('twitter', 'post_gamechange', false)) {
            $.twitter.updateStatus($.getIniDbString('twitter', 'message_gamechange').
                                       replace('(game)', $.twitchcache.getGameTitle()).
                                       replace('(twitchurl)', 'https://www.twitch.tv/' + $.ownerName));
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            commandArg = args[0],
            subCommandArg = args[1],
            setCommandArg = args[2],
            setCommandVal = args[3],
            setCommandList = [ 'mentions', 'retweets', 'hometimeline', 'usertimeline' ],
            minVal;

        /**
         * @commandpath twitter - Twitter base command
         */
        if (command.equalsIgnoreCase('twitter')) {
            if (commandArg === undefined) {
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
                        setCommandVal = $.getSetIniDbNumber('twitter', 'polldelay_' + setCommandArg, setCommandArg.equalsIgnoreCase('usertimeline') ? 15 : 60);
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (isNaN(setCommandVal)) {
                        setCommandVal = $.getSetIniDbNumber('twitter', 'polldelay_' + setCommandArg, setCommandArg.equalsIgnoreCase('usertimeline') ? 15 : 60);
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    minVal = setCommandArg.equalsIgnoreCase('usertimeline') ? 15 : 60;
                    if (parseInt(setCommandVal) < minVal) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.minerror', minVal));
                        return;
                    }
                    $.inidb.set('twitter', 'polldelay_' + setCommandArg, setCommandVal);
                    $.say($whisperPrefix(sender) + $.lang.get('twitter.set.polldelay.' + setCommandArg + '.success', setCommandVal));
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
                        setCommandVal = $.getSetIniDbBoolean('twitter', 'poll_' + setCommandArg, false);
                        setCommandVal = setCommandVal ? 'on' : 'off';
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.poll.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (!setCommandVal.equalsIgnoreCase('on') && !setCommandVal.equalsIgnoreCase('off')) {
                        setCommandVal = $.getSetIniDbBoolean('twitter', 'poll_' + setCommandArg, false);
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
                     */
                    if (!setCommandArg.equalsIgnoreCase('online') && !setCommandArg.equalsIgnoreCase('gamechange')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.usage'));
                        return;
                    }
                    if (setCommandVal === undefined) {
                        setCommandVal = $.getSetIniDbBoolean('twitter', 'post_' + setCommandArg, false);
                        setCommandVal = setCommandVal ? 'on' : 'off';
                        $.say($.whisperPrefix(sender) + $.lang.get('twitter.set.post.' + setCommandArg + '.usage', setCommandVal));
                        return;
                    }
                    if (!setCommandVal.equalsIgnoreCase('on') && !setCommandVal.equalsIgnoreCase('off')) {
                        setCommandVal = $.getSetIniDbBoolean('twitter', 'post_' + setCommandArg, false);
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
                     */
                    if (!setCommandArg.equalsIgnoreCase('online') && !setCommandArg.equalsIgnoreCase('gamechange')) {
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
                if ($.twitter.updateStatus(args.splice(1).join(' '))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.post.sent', args.splice(0).join(' ')));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.post.failed'));
                }
                return;
            }

            /**
             * @commandpath twitter lasttweet - Display the last Tweet on the home or user timeline
             */
            if (commandArg.equalsIgnoreCase('lasttweet')) {
                if ($.getSetIniDbBoolean('twitter', 'poll_hometimeline', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.lasttweet', $.getIniDbString('twitter', 'last_hometimeline', 'No Tweets have been pulled yet!')));
                    return;
                }
                if ($.getSetIniDbBoolean('twitter', 'poll_usertimeline', false)) {
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
                if ($.getSetIniDbBoolean('twitter', 'poll_mentions', false)) {
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
                if ($.getSetIniDbBoolean('twitter', 'poll_retweets', false)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('twitter.lastretweet', $.getIniDbString('twitter', 'last_retweets', 'No Retweets have been pulled yet!')));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('twitter.lastretweet.disabled'));
                return;
            }
        } // if (command.equalsIgnoreCase('twitter'))
    }); /* @event command */

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./handlers/twitterHandler.js')) {
            $.registerChatCommand('./handlers/twitterHandler.js', 'twitter', 7);
            $.registerChatSubcommand('twitter', 'set', 1);
            $.registerChatSubcommand('twitter', 'post', 1);
            $.registerChatSubcommand('twitter', 'lasttweet', 7);
            $.registerChatSubcommand('twitter', 'lastmention', 7);
            $.registerChatSubcommand('twitter', 'lastretweet', 7);
        }
    });

})();
