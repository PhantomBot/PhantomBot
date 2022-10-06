/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
    const datebaseModuleId = 'keyword_emotes';
    const emoteProvider = 'local';
    const handlerModule = './handlers/keywordEmotesHandler.js';
    let keywords = new Map();

    // Reference
    const json = {
        isRegex: true,
        isCaseSensitive: false,
        cooldown: 0,
        image: 'sample.gif',
    }

    function loadKeywords() {
        let keyValuePairs = $.inidb.GetKeyValueList(datebaseModuleId, '');
        keywords = new Map();
        for (let i = 0; i < keyValuePairs.length; i++) {
            let keyword = String(keyValuePairs[i].getKey());
            try {
                let json = JSON.parse(keyValuePairs[i].getValue());
                if (json.isRegex) {
                    json.regexKey = new RegExp(keyword, json.isCaseSensitive ? '' : 'i');
                }
                keywords.set(keyword, json);
            } catch (ex) {
                $.log.error(`Could not process keyword "${keyword}": ${ex.message}`);
            }
        }
    }

    $.bind('ircChannelMessage', function (event) {
        var message = String(event.getMessage());

        keywords.forEach((json, keyword) => {
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