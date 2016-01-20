(function () {
  var ircPrefix = '.',
      permitList = [],
      linkWhiteList = [],

      linksAllowed = ($.inidb.exists('chatModerator', 'linksAllowed') ? $.getIniDbBoolean('chatModerator', 'linksAllowed') : true),
      youtubeLinksAllowed = ($.inidb.exists('chatModerator', 'youtubeLinksAllowed') ? $.getIniDbBoolean('chatModerator', 'youtubeLinksAllowed') : true),
      regsLinksAllowed = ($.inidb.exists('chatModerator', 'regsLinksAllowed') ? $.getIniDbBoolean('chatModerator', 'regsLinksAllowed') : true),
      linksAgressive = ($.inidb.exists('chatModerator', 'linksAgressive') ? $.getIniDbBoolean('chatModerator', 'linksAgressive') : false),
      linkPurgeMessage = ($.inidb.exists('chatModerator', 'linkPurgeMessage') ? $.inidb.get('chatModerator', 'linkPurgeMessage') : ''),
      linkPermitTime = ($.inidb.exists('chatModerator', 'linkPermitTime') ? parseInt($.inidb.get('chatModerator', 'linkPermitTime')) : 60),

      capsAllowed = ($.inidb.exists('chatModerator', 'capsAllowed') ? $.getIniDbBoolean('chatModerator', 'capsAllowed') : true),
      capsTriggerRatio = ($.inidb.exists('chatModerator', 'capsTriggerRatio') ? parseFloat($.inidb.get('chatModerator', 'capsTriggerRatio')) : 0),
      capsTriggerLength = ($.inidb.exists('chatModerator', 'capsTriggerLength') ? parseInt($.inidb.get('chatModerator', 'capsTriggerLength')) : 10),
      capsPurgeMessage = ($.inidb.exists('chatModerator', 'capsPurgeMessage') ? $.inidb.get('chatModerator', 'capsPurgeMessage') : ''),

      symbolsAllowed = ($.inidb.exists('chatModerator', 'symbolsAllowed') ? $.getIniDbBoolean('chatModerator', 'symbolsAllowed') : true),
      symbolsTriggerCount = ($.inidb.exists('chatModerator', 'symbolsTriggerCount') ? parseInt($.inidb.get('chatModerator', 'symbolsTriggerCount')) : 0),
      symbolsPurgeMessage = ($.inidb.exists('chatModerator', 'symbolsPurgeMessage') ? $.inidb.get('chatModerator', 'symbolsPurgeMessage') : ''),

      repeatCharAllowed = ($.inidb.exists('chatModerator', 'repeatCharAllowed') ? $.getIniDbBoolean('chatModerator', 'repeatCharAllowed') : true),
      repeatCharTriggerLength = ($.inidb.exists('chatModerator', 'repeatCharTriggerLength') ? parseInt($.inidb.get('chatModerator', 'repeatCharTriggerLength')) : 0),
      repeatCharPurgeMessage = ($.inidb.exists('chatModerator', 'repeatCharPurgeMessage') ? $.inidb.get('chatModerator', 'repeatCharPurgeMessage') : '');

  /**
   * @function loadWhitelist
   */
  function loadWhitelist() {
    var keys = $.inidb.GetKeyList('linkWhitelist', ''),
        i;

    for (i in keys) {
      linkWhiteList.push($.inidb.get('linkWhitelist', keys[i]));
    }
  };

  /**
   * @function clearChat
   * @export $
   */
  function clearChat() {
    $.say($.ircPrefix + 'clear');
  };

  /**
   * @function timeoutUSer
   * @export $
   */
  function timeoutUser(username, seconds) {
    var i = 1,
        iv = setInterval(function () {
          if (seconds) {
            $.say($.ircPrefix + 'timeout ' + username + ' ' + seconds);
          } else {
            $.say($.ircPrefix + 'timeout ' + username);
          }
          if (i == 3) {
            clearInterval(iv);
          }
          ++i;
        }, 1e3);
  };

  /**
   * @function banUser
   * @export $
   */
  function banUser(username) {
    $.say($.ircPrefix + 'ban ' + username);
  };
  /**
   * @function unBanUser
   * @export $
   */
  function unBanUser(username) {
    $.say($.ircPrefix + 'unban ' + username);
  };
  /**
   * @function purgeUser
   * @export $
   */
  function purgeUser(username) {
    $.timeoutUser(username, 1);
  };
  /**
   * @function permitUserLink
   * @export $
   */
  function permitUserLink(username) {
    var t;
    permitList.push(username);
    t = setTimeout(function () {
      var i;
      for (i in permitList) {
        if (permitList[i].equalsIgnoreCase(username)) {
          permitList.splice(i, 1);
          break;
        }
      }
      clearTimeout(t);
    }, linkPermitTime * 1e3);
  };

  /**
   * @event ircChannelMessage
   */
  $.bind('ircChannelMessage', function (event) {
    var sender = event.getSender().toLowerCase(),
        username = $.username.resolve(sender, event.getTags()),
        message = event.getMessage(),
        lowerCaseMessage = (message + '').toLowerCase();

    if ($.isModv3(sender, event.getTags())) {
      if (!linksAllowed) {
        $.patternDetector.hasLinks(event);
      }
      return;
    }

    if (!linksAllowed && $.patternDetector.hasLinks(event)) {
      var i;

      for (i in permitList) {
        if (permitList[i].equalsIgnoreCase(sender)) {
          return;
        }
      }

      if (regsLinksAllowed && $.getUserGroupId(sender) <= 6) {
        return;
      }

      for (i in linkWhiteList) {
        if (lowerCaseMessage.contains(linkWhiteList[i])) {
          return;
        }
      }

      if (youtubeLinksAllowed && (lowerCaseMessage.indexOf('youtube.com') > -1 || lowerCaseMessage.indexOf('youtube.be') > -1)) {
        return;
      }

      $.purgeUser(sender);
      $.log('chatMod', 'Purged ' + username + ' for posting link in "' + message + '"', sender);
      $.say($.whisperPrefix(sender) + linkPurgeMessage);
      return;
    }

    if (!capsAllowed && lowerCaseMessage.length > capsTriggerLength) {
      var capsCount = event.getCapsCount(),
          capsRatio = capsCount / lowerCaseMessage.length;

      if (capsRatio > capsTriggerRatio) {
        $.purgeUser(sender);
        $.log('chatMod', 'Purged ' + username + ' for exceeding the caps ratio (ratio:' + capsRatio + ', trigger:' + capsTriggerRatio + ') in "' + message + '"', sender);
        $.say($.whisperPrefix(sender) + capsPurgeMessage);
        return;
      }
    }

    if (!symbolsAllowed) {
      var symbolCount = $.patternDetector.getNumberOfNonLetters(event),
          graphemeCluster = $.patternDetector.getLongestGraphemeCluster(event);

      if (symbolCount > symbolsTriggerCount || graphemeCluster > symbolsTriggerCount) {
        $.purgeUser(sender);
        $.log('chatMod', 'Purged ' + username + ' for exceeding the symbol limit (symbol Count: ' + Math.max(symbolCount, graphemeCluster) + ') in "' + message + '"', sender);
        $.say($.whisperPrefix(sender) + symbolsPurgeMessage);
        return;
      }
    }

    if (!repeatCharAllowed) {
      var longestSequence = $.patternDetector.getLongestRepeatedSequence(event);

      if (longestSequence > repeatCharTriggerLength) {
        $.purgeUser(sender);
        $.log('chatMod', 'Purged ' + username + ' for exceeding the repeating character limit (longest chain: ' + longestSequence + ') in "' + message + '"', sender);
        $.say($.whisperPrefix(sender) + repeatCharPurgeMessage);
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
        argString = event.getArguments(),
        action = args[0],
        actionArg = args[1];

    /**
     * @commandpath chat [message] - Have the bot say something in the chat
     */
    if (command.equalsIgnoreCase('chat') && sender.equalsIgnoreCase($.botName)) {
      $.say(argString);
    }

    /**
     * @commandpath permit [username] - Permit a user to post a link for the set amount of time
     */
    if (command.equalsIgnoreCase('permit')) {
      if (!action || !$.user.isKnown((action + '').toLowerCase())) {
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.permit.usage'));
        return;
      }

      $.permitUserLink(action.toLowerCase());
      $.say($.lang.get('chatmoderator.permit.success', $.username.resolve(sender), $.username.resolve(action), linkPermitTime / 1e3));
      return;
    }

    /**
     * @commandpath whitelist [url] - Add a url/domain to the link whitelist
     */
    if (command.equalsIgnoreCase('whitelist')) {
      if (!action) {
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.usage'));
        return;
      }

      $.inidb.set('linkWhitelist', linkWhiteList.length, action);
      $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.whitelist.success', action));
      return;
    }

    /**
     * @commandpath purge [username] - Purge all messages from a user
     */
    if (command.equalsIgnoreCase('purge')) {
      if (!action && !$.user.isKnown((action + '').toLowerCase())) {
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.purge.usage'));
        return;
      }

      $.purgeUser((action + '').toLowerCase());
      $.say($.lang.get('chatmoderator.purge.success', $.username.resolve(action)));
      return;
    }

    /**
     * @commandpath timeout [username] [minutes] - Time a user out for the given amount of minutes, ommit the minutes parameter to use the Twitch default
     */
    if (command.equalsIgnoreCase('timeout')) {
      if (!action && !$.user.isKnown((action + '').toLowerCase())) {
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.timeout.usage'));
        return;
      }

      actionArg = parseInt(actionArg);

      if (actionArg && !isNaN(actionArg)) {
        $.timeoutUser((action + '').toLowerCase(), actionArg);
        $.say($.lang.get('chatmoderator.timeout.success.fortime', $.username.resolve(action), (actionArg / 60)));
        return;
      } else {
        $.timeoutUser((action + '').toLowerCase());
        $.say($.lang.get('chatmoderator.timeout.success', $.username.resolve(action)));
        return;
      }
    }

    /**
     * @commandpath ban [username] - Ban a user from the channel
     */
    if (command.equalsIgnoreCase('ban')) {
      actionArg = parseInt(actionArg);
      if (!action && isNaN(actionArg) && !$.user.isKnown((action + '').toLowerCase())) {
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.ban.usage'));
        return;
      }

      $.banUser((action + '').toLowerCase(), actionArg);
      $.say($.lang.get('chatmoderator.ban.success', $.username.resolve(action), actionArg));
      return;
    }

    /**
     * @commandpath unban [username] - Unban a user from the channel
     */
    if (command.equalsIgnoreCase('unban')) {
      if (!action && !$.user.isKnown((action + '').toLowerCase())) {
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.unban.usage'));
        return;
      }

      $.unBanUser((action + '').toLowerCase());
      $.say($.lang.get('chatmoderator.unban.success', $.username.resolve(action)));
      return;
    }

    /**
     * @commandpath clear - Clear the chat (Bttv cancels this!)
     */
    if (command.equalsIgnoreCase('clear')) {
      $.clearChat();
    }

    if (command.equalsIgnoreCase('chatmod')) {
      if (!action) {
        return;
      }

      /**
       * @commandpath chatmod linksallowed - Toggle allowing users to post links
       */
      if (action.equalsIgnoreCase('linksallowed')) {
        linksAllowed = !linksAllowed;
        $.setIniDbBoolean('chatModerator', 'linksAllowed', linksAllowed);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.linksallowed',
                (linksAllowed ? $.lang.get('chatmoderator.toggle.common.allowed') : $.lang.get('chatmoderator.toggle.common.moderated'))));
      }


      /**
       * @commandpath chatmod youtubelinksallowed - Toggle allowing youtube links (Regardless of linksallowed setting, useful when using songrequests!)
       */
      if (action.equalsIgnoreCase('youtubelinksallowed')) {
        youtubeLinksAllowed = !youtubeLinksAllowed;
        $.setIniDbBoolean('chatModerator', 'youtubeLinksAllowed', youtubeLinksAllowed);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.youtubelinksallowed',
                (youtubeLinksAllowed ? $.lang.get('chatmoderator.toggle.common.allowed') : $.lang.get('chatmoderator.toggle.common.moderated'))));
      }

      /**
       * @commandpath chatmod reglinksallowed - Toggle allowing regulars to post links (Regardless of linksallowed setting)
       */
      if (action.equalsIgnoreCase('regslinksallowed')) {
        regsLinksAllowed = !regsLinksAllowed;
        $.setIniDbBoolean('chatModerator', 'regsLinksAllowed', regsLinksAllowed);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.Regularslinksallowed',
                (regsLinksAllowed ? $.lang.get('chatmoderator.toggle.common.allowed') : $.lang.get('chatmoderator.toggle.common.moderated'))));
      }


      /**
       * @commandpath chatmod linksaggressive - Toggle scanning aggressively for links (like: virus(dot)unsafesite(dot)com or user(at)email(dot)com)
       */
      if (action.equalsIgnoreCase('linksagressive')) {
        linksAgressive = !linksAgressive;
        $.setIniDbBoolean('chatModerator', 'linksAgressive', linksAgressive);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.linksagressive',
                (linksAgressive ? $.lang.get('.common.enabled') : $.lang.get('common.disabled'))));
      }


      /**
       * @commandpath chatmod setlinkpurgemessage [message] - Set the message sent to the sender when purging links
       */
      if (action.equalsIgnoreCase('setlinkpurgemessage')) {
        if (!actionArg) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.usage', 'setlinkpurgemessage'));
          return;
        }

        linkPurgeMessage = argString.replace(action, '').trim();
        $.inidb.set('chatModerator', 'linkPurgeMessage', linkPurgeMessage);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.success', 'links', linkPurgeMessage));
      }


      /**
       * @commandpath chatmod setlinkpermittime [seconds] - Set the amount of time a permitted user had to post a link
       */
      if (action.equalsIgnoreCase('setlinkpermittime')) {
        actionArg = parseInt(actionArg);
        if (isNaN(actionArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.linkpermittime.usage'));
          return;
        }

        linkPermitTime = actionArg;
        $.inidb.set('chatModerator', 'linkPermitTime', linkPermitTime);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.linkpermittime.success', linkPermitTime));
      }


      /**
       * @commandpath chatmod capsallowed - Toggle allowing excessive caps use
       */
      if (action.equalsIgnoreCase('capsallowed')) {
        capsAllowed = !capsAllowed;
        $.setIniDbBoolean('chatModerator', 'capsAllowed', capsAllowed);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.capsallowed',
                (capsAllowed ? $.lang.get('chatmoderator.toggle.common.allowed') : $.lang.get('chatmoderator.toggle.common.moderated'))));
      }


      /**
       * @commandpath chatmod setcapstriggerration [0-1] - Set the ratio (percentage) of lowercase to uppercase, before the moderator triggers
       */
      if (action.equalsIgnoreCase('setcapstriggerratio')) {
        actionArg = parseFloat(actionArg);
        if (isNaN(actionArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.capstriggerratio.usage'));
          return;
        }

        capsTriggerRatio = actionArg;
        $.inidb.set('chatModerator', 'capsTriggerRatio', capsTriggerRatio);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.capstriggerratio.success', capsTriggerRatio))
      }

      /**
       * @commandpath chatmod setcapstriggerlength [amount] - Set the amount of consecutive caps for the moderator to trigger on
       */
      if (action.equalsIgnoreCase('setcapstriggerlength')) {
        actionArg = parseInt(actionArg);
        if (isNaN(actionArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.capstriggerlength.usage'));
          return;
        }

        capsTriggerLength = actionArg;
        $.inidb.set('chatModerator', 'capsTriggerLength', capsTriggerLength);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.capstriggerlength.success', capsTriggerLength))
      }

      /**
       * @commandpath chatmod setcapspurgemessage [message] - Set the message sent to the sender when purging caps use
       */
      if (action.equalsIgnoreCase('setcapspurgemessage')) {
        if (!actionArg) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.usage', 'setcapspurgemessage'));
          return;
        }

        capsPurgeMessage = argString.replace(action, '').trim();
        $.inidb.set('chatModerator', 'capsPurgeMessage', capsPurgeMessage);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.success', 'caps spam', capsPurgeMessage));
      }

      /**
       * @commandpath chatmod symbolsallowed - Toggle allowing excessive symbol/grahpeme cluster use
       */
      if (action.equalsIgnoreCase('symbolsallowed')) {
        symbolsAllowed = !symbolsAllowed;
        $.setIniDbBoolean('chatModerator', 'symbolsAllowed', symbolsAllowed);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.symbolsallowed',
                (symbolsAllowed ? $.lang.get('chatmoderator.toggle.common.allowed') : $.lang.get('chatmoderator.toggle.common.moderated'))));
      }

      /**
       * @commandpath chatmod setsymboltriggercount [amount] - Set the amount of maximum symbols in a single message
       */
      if (action.equalsIgnoreCase('setsymbolstriggercount')) {
        actionArg = parseInt(actionArg);
        if (isNaN(actionArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.symbolstriggercount.usage'));
          return;
        }

        symbolsTriggerCount = actionArg;
        $.inidb.set('chatModerator', 'symbolsTriggerCount', symbolsTriggerCount);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.symbolstriggercount.success', symbolsTriggerCount))
      }


      /**
       * @commandpath chatmod setsymbolspurgemessage [message] - Set the message sent to the user when purging symbol use
       */
      if (action.equalsIgnoreCase('setsymbolspurgemessage')) {
        if (!actionArg) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.usage', 'setsymbolspurgemessage'));
          return;
        }

        symbolsPurgeMessage = argString.replace(action, '').trim();
        $.inidb.set('chatModerator', 'symbolsPurgeMessage', symbolsPurgeMessage);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.success', 'symbol spam', symbolsPurgeMessage));
      }

      /**
       * @commandpath chatmod repeatchatallowed - Toggle allowing excessivee character repitition
       */
      if (action.equalsIgnoreCase('repeatcharallowed')) {
        repeatCharAllowed = !repeatCharAllowed;
        $.setIniDbBoolean('chatModerator', 'repeatCharAllowed', repeatCharAllowed);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.toggle.repeatcharallowed',
                (repeatCharAllowed ? $.lang.get('chatmoderator.toggle.common.allowed') : $.lang.get('chatmoderator.toggle.common.moderated'))));
      }

      /**
       * @commandpath chatmod setrepeatchartriggerlength [amount] - Set the mount of chained identical characters before the moderator acts
       */
      if (action.equalsIgnoreCase('setrepeatchartriggerlength')) {
        actionArg = parseInt(actionArg);
        if (isNaN(actionArg)) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.repeatchartriggerlength.usage'));
          return;
        }

        repeatCharTriggerLength = actionArg;
        $.inidb.set('chatModerator', 'repeatCharTriggerLength', repeatCharTriggerLength);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.repeatchartriggerlength.success', repeatCharTriggerLength))
      }

      /**
       * @commandpath chatmod setrepeatcharpurgemessage [message] - Set the message sent to the sender when purging character repition
       */
      if (action.equalsIgnoreCase('setrepeatcharpurgemessage')) {
        if (!actionArg) {
          $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.usage', 'setrepeatcharpurgemessage'));
          return;
        }

        repeatCharPurgeMessage = argString.replace(action, '').trim();
        $.inidb.set('chatModerator', 'repeatCharPurgeMessage', repeatCharPurgeMessage);
        $.say($.whisperPrefix(sender) + $.lang.get('chatmoderator.set.common.message.success', 'repeated character spam', repeatCharPurgeMessage));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./core/chatModerator.js')) {
      $.registerChatCommand('./core/chatModerator.js', 'chat', 1);
      $.registerChatCommand('./core/chatModerator.js', 'whitelist', 1);
      $.registerChatCommand('./core/chatModerator.js', 'clear', 1);
      $.registerChatCommand('./core/chatModerator.js', 'chatmod', 1);
      $.registerChatCommand('./core/chatModerator.js', 'permit', 2);
      $.registerChatCommand('./core/chatModerator.js', 'purge', 2);
      $.registerChatCommand('./core/chatModerator.js', 'timeout', 2);
      $.registerChatCommand('./core/chatModerator.js', 'ban', 2);
      $.registerChatCommand('./core/chatModerator.js', 'unban', 2);

      loadWhitelist();
    }
  });

  /** Export functions to API */
  $.ircPrefix = ircPrefix;
  $.clearChat = clearChat;
  $.timeoutUser = timeoutUser;
  $.banUser = banUser;
  $.unBanUser = unBanUser;
  $.purgeUser = purgeUser;
  $.permitUserLink = permitUserLink;
})();