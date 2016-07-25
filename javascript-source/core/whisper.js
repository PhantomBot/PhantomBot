(function() {
    var whisperMode = $.getSetIniDbBoolean('settings', 'whisperMode', false);

    /** 
     * @function hasKey
     * @param {Array} list
     * @param {*} value
     * @param {Number} [subIndex]
     * @returns {boolean}
     */
    function hasKey(list, value, subIndex) {
        var i;

        if (subIndex > -1) {
            for (i in list) {
                if (list[i][subIndex].equalsIgnoreCase(value)) {
                    return true;
                }
            }
        } else {
            for (i in list) {
                if (list[i].equalsIgnoreCase(value)) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * @function whisperPrefix
     * @export $
     * @param {string} username
     * @param {boolean} [force]
     * @returns {string}
     */
    function whisperPrefix(username, force) {
        if (whisperMode || force) {
            return '/w ' + username + ' ';
        }
        return '@' + $.username.resolve(username) + ', ';
    };

    /**
     * @function getBotWhisperMode
     * @export $
     * @returns {boolean}
     */
    function getBotWhisperMode() {
        return whisperMode;
    };

    /**
     * @function whisperCommands
     */
    function whisperCommands(event) {
        if (!event.getSender().equalsIgnoreCase('jtv') || !event.getSender().equalsIgnoreCase('twitchnotify')) {
            if (event.getMessage().startsWith('!') && $.isMod(event.getSender()) && hasKey($.users, event.getSender(), 0)) {
                var EventBus = Packages.me.mast3rplan.phantombot.event.EventBus,
                    CommandEvent = Packages.me.mast3rplan.phantombot.event.command.CommandEvent,
                    commandString = event.getMessage().substring(1),
                    split = commandString.indexOf(' '),
                    arguments,
                    command;
                if (split == -1) {
                    command = commandString;
                    arguments = '';
                } else {
                    command = commandString.substring(0, split);
                    arguments = commandString.substring(split + 1);
                }
                EventBus.instance().post(new CommandEvent(event.getSender(), command, arguments));
                $.log.file('whispers', '' + event.getSender() + ': ' + event.getMessage());
            }
        }
        return;
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand();

        /**
         * @commandpath togglewhispermode - Toggle whisper mode
         */
        if (command.equalsIgnoreCase('togglewhispermode')) {
            if (whisperMode) {
                $.inidb.set('settings', 'whisperMode', 'false');
                whisperMode = false;
                $.say($.whisperPrefix(sender) + $.lang.get('whisper.whispers.disabled'));
            } else {
                $.inidb.set('settings', 'whisperMode', 'true');
                whisperMode = true;
                $.say($.whisperPrefix(sender) + $.lang.get('whisper.whispers.enabled'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/whisper.js', 'togglewhispermode', 1);
    });

    /** Export functions to API */
    $.whisperPrefix = whisperPrefix;
    $.getBotWhisperMode = getBotWhisperMode;
    $.whisperCommands = whisperCommands;
})();
