/**
 * patterDetector.js
 *
 * Export an API for checking chat messages for links, email addresses, excessive character sequenses etc.
 * Use the $.patternDetector API
 */
(function() {
    var patterns = {
            link: new RegExp('((?:(http|https|Http|Https|rtsp|Rtsp):\\/\\/(?:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\'\\(\\)' + '\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,64}(?:\\:(?:[a-z0-9\\$\\-\\_' + '\\.\\+\\!\\*\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,25})?\\@)?)?' + '((?:(?:[a-z0-9][a-z0-9\\-]{0,64}\\.)+' + '(?:' + '(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])' + '|(?:biz|b[abdefghijmnorstvwyz])' + '|(?:cat|com|coop|c[acdfghiklmnoruvxyz])' + '|d[ejkmoz]' + '|(?:edu|e[cegrstu])' + '|f[ijkmor]' + '|(?:gov|g[abdefghilmnpqrstuwy])' + '|h[kmnrtu]' + '|(?:info|int|i[delmnoqrst])' + '|(?:jobs|j[emop])' + '|k[eghimnrwyz]' + '|l[abcikrstuvy]' + '|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])' + '|(?:name|net|n[acefgilopruz])' + '|(?:org|om)' + '|(?:pro|p[aefghklmnrstwy])' + '|qa' + '|r[eouw]' + '|s[abcdeghijklmnortuvyz]' + '|(?:tel|travel|t[cdfghjklmnoprtvwz])' + '|u[agkmsyz]' + '|v[aceginu]' + '|m[e]' + '|w[fs]' + '|y[etu]' + '|z[amw]))' + '|(?:(?:25[0-5]|2[0-4]' + '[0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\\.(?:25[0-5]|2[0-4][0-9]' + '|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1]' + '[0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}' + '|[1-9][0-9]|[0-9])))' + '(?:\\:\\d{1,5})?)' + '(\\/(?:(?:[a-z0-9\\;\\/\\?\\:\\@\\&\\=\\#\\~' + '\\-\\.\\+\\!\\*\\\'\\(\\)\\,\\_])|(?:\\%[a-fA-F0-9]{2}))*)?' + '(?:\\b|$)' + '|(magnet:|mailto:|ed2k:\/\/|irc:\/\/|ircs:\/\/|skype:|ymsgr:|xfire:|steam:|aim:|spotify:)', 'i'),
            repeatedSeq: /(.)(\1+)/g,
            nonAlphaSeq: /([^a-z0-9 ])(\1+)/ig,
            nonAlphaCount: /([^a-z0-9 ])/ig,
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
            var message = event.getMessage();

            message = deobfuscateLinks(message, (aggressive));

            lastFoundLink = patterns.link.exec(message)[0];
            //$.consoleDebug('>> Matched link on message from ' + event.getSender() + ': ' + lastFoundLink);
            $.log('patternDetector', 'Matched link on message from ' + event.getSender() + ': ' + lastFoundLink);
            return true;
        } catch (e) {
            return false;
        }
    };

    /**
     * @function getLastFoundLink
     * @export $.patternDetector
     * @returns {string}
     */
    function getLastFoundLink() {
        return lastFoundLink;
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
    };

    /**
     * @function getLongestRepeatedSequence
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getLongestRepeatedSequence(event) {
        try {
            var message = (event.getMessage() + ''),
                sequences = message.match(patterns.repeatedSeq);

            sequences.sort(function(a, b) {
                return (a.length < b.length ? 1 : -1);
            });

            return sequences.slice(0, 1)[0].length;
        } catch (e) {
            return 0;
        }
    };

    /**
     * @function getLongestNonLetterSequence
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getLongestNonLetterSequence(event) {
        try {
            var message = (event.getMessage() + ''),
                sequences = message.match(patterns.nonAlphaSeq);

            sequences.sort(function(a, b) {
                return (a.length < b.length ? 1 : -1);
            });

            return sequences.slice(0, 1)[0].length;
        } catch (e) {
            return 0;
        }
    };

    /**
     * @function getNumberOfNonLetters
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getNumberOfNonLetters(event) {
        var message = (event.getMessage() + ''),
            sequences = message.match(patterns.nonAlphaCount);

        try {
            sequences.sort(function(a, b) {
                return (a.length < b.length ? 1 : -1);
            });

            return sequences.length;
        } catch (e) {
            return 0;
        }
    };

    /**
     * @function getNumberOfEmotes
     * @export $.patternDetector
     * @param {Object} event
     * @returns {number}
     */
    function getNumberOfEmotes(event) {
        return $.emotesHandler.getEmotesMatchCount(event.getMessage() + '');
    }

    /** Export functions to API */
    $.patternDetector = {
        hasLinks: hasLinks,
        getLongestRepeatedSequence: getLongestRepeatedSequence,
        getLongestNonLetterSequence: getLongestNonLetterSequence,
        getNumberOfNonLetters: getNumberOfNonLetters,
        getLastFoundLink: getLastFoundLink,
        getNumberOfEmotes: getNumberOfEmotes,
    };
})();
