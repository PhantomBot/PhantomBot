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
 * fixes.js
 *
 * Fixes for missing or malfunctioning Rhino components
 */
(function () {
    /**
     * @function strlen
     * @export $
     * @param {string} str
     * @returns {Number}
     */
    function strlen(str) {
        try {
            return str.length();
        } catch (e) {
            try {
                return str.length;
            } catch (e) {}
        }

        return 0;
    }

    function equalsIgnoreCase(str1, str2) {
        try {
            return str1.equalsIgnoreCase(str2);
        } catch (e) {
            try {
                return str1.toLowerCase() === str2.toLowerCase();
            } catch (e) {}
        }

        return false;
    }

    /**
     * Taken from: https://jsperf.com/replace-vs-split-join-vs-replaceall/95s
     *
     * Implementation of string.replaceAll
     *
     * @function replace
     * @export $
     * @param {string}
     */
    function replace(str, from, to) {
        var idx, parts = [], l = from.length, prev = 0;
        for (; ~(idx = str.indexOf(from, prev)); ) {
            parts.push(str.slice(prev, idx), to);
            prev = idx + l;
        }
        parts.push(str.slice(prev));
        return parts.join('');
    }

    /**
     * Taken from: https://github.com/tc39/proposal-string-matchall
     *
     * Implementation of string.matchAll
     *
     * @function matchAll
     * @export $
     * @param {type} str
     * @param {type} regex
     * @returns {Array}
     */
    function matchAll(str, regex) {
        regex.lastIndex = 0;
        var matches = [];
        str.replace(regex, function () {
            var match = Array.prototype.slice.call(arguments, 0, -2);
            match.input = arguments[arguments.length - 1];
            match.index = arguments[arguments.length - 2];
            matches.push(match);
        });

        return matches;
    }

    function match(str, regex) {
        if (str === undefined || str === null) {
            return ''.match(regex);
        }

        regex.lastIndex = 0;
        return str.match(regex);
    }

    function test(str, regex) {
        regex.lastIndex = 0;
        try {
            return regex.test(str);
        } catch (e) {
            if (e.message.indexOf('Cannot find function test') >= 0) {
                return $.javaString(str).contains(regex);
            } else {
                throw e;
            }
        }
    }

    function regexExec(str, regex) {
        regex.lastIndex = 0;
        return regex.exec(str);
    }

    function javaString(str, def) {
        if (def === undefined) {
            def = null;
        }

        if (str === null || str === undefined) {
            return def;
        }
        try {
            return new Packages.java.lang.String(str);
        } catch (e) {
            return def;
        }
    }

    function jsString(str, def) {
        if (def === undefined) {
            def = null;
        }

        if (str === null || str === undefined) {
            return def;
        }

        try {
            return String('' + str);
        } catch (e) {
            return def;
        }
    }

    const arrMatchStr = String(Array);
    function isJSArray(obj) {
        return obj !== undefined && obj !== null && typeof obj === 'object' && 'constructor' in obj && String(obj.constructor) === arrMatchStr;
    }

    $.strlen = strlen;
    $.equalsIgnoreCase = equalsIgnoreCase;
    $.replace = replace;
    $.matchAll = matchAll;
    $.match = match;
    $.test = test;
    $.regexExec = regexExec;
    $.javaString = javaString;
    $.jsString = jsString;
    $.isJSArray = isJSArray;
})();