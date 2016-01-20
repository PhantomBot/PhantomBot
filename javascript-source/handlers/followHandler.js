/**
 * followHandler.js
 *
 * Register new followers and unfollows in the channel
 * Optionally supports rewarding points for a follow (Only the first time!)
 */
(function () {
  var lastFollowTime = 0,
      followTrain = 0,
      announceFollows = false,
      followReward = ($.inidb.exists('settings', 'followReward') ? parseInt($.inidb.get('settings', 'followReward')) : 100);

  /**
   * @function checkFollowTrain
   */
  function checkFollowTrain() {
    if (followReward > 0) {
      if (($.systemTime() - lastFollowTime) < 36e5) {
        followTrain += 1;

        if (followTrain == 3) {
          $.say($.lang.get('followhandler.followtrain.triple'));
        }
        else if (followTrain == 4) {
          $.say($.lang.get('followhandler.followtrain.quad'));
        }
        else if (followTrain == 5) {
          $.say($.lang.get('followhandler.followtrain.penta'));
        }
        else if (followTrain > 5 && followTrain <= 10) {
          $.say($.lang.get('followhandler.followtrain.mega', followTrain));
        }
        else if (followTrain > 10 && followTrain <= 20) {
          $.say($.lang.get('followhandler.followtrain.ultra', followTrain));
        }
        else if (followTrain > 20) {
          $.say($.lang.get('followhandler.followtrain.unbelievable', followTrain));
        }
      }
      else {
        followTrain = 1;
      }
    }
    lastFollowTime = $.systemTime();
  };

  /**
   * @event twitchFollowsInitialized
   */
  $.bind('twitchFollowsInitialized', function () {
    $.consoleLn($.lang.get('followhandler.anouncements.enabled'));
    announceFollows = true;
  });

  /**
   * @event twitchFollow
   */
  $.bind('twitchFollow', function (event) {
    var follower = event.getFollows().toLowerCase();

    if ($.inidb.exists('followed', follower)) {
      return;
    }

    if ($.bot.isModuleEnabled('./commands/lastseenCommand.js')) {
      $.inidb.set('lastseen', follower, $.systemTime());
    }

    if (announceFollows && !$.inidb.exists('followed', follower)) {
      if (followReward > 0) {
        $.inidb.incr('points', follower, followReward);
        $.say($.lang.get('followhandler.new.follow',
            $.username.resolve(follower), $.getPointsString(followReward)));
      } else {
        $.say($.lang.get('followhandler.new.follow.noreward', $.username.resolve(follower)));
      }
    }

    $.setIniDbBoolean('followed', follower, true);
    $.writeToFile($.username.resolve(follower), "./addons/followHandler/latestFollower.txt", false);
    checkFollowTrain();
  });

  $.bind('twitchUnfollow', function (event) {
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
      $.registerChatCommand('./handlers/followHandler.js', 'checkfollow', 2);
      $.registerChatCommand('./handlers/followHandler.js', 'followers', 7);
    }
  });
})();