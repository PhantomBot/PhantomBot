/**
 * quoteSystem.js
 *
 * Have the bot remember the most epic/derpy oneliners
 */
(function () {
  /**
   * @function saveQuote
   * @param {string} username
   * @param {string} quote
   * @returns {Number}
   */
  function saveQuote(username, quote) {
    var newKey = $.inidb.GetKeyList('quotes', '').length;

    $.inidb.set('quotes', newKey, JSON.stringify([username, quote, $.systemTime()]));
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

    if ($.inidb.exists('quotes', quoteId)) {
      $.inidb.del('quotes', quoteId);
      quoteKeys = $.inidb.GetKeyList('quotes', '');

      for (i in quoteKeys) {
        quotes.push($.inidb.get('quotes', quoteKeys[i]));
        $.inidb.del('quotes', quoteKeys[i]);
      }

      for (i in quotes) {
        $.inidb.set('quotes', i, quotes[i]);
      }

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
    if (!quoteId || isNaN(quoteId)) {
      quoteId = $.rand($.inidb.GetKeyList('quotes', '').length - 1);
    }

    if ($.inidb.exists('quotes', quoteId)) {
      return JSON.parse($.inidb.get('quotes', quoteId));
    } else {
      return [];
    }
  };

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender(),
        command = event.getCommand(),
        args = event.getArgs(),
        quote;

    /**
     * @commandpath addquote [username] [quote text] - Save a quote
     */
    if (command.equalsIgnoreCase('addquote')) {
      if (args.length < 2) {
        $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.add.usage'));
        return;
      }

      var username = (args[0] + '').toLowerCase();
      quote = args.splice(1).join(' ');

      $.say($.lang.get('quotesystem.add.success', username, saveQuote(username, quote)));
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

      if (newCount = deleteQuote(args[0]) < 0) {
        $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.del.success', args[0], newCount));
      } else {
        $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.del.404', args[0]));
      }
    }

    /**
     * @commandpath quote [quoteId] - Announce a quote by its Id, ommit the id parameter to get a random quote
     */
    if (command.equalsIgnoreCase('quote')) {
      quote = getQuote(args[0]);

      if (quote.length > 0) {
        $.say($.lang.get(
            'quotesystem.get.success',
            quote[1],
            $.resolveRank(quote[0]),
            $.dateToString(new Date(parseInt(quote[2])))
        ));
      } else {
        $.say($.whisperPrefix(sender) + $.lang.get('quotesystem.get.404', (typeof args[0] != 'undefined' ? args[0] : '')));
      }
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./systems/quoteSystem.js')) {
      $.registerChatCommand('./systems/quoteSystem.js', 'addquote', 2);
      $.registerChatCommand('./systems/quoteSystem.js', 'delquote', 2);
      $.registerChatCommand('./systems/quoteSystem.js', 'quote');
    }
  });
})();