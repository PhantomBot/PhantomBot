(function() {
    
    /*
     * @function changeTwitchName
     */
    function changeTwitchName(oldName, newName) {
        var tables = ['points', 'time', 'followed', 'subscribed', 'visited', 'group', 'panelchatuserstats', 'panelchatstats', 'gamewispsubs'],
            changed = 0,
            i;

        $.inidb.setAutoCommit(false);

        // Update the default tables with that users new name if it's currently in any tables.
        for (i in tables) {
            if ($.inidb.exists(tables[i], oldName.toLowerCase()) == true) {
                $.inidb.set(tables[i], newName.toLowerCase(), $.inidb.get(tables[i], oldName.toLowerCase()));
                $.inidb.del(tables[i], oldName.toLowerCase());
                changed++;
            }
        }

        // Update the username in the quotes table.
        var keys = $.inidb.GetKeyList('quotes', ''),
            jsonArr,
            foundAQuote = false;

        for (i in keys) {
            if ($.inidb.get('quotes', keys[i]).toLowerCase().indexOf(oldName.toLowerCase()) > -1) {
                jsonArr = JSON.parse($.inidb.get('quotes', keys[i]));
                $.inidb.set('quotes', keys[i], JSON.stringify([String(newName), String(jsonArr[1]), String(jsonArr[2]), String(jsonArr[3])]));
                foundAQuote = true;
            }
        }
        
        if (foundAQuote) {
            changed++;
        }
        
        var key = $.inidb.GetKeyByValue('userids', '', oldName);
        
        if (key != null) {
            $.inidb.SetString('userids', '', key, newName);
            changed++;
        }
        
        $.inidb.setAutoCommit(true);
        
        return changed;
    }
    
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];


        /**
         * @commandpath namechange [oldname] [newname] - Convert someones old Twitch username to his/her new Twitch name. The user will be able to keep their points, time, quotes, and more.
         */
        if (command.equalsIgnoreCase('namechange')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.default'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('namechange.updating', action, subAction));

            var changed = changeTwitchName(action, subAction);

            // Announce in chat once done.
            if (changed > 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.success', action, subAction, changed));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.notfound', action));
            }
        }
    });
    
    $.bind('twitchUserNameChanged', function(event) {
       changeTwitchName(event.getOldName(), event.getNewName()); 
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./commands/nameConverter.js', 'namechange', 1);
    });
})();