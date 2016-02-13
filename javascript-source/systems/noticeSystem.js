/**
 * noticeSystem.js
 *
 * Will say a message or a command every x amount of minutes.
 */

(function () {
  var noticeReqMessages = (parseInt($.inidb.exists('noticeSettings', 'reqmessages')) ? parseInt($.inidb.get('noticeSettings', 'reqmessages')) : 25),
      noticeInterval = (parseInt($.inidb.exists('noticeSettings', 'interval')) ? parseInt($.inidb.get('noticeSettings', 'interval')) : 10),
      noticeToggle = ($.inidb.exists('noticeSettings', 'noticetoggle') ? $.inidb.get('noticeSettings', 'noticetoggle') : false),
      numberOfNotices = (parseInt($.inidb.GetKeyList('notices', '').length) ? parseInt($.inidb.GetKeyList('notices', '').length) : 0),
      messageCount = 0;

  /**
   /* @function reloadNotices
     */
    function reloadNotices() {
      var keys = $.inidb.GetKeyList('notices', ''),
          count = 0,
          i;
  
      for (i = 0; i < keys.length; i++) {
        $.inidb.set('tempnotices', keys[i], $.inidb.get('notices', keys[i]));
      }
  
      $.inidb.RemoveFile('notices');
      keys = $.inidb.GetKeyList('tempnotices', '');
  
      for (i = 0; i < keys.length; i++) {
        $.inidb.set('notices', 'message_' + count, $.inidb.get('tempnotices', keys[i]));
        count++;
      }
  
      $.inidb.RemoveFile('tempnotices');
    };
  /**
   * @function sendNotice
   */
    function sendNotice() {
        var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus;
        var CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent;
        var RandomNotice = $.randRange(0, numberOfNotices);
        var notice = $.inidb.get('notices', 'message_' + RandomNotice);

        if (notice.startsWith('command:')) {
            notice = notice.substring(8);
            EventBus.instance().postCommand(new CommandEvent($.botName, notice, ' '));
        } else {
            $.say(notice);
        }
    };  

  /**
   * @event ircChannelMessage
   */
    $.bind('ircChannelMessage', function () {
        messageCount++;
    });

  /**
   * @event command
   */
    $.bind('command', function (event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            message = '';
  
       /**
       * @commandpath notice - gives you usage.
       */
        if (command.equalsIgnoreCase('notice')) {
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }
      
            if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-usage'));
                return;
            }
    
          /**
           * @commandpath notice get [id] - gets the notice un that id
           */
            if (action.equalsIgnoreCase('get')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-get-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    $.say($.inidb.get('notices', 'message_' + args[1]));
                    return;
                }
            }
    
          /**
           * @commandpath notice edit [id] [new message] - allows you to edit a notice with that id
           */
            if (action.equalsIgnoreCase('edit')) {
                if (args.length < 3) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    argsString = argsString.replace(action + '', '').trim();
                    $.inidb.set('notices', 'message_' + args[1], message);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-edit-success'));
                    return;
                }
            }
    
          /**
           * @commandpath notice remove [id] - removes that notice under that id
           */
            if (action.equalsIgnoreCase('remove')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-usage', numberOfNotices));
                    return;
                } else if (!$.inidb.exists('notices', 'message_' + args[1])) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-error-notice-404'));
                    return;
                } else {
                    $.inidb.del('notices', 'message_' + args[1]);
                    numberOfNotices--;
                    reloadNotices();
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-remove-success'));
                    return;
                }
            }
    
          /**
           * @commandpath notice add [message or command] - adds a notice, with a custom message, or a command
           */
            if (action.equalsIgnoreCase('add')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-usage'));
                    return;
                } else {
                    argsString = argsString.replace(action + '', '').trim();
                    $.inidb.set('notices', 'message_' + numberOfNotices, argsString);
                    numberOfNotices++;
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-add-success'));
                    return;
                }
            }
    
          /**
           * @commandpath notice interval [seconds] - sets the notice interval
           */
            if (action.equalsIgnoreCase('interval')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-interval-usage'));
                    return;
                } else if (parseInt(args[1]) < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-interval-404'));
                    return;
                } else {
                    $.inidb.set('noticeSettings', 'interval', parseInt(args[1]));
                    noticeInterval = parseInt(args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-inteval-success'));
                    return;
                }
            }
      
          /**
           * @commandpath notice req [amount of messages] - set the amount of messages needed to trigger a notice
           */
            if (action.equalsIgnoreCase('req')) {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-usage'));
                    return;
                } else if (parseInt(args[1]) < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-404'));
                    return;
                } else {
                    $.inidb.set('noticeSettings', 'reqmessages', parseInt(args[1]));
                    noticeReqMessages = parseInt(args[1]);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-req-success'));
                    return;
                }
            }
    
          /**
           * @commandpath notice config - shows the notice settings
           */
            if (action.equalsIgnoreCase('config')) {
                $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-config', noticeToggle, noticeInterval, noticeReqMessages, numberOfNotices));
                return;
            }
    
          /**
           * @commandpath notice toggle - toggles notices on and off
           */
            if (action.equalsIgnoreCase('toggle')) {
                if (noticeToggle) {
                    noticeToggle = false;
                    $.inidb.set('noticeSettings', 'noticetoggle', noticeToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-disabled'));
                } else {
                    noticeToggle = true;
                    $.inidb.set('noticeSettings', 'noticetoggle', noticeToggle);
                    $.say($.whisperPrefix(sender) + $.lang.get('noticehandler.notice-enabled'));
                }
            }
    
          /**
           * @commandpath notice reload - reloads all notices
           */
            if (action.equalsIgnoreCase('reload')) {
                reloadNotices();
            }
        }
    });

     // Set the interval to announce
    setInterval(function () {
        if (noticeToggle) {
            if ($.bot.isModuleEnabled('./systems/noticeSystem.js') && numberOfNotices > 0) {
                if (messageCount >= noticeReqMessages) {
                    sendNotice();
                    messageCount = 0;
                }
            }
        }
    }, noticeInterval * 60 * 1000);

  /**
   * @event initReady
   */
    $.bind('initReady', function () {
        if ($.bot.isModuleEnabled('./systems/noticeSystem.js')) {
            $.registerChatCommand('./systems/noticeSystem.js', 'notice');
        }
    });
})();
