/*
 * lastseenCommand.js
 *
 * This module stores the dates of when users have last seen in the channel.
 */
(function() {
    /*
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function(event) {
        $.inidb.set('lastseen', event.getUser().toLowerCase(), $.systemTime());
    });

    /*
     * @event ircChannelLeave
     */
    $.bind('ircChannelLeave', function(event) {
        $.inidb.set('lastseen', event.getUser().toLowerCase(), $.systemTime());
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            target = args[0],
            date;

        /*
         * @commandpath lastseen [username] - Find out when the given user was last seen in the channel
         */
        if (command.equalsIgnoreCase('lastseen')) {
            if (target === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('lastseen.usage'));
                return;
            }

            target = target.toLowerCase();

            if ($.inidb.exists('lastseen', target)) {
                date = new Date(parseInt($.inidb.get('lastseen', target.toLowerCase())));
                $.say($.whisperPrefix(sender) + $.lang.get('lastseen.response', $.username.resolve(target), date.toLocaleDateString(), date.toLocaleTimeString()));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('lastseen.404', $.username.resolve(target)));
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/lastseenCommand.js', 'lastseen', 7);
    });
})();
