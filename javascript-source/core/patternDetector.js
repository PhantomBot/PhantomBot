/**
 * patterDetector.js
 *
 * Export an API for checking chat messages for links, email addresses, excessive character sequenses etc.
 * Use the $.patternDetector API
 */
(function() {
    var patterns = {
            link: new RegExp('((?:(http|https|Http|Https|rtsp|Rtsp):\\/\\/(?:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\'\\(\\)'
             + '\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,64}(?:\\:(?:[a-z0-9\\$\\-\\_'
             + '\\.\\+\\!\\*\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,25})?\\@)?)?'
             + '((?:(?:[a-z0-9][a-z0-9\\-]{0,64}\\.)+'
             + '(?:'
             + '(?:aero|arpa|app|a[cdefgilmnoqrstuwxz])'
             + '|(?:biz|bar|best|bingo|bot|b[abdefghijmnorstvwyz])'
             + '|(?:cat|com|coop|cash|chat|codes|cool|c[acdfghiklmnoruvxyz])'
             + '|d[ejkmoz]'
             + '|(?:edu|e[cegrstu])'
             + '|(?:fyi|f[ijkmor])'
             + '|(?:gov|g[abdefghilmnpqrstuwy])'
             + '|(?:how|h[kmnrtu])'
             + '|(?:info|int|i[delmnoqrst])'
             + '|(?:jobs|j[emop])'
             + '|k[eghimnrwyz]'
             + '|l[abcikrstuvy]'
             + '|(?:mil|mobi|moe|m[acdeghklmnopqrstuvwxyz])'
             + '|(?:name|net|n[acefgilopruz])'
             + '|(?:org|om)'
             + '|(?:pro|p[aefghklmnrstwy])'
             + '|qa'
             + '|(?:rodeo|rocks|r[eouw])'
             + '|(?:stream|support|sale|s[abcdeghijklmnortuvyz])'
             + '|(?:tel|travel|top|t[cdfghjklmnoprtvwz])'
             + '|u[agkmsyz]'
             + '|(?:vote|video|v[aceginu])'
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
            fakePurge: /(^<message \w+>$)/i
        },
        lastFoundLink = '';

    /**
     * @function hasLinks
     * @export $.patternDetector
     * @param {Object} event
     * @param {boolean} [aggressive]
     * @returns {boolean}
     */
    function hasLinks(event, aggressive) {
        try {
            //var message = (event.getMessage() + '');
            
            /**
             * @info commented out because this is not used at all since it does not replace correctly in the function.
             * message = deobfuscateLinks(message, (aggressive));
             */

            lastFoundLink = patterns.link.exec(event.getMessage())[0];
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @function getLastFoundLink
     * @export $.patternDetector
     * @returns {string}
     */
    function getLastFoundLink() {
        return lastFoundLink;
    }

    /**
     * @function logLastLink
     * @export $.patternDetector
     */
    function logLastLink(event) {
        $.log.file('patternDetector', 'Matched link on message from ' + event.getSender() + ': ' + lastFoundLink);
    }

    /**
     * @function deobfuscateLinks
     * @export $.patternDetector
     * @param {string} message
     * @param {boolean} [aggressive]
     * @returns {string}
     */
    function deobfuscateLinks(message, aggressive) {
        message = (message + '');

        message
            .replace(/"/g, '')
            .replace(/--/g, '.')
            .replace(/\[dot]/g, '.')
            .replace(/<dot>/g, '.')
            .replace(/\{dot}/g, '.')
            .replace(/\(dot\)/g, '.');

        if (aggressive) {
            message
                .replace(/\sdot\s/g, '.')
                .replace(/,/g, '.')
                .replace(/\|-\|/g, 'h')
                .replace(/\|_\|/g, 'u')
                .replace(/\\\//g, 'v')
                .replace(/0/g, 'o')
                .replace(/1/g, 'i')
                .replace(/3/g, 'e')
                .replace(/5/g, 's')
                .replace(/7/g, 't')
                .replace(/8/g, 'b')
                .replace(/\|\)/g, 'd')
                .replace(/\|\)/g, 'd')
                .replace(/\(\)/g, 'o')
                .replace(/\(/g, 'c')
                .replace(/\$/g, 's')
                .replace(/\/-\\/g, 'a')
                .replace(/\|\\\/\|/g, 'm')
                .replace(/\|\/\|/g, 'n')
                .replace(/\|\\\|/g, 'n')
                .replace(/\s\./g, '.')
                .replace(/\.\s/g, '.')
                .replace(/\.\./g, '.');
        }

        return message;
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
        var emotes = event.getTags().get('emotes');

        return ((emotes.match(patterns.emotes) === null ? 0 : (emotes.match(patterns.emotes).length) + $.emotesHandler.getEmotesMatchCount(event.getMessage())));
    }

    /**
     * @function getEmotesLength
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     * @info this gets the total emote length
     */
    function getEmotesLength(event) {
        var emotes = event.getTags().get('emotes'),
            length = 0,
            i;

        if (emotes !== null && emotes != '') {
            emotes = emotes.replaceAll('[0-9]+:', '').replaceAll('/', ',').split(',');
            for (i = 0; i < emotes.length; i++) {
                length += (parseInt(emotes[i].split('-')[1]) - parseInt(emotes[i].split('-')[0]) + 1);
            }
            return length;
        }
            
        return 0;
    }

    /**
     * @function getNumberOfCaps
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getNumberOfCaps(event) {
        var sequences = event.getMessage().match(patterns.capsCount);

        return (sequences === null ? 0 : sequences.length);
    }

    /**
     * @function getColoredMessage
     * @export $.patternDetector
     * @param {Object} event
     * @returns {boolean}
     */
    function getColoredMessage(event) {
        return event.getMessage().startsWith('/me');
    }

    /**
     * @function getFakePurge
     * @export $.patternDetector
     * @param {Object} event
     * @returns {boolean}
     */
    function getFakePurge(event) {
        return event.getMessage().match(patterns.fakePurge);
    }

    /** Export functions to API */
    $.patternDetector = {
        hasLinks: hasLinks,
        getLongestRepeatedSequence: getLongestRepeatedSequence,
        getLongestNonLetterSequence: getLongestNonLetterSequence,
        getNumberOfNonLetters: getNumberOfNonLetters,
        getLastFoundLink: getLastFoundLink,
        getEmotesCount: getEmotesCount,
        getEmotesLength: getEmotesLength,
        getNumberOfCaps: getNumberOfCaps,
        logLastLink: logLastLink,
        getColoredMessage: getColoredMessage,
        getFakePurge: getFakePurge
    };
})();
