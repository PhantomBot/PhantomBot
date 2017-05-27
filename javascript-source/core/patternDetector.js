/**
 * patterDetector.js
 *
 * Export an API for checking chat messages for links, email addresses, excessive character sequenses etc.
 * Use the $.patternDetector API
 */
(function() {
    var patterns = {
            link: new RegExp('((?:(http|https|rtsp):\\/\\/(?:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\'\\(\\)'
             + '\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,64}(?:\\:(?:[a-z0-9\\$\\-\\_'
             + '\\.\\+\\!\\*\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,25})?\\@)?)?'
             + '((?:(?:[a-z0-9][a-z0-9\\-]{0,64}\\.)+'
             + '(?:'
             + '(?:aero|a[cdefgilmnoqrstuwxz])'
             + '|(?:biz|b[abdefghijmnorstvwyz])'
             + '|(?:com|c[acdfghiklmnoruvxyz])'
             + '|d[ejkmoz]'
             + '|(?:edu|e[cegrstu])'
             + '|(?:fyi|f[ijkmor])'
             + '|(?:gov|g[abdefghilmnpqrstuwy])'
             + '|(?:how|h[kmnrtu])'
             + '|(?:info|i[delmnoqrst])'
             + '|(?:jobs|j[emop])'
             + '|k[eghimnrwyz]'
             + '|l[abcikrstuvy]'
             + '|(?:mil|mobi|moe|m[acdeghklmnopqrstuvwxyz])'
             + '|(?:name|net|n[acefgilopruz])'
             + '|(?:org|om)'
             + '|(?:pro|p[aefghklmnrstwy])'
             + '|qa'
             + '|(?:r[eouw])'
             + '|(?:s[abcdeghijklmnortuvyz])'
             + '|(?:t[cdfghjklmnoprtvwz])'
             + '|u[agkmsyz]'
             + '|(?:vote|v[ceginu])'
             + '|(?:xxx)'
             + '|(?:watch|w[fs])'
             + '|y[etu]'
             + '|z[amw]))'
             + '|(?:(?:25[0-5]|2[0-4]'
             + '[0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\\.(?:25[0-5]|2[0-4][0-9]'
             + '|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1]'
             + '[0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}'
             + '|[1-9][0-9]|[0-9])))'
             + '(?:\\:\\d{1,5})?)'
             + '(\\/(?:(?:[a-z0-9\\;\\/\\?\\:\\@\\&\\=\\#\\~'
             + '\\-\\.\\+\\!\\*\\\'\\(\\)\\,\\_])|(?:\\%[a-fA-F0-9]{2}))*)?'
             + '(?:\\b|$)'
             + '|(\\.[a-z]+\\/|magnet:\/\/|mailto:\/\/|ed2k:\/\/|irc:\/\/|ircs:\/\/|skype:\/\/|ymsgr:\/\/|xfire:\/\/|steam:\/\/|aim:\/\/|spotify:\/\/)', 'i'),
            emotes: new RegExp('([0-9][0-9]-[0-9][0-9])|([0-9]-[0-9])', 'g'),
            repeatedSeq: /(.)(\1+)/g,
            nonAlphaSeq: /([^a-z0-9 ])(\1+)/ig,
            nonAlphaCount: /([^a-z0-9 ])/ig,
            capsCount: /([A-Z])/g,
            meCheck: /^\/me/,
            fakePurge: new RegExp('(^<message \w+>)|(^<\w+ deleted>)', 'i')
        };

    /**
     * @function hasLinks
     * @export $.patternDetector
     * @param {Object} event
     * @param {boolean} [aggressive]
     * @returns {boolean}
     */
    function hasLinks(event) {
        return patterns.link.test(event.getMessage());
    }

    /**
     * @function logLastLink
     * @export $.patternDetector
     */
    function logLastLink(event) {
        $.log.file('patternDetector', 'Matched link on message from ' + event.getSender() + ': ' + patterns.link.exec(event.getMessage())[0]);
    }

    /**
     * @function getLongestRepeatedSequence
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getLongestRepeatedSequence(event) {
        var sequences = event.getMessage().match(patterns.repeatedSeq);

        return (sequences === null ? 0 : sequences[0].length);
    }

    /**
     * @function getLongestNonLetterSequence
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getLongestNonLetterSequence(event) {
        var message = (event.getMessage() + ''),
            sequences = message.match(patterns.nonAlphaSeq);

        return (sequences === null ? 0 : sequences[0].length);
    }

    /**
     * @function getNumberOfNonLetters
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getNumberOfNonLetters(event) {
        var sequences = event.getMessage().match(patterns.nonAlphaCount);

        return (sequences === null ? 0 : sequences.length);
    }

    /**
     * @function getEmotesCount
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     * @info this gets the emote count from the ircv3 tags and the emotes cache if enabled.
     */
    function getEmotesCount(event) {
        var emotes = event.getTags().get('emotes'),
            matched = emotes.match(patterns.emotes),
            extraEmotes = $.emotesHandler.getEmotesMatchCount(event.getMessage());

        return (matched === null ? extraEmotes : (matched.length + extraEmotes));
    }

    /**
     * @function getMessageWithoutEmotes
     * @export $.patternDetector
     * @param {Object} event
     * @returns {string}
     */
    function getMessageWithoutEmotes(event, message) {
        var emotes = event.getTags().get('emotes'),
            str = message,
            i;

        if (emotes.length() > 0) {
            emotes = emotes.replaceAll('[0-9]+:', '').split('/');
            for (i in emotes) {
                str = str.replace(getWordAt(message, parseInt(emotes[i].split('-')[0])), '');
            }
        }
        return str;
    }

    /**
     * @function getWordAt
     *
     * @param  {String} str
     * @param  {Number} pos
     * @return {String}
     */
    function getWordAt(str, pos) {
        str = String(str);
        pos = pos >>> 0;
    
        var left = str.slice(0, pos + 2).search(/\S+$/),
            right = str.slice(pos).search(/\s/);
    
        if (right < 0) {
            return str.slice(left);
        }
    
        return str.slice(left, right + pos);
    }

    /**
     * @function getNumberOfCaps
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getNumberOfCaps(event) {
        var sequences = getMessageWithoutEmotes(event, event.getMessage()).match(patterns.capsCount);

        return (sequences === null ? 0 : sequences.length);
    }

    /**
     * @function getColoredMessage
     * @export $.patternDetector
     * @param {Object} event
     * @returns {boolean}
     */
    function getColoredMessage(event) {
        return event.getMessage().indexOf('/me') === 0;
    }

    /**
     * @function getFakePurge
     * @export $.patternDetector
     * @param {Object} event
     * @returns {boolean}
     */
    function getFakePurge(event) {
        return patterns.fakePurge.test(event.getMessage().replace(meCheck, ''));
    }

    /** Export functions to API */
    $.patternDetector = {
        hasLinks: hasLinks,
        getLongestRepeatedSequence: getLongestRepeatedSequence,
        getLongestNonLetterSequence: getLongestNonLetterSequence,
        getNumberOfNonLetters: getNumberOfNonLetters,
        getEmotesCount: getEmotesCount,
        getMessageWithoutEmotes: getMessageWithoutEmotes,
        getNumberOfCaps: getNumberOfCaps,
        logLastLink: logLastLink,
        getColoredMessage: getColoredMessage,
        getFakePurge: getFakePurge
    };
})();
