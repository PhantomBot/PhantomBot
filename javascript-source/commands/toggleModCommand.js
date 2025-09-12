/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
 * toggleModCommand.js
 *
 * This module offers a command to toggle moderator status
 */
(function() {

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand();

        /**
         * @commandpath togglemod - Toggle moderator status.
         */
        if ($.equalsIgnoreCase(command, 'togglemod')) {
          if ($.isMod('', event.getTags())) {
            $.unmodUser(sender);
            $.say($.lang.get('togglemod.unmod', sender));
          }
          else {
            $.modUser(sender);
            $.say($.lang.get('togglemod.mod', sender));
          }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/toggleModCommand.js', 'togglemod', $.PERMISSION.Mod);
    });
})();
