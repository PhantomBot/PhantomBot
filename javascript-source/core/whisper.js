/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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

/* global Packages */

(function() {
    let whisperMode = $.getSetIniDbBoolean('settings', 'whisperMode', false),
        allowNonModWhispers = $.getSetIniDbBoolean('settings', 'allowNonModWhispers', false);

    /**
     * @function reloadWhispers
     */
    function reloadWhispers() {
        whisperMode = $.getIniDbBoolean('settings', 'whisperMode');
        allowNonModWhispers = $.getIniDbBoolean('settings', 'allowNonModWhispers');
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
            if ($.equalsIgnoreCase(list[i][subIndex], value)) {
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
        if ($.equalsIgnoreCase(username, $.botName)) {
            return '';
        }
        if (whisperMode || force) {
            return '/w ' + username + ' ';
        }
        return '@' + $.viewer.getByLogin(username).name() + ', ';
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

        if ($.equalsIgnoreCase(sender, 'jtv') || $.equalsIgnoreCase(sender, 'twitchnotify')) {
            return;
        }

        if (message.startsWith('!') && (allowNonModWhispers || $.checkUserPermission(sender, event.getTags(), $.PERMISSION.Mod)) && $.userExists(sender)) {
            message = message.substring(1);
            if (message.includes(' ')) {
                split = message.indexOf(' ');
                command = message.substring(0, split).toLowerCase();
                arguments = message.substring(split + 1);
            } else {
                command = message;
            }

            $.command.run(sender, command, arguments);
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
        if ($.equalsIgnoreCase(command, 'togglewhispermode')) {
            whisperMode = !whisperMode;
            $.setIniDbBoolean('settings', 'whisperMode', whisperMode);
            $.say(whisperPrefix(sender) + (whisperMode ? $.lang.get('whisper.whispers.enabled') : $.lang.get('whisper.whispers.disabled')));
        }
        /**
         * @commandpath togglenonmodwhispers - Toggle allowing non-mods to send commands via whisper
         */
         else if ($.equalsIgnoreCase(command, 'togglenonmodwhispers')) {
            allowNonModWhispers = !allowNonModWhispers;
            $.setIniDbBoolean('settings', 'allowNonModWhispers', allowNonModWhispers);
            $.say(whisperPrefix(sender) + (allowNonModWhispers ? $.lang.get('whisper.allowNonModWhispers.enabled') : $.lang.get('whisper.allowNonModWhispers.disabled')));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/whisper.js', 'togglewhispermode', $.PERMISSION.Admin);
        $.registerChatCommand('./core/whisper.js', 'togglenonmodwhispers', $.PERMISSION.Admin);
    });

    /** Export functions to API */
    $.whisperPrefix = whisperPrefix;
    $.getBotWhisperMode = getBotWhisperMode;
    $.reloadWhispers = reloadWhispers;
})();
