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
                    json.regexKey = new RegExp(json.keyword.replace('regex:', ''));
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
        var message = event.getMessage(),
            sender = event.getSender(),
            messageParts = message.toLowerCase().split(' '),
            str = '',
            json;

        // Don't say the keyword if someone tries to remove it.
        if (message.startsWith('!keyword')) {
            return;
        }

        for (var i = 0; i < keywords.length; i++) {
            json = keywords[i];

            if (json.isRegex) {
                if (json.regexKey.test(message)) {
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
                        json.response = $.replace(json.response, '.*\(keywordcount\s(.*)\).*', '');
                        json.response = $.replace(json.response, '(keywordcount)', '(keywordcount ' + json.keyword + ')');
                        $.say($.tags(event, json.response, false));
                    }
                    break;
                }
            } else {
                for (var idx = 0; idx < messageParts.length; idx++) {
                    // Create a string to match on the keyword.
                    str += (messageParts[idx] + ' ');
                    // Either match on the exact word or phrase if it contains it.
                    if ((json.keyword.includes(' ') && str.includes(json.keyword)) || messageParts[idx].equalsIgnoreCase(json.keyword)) {
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
                            json.response = $.replace(json.response, '.*\(keywordcount\s(.*)\).*', '');
                            json.response = $.replace(json.response, '(keywordcount)', '(keywordcount ' + json.keyword + ')');
                            $.say($.tags(event, json.response, false));
                        }
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
                if (actionArgs === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.add.usage'));
                    return;
                }

                var response = args.splice(2).join(' ');
                subAction = subAction.toLowerCase();

                var json = JSON.stringify({
                    keyword: (args[1] + ''),
                    response: response,
                    isRegex: subAction.startsWith('regex:')
                });

                $.setIniDbString('keywords', subAction, json);
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.added', (args[1] + '')));
                loadKeywords();
            }

            /*
             * @commandpath keyword remove [keyword] - Removes a given keyword
             */
            if (action.equalsIgnoreCase('remove')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.remove.usage'));
                    return;
                } else if (!$.inidb.exists('keywords', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                subAction = args[1].toLowerCase();

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
                } else if (!$.inidb.exists('keywords', subAction.toLowerCase())) {
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.keyword.404'));
                    return;
                }

                if (args[2] === -1) {
                    $.inidb.del('coolkey', subAction.toLowerCase());
                    $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.removed', subAction));
                    $.coolDownKeywords.clear(subAction.toLowerCase());
                    return;
                }

                $.inidb.set('coolkey', subAction.toLowerCase(), parseInt(args[2]));
                $.say($.whisperPrefix(sender) + $.lang.get('keywordhandler.cooldown.set', subAction, args[2]));
                $.coolDownKeywords.clear(subAction.toLowerCase());
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
