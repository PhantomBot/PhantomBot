/**
 * quoteSystem.js
 *
 * Have the bot remember the most epic/derpy oneliners
 */
(function() {
    
    var quoteMode = $.getSetIniDbBoolean('settings', 'quoteMode', true),
        isDeleting = false;

    /**
     * @function updateQuote
     * @param {Number} quoteid
     * @param {Array} quote data
     */
    function updateQuote(quoteid, quote) {
        // Specify String() for objects as they were being treated as an object rather than a String on stringify().
        quote[0] = String(quote[0]).replace(/"/g, '\'\'');
        quote[1] = String(quote[1]).replace(/"/g, '\'\'');
        quote[3] = String(quote[3]).replace(/"/g, '\'\'');

        $.inidb.set('quotes', quoteid, JSON.stringify([String(quote[0]), String(quote[1]), String(quote[2]), String(quote[3])]));
    }

    /**
     * @function saveQuote
     * @param {string} username
     * @param {string} quote
     * @returns {Number}
     */
    function saveQuote(username, quote) {
        var newKey = $.inidb.GetKeyList('quotes', '').length,
            game = ($.getGame($.channelName) != '' ? $.getGame($.channelName) : "Some Game");

        if ($.inidb.exists('quotes', newKey)) {
            newKey++;
        }
        quote = String(quote).replace(/"/g, '\'\'');
        $.inidb.set('quotes', newKey, JSON.stringify([username, quote, $.systemTime(), game + '']));
        return newKey;
    };

    /**
     * @function deleteQuote
     * @param {Number} quoteId
     * @returns {Number}
     */
    function deleteQuote(quoteId) {
        var quoteKeys,
            quotes = [],
            i;

        if (isDeleting) {
            return -1;
        }
        
        if ($.inidb.exists('quotes', quoteId)) {
            isDeleting = true;
            $.inidb.del('quotes', quoteId);
            quoteKeys = $.inidb.GetKeyList('quotes', '');

            $.inidb.setAutoCommit(false);
            for (i in quoteKeys) {
                quotes.push($.inidb.get('quotes', quoteKeys[i]));
                $.inidb.del('quotes', quoteKeys[i]);
            }

            for (i in quotes) {
                $.inidb.set('quotes', i, quotes[i]);
            }
            $.inidb.setAutoCommit(true);
            isDeleting = false;
            return (quotes.length ? quotes.length : 0);
        } else {
            return -1;
        }
    };

    /**
     * @function getQuote
     * @param {Number} quoteId
     * @returns {Array}
     */
    function getQuote(quoteId) {
        var quote;

        if (!quoteId || isNaN(quoteId)) {
            quoteId = $.rand($.inidb.GetKeyList('quotes', '').length);
        }

        if ($.inidb.exists('quotes', quoteId)) {
            quote = JSON.parse($.inidb.get('quotes', quoteId));
            quote.push(quoteId);
            return quote;
        } else {
            return [];
        }
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            quote,
            quoteStr;

        /**
         * @commandpath editquote [id] [user|game|quote] [text]
         */
        if (command.equalsIgnoreCase("editquote")) {
            if (args.length < 3) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.usage'));
                return;
            }

            quote = getQuote(args[0]);
            if (quote.length > 0) {
                if (args[1].equalsIgnoreCase("user")) {
                    $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.user.success', args[0], args[2]));
                    quote[0] = args[2];
                    updateQuote(args[0], quote);
                } else if (args[1].equalsIgnoreCase("game")) {
                    $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.game.success', args[0], args.splice(2).join(' ')));
                    quote[3] = args.splice(2).join(' ');
                    updateQuote(args[0], quote);
                } else if (args[1].equalsIgnoreCase("quote")) {
                    $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.quote.success', args[0], args.splice(2).join(' ')));
                    quote[1] = args.splice(2).join(' ');
                    updateQuote(args[0], quote);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.usage'));
                }
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.404'));
            }

            $.log.event(sender + ' edited quote #' + quote);
        }
        
        /**
         * @commandpath quotemodetoggle - toggle between !addquote function modes
         */
        if (command.equalsIgnoreCase('quotemodetoggle')) {
            if (quoteMode) {
                quoteMode = false;
                $.inidb.set('settings', 'quoteMode', 'false');
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage2'));
                return;
            } else {
                quoteMode = true;
                $.inidb.set('settings', 'quoteMode', 'true');
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage1'));
                return;
            }
        }

        /**
         * @commandpath addquote [quote text] - Save a quote
         */
        if (command.equalsIgnoreCase('addquote')) {
            if (quoteMode) {
                if (args.length < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage1'));
                    return;
                }
                quote = args.splice(0).join(' ');
                $.say($.lang.get('quotesystem.add.success', $.username.resolve(sender), saveQuote(String($.username.resolve(sender)), quote)));
                $.log.event(sender + ' added a quote "' + quote + '".');
                return;
            } else {
                if (args.length < 2) {
                    $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage2'));
                    return;
                }
                var target = args[0].toLowerCase();
                if (!$.user.isKnown(target)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', target));
                    return;
                }
                quote = args.splice(1).join(' ');
                $.say($.lang.get('quotesystem.add.success', $.username.resolve(target), saveQuote(String($.username.resolve(target)), quote)));
                $.log.event(sender + ' added a quote "' + quote + '".');
                return;
            }
        }

        /**
         * USED BY THE PANEL
         */
        if (command.equalsIgnoreCase('addquotesilent')) {
            if (!$.isBot(sender)) {
                return;
            }
            if (args.length < 1) {
                return;
            }

            quote = args.splice(0).join(' ');
            saveQuote(String($.username.resolve(sender)), quote);
        }

        /**
         * @commandpath delquote [quoteId] - Delete a quote
         */
        if (command.equalsIgnoreCase('delquote')) {
            if (!args[0] || isNaN(args[0])) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.del.usage'));
                return;
            }

            var newCount;

            if ((newCount = deleteQuote(args[0])) >= 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.del.success', args[0], newCount));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.del.404', args[0]));
            }

            $.log.event(sender + ' removed quote with id: ' + args[0]);
        }

        /**
         * USED BY THE PANEL
         */
        if (command.equalsIgnoreCase('delquotesilent')) {
            if (!$.isBot(sender)) {
                return;
            }

            var newCount;

            if ((newCount = deleteQuote(args[0])) >= 0) {
            } else {
            }
        }

        /**
         * @commandpath quote [quoteId] - Announce a quote by its Id, omit the id parameter to get a random quote
         */
        if (command.equalsIgnoreCase('quote')) {
            quote = getQuote(args[0]);
            if (quote.length > 0) {
                quoteStr = ($.inidb.exists('settings', 'quoteMessage') ? $.inidb.get('settings', 'quoteMessage') : $.lang.get('quotesystem.get.success'));
                quoteStr = quoteStr.replace('(id)', (quote.length == 5 ? quote[4].toString() : quote[3].toString())).
                replace('(quote)', quote[1]).
                replace('(user)', $.resolveRank(quote[0])).
                replace('(game)', (quote.length == 5 ? quote[3] : "Some Game")).
                replace('(date)', $.getLocalTimeString('dd-MM-yyyy', parseInt(quote[2])));
                $.say(quoteStr);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.get.404', (typeof args[0] != 'undefined' ? args[0] : '')));
            }
        }

        /**
         * @commandpath quotemessage [message] - Sets the quote string with tags: (id) (quote) (user) (game) (date)
         */
        if (command.equalsIgnoreCase('quotemessage')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.quotemessage.usage'));
                return;
            }

            quoteStr = args.splice(0).join(' ');
            $.inidb.set('settings', 'quoteMessage', quoteStr);
            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.quotemessage.success'));
            $.log.event(sender + ' changed the quote message to: ' + quoteStr);
        }

        /**
         * @commandpath searchquote [string] - Searches the quotes for a string and returns a list of IDs
         */
        if (command.equalsIgnoreCase('searchquote')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.usage'));
                return;
            }
            var searchString = args.join(' ');
            if (searchString.length < 5) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.usage'));
                return;
            }

            var matchingKeys = $.inidb.searchByValue('quotes', searchString);
            if (matchingKeys.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.404'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.found', matchingKeys.join(', ')));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/quoteSystem.js')) {
            $.registerChatCommand('./systems/quoteSystem.js', 'quotemodetoggle', 2);
            $.registerChatCommand('./systems/quoteSystem.js', 'searchquote', 7);
            $.registerChatCommand('./systems/quoteSystem.js', 'addquote', 2);
            $.registerChatCommand('./systems/quoteSystem.js', 'addquotesilent', 1);
            $.registerChatCommand('./systems/quoteSystem.js', 'delquote', 2);
            $.registerChatCommand('./systems/quoteSystem.js', 'delquotesilent', 1);
            $.registerChatCommand('./systems/quoteSystem.js', 'editquote', 2);
            $.registerChatCommand('./systems/quoteSystem.js', 'quote');
            $.registerChatCommand('./systems/quoteSystem.js', 'quotemessage', 1);
        }
    });
})();
