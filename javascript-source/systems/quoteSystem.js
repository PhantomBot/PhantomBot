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
        $.panelsocketserver.sendJSONToAll(JSON.stringify({"query_id": "quote_update", "results": "update"}));
    }

    /**
     * @function saveQuote
     * @param {string} username
     * @param {string} quote
     * @returns {Number}
     */
    function saveQuote(username, quote) {
        var newKey = $.inidb.GetKeyList('quotes', '').length,
            game = (!$.javaString($.getGame($.channelName)).isBlank() ? $.getGame($.channelName) : "Some Game");

        if ($.inidb.exists('quotes', newKey)) {
            newKey++;
        }

        quote = String(quote).replace(/"/g, '\'\'');
        $.inidb.set('quotes', newKey, JSON.stringify([username, quote, $.systemTime(), game + '']));
        $.panelsocketserver.sendJSONToAll(JSON.stringify({"query_id": "quote_update", "results": "update"}));
        return newKey;
    }

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

            for (i in quoteKeys) {
                quotes.push($.inidb.get('quotes', quoteKeys[i]));
                $.inidb.del('quotes', quoteKeys[i]);
            }

            for (i in quotes) {
                $.inidb.set('quotes', i, quotes[i]);
            }

            isDeleting = false;
            $.panelsocketserver.sendJSONToAll(JSON.stringify({"query_id": "quote_update", "results": "update"}));
            return (quotes.length ? quotes.length : 0);
        }

        return -1;
    }

    /**
     * @function getQuote
     * @param quoteId id or search query
     * @returns {Array}
     */
    function getQuote(quoteId) {
        var quote;

        if (!quoteId) {
            quoteId = $.rand($.inidb.GetKeyList('quotes', '').length);
        } else if (isNaN(quoteId)) {
            quoteId = String(quoteId).toLowerCase();
            var quotes = $.inidb.GetKeyValueList('quotes', '');
            var ids = [];
            for (var i = 0; i < quotes.length; i++) {
                if (String(quotes[i].getValue()).toLowerCase().indexOf(quoteId) >= 0) {
                    ids.push(quotes[i].getKey());
                }
            }
            quoteId = ids.length > 0 ? $.randElement(ids) : $.rand(quotes.length);
        }

        if ($.inidb.exists('quotes', quoteId)) {
            quote = JSON.parse($.inidb.get('quotes', quoteId));
            quote.push(quoteId);
            return quote;
        }

        return [];
    }

    /**
     * @event command
     * @param event
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            quote,
            quoteStr;

        /**
         * @commandpath editquote [id] [user|game|quote] [text] - Edit quotes.
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
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.edit.404'));
            $.log.event(sender + ' edited quote #' + quote);
            return;
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
            }

            quoteMode = true;
            $.inidb.set('settings', 'quoteMode', 'true');
            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage1'));
            return;

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
            }
            if (args.length < 2) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage2'));
                return;
            }

            var useTwitchNames = ($.inidb.exists('settings', 'quoteTwitchNamesToggle')) ? $.inidb.GetBoolean('settings', '', 'quoteTwitchNamesToggle') : true;
            var target = useTwitchNames ? args[0].toLowerCase() : args[0].substring(0, 1).toUpperCase() + args[0].substring(1).toLowerCase();
            if (useTwitchNames && !$.user.isKnown(target)) {
                $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', target));
                return;
            }

            quote = args.splice(1).join(' ');
            var username = useTwitchNames ? $.username.resolve(target) : target;
            $.say($.lang.get('quotesystem.add.success', username, saveQuote(String(username), quote)));
            $.log.event(sender + ' added a quote "' + quote + '".');
            return;
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
            return;
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
                $.log.event(sender + ' removed quote with id: ' + args[0]);
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.del.404', args[0]));
            return;
        }

        /**
         * USED BY THE PANEL
         */
        if (command.equalsIgnoreCase('delquotesilent')) {
            if (!$.isBot(sender)) {
                return;
            }

            if (deleteQuote(args[0]) >= 0) {
                $.log.event(sender + ' removed quote with id: ' + args[0]);
            }
            return;
        }

        /**
         * @commandpath quote [quoteId] - Announce a quote by its Id, omit the id parameter to get a random quote
         */
        if (command.equalsIgnoreCase('quote')) {
            quote = getQuote(args[0]);
            if (quote.length > 0) {
                quoteStr = ($.inidb.exists('settings', 'quoteMessage') ? $.inidb.get('settings', 'quoteMessage') : $.lang.get('quotesystem.get.success'));
                quoteStr = quoteStr.replace('(id)', (quote.length === 5 ? quote[4].toString() : quote[3].toString()))
                                    .replace('(quote)', quote[1])
                                    .replace('(userrank)', $.resolveRank(quote[0]))
                                    .replace('(user)', $.username.resolve(quote[0]))
                                    .replace('(game)', (quote.length === 5 ? quote[3] : "Some Game"))
                                    .replace('(date)', $.getLocalTimeString($.getSetIniDbString('settings', 'quoteDateFormat', 'dd-MM-yyyy'), parseInt(quote[2])));
                $.say(quoteStr);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.get.404', (typeof args[0] !== 'undefined' ? args[0] : '')));
            }

            return;
        }

        /**
         * @commandpath quotemessage [message] - Sets the quote string with tags: (id) (quote) (user) (userrank) (game) (date)
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
            return;
        }

        /**
         * @commandpath quotedateformat [format] - Sets the date format for the (date) tag in a quote
         */
        if (command.equalsIgnoreCase('quotedateformat')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.quotedateformat.usage', $.getSetIniDbString('settings', 'quoteDateFormat', 'dd-MM-yyyy')));
                return;
            }

            quoteStr = args.splice(0).join(' ');
            $.inidb.set('settings', 'quoteDateFormat', quoteStr);
            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.quotedateformat.success'));
            $.log.event(sender + ' changed the quote date format to: ' + quoteStr);
            return;
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
            if (searchString.length < 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.usage'));
                return;
            }

            var matchingKeys = $.inidb.searchByValue('quotes', searchString);
            if (matchingKeys.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.404'));
                return;
            }

            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.searchquote.found', matchingKeys.join(', ')));
            return;
        }

        /**
         * @commandpath quotetwitchnamestoggle - Toggles on and off if quote names need to have been seen in chat before
         */
        if (command.equalsIgnoreCase('quotetwitchnamestoggle')) {
            var useTwitchNames = $.inidb.GetBoolean('settings', '', 'quoteTwitchNamesToggle');
            if (useTwitchNames) {
                useTwitchNames = false;
                $.inidb.set('settings', 'quoteTwitchNamesToggle', 'false');
                $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.twitchnames-disabled'));
                return;
            }

            useTwitchNames = true;
            $.inidb.set('settings', 'quoteTwitchNamesToggle', 'true');
            $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.twitchnames-enabled'));
            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/quoteSystem.js', 'quotemodetoggle', $.PERMISSION.Mod);
        $.registerChatCommand('./systems/quoteSystem.js', 'searchquote', $.PERMISSION.Viewer);
        $.registerChatCommand('./systems/quoteSystem.js', 'addquote', $.PERMISSION.Mod);
        $.registerChatCommand('./systems/quoteSystem.js', 'addquotesilent', $.PERMISSION.Admin);
        $.registerChatCommand('./systems/quoteSystem.js', 'delquote', $.PERMISSION.Mod);
        $.registerChatCommand('./systems/quoteSystem.js', 'delquotesilent', $.PERMISSION.Admin);
        $.registerChatCommand('./systems/quoteSystem.js', 'editquote', $.PERMISSION.Mod);
        $.registerChatCommand('./systems/quoteSystem.js', 'quote');
        $.registerChatCommand('./systems/quoteSystem.js', 'quotemessage', $.PERMISSION.Admin);
        $.registerChatCommand('./systems/quoteSystem.js', 'quotedateformat', $.PERMISSION.Admin);
        $.registerChatCommand('./systems/quoteSystem.js', 'quotetwitchnamestoggle', $.PERMISSION.Admin);
    });
})();
