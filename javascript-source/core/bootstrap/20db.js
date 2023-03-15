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
 * db.js
 *
 * Extra DB fubctions
 */
(function () {
    /**
     * @function getIniDbBoolean
     * @export $
     * @param {string} fileName
     * @param {string|Number} key
     * @param {boolean} [defaultValue]
     * @returns {boolean}
     */
    function getIniDbBoolean(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return $.inidb.GetBoolean(fileName, '', key);
        } else {
            return (defaultValue);
        }
    }

    /**
     * @function getSetIniDbBoolean
     * @export $
     * @param {string} fileName
     * @param {string|Number} key
     * @param {boolean} [defaultValue]
     * @returns {boolean}
     */
    function getSetIniDbBoolean(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return $.inidb.GetBoolean(fileName, '', key);
        } else {
            $.inidb.set(fileName, key, defaultValue.toString());
            return (defaultValue);
        }
    }


    /**
     * @function setIniDbBoolean
     * @export $
     * @param {string} fileName
     * @param {string|Number} key
     * @param {boolean} state
     */
    function setIniDbBoolean(fileName, key, state) {
        $.inidb.set(fileName, key, state.toString());
    }

    /**
     * @function getIniDbString
     * @export $
     * @param {string}
     * @param {string}
     * @param {string}
     */
    function getIniDbString(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return ($.inidb.get(fileName, key) + '');
        } else {
            return (defaultValue);
        }
    }

    /**
     * @function getSetIniDbString
     * @export $
     * @param {string}
     * @param {string}
     * @param {string}
     */
    function getSetIniDbString(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return ($.inidb.get(fileName, key) + '');
        } else {
            $.inidb.set(fileName, key, defaultValue);
            return (defaultValue);
        }
    }

    /**
     * @function setIniDbString
     * @export $
     * @param {string}
     * @param {string}
     * @param {string}
     */
    function setIniDbString(fileName, key, value) {
        $.inidb.set(fileName, key, value);
    }

    /**
     * @function getIniDbNumber
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getIniDbNumber(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return parseInt($.inidb.get(fileName, key));
        } else {
            return defaultValue;
        }
    }

    /**
     * @function getSetIniDbNumber
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getSetIniDbNumber(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return parseInt($.inidb.get(fileName, key));
        } else {
            $.inidb.set(fileName, key, defaultValue.toString());
            return defaultValue;
        }
    }

    /**
     * @function setIniDbNumber
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function setIniDbNumber(fileName, key, value) {
        $.inidb.set(fileName, key, value.toString());
    }

    /**
     * @function getIniDbFloat
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getIniDbFloat(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return parseFloat($.inidb.get(fileName, key));
        } else {
            return defaultValue;
        }
    }

    /**
     * @function getSetIniDbFloat
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getSetIniDbFloat(fileName, key, defaultValue) {
        if ($.inidb.exists(fileName, key) === true) {
            return parseFloat($.inidb.get(fileName, key));
        } else {
            $.inidb.set(fileName, key, defaultValue.toString());
            return defaultValue;
        }
    }

    /**
     * @function setIniDbFloat
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function setIniDbFloat(fileName, key, value) {
        $.inidb.set(fileName, key, value.toString());
    }

    /**
     * Executes an SQL query.
     *
     * The query is executed using a PreparedStatement with calls to `PreparedStatement#setString(int, String)`
     *
     * For example:
     * ```js
     * $.sql('SELECT * FROM foo WHERE bar = ?', ['baz'])
     * ```
     *
     * The value `'baz'` is escaped to prevent SQL injection, then inserted in place of the `?`
     *
     * This yields the final query of:
     * ```sql
     * SELECT * FROM foo WHERE bar = 'baz'
     * ```
     *
     * You can use `?` as many times as necessary, but must provide the same number of elements in the replacements array for the replacement to work
     *
     * Replacements are performed in order from left to right
     *
     * Exceptions from failed SQL queries are NOT returned or thrown, but are logged in the core-error log
     *
     * The returned array is of the form:
     * ```js
     * arr[row][column] = $.jsString(value);
     * ```
     *
     * NOTE: Only DQL statements have a return value; all other statements return an empty array `[]`
     *
     * @param {string} query The query to execute
     * @param {string[]} replacements Replacements for `PreparedStatement#setString(int, String)`
     * @returns {string[][]} An array of data as strings representing the result set, if the query was a DQL statement;
     * an empty array otherwise. The outer array represents rows; the inner array represents columns;
     * the values of the inner array represent the value of the row-column pair at that index as a js string
     */
    function sql(query, replacements) {
        let result = $.inidb.query(query, replacements);

        let ret = [];

        if (result.size() > 0) {
            for (let r = 0; r < result.size(); r++) {
                let jrow = result.get(r);
                let row = [];

                if (jrow.size() > 0) {
                    for (let c = 0; c < jrow.size(); c++) {
                        row.push($.jsString(jrow.get(c)));
                    }
                }

                ret.push(row);
            }
        }

        return ret;
    }

    $.getIniDbBoolean = getIniDbBoolean;
    $.getIniDbString = getIniDbString;
    $.getIniDbNumber = getIniDbNumber;
    $.getIniDbFloat = getIniDbFloat;
    $.getSetIniDbBoolean = getSetIniDbBoolean;
    $.getSetIniDbString = getSetIniDbString;
    $.getSetIniDbNumber = getSetIniDbNumber;
    $.getSetIniDbFloat = getSetIniDbFloat;
    $.setIniDbBoolean = setIniDbBoolean;
    $.setIniDbString = setIniDbString;
    $.setIniDbNumber = setIniDbNumber;
    $.setIniDbFloat = setIniDbFloat;
    $.sql = sql;
})();