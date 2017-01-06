(function() {
	var link = new RegExp('((?:(http|https|Http|Https|rtsp|Rtsp):\\/\\/(?:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\'\\(\\)'
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
		caps = /([A-Z])/g,
		lastLink = '';

	/**
	 * @function hasLink
	 *
	 * @export $.discord.pattern
	 * @param {String} message
	 * @return {Boolean}
	 */
	function hasLink(message) {
		try {
            lastLink = link.exec(message)[0];
            return true;
        } catch (e) {
            return false;
        }
	}

	/**
	 * @function getCapsCount
	 *
	 * @export $.discord.pattern
	 * @param {String} message
	 * @return {Number}
	 */
	function getCapsCount(message) {
		var sequences = message.match(caps);

        return (sequences === null ? 0 : sequences.length);
	}

	/* Export to the $. API. */
	$.discord.pattern = {
		getCapsCount: getCapsCount,
		hasLink: hasLink
	};
})();