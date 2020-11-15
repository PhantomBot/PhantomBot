/*
 * Copyright (C) 2016-2020 phantom.bot
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
            if (s.match(/\(alert [,.\w\W]+\)/g)) {
                var filename = s.match(/\(alert ([,.\w\W]+)\)/)[1];
                $.panelsocketserver.alertImage(filename);
                s = (s + '').replace(/\(alert [,.\w\W]+\)/, '');
                if (s == '') {
                    return null;
                }
            }

            if (s.match(/\(playsound\s([a-zA-Z1-9_]+)\)/g)) {
                if (!$.audioHookExists(s.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1])) {
                    $.log.error('Could not play audio hook: Audio hook does not exist.');
                    return null;
                }
                $.panelsocketserver.triggerAudioPanel(s.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1]);
                s = $.replace(s, s.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[0], '');
                if (s == '') {
                    return null;
                }
            }

            $.say(s);
        }

        $.writeToFile(username + ' ', './addons/bitsHandler/latestCheer.txt', false);
        $.writeToFile(username + ': ' + bits + ' ', './addons/bitsHandler/latestCheer&Bits.txt', false);


        checkForAutobump(username, bits);
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

        if (command.equalsIgnoreCase('testbits')) {
            checkForAutobump(args[0], args[1]);
        }
    });

    function checkForAutobump(username, bits) {
        $.log.file('bitsHandler', 'Checking database for bits count for user [' + username + ']');
        var bitsCount = $.getSetIniDbNumber('bumpSystem_bitsCounts', username.toLowerCase(), 0);

        $.log.file('bitsHandler', 'Bits count for user [' + username + ']: ' + bitsCount);

        var currentBits = parseInt(bitsCount);
        var cheeredBits = parseInt(bits);

        var totalBits = currentBits + cheeredBits;
        if (totalBits >= 300) {
            $.autoBump(username, "bits");
            $.log.file('bitsHandler', 'Bits count for user [' + username + '] is 300 or more (' + totalBits + '), triggering autobump');

            // Remove 300 from the user's count to start tracking again for the next possible bit bump
            $.setIniDbNumber('bumpSystem_bitsCounts', username.toLowerCase(), totalBits - 300);
        } else {
            $.log.file('bitsHandler', 'Adding ' + bits + ' to count for [' + username + ']');
            $.inidb.incr('bumpSystem_bitsCounts', username.toLowerCase(), bits);
        }
    }

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/bitsHandler.js', 'bitstoggle', 1);
        $.registerChatCommand('./handlers/bitsHandler.js', 'bitsmessage', 1);
        $.registerChatCommand('./handlers/bitsHandler.js', 'bitsminimum', 1);

        $.registerChatCommand('./handlers/bitsHandler.js', 'testbits', 2);
        announceBits = true;
    });

    $.reloadBits = reloadBits;
})();
