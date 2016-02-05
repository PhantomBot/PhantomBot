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
(function () {
  var lastFollowTime = 0,
      followTrain = 0,
      announceFollows = false,
      followReward = ($.inidb.exists('settings', 'followReward') ? parseInt($.inidb.get('settings', 'followReward')) : 100),
      followMessage = ($.inidb.exists('settings', 'followMessage') ? $.inidb.get('settings', 'followMessage') : $.lang.get('followhandler.follow.message'));

  /**
   * @function checkFollowTrain
   */
  function checkFollowTrain() {
    if (($.systemTime() - lastFollowTime) > 3e5) {
      if (followTrain == 3) {
        $.say($.lang.get('followhandler.followtrain.triple'));
      }
      else if (followTrain == 4) {
        $.say($.lang.get('followhandler.followtrain.quad'));
      }
      else if (followTrain == 5) {
        $.say($.lang.get('followhandler.followtrain.penta'));
      }
      else if (followTrain == 20) {
        $.say($.lang.get('followhandler.followtrain.mega', followTrain));
      }
      else if (followTrain == 30) {
        $.say($.lang.get('followhandler.followtrain.ultra', followTrain));
      }
      else if (followTrain == 50) {
        $.say($.lang.get('followhandler.followtrain.unbelievable', followTrain));
      } else {
        ++followTrain;
      }
    }
    else {
      followTrain = 1;
    }
    lastFollowTime = $.systemTime();
  };

  /**
   * @event twitchFollowsInitialized
   */
  $.bind('twitchFollowsInitialized', function () {
    if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
      return;
    }

    $.consoleLn($.lang.get('followhandler.anouncements.enabled'));
    announceFollows = true;
  });

  /**
   * @event twitchFollow
   */
  $.bind('twitchFollow', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/followHandler.js')) {
      return;
    }

    var follower = event.getFollower().toLowerCase();

    if ($.inidb.exists('followed', follower)) {
      return;
    }

    if ($.bot.isModuleEnabled('./commands/lastseenCommand.js')) {
      $.inidb.set('lastseen', follower, $.systemTime());
    }

    if (followReward > 0) {
      $.inidb.incr('points', follower, followReward);
    }

    if (announceFollows) {
			followmsg = followMessage.replace('(name)',$.username.resolve(follower)); 
      if (followReward > 0) {
			followmsg = followmsg.replace('(reward)', $.getPointsString(followReward));
			$.say(followmsg);
      } else {
			$.say(followmsg.replace('(name)',$.username.resolve(follower)));
      }
    }

    $.setIniDbBoolean('followed', follower, true);
    $.writeToFile($.username.resolve(follower), "./addons/followHandler/latestFollower.txt", false);
    checkFollowTrain();
  });

  $.bind('twitchUnfollow', function (event) {
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
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        argString = event.getArguments(),
        comArg = args[0];

    /**
     * @commandpath followreward [amount] - Set the points reward for following
     */
    if (command.equalsIgnoreCase('followreward')) {
      comArg = parseInt(comArg);
      if (!comArg || isNaN(comArg)) {
        $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.usage', $.pointNameMultiple));
      }

      followReward = comArg;
      $.inidb.set('settings', 'followReward', followReward);
      $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followreward.success', $.getPointsString(followReward)));
    }

    /**
     * @commandpath followmessage [message] - Set the follow message
     */
    if (command.equalsIgnoreCase('followmessage')) {
      if (!comArg) {
        $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.usage'));
        return;
      }

      followMessage = argString;
      $.inidb.set('settings', 'followMessage', followMessage);
      $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.success'));
    }

    /**
     * @commandpath followers - Announce the current amount of followers
     */
    if (command.equalsIgnoreCase('followers')) {
      $.say($.lang.get('followhandler.followers', $.getFollows($.channelName)))
    }

    /**
     * @commandpath checkfollow [usename] - Check if a user is following the channel
     */
    if (command.equalsIgnoreCase('checkfollow')) {
      comArg = comArg.toLowerCase();
      if (!comArg || comArg == '') {
        $.say($.whisperPrefix(sender) + $.lang.get('followhandler.check.usage'));
        return;
      }

      if ($.user.isFollower(comArg)) {
        $.say($.lang.get('followhandler.check.follows', $.username.resolve(comArg)));
      } else {
        $.say($.lang.get('followhandler.check.notfollows', $.username.resolve(comArg)));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./handlers/followHandler.js')) {
      $.registerChatCommand('./handlers/followHandler.js', 'followreward', 1);
      $.registerChatCommand('./handlers/followHandler.js', 'followmessage', 1);
      $.registerChatCommand('./handlers/followHandler.js', 'checkfollow', 2);
      $.registerChatCommand('./handlers/followHandler.js', 'followers', 7);
    }
  });
})();
