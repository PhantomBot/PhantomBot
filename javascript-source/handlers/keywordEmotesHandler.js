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

(function () {
    const databaseModuleId = 'keyword_emotes';
    const emoteProvider = 'local';
    const handlerModule = './handlers/keywordEmotesHandler.js';
    var keywords = undefined;

    /** Reference
    const json = {
        isRegex: true,
        isCaseSensitive: false,
        cooldown: 0,
        image: 'sample.gif'
    };
    */

    function loadKeywords() {
        var keyValuePairs = $.inidb.GetKeyValueList(databaseModuleId, '');

        keywords = {};
        for (var i = 0; i < keyValuePairs.length; i++) {
            var keyword = String(keyValuePairs[i].getKey());
            try {
                var json = JSON.parse(keyValuePairs[i].getValue());
                if (json.isRegex) {
                    json.regexKey = new RegExp(keyword, json.isCaseSensitive ? '' : 'i');
                }
                keywords[keyword] = json;
            } catch (ex) {
                $.log.error("Could not process keyword " + keyword + ": " + ex.message);
            }
        }
    }

    $.bind('ircChannelMessage', function (event) {
        var message = String(event.getMessage());

        Object.keys(keywords).forEach(keyword => {
            var json = keywords[keyword];
            var count = 0;
            if (json.isRegex) {
                var re = new RegExp(keyword, 'g' + (json.isCaseSensitive ? 'i' : ''));
                count = (message.match(re) || []).length;
            } else {
                // work in pure lowercase if the keyword is case insensitive
                var haystack = json.isCaseSensitive ? message : message.toLowerCase();
                var needle = json.isCaseSensitive ? keyword : keyword.toLowerCase();

                var lastPosition = haystack.indexOf(needle);
                while (lastPosition !== -1) {
                    count++;
                    lastPosition = haystack.indexOf(needle, lastPosition + 1);
                }
            }
            if(count > 0) {
                $.alertspollssocket.triggerEmote(json.image, count, emoteProvider);
            }
        });
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        loadKeywords();
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase(handlerModule)) {
            loadKeywords();
        }
    });
})();
