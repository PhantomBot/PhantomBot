/**
 * Script  : clipHandler.js
 * Purpose : Configures the automatic display of clips in chat and captures the events from Twitch.
 */
(function() {
    var toggle = $.getSetIniDbBoolean('clipsSettings', 'toggle', false),
        message = $.getSetIniDbString('clipsSettings', 'message', '(name) created a clip: (url)');

    /*
     * @function reloadClips
     */
    function reloadClips() {
        toggle = $.getIniDbBoolean('clipsSettings', 'toggle', false);
        message = $.getIniDbString('clipsSettings', 'message', '(name) created a clip: (url)');
    }

    /*
     * @event twitchClip
     */
    $.bind('twitchClip', function(event) {
        var creator = event.getCreator(),
            url = event.getClipURL(),
            s = message;

        /* Even though the Core won't even query the API if this is false, we still check here. */
        if (toggle === false) {
            return;
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', creator);
        }

        if (s.match(/\(url\)/g)) {
            s = $.replace(s, '(url)', url);
        }

        $.say(s);
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            argsString = event.getArguments(),
            action = args[0];

        /*
         * @commandpath clipstoggle - Toggles the clips announcements.
         */
        if (command.equalsIgnoreCase('clipstoggle')) {
            toggle = !toggle;
            $.setIniDbBoolean('clipsSettings', 'toggle', toggle);
            $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('cliphandler.toggle.on') : $.lang.get('cliphandler.toggle.off')));
        }

        /*
         * @commandpath clipsmessage - Sets a message for when someone creates a clip.
         */
        if (command.equalsIgnoreCase('clipsmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('cliphandler.message.usage'));
                return;
            }

            message = argsString;
            $.setIniDbString('clipsSettings', 'message', message);
            $.say($.whisperPrefix(sender) + $.lang.get('cliphandler.message.set', message));
        }

        /*
         * @commandpath lastclip - Displays information about the last clip captured.
         */
        if (command.equalsIgnoreCase('lastclip')) {
            var url = $.getIniDbString('streamInfo', 'last_clip_url', $.lang.get('cliphandler.noclip'));
            $.say($.whisperPrefix(sender) + $.lang.get('cliphandler.lastclip', url));
        }

        /*
         * @commandpath topclip - Displays the top clip from the past day.
         */
        if (command.equalsIgnoreCase('topclip')) {
            var url = $.getIniDbString('streamInfo', 'most_viewed_clip_url', $.lang.get('cliphandler.noclip'));
            $.say($.whisperPrefix(sender) + $.lang.get('cliphandler.topclip', url));
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/clipHandler.js', 'clipstoggle', 1);
        $.registerChatCommand('./handlers/clipHandler.js', 'clipsmessage', 1);
        $.registerChatCommand('./handlers/clipHandler.js', 'lastclip', 7);
        $.registerChatCommand('./handlers/clipHandler.js', 'topclip', 7);
    });

    $.reloadClips = reloadClips;
})();