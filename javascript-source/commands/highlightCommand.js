/*
 * highlightCommand.js
 *
 * Creates timestamps for highlights to revisit later to make creating highlights a bit
 * easier.
 */
(function() {

    $.bind('command', function(event) {
        var command = event.getCommand(),
            sender = event.getSender(),
            args = event.getArgs(),
            action = args[0],
            hours,
            minutes,
            timestamp,
            keys,
            localDate,
            arr,
            streamUptimeMinutes;

        /**
         * @commandpath highlight [description] - Marks a highlight using the given description and with the current date stamp
         * @commandpath gethighlights - Get a list of current highlights
         * @commandpath showhighlights - Get a list of current highlights
         * @commandpath clearhighlights - Clear the current highlights
         */
        if (command.equalsIgnoreCase("highlight")) {
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.highlight.offline'));
                return;
            }

            if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.highlight.usage', $.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : "GMT"));
                return;
            }

            streamUptimeMinutes = parseInt(getStreamUptimeSeconds($.channelName) / 60);
            hours = parseInt(streamUptimeMinutes / 60);
            minutes = parseInt(streamUptimeMinutes % 60);
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            timestamp = hours + ":" + minutes;
            localDate = getCurLocalTimeString("'['dd-MM-yyyy']'");
            $.inidb.set('highlights', timestamp, localDate + ' ' + args.splice(0).join(' '));
            $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.highlight.success', timestamp));
            $.log.event(sender + ' added a highlight at ' + timestamp);
        }

        if (command.equalsIgnoreCase("gethighlights") || command.equalsIgnoreCase("showhighlights")) {
            if (!$.inidb.FileExists('highlights')) {
                $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.gethighlights.no-highlights'));
                return;
            }

            keys = $.inidb.GetKeyList('highlights', '');
            arr = [];
            for (var i = keys.length - 1; i >= 0; i--) {
                arr.push("[" + keys[i] + " > " + $.inidb.get("highlights", keys[i]) + "] ");
            }

            $.paginateArray(arr, 'highlightcommand.highlights', ' ', true, sender);
        }

        if (command.equalsIgnoreCase("clearhighlights")) {
            $.inidb.RemoveFile("highlights");
            $.inidb.ReloadFile("highlights");
            $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.clearhighlights.success'));
            $.log.event(sender + ' cleared highlights');
            return;
        }
    });

    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/highlightCommand.js')) {
            $.registerChatCommand('./commands/highlightCommand.js', 'highlight', 2);
            
            $.registerChatCommand('./commands/highlightCommand.js', 'gethighlights', 2);
            $.registerChatCommand('./commands/highlightCommand.js', 'showhighlights', 2);
            $.registerChatCommand('./commands/highlightCommand.js', 'clearhighlights', 1);
        }
    });
})();
