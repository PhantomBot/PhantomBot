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
 * sotnCommand.js
 *
 * Records winners of Song of the Night
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
         * @commandpath sotnwinner [description] - Marks a highlight using the given description and with the current date stamp
         */
        if (command.equalsIgnoreCase('sotnwinner')) {

        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/sotnCommand.js', 'sotnwinner', 2);
    });
})();

