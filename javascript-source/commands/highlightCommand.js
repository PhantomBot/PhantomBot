/*
 * highlightCommand.js
 *
 * Creates timestamps for highlights to revisit later to make creating highlights a bit
 * easier.
 */
(function() {

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            sender = event.getSender(),
            args = event.getArgs(),
            action = args[0],
            vodJsonStr,
            uptime,
            vodJsonObj,
            vodURL,
            twitchVODtime;

        /*
         * @commandpath highlight [description] - Marks a highlight using the given description and with the current date stamp
         */
        if (command.equalsIgnoreCase('highlight')) {
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.highlight.offline'));
                return;
            } else if (args.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.highlight.usage', $.inidb.exists('settings', 'timezone') ? $.inidb.get('settings', 'timezone') : 'GMT'));
                return;
            }

            vodJsonStr = $.twitch.GetChannelVODs($.channelName, 'current') + '';
            if (vodJsonStr.length === 0 || vodJsonStr === null) {
                $.say($.whisperPrefix(sender) + $.lang.get('streamcommand.vod.404'));
                return;
            }

            uptime = $.getStreamUptime($.channelName);
            twitchVODtime = $.makeTwitchVODTime(uptime);
            vodJsonObj = JSON.parse(vodJsonStr);
            vodURL = vodJsonObj.videos[0].url + twitchVODtime;

            var streamUptimeMinutes = parseInt($.getStreamUptimeSeconds($.channelName) / 60),
                hours = parseInt(streamUptimeMinutes / 60),
                minutes = (parseInt(streamUptimeMinutes % 60) < 10 ? '0' + parseInt(streamUptimeMinutes % 60) : parseInt(streamUptimeMinutes % 60)),
                timestamp = hours + ':' + minutes,
                localDate = getCurLocalTimeString('dd-MM-yyyy hh:mm');
            
            $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.highlight.success', timestamp));
            $.inidb.set('highlights', localDate, vodURL + ' : ' + args.join(' '));
            return;
        }

        /*
         * @commandpath showhighlights - Get a list of current highlights
         */
        if (command.equalsIgnoreCase('gethighlights') || command.equalsIgnoreCase('showhighlights')) {
            if (!$.inidb.FileExists('highlights')) {
                $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.gethighlights.no-highlights'));
                return;
            }

            var keys = $.inidb.GetKeyList('highlights', ''),
                temp = [];

            for (var i in keys) {
                temp.push('[' + keys[i] + ': ' + $.inidb.get('highlights', keys[i]) + '] ');
            }

            $.paginateArray(temp, 'highlightcommand.highlights', ' ', true, sender);
            return;
        }

        /*
         * @commandpath clearhighlights - Clear the current highlights
         */
        if (command.equalsIgnoreCase('clearhighlights')) {
            $.say($.whisperPrefix(sender) + $.lang.get('highlightcommand.clearhighlights.success'));
            $.inidb.RemoveFile('highlights');
            return;
        }
    });
    
    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/highlightCommand.js', 'highlight', 2);
        $.registerChatCommand('./commands/highlightCommand.js', 'gethighlights', 2);
        $.registerChatCommand('./commands/highlightCommand.js', 'showhighlights', 2);
        $.registerChatCommand('./commands/highlightCommand.js', 'clearhighlights', 1);
    });
})();
