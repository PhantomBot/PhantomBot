/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
    var whisperMode = $.getSetIniDbBoolean('settings', 'whisperMode', false),
        ScriptEventManager = Packages.tv.phantombot.script.ScriptEventManager,
        CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;

    /**
     * @function reloadWhispers
     */
    function reloadWhispers() {
        whisperMode = $.getIniDbBoolean('settings', 'whisperMode');
    }

    /**
     * @function hasKey
     *
     * @param {array} list
     * @param {string} value
     * @param {int} subIndex
     * @returns {boolean}
     */
    function hasKey(list, value, subIndex) {
        var i;

        for (i in list) {
            if (list[i][subIndex].equalsIgnoreCase(value)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @function whisperPrefix
     *
     * @export $
     * @param {string} username
     * @param {boolean} force
     * @returns {string}
     */
    function whisperPrefix(username, force) {
        if (username.toLowerCase() == $.botName.toLowerCase()) {
            return ''; 
        }        
        if (whisperMode || force) {
            return '/w ' + username + ' ';
        }
        return '@' + $.username.resolve(username) + ', ';
    }

    /**
     * @function getBotWhisperMode
     *
     * @export $
     * @returns {boolean}
     */
    function getBotWhisperMode() {
        return whisperMode;
    }

    /**
     * @event ircPrivateMessage
     */
    $.bind('ircPrivateMessage', function(event) {
        var sender = event.getSender(),
            message = event.getMessage(),
            arguments = '',
            split,
            command;

        if (sender.equalsIgnoreCase('jtv') || sender.equalsIgnoreCase('twitchnotify')) {
            return;
        }

        if (message.startsWith('!') && $.isMod(sender) && $.userExists(sender)) {
            message = message.substring(1);
            if (message.includes(' ')) {
                split = message.indexOf(' ');
                command = message.substring(0, split).toLowerCase();
                arguments = message.substring(split + 1);
            } else {
                command = message;
            }

            ScriptEventManager.instance().onEvent(new CommandEvent(sender, command, arguments));
            $.log.file('whispers', '' + sender + ': ' + message);
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand();

        /**
         * @commandpath togglewhispermode - Toggle whisper mode
         */
        if (command.equalsIgnoreCase('togglewhispermode')) {
            whisperMode = !whisperMode;
            $.setIniDbBoolean('settings', 'whisperMode', whisperMode);
            $.say(whisperPrefix(sender) + (whisperMode ? $.lang.get('whisper.whispers.enabled') : $.lang.get('whisper.whispers.disabled')));
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
    $.reloadWhispers = reloadWhispers;
})();
