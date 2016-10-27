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
    function load() {
        $.bot.loadScriptRecursive('./lang/english', true);
        if (curLang != 'english') {
            $.bot.loadScriptRecursive('./lang/' + curLang, true);
        }

        if ($.isDirectory('./scripts/lang/custom')) {
            $.bot.loadScriptRecursive('./lang/custom', false);
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
            data[key] = string;
        }
        if (key && string.length === 0) {
            data[key] = '<<EMPTY_PLACEHOLDER>>';
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

        if (!string) {
            $.log.warn('Language string missing for "' + key + '". This could be due to a update to the lang files.');
            return ''; // Don't say anything in chat.
        }

        if (string.equals('<<EMPTY_PLACEHOLDER>>')) {
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
     * @function exists
     * @export $.lang
     * @param {string} key
     * @returns {boolean}
     */
    function exists(key) {
        return (data[key]);
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
            if (!$.isAdmin(sender)) {
                $.say($.whisperPrefix(sender) + $.adminMsg);
                return;
            }

            if (!action) {
                $.say($.whisperPrefix(sender) + get('lang.curlang', curLang));
            } else {
                action = action.toLowerCase();
                if (!$.fileExists('./scripts/lang/' + action + '/main.js')) {
                    $.say($.whisperPrefix(sender) + get('lang.lang.404'));
                } else {
                    $.inidb.set('settings', 'lang', action);
                    curLang = action;
                    load();
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
        if ($.bot.isModuleEnabled('./core/lang.js')) {
            $.registerChatCommand('./core/lang.js', 'lang', 1);
            $.registerChatCommand('./core/lang.js', 'mute', 1);
            $.registerChatCommand('./core/lang.js', 'toggleme', 1);
        }
    });

    /** Export functions to API */
    $.lang = {
        exists: exists,
        get: get,
        register: register,
    };

    // Run the load function to enable modules, loaded after lang.js, to access the language strings immediatly
    load();
})();
