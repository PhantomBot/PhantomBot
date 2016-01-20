/**
 * patterDetector.js
 *
 * Export an API for checking chat messages for links, email addresses, excessive character sequenses etc.
 * Use the $.patternDetector API
 */
(function () {
  var patterns = {
        link: new RegExp('((?:(http|https|Http|Https|rtsp|Rtsp):\\/\\/(?:(?:[a-zA-Z0-9\\$\\-\\_\\.\\+\\!\\*\\\'\\(\\)'
            + '\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,64}(?:\\:(?:[a-zA-Z0-9\\$\\-\\_'
            + '\\.\\+\\!\\*\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,25})?\\@)?)?'
            + '((?:(?:[a-zA-Z0-9][a-zA-Z0-9\\-]{0,64}\\.)+'
            + '(?:'
            + '(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])'
            + '|(?:biz|b[abdefghijmnorstvwyz])'
            + '|(?:cat|com|coop|c[acdfghiklmnoruvxyz])'
            + '|d[ejkmoz]'
            + '|(?:edu|e[cegrstu])'
            + '|f[ijkmor]'
            + '|(?:gov|g[abdefghilmnpqrstuwy])'
            + '|h[kmnrtu]'
            + '|(?:info|int|i[delmnoqrst])'
            + '|(?:jobs|j[emop])'
            + '|k[eghimnrwyz]'
            + '|l[abcikrstuvy]'
            + '|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])'
            + '|(?:name|net|n[acefgilopruz])'
            + '|(?:org|om)'
            + '|(?:pro|p[aefghklmnrstwy])'
            + '|qa'
            + '|r[eouw]'
            + '|s[abcdeghijklmnortuvyz]'
            + '|(?:tel|travel|t[cdfghjklmnoprtvwz])'
            + '|u[agkmsyz]'
            + '|v[aceginu]'
            + '|w[fs]'
            + '|y[etu]'
            + '|z[amw]))'
            + '|(?:(?:25[0-5]|2[0-4]'
            + '[0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\\.(?:25[0-5]|2[0-4][0-9]'
            + '|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1]'
            + '[0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}'
            + '|[1-9][0-9]|[0-9])))'
            + '(?:\\:\\d{1,5})?)'
            + '(\\/(?:(?:[a-zA-Z0-9\\;\\/\\?\\:\\@\\&\\=\\#\\~'
            + '\\-\\.\\+\\!\\*\\\'\\(\\)\\,\\_])|(?:\\%[a-fA-F0-9]{2}))*)?'
            + '(?:\\b|$)', 'ig'),
        email: new RegExp('[a-zA-Z0-9\\+\\.\\_\\%\\-]{1,256}\\@[a-zA-Z0-9][a-zA-Z0-9\\-]{0,64}(\\.[a-zA-Z0-9][a-zA-Z0-9\\-]{0,25})+', 'ig'),
        other: new RegExp('(magnet:|mailto:|ed2k:\/\/|irc:\/\/|ircs:\/\/|skype:|ymsgr:|xfire:|steam:|aim:|spotify:)', 'ig'),
        jUnicodeGrapheme: '(?>\\P{M}\\p{M}+)+',
        jNonLetter: '(\\p{InPhonetic_Extensions}|\\p{InLetterlikeSymbols}|\\p{InDingbats}|\\p{InBoxDrawing}|\\p{InBlockElements}|\\p{InGeometricShapes}|\\p{InHalfwidth_and_Fullwidth_Forms}|[!-/:-@\\[-`{-~])',
        jNonLetterSeq: '(\\p{InPhonetic_Extensions}|\\p{InLetterlikeSymbols}|\\p{InDingbats}|\\p{InBoxDrawing}|\\p{InBlockElements}|\\p{InGeometricShapes}|\\p{InHalfwidth_and_Fullwidth_Forms}|[!-/:-@\\[-`{-~])*',
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
    var message = event.getMessage(),
        result;

    if (!message) {
      return false;
    } else {
      message = deobfuscateLinks(message, (aggressive));
    }

    result = patterns.email.exec(message);
    if (result && result[0] != '') {
      lastFoundLink = result[0];
      $.consoleLn('>> Matched link on email pattern from ' + event.getSender().toLowerCase() + ': ' + lastFoundLink);
      $.log('patternDetector', 'Matched link on email pattern: ' + lastFoundLink);
      return true;
    }

    result = patterns.link.exec(message);
    if (result && result[0] != '') {
      lastFoundLink = result[0];
      $.consoleLn('>> Matched link on link pattern from ' + event.getSender().toLowerCase() + ': ' + lastFoundLink);
      $.log('patternDetector', 'Matched link on link pattern: ' + lastFoundLink);
      return true;
    }

    result = patterns.other.exec(message);
    if (result && result[0] != '') {
      lastFoundLink = result[0];
      $.consoleLn(">> Matched link on other pattern from " + event.getSender().toLowerCase() + ": " + lastFoundLink);
      $.log('patternDetector', 'Matched link on other pattern: ' + lastFoundLink);
      return true;
    }

    return false;
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
    var i,
        s1,
        s2;

    message = (message + '');
    for (i = 0; i < $.strlen(message); i++) {
      if (message.charCodeAt(i) < 32 || message.charCodeAt(i) > 126) {
        s1 = '';
        s2 = '';

        if (i > 0) {
          s1 = message.substring(0, i);
        }

        if (i < $.strlen(message)) {
          s2 = message.substring(i + 1);
        }

        message = s1 + ' ' + s2;
      }
    }

    message.replace(/"/g, '')
        .replace(/--/g, '.')
        .replace(/\[dot]/g, '.')
        .replace(/<dot>/g, '.')
        .replace(/\{dot}/g, '.')
        .replace(/\(dot\)/g, '.');

    if (aggressive) {
      message.replace(/\sdot\s/g, '.')
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
          .replace(/@/g, 'a')
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
    var message = (event.getMessage() + ''),
        ret = 0,
        pattern = /(.+?)\\1+/,
        s1,
        s2;

    while (message.match(pattern)) {
      s1 = message.replace(pattern, '$1');
      s2 = message.replace(pattern, '$2');

      if ($.strlen(s1) > 0 && $.strlen(s2) > 0) {
        if ($.strlen(s1) > $.strlen(s2)) {
          if (($.strlen(s1) / $.strlen(s2)) > 1) {
            ret = Math.max(ret, ($.strlen(s1) / $.strlen(s2)));
          }
        } else {
          if (($.strlen(s2) / $.strlen(s1)) > 1) {
            ret = Math.max(ret, ($.strlen(s2) / $.strlen(s1)));
          }
        }
      }
    }

    return ret;
  };

  /**
   * @function getNumberOfRepeatSequences
   * @export $.patternDetector
   * @param {Object} event
   * @returns {number}
   */
  function getNumberOfRepeatSequences(event) {
    var message = (event.getMessage() + ''),
        ret = 0,
        pattern = /(.+?)\\1+/,
        s1,
        s2;

    while (message.match(pattern)) {
      s1 = message.replace(pattern, '$1');
      s2 = message.replace(pattern, '$2');

      if ($.strlen(s1) > 0 && $.strlen(s2) > 0) {
        if ($.strlen(s1) > $.strlen(s2)) {
          if (($.strlen(s1) / $.strlen(s2)) > 1) {
            ret = ret + ($.strlen(s1) / $.strlen(s2));
          }
        } else {
          if (($.strlen(s2) / $.strlen(s1)) > 1) {
            ret = ret + ($.strlen(s2) / $.strlen(s1));
          }
        }
      }
    }

    return ret;
  };

  /**
   * @function getLongestGraphemeCluster
   * @export $.patternDetector
   * @param {Object} event
   * @returns {number}
   */
  function getLongestGraphemeCluster(event) {
    var message = event.getMessage(),
        m = java.util.regex.Pattern.compile(patterns.jUnicodeGrapheme).matcher(message),
        s1,
        ret = 0;

    while (m.find() == true) {
      s1 = m.group(0);
      ret = Math.max(ret, $.strlen(s1));
    }

    return ret;
  };

  /**
   * @function getNumberOfNonLetters
   * @export $.patternDetector
   * @param {Object} event
   * @returns {number}
   */
  function getNumberOfNonLetters(event) {
    var message = event.getMessage(),
        m = java.util.regex.Pattern.compile(patterns.jNonLetter).matcher(message),
        s1,
        ret = 0;

    while (m.find() == true) {
      s1 = m.group(0);
      if ($.strlen(s1) > 0) {
        ret++;
      }
    }

    return ret;
  };

  /**
   * @function getLongestNonLetterSequence
   * @export $.patternDetector
   * @param {Object} event
   * @returns {number}
   */
  function getLongestNonLetterSequence(event) {
    var message = event.getMessage(),
        m = java.util.regex.Pattern.compile(patterns.jNonLetterSeq).matcher(message),
        s1,
        ret = 0;

    while (m.find() == true) {
      s1 = m.group(0);
      while (m.find() == true) {
        s1 = m.group(0);
        ret = Math.max(ret, $.strlen(s1));
      }
    }

    return ret;
  };

  /** Export functions to API */
  $.patternDetector = {
    hasLinks: hasLinks,
    getLongestNonLetterSequence: getLongestNonLetterSequence,
    getLongestRepeatedSequence: getLongestRepeatedSequence,
    getLongestGraphemeCluster: getLongestGraphemeCluster,
    getNumberOfNonLetters: getNumberOfNonLetters,
    getNumberOfRepeatSequences: getNumberOfRepeatSequences,
    getLastFoundLink: getLastFoundLink,
  };
})();