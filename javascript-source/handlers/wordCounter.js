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

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        /**
         * @commandpath wordcounter - Configures various option for the wordcounter
         */
        if (command.equalsIgnoreCase('wordcounter')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('wordcounter.usage'));
                return;
            }

            /**
             * @commandpath wordcounter add [word] - Adds a word that will be counted every time someone says it
             */
            if (action.equalsIgnoreCase('add')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('wordcounter.add.usage'));
                    return;
                }

                subAction = subAction.replace(action, '').toLowerCase();
                $.inidb.set('wordCounter', subAction, 0);
                $.say(subAction + $.lang.get('wordcounter.added'));
                $.log.event(sender + ' added "' + subAction + '" to the word counter list');
            }

            /**
             * @commandpath wordcounter remove [word] - Removes the given word which will no longer be counted every time someone says it
             */
            if (action.equalsIgnoreCase('remove')) {
                if (!subAction) {
                    $.say($.whisperPrefix(sender) + $.lang.get('wordcounter.remove.usage'));
                    return;
                } else if (!$.inidb.exists('wordCounter', subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('wordcounter.err.404'));
                    return;
                }

                subAction = subAction.replace(action, '').toLowerCase();
                $.inidb.del('wordCounter', subAction);
                $.say(subAction + $.lang.get('wordcounter.removed'));
                $.log.event(sender + ' removed "' + subAction + '" from the word counter list');
            }
        }

        /**
         * @commandpath count [word] - Tells you how many times that word as been said in chat.
         */
        if (command.equalsIgnoreCase('count')) {
            if (!action || !$.inidb.exists('wordCounter', action.toLowerCase())) {
                $.say($.whisperPrefix(sender) + $.lang.get('wordcounter.err.404'));
                return;
            }

            $.say($.lang.get('wordcounter.count', action, $.inidb.get('wordCounter', action.toLowerCase())));
        }
    });


    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var message = event.getMessage().toLowerCase(),
            keys = $.inidb.GetKeyList('wordCounter', ''),
            word,
            key;

        if ($.bot.isModuleEnabled('./handlers/wordCounter.js')) {
            for (i in keys) {
                key = keys[i].toLowerCase();
                word = new RegExp('\\b' + key + '\\b', 'ig');
                if (word.exec(message)) {
                    $.inidb.incr('wordCounter', key, 1);
                    break;
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/wordCounter.js', 'wordcounter', 1);
        $.registerChatCommand('./handlers/wordCounter.js', 'count', 7);
    });
})();
