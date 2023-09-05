/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
 * lang.js
 *
 * Handles lang commands
 */
(function() {
    $.getSetIniDbBoolean('settings', 'response_@chat', true);

    /**
     * @event command
     */
    $.bind('command', function(event) {
        let sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            inversedState;

        /**
         * @commandpath lang [language name] - Get or optionally set the current language (use folder name from "./lang" directory);
         */
        if ($.equalsIgnoreCase(command, 'lang')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('lang.curlang', $.jsString($.getSetIniDbString('settings', 'lang', 'english'))));
            } else {
                action = action.toLowerCase();
                if (!$.fileExists('./scripts/lang/' + action + '/main.js')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('lang.lang.404'));
                } else {
                    $.inidb.set('settings', 'lang', action);
                    $.lang.load(true);
                    $.say($.whisperPrefix(sender) + $.lang.get('lang.lang.changed', action));
                }
            }
        }

        /**
         * @commandpath mute - Toggle muting the bot in the chat
         */
        if ($.equalsIgnoreCase(command, 'mute')) {
            inversedState = !$.getIniDbBoolean('settings', 'response_@chat');

            $.setIniDbBoolean('settings', 'response_@chat', inversedState);
            if (!inversedState) {
                $.say($.whisperPrefix(sender) + $.lang.get('lang.response.disabled'));
                $.reloadMisc();
            } else {
                $.reloadMisc();
                $.say($.whisperPrefix(sender) + $.lang.get('lang.response.enabled'));
            }
        }

        /**
         * @commandpath toggleme - Toggle prepending chat output with "/me".
         */
        if ($.equalsIgnoreCase(command, 'toggleme')) {
            inversedState = !$.getIniDbBoolean('settings', 'response_action');

            $.setIniDbBoolean('settings', 'response_action', inversedState);
            $.reloadMisc();
            $.say($.whisperPrefix(sender) + (inversedState ? $.lang.get('lang.response.action.enabled') : $.lang.get('lang.response.action.disabled')));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/lang.js', 'lang', $.PERMISSION.Admin);
        $.registerChatCommand('./core/lang.js', 'mute', $.PERMISSION.Admin);
        $.registerChatCommand('./core/lang.js', 'toggleme', $.PERMISSION.Admin);
    });
})();
