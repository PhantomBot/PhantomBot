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
    var keywords = [];

    /*
     * @function loadKeywords
     */
    function loadKeywords() {
        var keys = $.inidb.GetKeyList('keywords', ''),
            i;

        keywords = [];

        for (i = 0; i < keys.length; i++) {
            var json = JSON.parse($.inidb.get('keywords', keys[i]));

            if (json.isRegex) {
                try {
                    json.regexKey = new RegExp(json.keyword, json.isCaseSensitive ? '' : 'i');
                } catch (ex) {
                    $.log.error('Bad regex detected in keyword [' + keys[i] + ']: ' + ex.message);
                    continue;
                }
            }

            keywords.push(json);
        }
    }

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        function executeKeyword(json, event) {
            // Make sure the keyword isn't on cooldown.
            if ($.coolDownKeywords.get(json.keyword, sender) > 0) {
                return;
            }
            // If the keyword is a command, we need to send that command.
            else if (json.response.startsWith('command:')) {
                $.command.run(sender, json.response.substring(8), '', event.getTags());
            }
            // Keyword just has a normal response.
            else {
                var CommandEvent = Packages.tv.phantombot.event.command.CommandEvent;
                var cmdEvent = new CommandEvent(sender, "keyword_" + json.keyword, event.getMessage(), event.getTags());
                json.response = $.replace(json.response, '(keywordcount)', '(keywordcount ' + $.escapeTags(json.keyword) + ')');
                $.say($.tags(cmdEvent, json.response, false));
            }
        }

        var message = event.getMessage(),
            sender = event.getSender(),
            messagePartsLower = message.toLowerCase().split(' '),
            messageParts = message.split(' '),
            json;

        // Don't say the keyword if someone tries to remove it.
        if (message.startsWith('!keyword')) {
            return;
        }

        for (var i = 0; i < keywords.length; i++) {
            json = keywords[i];

            if (json.isRegex) {
                if (json.regexKey.test(message)) {
                    executeKeyword(json, event);
                    break;
                }
            } else {
                var str = '',
                  caseAdjustedMessageParts = messageParts;
                if (!json.isCaseSensitive) {
                    caseAdjustedMessageParts = messagePartsLower;
                }
                for (var idx = 0; idx < caseAdjustedMessageParts.length; idx++) {
                    // Create a string to match on the keyword.
                    str += (caseAdjustedMessageParts[idx] + ' ');
                    // Either match on the exact word or phrase if it contains it.
                    if ((json.keyword.includes(' ') && str.includes(json.keyword)) || (caseAdjustedMessageParts[idx] + '') === (json.keyword + '')) {
                        executeKeyword(json, event);
                        break;
                    }
                }
            }
        }
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2];

        /*
         * @commandpath keyword - Base command for keyword options
         */
        if (command.equalsIgnoreCase('keyword')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.usage'));
                return;
            }

            /*
             * @commandpath keyword add [keyword] [response] - Adds a keyword and a response, use regex: at the start of the response to use regex.
             */
            if (action.equalsIgnoreCase('add')) {
                var isRegex = false,
                    isCaseSensitive = false,
                    keyword = null,
                    response = null;

                for (var i = 1; i < args.length; i++) {
                    if (keyword == null) {
                        if (args[i].equalsIgnoreCase('--regex')) {
                            isRegex = true;
                        } else if (args[i].equalsIgnoreCase('--case-sensitive')) {
                            isCaseSensitive = true;
                        } else {
                            keyword = $.jsString(args[i]);
                        }
                    } else {
                        response = $.jsString(args.splice(i).join(' '));
                        break;
                    }
                }

                if (response == null) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.add.usage'));
                    return;
                }

                if (!isCaseSensitive) {
                    keyword = keyword.toLowerCase();
                }

                var json = JSON.stringify({
                    keyword: keyword,
                    response: response,
                    isRegex: isRegex,
                    isCaseSensitive: isCaseSensitive
                });

                $.setIniDbString('keywords', keyword, json);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.added', keyword));
                loadKeywords();
            }

            /*
             * @commandpath keyword remove [keyword] - Removes a given keyword
             */
            if (action.equalsIgnoreCase('remove')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.remove.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                $.inidb.del('keywords', subAction);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.removed', subAction));
                loadKeywords();
            }

            /*
             * @commandpath keyword cooldown [keyword] [seconds] - Sets a cooldown on the keyword. Use -1 to remove it. If you use the command: tag and you have a cooldown on that command it will use that cooldown
             */
            if (action.equalsIgnoreCase('cooldown')) {
                if (subAction === undefined || isNaN(parseInt(args[2]))) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                if (args[2] === -1) {
                    $.inidb.del('coolkey', subAction);
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.removed', subAction));
                    $.coolDownKeywords.clear(subAction);
                    return;
                }

                $.inidb.set('coolkey', subAction, parseInt(args[2]));
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.set', subAction, args[2]));
                $.coolDownKeywords.clear(subAction);
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/keywordHandler.js', 'keyword', 1);

        $.registerChatSubcommand('keyword', 'add', 1);
        $.registerChatSubcommand('keyword', 'remove', 1);
        $.registerChatSubcommand('keyword', 'cooldown', 1);
        loadKeywords();
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./handlers/keywordHandler.js')) {
            loadKeywords();
        }
    });
})();
