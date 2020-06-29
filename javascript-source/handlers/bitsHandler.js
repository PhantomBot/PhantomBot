/*
 * Copyright (C) 2016-2018 phantombot.tv
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

/**
 * This script is for announcing bits from Twitch, and rewarding the user with points if the caster wants too.
 *
 */
(function () {
    var toggle = $.getSetIniDbBoolean('bitsSettings', 'toggle', false),
            message = $.getSetIniDbString('bitsSettings', 'message', '(name) just cheered (amount) bits!'),
            minimum = $.getSetIniDbNumber('bitsSettings', 'minimum', 0),
            announceBits = false;

    /*
     * @function reloadBits
     */
    function reloadBits() {
        toggle = $.getIniDbBoolean('bitsSettings', 'toggle', false);
        message = $.getIniDbString('bitsSettings', 'message', '(name) just cheered (amount) bits!');
        minimum = $.getIniDbNumber('bitsSettings', 'minimum', 0);
    }

    /*
     * @event twitchBits
     */
    $.bind('twitchBits', function (event) {
        var username = event.getUsername(),
                bits = event.getBits(),
                ircMessage = event.getMessage(),
                emoteRegexStr = $.twitch.GetCheerEmotesRegex(),
                s = message;

        if (announceBits === false || toggle === false) {
            return;
        }

        if (bits == 1) {
            s = $.replace(s, 'bits', 'bit');
        }

        if (s.match(/\(name\)/g)) {
            s = $.replace(s, '(name)', username);
        }

        if (s.match(/\(amount\)/g)) {
            s = $.replace(s, '(amount)', bits);
        }

        if (s.match(/\(message\)/g)) {
            s = $.replace(s, '(message)', ircMessage);
            if (emoteRegexStr.length() > 0) {
                emoteRegex = new RegExp(emoteRegexStr, 'gi');
                s = String(s).valueOf();
                s = s.replace(emoteRegex, '');
            }
        }

        if (bits >= minimum) {
            $.say(s);
        }

        $.writeToFile(username + ' ', './addons/bitsHandler/latestCheer.txt', false);
        $.writeToFile(username + ': ' + bits + ' ', './addons/bitsHandler/latestCheer&Bits.txt', false);

        if (bits >= 300) {
            $.autoBump(username);
        }
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                argsString = event.getArguments(),
                action = args[0];

        /*
         * @commandpath bitstoggle - Toggles the bits announcements.
         */
        if (command.equalsIgnoreCase('bitstoggle')) {
            toggle = !toggle;
            $.setIniDbBoolean('bitsSettings', 'toggle', toggle);
            $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('bitshandler.toggle.on') : $.lang.get('bitshandler.toggle.off')))
        }


        /*
         * @commandpath bitsmessage - Sets a message for when someone cheers bits.
         */
        if (command.equalsIgnoreCase('bitsmessage')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('bitshandler.message.usage'));
                return;
            }

            message = argsString;
            $.setIniDbString('bitsSettings', 'message', message);
            $.say($.whisperPrefix(sender) + $.lang.get('bitshandler.message.set', message));
        }

        /*
         * @commandpath bitsminimum - Set how many bits someone needs to cheer before announcing it.
         */
        if (command.equalsIgnoreCase('bitsminimum')) {
            if (isNaN(parseInt(action))) {
                $.say($.whisperPrefix(sender) + $.lang.get('bitshandler.minimum.usage'));
                return;
            }

            minimum = parseInt(action);
            $.setIniDbNumber('bitsSettings', 'minimum', minimum);
            $.say($.whisperPrefix(sender) + $.lang.get('bitshandler.minimum.set', minimum));
            $.log.event(sender + ' changed the bits minimum to: ' + minimum + ' bits.');
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/bitsHandler.js', 'bitstoggle', 1);
        $.registerChatCommand('./handlers/bitsHandler.js', 'bitsmessage', 1);
        $.registerChatCommand('./handlers/bitsHandler.js', 'bitsminimum', 1);
        announceBits = true;
    });

    $.reloadBits = reloadBits;
})();
