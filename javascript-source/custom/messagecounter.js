(function() {

      function getUserMessagesRank(username) {
          var keylist = $.inidb.GetKeysByOrderValue('messagecounter'),
          rank = 1,
          i;
          for(i in keylist) {
              if(keylist[i].equals(username)) {
                  return rank;
              }
              rank++;
          }
          return rank;
      }

      function getUserMessages(username) {
        return ($.inidb.exists('messagecounter', username.toLowerCase()) ? parseInt($.inidb.get('messagecounter', username.toLowerCase())) : 0);
      }

      $.bind('ircChannelMessage', function(event) {
        var username = event.getSender().toLowerCase();
        if(!$.isOnline($.channelName) || $.isTwitchBot(username)) {
            return; //Ignore bots and only online
        }
        $.inidb.incr('messagecounter', username, 1);
      });

      $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender(),
            action = args[0];
        if(command.equalsIgnoreCase('loudest')) {
            var keys = $.inidb.GetKeysByNumberOrderValue('messagecounter', '', 'DESC', 20, 0),
            list = [],
            i,
            ctr = 0,
            top = [];
            for (i in keys) {
                if (!$.isBot(keys[i]) && !$.isOwner(keys[i])) {
                    if (ctr++ == 10) {
                        break;
                    }
                    list.push({
                        username: keys[i],
                        value: $.inidb.get('messagecounter', keys[i])
                    });
                }
            }

            list.sort(function(a, b) {
                return (b.value - a.value);
            });

            for (i in list) {
                top.push('#' + (parseInt(i) + 1) + ' ' + list[i].username + ' (' + list[i].value + ')');
            }
            $.say('Top 10 in messages: ' +  top.join(', '));
        }
      });
      $.bind('initReady', function() {
          $.registerChatCommand('./custom/messagecounter.js', 'loudest', 7);
      });

      $.getUserMessagesRank = getUserMessagesRank;
      $.getUserMessages = getUserMessages
})();