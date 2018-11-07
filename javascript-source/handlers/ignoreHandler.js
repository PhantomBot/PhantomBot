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

(function() {
    var botList = [];

    /**
     * @function loadBotList
     *
     * Loads ignoreHandler settings
     *
     * Parameters: n/a
     */
    function loadBotList() {
        var list = $.readFile('./addons/ignorebots.txt');

        for (var i = 0; i < list.length; i++) {
            botList[list[i]] = true;
        }
    }

    /**
     * @function isTwitchBot
     *
     * Checks a username against a list of known bots
     *
     * Parameters:
     * @string username
     */
    function isTwitchBot(username) {
        return botList[username] !== undefined;
    }

    /**
     * @function removeTwitchBot
     *
     * Removes bot from ignoreHandler settings
     *
     * Parameters:
     * @string username
     */
    function removeTwitchBot(username) {
        if (isTwitchBot(username)) {
            delete botList[username];
        }
    }

    /**
     * @function addTwitchBot
     *
     * Adds bot to ignoreHandler settings
     *
     * Parameters:
     * @string username
     */
    function addTwitchBot(username) {
        if (!isTwitchBot(username)) {
            botList[username] = true;
        }
    }

    /**
     * @function savebotList
     * 
     */
    function saveBotList() {
        $.writeToFile(Object.keys(botList).join(String.fromCharCode(13, 10)), './addons/ignorebots.txt', false);
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            actionValue = args[0];

        if (command.equalsIgnoreCase('ignore')) {
            $.say($.whisperPrefix(sender) + $.lang.get('ignore.usage'));
        }

        if (command.equalsIgnoreCase('ignorelist')) {
            $.say($.whisperPrefix(sender) + $.lang.get('ignorelist', Object.keys(botList).join(', ')));
        }

        if (command.equalsIgnoreCase('ignoreadd')) {
            if (!actionValue) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.usage'));
            } else {
                actionValue = actionValue.toLowerCase();
                actionValue = actionValue.trim();
                if (!isTwitchBot(actionValue)) {
                    actionValue = actionValue.trim();
                    addTwitchBot(actionValue);
                    saveBotList();
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.added', actionValue));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.nouser', actionValue));
                }
            }
        }

        if (command.equalsIgnoreCase('ignoreremove')) {
            if (!actionValue) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.usage'));
            } else {
                actionValue = actionValue.toLowerCase();
                if (!isTwitchBot(actionValue)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.nouser', actionValue));
                } else {
                    removeTwitchBot(actionValue);
                    saveBotList();
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.removed', actionValue));
                }
            }
        }
    });


    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/ignoreHandler.js', 'ignore', 1);
        $.registerChatCommand('./handlers/ignoreHandler.js', 'ignorelist', 1);
        $.registerChatCommand('./handlers/ignoreHandler.js', 'ignoreadd', 1);
        $.registerChatCommand('./handlers/ignoreHandler.js', 'ignoreremove', 1);
    });

    loadBotList();

    /* Export to API */
    $.isTwitchBot = isTwitchBot;
})();
