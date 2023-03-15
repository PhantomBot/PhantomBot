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
 * argparse.js
 *
 * Argument parsing
 */
(function () {
    function jsArgs(list) {
        if (list === null || list === undefined) {
            return [];
        }

        let args = [];

        try {
            if ($.isJSArray(list)) {
                for (let i in list) {
                    args.push($.jsString(list[i]));
                }
            } else {
                let len = 0;
                try {
                    len = list.size();
                } catch(l1) {
                    try {
                        len = list.length();
                    } catch (l2) {
                        try {
                            len = list.length;
                            if (len === undefined || len === null) {
                                len = 0;
                            }
                        } catch (l3) {}
                    }
                }

                for (let i = 0; i < len; i++) {
                    let val = undefined;
                    try {
                        val = list[i];
                    } catch(l1) {
                        try {
                            val = list.get(i);
                        } catch (l2) {}
                    }

                    args.push($.jsString(val));
                }
            }
        } catch (e) {
            return [];
        }

        return args;
    }

    function duration(str) {
        try {
            let duration = Packages.com.gmt2001.DurationString.from(str);
            if (duration !== Packages.java.time.Duration.ZERO) {
                return duration.toSeconds();
            }
        } catch (e) {}

        try {
            return parseInt(str);
        } catch (e) {}

        return 0;
    }

    /**
     * Parses an argument string into an array
     * @param {string} str input string
     * @param {char} sep separator character. Can be escaped in the input string using backslash (\). Default comma (,)
     * @param {int} limit maximum amount of arguments to produce. -1 for unlimited. After the limit is reached, the remainder of the string is returned as the last argument. Default -1
     * @param {boolean} limitNoEscape If true and limit is > 0, the last argument is treated as a string literal, not parsing the escape characters. Default false
     * @returns {Array} if no arguments were found in str, returns null; else the array of arguments, each converted to a jsString and trimmed
     */
    function parseArgs(str, sep, limit, limitNoEscape) {
        if (str === undefined || str === null) {
            throw 'Invalid str (undefined, null)';
        }

        if (sep === undefined || sep === null || $.jsString(sep).length !== 1) {
            sep = ',';
        }

        if (limit !== undefined && limit !== null && (isNaN(limit) || (limit <= 0 && limit !== -1))) {
            throw 'Invalid limit (NaN or <= 0)';
        } else if (limit === undefined || limit === null) {
            limit = -1;
        }

        if (limitNoEscape === undefined || limitNoEscape === null) {
            limitNoEscape = false;
        }

        var retl = Packages.tv.phantombot.event.command.CommandEvent.parseArgs(str, sep, limit, limitNoEscape);

        var ret = [];

        for (var i = 0; i < retl.size(); i++) {
            ret.push($.jsString(retl.get(i)).trim());
        }

        if (ret.length === 0) {
            return null;
        }

        return ret;
    }

    $.jsArgs = jsArgs;
    $.duration = duration;
    $.parseArgs = parseArgs;
})();