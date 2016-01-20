/**
 * permissions.js
 *
 * (Previously known as permissionHandler.js)
 *
 * Provide an usergroups API
 * Use the $ API
 */
(function () {
  var //checkSubscribersInterval = 6e5,

      /** @export $ */
      userGroups = [],
      modeOUsers = [],
      subUsers = [],
      modListUsers = [],
      users = [],
      lastJoinPart = $.systemTime();


  /**
   * @function userExists
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function userExists(username) {
    return $.list.contains(users, username, 0);
  };

  /**
   * @function isBot
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isBot(username) {
    return username.equalsIgnoreCase($.botName);
  };


  /**
   * @function isOwner
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isOwner(username) {
    return username.equalsIgnoreCase($.ownerName);
  };


  /**
   * @function isCaster
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isCaster(username) {
    return $.getUserGroupId(username) == 0 || $.isOwner(username) || $.isBot(username);
  };

  /**
   * @function isAdmin
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isAdmin(username) {
    return $.getUserGroupId(username) <= 1 || $.isOwner(username) || $.isBot(username);
  };


  /**
   * @function isMod
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isMod(username) {
    return $.getUserGroupId(username) <= 2 || $.isOwner(username) || $.isBot(username);
  };


  /**
   * @function isOwner
   * @export $
   * @param {string} username
   * @param {Object} tags
   * @returns {boolean}
   */
  function isModv3(username, tags) {
    return $.isAdmin(username) || (tags != null && tags != '{}' && tags.get('user-type').equalsIgnoreCase('mod')) || $.isMod(username);
  };

  /**
   * @function isSub
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isSub(username) {
    var i;
    for (i in subUsers) {
      if (subUsers[i][0].equalsIgnoreCase(username)) {
        return true;
      }
    }
    return false;
  };

  /**
   * @function isSubv3
   * @export $
   * @param {string} username
   * @param {Object} tags
   * @returns {boolean}
   */
  function isSubv3(username, tags) {
    return (tags != null && tags != '{}' && tags.get('subscriber').equalsIgnoreCase('1')) || $.isSub(username);
  };
  /**
   * @function isTurbo
   * @export $
   * @param {Object} userTags
   * @returns {boolean}
   */
  function isTurbo(userTags) {
    return (userTags != null && userTags != '{}' && userTags.get('turbo').equalsIgnoreCase('1')) || false;
  };

  /**
   * @function isDonator
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isDonator(username) {
    return $.getUserGroupId(username) == 4;
  };

  /**
   * @function isHoster
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isHoster(username) {
    return $.getUserGroupId(username) == 5;
  };

  /**
   * @function isReg
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function isReg(username) {
    return $.getUserGroupId(username) <= 6 || $.isOwner(username) || $.isBot(username);
  };

  /**
   * @function hasModeO
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function hasModeO(username) {
    return $.list.contains(modeOUsers, username.toLowerCase(), 0);
  };

  /**
   * @function hasModList
   * @export $
   * @param {string} username
   * @returns {boolean}
   */
  function hasModList(username) {
    return $.list.contains(modListUsers, username.toLowerCase());
  };

  /**
   * @function getUserGroupId
   * @export $
   * @param {string} username
   * @returns {Number}
   */
  function getUserGroupId(username) {
    username = username.toLowerCase();
    if ($.inidb.exists('group', username)) {
      return parseInt($.inidb.get('group', username));
    } else {
      return 7;
    }
  };

  /**
   * @function getUserGroupName
   * @export $
   * @param {string} username
   * @returns {string}
   */
  function getUserGroupName(username) {
    return $.getGroupNameById($.getUserGroupId(username));
  };

  /**
   * @function getGroupNameById
   * @export $
   * @param {Number} groupId
   * @returns {string}
   */
  function getGroupNameById(groupId) {
    groupId = parseInt(groupId);
    if ($.inidb.exists('groups', groupId)) {
      return $.inidb.get('groups', groupId);
    } else {
      return userGroups[7];
    }
  };

  /**
   * @function getGroupIdByName
   * @export $
   * @param {string} groupName
   * @returns {Number}
   */
  function getGroupIdByName(groupName) {
    var i;
    for (i in userGroups) {
      if (userGroups[i].toLowerCase().indexOf(groupName.toLowerCase())) {
        return i;
      }
    }
    return 7;
  };

  /**
   * @function getGroupPointMultiplier
   * @export $
   * @param username
   * @returns {Number}
   */
  function getGroupPointMultiplier(username) {
    return parseInt($.inidb.get('grouppoints', $.getUserGroupName(username)));
  };

  /**
   * @function setUserGroupById
   * @export $
   * @param {string} username
   * @param {Number} id
   */
  function setUserGroupById(username, id) {
    if ($.userExists(username.toLowerCase())) {
      $.inidb.set('group', username.toLowerCase(), id);
    }
  };

  /**
   * @function setUserGroupByName
   * @export $
   * @param username
   * @param groupName
   */
  function setUserGroupByName(username, groupName) {
    $.setUserGroupById(username, $.getGroupIdByName(groupName));
  };

  /**
   * @function reloadGroups
   */
  function reloadGroups() {
    var groupKeys = $.inidb.GetKeyList('groups', ''),
        i;

    userGroups = [];
    for (i in groupKeys) {
      userGroups[parseInt(groupKeys[i])] = $.inidb.get('groups', groupKeys[i]);
    }
  };

  /**
   * @function getUsernamesArrayByGroupId
   * @param {Number} [filterId]
   * @returns {Array}
   */
  function getUsernamesArrayByGroupId(filterId) {
    var i, array = [];
    for (i in users) {
      if (filterId) {
        if ($.getUserGroupId(users[i][0]) <= filterId) {
          array.push(users[i][0]);
        }
      } else {
        array.push(users[i][0]);
      }
    }
    return array;
  };

  /**
   * @function restoreSubscriberStatus
   * @param username
   */
  function restoreSubscriberStatus(username) {
    if ($.bot.isModuleEnabled('./handlers/subscribeHandler.js')) {
      if ($.inidb.exists('subscribed', username) && !$.isSub(username)) {
        $.inidb.setIniDbBoolean('subscribed', username, false);
        if ($.inidb.exists('tempsubgroup', username) && !$.isMod(username)) {
          $.inidb.set('group', username, $.inidb.get('tempsubgroup', username));
          $.inidb.del('tempsubgroup', username);
        } else {
          $.inidb.set('group', username, 7);
        }
      }
    }
  };

  /**
   * @function generateDefaultGroups
   */
  function generateDefaultGroups() {
    if (!userGroups[0] || userGroups[0] != 'Caster') {
      userGroups[0] = 'Caster';
      $.inidb.set('grouppoints', 'Caster', '7');
      $.inidb.set('groups', '0', 'Caster');
    }

    if (!userGroups[1] || userGroups[1] != 'Administrator') {
      userGroups[1] = 'Administrator';
      $.inidb.set('grouppoints', 'Administrator', '6');
      $.inidb.set('groups', '1', 'Administrator');
    }

    if (!userGroups[2] || userGroups[2] != 'Moderator') {
      userGroups[2] = 'Moderator';
      $.inidb.set('grouppoints', 'Moderator', '5');
      $.inidb.set('groups', '2', 'Moderator');
    }

    if (!userGroups[3] || userGroups[3] != 'Subscriber') {
      userGroups[3] = 'Subscriber';
      $.inidb.set('grouppoints', 'Subscriber', '4');
      $.inidb.set('groups', '3', 'Subscriber');
    }

    if (!userGroups[4] || userGroups[4] != 'Donator') {
      userGroups[4] = 'Donator';
      $.inidb.set('grouppoints', 'Donator', '3');
      $.inidb.set('groups', '4', 'Donator');
    }

    if (!userGroups[5] || userGroups[5] != 'Hoster') {
      userGroups[5] = 'Hoster';
      $.inidb.set('grouppoints', 'Hoster', '2');
      $.inidb.set('groups', '5', 'Hoster');
    }

    if (!userGroups[6] || userGroups[6] != 'Regular') {
      userGroups[6] = 'Regular';
      $.inidb.set('grouppoints', 'Regular', '1');
      $.inidb.set('groups', '6', 'Regular');
    }

    if (!userGroups[7] || userGroups[7] != 'Viewer') {
      userGroups[7] = 'Viewer';
      $.inidb.set('grouppoints', 'Viewer', '0');
      $.inidb.set('groups', '7', 'Viewer');
    }
  };

  /**
   * @event ircJoinComplete
   */
  $.bind('ircJoinComplete', function (event) {
    var usersIterator = event.getChannel().getNicks().iterator(),
        username;

    lastJoinPart = $.systemTime();
    while (usersIterator.hasNext()) {
      username = usersIterator.next().toLowerCase();
      if (!$.userExists(username)) {
        users.push([username, $.systemTime()]);
      }
    }
  });

  /**
   * @event ircChannelJoin
   */
  $.bind('ircChannelJoin', function (event) {
    var username = event.getUser().toLowerCase();
    if (!$.user.isKnown(username)) {
      $.setIniDbBoolean('visited', username, true);
    }

    lastJoinPart = $.systemTime();
    if (!$.userExists(username)) {
      users.push([username, $.systemTime()]);
    }
  });

  /**
   * @event ircChannelLeave
   */
  $.bind('ircChannelLeave', function (event) {
    var username = event.getUser().toLowerCase(),
        i;

    for (i in users) {
      if (users[i][0].equalsIgnoreCase(username)) {
        users.splice(i, 1);
        restoreSubscriberStatus(username);
      }
    }

    for (i in modeOUsers) {
      if (modeOUsers[i][0].equalsIgnoreCase(username)) {
        modeOUsers.splice(i, 1);
        restoreSubscriberStatus(username);
      }
    }
  });

  /**
   * @event ircChannelUserMode
   */
  $.bind('ircChannelUserMode', function (event) {
    var username = event.getUser().toLowerCase(),
        i;
    if (event.getMode().equalsIgnoreCase('o')) {
      if (event.getAdd()) {
        if (!$.hasModeO(username)) {
          if ($.isOwner(username)) {
            modeOUsers.push([username, 0]);
            $.inidb.set('group', username, 0);
          } else {
            if ($.isAdmin(username)) {
              modeOUsers.push([username, 1]);
              $.inidb.set('group', username, 1);
            } else {
              modeOUsers.push([username, 2]);
              $.inidb.set('group', username, 2);
            }
          }
        }
      } else {
        for (i in modeOUsers) {
          if (modeOUsers[i][0].equalsIgnoreCase(username)) {
            modeOUsers.splice(i, 1);
            restoreSubscriberStatus(username);
          }
        }
      }
    }
  });

  /**
   * @event ircPrivateMessage
   */
  $.bind('ircPrivateMessage', function (event) {
    var sender = event.getSender().toLowerCase(),
        message = event.getMessage().toLowerCase().trim(),
        modMessageStart = 'the moderators of this room are: ',
        spl,
        i;

    if (sender.equalsIgnoreCase('jtv')) {
      if (message.indexOf(modMessageStart) > -1) {
        spl = message.replace(modMessageStart, '').split(', ');
        modListUsers = [];
        for (i in spl) {
          modListUsers.push(spl[i]);
        }
        $.saveArray(modListUsers, 'addons/mods.txt', false);
      }
      if (message.indexOf('specialuser') > -1) {
        spl = message.split(' ');
        if (spl[2].equalsIgnoreCase('subscriber')) {
          for (i in subUsers) {
            if (subUsers[i][0].equalsIgnoreCase(spl[1])) {
              subUsers[i][1] = $.systemTime() + 1e4;
              return;
            }
          }
          subUsers.push([spl[1], $.systemTime() + 1e4]);
          $.saveArray(subUsers, 'addons/subs.txt', false);
        }
      }
    }
  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs();

    /**
     * @commandpath users - List current users currently in the channel
     */
    if (command.equalsIgnoreCase('users')) {
      if (users.length > 20) {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.listtoolong', users.length));
      } else {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.users', getUsernamesArrayByGroupId().join(', ')));
      }
    }

    /**
     * @commandpath mods - List mods currently in the channel
     */
    if (command.equalsIgnoreCase('mods')) {
      var tmp = getUsernamesArrayByGroupId(2);
      if (tmp.length > 20) {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.listtoolong', tmp.length));
      } else {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.current.mods', tmp.join(', ')));
      }
    }

    /**
     * @commandpath group - Get your current group
     * @commandpath group [username] [groupId] - Set the usergroup for a user
     */
    if (command.equalsIgnoreCase('group')) {
      if (!$.isModv3(sender, event.getTags()) || !args[0]) {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.self.current', $.getUserGroupName(sender)));
        return;
      }

      var username = args[0],
          groupId = parseInt(args[1]);

      if (args.length < 2 || isNaN(groupId) || $.outOfRange(groupId, 0, userGroups.length - 1)) {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.usage'));
        return;
      }

      if (groupId < $.getUserGroupId(sender)) {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.error.abovegroup'));
        return;
      }

      if (groupId == $.getUserGroupId(sender)) {
        $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.error.samegroup'));
        return;
      }

      $.inidb.set('group', username.toLowerCase(), groupId);
      $.say($.whisperPrefix(sender) + $.lang.get('permissions.group.set.success'));
    }
  });

  // Load groups and generate default groups if they don't exist
  reloadGroups();
  generateDefaultGroups();

  // Not needed!?
  //
  //setInterval(function () {
  //  var len = subUsers.length,
  //      now = $.systemTime();
  //  while (len--) {
  //    if (subUsers[len][1] < now) {
  //      subUsers.splice(len, 1);
  //    }
  //  }
  //}, checkSubscribersInterval);

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    $.registerChatCommand('./core/permissions.js', 'group', 7);
    $.registerChatCommand('./core/permissions.js', 'users', 7);
    $.registerChatCommand('./core/permissions.js', 'mods', 7);
  });

  /** Export functions to API */
  $.casterMsg = $.lang.get('cmd.casteronly');
  $.adminMsg = $.lang.get('cmd.adminonly');
  $.modMsg = $.lang.get('cmd.modonly');
  $.userGroups = userGroups;
  $.modeOUsers = modeOUsers;
  $.subUsers = subUsers;
  $.modListUsers = modListUsers;
  $.users = users;
  $.lastJoinPart = lastJoinPart;

  $.userExists = userExists;
  $.isBot = isBot;
  $.isOwner = isOwner;
  $.isCaster = isCaster;
  $.isAdmin = isAdmin;
  $.isMod = isMod;
  $.isModv3 = isModv3;
  $.isOwner = isOwner;
  $.isSub = isSub;
  $.isSubv3 = isSubv3;
  $.isTurbo = isTurbo;
  $.isDonator = isDonator;
  $.isHoster = isHoster;
  $.isReg = isReg;
  $.hasModeO = hasModeO;
  $.hasModList = hasModList;
  $.getUserGroupId = getUserGroupId;
  $.getUserGroupName = getUserGroupName;
  $.getGroupNameById = getGroupNameById;
  $.getGroupIdByName = getGroupIdByName;
  $.getGroupPointMultiplier = getGroupPointMultiplier;
  $.setUserGroupById = setUserGroupById;
  $.setUserGroupByName = setUserGroupByName;
})();