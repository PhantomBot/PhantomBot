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

/**
 * lang.js
 *
 * Provide a language API
 * Use the $.lang API
 *
 * NOTE: Reading from/writing to the lang data directly is not possbile anymore!
 * Use the register(), exists() and get() functions!
 */
(function() {
    var data = [],
        curLang = ($.inidb.exists('settings', 'lang') ? $.inidb.get('settings', 'lang') : 'english');

    /**
     * @function load
     */
    function load(force) {
        $.bot.loadScriptRecursive('./lang/english', true, (force ? force : false));
        if (curLang != 'english') {
            $.bot.loadScriptRecursive('./lang/' + curLang, true, (force ? force : false));
        }

        if ($.isDirectory('./scripts/lang/custom')) {
            $.bot.loadScriptRecursive('./lang/custom', true, (force ? force : false));
        }

        // Set "response_@chat" to true if it hasn't been set yet, so the bot isn't muted when using a fresh install
        if (!$.inidb.exists('settings', 'response_@chat')) {
            $.setIniDbBoolean('settings', 'response_@chat', true);
        }
    }

    /**
     * @function register
     * @export $.lang
     * @param {string} key
     * @param {string} string
     */
    function register(key, string) {
        if (key && string) {
            data[key.toLowerCase()] = string;
        }
        if (key && string.length === 0) {
            data[key.toLowerCase()] = '<<EMPTY_PLACEHOLDER>>';
        }
    }

    /**
     * @function get
     * @export $.lang
     * @param {string} key
     * @returns {string}
     */
    function get(key) {
        var string = data[key.toLowerCase()],
            i;

        if (string === undefined) {
            $.log.warn('Lang string for key "' + key + '" was not found.');
            return '';
        }

        if (string == '<<EMPTY_PLACEHOLDER>>') {
            return '';
        }

        for (i = 1; i < arguments.length; i++) {
            while (string.indexOf("$" + i) >= 0) {
                string = string.replace("$" + i, arguments[i]);
            }
        }
        return string;
    }

    /**
     * @function paramCount
     * @export $.lang
     * @param {string} key
     * @returns {Number}
     */
    function paramCount(key) {
        var string = data[key.toLowerCase()],
            i,
            ctr = 0;

        if (!string) {
            return 0;
        }

        for (i = 1; i < 99; i++) {
            if (string.indexOf("$" + i) >= 0) {
                ctr++;
            } else {
                break;
            }
        }
        return ctr;
    }

    /**
     * @function exists
     * @export $.lang
     * @param {string} key
     * @returns {boolean}
     */
    function exists(key) {
        return (data[key.toLowerCase()]);
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            inversedState;

        /**
         * @commandpath lang [language name] - Get or optionally set the current language (use folder name from "./lang" directory);
         */
        if (command.equalsIgnoreCase('lang')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + get('lang.curlang', curLang));
            } else {
                action = action.toLowerCase();
                if (!$.fileExists('./scripts/lang/' + action + '/main.js')) {
                    $.say($.whisperPrefix(sender) + get('lang.lang.404'));
                } else {
                    $.inidb.set('settings', 'lang', action);
                    curLang = action;
                    load(true);
                    $.say($.whisperPrefix(sender) + get('lang.lang.changed', action));
                }
            }
        }

        /**
         * @commandpath mute - Toggle muting the bot in the chat
         */
        if (command.equalsIgnoreCase('mute')) {
            inversedState = !$.getIniDbBoolean('settings', 'response_@chat');

            $.setIniDbBoolean('settings', 'response_@chat', inversedState);
            $.reloadMisc();
            $.say($.whisperPrefix(sender) + (inversedState ? get('lang.response.enabled') : get('lang.response.disabled')));
        }

        /**
         * @commandpath toggleme - Toggle prepending chat output with "/me".
         */
        if (command.equalsIgnoreCase('toggleme')) {
            inversedState = !$.getIniDbBoolean('settings', 'response_action');

            $.setIniDbBoolean('settings', 'response_action', inversedState);
            $.reloadMisc();
            $.say($.whisperPrefix(sender) + (inversedState ? get('lang.response.action.enabled') : get('lang.response.action.disabled')));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./core/lang.js', 'lang', 1);
        $.registerChatCommand('./core/lang.js', 'mute', 1);
        $.registerChatCommand('./core/lang.js', 'toggleme', 1);
    });

    /** Export functions to API */
    $.lang = {
        exists: exists,
        get: get,
        register: register,
        paramCount: paramCount
    };

    // Run the load function to enable modules, loaded after lang.js, to access the language strings immediatly
    load();
})();
