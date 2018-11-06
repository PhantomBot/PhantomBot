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
	var botList = $.readFile('./addons/ignorebots.txt');

	/**
     * @function reloadIgnore
     *
     * Reloads ignoreHandler settings
     *
     * Parameters: n/a
     */
    function reloadIgnore() {
        botList = $.readFile('./addons/ignorebots.txt');
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
        for (var i in botList) {
            if (botList[i].equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @function savebotList
     * 
     */
    function savebotList() {
        $.writeToFile(botList.join(String.fromCharCode(13, 10)), './addons/ignorebots.txt', false);
    }

    /**
     * @function getIndex
     * 
     * Parameters:
     * @array anArray
     * @string value
     *
     * returns:
     * integer
     *
     */
    function getIndex(anArray, value) {
        if(!Array.isArray(anArray)) {
            return -1;
        } else {
            for (var i in anArray) {
                if (anArray[i].equalsIgnoreCase(value)) {
                    return i;
                }
            }
            return -1;
        }
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
        	$.say($.whisperPrefix(sender) + $.lang.get('ignorelist', botList.join(', ')));
        }

        if (command.equalsIgnoreCase('ignoreadd')) {
        	if (!actionValue) {
                $.say($.whisperPrefix(sender) + $.lang.get('ignoreadd.usage'));
            } else {
                actionValue = actionValue.toLowerCase();
                actionValue = actionValue.trim();
                var i = getIndex(botList, actionValue);
                if (i < 0) {
                    actionValue = actionValue.trim();
                    botList.push(actionValue);
                    savebotList();
                    reloadIgnore();
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
                var i = getIndex(botList, actionValue);
                if (i < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ignoreremove.nouser', actionValue));
                } else {
                    botList.splice(i, 1);
                    savebotList();
                    reloadIgnore();
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

    /* Export to API */
    $.isTwitchBot = isTwitchBot;
})();
