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
      check = false,
      followReward = ($.inidb.exists('settings', 'followReward') ? parseInt($.inidb.get('settings', 'followReward')) : 100);
      followMessage = ($.inidb.exists('settings', 'followMessage') ? $.inidb.get('settings', 'followMessage') : $.lang.get('followhandler.follow.message'));

    /**
   * @function checkFollowTrain
   */
  function checkFollowTrain() {
    if (followReward > 0) {
      if (($.systemTime() - lastFollowTime) > 65e3) {
      	check = false;
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
    	var follower = event.getFollower();
    	    follower = $.username.resolve(follower),
    	    followmsg = followMessage;
    
    	   if (!$.inidb.exists('followed', follower) && $.bot.isModuleEnabled('./handlers/followHandler.js')) {
    	   	   if (followReward > 0) {
    	   	   	   $.inidb.incr('points', follower.toLowerCase(), followReward);
    	   	   }
    
    	   	   if (announceFollows) {
                   followmsg = followmsg.replace('(name)', follower);
                   followmsg = followmsg.replace('(reward)', followReward);
    	   	   	   $.say(followmsg);
    	   	   }
    
    	   	   $.inidb.set('followed', follower, true);
    	   	   $.writeToFile($.username.resolve(follower), "./addons/followHandler/latestFollower.txt", false);
    	   	   followTrain += 1;
    	   	   if (!check) {
    	   	      var i = setTimeout(function () {
    	   	       	checkFollowTrain();
    	   	    }, 15e3);
    	   	    check = true;
    	   	}
    	}
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
        argString = event.getArguments();
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
        if (!comArg || isNaN(comArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('followhandler.set.followmessage.usage'));
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
