(function() {
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if (command.equalsIgnoreCase('namechange')) {
            if (action === undefined || subAction === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.default');)
                return;
            }

            var tables = ['points', 'time', 'followed', 'subscribed', 'visited', 'group', 'panelchatuserstats', 'panelchatstats', 'gamewispsubs'],
                changed = 0,
                i;

            $.say($.whisperPrefix(sender) + $.lang.get('namechange.updating');)

            // Update the default tables with that users new name if it's currently in any tables.
            for (i in tables) {
                if ($.inidb.exists(tables[i], action.toLowerCase()) == true) {
                    $.inidb.set(tables[i], subAction.toLowerCase(), $.inidb.get(tables[i], action.toLowerCase()));
                    $.inidb.del(tables[i], action.toLowerCase());
                    changed++;
                }
            }

            // Update the username in the quotes table.
            var keys = $.inidb.GetKeyList('quotes', ''),
                jsonArr;

            for (i in keys) {
                if ($.inidb.get('quotes', keys[i]).toLowerCase().indexOf(action.toLowerCase()) > -1) {
                    jsonArr = JSON.parse($.inidb.get('quotes', keys[i]));
                    $.inidb.set('quotes', keys[i], JSON.stringify([String(subAction), String(jsonArr[1]), String(jsonArr[2]), String(jsonArr[3])]));
                }
            }

            // Announce in chat once done.
            if (changed > 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.success');)
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('namechange.notfound');)
            }
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./commands/nameConverter.js', 'namechange', 1);
    });
})();
