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
 * kentobotSystem.js
 *
 * General bot maintenance and control
 */
(function () {

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(), // Arguments used in the command

                action = args[0];

        if (command.equalsIgnoreCase('sotnwinner')) {
            if (action == null) {
                $.say($.lang.get('sotn.store.winner.usage'));
            }

            var user = action;

            var bumpObj = JSON.parse($.getIniDbString('bumps', user, '{}'));
            if (bumpObj.hasOwnProperty('fulfilled')) {
                bumpFulfilled = (bumpObj.fulfilled == 'true');
            } else {
                bumpObj.bits = '0';
                bumpObj.donation = '0';
                bumpObj.fulfilled = 'false';

            }

            bumpObj.method = 'sotn';

            $.setIniDbString('bumps', user, JSON.stringify(bumpObj));
            $.say($.lang.get("sotn.store.winner", user));
            $.say("/emoteonly ");

            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        // `script` is the script location.
        // `command` is the command name without the `!` prefix.
        // `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7.
        // These are also used for the permcom command.
        // $.registerChatCommand('script', 'command', 'permission');

        $.registerChatCommand('./custom/sotn-system.js', 'sotnwinner', 2);
    });
})();