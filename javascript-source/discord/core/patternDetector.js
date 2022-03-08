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
    var link = new RegExp('((?:(http|https|Http|Https|rtsp|Rtsp):\\/\\/(?:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\'\\(\\)' + '\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,64}(?:\\:(?:[a-z0-9\\$\\-\\_' + '\\.\\+\\!\\*\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,25})?\\@)?)?' + '((?:(?:[a-z0-9][a-z0-9\\-]{0,64}\\.)+' + '(?:' + '(?:aero|arpa|app|a[cdefgilmnoqrstuwxz])' + '|(?:biz|bar|best|bingo|bot|b[abdefghijmnorstvwyz])' + '|(?:cat|com|coop|cash|chat|codes|cool|c[acdfghiklmnoruvxyz])' + '|d[ejkmoz]' + '|(?:edu|e[cegrstu])' + '|(?:fyi|f[ijkmor])' + '|(?:gov|g[abdefghilmnpqrstuwy])' + '|(?:how|h[kmnrtu])' + '|(?:info|int|i[delmnoqrst])' + '|(?:jobs|j[emop])' + '|k[eghimnrwyz]' + '|l[abcikrstuvy]' + '|(?:mil|mobi|moe|m[acdeghklmnopqrstuvwxyz])' + '|(?:name|net|n[acefgilopruz])' + '|(?:org|om)' + '|(?:pro|p[aefghklmnrstwy])' + '|qa' + '|(?:rodeo|rocks|r[eouw])' + '|(?:stream|support|sale|s[abcdeghijklmnortuvyz])' + '|(?:tel|travel|top|t[cdfghjklmnoprtvwz])' + '|u[agkmsyz]' + '|(?:vote|video|v[aceginu])' + '|(?:xxx)' + '|(?:watch|w[fs])' + '|y[etu]' + '|z[amw]))' + '|(?:(?:25[0-5]|2[0-4]' + '[0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\\.(?:25[0-5]|2[0-4][0-9]' + '|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1]' + '[0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}' + '|[1-9][0-9]|[0-9])))' + '(?:\\:\\d{1,5})?)' + '(\\/(?:(?:[a-z0-9\\;\\/\\?\\:\\@\\&\\=\\#\\~' + '\\-\\.\\+\\!\\*\\\'\\(\\)\\,\\_])|(?:\\%[a-fA-F0-9]{2}))*)?' + '(?:\\b|$)' + '|(\\.[a-z]+\\/|magnet:\/\/|mailto:\/\/|ed2k:\/\/|irc:\/\/|ircs:\/\/|skype:\/\/|ymsgr:\/\/|xfire:\/\/|steam:\/\/|aim:\/\/|spotify:\/\/)', 'i'),
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
